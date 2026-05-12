# Handoff snapshot PowerShell syntax fix

## Problem

`Write-PortfolioHandoffSnapshot.ps1` failed to parse because Markdown backtick-heavy strings confused Windows PowerShell parsing.

Symptoms included errors such as:

```text
You must provide a value expression following the '-' operator.
Unexpected token 'Current' in expression or statement.
Missing closing '}' in statement block or type definition.
```

## Fix

The replacement script avoids Markdown backticks entirely and uses `~~~` fences in the generated Markdown instead of triple backticks.

It also uses an explicit `Add-Line` function and simpler string concatenation for Windows PowerShell compatibility.

## Run

```powershell
.\scripts\Write-PortfolioHandoffSnapshot.ps1
```

With validation:

```powershell
.\scripts\Write-PortfolioHandoffSnapshot.ps1 -RunValidation
```
