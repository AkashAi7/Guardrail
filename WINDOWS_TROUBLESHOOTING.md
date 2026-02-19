# Windows Troubleshooting Guide

## Quick Start - No Setup Required!

**Good news:** The Code Guardrail extension works completely standalone - **no backend service needed**!

Simply install the extension and start coding. The extension will automatically scan your code as you type or save files.

---

## Common Issues on Windows

### Issue 1: "Code Guardrail is active" but nothing happens

**This is normal!** The extension only shows issues when it detects security problems in your code.

**To verify it's working:**

1. **Test with sample code:**
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run: `Code Guardrail: Show Menu`
   - Select: `Test with Sample Code`
   - A test file will open with intentional security issues
   - **Save the file** (`Ctrl+S`)
   - You should see red squiggles appear!

2. **Or try this code manually:**
   ```javascript
   // Save this file to see security issues
   const apiKey = "sk-1234567890abcdefghij";
   const password = "admin123";
   ```

3. **Check the Problems panel:**
   - Press `Ctrl+Shift+M` to open Problems panel
   - Issues will be listed there

**Expected behavior after saving:**
- Red/yellow squiggly lines under problematic code
- Issues listed in Problems panel (`Ctrl+Shift+M`)
- Status bar shows issue count: "🛡️ Guardrail: X issues"

---

### Issue 2: Extension doesn't activate

**Symptoms:**
- No Guardrail shield icon in status bar
- No "Code Guardrail is ready!" message on VS Code startup

**Solutions:**

1. **Check if extension is installed:**
   - Open Extensions view (`Ctrl+Shift+X`)
   - Search for "Code Guardrail"
   - Ensure it's installed and enabled

2. **Reload VS Code:**
   - Press `Ctrl+Shift+P`
   - Type: `Developer: Reload Window`
   - Or close and reopen VS Code

3. **Check VS Code version:**
   - Requires VS Code 1.80.0 or higher
   - Help → About to check version
   - Update if needed: https://code.visualstudio.com/

4. **Check Output panel for errors:**
   - View → Output
   - Select "Code Guardrail" from dropdown
   - Look for error messages

---

### Issue 3: Rules not working or no issues detected

**Possible causes:**

1. **File type not supported:**
   - Supported: `.ts`, `.js`, `.tsx`, `.jsx`, `.py`, `.java`, `.cs`, `.go`, `.rb`, `.php`
   - Check your file has one of these extensions

2. **Code doesn't violate any built-in rules:**
   - The extension has 20+ built-in security rules
   - Try the test sample (see Issue 1 above) to verify scanning works

3. **Severity filter too restrictive:**
   - Open Settings (`Ctrl+,`)
   - Search: `codeGuardrail`
   - Check settings are appropriate

---

### Issue 4: "Cannot read properties" or extension crashes

**This usually indicates a corrupt installation.**

**Fix:**

1. **Uninstall and reinstall:**
   ```powershell
   # Uninstall
   code --uninstall-extension AkashAi7.code-guardrail
   
   # Clear cache (optional)
   Remove-Item -Recurse -Force "$env:USERPROFILE\.vscode\extensions\akashai7.code-guardrail-*"
   
   # Reinstall from marketplace
   # Or install from .vsix file
   code --install-extension code-guardrail-0.4.0.vsix
   ```

2. **Check for conflicting extensions:**
   - Disable other security/linting extensions temporarily
   - Reload window and test

---

### Issue 5: Permission denied or access errors

**Symptoms:**
- "EPERM" or "EACCES" errors
- Extension fails to read/write files

**Solutions:**

1. **Run VS Code as Administrator (one time):**
   - Right-click VS Code icon
   - Select "Run as administrator"
   - Let extension initialize
   - Close and reopen normally

2. **Check folder permissions:**
   - Ensure you have read/write access to workspace folder
   - Especially important for `.guardrail/` folder

