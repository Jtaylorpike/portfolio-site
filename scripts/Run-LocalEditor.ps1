param(
  [string]$ProjectRoot = ".",
  [int]$Port = 5000,
  [switch]$SkipAudit
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

if (-not $SkipAudit) {
  if (Test-Path "scripts\Audit-LocalEditorCompatibility.ps1") {
    & ".\scripts\Audit-LocalEditorCompatibility.ps1"
  }
}

if (-not (Test-Path "local-editor\editor.py")) {
  throw "local-editor\editor.py was not found."
}

Write-Host ""
Write-Host "Starting local editor..." -ForegroundColor Cyan
Write-Host "Project root: $($root.Path)"
Write-Host "Port: $Port"
Write-Host ""
Write-Host "Open:"
Write-Host "http://127.0.0.1:$Port"
Write-Host ""

$env:FLASK_RUN_PORT = "$Port"
python "local-editor\editor.py"
