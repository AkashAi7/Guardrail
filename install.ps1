# Guardrail Installer - Windows
# Hybrid Edition: Auto-detects Copilot OR uses BYOK

# Requires: PowerShell 5.1+, Node.js 18+, VS Code

param(
    [switch]$Uninstall,
    [string]$InstallDir = "$env:LOCALAPPDATA\Guardrail",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

# Configuration
$INSTALL_DIR = $InstallDir
$SERVICE_NAME = "GuardrailService"
$SERVICE_PORT = 3000
$REPO_URL = "https://github.com/AkashAi7/Guardrail.git"

function Write-Step {
    param([string]$Message)
    Write-Host "`n===========================================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "===========================================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-Step "Checking Prerequisites"
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js found: $nodeVersion"
    } catch {
        Write-Error-Custom "Node.js not found. Please install Node.js 18+ from https://nodejs.org"
        exit 1
    }
    
    # Check VS Code
    try {
        $codeVersion = code --version
        Write-Success "VS Code found: $($codeVersion[0])"
    } catch {
        Write-Error-Custom "VS Code not found. Please install from https://code.visualstudio.com"
        exit 1
    }
    
    # Check Git
    try {
        $gitVersion = git --version
        Write-Success "Git found: $gitVersion"
    } catch {
        Write-Error-Custom "Git not found. Please install from https://git-scm.com"
        exit 1
    }
}

function Install-GuardrailService {
    Write-Step "Installing Guardrail Backend Service"
    
    # Create install directory
    if (Test-Path $INSTALL_DIR) {
        Write-Info "Removing existing installation..."
        try {
            # Stop any running processes in the directory
            Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$INSTALL_DIR*" } | Stop-Process -Force
            Start-Sleep -Seconds 2
            Remove-Item $INSTALL_DIR -Recurse -Force -ErrorAction Stop
        } catch {
            Write-Error-Custom "Failed to remove existing installation. Please close all applications using Guardrail."
            exit 1
        }
    }
    
    New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
    Write-Success "Created directory: $INSTALL_DIR"
    
    # Clone repository
    Write-Info "Downloading Guardrail from GitHub ($Branch branch)..."
    try {
        git clone -b $Branch --single-branch $REPO_URL $INSTALL_DIR 2>&1 | Out-Null
        Write-Success "Downloaded successfully"
    } catch {
        Write-Error-Custom "Failed to clone repository. Please check your internet connection and Git installation."
        exit 1
    }
    
    # Install service dependencies
    Write-Info "Installing backend dependencies (this may take a minute)..."
    Set-Location "$INSTALL_DIR\service"
    try {
        npm install --no-audit 2>&1 | Out-Null
        Write-Success "Dependencies installed"
    } catch {
        Write-Error-Custom "Failed to install dependencies. Check Node.js installation."
        exit 1
    }
    
    # Build service
    Write-Info "Building backend service..."
    try {
        npm run build 2>&1 | Out-Null
        Write-Success "Service built successfully"
    } catch {
        Write-Error-Custom "Failed to build service. Check build logs."
        exit 1
    }
    
    # Create .env file
    if (-not (Test-Path "$INSTALL_DIR\service\.env")) {
        Copy-Item "$INSTALL_DIR\service\.env.example" "$INSTALL_DIR\service\.env"
        Write-Success "Created configuration file"
    }
}

function Detect-Provider {
    Write-Step "Detecting LLM Provider"
    
    # Check for Copilot CLI
    $copilotPaths = @(
        "$env:APPDATA\Code\User\globalStorage\github.copilot-chat\copilotCli\copilot.ps1",
        "$env:APPDATA\Code - Insiders\User\globalStorage\github.copilot-chat\copilotCli\copilot.ps1"
    )
    
    $copilotFound = $false
    foreach ($path in $copilotPaths) {
        if (Test-Path $path) {
            Write-Success "GitHub Copilot detected at: $path"
            $copilotFound = $true
            break
        }
    }
    
    if ($copilotFound) {
        Write-Info "Provider Mode: AUTO (will use Copilot if authenticated)"
        Write-Info "Cost: `$0 (included in Copilot subscription)"
        
        # Set PROVIDER_MODE=auto in .env
        $envContent = Get-Content "$INSTALL_DIR\service\.env"
        $envContent = $envContent -replace 'PROVIDER_MODE=.*', 'PROVIDER_MODE=auto'
        $envContent | Set-Content "$INSTALL_DIR\service\.env"
    } else {
        Write-Info "GitHub Copilot not found"
        Write-Info "Provider Mode: You'll need to configure BYOK (Bring Your Own Key)"
        Write-Host ""
        Write-Host "To configure BYOK, edit: $INSTALL_DIR\service\.env" -ForegroundColor Yellow
        Write-Host "Add one of the following:" -ForegroundColor Yellow
        Write-Host "  OPENAI_API_KEY=sk-your-key-here" -ForegroundColor Yellow
        Write-Host "  ANTHROPIC_API_KEY=sk-ant-your-key-here" -ForegroundColor Yellow
        Write-Host ""
        
        $configure = Read-Host "Would you like to configure API key now? (y/n)"
        if ($configure -eq 'y') {
            Configure-BYOK
        }
    }
}

