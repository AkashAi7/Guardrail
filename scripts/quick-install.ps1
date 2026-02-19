# Code Guardrail Installer - AI-Only Version
# Quick install script for the AI-powered Code Guardrail extension

param(
    [string]$Version = "0.6.0-ai-only"
)

$ErrorActionPreference = "Stop"

$REPO_URL = "https://github.com/AkashAi7/Guardrail"
$RELEASE_URL = "$REPO_URL/releases/download/v$Version"
$EXTENSION_URL = "$RELEASE_URL/code-guardrail-ai-only.vsix"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🤖 Code Guardrail AI Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Version: v$Version" -ForegroundColor Yellow
Write-Host "AI-Powered Security Analysis" -ForegroundColor Green
Write-Host ""

# ============================================
# Check Prerequisites
# ============================================
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Cyan

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js first:" -ForegroundColor Yellow
    Write-Host "  https://nodejs.org/" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Check VS Code
try {
    $codeVersion = code --version | Select-Object -First 1
    Write-Host "✅ VS Code: $codeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ VS Code not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install VS Code first:" -ForegroundColor Yellow
    Write-Host "  https://code.visualstudio.com/" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "✅ All prerequisites satisfied" -ForegroundColor Green

# ============================================
# Download Extension
# ============================================
Write-Host ""
Write-Host "📥 Downloading extension (~7MB)..." -ForegroundColor Cyan

$tempVSIX = "$env:TEMP\code-guardrail-ai-only.vsix"

try {
    Invoke-WebRequest -Uri $EXTENSION_URL -OutFile $tempVSIX -UseBasicParsing
    Write-Host "✅ Downloaded extension" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download from: $EXTENSION_URL" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# Install Extension
# ============================================
Write-Host ""
Write-Host "🔧 Installing extension..." -ForegroundColor Cyan

try {
    # Check if extension is already installed
    $installedExtensions = code --list-extensions 2>&1
    if ($installedExtensions -match "akashai7\.code-guardrail") {
        Write-Host "  Uninstalling previous version..." -ForegroundColor Yellow
        code --uninstall-extension akashai7.code-guardrail --force 2>&1 | Out-Null
        Start-Sleep -Seconds 2
    }
    
    # Install new version
    code --install-extension $tempVSIX --force 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Extension installed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Extension may be installed but with warnings" -ForegroundColor Yellow
    }
    
    Remove-Item $tempVSIX -Force -ErrorAction SilentlyContinue
} catch {
    Write-Host "❌ Failed to install extension: $_" -ForegroundColor Red
    Remove-Item $tempVSIX -Force -ErrorAction SilentlyContinue
    exit 1
}

# ============================================
# Clone Repository (Optional)
# ============================================
Write-Host ""
$cloneRepo = Read-Host "📦 Do you want to clone the repository with test files? (y/N)"

if ($cloneRepo -eq "y" -or $cloneRepo -eq "Y") {
    $repoPath = "$env:USERPROFILE\Guardrail"
    
    if (Test-Path $repoPath) {
        Write-Host "  Repository already exists at: $repoPath" -ForegroundColor Yellow
    } else {
        Write-Host "  Cloning repository..." -ForegroundColor Cyan
        try {
            git clone $REPO_URL $repoPath 2>&1 | Out-Null
            Write-Host "✅ Repository cloned to: $repoPath" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Failed to clone repository (git may not be installed)" -ForegroundColor Yellow
        }
    }
}

# ============================================
# Success Message
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🤖 AI-Only Analysis Mode" -ForegroundColor Cyan
Write-Host "   The service will auto-start when VS Code launches" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Restart VS Code (or reload window)" -ForegroundColor White
Write-Host "     • Press Ctrl+Shift+P → 'Reload Window'" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Test with sample files:" -ForegroundColor White
Write-Host "     • Clone repo: git clone $REPO_URL" -ForegroundColor Gray
Write-Host "     • Open: test-files/test-auth-service.ts" -ForegroundColor Gray
Write-Host "     • Or: test-files/test-flask-api.py" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Scan entire project:" -ForegroundColor White
Write-Host "     • Ctrl+Shift+P → 'Code Guardrail: Scan Entire Project'" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   $REPO_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Features:" -ForegroundColor Yellow
Write-Host "   • Detects hardcoded secrets (API keys, passwords)" -ForegroundColor White
Write-Host "   • Finds SQL injection vulnerabilities" -ForegroundColor White
Write-Host "   • Catches XSS, command injection, path traversal" -ForegroundColor White
Write-Host "   • Identifies weak cryptography" -ForegroundColor White
Write-Host "   • And much more..." -ForegroundColor White
Write-Host ""
