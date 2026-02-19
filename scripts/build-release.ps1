# Code Guardrail - Release Build Script
# Creates distribution packages for GitHub Releases

param(
    [string]$Version = "0.1.0"
)

$ErrorActionPreference = "Stop"

$RELEASE_DIR = ".\release"
$SERVICE_DIR = ".\service"
$EXTENSION_DIR = ".\extension"
$GOVERNANCE_DIR = ".\governance"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Code Guardrail Release Builder v$Version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Clean previous release
if (Test-Path $RELEASE_DIR) {
    Write-Host "Cleaning previous release..." -ForegroundColor Yellow
    Remove-Item $RELEASE_DIR -Recurse -Force
}

New-Item -ItemType Directory -Path $RELEASE_DIR -Force | Out-Null
Write-Host "✅ Created release directory" -ForegroundColor Green

# ============================================
# Build Service
# ============================================
Write-Host ""
Write-Host "📦 Building Service..." -ForegroundColor Cyan

Set-Location $SERVICE_DIR

# Install dependencies (including dev for build)
Write-Host "  Installing dependencies..."
npm install | Out-Null

# Build TypeScript
Write-Host "  Compiling TypeScript..."
npm run build | Out-Null

# Remove dev dependencies after build
Write-Host "  Cleaning dev dependencies..."
npm prune --production | Out-Null

# Create service package directory
$servicePackageDir = "..\$RELEASE_DIR\guardrail-service"
New-Item -ItemType Directory -Path $servicePackageDir -Force | Out-Null

# Copy necessary files
Write-Host "  Packaging service files..."
Copy-Item -Path "dist" -Destination "$servicePackageDir\dist" -Recurse
Copy-Item -Path "node_modules" -Destination "$servicePackageDir\node_modules" -Recurse
Copy-Item -Path "package.json" -Destination "$servicePackageDir\"
Copy-Item -Path ".env.example" -Destination "$servicePackageDir\"
Copy-Item -Path "README.md" -Destination "$servicePackageDir\"

# Copy governance rules
Copy-Item -Path "..\$GOVERNANCE_DIR" -Destination "$servicePackageDir\governance" -Recurse

# Create startup script
$startScript = @"
@echo off
echo Starting Code Guardrail Service...
node dist/index.js
"@
$startScript | Set-Content "$servicePackageDir\start.bat"

# Create install script
$installScript = @"
@echo off
echo Code Guardrail Service Setup
echo ============================
echo.

REM Copy .env if it doesn't exist
if not exist .env (
    copy .env.example .env
    echo ✓ Created .env configuration file
) else (
    echo ✓ .env already exists
)

echo.
echo Setup complete! Start the service with:
echo   start.bat
echo.
pause
"@
$installScript | Set-Content "$servicePackageDir\install.bat"

Write-Host "✅ Service packaged" -ForegroundColor Green

Set-Location ..

# ============================================
# Build Extension
# ============================================
Write-Host ""
Write-Host "📦 Building Extension..." -ForegroundColor Cyan

Set-Location $EXTENSION_DIR

# Install dependencies
Write-Host "  Installing dependencies..."
npm install | Out-Null

# Compile TypeScript
Write-Host "  Compiling TypeScript..."
npm run compile | Out-Null

# Package extension
Write-Host "  Packaging extension..."
npx @vscode/vsce package --no-dependencies | Out-Null

# Copy VSIX to release directory
$vsixFile = Get-ChildItem "*.vsix" | Select-Object -First 1
Copy-Item $vsixFile.FullName -Destination "..\$RELEASE_DIR\"

Write-Host "✅ Extension packaged: $($vsixFile.Name)" -ForegroundColor Green

Set-Location ..

# ============================================
# Copy Additional Documentation
# ============================================
Write-Host ""
Write-Host "📄 Copying documentation..." -ForegroundColor Cyan

# Copy installation instructions to release folder
Copy-Item "release\INSTALLATION_INSTRUCTIONS.txt" -Destination "$RELEASE_DIR\" -ErrorAction SilentlyContinue
Copy-Item "SHARE_WITH_USERS.md" -Destination "$RELEASE_DIR\" -ErrorAction SilentlyContinue
Copy-Item "README.md" -Destination "$RELEASE_DIR\" -ErrorAction SilentlyContinue
Copy-Item "LICENSE" -Destination "$RELEASE_DIR\" -ErrorAction SilentlyContinue

Write-Host "✅ Documentation copied" -ForegroundColor Green

# ============================================
# Create ZIP Archives
# ============================================
Write-Host ""
Write-Host "📦 Creating ZIP archives..." -ForegroundColor Cyan

# Service ZIP
Write-Host "  Creating guardrail-service-v$Version.zip..."
Compress-Archive -Path "$RELEASE_DIR\guardrail-service\*" `
                 -DestinationPath "$RELEASE_DIR\guardrail-service-v$Version.zip" `
                 -Force

# Get file sizes
$serviceZipSize = (Get-Item "$RELEASE_DIR\guardrail-service-v$Version.zip").Length / 1MB
$extensionSize = (Get-Item "$RELEASE_DIR\code-guardrail-0.1.0.vsix").Length / 1KB