function Configure-BYOK {
    Write-Host ""
    Write-Host "Select LLM Provider:" -ForegroundColor Cyan
    Write-Host "  [1] OpenAI (GPT-4, GPT-4o)"
    Write-Host "  [2] Anthropic (Claude 3.5 Sonnet)"
    Write-Host "  [3] Azure OpenAI"
    
    $choice = Read-Host "Your choice (1-3)"
    
    $envPath = "$INSTALL_DIR\service\.env"
    $envContent = Get-Content $envPath
    
    switch ($choice) {
        '1' {
            $apiKey = Read-Host "Enter OpenAI API Key" -AsSecureString
            $apiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
            )
            $envContent += "`nOPENAI_API_KEY=$apiKeyPlain"
            $envContent += "`nBYOK_MODEL=gpt-4o"
            Write-Success "OpenAI configured"
        }
        '2' {
            $apiKey = Read-Host "Enter Anthropic API Key" -AsSecureString
            $apiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
            )
            $envContent += "`nANTHROPIC_API_KEY=$apiKeyPlain"
            $envContent += "`nBYOK_MODEL=claude-3-5-sonnet-20241022"
            Write-Success "Anthropic configured"
        }
        '3' {
            $endpoint = Read-Host "Azure OpenAI Endpoint"
            $apiKey = Read-Host "Azure OpenAI Key" -AsSecureString
            $deployment = Read-Host "Deployment Name"
            
            $apiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
            )
            $envContent += "`nAZURE_OPENAI_ENDPOINT=$endpoint"
            $envContent += "`nAZURE_OPENAI_KEY=$apiKeyPlain"
            $envContent += "`nAZURE_OPENAI_DEPLOYMENT=$deployment"
            Write-Success "Azure OpenAI configured"
        }
    }
    
    $envContent | Set-Content $envPath
}

function Install-ServiceAsWindowsService {
    Write-Step "Setting up Windows Service"
    
    # Check if NSSM is available (for Windows Service management)
    try {
        nssm version | Out-Null
        $useNSSM = $true
    } catch {
        $useNSSM = $false
        Write-Info "NSSM not found - service will need to be started manually"
    }
    
    if ($useNSSM) {
        # Stop existing service if running
        $existingService = Get-Service $SERVICE_NAME -ErrorAction SilentlyContinue
        if ($existingService) {
            Stop-Service $SERVICE_NAME -Force
            nssm remove $SERVICE_NAME confirm
            Write-Info "Removed existing service"
        }
        
        # Install new service
        $nodePath = (Get-Command node).Source
        $serviceScript = "$INSTALL_DIR\service\dist\index.js"
        
        nssm install $SERVICE_NAME $nodePath $serviceScript
        nssm set $SERVICE_NAME AppDirectory "$INSTALL_DIR\service"
        nssm set $SERVICE_NAME DisplayName "Guardrail Code Analysis Service"
        nssm set $SERVICE_NAME Description "Real-time code security and compliance analysis"
        nssm set $SERVICE_NAME Start SERVICE_AUTO_START
        
        # Start service
        Start-Service $SERVICE_NAME
        Write-Success "Windows Service installed and started: $SERVICE_NAME"
    } else {
        # Create startup script
        $startupScript = @"
@echo off
cd /d "$INSTALL_DIR\service"
node dist/index.js
"@
        $startupScript | Set-Content "$INSTALL_DIR\start-service.bat"
        Write-Success "Created startup script: $INSTALL_DIR\start-service.bat"
        Write-Info "Run this script to start the service manually"
        
        # Start service now
        Write-Info "Starting service..."
        Start-Process -FilePath "$INSTALL_DIR\start-service.bat" -WindowStyle Hidden
        Start-Sleep -Seconds 3
    }
    
    # Test service
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$SERVICE_PORT/health" -Method Get -TimeoutSec 5
        Write-Success "Service is running on http://localhost:$SERVICE_PORT"
    } catch {
        Write-Error-Custom "Service failed to start. Check logs at: $INSTALL_DIR\service\logs"
    }
}

