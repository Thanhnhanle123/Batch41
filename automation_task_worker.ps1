param(
  [switch]$SendNow
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "automation_credentials.ps1")
Add-Type -AssemblyName System.Net.Http

$recipient = "lethanhnhancantho65@gmail.com"
$hpoCredentialTarget = "Batch41\NhanAutomation\Hpo"
$gmailCredentialTarget = "Batch41\NhanAutomation\Gmail"
$vietnamTimeZone = [TimeZoneInfo]::FindSystemTimeZoneById("SE Asia Standard Time")
$stateDirectory = Join-Path $env:LOCALAPPDATA "Batch41\NhanAutomation"
$stateFile = Join-Path $stateDirectory "last-sent-date.txt"
$logFile = Join-Path $stateDirectory "automation.log"

New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null

function Write-AutomationLog {
  param([string]$Message)
  $line = "{0} {1}" -f [DateTimeOffset]::UtcNow.ToString("o"), $Message
  Add-Content -LiteralPath $logFile -Value $line -Encoding UTF8
  Write-Host $line
}

function Send-DailySalesReport {
  param([DateTimeOffset]$ReportTime)

  $hpoCredential = [Batch41CredentialStore]::Load($hpoCredentialTarget)
  $gmailCredential = [Batch41CredentialStore]::Load($gmailCredentialTarget)
  if (-not $hpoCredential[0] -or -not $hpoCredential[1]) {
    throw "HPO login credential is incomplete. Run the setup task again."
  }
  if (-not $gmailCredential[0] -or -not $gmailCredential[1]) {
    throw "Gmail credential is incomplete. Run the setup task again."
  }

  $client = [System.Net.Http.HttpClient]::new()
  try {
    $loginPayload = @{
      username = $hpoCredential[0]
      password = $hpoCredential[1]
    } | ConvertTo-Json -Compress
    $loginContent = [System.Net.Http.StringContent]::new(
      $loginPayload,
      [System.Text.Encoding]::UTF8,
      "application/json"
    )
    try {
      $loginResponse = $client.PostAsync(
        "https://hpo.hdsaison.com.vn/hpo/api/v1/login",
        $loginContent
      ).GetAwaiter().GetResult()
    } finally {
      $loginContent.Dispose()
    }
    try {
      if (-not $loginResponse.IsSuccessStatusCode) {
        throw "HPO login failed with HTTP $([int]$loginResponse.StatusCode)."
      }
      $loginBody = $loginResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult() |
        ConvertFrom-Json
    } finally {
      $loginResponse.Dispose()
    }

    $token = $loginBody.accessToken
    if (-not $token) { $token = $loginBody.token }
    if (-not $token -and $loginBody.data) { $token = $loginBody.data.accessToken }
    if (-not $token -and $loginBody.data) { $token = $loginBody.data.token }

    $userId = $loginBody.user.id
    if (-not $userId) { $userId = $loginBody.user.userId }
    if (-not $userId) { $userId = $loginBody.data.user.id }
    if (-not $userId) { $userId = $loginBody.data.user.userId }
    if (-not $userId) { $userId = $loginBody.data.id }
    if (-not $userId) { $userId = $loginBody.data.userId }
    if (-not $userId) { $userId = $loginBody.id }
    if (-not $userId) { $userId = $loginBody.userId }
    if (-not $token -or -not $userId) {
      throw "HPO login response did not include an access token and user ID."
    }

    $apiDate = $ReportTime.ToString("dd-MM-yyyy")
    $encodedDate = [Uri]::EscapeDataString($apiDate)
    $encodedUserId = [Uri]::EscapeDataString([string]$userId)
    $contractsUrl = "https://hpo.hdsaison.com.vn/hpo/api/v1/contracts/usercreated/$encodedUserId?page=0&size=1000&sort=created_date,desc&statusCodes=WAIT_FOR_CHECKING_DISBURSEMENT_STATUS-APPROVED_HARD_COPY_STATUS-REJECT_STATUS-AMEND_STATUS-APPROVE_DISBURSEMENT_STATUS&fromDate=$encodedDate&toDate=$encodedDate&contractNumber="
    $client.DefaultRequestHeaders.Authorization =
      [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", [string]$token)
    $contractsResponse = $client.GetAsync($contractsUrl).GetAwaiter().GetResult()
    try {
      if (-not $contractsResponse.IsSuccessStatusCode) {
        throw "HPO contracts request failed with HTTP $([int]$contractsResponse.StatusCode)."
      }
      $contractsBody = $contractsResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult() |
        ConvertFrom-Json
    } finally {
      $contractsResponse.Dispose()
    }

    if ($contractsBody.PSObject.Properties.Name -contains "contracts") {
      $contracts = @($contractsBody.contracts)
    } elseif ($contractsBody.PSObject.Properties.Name -contains "content") {
      $contracts = @($contractsBody.content)
    } elseif ($contractsBody -is [array]) {
      $contracts = $contractsBody
    } else {
      throw "HPO contracts response did not contain a contracts array."
    }

    $totals = @{
      MC = [ordered]@{ Contracts = 0; Approved = 0; Rejected = 0; Amount = [decimal]0; Insurance = 0 }
      DL = [ordered]@{ Contracts = 0; Approved = 0; Rejected = 0; Amount = [decimal]0; Insurance = 0 }
    }
    $cardCount = 0
    $cardLimit = [decimal]0

    foreach ($contract in $contracts) {
      if (-not $contract.number) {
        throw "A contract in the HPO response has no contract number; the report was not sent."
      }
      $number = [Uri]::EscapeDataString([string]$contract.number)
      $detailsResponse = $client.GetAsync(
        "https://hpo.hdsaison.com.vn/hpo/api/v1/contracts/contractnumber/$number"
      ).GetAwaiter().GetResult()
      try {
        if (-not $detailsResponse.IsSuccessStatusCode) {
          throw "HPO details request failed for one contract (HTTP $([int]$detailsResponse.StatusCode)); the report was not sent."
        }
        $detailsText = $detailsResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult()
      } finally {
        $detailsResponse.Dispose()
      }
      if (-not $detailsText) {
        throw "HPO returned empty contract details; the report was not sent."
      }
      $details = $detailsText | ConvertFrom-Json
      $type = $details.type
      if (-not $type) { $type = $contract.type }
      if ($type -ne "2W" -and $type -ne "DL") { continue }

      $groupName = if ($type -eq "2W") { "MC" } else { "DL" }
      $group = $totals[$groupName]
      $status = [string]$details.status
      if (-not $status) { $status = [string]$contract.status }
      $amountValue = $details.financedAmount
      if ($null -eq $amountValue) { $amountValue = $contract.financedAmount }
      $amount = [decimal]0
      if ($null -ne $amountValue -and -not [decimal]::TryParse(
        [string]$amountValue,
        [Globalization.NumberStyles]::Any,
        [Globalization.CultureInfo]::InvariantCulture,
        [ref]$amount
      )) {
        throw "HPO returned an invalid contract amount; the report was not sent."
      }
      $posScheme = $details.submittedPosScheme
      if (-not $posScheme) { $posScheme = $contract.submittedPosScheme }

      $group.Contracts++
      if ($status.Contains("REJECT")) {
        $group.Rejected++
      } elseif ($status.Contains("APPROVE")) {
        $group.Approved++
        $group.Amount += $amount
        if ($null -ne $posScheme.schemeLiCode) { $group.Insurance++ }

        if ($type -eq "DL") {
          $limit = [decimal]0
          if ($null -ne $details.cardCreditLimit -and -not [decimal]::TryParse(
            [string]$details.cardCreditLimit,
            [Globalization.NumberStyles]::Any,
            [Globalization.CultureInfo]::InvariantCulture,
            [ref]$limit
          )) {
            throw "HPO returned an invalid card limit; the report was not sent."
          }
          if ($limit -gt 0) {
            $cardCount++
            $cardLimit += $limit
          }
        }
      }
    }

    $culture = [Globalization.CultureInfo]::GetCultureInfo("vi-VN")
    $totalAmount = $totals.MC.Amount + $totals.DL.Amount
    $body = @"
BÁO CÁO DOANH SỐ NHÂN — $($ReportTime.ToString("dd/MM/yyyy"))

MC (2W)
Hồ sơ: $($totals.MC.Contracts)
Duyệt: $($totals.MC.Approved)
Rớt: $($totals.MC.Rejected)
Doanh số duyệt: $($totals.MC.Amount.ToString("N0", $culture))
BHKV: $($totals.MC.Insurance)

DL
Hồ sơ: $($totals.DL.Contracts)
Duyệt: $($totals.DL.Approved)
Rớt: $($totals.DL.Rejected)
Doanh số duyệt: $($totals.DL.Amount.ToString("N0", $culture))
BHKV: $($totals.DL.Insurance)

Thẻ được duyệt: $cardCount
Hạn mức thẻ: $($cardLimit.ToString("N0", $culture))
TỔNG DOANH SỐ DUYỆT: $($totalAmount.ToString("N0", $culture))

Báo cáo tổng hợp tự động; không bao gồm thông tin khách hàng.
"@

    $message = [System.Net.Mail.MailMessage]::new()
    $smtp = [System.Net.Mail.SmtpClient]::new("smtp.gmail.com", 587)
    try {
      $message.From = [System.Net.Mail.MailAddress]::new([string]$gmailCredential[0])
      $message.To.Add($recipient)
      $message.Subject = "Báo cáo doanh số Nhân - $($ReportTime.ToString("dd/MM/yyyy"))"
      $message.SubjectEncoding = [System.Text.Encoding]::UTF8
      $message.Body = $body
      $message.BodyEncoding = [System.Text.Encoding]::UTF8
      $smtp.EnableSsl = $true
      $smtp.DeliveryMethod = [System.Net.Mail.SmtpDeliveryMethod]::Network
      $smtp.Timeout = 30000
      $smtp.Credentials = [System.Net.NetworkCredential]::new(
        [string]$gmailCredential[0],
        ([string]$gmailCredential[1] -replace "\s", "")
      )
      $smtp.Send($message)
    } finally {
      $smtp.Dispose()
      $message.Dispose()
    }
  } finally {
    $client.Dispose()
  }
}

if ($SendNow) {
  $reportTime = [TimeZoneInfo]::ConvertTime([DateTimeOffset]::UtcNow, $vietnamTimeZone)
  $mutex = [System.Threading.Mutex]::new($false, "Local\Batch41NhanAutomationDaily")
  $hasMutex = $false
  try {
    $hasMutex = $mutex.WaitOne(0)
    if (-not $hasMutex) {
      throw "Another report is already being sent."
    }
    Send-DailySalesReport $reportTime
    Write-AutomationLog "Report for $($reportTime.ToString('yyyy-MM-dd')) sent to $recipient."
  } finally {
    if ($hasMutex) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
  }
  exit 0
}

while ($true) {
  $reportTime = [TimeZoneInfo]::ConvertTime([DateTimeOffset]::UtcNow, $vietnamTimeZone)
  $reportDate = $reportTime.ToString("yyyy-MM-dd")
  $isPastSendTime = $reportTime.Hour -gt 18 -or
    ($reportTime.Hour -eq 18 -and $reportTime.Minute -ge 30)
  $alreadySent = (Test-Path -LiteralPath $stateFile) -and
    (Get-Content -LiteralPath $stateFile -Raw).Trim() -eq $reportDate

  if ($isPastSendTime -and -not $alreadySent) {
    $mutex = [System.Threading.Mutex]::new($false, "Local\Batch41NhanAutomationDaily")
    $hasMutex = $false
    try {
      $hasMutex = $mutex.WaitOne(0)
      if ($hasMutex) {
        Send-DailySalesReport $reportTime
        Set-Content -LiteralPath $stateFile -Value $reportDate -Encoding ASCII
        Write-AutomationLog "Report for $reportDate sent to $recipient."
      }
    } catch {
      Write-AutomationLog ("ERROR: " + $_.Exception.Message)
    } finally {
      if ($hasMutex) { $mutex.ReleaseMutex() }
      $mutex.Dispose()
    }
  }

  $sleepSeconds = [Math]::Max(1, 60 - $reportTime.Second)
  Start-Sleep -Seconds $sleepSeconds
}
