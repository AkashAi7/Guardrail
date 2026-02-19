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

## Troubleshooting

### "Execution policy" error on Windows

Run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "Permission denied" on macOS/Linux

Make the script executable:
```bash
chmod +x ~/.guardrail/scripts/install.sh
```

### Port 3000 already in use

Stop the process using port 3000:

**Windows:**
```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force
```

**macOS/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

Or change the port in `.env`:
```bash
SERVICE_PORT=3001
```

### Service not starting

Check logs:
- **Windows:** `%LOCALAPPDATA%\Guardrail\service\logs`
- **macOS/Linux:** `~/.guardrail/service/logs`

### Extension not working

1. Check if service is running: `http://localhost:3000/health`
2. Check VS Code settings: `codeGuardrail.serviceUrl`
3. Reload VS Code: `Ctrl+Shift+P` → "Reload Window"

---

## Manual Installation

If the one-line installer doesn't work, see [INSTALL.md](./INSTALL.md) for detailed manual installation steps.

---

## Need Help?

- 📖 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/AkashAi7/Guardrail/issues)
- 💬 [Discussions](https://github.com/AkashAi7/Guardrail/discussions)

Happy coding! 🛡️
