# 🔧 Code Guardrail Troubleshooting Guide

## Extension Not Showing Highlights/Issues

If the Code Guardrail extension is installed but you're not seeing any security highlights or issues:

### 1. Verify Extension is Installed and Active

**Check Installation:**
```powershell
# Windows PowerShell
code --list-extensions | Select-String "code-guardrail"

# Expected output: should show akashai7.code-guardrail or similar
```

**Check Extension Version:**
1. Open VS Code
2. Click Extensions icon (Ctrl+Shift+X)
3. Search for "Code Guardrail"
4. Verify it shows version **0.4.0** or higher
5. If version is 0.1.0 or lower, **uninstall** and reinstall using the latest installer

**Uninstall Old Version:**
```powershell
# Remove old extension
code --uninstall-extension akashai7.code-guardrail

# Remove old installation directory
Remove-Item "$env:USERPROFILE\.guardrail" -Recurse -Force
```

Then reinstall using:
```powershell
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex
```

### 2. Verify Extension Activation

**Check Status Bar:**
- Look at the bottom-left of VS Code window
- You should see: `🛡️ Guardrail: Ready` OR `⚠️ Guardrail: X issue(s)`
- If you don't see this, the extension is not activated

**Force Activation:**
1. Press `Ctrl+Shift+P` (Command Palette)
2. Type: `Code Guardrail: Show Menu`
3. If this command doesn't appear, the extension failed to activate

**Check Output Logs:**
1. Press `Ctrl+Shift+U` (Output panel)
2. Select "Code Guardrail" from the dropdown
3. Look for activation messages or errors
4. Common issues:
   - Missing dependencies (mammoth, pdf-parse)
   - File permission errors
   - TypeScript compilation errors

### 3. Test with Sample Code

**Create a Test File:**
1. Click the shield icon (🛡️) in status bar
2. Select "Test with Sample Code"
3. **Save the file** (Ctrl+S)
4. You should see red squiggles under security issues

**Manual Test:**
Create a new file `test.ts` with this content:
```typescript
const password = "admin123";
const apiKey = "sk-1234567890abcdefghij";
const query = "SELECT * FROM users WHERE id = '" + userId + "'";
document.getElementById('output').innerHTML = userInput;
```

**Expected Behavior:**
- After saving, you should see 4 issues in the Problems panel (Ctrl+Shift+M)
- Red squiggles under each line
- Hover shows the security issue details

**If You See Nothing:**
The extension is not working. Continue to step 4.

### 4. Check File Type Support

