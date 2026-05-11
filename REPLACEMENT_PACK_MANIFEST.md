# Taylor Pike Portfolio Upload Script Fix Pack

Replace these files in your project:

- scripts/New-TaylorPikePortfolioChatUpload.ps1
- scripts/New-TaylorPikePortfolioChatUpload.cmd

Reason:

The previous upload script used [System.IO.Path]::GetRelativePath(), which is available in newer .NET/PowerShell runtimes but not in Windows PowerShell 5.1 on many Windows systems. This replacement uses a compatible URI-based relative path helper instead.

Run after replacement:

```powershell
.\scripts\New-TaylorPikePortfolioChatUpload.cmd
```
