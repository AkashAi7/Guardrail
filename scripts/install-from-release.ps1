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
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║           🛡️  CODE GUARDRAIL INSTALLER 🛡️                   ║" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║   Installing from GitHub Release (Lightweight ~10MB)         ║" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Version: " -ForegroundColor Yellow -NoNewline
Write-Host "v$Version" -ForegroundColor White
Write-Host "Install Directory: " -ForegroundColor Yellow -NoNewline
Write-Host "$InstallDir" -ForegroundColor White
Write-Host ""

# ============================================
# Check Prerequisites
# ============================================
Write-Host "📋 Checking Prerequisites" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$nodeInstalled = $false
try {
    $nodeVersion = node --version
    Write-Host "  ✓ " -ForegroundColor Green -NoNewline
    Write-Host "Node.js $nodeVersion" -ForegroundColor White
    $nodeInstalled = $true
} catch {
    Write-Host "  ⚠  " -ForegroundColor Yellow -NoNewline
    Write-Host "Node.js not found" -ForegroundColor White
    Write-Host "  → Downloading Node.js installer..." -ForegroundColor Blue
    
    # Determine architecture
    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    $nodeVersion = "20.11.1"  # LTS version
    $nodeInstallerUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-$arch.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    
    try {
        Invoke-WebRequest -Uri $nodeInstallerUrl -OutFile $nodeInstaller -UseBasicParsing
        Write-Host "    ✓ Downloaded Node.js installer" -ForegroundColor Green
        
        Write-Host "  → Installing Node.js (this may take a few minutes)..." -ForegroundColor Blue
        Start-Process msiexec.exe -ArgumentList "/i", $nodeInstaller, "/quiet", "/norestart" -Wait
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Verify installation
        Start-Sleep -Seconds 3
        $nodeVersion = node --version
        Write-Host "    ✓ Node.js installed: $nodeVersion" -ForegroundColor Green
        Remove-Item $nodeInstaller -Force
        $nodeInstalled = $true
    } catch {
        Write-Host "❌ Failed to install Node.js automatically" -ForegroundColor Red
        Write-Host "   Please install manually from: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
}

# Check VS Code
$vscodeInstalled = $false
try {
    $codeVersion = code --version | Select-Object -First 1
    Write-Host "✅ VS Code: $codeVersion" -ForegroundColor Green
    $vscodeInstalled = $true
} catch {
    Write-Host "⚠️ VS Code not found" -ForegroundColor Yellow
    Write-Host "📥 Downloading VS Code installer..." -ForegroundColor Cyan
    
    $vscodeInstallerUrl = "https://code.visualstudio.com/sha/download?build=stable&os=win32-x64-user"
    $vscodeInstaller = "$env:TEMP\vscode-installer.exe"
    
    try {
        # Download VS Code
        Invoke-WebRequest -Uri $vscodeInstallerUrl -OutFile $vscodeInstaller -UseBasicParsing
        Write-Host "✅ Downloaded VS Code installer" -ForegroundColor Green
        
        Write-Host "🔧 Installing VS Code (this may take a few minutes)..." -ForegroundColor Cyan
        # Install silently with PATH addition
        Start-Process -FilePath $vscodeInstaller -ArgumentList "/VERYSILENT", "/MERGETASKS=!runcode,addcontextmenufiles,addtopath" -Wait
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Verify installation
        Start-Sleep -Seconds 3
        $codeVersion = code --version | Select-Object -First 1
        Write-Host "✅ VS Code installed: $codeVersion" -ForegroundColor Green
        Remove-Item $vscodeInstaller -Force
        $vscodeInstalled = $true
    } catch {
        Write-Host "❌ Failed to install VS Code automatically" -ForegroundColor Red
        Write-Host "   Please install manually from: https://code.visualstudio.com/" -ForegroundColor Yellow
        exit 1
    }
}

if ($nodeInstalled -and $vscodeInstalled) {
    Write-Host ""
    Write-Host "  ✓ All prerequisites satisfied" -ForegroundColor Green
}

# ============================================
# Download Service
# ============================================
Write-Host ""
Write-Host "📥 Downloading Service Package" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$tempZip = "$env:TEMP\guardrail-service.zip"

Write-Host "→ Downloading from GitHub releases..." -ForegroundColor Blue
try {
    Invoke-WebRequest -Uri $SERVICE_ZIP_URL -OutFile $tempZip -UseBasicParsing
    Write-Host "✓ Downloaded service package" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to download from: $SERVICE_ZIP_URL" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# Extract Service
# ============================================
Write-Host ""
Write-Host "📦 Extracting Service" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Create install directory
if (Test-Path $InstallDir) {
    Write-Host "  ⚠  Removing existing installation..." -ForegroundColor Yellow
    Remove-Item $InstallDir -Recurse -Force
}

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

Write-Host "→ Extracting files..." -ForegroundColor Blue
try {
    Expand-Archive -Path $tempZip -DestinationPath $InstallDir -Force
    Remove-Item $tempZip -Force
    Write-Host "✓ Service extracted to: " -ForegroundColor Green -NoNewline
    Write-Host "$InstallDir" -ForegroundColor White
} catch {
    Write-Host "✗ Failed to extract service: $_" -ForegroundColor Red
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
    Write-Host "  ✓ " -ForegroundColor Green -NoNewline
    Write-Host "Service started successfully (PID: $($serviceProcess.Id))" -ForegroundColor White
} catch {
    Write-Host "  ⚠  " -ForegroundColor Yellow -NoNewline
    Write-Host "Service may not be running. Check logs:" -ForegroundColor White
    Write-Host "    → " -ForegroundColor Blue -NoNewline
    Write-Host "$InstallDir\service.log" -ForegroundColor Cyan
    Write-Host "    → " -ForegroundColor Blue -NoNewline
    Write-Host "$InstallDir\service-error.log" -ForegroundColor Cyan
}

# ============================================
# Success
# ============================================
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                               ║" -ForegroundColor Green
Write-Host "║              ✅  INSTALLATION COMPLETE! ✅                     ║" -ForegroundColor Green
Write-Host "║                                                               ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Service Location" -ForegroundColor Cyan
Write-Host "   $InstallDir" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Service Status" -ForegroundColor Cyan
Write-Host "   ✓ Running on " -ForegroundColor Green -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Blue
Write-Host "   ✓ Process ID: " -ForegroundColor Green -NoNewline
Write-Host "$($serviceProcess.Id)" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next Steps" -ForegroundColor Cyan
Write-Host "   1. " -ForegroundColor White -NoNewline
Write-Host "Restart VS Code" -ForegroundColor Yellow
Write-Host "   2. " -ForegroundColor White -NoNewline
Write-Host "Open any TypeScript/JavaScript file" -ForegroundColor Yellow
Write-Host "   3. " -ForegroundColor White -NoNewline
Write-Host "Try adding:" -ForegroundColor Yellow
Write-Host "      const password = `"admin123`";" -ForegroundColor Yellow
Write-Host "      const apiKey = `"sk-1234567890`";" -ForegroundColor Yellow
Write-Host "   4. " -ForegroundColor White -NoNewline
Write-Host "Save → See real-time analysis! ✨" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Documentation" -ForegroundColor Cyan
Write-Host "   → " -ForegroundColor Blue -NoNewline
Write-Host "$REPO_URL" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Manage Service" -ForegroundColor Cyan
Write-Host "   → Stop:  " -ForegroundColor Blue -NoNewline
Write-Host "Stop-Process -Id $($serviceProcess.Id)" -ForegroundColor Cyan
Write-Host "   → Start: " -ForegroundColor Blue -NoNewline
Write-Host "cd $InstallDir ; node dist/index.js" -ForegroundColor Cyan
Write-Host "   → Logs:  " -ForegroundColor Blue -NoNewline
Write-Host "Get-Content $InstallDir\service.log" -ForegroundColor Cyan
Write-Host ""