Write-Host "✅ Archives created" -ForegroundColor Green

# ============================================
# Create Release Notes
# ============================================
Write-Host ""
Write-Host "📝 Generating release notes..." -ForegroundColor Cyan

$releaseNotes = @"
# Code Guardrail v$Version

**Real-time Intelligent Code Analysis powered by GitHub Copilot SDK**

---

## 🚀 Installation

### Quick Install (Recommended)

**Windows:**
``````powershell
iwr -useb https://github.com/AkashAi7/Guardrail/releases/download/v$Version/install.ps1 | iex
``````

**macOS/Linux:**
``````bash
curl -fsSL https://github.com/AkashAi7/Guardrail/releases/download/v$Version/install.sh | bash
``````

### Manual Install

1. **Download Service:** ``guardrail-service-v$Version.zip`` ($([math]::Round($serviceZipSize, 2)) MB)
2. **Download Extension:** ``code-guardrail-0.1.0.vsix`` ($([math]::Round($extensionSize, 2)) KB)

**Setup:**
``````bash
# Extract service
unzip guardrail-service-v$Version.zip -d ~/.guardrail

# Install extension
code --install-extension code-guardrail-0.1.0.vsix

# Start service
cd ~/.guardrail
npm start
``````

---

## ✨ Features

- ✅ **Real-time Security Analysis** - Catch vulnerabilities as you code
- ✅ **Compliance Checking** - GDPR, HIPAA, SOC2, PCI-DSS
- ✅ **Best Practices Enforcement** - Framework conventions, code quality
- ✅ **Hybrid Mode** - Works with GitHub Copilot OR your own API keys
- ✅ **Zero Configuration** - Auto-detects and configures automatically

---

## 📋 What's Included

### Service Package (``guardrail-service-v$Version.zip``)
- Pre-built backend service
- All dependencies included
- Governance rules library
- Configuration templates
- Startup scripts

### VS Code Extension (``code-guardrail-0.1.0.vsix``)
- VS Code extension
- One-click installation
- Real-time diagnostics
- Quick fixes
- Status bar integration

---

## 🎯 Quick Start

1. **Install** using one-line command above
2. **Start Service**: The installer will start it automatically
3. **Test**: Open any TypeScript/JavaScript file, add:
   ``````typescript
   const password = "admin123";
   const apiKey = "sk-1234567890";
   ``````
4. **Save** → See red squiggles appear! ✨

---

## 📚 Documentation

- [Installation Guide](https://github.com/AkashAi7/Guardrail/blob/main/INSTALL.md)
- [Quick Start](https://github.com/AkashAi7/Guardrail#quick-start-5-minutes)
- [Configuration](https://github.com/AkashAi7/Guardrail/blob/main/service/.env.example)
- [Governance Rules](https://github.com/AkashAi7/Guardrail/tree/main/governance)

---

## 🔧 Requirements

- **Node.js** 18 or higher
- **VS Code** 1.80 or higher
- **Operating System:** Windows 10+, macOS 10.15+, or Linux

**Optional:**
- GitHub Copilot (for free LLM) OR
- OpenAI API Key / Anthropic API Key (for BYOK mode)

---

## 🐛 Issues & Feedback

- [Report Issues](https://github.com/AkashAi7/Guardrail/issues)
- [Discussions](https://github.com/AkashAi7/Guardrail/discussions)

---

## 📊 Checksums

**SHA256:**
``````
guardrail-service-v$Version.zip:
$(Get-FileHash "$RELEASE_DIR\guardrail-service-v$Version.zip" -Algorithm SHA256 | Select-Object -ExpandProperty Hash)

code-guardrail-0.1.0.vsix:
$(Get-FileHash "$RELEASE_DIR\code-guardrail-0.1.0.vsix" -Algorithm SHA256 | Select-Object -ExpandProperty Hash)
``````

---

**Full Changelog:** [CHANGELOG.md](https://github.com/AkashAi7/Guardrail/blob/main/CHANGELOG.md)
"@

$releaseNotes | Set-Content "$RELEASE_DIR\RELEASE_NOTES.md"

Write-Host "✅ Release notes generated" -ForegroundColor Green

# ============================================
# Summary
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Release Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Release artifacts created in: $RELEASE_DIR" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Files:" -ForegroundColor Yellow
Write-Host "  • guardrail-service-v$Version.zip ($([math]::Round($serviceZipSize, 2)) MB)"
Write-Host "  • code-guardrail-0.1.0.vsix ($([math]::Round($extensionSize, 2)) KB)"
Write-Host "  • RELEASE_NOTES.md"
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Create GitHub release: https://github.com/AkashAi7/Guardrail/releases/new"
Write-Host "  2. Tag: v$Version"
Write-Host "  3. Upload: release/guardrail-service-v$Version.zip"
Write-Host "  4. Upload: release/code-guardrail-0.1.0.vsix"
Write-Host "  5. Copy: release/RELEASE_NOTES.md → Release description"
Write-Host "  6. Publish release"
Write-Host ""
Write-Host "Or run: .\scripts\create-github-release.ps1" -ForegroundColor Cyan
Write-Host ""