function Install-VSCodeExtension {
    Write-Step "Installing VS Code Extension"
    
    # Build extension
    Set-Location "$INSTALL_DIR\extension"
    Write-Info "Installing extension dependencies..."
    try {
        npm install --no-audit 2>&1 | Out-Null
    } catch {
        Write-Error-Custom "Failed to install extension dependencies"
        exit 1
    }
    
    Write-Info "Compiling extension..."
    try {
        npm run compile 2>&1 | Out-Null
    } catch {
        Write-Error-Custom "Failed to compile extension"
        exit 1
    }
    
    # Check if vsce is installed
    Write-Info "Packaging extension..."
    try {
        # Install vsce locally if not available
        if (-not (Get-Command vsce -ErrorAction SilentlyContinue)) {
            npm install -g @vscode/vsce 2>&1 | Out-Null
        }
        npx @vscode/vsce package --no-dependencies 2>&1 | Out-Null
    } catch {
        Write-Error-Custom "Failed to package extension"
        exit 1
    }
    
    # Install extension
    $vsixFile = Get-ChildItem "*.vsix" | Select-Object -First 1
    if ($vsixFile) {
        try {
            code --install-extension $vsixFile.FullName --force 2>&1 | Out-Null
            Write-Success "Extension installed: $($vsixFile.Name)"
        } catch {
            Write-Info "Automatic installation failed. You can install manually:"
            Write-Host "  code --install-extension $($vsixFile.FullName)" -ForegroundColor Yellow
        }
    } else {
        Write-Error-Custom "Failed to package extension - .vsix file not found"
    }
}

function Show-CompletionMessage {
    Write-Host ""
    Write-Host "===========================================================" -ForegroundColor Green
    Write-Host "  🎉 Guardrail Installation Complete!" -ForegroundColor Green
    Write-Host "===========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installation Directory: $INSTALL_DIR" -ForegroundColor Cyan
    Write-Host "Service URL: http://localhost:$SERVICE_PORT" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Restart VS Code"
    Write-Host "  2. Open any TypeScript/JavaScript file"
    Write-Host "  3. Save the file to trigger analysis"
    Write-Host ""
    Write-Host "Configuration: $INSTALL_DIR\service\.env" -ForegroundColor Cyan
    Write-Host "Logs: $INSTALL_DIR\service\logs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  Start Service:  Start-Service $SERVICE_NAME"
    Write-Host "  Stop Service:   Stop-Service $SERVICE_NAME"
    Write-Host "  Uninstall:      powershell -File install.ps1 -Uninstall"
    Write-Host ""
}

function Uninstall-Guardrail {
    Write-Step "Uninstalling Guardrail"
    
    # Stop and remove service
    try {
        Stop-Service $SERVICE_NAME -Force -ErrorAction SilentlyContinue
        nssm remove $SERVICE_NAME confirm
        Write-Success "Service removed"
    } catch {
        Write-Info "Service not found or already removed"
    }
    
    # Remove extension
    code --uninstall-extension AkashAi7.code-guardrail
    Write-Success "Extension uninstalled"
    
    # Remove installation directory
    if (Test-Path $INSTALL_DIR) {
        Remove-Item $INSTALL_DIR -Recurse -Force
        Write-Success "Installation directory removed"
    }
    
    Write-Host ""
    Write-Host "✅ Guardrail uninstalled successfully" -ForegroundColor Green
}

# Main installation flow
function Main {
    Clear-Host
    
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                           ║" -ForegroundColor Cyan
    Write-Host "║           GUARDRAIL INSTALLER - HYBRID EDITION            ║" -ForegroundColor Cyan
    Write-Host "║                                                           ║" -ForegroundColor Cyan
    Write-Host "║  Real-time Code Security & Compliance Analysis           ║" -ForegroundColor Cyan
    Write-Host "║  Supports: GitHub Copilot OR Bring Your Own Key          ║" -ForegroundColor Cyan
    Write-Host "║                                                           ║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    if ($Uninstall) {
        Uninstall-Guardrail
        return
    }
    
    Test-Prerequisites
    Install-GuardrailService
    Detect-Provider
    Install-ServiceAsWindowsService
    Install-VSCodeExtension
    Show-CompletionMessage
}

# Run installer
Main
