param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$gameRoot = $PSScriptRoot
$gameUrl = 'http://127.0.0.1:8837'
function Read-GameHealth {
  try { return Invoke-RestMethod -Uri "$gameUrl/api/health" -TimeoutSec 2 } catch { return $null }
}
$health = Read-GameHealth
if ($health -and ($health.app -ne 'sovereigns-at-war' -or $health.root -ne $gameRoot)) { throw 'Port 8837 belongs to another app or game copy. Close that listener before launching this copy.' }
if (-not $health) {
  $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $nodeCommand) { throw 'Node.js is required for local campaign saves. You can open index.html directly and use text export/import; this launcher does not install software.' }
  $logDir = Join-Path $gameRoot 'logs'
  New-Item -ItemType Directory -Path $logDir -Force | Out-Null
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
  $outLog = Join-Path $logDir "$stamp-server.log"
  $errLog = Join-Path $logDir "$stamp-server-error.log"
  $serverFile = Join-Path $gameRoot 'server.cjs'
  Start-Process -FilePath $nodeCommand.Source -ArgumentList @('"' + $serverFile + '"') -WorkingDirectory $gameRoot -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog | Out-Null
  for ($attempt = 0; $attempt -lt 24; $attempt++) {
    Start-Sleep -Milliseconds 250
    $health = Read-GameHealth
    if ($health) { break }
  }
  if (-not $health -or $health.app -ne 'sovereigns-at-war' -or $health.root -ne $gameRoot) { throw "The game did not start. Check the project logs folder: $logDir" }
}
if (-not $NoBrowser) { Start-Process "$gameUrl/" }
Write-Output "Sovereigns at War is ready at $gameUrl/"
