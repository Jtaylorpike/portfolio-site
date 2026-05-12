param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

Write-Host ""
Write-Host "_chat-uploads lock troubleshooting" -ForegroundColor Cyan
Write-Host ""
Write-Host "The folder may be locked by Explorer, VS Code, a terminal session, antivirus scanning, or a process with a current working directory inside it."
Write-Host ""
Write-Host "Try these steps:"
Write-Host "1. Close any Explorer window open inside _chat-uploads."
Write-Host "2. Close any VS Code tab/folder view showing _chat-uploads."
Write-Host "3. Make sure no terminal is currently cd'd into _chat-uploads."
Write-Host "4. Rerun:"
Write-Host "   .\scripts\Clean-WorkspaceRootArtifacts.ps1 -Apply -CopyThenRemove"
Write-Host ""
Write-Host "If it still fails, skip it for now:"
Write-Host "   .\scripts\Clean-WorkspaceRootArtifacts.ps1 -Apply -SkipChatUploads"
Write-Host ""
Write-Host "Then delete or archive _chat-uploads manually after confirming it is not needed."
Write-Host ""

if (Test-Path "_chat-uploads") {
  Write-Host "Current _chat-uploads contents:"
  Get-ChildItem "_chat-uploads" -Force | Select-Object Mode, Length, LastWriteTime, Name | Format-Table -AutoSize
} else {
  Write-Host "_chat-uploads does not exist."
}
