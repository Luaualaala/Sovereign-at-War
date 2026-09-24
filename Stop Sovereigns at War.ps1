$ErrorActionPreference = 'Stop'
$expectedRoot = $PSScriptRoot
try { $health = Invoke-RestMethod 'http://127.0.0.1:8837/api/health' -TimeoutSec 2 } catch { Write-Output 'The game server is already stopped.'; exit 0 }
if ($health.app -ne 'sovereigns-at-war' -or $health.root -ne $expectedRoot) { throw 'The listener belongs to another application or game copy. It was left running.' }
$listener = Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort 8837 -State Listen -ErrorAction Stop
$gameProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
if ($gameProcess.Name -ne 'node.exe' -or $gameProcess.CommandLine -notlike '*server.cjs*' -or $gameProcess.CommandLine -notlike "*$expectedRoot*") { throw 'Could not independently verify the game process. It was left running.' }
& taskkill.exe /PID $gameProcess.ProcessId /F
if ($LASTEXITCODE -ne 0) { throw 'The verified game process could not be stopped.' }
Write-Output 'Sovereigns at War server stopped. Campaign save revisions remain in the project.'
