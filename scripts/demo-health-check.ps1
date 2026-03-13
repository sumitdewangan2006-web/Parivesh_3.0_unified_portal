$ErrorActionPreference = "Stop"

$frontendUrl = "http://localhost:3000"
$backendHealthUrl = "http://localhost:5000/api/health"

Write-Host "Checking frontend at $frontendUrl ..."
try {
  $frontendResponse = Invoke-WebRequest -Uri $frontendUrl -Method Get -UseBasicParsing -TimeoutSec 10
  if ($frontendResponse.StatusCode -ge 200 -and $frontendResponse.StatusCode -lt 400) {
    Write-Host "Frontend OK ($($frontendResponse.StatusCode))"
  } else {
    throw "Frontend returned unexpected status code $($frontendResponse.StatusCode)"
  }
} catch {
  Write-Error "Frontend check failed: $($_.Exception.Message)"
  exit 1
}

Write-Host "Checking backend health at $backendHealthUrl ..."
try {
  $healthResponse = Invoke-RestMethod -Uri $backendHealthUrl -Method Get -TimeoutSec 10
  if ($healthResponse.status -eq "OK") {
    Write-Host "Backend health OK"
  } else {
    throw "Backend health payload missing expected status=OK"
  }
} catch {
  Write-Error "Backend health check failed: $($_.Exception.Message)"
  exit 1
}

Write-Host "Demo health-check passed."
exit 0
