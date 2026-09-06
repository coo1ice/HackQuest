<#
Forwarding script so you can run start-dev from inside `crisis-dashboard`.
It delegates to the repository-root `start-dev.ps1` and passes any arguments through.

Usage (from crisis-dashboard):
  .\start-dev.ps1 -OpenBrowser
#>

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    $RemainingArgs
)

$RootScript = Join-Path -Path (Resolve-Path ..) -ChildPath 'start-dev.ps1'
if (-not (Test-Path $RootScript)) {
    Write-Error "Could not find repository root start-dev.ps1 at $RootScript"
    exit 1
}

# Build argument string for forwarding
$argString = $RemainingArgs -join ' '
& $RootScript $argString