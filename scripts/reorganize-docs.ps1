# Reorganize documentation structure
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Documentation Reorganization" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create new directory structure
$dirs = @(
    "docs/design",
    "docs/distribution",
    "docs/internal",
    "docs/archive"
)

Write-Host "Creating directory structure..." -ForegroundColor Cyan
foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✓ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  ○ Exists: $dir" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Moving design documents..." -ForegroundColor Cyan
$designDocs = @(
    "DESIGN_BRAINSTORM.md",
    "WORKFLOW_SEQUENCE.md",
    "QUICK_START_IMPLEMENTATION.md",
    "RULES_LIBRARY_EXAMPLES.md",
    "HYBRID_IMPLEMENTATION.md"
)

foreach ($doc in $designDocs) {
    if (Test-Path $doc) {
        Move-Item $doc "docs/design/" -Force
        Write-Host "  ✓ $doc" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Moving distribution documents..." -ForegroundColor Cyan
$distDocs = @(
    "START_HERE_DISTRIBUTION.md",
    "DISTRIBUTION_GUIDE.md",
    "DISTRIBUTION_DECISION.md",
    "DISTRIBUTION_SUMMARY.md",
    "SHARING_TEMPLATES.md",
    "GITHUB_RELEASES.md",
    "GITHUB_SETUP.md",
    "MARKETPLACE_PUBLISHING.md",
    "RELEASE_GUIDE.md",
    "VS_CODE_MARKETPLACE.md"
)

foreach ($doc in $distDocs) {
    if (Test-Path $doc) {
        Move-Item $doc "docs/distribution/" -Force
        Write-Host "  ✓ $doc" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Moving internal/development documents..." -ForegroundColor Cyan
$internalDocs = @(
    "IMPLEMENTATION_SUMMARY.md",
    "FIX_SUMMARY.md",
    "FIXES.md",
    "DEBUG_FRESH_MACHINE.md",
    "CREATE_RELEASE_STEPS.md",
    "INSTALLATION_COMPLETE.md",
    "WINDOWS_TROUBLESHOOTING.md",
    "SDK_INTEGRATION.md"
)

foreach ($doc in $internalDocs) {
    if (Test-Path $doc) {
        Move-Item $doc "docs/internal/" -Force
        Write-Host "  ✓ $doc" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Archiving obsolete documents..." -ForegroundColor Cyan
$archiveDocs = @(
    "AUTO_INSTALL_FEATURE.md",
    "DISTRIBUTION.md",
    "QUICK_INSTALL.md",
    "QUICK_REFERENCE.md",
    "RELEASE_READY.md",
    "SHARE_WITH_USERS.md",
    "QUICKSTART.md",
    "DEMO.ts"
)

foreach ($doc in $archiveDocs) {
    if (Test-Path $doc) {
        Move-Item $doc "docs/archive/" -Force
        Write-Host "  ✓ $doc" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ Documentation Reorganized!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "User-facing docs in root:" -ForegroundColor Cyan
Write-Host "  ✓ README.md" -ForegroundColor White
Write-Host "  ✓ INSTALL.md" -ForegroundColor White
Write-Host "  ✓ GETTING_STARTED.md" -ForegroundColor White
Write-Host "  ✓ TROUBLESHOOTING.md" -ForegroundColor White
Write-Host "  ✓ RELEASE_NOTES_v0.4.0.md" -ForegroundColor White
Write-Host ""
Write-Host "Developer docs moved to:" -ForegroundColor Cyan
Write-Host "  → docs/design/" -ForegroundColor White
Write-Host "  → docs/distribution/" -ForegroundColor White
Write-Host "  → docs/internal/" -ForegroundColor White
Write-Host "  → docs/archive/" -ForegroundColor White
Write-Host ""
