param(
  [switch]$FullReset,
  [switch]$Rebuild,
  [switch]$DryRun,
  [int]$HealthRetries = 20,
  [int]$RetryDelaySeconds = 3
)

$ErrorActionPreference = "Stop"

function Invoke-Compose {
  param([string[]]$ComposeArgs)

  $cmdText = "docker compose " + ($ComposeArgs -join " ")
  Write-Host "> $cmdText"

  if ($DryRun) {
    return
  }

  & docker compose @ComposeArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $cmdText"
  }
}

Write-Host "Starting PARIVESH demo environment reset..."

$downArgs = @("down", "--remove-orphans")
if ($FullReset) {
  $downArgs += "-v"
}
Invoke-Compose -ComposeArgs $downArgs

if ($Rebuild) {
  Invoke-Compose -ComposeArgs @("build", "--no-cache")
}

Invoke-Compose -ComposeArgs @("up", "-d")

if ($DryRun) {
  Write-Host "Dry run completed. No changes were applied."
  exit 0
}

$healthScript = Join-Path $PSScriptRoot "demo-health-check.ps1"
if (-not (Test-Path $healthScript)) {
  throw "Health script not found at $healthScript"
}

$healthy = $false
for ($i = 1; $i -le $HealthRetries; $i++) {
  try {
    Write-Host "Health check attempt $i/$HealthRetries..."
    & powershell -ExecutionPolicy Bypass -File $healthScript
    if ($LASTEXITCODE -eq 0) {
      $healthy = $true
      break
    }
  } catch {
    Write-Host "Health check attempt failed. Retrying in $RetryDelaySeconds seconds..."
  }

  Start-Sleep -Seconds $RetryDelaySeconds
}

if (-not $healthy) {
  throw "Services did not become healthy in time."
}

if ($FullReset) {
  Write-Host "Full reset completed. Fresh demo data and seeded users are ready."
} else {
  Write-Host "Reset completed. Use -FullReset if you need a clean seeded database state."
}

exit 0
