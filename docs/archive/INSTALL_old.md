# Code Guardrail - Installation Guide

## 🚀 Quick Install (Recommended)

### One-Line Installation

**Windows (PowerShell):**
```powershell
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex
```

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install.sh | bash
```

That's it! The installer will:
- ✅ Check all prerequisites
- ✅ **Auto-download and install missing prerequisites** (Node.js, VS Code)
- ✅ Download and install the service
- ✅ Build and install the VS Code extension
- ✅ Auto-detect GitHub Copilot (or prompt for API keys)

**Installation Time:** ~3-5 minutes (longer if prerequisites need to be installed)

---

## 📋 Prerequisites

The following prerequisites are required. **Don't worry** - the automated installer will download and install them automatically if they're not already present:

- **Operating System:** Windows 10+, macOS 10.15+, or Linux
- **Node.js:** Version 18 or higher - **[Auto-installed if missing]**
- **VS Code:** Latest version - **[Auto-installed if missing]**
- **Git:** For cloning the repository (manual install only) ([Download](https://git-scm.com/))

**Optional (but recommended):**
- **GitHub Copilot:** For free LLM usage (included in Copilot subscription)
  - OR **OpenAI API Key / Anthropic API Key:** For BYOK (Bring Your Own Key) mode

> ℹ️ **Note:** The one-line installer will automatically detect and install Node.js and VS Code if they're not found on your system. You may need administrator permissions for automatic installation.

---

## 📦 Installation Methods

### Method 1: Automated Installation (Recommended)

#### Windows

1. Open PowerShell (may need admin rights for auto-installation)
2. Run the installer:
   ```powershell
   iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex
   ```
3. Follow the prompts (if Node.js or VS Code are missing, they will be downloaded and installed automatically)
4. Restart VS Code

**Default Install Location:** `%LOCALAPPDATA%\Guardrail`

> 💡 **Automatic Installation:** If Node.js or VS Code are not found, the installer will:
> - Download the latest LTS version of Node.js
> - Download and install VS Code
> - Configure your PATH automatically
> - Continue with the Guardrail installation

#### macOS / Linux

1. Open Terminal
2. Run the installer:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install.sh | bash
   ```
3. Follow the prompts (if Node.js or VS Code are missing, they will be installed automatically)
4. Restart VS Code

**Default Install Location:** `~/.guardrail`

> 💡 **Automatic Installation:** The installer will:
> - **macOS:** Use Homebrew to install Node.js and VS Code (installs Homebrew if needed)
> - **Linux:** Use your system's package manager (apt, yum, etc.) to install prerequisites
> - May prompt for sudo password for system-wide installation

---

### Method 2: Manual Installation from GitHub

If you prefer manual installation or the automated script doesn't work:

#### Step 1: Clone Repository

```bash
# Clone to your preferred location
git clone https://github.com/AkashAi7/Guardrail.git
cd Guardrail
```

#### Step 2: Install Backend Service

```bash
cd service

# Create .env configuration
cp .env.example .env

# Install dependencies
npm install

# Build the service
npm run build
```

#### Step 3: Configure Provider (Optional)

Edit `service/.env` file:

**Option A: Use GitHub Copilot (Free with Copilot subscription)**
```bash
PROVIDER_MODE=auto
```

**Option B: Use OpenAI**
```bash
PROVIDER_MODE=byok
OPENAI_API_KEY=sk-your-key-here
BYOK_MODEL=gpt-4o
```

**Option C: Use Anthropic**
```bash
PROVIDER_MODE=byok
ANTHROPIC_API_KEY=sk-ant-your-key-here
BYOK_MODEL=claude-3-5-sonnet-20241022
```

#### Step 4: Start Backend Service

```bash
npm start
```

Keep this terminal open! You should see:
```
🛡️  GUARDRAIL SERVICE
🚀 Server running on http://localhost:3000
✅ Provider connected
```

#### Step 5: Install VS Code Extension

Open a new terminal:

```bash
cd ../extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension
npm run package

# Install in VS Code
code --install-extension code-guardrail-0.1.0.vsix
```

**Or install via VS Code UI:**
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Click `...` menu → `Install from VSIX`
4. Select `extension/code-guardrail-0.1.0.vsix`

#### Step 6: Restart VS Code

Close and reopen VS Code to activate the extension.

---

### Method 3: Development Installation

For contributors or developers:

```bash
# Clone repository
git clone https://github.com/AkashAi7/Guardrail.git
cd Guardrail

# Install service in development mode
cd service
npm install
cp .env.example .env
npm run dev  # Starts with hot reload

# In a new terminal, install extension
cd ../extension
npm install
code --extensionDevelopmentPath=.
```

This opens a new VS Code window with the extension loaded in development mode.

---

## 🔧 Configuration

### Backend Service Configuration