3. **Antivirus interference:**
   - Some antivirus software blocks VS Code extensions
   - Add VS Code to whitelist:
     - `%LOCALAPPDATA%\Programs\Microsoft VS Code\`
     - `%USERPROFILE%\.vscode\extensions\`

---

### Issue 6: Extension says "ready" but nothing happens when saving

**This means your code is clean!** The extension only shows issues when it detects problems.

**Verify it's working:**

1. Click the shield icon in the status bar (bottom left)
2. Select "Test with Sample Code"
3. Save the generated file
4. You should see 5+ security issues highlighted

**If still no issues appear:**
- Check Problems panel is open (`Ctrl+Shift+M`)
- Try manually analyzing: `Ctrl+Shift+P` → "Code Guardrail: Analyze Current File"

---

### Issue 7: Windows Defender or antivirus blocking

**Symptoms:**
- Extension installs but doesn't work
- Random errors or crashes
- File access denied errors

**Solutions:**

1. **Add VS Code to Windows Defender exclusions:**
   ```powershell
   # Run as Administrator
   Add-MpPreference -ExclusionPath "$env:LOCALAPPDATA\Programs\Microsoft VS Code"
   Add-MpPreference -ExclusionPath "$env:USERPROFILE\.vscode"
   ```

2. **Or via Windows Security UI:**
   - Windows Security → Virus & threat protection
   - Manage settings → Exclusions
   - Add folder: `%LOCALAPPDATA%\Programs\Microsoft VS Code`
   - Add folder: `%USERPROFILE%\.vscode`

---

### Issue 8: Path issues (Windows vs Linux paths)

**The extension handles Windows paths automatically.**

If you see path-related errors:

1. Use forward slashes in settings: `"ignoredFiles": ["**/node_modules/**"]`
2. Use Windows paths only when explicitly needed
3. Check `.guardrail.json` uses correct path separators

---

## Feature Verification Checklist

Use this to verify everything is working:

- [ ] **Extension installed:** Check Extensions view (`Ctrl+Shift+X`)
- [ ] **Extension activated:** See shield icon in status bar (bottom left)
- [ ] **Can open menu:** Click shield icon → menu appears
- [ ] **Test file works:** "Test with Sample Code" shows issues when saved
- [ ] **Manual scan works:** `Ctrl+Shift+P` → "Analyze Current File"
- [ ] **Problems panel shows issues:** Press `Ctrl+Shift+M`
- [ ] **Status bar updates:** Shows issue count or "Clean"

---

## What "Setup" Actually Means

**There is NO setup required for the basic extension!**

The extension documentation mentions "setup" for optional advanced features:

- **Basic extension (you have this):** Works standalone, no setup
- **Advanced with backend service (optional):** Requires Node.js service for AI-powered analysis

**For 99% of users, just installing the extension is enough.**

---

## Getting Help

### 1. Check Extension Output

View → Output → Select "Code Guardrail" from dropdown

This shows detailed logs of what the extension is doing.

### 2. Enable Debug Logging

1. Open Settings (`Ctrl+,`)
2. Search: `developer.enableExtensionDeveloperLogging`
3. Enable it
4. Reload window
5. Check Output panel again

### 3. Test in Clean Environment

```powershell
# Start VS Code with no extensions except Code Guardrail
code --disable-extensions --enable-extension AkashAi7.code-guardrail
```

### 4. Report Issue

If nothing above works:

1. Open issue: https://github.com/AkashAi7/Guardrail/issues
2. Include:
   - Windows version
   - VS Code version
   - Extension version
   - Output panel logs
   - Screenshot of the issue

---

## Quick Reference

### Status Bar Icons

- `$(shield-check) Guardrail: Ready` - Working, no issues
- `$(shield-check) Guardrail: Clean` - File scanned, no issues found
- `$(warning) Guardrail: X issues` - Issues found (medium severity)
- `$(alert) Guardrail: X issues (Y critical)` - Critical issues found

### Keyboard Shortcuts

- `Ctrl+Shift+P` - Command Palette (access all commands)
- `Ctrl+Shift+M` - Open Problems panel
- `Ctrl+S` - Save (triggers scan if auto-scan enabled)
- Click status bar shield icon - Quick menu

### Commands

Open Command Palette (`Ctrl+Shift+P`) and type:

- `Code Guardrail: Show Menu` - Quick access to all features
- `Code Guardrail: Analyze Current File` - Scan current file
- `Code Guardrail: Clear All Issues` - Remove all diagnostics
- `Code Guardrail: Create Sample Rules` - Generate example rules
- `Code Guardrail: Reload Rules` - Reload custom rules

---

## FAQ

**Q: Do I need the backend service running?**  
A: No! The extension works standalone with 20+ built-in rules.

**Q: Do I need Node.js?**  
A: No, not for the basic extension.

**Q: Do I need GitHub Copilot?**  
A: No, the standalone extension doesn't require it.

**Q: Why does the documentation mention a service?**  
A: That's for optional AI-powered analysis. Basic scanning works without it.

**Q: How do I know it's working?**  
A: Install extension → Open any code file → Save file → Issues appear if found

**Q: Where are the issues shown?**  
A: In the Problems panel (`Ctrl+Shift+M`) and as squiggly underlines in the editor

**Q: Can I customize rules?**  
A: Yes! Use `Code Guardrail: Create Sample Rules` to generate a template

---

**Still stuck? Open an issue with details: https://github.com/AkashAi7/Guardrail/issues**
