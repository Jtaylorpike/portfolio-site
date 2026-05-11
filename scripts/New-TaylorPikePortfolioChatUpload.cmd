@echo off
setlocal

rem Launches the portfolio upload packager without changing the machine-wide
rem PowerShell execution policy. This exists for systems using RemoteSigned or
rem AllSigned where downloaded .ps1 files are blocked before they can run.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0New-TaylorPikePortfolioChatUpload.ps1" %*
exit /b %ERRORLEVEL%
