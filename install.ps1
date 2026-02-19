# Code Guardrail - One-Click Installer
# Usage: iwr https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 -UseBasicParsing | iex

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║         🛡️  CODE GUARDRAIL - ONE-CLICK INSTALLER 🛡️          ║" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║   Real-time Security & Compliance Analysis for VS Code       ║" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "→ " -ForegroundColor Blue -NoNewline
Write-Host "Downloading installer..." -ForegroundColor White

# Download and run the full installer from releases
$installerUrl = "https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install-from-release.ps1"

try {
    $installer = Invoke-WebRequest -Uri $installerUrl -UseBasicParsing -ErrorAction Stop
    
    Write-Host "✅ " -ForegroundColor Green -NoNewline
    Write-Host "Downloaded installer" -ForegroundColor White
    Write-Host ""
    
    # Execute the installer script
    Invoke-Expression $installer.Content
    
} catch {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  ❌  Installation Failed                                      ║" -ForegroundColor Yellow
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  → Internet connection" -ForegroundColor Blue
    Write-Host "  → GitHub accessibility" -ForegroundColor Blue
    Write-Host "  → Or download manually: " -ForegroundColor Blue -NoNewline
    Write-Host "https://github.com/AkashAi7/Guardrail/releases" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}
