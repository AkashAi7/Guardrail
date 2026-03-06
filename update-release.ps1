#!/usr/bin/env pwsh
# Update v0.7.0-standalone release with fixed VSIX

$owner = "AkashAi7"
$repo = "Guardrail"
$tag = "v0.7.0-standalone"
$vsixPath = "C:\Users\akashdwivedi\OneDrive - Microsoft\Desktop\IntrestingIdeas\Guardrail\release\code-guardrail-standalone.vsix"
$assetName = "code-guardrail-standalone.vsix"

Write-Host "🔄 Updating GitHub release $tag..." -ForegroundColor Cyan

# Check if GitHub CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) not found. Installing..." -ForegroundColor Red
    winget install --id GitHub.cli
    Write-Host "✅ GitHub CLI installed. Please close and reopen PowerShell, then run this script again." -ForegroundColor Green
    exit 0
}

# Check authentication
Write-Host "Checking GitHub authentication..." -ForegroundColor Yellow
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated with GitHub. Running authentication..." -ForegroundColor Red
    gh auth login
}

# Delete old asset
Write-Host "🗑️ Removing old asset..." -ForegroundColor Yellow
gh release delete-asset "$owner/$repo" $tag $assetName --yes 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Old asset deleted" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No existing asset to delete (this is fine)" -ForegroundColor Gray
}

# Upload new asset
Write-Host "📤 Uploading fixed VSIX..." -ForegroundColor Yellow
gh release upload "$owner/$repo" $tag $vsixPath --clobber

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Release updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Installation command now works:" -ForegroundColor Cyan
    Write-Host "irm https://github.com/$owner/$repo/releases/download/$tag/$assetName -OutFile `"`$env:TEMP\guardrail.vsix`"; code --install-extension `"`$env:TEMP\guardrail.vsix`"" -ForegroundColor White
} else {
    Write-Host "❌ Failed to upload asset" -ForegroundColor Red
    exit 1
}
