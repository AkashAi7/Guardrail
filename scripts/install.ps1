# Code Guardrail - Installation Script (Windows PowerShell)
# ==========================================================
# Run from the repo root:  .\scripts\install.ps1

param(
    [switch]$SkipService,
    [switch]$SkipExtension
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Push-Location $root

Write-Host "`n  Code Guardrail - Installer`n  =========================" -ForegroundColor Cyan

# ── Prerequisites ──
Write-Host "`n[1/5] Checking prerequisites..." -ForegroundColor Yellow

$nodeVersion = $null
try { $nodeVersion = node -v } catch {}
if (-not $nodeVersion) { Write-Host "  ERROR: Node.js not found. Install from https://nodejs.org/" -ForegroundColor Red; exit 1 }

$major = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($major -lt 18) { Write-Host "  ERROR: Node.js 18+ required (found $nodeVersion)" -ForegroundColor Red; exit 1 }
Write-Host "  Node.js $nodeVersion  npm $(npm -v)" -ForegroundColor Green

$hasCode = $false
try { $null = code --version 2>$null; $hasCode = $true } catch {}
if ($hasCode) { Write-Host "  VS Code CLI available" -ForegroundColor Green }
else          { Write-Host "  VS Code CLI not found (manual VSIX install)" -ForegroundColor Yellow }

# ── Service ──
if (-not $SkipService) {
    Write-Host "`n[2/5] Installing service..." -ForegroundColor Yellow
    Push-Location service
    npm install --loglevel=error 2>&1 | Out-Null
    npm run build  2>&1 | Out-Null
    Write-Host "  Service built OK" -ForegroundColor Green
    Pop-Location
} else { Write-Host "`n[2/5] Skipping service (flag)" -ForegroundColor Gray }

# ── Extension ──
if (-not $SkipExtension) {
    Write-Host "`n[3/5] Installing extension..." -ForegroundColor Yellow
    Push-Location extension
    npm install --loglevel=error 2>&1 | Out-Null
    npm run compile 2>&1 | Out-Null
    Write-Host "  Extension compiled OK" -ForegroundColor Green
    Pop-Location
} else { Write-Host "`n[3/5] Skipping extension (flag)" -ForegroundColor Gray }

# ── Package VSIX ──
if (-not $SkipExtension) {
    Write-Host "`n[4/5] Packaging VSIX..." -ForegroundColor Yellow
    Push-Location extension
    npm run package 2>&1 | Out-Null
    $vsix = Get-ChildItem -Filter "*.vsix" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($vsix) {
        Write-Host "  Created $($vsix.Name)" -ForegroundColor Green
        if ($hasCode) {
            Write-Host "  Installing into VS Code..." -ForegroundColor Gray
            code --install-extension $vsix.Name --force 2>&1 | Out-Null
            Write-Host "  Extension installed" -ForegroundColor Green
        }
    } else {
        Write-Host "  WARNING: VSIX not created" -ForegroundColor Yellow
    }
    Pop-Location
} else { Write-Host "`n[4/5] Skipping package" -ForegroundColor Gray }

# ── Done ──
Write-Host "`n[5/5] Done!" -ForegroundColor Green
Write-Host @"

  Quick Start
  -----------
  1. Start the service:   cd service && npm start
  2. Open VS Code, run command:  Code Guardrail: Show Menu
  3. Change scan mode:    Code Guardrail: Toggle Scan Mode

  Scan Modes (Settings > Code Guardrail)
  - manual     : Scan only when you run a command (default)
  - realtime   : Scan on every save / open
  - scheduled  : Scan all open files at an interval (default 15 min)

"@ -ForegroundColor Cyan

Pop-Location
