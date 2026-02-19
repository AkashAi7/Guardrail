# Debugging Extension on Fresh Machine

## Immediate Checks to Run

### 1. Check Extension Activation in Developer Console

Press `Ctrl+Shift+I` in VS Code, then run in Console:

```javascript
// Check if extension is loaded
const ext = vscode.extensions.getExtension('akashai7.code-guardrail');
console.log('Extension found:', ext !== undefined);
console.log('Extension active:', ext?.isActive);
console.log('Extension version:', ext?.packageJSON?.version);

// Check activation event
if (ext && !ext.isActive) {
    console.log('Extension not active - trying to activate...');
    ext.activate().then(() => {
        console.log('Manual activation succeeded');
    }).catch(err => {
        console.log('Manual activation failed:', err);
    });
}
```

### 2. Check Extension Output Logs

1. Press `Ctrl+Shift+U` (Output panel)
2. Select "Code Guardrail" from dropdown
3. Look for:
   - ✅ "Code Guardrail activating..."
   - ✅ "Code Guardrail activated successfully"
   - ❌ Any error messages

### 3. Check Diagnostic Collection

In Developer Console (`Ctrl+Shift+I`):

```javascript
// Check if diagnostics are being collected
vscode.languages.getDiagnostics().forEach(([uri, diagnostics]) => {
    console.log('File:', uri.fsPath);
    console.log('Diagnostics:', diagnostics.length);
    diagnostics.forEach(d => {
        console.log('  -', d.source, ':', d.message);
    });
});
```

### 4. Force Extension Reload

Press `Ctrl+Shift+P` and run:
- "Developer: Reload Window"

After reload, save the file again (`Ctrl+S`)

### 5. Check Extension Files Exist

Run in PowerShell:

```powershell
# Find extension directory
$extDir = Get-ChildItem "$env:USERPROFILE\.vscode\extensions" | Where-Object Name -like "*guardrail*"
Write-Host "Extension directory: $($extDir.FullName)"

# Check critical files
$files = @(
    "out\extension.js",
    "out\scanner.js",
    "out\ruleParser.js",
    "package.json"
)

foreach ($file in $files) {
    $fullPath = Join-Path $extDir.FullName $file
    $exists = Test-Path $fullPath
    $status = if ($exists) { "✅" } else { "❌" }
    Write-Host "$status $file"
}
```

### 6. Manually Trigger Analysis

In VS Code:
1. Press `Ctrl+Shift+P`
2. Type: "Code Guardrail: Analyze Current File"
3. If command doesn't appear → Extension not registered
4. If command appears but does nothing → Check console for errors

### 7. Check Status Bar

Look at bottom-left of VS Code:
- **Should see:** 🛡️ Guardrail: Ready (or with issue count)
- **If missing:** Extension didn't activate properly

Click the shield icon if visible and select "Test with Sample Code"

---

## Common Issues on Fresh Machines

### Issue 1: Extension Compiled Code Missing

**Symptom:** Extension installed but `out/` folder is empty or missing

**Fix:**
```powershell
cd "$env:USERPROFILE\.vscode\extensions\*guardrail*"
npm install
npm run compile
```

Then reload VS Code

### Issue 2: Wrong Package Structure

**Symptom:** VSIX unpacked incorrectly

**Fix:**
```powershell
# Uninstall
code --uninstall-extension akashai7.code-guardrail

# Reinstall from local VSIX
code --install-extension "c:\path\to\code-guardrail-0.4.0.vsix" --force
```

### Issue 3: VS Code Not Recognizing Extension

**Symptom:** Extension shows in list but never activates

**Check:**
```powershell
# Check extension is properly registered
code --list-extensions --show-versions | Select-String "guardrail"
```

**Fix:**
```powershell
# Reload extensions
code --disable-extension akashai7.code-guardrail
code --enable-extension akashai7.code-guardrail
```

### Issue 4: File Type Not Supported

**Symptom:** Works in some files but not others