The extension only scans these file types:
- `.ts` (TypeScript)
- `.js` (JavaScript)
- `.tsx` (TypeScript React)
- `.jsx` (JavaScript React)
- `.py` (Python)
- `.java` (Java)
- `.cs` (C#)
- `.go` (Go)
- `.rb` (Ruby)
- `.php` (PHP)

**Verify:**
- Your test file has one of these extensions
- The file is saved (not Untitled)
- The file is in your workspace (not a random file)

### 5. Check for Conflicting Extensions

Some extensions might interfere with Code Guardrail:

**Temporarily Disable Other Security/Linting Extensions:**
1. Open Extensions panel (Ctrl+Shift+X)
2. Disable these types of extensions temporarily:
   - ESLint
   - TSLint
   - SonarLint
   - Other security scanners

3. Reload VS Code (Ctrl+Shift+P → "Reload Window")
4. Test again

### 6. Check Developer Console for Errors

1. Press `Ctrl+Shift+I` (toggle Developer Tools)
2. Go to Console tab
3. Look for errors related to "Code Guardrail" or "code-guardrail"
4. Common errors:
   ```
   Error loading extension
   Cannot find module
   Permission denied
   ```

### 7. Reinstall Extension from VSIX

If automatic installation failed, try manual installation:

**Option A: From Local VSIX**
```powershell
# Navigate to extension directory
cd "c:\path\to\Guardrail\extension"

# Rebuild extension
npm install
npm run compile

# Package extension
npx vsce package

# Install
code --install-extension code-guardrail-0.4.0.vsix --force
```

**Option B: Download from GitHub Release**
```powershell
# Download VSIX file
$vsixUrl = "https://github.com/AkashAi7/Guardrail/releases/download/v0.4.0/code-guardrail-0.4.0.vsix"
$vsixFile = "$env:TEMP\code-guardrail-0.4.0.vsix"
Invoke-WebRequest -Uri $vsixUrl -OutFile $vsixFile

# Install
code --install-extension $vsixFile --force
```

### 8. Verify Extension Files

**Check Extension Directory:**
```powershell
# Extension location
$extDir = "$env:USERPROFILE\.vscode\extensions"
Get-ChildItem $extDir | Select-String "code-guardrail"

# Example output: akashai7.code-guardrail-0.4.0
```

**Verify Required Files Exist:**
```powershell
$extPath = "$env:USERPROFILE\.vscode\extensions\akashai7.code-guardrail-0.4.0"

# Check compiled JavaScript files
Test-Path "$extPath\out\extension.js"  # Should be True
Test-Path "$extPath\out\scanner.js"     # Should be True

# Check dependencies
Test-Path "$extPath\node_modules"       # Should be True
```

### 9. Common Issues and Solutions

#### Issue: "Extension is installed but not showing in status bar"
**Solution:**
```powershell
# Reload window
# Press: Ctrl+Shift+P → Type: "Reload Window"
```

#### Issue: "Extension shows in status bar but no issues detected"
**Solution:**
1. Check if rules are loaded: Press `Ctrl+Shift+P` → "Code Guardrail: Reload Rules"
2. Verify scanner is working: Click shield icon → "Test with Sample"
3. Check file is saved (not Untitled)

#### Issue: "Shows error: Cannot find module 'mammoth' or 'pdf-parse'"
**Solution:**
```powershell
cd "$env:USERPROFILE\.vscode\extensions\akashai7.code-guardrail-0.4.0"
npm install
```

Then reload VS Code.

#### Issue: "Extension works on my machine but not on other machines"
**Solution:**
- Ensure you're distributing version 0.4.0, not 0.1.0
- Check that compiled `out/` folder is included in VSIX
- Verify `.vscodeignore` is not excluding critical files
- Make sure `node_modules` dependencies are bundled

### 10. Environment-Specific Checks

#### Windows-Specific
```powershell
# Check execution policy
Get-ExecutionPolicy
# Should be: RemoteSigned or Unrestricted

# Check VS Code installation
code --version

# Check Node.js (not required for extension, but good to verify)
node --version
```

#### Verify Extension Activation Event
The extension activates on `onStartupFinished`. Verify this in Developer Tools:
1. Press `Ctrl+Shift+I`
2. Console → Type: `vscode.extensions.getExtension('akashai7.code-guardrail')`
3. Should show extension object with `isActive: true`

### 11. Collect Diagnostic Information

If issues persist, collect this information for support:

```powershell
# Create diagnostic report
$report = @"
=== Code Guardrail Diagnostic Report ===
Date: $(Get-Date)
OS: $([System.Environment]::OSVersion.VersionString)
VS Code Version: $(code --version | Select-Object -First 1)
Node Version: $(node --version 2>$null)

Extension Installed:
$(code --list-extensions | Select-String "guardrail")

Extension Path:
$(Get-ChildItem "$env:USERPROFILE\.vscode\extensions" | Where-Object Name -like "*guardrail*" | Select-Object -ExpandProperty FullName)

Extension Files:
$(Get-ChildItem "$env:USERPROFILE\.vscode\extensions\*guardrail*\out" -ErrorAction SilentlyContinue | Select-Object Name)

"@

$report | Out-File "$env:USERPROFILE\Desktop\guardrail-diagnostic.txt"
Write-Host "Diagnostic report saved to Desktop"
```

### 12. Last Resort: Clean Reinstall

```powershell
# 1. Completely uninstall
code --uninstall-extension akashai7.code-guardrail

# 2. Remove all traces
Remove-Item "$env:USERPROFILE\.guardrail" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.vscode\extensions\*guardrail*" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Close VS Code completely
Get-Process code | Stop-Process -Force

# 4. Reinstall
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex

# 5. Start VS Code
code .
```

---

## Quick Verification Checklist

Use this checklist to verify the extension is working:

- [ ] Extension shows in Extensions panel with version 0.4.0+
- [ ] Status bar shows 🛡️ shield icon
- [ ] Status bar text shows "Guardrail: Ready"
- [ ] Command Palette (Ctrl+Shift+P) shows "Code Guardrail" commands
- [ ] Test file with `const password = "admin123";` shows red squiggle after save
- [ ] Problems panel (Ctrl+Shift+M) shows "Code Guardrail" issues
- [ ] Hover over squiggle shows security message

**All checked?** ✅ Extension is working correctly!

**Some unchecked?** ⚠️ Follow troubleshooting steps above.

---

## Getting Help

If you've tried all the above and it still doesn't work:

1. **Check GitHub Issues:** https://github.com/AkashAi7/Guardrail/issues
2. **Create New Issue:** Include the diagnostic report from step 11
3. **Provide:**
   - OS and version
   - VS Code version
   - Extension version
   - Screenshot of Extensions panel
   - Output from diagnostic report

---

## For Developers: Debugging Extension Activation

If you're developing or debugging the extension:

```typescript
// Check activation in Developer Tools Console (Ctrl+Shift+I)
const ext = vscode.extensions.getExtension('akashai7.code-guardrail');
console.log('Extension active:', ext?.isActive);
console.log('Extension exports:', ext?.exports);

// Check diagnostic collection
vscode.languages.getDiagnostics().forEach(([uri, diagnostics]) => {
    if (diagnostics.some(d => d.source === 'Code Guardrail')) {
        console.log('Guardrail diagnostics in:', uri.fsPath);
        console.log('Count:', diagnostics.length);
    }
});
```

**Watch Extension Logs:**
```powershell
# In extension development host
# Output channel will show real-time logs
```
