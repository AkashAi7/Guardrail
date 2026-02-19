# Script to bundle service with extension for standalone distribution
# This allows the extension to work without cloning the repo

Write-Host "📦 Bundling service with extension..." -ForegroundColor Cyan

$extensionDir = $PSScriptRoot
$serviceSourceDir = Join-Path (Split-Path $extensionDir -Parent) "service"
$bundledServiceDir = Join-Path $extensionDir "bundled-service"

# Check if service exists and is built
$serviceDistDir = Join-Path $serviceSourceDir "dist"
if (-not (Test-Path $serviceDistDir)) {
    Write-Host "❌ Service not built. Please run:" -ForegroundColor Red
    Write-Host "   cd ../service" -ForegroundColor Yellow
    Write-Host "   npm install" -ForegroundColor Yellow
    Write-Host "   npm run build" -ForegroundColor Yellow
    exit 1
}

# Clean and create bundled service directory
if (Test-Path $bundledServiceDir) {
    Remove-Item $bundledServiceDir -Recurse -Force
}
New-Item -ItemType Directory -Path $bundledServiceDir -Force | Out-Null

Write-Host "  Copying service files..." -ForegroundColor Gray

# Copy essential files
Copy-Item "$serviceSourceDir/dist" -Destination "$bundledServiceDir/dist" -Recurse
Copy-Item "$serviceSourceDir/package.json" -Destination "$bundledServiceDir/package.json"

# Copy governance rules (relative path from service)
$governanceSource = Join-Path (Split-Path $serviceSourceDir -Parent) "governance"
if (Test-Path $governanceSource) {
    Copy-Item $governanceSource -Destination "$bundledServiceDir/governance" -Recurse
    Write-Host "  ✅ Copied governance rules" -ForegroundColor Green
}

Write-Host "✅ Service bundled successfully!" -ForegroundColor Green
Write-Host "   Location: $bundledServiceDir" -ForegroundColor Gray
Write-Host ""
Write-Host "Now you can package the extension with:" -ForegroundColor Yellow
Write-Host "   npx @vscode/vsce package" -ForegroundColor Cyan
