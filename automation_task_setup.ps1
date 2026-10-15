$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "automation_credentials.ps1")

function ConvertTo-PlainText {
  param([Security.SecureString]$Value)
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

$hpoUsername = "le.thanh-nhan3"
$recipient = "lethanhnhancantho65@gmail.com"
$credentialTargetHpo = "Batch41\NhanAutomation\Hpo"
$credentialTargetGmail = "Batch41\NhanAutomation\Gmail"

Write-Host "Cấu hình gửi báo cáo lúc 18:30 mỗi ngày theo giờ Việt Nam."
Write-Host "Bí mật được lưu trong Windows Credential Manager, không ghi vào mã nguồn."
Write-Host "Nhập mật khẩu HPO hiện tại (không nhập mật khẩu đã chia sẻ trong cuộc trò chuyện nếu bạn đã đổi mật khẩu)."
$hpoSecurePassword = Read-Host "Mật khẩu HPO của $hpoUsername" -AsSecureString
$hpoPassword = ConvertTo-PlainText $hpoSecurePassword

$gmailUsername = (Read-Host "Địa chỉ Gmail dùng để gửi báo cáo tới $recipient").Trim()
if ($gmailUsername -notmatch "^[^@\s]+@[^@\s]+\.[^@\s]+$") {
  throw "Địa chỉ Gmail không hợp lệ."
}

Write-Host "Tạo Google App Password trong tài khoản Gmail và nhập mã đó bên dưới."
$gmailSecurePassword = Read-Host "Google App Password" -AsSecureString
$gmailPassword = ConvertTo-PlainText $gmailSecurePassword
if ([string]::IsNullOrWhiteSpace($hpoPassword) -or [string]::IsNullOrWhiteSpace($gmailPassword)) {
  throw "Mật khẩu không được để trống."
}

try {
  [Batch41CredentialStore]::Save($credentialTargetHpo, $hpoUsername, $hpoPassword)
  [Batch41CredentialStore]::Save($credentialTargetGmail, $gmailUsername, $gmailPassword)
} finally {
  $hpoPassword = $null
  $gmailPassword = $null
  $hpoSecurePassword.Dispose()
  $gmailSecurePassword.Dispose()
}

$workerPath = Join-Path $PSScriptRoot "automation_task_worker.ps1"
$powershellPath = Join-Path $PSHOME "powershell.exe"
$startBoundary = (Get-Date).Date.AddDays(1).ToString("s")
$userSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$escapedPowerShell = [Security.SecurityElement]::Escape($powershellPath)
$escapedWorker = [Security.SecurityElement]::Escape($workerPath)
$taskXml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Gửi báo cáo doanh số Nhân lúc 18:30 giờ Việt Nam.</Description>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
    </LogonTrigger>
    <CalendarTrigger>
      <StartBoundary>$startBoundary</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>$userSid</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RestartOnFailure><Interval>PT1M</Interval><Count>3</Count></RestartOnFailure>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>$escapedPowerShell</Command>
      <Arguments>-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "$escapedWorker"</Arguments>
      <WorkingDirectory>$([Security.SecurityElement]::Escape($PSScriptRoot))</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@

Register-ScheduledTask `
  -TaskName "Batch41-Nhan-Daily-Sales-Email" `
  -Xml $taskXml `
  -Force | Out-Null
Start-ScheduledTask -TaskName "Batch41-Nhan-Daily-Sales-Email"

Write-Host "Đã lưu thông tin đăng nhập và bật tác vụ gửi báo cáo mỗi ngày lúc 18:30 giờ Việt Nam."
Write-Host "Windows user $env:USERNAME phải đăng nhập; máy cần kết nối Internet."
Write-Host "Để gửi báo cáo thử ngay, chạy tác vụ 'Send Nhân sales report now' trong VS Code."