**Check:** File extension should be one of:
- .ts, .tsx, .js, .jsx (TypeScript/JavaScript)
- .py (Python)
- .java (Java)
- .cs (C#)
- .go (Go)
- .rb (Ruby)
- .php (PHP)

Your `testdemo.ts` should be supported.

---

## Step-by-Step Debugging Process

Execute these in order on the fresh machine:

### Step 1: Verify Installation
```powershell
code --list-extensions | Select-String "guardrail"
# Expected: akashai7.code-guardrail
```

### Step 2: Check Extension Directory
```powershell
$extDir = Get-ChildItem "$env:USERPROFILE\.vscode\extensions" | Where-Object Name -like "*guardrail*"
Write-Host $extDir.FullName
Get-ChildItem $extDir.FullName
```

### Step 3: Check package.json
```powershell
$extDir = Get-ChildItem "$env:USERPROFILE\.vscode\extensions" | Where-Object Name -like "*guardrail*"
Get-Content "$($extDir.FullName)\package.json" | ConvertFrom-Json | Select-Object name, version, main
```

Expected:
- name: "code-guardrail"
- version: "0.4.0"
- main: "./out/extension.js"

### Step 4: Verify Compiled Files
```powershell
$extDir = Get-ChildItem "$env:USERPROFILE\.vscode\extensions" | Where-Object Name -like "*guardrail*"
Test-Path "$($extDir.FullName)\out\extension.js"
Test-Path "$($extDir.FullName)\out\scanner.js"
```

Both should return `True`

### Step 5: Check File Size
```powershell
$extDir = Get-ChildItem "$env:USERPROFILE\.vscode\extensions" | Where-Object Name -like "*guardrail*"
Get-ChildItem "$($extDir.FullName)\out\*.js" | Select-Object Name, Length
```

Expected:
- extension.js: ~18-20 KB
- scanner.js: ~12-14 KB

If files are 0 bytes or missing → **Extension wasn't compiled**

---

## Quick Fix: Recompile Extension

If `out/` files are missing or corrupted:

```powershell
# Navigate to extension directory
$extDir = Get-ChildItem "$env:USERPROFILE\.vscode\extensions" | Where-Object Name -like "*guardrail*"
cd $extDir.FullName

# Install dependencies
npm install

# Compile TypeScript
npx tsc -p ./

# Verify compilation
Get-ChildItem .\out\
```

Then **restart VS Code**.

---

## Nuclear Option: Clean Reinstall

If nothing works:

```powershell
# 1. Completely remove extension
code --uninstall-extension akashai7.code-guardrail
Remove-Item "$env:USERPROFILE\.vscode\extensions\*guardrail*" -Recurse -Force -ErrorAction SilentlyContinue

# 2. Close ALL VS Code instances
Get-Process code | Stop-Process -Force

# 3. Download fresh VSIX
$vsixUrl = "https://github.com/AkashAi7/Guardrail/releases/download/v0.4.0/code-guardrail-0.4.0.vsix"
$vsixFile = "$env:TEMP\code-guardrail-0.4.0.vsix"
Invoke-WebRequest -Uri $vsixUrl -OutFile $vsixFile

# 4. Install from VSIX
code --install-extension $vsixFile --force

# 5. Wait a moment
Start-Sleep -Seconds 3

# 6. Verify
code --list-extensions | Select-String "guardrail"

# 7. Open VS Code and test
code .
```

---

## Collect Diagnostic Information

Run this and share the output:

```powershell
$extDir = Get-ChildItem "$env:USERPROFILE\.vscode\extensions" | Where-Object Name -like "*guardrail*"

Write-Host "=== Code Guardrail Diagnostic ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Extension Installed:" -ForegroundColor Yellow
code --list-extensions | Select-String "guardrail"
Write-Host ""
Write-Host "Extension Directory:" -ForegroundColor Yellow
Write-Host $extDir.FullName
Write-Host ""
Write-Host "Extension Version:" -ForegroundColor Yellow
$pkg = Get-Content "$($extDir.FullName)\package.json" -Raw | ConvertFrom-Json
Write-Host "  Name: $($pkg.name)"
Write-Host "  Version: $($pkg.version)"
Write-Host "  Main: $($pkg.main)"
Write-Host ""
Write-Host "Compiled Files:" -ForegroundColor Yellow
Get-ChildItem "$($extDir.FullName)\out\*.js" -ErrorAction SilentlyContinue | ForEach-Object {
    $size = [math]::Round($_.Length / 1KB, 2)
    Write-Host "  ✓ $($_.Name) - $size KB"
}
Write-Host ""
Write-Host "Node Modules:" -ForegroundColor Yellow
$nodeModules = Test-Path "$($extDir.FullName)\node_modules"
Write-Host "  Exists: $nodeModules"
if ($nodeModules) {
    $mammoth = Test-Path "$($extDir.FullName)\node_modules\mammoth"
    $pdfParse = Test-Path "$($extDir.FullName)\node_modules\pdf-parse"
    Write-Host "  mammoth: $mammoth"
    Write-Host "  pdf-parse: $pdfParse"
}
```

---

## What Should Happen When Working

When functioning correctly:

1. **On VS Code startup:**
   - Shield icon (🛡️) appears in status bar
   - Status bar shows "Guardrail: Ready"

2. **When opening .ts/.js file with security issues:**
   - File is scanned immediately
   - Red squiggles appear under issues
   - Status bar updates with issue count
   - Problems panel (Ctrl+Shift+M) shows issues

3. **Expected for your testdemo.ts:**
   - Should detect 4-5 issues:
     - Hardcoded password: "admin123"
     - Hardcoded API key: "sk-1234567890"
     - Hardcoded email (if rule enabled)
     - Hardcoded phone number (if rule enabled)

If NONE of this is happening → Extension activation failed.