Edit `service/.env` file:

```bash
# Service Configuration
SERVICE_PORT=3000

# Provider Mode: 'auto' (Copilot) or 'byok' (Bring Your Own Key)
PROVIDER_MODE=auto

# === BYOK Configuration (if PROVIDER_MODE=byok) ===

# OpenAI
OPENAI_API_KEY=sk-your-key-here
BYOK_MODEL=gpt-4o

# OR Anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
BYOK_MODEL=claude-3-5-sonnet-20241022

# OR Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-4

# Governance Rules Directory
GOVERNANCE_DIR=../governance

# Logging
LOG_LEVEL=info
```

### VS Code Extension Configuration

Open VS Code settings (`Ctrl+,` / `Cmd+,`) and search for "Code Guardrail":

```json
{
  "codeGuardrail.enabled": true,
  "codeGuardrail.serviceUrl": "http://localhost:3000",
  "codeGuardrail.autoAnalyzeOnSave": true,
  "codeGuardrail.autoAnalyzeOnType": false,
  "codeGuardrail.debounceDelay": 2000,
  "codeGuardrail.showInlineMessages": true,
  "codeGuardrail.severityLevel": "warning"
}
```

---

## ✅ Verify Installation

### Test Backend Service

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","provider":"copilot","version":"1.0.0"}
```

### Test VS Code Extension

1. Open any TypeScript/JavaScript file
2. Type potentially insecure code:
   ```typescript
   const apiKey = "sk-1234567890";
   const password = "admin123";
   ```
3. Save the file (`Ctrl+S` / `Cmd+S`)
4. Wait 2 seconds
5. ✨ Red squiggles should appear with warnings!

### Check Extension Status

- Look for the Guardrail shield icon (🛡️) in the VS Code status bar
- Click it to see the connection status
- Green = Connected, Red = Disconnected

---

## 🐛 Troubleshooting

> 🪟 **Windows Users:** See the comprehensive [Windows Troubleshooting Guide](./WINDOWS_TROUBLESHOOTING.md) for Windows-specific issues, permission errors, and antivirus conflicts.

### Extension Not Working (Standalone Mode)

**If you're just using the VS Code extension without the backend service:**

The extension works standalone with 20+ built-in security rules. No backend service needed!

**Quick test:**
1. Click the shield icon (🛡️) in VS Code status bar
2. Select "Test with Sample Code"
3. Save the file (`Ctrl+S`)
4. You should see 5+ security issues highlighted

**If test doesn't work:**
- Check extension is installed: Extensions view (`Ctrl+Shift+X`)
- Reload VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
- Check VS Code version: Must be 1.80.0+ (Help → About)
- See [Windows Troubleshooting Guide](./WINDOWS_TROUBLESHOOTING.md) for detailed solutions

---

### Service Won't Start (Advanced Mode Only)

**Note:** This section is only for users setting up the optional backend service for AI-powered analysis.

**Issue: Port 3000 already in use**

**Windows:**
```powershell
# Find and kill process on port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force
```

**macOS/Linux:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Or change the port:**
Edit `service/.env`:
```bash
SERVICE_PORT=3001
```

And update VS Code settings:
```json
"codeGuardrail.serviceUrl": "http://localhost:3001"
```

---

**Issue: "Cannot find module" errors**

```bash
cd service
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

**Issue: GitHub Copilot not detected**

1. Ensure GitHub Copilot extension is installed in VS Code
2. Verify Copilot authentication: Open Copilot chat in VS Code
3. Switch to BYOK mode in `service/.env`:
   ```bash
   PROVIDER_MODE=byok
   OPENAI_API_KEY=your-key-here
   ```

---

### Extension Not Working

**Issue: No analysis happening**

1. Check if service is running:
   ```bash
   curl http://localhost:3000/health
   ```
   
2. Check VS Code Output panel:
   - View → Output
   - Select "Code Guardrail" from dropdown
   
3. Reload VS Code window:
   - `Ctrl+Shift+P` / `Cmd+Shift+P`
   - Type: "Developer: Reload Window"

---

**Issue: Extension not found after installation**

1. Verify installation:
   ```bash
   code --list-extensions | grep guardrail
   ```
   
2. Reinstall manually:
   ```bash
   cd extension
   code --install-extension code-guardrail-0.1.0.vsix --force
   ```
   
3. Restart VS Code completely

---

**Issue: "Service unreachable" error**

1. Check service URL in settings:
   - Open VS Code settings
   - Search for `codeGuardrail.serviceUrl`
   - Should be: `http://localhost:3000`
   
2. Check firewall settings (allow Node.js)
   
3. Test connectivity:
   ```bash
   curl http://localhost:3000/health
   ```

---

### Build Errors

**Issue: TypeScript compilation errors**

