# Пересобрать lab-base.css + assets во всех раундах events/
$events = $PSScriptRoot
$sync = Join-Path $events "_shared\sync-lab-round.ps1"

& $sync -RoundDir (Join-Path $events "layout-round")
& $sync -RoundDir (Join-Path $events "overlay-round")
& $sync -RoundDir (Join-Path $events "domains-round") -WithLayoutStyles
& $sync -RoundDir (Join-Path $events "tails-round")

Write-Host "Done: layout-round, overlay-round, domains-round, tails-round"
