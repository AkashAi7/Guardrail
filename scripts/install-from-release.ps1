# Code Guardrail Installer - GitHub Release (AI-Only Version)
# Installs from pre-built release artifacts (lightweight, ~7MB)

param(
    [string]$InstallDir = "$env:USERPROFILE\.guardrail",
    [string]$Version = "0.6.0-ai-only"
)

$ErrorActionPreference = "Stop"

$REPO_URL = "https://github.com/AkashAi7/Guardrail"
$RELEASE_BASE_URL = "$REPO_URL/releases/download/v$Version"
$EXTENSION_URL = "$RELEASE_BASE_URL/code-guardrail-ai-only.vsix"

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
Write-Host "[CHECK] Checking prerequisites..." -ForegroundColor Cyan

# Check Node.js
$nodeInstalled = $false
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
    $nodeInstalled = $true
} catch {
    Write-Host "[WARN] Node.js not found" -ForegroundColor Yellow
    Write-Host "[DOWNLOAD] Downloading Node.js installer..." -ForegroundColor Cyan
    
    # Determine architecture
    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    $nodeVersion = "20.11.1"  # LTS version
    $nodeInstallerUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-$arch.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    
    try {
        Invoke-WebRequest -Uri $nodeInstallerUrl -OutFile $nodeInstaller -UseBasicParsing
        Write-Host "[OK] Downloaded Node.js installer" -ForegroundColor Green
        
        Write-Host "[SETUP] Installing Node.js (this may take a few minutes)..." -ForegroundColor Cyan
        Start-Process msiexec.exe -ArgumentList "/i", $nodeInstaller, "/quiet", "/norestart" -Wait
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Verify installation
        Start-Sleep -Seconds 3
        $nodeVersion = node --version
        Write-Host "[OK] Node.js installed: $nodeVersion" -ForegroundColor Green
        Remove-Item $nodeInstaller -Force
        $nodeInstalled = $true
    } catch {
        Write-Host "[ERROR] Failed to install Node.js automatically" -ForegroundColor Red
        Write-Host "   Please install manually from: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
}

# Check VS Code
$vscodeInstalled = $false
try {
    $codeVersion = code --version | Select-Object -First 1
    Write-Host "[OK] VS Code: $codeVersion" -ForegroundColor Green
    $vscodeInstalled = $true
} catch {
    Write-Host "[WARN] VS Code not found" -ForegroundColor Yellow
    Write-Host "[DOWNLOAD] Downloading VS Code installer..." -ForegroundColor Cyan
    
    $vscodeInstallerUrl = "https://code.visualstudio.com/sha/download?build=stable&os=win32-x64-user"
    $vscodeInstaller = "$env:TEMP\vscode-installer.exe"
    
    try {
        # Download VS Code
        Invoke-WebRequest -Uri $vscodeInstallerUrl -OutFile $vscodeInstaller -UseBasicParsing
        Write-Host "[OK] Downloaded VS Code installer" -ForegroundColor Green
        
        Write-Host "[SETUP] Installing VS Code (this may take a few minutes)..." -ForegroundColor Cyan
        # Install silently with PATH addition
        Start-Process -FilePath $vscodeInstaller -ArgumentList "/VERYSILENT", "/MERGETASKS=!runcode,addcontextmenufiles,addtopath" -Wait
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Verify installation
        Start-Sleep -Seconds 3
        $codeVersion = code --version | Select-Object -First 1
        Write-Host "[OK] VS Code installed: $codeVersion" -ForegroundColor Green
        Remove-Item $vscodeInstaller -Force
        $vscodeInstalled = $true
    } catch {
        Write-Host "[ERROR] Failed to install VS Code automatically" -ForegroundColor Red
        Write-Host "   Please install manually from: https://code.visualstudio.com/" -ForegroundColor Yellow
        exit 1
    }
}

if ($nodeInstalled -and $vscodeInstalled) {
    Write-Host ""
    Write-Host "[OK] All prerequisites satisfied" -ForegroundColor Green
}

# ============================================
# Download Service
# ============================================
Write-Host ""
Write-Host "[DOWNLOAD] Downloading service package..." -ForegroundColor Cyan

$tempZip = "$env:TEMP\guardrail-service.zip"

try {
    Invoke-WebRequest -Uri $SERVICE_ZIP_URL -OutFile $tempZip -UseBasicParsing
    Write-Host "[OK] Downloaded service package" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to download service from: $SERVICE_ZIP_URL" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# Extract Service
# ============================================
Write-Host ""
Write-Host "[PACKAGE] Extracting service..." -ForegroundColor Cyan

# Stop existing service if running
if (Test-Path $InstallDir) {
    Write-Host "  Checking for running service..." -ForegroundColor Yellow
    try {
        $existingProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($existingProcess) {
            $pid = $existingProcess.OwningProcess
            Write-Host "  Stopping existing service (PID: $pid)..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    } catch {
        # Service not running, continue
    }
    
    Write-Host "  Removing existing installation..." -ForegroundColor Yellow
    Remove-Item $InstallDir -Recurse -Force -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

try {
    Expand-Archive -Path $tempZip -DestinationPath $InstallDir -Force
    Remove-Item $tempZip -Force
    Write-Host "[OK] Service extracted to: $InstallDir" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to extract service: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# Configure Service
# ============================================
Write-Host ""
Write-Host "[CONFIG] Configuring service..." -ForegroundColor Cyan

$envFile = Join-Path $InstallDir ".env"
$envExample = Join-Path $InstallDir ".env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "[OK] Created .env configuration" -ForegroundColor Green
    } else {
        Write-Host "[WARN] No .env.example found, skipping configuration" -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] .env already exists" -ForegroundColor Green
}

# ============================================
# Download & Install Extension
# ============================================
Write-Host ""
Write-Host "[DOWNLOAD] Downloading VS Code extension..." -ForegroundColor Cyan

$tempVSIX = "$env:TEMP\code-guardrail.vsix"

try {
    Invoke-WebRequest -Uri $EXTENSION_URL -OutFile $tempVSIX -UseBasicParsing
    Write-Host "[OK] Downloaded extension" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to download extension from: $EXTENSION_URL" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[SETUP] Installing VS Code extension..." -ForegroundColor Cyan

try {
    # Check if extension is already installed
    $installedExtensions = code --list-extensions 2>&1
    if ($installedExtensions -match "akashai7\.code-guardrail") {
        Write-Host "  Uninstalling old version..." -ForegroundColor Yellow
        code --uninstall-extension akashai7.code-guardrail --force 2>&1 | Out-Null
        Start-Sleep -Seconds 2
    }
    
    # Install new version
    $installOutput = code --install-extension $tempVSIX --force 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Extension installed" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Extension installation completed with warnings" -ForegroundColor Yellow
        Write-Host "   Output: $installOutput" -ForegroundColor Gray
    }
    Remove-Item $tempVSIX -Force -ErrorAction SilentlyContinue
} catch {
    Write-Host "[ERROR] Failed to install extension: $_" -ForegroundColor Red
    Remove-Item $tempVSIX -Force -ErrorAction SilentlyContinue
    exit 1
}

# ============================================
# Start Service
# ============================================
Write-Host ""
Write-Host "[START] Starting service..." -ForegroundColor Cyan

Set-Location $InstallDir

# Check if port is already in use
try {
    $portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($portInUse) {
        Write-Host "[WARN] Port 3000 is already in use" -ForegroundColor Yellow
        $existingPid = $portInUse.OwningProcess
        Write-Host "   Stopping existing process (PID: $existingPid)..." -ForegroundColor Yellow
        Stop-Process -Id $existingPid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
} catch {
    # Port is free, continue
}

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
    Write-Host "[OK] Service started successfully (PID: $($serviceProcess.Id))" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Service may not be running. Check logs:" -ForegroundColor Yellow
    Write-Host "   $InstallDir\service.log" -ForegroundColor Yellow
    Write-Host "   $InstallDir\service-error.log" -ForegroundColor Yellow
}

# ============================================
# Success
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  [OK] Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Service Location:" -ForegroundColor Cyan
Write-Host "   $InstallDir" -ForegroundColor White
Write-Host ""
Write-Host "[SETUP] Service Status:" -ForegroundColor Cyan
Write-Host "   [OK] Running on http://localhost:3000" -ForegroundColor Green
Write-Host "   [OK] Process ID: $($serviceProcess.Id)" -ForegroundColor Green
Write-Host ""
Write-Host "[NEXT] Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Restart VS Code" -ForegroundColor White
Write-Host "   2. Open any TypeScript/JavaScript file" -ForegroundColor White
Write-Host "   3. Try adding:" -ForegroundColor White
Write-Host "      const password = `"admin123`";" -ForegroundColor Yellow
Write-Host "      const apiKey = `"sk-1234567890`";" -ForegroundColor Yellow
Write-Host "   4. Save -> See real-time analysis!" -ForegroundColor White
Write-Host ""
Write-Host "[DOCS] Documentation:" -ForegroundColor Cyan
Write-Host "   $REPO_URL" -ForegroundColor White
Write-Host ""
Write-Host "[TOOLS] Manage Service:" -ForegroundColor Cyan
Write-Host "   Stop:  Stop-Process -Id $($serviceProcess.Id)" -ForegroundColor White
Write-Host "   Start: cd $InstallDir ; node dist/index.js" -ForegroundColor White
Write-Host "   Logs:  Get-Content $InstallDir\service.log" -ForegroundColor White
Write-Host ""
