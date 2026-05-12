param([string]$BranchName = "dev")
$ErrorActionPreference = "Stop"
git checkout main
git pull origin main
$existingLocal = git branch --list $BranchName
$existingRemote = git ls-remote --heads origin $BranchName
if ($existingLocal) { git checkout $BranchName }
elseif ($existingRemote) { git checkout -b $BranchName origin/$BranchName }
else { git checkout -b $BranchName; git push -u origin $BranchName }
Write-Host ""
Write-Host "Working branch is ready: $BranchName" -ForegroundColor Green
