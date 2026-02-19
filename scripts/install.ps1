# Code Guardrail - Installation Script (Windows PowerShell)
# ==========================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║       🛡️  GUARDRAIL INSTALLER - DEVELOPMENT MODE 🛡️         ║" -ForegroundColor Cyan -BackgroundColor Black
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║   Real-time Code Security & Compliance Analysis               ║" -ForegroundColor Cyan
Write-Host "║   Supports: GitHub Copilot OR Bring Your Own Key              ║" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking Prerequisites" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node -v
    $versionNumber = [int]($nodeVersion -replace 'v|\..*', '')
    
    if ($versionNumber -lt 18) {
        Write-Host "  ✗ " -ForegroundColor Red -NoNewline
        Write-Host "Node.js version must be 18+ (current: $nodeVersion)" -ForegroundColor White
        Write-Host "    → Install from: " -ForegroundColor Yellow -NoNewline
        Write-Host "https://nodejs.org/" -ForegroundColor Cyan
        exit 1
    }
    Write-Host "  ✓ " -ForegroundColor Green -NoNewline
    Write-Host "Node.js $nodeVersion" -ForegroundColor White
}
catch {
    Write-Host "  ✗ " -ForegroundColor Red -NoNewline
    Write-Host "Node.js is not installed" -ForegroundColor White
    Write-Host "    → Install from: " -ForegroundColor Yellow -NoNewline
    Write-Host "https://nodejs.org/" -ForegroundColor Cyan
    exit 1
}

# Check npm
try {
    $npmVersion = npm -v
    Write-Host "  ✓ " -ForegroundColor Green -NoNewline
    Write-Host "npm $npmVersion" -ForegroundColor White
}
catch {
    Write-Host "  ✗ " -ForegroundColor Red -NoNewline
    Write-Host "npm is not installed" -ForegroundColor White
    exit 1
}

# Check VS Code
$hasVSCode = $false
try {
    $codeVersion = (code --version)[0]
    Write-Host "  ✓ " -ForegroundColor Green -NoNewline
    Write-Host "VS Code $codeVersion" -ForegroundColor White
    $hasVSCode = $true
}
catch {
    Write-Host "  ⚠ " -ForegroundColor Yellow -NoNewline
    Write-Host "VS Code CLI not found (extension installation will be manual)" -ForegroundColor White
}

Write-Host ""

# Install service
Write-Host "📦 Installing Backend Service" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Set-Location service

if (Test-Path ".env") {
    Write-Host "  ⚠  .env file already exists, skipping..." -ForegroundColor Yellow
}
else {
    Write-Host "  → Creating .env file from template..." -ForegroundColor Blue
    Copy-Item .env.example .env
}

Write-Host "  → Installing dependencies..." -ForegroundColor Blue
npm install | Out-Null

Write-Host "  → Building TypeScript..." -ForegroundColor Blue
npm run build | Out-Null

Write-Host "  ✓ Service installed successfully" -ForegroundColor Green
Write-Host ""

# Install extension
Write-Host "🔌 Installing VS Code Extension" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Set-Location ../extension

Write-Host "  → Installing dependencies..." -ForegroundColor Blue
npm install | Out-Null

Write-Host "  → Compiling TypeScript..." -ForegroundColor Blue
npm run compile | Out-Null

Write-Host "  → Packaging extension..." -ForegroundColor Blue
npm run package | Out-Null

$vsixFile = (Get-ChildItem -Filter "*.vsix" | Select-Object -First 1).Name

if ($hasVSCode) {
    Write-Host "  → Installing extension in VS Code..." -ForegroundColor Blue
    code --install-extension $vsixFile --force | Out-Null
    Write-Host "  ✓ Extension installed successfully" -ForegroundColor Green
}
else {
    Write-Host "  ⚠  Manual installation required:" -ForegroundColor Yellow
    Write-Host "    → Open VS Code" -ForegroundColor Blue
    Write-Host "    → Go to Extensions view (Ctrl+Shift+X)" -ForegroundColor Blue
    Write-Host "    → Click '...' menu → Install from VSIX" -ForegroundColor Blue
    Write-Host "    → Select: $(Get-Location)\$vsixFile" -ForegroundColor Blue
}

Set-Location ..

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                               ║" -ForegroundColor Green
Write-Host "║              ✅  INSTALLATION COMPLETE! ✅                     ║" -ForegroundColor Green -BackgroundColor Black
Write-Host "║                                                               ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. " -ForegroundColor White -NoNewline
Write-Host "Start the service:" -ForegroundColor Yellow
Write-Host "   cd service" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. " -ForegroundColor White -NoNewline
Write-Host "Open VS Code and save any file to trigger analysis" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. " -ForegroundColor White -NoNewline
Write-Host "Or manually analyze with Ctrl+Shift+G" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  → Main README: " -ForegroundColor Blue -NoNewline
Write-Host "README.md" -ForegroundColor White
Write-Host "  → Service docs: " -ForegroundColor Blue -NoNewline
Write-Host "service\README.md" -ForegroundColor White
Write-Host "  → Extension docs: " -ForegroundColor Blue -NoNewline
Write-Host "extension\README.md" -ForegroundColor White
Write-Host "  → Governance rules: " -ForegroundColor Blue -NoNewline
Write-Host "governance\README.md" -ForegroundColor White
Write-Host ""
Write-Host "⚙️  Configuration:" -ForegroundColor Cyan
Write-Host "  → Service: " -ForegroundColor Blue -NoNewline
Write-Host "service\.env" -ForegroundColor White
Write-Host "  → VS Code: File → Preferences → Settings → Code Guardrail" -ForegroundColor Blue
Write-Host ""
Write-Host "💡 Tip: " -ForegroundColor Cyan -NoNewline
Write-Host "The service must be running for the extension to work." -ForegroundColor Yellow
Write-Host "    Use 'Code Guardrail: Start Local Service' from command palette." -ForegroundColor Blue
Write-Host ""
Write-Host "Happy coding! 🎉" -ForegroundColor Cyan
