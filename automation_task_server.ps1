$ErrorActionPreference = "Stop"

$credentialStorePath = Join-Path $PSScriptRoot "automation_credentials.ps1"
. $credentialStorePath

$root = (Resolve-Path $PSScriptRoot).Path
$workerPath = Join-Path $root "automation_task_worker.ps1"
$manualSendDirectory = Join-Path $env:LOCALAPPDATA "Batch41\NhanAutomation\manual-send"
$routes = @{
  "/" = "automation_task.html"
  "/automation_task.html" = "automation_task.html"
  "/data/day_llv.json" = "data/day_llv.json"
  "/assets/js/batch41-common.js" = "assets/js/batch41-common.js"
  "/assets/css/batch41-ui.css" = "assets/css/batch41-ui.css"
}
$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
}
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:4173/")
$listener.Start()
Write-Output "Nhân automation: http://127.0.0.1:4173/automation_task.html"

function Write-JsonResponse {
  param(
    [System.Net.HttpListenerResponse]$Response,
    [int]$StatusCode,
    [string]$Message
  )

  $payload = @{ message = $Message } | ConvertTo-Json -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
  $Response.StatusCode = $StatusCode
  $Response.ContentType = "application/json; charset=utf-8"
  $Response.Headers["Cache-Control"] = "no-store"
  $Response.Headers["X-Content-Type-Options"] = "nosniff"
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
      if ($context.Request.Url.Host -ne "127.0.0.1") {
        $context.Response.StatusCode = 403
      } elseif ($context.Request.HttpMethod -eq "POST" -and
          $context.Request.Url.AbsolutePath -eq "/send-email") {
        if ($context.Request.Headers["Origin"] -ne "http://127.0.0.1:4173") {
          Write-JsonResponse $context.Response 403 "Yêu cầu gửi email không hợp lệ."
        } else {
          try {
            foreach ($credentialTarget in @(
              "Batch41\NhanAutomation\Hpo",
              "Batch41\NhanAutomation\Gmail"
            )) {
              try {
                $credential = [Batch41CredentialStore]::Load($credentialTarget)
              } catch [System.ComponentModel.Win32Exception] {
                if ($_.Exception.NativeErrorCode -eq 1168) {
                  Write-JsonResponse $context.Response 409 "Chưa cài đặt thông tin đăng nhập. Trong VS Code, nhấn Ctrl+Shift+P, chọn Tasks: Run Task, rồi chạy Setup Nhan daily sales email. Sau khi cài đặt xong, bấm nút gửi lại."
                  break
                }
                throw
              }
              if (-not $credential[0] -or -not $credential[1]) {
                Write-JsonResponse $context.Response 409 "Thông tin đăng nhập chưa đầy đủ. Chạy lại Setup Nhan daily sales email trong VS Code."
                break
              }
            }
            if ($context.Response.StatusCode -eq 200) {
              New-Item -ItemType Directory -Path $manualSendDirectory -Force | Out-Null
              $runId = [Guid]::NewGuid().ToString("N")
              $stdoutPath = Join-Path $manualSendDirectory "$runId.out"
              $stderrPath = Join-Path $manualSendDirectory "$runId.err"
              try {
                $process = Start-Process `
                  -FilePath (Join-Path $PSHOME "powershell.exe") `
                  -ArgumentList @(
                    "-NoProfile",
                    "-WindowStyle",
                    "Hidden",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-File",
                    "`"$workerPath`"",
                    "-SendNow"
                  ) `
                  -WorkingDirectory $root `
                  -RedirectStandardOutput $stdoutPath `
                  -RedirectStandardError $stderrPath `
                  -PassThru `
                  -Wait

                if ($process.ExitCode -eq 0) {
                  Write-JsonResponse $context.Response 200 "Đã gửi báo cáo đến lethanhnhancantho65@gmail.com."
                } else {
                  Write-JsonResponse $context.Response 500 "Gửi email thất bại. Kiểm tra cấu hình HPO/Gmail và nhật ký tại %LOCALAPPDATA%\Batch41\NhanAutomation\automation.log."
                }
              } finally {
                foreach ($outputPath in @($stdoutPath, $stderrPath)) {
                  if (Test-Path -LiteralPath $outputPath) {
                    Remove-Item -LiteralPath $outputPath -Force
                  }
                }
              }
            }
          } catch {
            Write-JsonResponse $context.Response 500 "Không thể kiểm tra cấu hình gửi email. Hãy chạy lại tác vụ Setup Nhan daily sales email."
          }
        }
      } elseif ($context.Request.HttpMethod -ne "GET") {
        $context.Response.StatusCode = 405
      } else {
        $route = $context.Request.Url.AbsolutePath
        if (-not $routes.ContainsKey($route)) {
          $context.Response.StatusCode = 404
        } else {
          $filePath = Join-Path $root $routes[$route]
          $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
          $context.Response.ContentType = $contentTypes[$extension]
          $context.Response.Headers["X-Content-Type-Options"] = "nosniff"
          $context.Response.Headers["Cache-Control"] = "no-store"
          $bytes = [System.IO.File]::ReadAllBytes($filePath)
          $context.Response.ContentLength64 = $bytes.Length
          $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
      }
    } catch {
      $context.Response.StatusCode = 500
    } finally {
      $context.Response.Close()
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
