# Script to bundle service with extension for standalone distribution
# This allows the extension to work without cloning the repo

Write-Host "📦 Bundling service with extension..." -ForegroundColor Cyan

$prepareScript = Join-Path $PSScriptRoot "scripts\prepare-bundle.js"
node $prepareScript

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "✅ Service bundled successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Now you can package the extension with:" -ForegroundColor Yellow
Write-Host '   npm run package' -ForegroundColor Cyan
