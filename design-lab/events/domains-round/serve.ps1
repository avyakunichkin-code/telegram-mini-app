# Устарело: используйте .\sync-lab.ps1 && npx serve . из этой папки (self-contained)
Set-Location $PSScriptRoot\..
Write-Host "Open: http://localhost:3000/domains-round/"
npx serve .
