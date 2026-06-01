# Устарело: используйте ./sync-lab.sh && npx serve . из этой папки (self-contained)
Set-Location $PSScriptRoot\..
Write-Host "Open: http://localhost:3000/domains-round/"
npx serve .
