# Code Guardrail - One-Click Installer
# Usage: iwr https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 -UseBasicParsing | iex

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🛡️  Code Guardrail Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Downloading installer..." -ForegroundColor Yellow

# Download and run the full installer from releases
$installerUrl = "https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install-from-release.ps1"

try {
    $installer = Invoke-WebRequest -Uri $installerUrl -UseBasicParsing -ErrorAction Stop
    
    Write-Host "✅ Downloaded installer" -ForegroundColor Green
    Write-Host ""
    
    # Execute the installer script
    Invoke-Expression $installer.Content
    
} catch {
    Write-Host ""
    Write-Host "❌ Failed to download installer" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. Internet connection" -ForegroundColor Yellow
    Write-Host "  2. GitHub is accessible" -ForegroundColor Yellow
    Write-Host "  3. Or download manually from: https://github.com/AkashAi7/Guardrail/releases" -ForegroundColor Yellow
    exit 1
}
