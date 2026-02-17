# Code Guardrail Installer - GitHub Release
# Installs from pre-built release artifacts (lightweight, ~10MB)

param(
    [string]$InstallDir = "$env:USERPROFILE\.guardrail",
    [string]$Version = "0.1.0"
)

$ErrorActionPreference = "Stop"

$REPO_URL = "https://github.com/AkashAi7/Guardrail"
$RELEASE_BASE_URL = "$REPO_URL/releases/download/v$Version"
$SERVICE_ZIP_URL = "$RELEASE_BASE_URL/guardrail-service-v$Version.zip"
$EXTENSION_URL = "$RELEASE_BASE_URL/code-guardrail-0.1.0.vsix"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Code Guardrail Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Version: v$Version" -ForegroundColor Yellow
Write-Host "Install Directory: $InstallDir" -ForegroundColor Yellow
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
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check VS Code
try {
    $codeVersion = code --version | Select-Object -First 1
    Write-Host "✅ VS Code: $codeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ VS Code not found. Please install from https://code.visualstudio.com/" -ForegroundColor Red
    exit 1
}

# ============================================
# Download Service
# ============================================
Write-Host ""
Write-Host "📥 Downloading service package..." -ForegroundColor Cyan

$tempZip = "$env:TEMP\guardrail-service.zip"

try {
    Invoke-WebRequest -Uri $SERVICE_ZIP_URL -OutFile $tempZip -UseBasicParsing
    Write-Host "✅ Downloaded service package" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download service from: $SERVICE_ZIP_URL" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# Extract Service
# ============================================
Write-Host ""
Write-Host "📦 Extracting service..." -ForegroundColor Cyan

# Create install directory
if (Test-Path $InstallDir) {
    Write-Host "  Removing existing installation..." -ForegroundColor Yellow
    Remove-Item $InstallDir -Recurse -Force
}

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

try {
    Expand-Archive -Path $tempZip -DestinationPath $InstallDir -Force
    Remove-Item $tempZip -Force
    Write-Host "✅ Service extracted to: $InstallDir" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to extract service: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# Configure Service
# ============================================
Write-Host ""
Write-Host "⚙️ Configuring service..." -ForegroundColor Cyan

$envFile = Join-Path $InstallDir ".env"
$envExample = Join-Path $InstallDir ".env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "✅ Created .env configuration" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No .env.example found, skipping configuration" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ .env already exists" -ForegroundColor Green
}

# ============================================
# Download & Install Extension
# ============================================
Write-Host ""
Write-Host "📥 Downloading VS Code extension..." -ForegroundColor Cyan

$tempVSIX = "$env:TEMP\code-guardrail.vsix"

try {
    Invoke-WebRequest -Uri $EXTENSION_URL -OutFile $tempVSIX -UseBasicParsing
    Write-Host "✅ Downloaded extension" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download extension from: $EXTENSION_URL" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Installing VS Code extension..." -ForegroundColor Cyan

try {
    code --install-extension $tempVSIX --force | Out-Null
    Remove-Item $tempVSIX -Force
    Write-Host "✅ Extension installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install extension: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# Start Service
# ============================================
Write-Host ""
Write-Host "🚀 Starting service..." -ForegroundColor Cyan

Set-Location $InstallDir

# Start service in background
$serviceProcess = Start-Process -FilePath "node" `
                                -ArgumentList "dist/index.js" `
                                -NoNewWindow `
                                -PassThru `
                                -RedirectStandardOutput "service.log" `
                                -RedirectStandardError "service-error.log"

Start-Sleep -Seconds 3

# Check if service is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Service started successfully (PID: $($serviceProcess.Id))" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Service may not be running. Check logs:" -ForegroundColor Yellow
    Write-Host "   $InstallDir\service.log" -ForegroundColor Yellow
    Write-Host "   $InstallDir\service-error.log" -ForegroundColor Yellow
}

# ============================================
# Success
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Service Location:" -ForegroundColor Cyan
Write-Host "   $InstallDir" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Service Status:" -ForegroundColor Cyan
Write-Host "   ✓ Running on http://localhost:3000" -ForegroundColor Green
Write-Host "   ✓ Process ID: $($serviceProcess.Id)" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Restart VS Code" -ForegroundColor White
Write-Host "   2. Open any TypeScript/JavaScript file" -ForegroundColor White
Write-Host "   3. Try adding:" -ForegroundColor White
Write-Host "      const password = `"admin123`";" -ForegroundColor Yellow
Write-Host "      const apiKey = `"sk-1234567890`";" -ForegroundColor Yellow
Write-Host "   4. Save → See real-time analysis! ✨" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   $REPO_URL" -ForegroundColor White
Write-Host ""
Write-Host "🛠️ Manage Service:" -ForegroundColor Cyan
Write-Host "   Stop:  Stop-Process -Id $($serviceProcess.Id)" -ForegroundColor White
Write-Host "   Start: cd $InstallDir ; node dist/index.js" -ForegroundColor White
Write-Host "   Logs:  Get-Content $InstallDir\service.log" -ForegroundColor White
Write-Host ""
