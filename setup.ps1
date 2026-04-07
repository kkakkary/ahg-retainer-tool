# AHG Document Creation Tool — Setup Script
# Run this once on a fresh Windows machine to install dependencies and build the app.
# Right-click this file and choose "Run with PowerShell" (or run as Administrator for system-wide installs).

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== AHG Document Creation Tool Setup ===" -ForegroundColor Cyan
Write-Host ""

# ── 1. Check for winget ────────────────────────────────────────────────────────
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: winget is not available on this machine." -ForegroundColor Red
    Write-Host "Please install the App Installer from the Microsoft Store, then re-run this script."
    Read-Host "Press Enter to exit"
    exit 1
}

# ── 2. Install Node.js if missing ─────────────────────────────────────────────
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Node.js..." -ForegroundColor Yellow
    winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    # Refresh PATH so node is available in this session
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "Node.js installed." -ForegroundColor Green
} else {
    Write-Host "Node.js already installed: $(node --version)" -ForegroundColor Green
}

# ── 3. Install LibreOffice if missing ─────────────────────────────────────────
$libreOfficeExe = "C:\Program Files\LibreOffice\program\soffice.exe"
if (-not (Test-Path $libreOfficeExe)) {
    Write-Host "Installing LibreOffice..." -ForegroundColor Yellow
    winget install --id TheDocumentFoundation.LibreOffice --silent --accept-package-agreements --accept-source-agreements
    Write-Host "LibreOffice installed." -ForegroundColor Green
} else {
    Write-Host "LibreOffice already installed." -ForegroundColor Green
}

# ── 4. Install npm dependencies ───────────────────────────────────────────────
Write-Host ""
Write-Host "Installing npm packages..." -ForegroundColor Yellow
npm install
Write-Host "npm packages installed." -ForegroundColor Green

# ── 5. Build the installer ────────────────────────────────────────────────────
Write-Host ""
Write-Host "Building Windows installer..." -ForegroundColor Yellow
npm run build
Write-Host ""
Write-Host "=== Build complete! ===" -ForegroundColor Cyan
Write-Host "Installer is in the 'release' folder." -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
