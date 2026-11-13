# Витрина layout-round: serve из корня events (../styles.css доступны по /styles.css)
Set-Location $PSScriptRoot\..
Write-Host "Open: http://localhost:3000/layout-round/"
npx serve .
