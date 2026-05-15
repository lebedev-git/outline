param(
  [string]$Tag = "outline-ai-search:2026-05-15",
  [string]$PortainerUrl = "https://100.116.27.128:9443",
  [int]$EndpointId = 6,
  [string]$Username = "lebedev",
  [string]$Password = "superparol579"
)

$ErrorActionPreference = "Stop"
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

$root = Split-Path -Parent $PSScriptRoot
$contextDir = Join-Path $root "outline-ai-search"
$tarPath = Join-Path $env:TEMP ("outline-ai-search-build-{0}.tar" -f ([guid]::NewGuid().ToString("N")))

@"
import tarfile
from pathlib import Path
context = Path(r"$contextDir")
tar_path = Path(r"$tarPath")
with tarfile.open(tar_path, "w") as tar:
    for name in ["Dockerfile", "requirements.txt", "app.py", ".dockerignore"]:
        tar.add(context / name, arcname=name)
print(tar_path)
"@ | python -

$authBody = @{ username = $Username; password = $Password } | ConvertTo-Json -Compress
$auth = Invoke-RestMethod -Uri "$PortainerUrl/api/auth" -Method Post -ContentType "application/json" -Body $authBody
$headers = @{ Authorization = "Bearer $($auth.jwt)" }

$encodedTag = [uri]::EscapeDataString($Tag)
$buildUrl = "$PortainerUrl/api/endpoints/$EndpointId/docker/build?t=$encodedTag&rm=1&forcerm=1"

try {
  Write-Host "Building $Tag on endpoint $EndpointId..."
  curl.exe -k -sS -X POST $buildUrl `
    -H "Authorization: Bearer $($auth.jwt)" `
    -H "Content-Type: application/x-tar" `
    --data-binary "@$tarPath"
  Write-Host "`nBuild request completed."
}
finally {
  if (Test-Path $tarPath) {
    Remove-Item -LiteralPath $tarPath -Force
  }
}
