<#
start-dev.ps1

Starts backend (uvicorn) and frontend (vite) in separate PowerShell windows.
If Python venv or node_modules are missing it will create/install them once.

Usage: .\start-dev.ps1
Optional: .\start-dev.ps1 -OpenBrowser to open the frontend URL after launch
#>

param(
    [switch]$OpenBrowser
)

# Use $PSScriptRoot when available for robust script-relative paths
if ($PSScriptRoot) {
    $RepoRoot = $PSScriptRoot
} else {
    try {
        $RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    } catch {
        $RepoRoot = (Get-Location).Path
    }
}

if (-not (Test-Path $RepoRoot)) {
    Write-Error "Repository root path not found: $RepoRoot"
    exit 1
}

Write-Host "Repo root: $RepoRoot"

# Backend command: create venv/install once, then run uvicorn
$backendPath = Join-Path $RepoRoot 'backend'
if (-not (Test-Path $backendPath)) {
    Write-Error "Backend folder not found: $backendPath"
    exit 1
}

$backendCmd = @"
Set-Location -LiteralPath '$backendPath'
if (-not (Test-Path '.venv')) {
    Write-Host 'Creating Python virtualenv and installing requirements (first-run)...'
    python -m venv .venv
    if (Test-Path '.venv\Scripts\Activate.ps1') { & .\.venv\Scripts\Activate.ps1 }
    if (Test-Path 'requirements.txt') { pip install -r requirements.txt }
} else {
    Write-Host 'Activating existing Python virtualenv...'
    if (Test-Path '.venv\Scripts\Activate.ps1') { & .\.venv\Scripts\Activate.ps1 }
}
Write-Host 'Starting backend: uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload'
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
"@

Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-Command', $backendCmd -WindowStyle Normal

# Frontend command: install deps once, then run vite dev server
$frontendPath = Join-Path $RepoRoot 'crisis-dashboard'
if (-not (Test-Path $frontendPath)) {
    Write-Error "Frontend folder not found: $frontendPath"
    exit 1
}

$frontendCmd = @"
Set-Location -LiteralPath '$frontendPath'
if (-not (Test-Path 'node_modules')) {
    Write-Host 'Installing npm dependencies (first-run)...'
    npm ci
} else {
    Write-Host 'node_modules found — skipping npm ci'
}
Write-Host 'Starting frontend: npm run dev (vite)'
npm run dev
"@

Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-Command', $frontendCmd -WindowStyle Normal

if ($OpenBrowser) {
    Start-Sleep -Seconds 1
    Start-Process 'http://localhost:5173'
}

Write-Host 'Launched backend and frontend in new PowerShell windows.'
