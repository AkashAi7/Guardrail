# Icon Generation Script for Code Guardrail Extension

# This script converts the SVG icon to PNG format required by VS Code Marketplace
# Requirements: Node.js, npm

Write-Host "🎨 Converting icon.svg to icon.png..." -ForegroundColor Cyan
Write-Host ""

$extensionDir = "$PSScriptRoot\..\extension"

# Check if sharp is installed
$sharpInstalled = Test-Path "$extensionDir\node_modules\sharp"

if (-not $sharpInstalled) {
    Write-Host "📦 Installing sharp (image conversion library)..." -ForegroundColor Yellow
    Set-Location $extensionDir
    npm install --save-dev sharp
}

# Convert SVG to PNG using Node.js and sharp
$convertScript = @"
const sharp = require('sharp');
const path = require('path');

const inputSvg = path.join(__dirname, 'icon.svg');
const outputPng = path.join(__dirname, 'icon.png');

sharp(inputSvg)
  .resize(128, 128)
  .png()
  .toFile(outputPng)
  .then(() => {
    console.log('✅ Icon converted successfully: icon.png');
    console.log('📏 Size: 128x128 pixels');
  })
  .catch(err => {
    console.error('❌ Error converting icon:', err);
    process.exit(1);
  });
"@

Set-Location $extensionDir
$convertScript | node

Write-Host ""
Write-Host "✨ Icon is ready for VS Code Marketplace!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review icon.png"
Write-Host "  2. Follow VS_CODE_MARKETPLACE.md for publishing"
Write-Host ""