```bash
# Service
cd service
npm install --save-dev typescript @types/node
npm run build

# Extension
cd extension
npm install --save-dev typescript
npm run compile
```

---

**Issue: "vsce: command not found"**

```bash
npm install -g @vscode/vsce
```

---

### Platform-Specific Issues

**Windows: PowerShell execution policy error**

Run as Administrator:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

**macOS: "quarantine" error**

```bash
xattr -d com.apple.quarantine ~/.guardrail/scripts/install.sh
chmod +x ~/.guardrail/scripts/install.sh
```

---

**Linux: Permission denied**

```bash
chmod +x ~/.guardrail/scripts/install.sh
sudo chown -R $USER:$USER ~/.guardrail
```

---

## 🔄 Updating Guardrail

### Automated Update

**Windows:**
```powershell
cd $env:LOCALAPPDATA\Guardrail
git pull origin main
cd service && npm install && npm run build
cd ../extension && npm install && npm run compile && npm run package
code --install-extension code-guardrail-0.1.0.vsix --force
```

**macOS/Linux:**
```bash
cd ~/.guardrail
git pull origin main
cd service && npm install && npm run build
cd ../extension && npm install && npm run compile && npm run package
code --install-extension code-guardrail-0.1.0.vsix --force
```

### Fresh Reinstall

Just run the installer again - it will detect the existing installation and prompt to reinstall.

---

## 🗑️ Uninstallation

### Automated Uninstall

**Windows:**
```powershell
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex -Uninstall
```

### Manual Uninstall

**Windows:**
```powershell
# Stop service
Stop-Process -Name node -Force

# Remove installation
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Guardrail"

# Uninstall extension
code --uninstall-extension AkashAi7.code-guardrail
```

**macOS/Linux:**
```bash
# Stop service
pkill -f guardrail

# Remove installation
rm -rf ~/.guardrail

# Uninstall extension
code --uninstall-extension AkashAi7.code-guardrail
```

---

## 📚 Next Steps

After successful installation:

1. **Read the documentation:**
   - [README.md](./README.md) - System overview
   - [GETTING_STARTED.md](./GETTING_STARTED.md) - Usage guide
   - [RULES_LIBRARY_EXAMPLES.md](./RULES_LIBRARY_EXAMPLES.md) - Rule definitions

2. **Try the demo:**
   ```bash
   code DEMO.ts
   ```

3. **Customize rules:**
   - Edit files in `governance/` directory
   - Reload rules: Command Palette → "Code Guardrail: Reload Governance Rules"

4. **Configure for your team:**
   - Add custom compliance rules
   - Integrate with CI/CD (see [SDK_INTEGRATION.md](./SDK_INTEGRATION.md))

---

## 💬 Need Help?

- 🐛 [Report Issues](https://github.com/AkashAi7/Guardrail/issues)
- 💬 [Discussions](https://github.com/AkashAi7/Guardrail/discussions)
- 📖 [Full Documentation](https://github.com/AkashAi7/Guardrail)
- ✉️ Contact: [Your Contact Info]

---

## 🎉 Installation Complete!

You're all set! Guardrail is now protecting your code in real-time.

Happy coding! 🛡️
```bash
cd service
cp .env.example .env
# Edit .env if needed
```

Default configuration:
- Port: 3000
- Model: gpt-4
- Auth: GitHub Copilot

### Extension Settings

In VS Code settings.json:
```json
{
  "codeGuardrail.serviceUrl": "http://localhost:3000",
  "codeGuardrail.autoAnalyzeOnSave": true,
  "codeGuardrail.autoAnalyzeOnType": true,
  "codeGuardrail.analyzeOnTypeDebounce": 2000
}
```

---

## ❓ Troubleshooting

### "Service not connected"
```bash
# Check if backend is running
curl http://localhost:3000/health

# Should return: {"status":"ok",...}
```

### "Copilot CLI not found"
```bash
# Install Copilot CLI
npm install -g @github/copilot

# May need to restart terminal
```

### "Analysis timeout"
- Backend falls back to pattern-based analysis (expected)
- Check Copilot CLI is authenticated: `copilot auth`

---

## 🚀 Next Steps

- Read the [User Guide](./README.md)
- Customize [Governance Rules](./governance/README.md)
- Join our [Community](https://github.com/AkashAi7/Guardrail/discussions)

---

## 📝 Distribution Models

### For Individuals (Current)
- Manual installation (this guide)
- Run backend locally
- Full control & privacy

### For Teams (Coming Soon)
- Docker container
- One-command deployment
- Shared service

### For Enterprises (Future)
- Cloud-hosted option
- No local setup needed
- Professional support

---

## 🤝 Support

- Issues: https://github.com/AkashAi7/Guardrail/issues
- Discussions: https://github.com/AkashAi7/Guardrail/discussions
- Email: support@guardrail.dev
