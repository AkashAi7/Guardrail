# Code Guardrail - Installation Verification Script
# Run this after installation to verify everything is working

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Code Guardrail - Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# 1. Check VS Code
Write-Host "1. Checking VS Code..." -NoNewline
try {
    $vscodeVersion = code --version 2>$null | Select-Object -First 1
    Write-Host " ✅ v$vscodeVersion" -ForegroundColor Green
} catch {
    Write-Host " ❌ NOT FOUND" -ForegroundColor Red
    $allPassed = $false
}

# 2. Check Extension Installation
Write-Host "2. Checking Extension..." -NoNewline
$extensions = code --list-extensions 2>$null
if ($extensions -match "code-guardrail") {
    $extName = $extensions | Select-String "guardrail"
    Write-Host " ✅ $extName" -ForegroundColor Green
} else {
    Write-Host " ❌ NOT INSTALLED" -ForegroundColor Red
    $allPassed = $false
}

# 3. Check Extension Version
Write-Host "3. Checking Extension Version..." -NoNewline
$extDir = Get-ChildItem "$env:USERPROFILE\.vscode\extensions" -ErrorAction SilentlyContinue | Where-Object Name -like "*guardrail*"
if ($extDir) {
    $version = ($extDir.Name -split '-')[-1]
    if ($version -ge "0.4.0") {
        Write-Host " ✅ v$version (Latest)" -ForegroundColor Green
    } else {
        Write-Host " ⚠️ v$version (Outdated - should be 0.4.0+)" -ForegroundColor Yellow
        Write-Host "   Run: code --uninstall-extension akashai7.code-guardrail" -ForegroundColor Yellow
        Write-Host "   Then reinstall using the installer" -ForegroundColor Yellow
        $allPassed = $false
    }
} else {
    Write-Host " ❌ NOT FOUND" -ForegroundColor Red
    $allPassed = $false
}

# 4. Check Extension Files
Write-Host "4. Checking Extension Files..." -NoNewline
if ($extDir) {
    $outDir = Join-Path $extDir.FullName "out"
    $extensionJs = Join-Path $outDir "extension.js"
    $scannerJs = Join-Path $outDir "scanner.js"
    
    if ((Test-Path $extensionJs) -and (Test-Path $scannerJs)) {
        Write-Host " ✅ All files present" -ForegroundColor Green
    } else {
        Write-Host " ❌ Missing compiled files" -ForegroundColor Red
        Write-Host "   Extension may not be properly built" -ForegroundColor Yellow
        $allPassed = $false
    }
} else {
    Write-Host " ⏭️ Skipped (extension not found)" -ForegroundColor Gray
}

# 5. Check Node Modules (Dependencies)
Write-Host "5. Checking Dependencies..." -NoNewline
if ($extDir) {
    $nodeModules = Join-Path $extDir.FullName "node_modules"
    if (Test-Path $nodeModules) {
        $mammoth = Test-Path (Join-Path $nodeModules "mammoth")
        $pdfParse = Test-Path (Join-Path $nodeModules "pdf-parse")
        
        if ($mammoth -and $pdfParse) {
            Write-Host " ✅ All dependencies installed" -ForegroundColor Green
        } else {
            Write-Host " ⚠️ Some dependencies missing" -ForegroundColor Yellow
            $allPassed = $false
        }
    } else {
        Write-Host " ⚠️ node_modules not found" -ForegroundColor Yellow
        $allPassed = $false
    }
} else {
    Write-Host " ⏭️ Skipped (extension not found)" -ForegroundColor Gray
}

# 6. Create Test File
Write-Host "6. Creating Test File..." -NoNewline
$testFile = "$env:TEMP\guardrail-test.ts"
$testContent = @"
// Guardrail Test File
const password = "admin123";
const apiKey = "sk-1234567890abcdefghij";
"@

try {
    $testContent | Out-File -FilePath $testFile -Encoding UTF8
    Write-Host " ✅ Created at $testFile" -ForegroundColor Green
} catch {
    Write-Host " ❌ Failed to create test file" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "  ✅ VERIFICATION PASSED" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Open VS Code" -ForegroundColor White
    Write-Host "   2. Open the test file:" -ForegroundColor White
    Write-Host "      code $testFile" -ForegroundColor Yellow
    Write-Host "   3. Check bottom-left status bar for: 🛡️ Guardrail" -ForegroundColor White
    Write-Host "   4. After opening, you should see 2 red squiggles" -ForegroundColor White
    Write-Host "   5. Press Ctrl+Shift+M to see issues in Problems panel" -ForegroundColor White
    Write-Host ""
    
    $openNow = Read-Host "Open test file in VS Code now? (Y/n)"
    if ($openNow -ne 'n' -and $openNow -ne 'N') {
        code $testFile
        Write-Host ""
        Write-Host "✅ Opened test file. Look for:" -ForegroundColor Green
        Write-Host "   - 🛡️ Shield icon in status bar (bottom-left)" -ForegroundColor Yellow
        Write-Host "   - Red squiggles under 'admin123' and 'sk-1234567890abcdefghij'" -ForegroundColor Yellow
        Write-Host "   - Issues in Problems panel (Ctrl+Shift+M)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️ VERIFICATION FAILED" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "❌ Some checks failed. Common solutions:" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 If extension not installed:" -ForegroundColor Cyan
    Write-Host "   iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 If wrong version installed:" -ForegroundColor Cyan
    Write-Host "   code --uninstall-extension akashai7.code-guardrail" -ForegroundColor White
    Write-Host "   iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 If files missing:" -ForegroundColor Cyan
    Write-Host "   cd `"$($extDir.FullName)`"" -ForegroundColor White
    Write-Host "   npm install" -ForegroundColor White
    Write-Host "   npm run compile" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 For detailed troubleshooting:" -ForegroundColor Cyan
    Write-Host "   https://github.com/AkashAi7/Guardrail/blob/main/TROUBLESHOOTING.md" -ForegroundColor White
}

Write-Host ""
Write-Host "📊 Diagnostic Summary:" -ForegroundColor Cyan
Write-Host "   Extension Directory: $($extDir.FullName)" -ForegroundColor Gray
Write-Host "   Test File Location: $testFile" -ForegroundColor Gray
Write-Host ""

# Cleanup prompt
$cleanup = Read-Host "Delete test file? (Y/n)"
if ($cleanup -ne 'n' -and $cleanup -ne 'N') {
    Remove-Item $testFile -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Test file deleted" -ForegroundColor Green
}

Write-Host ""
