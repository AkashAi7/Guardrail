# Code Guardrail - Installation Script (Windows PowerShell)
# ==========================================================

$ErrorActionPreference = "Stop"

Write-Host "🛡️  Code Guardrail Installation Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node -v
    $versionNumber = [int]($nodeVersion -replace 'v|\..*', '')
    
    if ($versionNumber -lt 18) {
        Write-Host "❌ Node.js version must be 18 or higher (current: $nodeVersion)" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm
try {
    $npmVersion = npm -v
    Write-Host "✓ npm $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ npm is not installed" -ForegroundColor Red
    exit 1
}

# Check VS Code
$hasVSCode = $false
try {
    $codeVersion = (code --version)[0]
    Write-Host "✓ VS Code $codeVersion" -ForegroundColor Green
    $hasVSCode = $true
}
catch {
    Write-Host "⚠  VS Code CLI not found (extension installation will be manual)" -ForegroundColor Yellow
}

Write-Host ""

# Install service
Write-Host "📦 Installing Guardrail Service..." -ForegroundColor Cyan
Set-Location service

if (Test-Path ".env") {
    Write-Host "  .env file already exists, skipping..." -ForegroundColor Gray
}
else {
    Write-Host "  Creating .env file from template..." -ForegroundColor Gray
    Copy-Item .env.example .env
}

Write-Host "  Installing dependencies..." -ForegroundColor Gray
npm install | Out-Null

Write-Host "  Building TypeScript..." -ForegroundColor Gray
npm run build | Out-Null

Write-Host "✓ Service installed successfully" -ForegroundColor Green
Write-Host ""

# Install extension
Write-Host "📦 Installing VS Code Extension..." -ForegroundColor Cyan
Set-Location ../extension

Write-Host "  Installing dependencies..." -ForegroundColor Gray
npm install | Out-Null

Write-Host "  Compiling TypeScript..." -ForegroundColor Gray
npm run compile | Out-Null

Write-Host "  Packaging extension..." -ForegroundColor Gray
npm run package | Out-Null

$vsixFile = (Get-ChildItem -Filter "*.vsix" | Select-Object -First 1).Name

if ($hasVSCode) {
    Write-Host "  Installing extension in VS Code..." -ForegroundColor Gray
    code --install-extension $vsixFile --force | Out-Null
    Write-Host "✓ Extension installed successfully" -ForegroundColor Green
}
else {
    Write-Host "⚠  Manual installation required:" -ForegroundColor Yellow
    Write-Host "  1. Open VS Code" -ForegroundColor Gray
    Write-Host "  2. Go to Extensions view (Ctrl+Shift+X)" -ForegroundColor Gray
    Write-Host "  3. Click '...' menu → Install from VSIX" -ForegroundColor Gray
    Write-Host "  4. Select: $(Get-Location)\$vsixFile" -ForegroundColor Gray
}

Set-Location ..

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✓ Installation Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the service:" -ForegroundColor Yellow
Write-Host "   cd service" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Open VS Code and save any file to trigger analysis" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Or manually analyze with Ctrl+Shift+G" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  • Main README: README.md" -ForegroundColor Gray
Write-Host "  • Service docs: service\README.md" -ForegroundColor Gray
Write-Host "  • Extension docs: extension\README.md" -ForegroundColor Gray
Write-Host "  • Governance rules: governance\README.md" -ForegroundColor Gray
Write-Host ""
Write-Host "⚙️  Configuration:" -ForegroundColor Cyan
Write-Host "  • Service: service\.env" -ForegroundColor Gray
Write-Host "  • VS Code: File → Preferences → Settings → Code Guardrail" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Tip: The service must be running for the extension to work." -ForegroundColor Yellow
Write-Host "    Use 'Code Guardrail: Start Local Service' from command palette." -ForegroundColor Gray
Write-Host ""
Write-Host "Happy coding! 🎉" -ForegroundColor Cyan
