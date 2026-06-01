# Full balance playtest (all baselines in manifest)
# Usage: .\scripts\balance_playtest.ps1
#        .\scripts\balance_playtest.ps1 -UpdateBaselines

param(
    [switch]$UpdateBaselines,
    [string[]]$Only
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$argsList = @("scripts/balance_playtest.py")
if ($UpdateBaselines) { $argsList += "--update-baselines" }
foreach ($p in $Only) { $argsList += "--only"; $argsList += $p }

python @argsList
exit $LASTEXITCODE
