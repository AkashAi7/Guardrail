# 🚀 Quick Install Guide

## One-Line Installation

> 💡 **New Feature:** The installer automatically downloads and installs Node.js and VS Code if they're not already present on your system!

### Windows (PowerShell)

```powershell
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex
```

**Alternative (if above fails):**
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1'))
```

**What happens:**
- ✅ Checks for Node.js (auto-installs if missing)
- ✅ Checks for VS Code (auto-installs if missing)
- ✅ Downloads and installs Guardrail
- ⏱️ Takes 3-8 minutes depending on prerequisites

**After Installation:**
```powershell
# Verify installation
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/verify-installation.ps1 | iex
```

---

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install.sh | bash
```

**Alternative (wget):**
```bash
wget -qO- https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install.sh | bash
```

**What happens:**
- ✅ Detects your package manager (apt/yum/brew)
- ✅ Auto-installs Node.js if missing
- ✅ Auto-installs VS Code if missing  
- ✅ Downloads and installs Guardrail
- ⏱️ Takes 3-10 minutes depending on prerequisites
- 🔐 May prompt for sudo password

---

## Custom Installation Location

### Windows

```powershell
# Install to custom directory
$env:INSTALL_DIR="C:\MyTools\Guardrail"; iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex
```

### macOS / Linux

```bash
# Install to custom directory
export INSTALL_DIR="$HOME/tools/guardrail"; curl -fsSL https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install.sh | bash
```

---

## Install Specific Branch

### Windows

```powershell
# Install development branch
$env:BRANCH="dev"; iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex
```

### macOS / Linux

```bash
# Install development branch
export BRANCH="dev"; curl -fsSL https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install.sh | bash
```

---

## What Gets Installed?

The installer will:

1. ✅ Check prerequisites (Node.js 18+, VS Code, Git)
2. ✅ Clone Guardrail repository
3. ✅ Install backend service dependencies
4. ✅ Build the service
5. ✅ Configure environment (.env file)
6. ✅ Build and install VS Code extension
7. ✅ Auto-detect GitHub Copilot OR prompt for API keys

**Installation Location:**
- **Windows:** `%LOCALAPPDATA%\Guardrail` (default)
- **macOS/Linux:** `~/.guardrail` (default)

---

## After Installation

### Start the Service

**Windows:**
```powershell
cd $env:LOCALAPPDATA\Guardrail\service
npm start
```

**macOS/Linux:**
```bash
cd ~/.guardrail/service
npm start
```

### Restart VS Code

Close and reopen VS Code for the extension to activate.

### Verify Installation

1. Open any TypeScript/JavaScript file
2. Type potentially insecure code:
   ```typescript
   const password = "admin123";
   ```
3. Save the file
4. Wait 2 seconds → See red squiggles! ✨

---

## Uninstall

### Windows

```powershell
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex -Uninstall
```

**Or manually:**
```powershell
# Remove installation
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Guardrail"

# Uninstall extension
code --uninstall-extension AkashAi7.code-guardrail
```

### macOS / Linux

```bash
# Remove installation
rm -rf ~/.guardrail

# Uninstall extension
code --uninstall-extension AkashAi7.code-guardrail
```

---

## ✅ Verify Installation

After installation completes, verify everything is working:

```powershell
# Run verification script
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/verify-installation.ps1 | iex
```

**What to expect:**
- ✅ Extension version 0.4.0 or higher installed
- ✅ Shield icon (🛡️) appears in VS Code status bar
- ✅ Test file shows red squiggles on security issues
- ✅ Problems panel shows "Code Guardrail" issues

**Quick Manual Test:**
1. Restart VS Code
2. Open any `.ts` or `.js` file  
3. Add this line: `const password = "admin123";`
4. Save the file (Ctrl+S)
5. You should see a red squiggle and issue in Problems panel (Ctrl+Shift+M)

---

## Troubleshooting

### Extension Not Showing Highlights?

**Most Common Issue: **Wrong version installed**

Check your extension version:
1. VS Code → Extensions (Ctrl+Shift+X)
2. Search "Code Guardrail"
3. Should show version **0.4.0** or higher
4. If 0.1.0 or lower → Uninstall and reinstall

**Quick Fix:**
```powershell
# Uninstall old version
code --uninstall-extension akashai7.code-guardrail

# Reinstall latest
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex
```

### Other Common Issues

### Other Common Issues

#### "Execution policy" error on Windows
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Extension installed but not active
1. Check status bar for 🛡️ shield icon
2. Press `Ctrl+Shift+P` → Type "Code Guardrail: Show Menu"
3. If command doesn't appear, see detailed troubleshooting below

#### No squiggles appearing on security issues
1. Verify file is saved (not Untitled)
2. Check file extension is supported (.ts, .js, .py, etc.)
3. Click shield icon → "Reload Rules"
4. Try "Test with Sample Code" from shield menu

---

## 📚 Detailed Troubleshooting

For comprehensive troubleshooting steps, see:
**[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

Covers:
- Extension activation issues
- Version mismatch problems
- File type support
- Conflicting extensions
- Developer console debugging
- Clean reinstall procedures

---

## Manual Installation

If the one-line installer doesn't work, see [INSTALL.md](./INSTALL.md) for detailed manual installation steps.

---

## Need Help?

- 📖 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/AkashAi7/Guardrail/issues)
- 💬 [Discussions](https://github.com/AkashAi7/Guardrail/discussions)

Happy coding! 🛡️
