# Guardrail Installation Guide

## Quick Install (Recommended)

### Windows
```powershell
# Run installer (auto-detects Copilot OR prompts for API keys)
powershell -ExecutionPolicy Bypass -File install.ps1
```

### macOS/Linux
```bash
# Coming soon - use manual installation below
```

---

## Distribution Methods

### 1. 🌐 For End Users (Simplest)

**GitHub Releases** - Download and run installer:

1. Visit: https://github.com/AkashAi7/Guardrail/releases
2. Download latest release:
   - Windows: `guardrail-installer.ps1`
   - Extension: `code-guardrail-0.1.0.vsix` (optional - installer includes it)
3. Run installer:
   ```powershell
   powershell -File guardrail-installer.ps1
   ```

**What it does:**
- ✅ Installs backend service
- ✅ Auto-detects GitHub Copilot
- ✅ Prompts for API keys if Copilot not found
- ✅ Installs VS Code extension
- ✅ Sets up Windows Service (auto-start)

---

### 2. 📦 VS Code Marketplace (Future)

Once published:
```
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search "Guardrail"
4. Click Install
```

**Requirements:** Publisher account + review (~1-2 days)

---

### 3. 🔧 Manual Installation (For Developers)

#### Step 1: Install Backend Service
```bash
# Clone repository
git clone https://github.com/AkashAi7/Guardrail.git
cd Guardrail/service

# Install dependencies
npm install

# Build
npm run build

# Configure
cp .env.example .env
# Edit .env with your provider settings

# Start service
npm start
```

#### Step 2: Install Extension
```bash
cd ../extension

# Install dependencies
npm install

# Compile
npm run compile

# Package
npx @vscode/vsce package

# Install in VS Code
code --install-extension code-guardrail-0.1.0.vsix
```

---

## Configuration

### Auto Mode (Default)
```env
PROVIDER_MODE=auto
```
- Tries Copilot first
- Falls back to BYOK if Copilot unavailable

### Force Copilot Only
```env
PROVIDER_MODE=copilot
```
- Requires GitHub Copilot subscription
- Cost: $0 (included)

### Force BYOK Only
```env
PROVIDER_MODE=byok
OPENAI_API_KEY=sk-your-key-here
# OR
ANTHROPIC_API_KEY=sk-ant-your-key-here
```
- Cost: ~$0.03 per 1K tokens

---

## Verification

After installation:

1. **Check service is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check provider:**
   ```bash
   curl http://localhost:3000/provider
   ```

3. **Test in VS Code:**
   - Open any `.ts`/`.js` file
   - Add: `const apiKey = "hardcoded-secret";`
   - Save file
   - Look for red squiggles and warnings

---

## Uninstall

### Windows
```powershell
powershell -File install.ps1 -Uninstall
```

### Manual
```bash
# Stop service
# Windows: Stop-Service GuardrailService
# Linux/macOS: sudo systemctl stop guardrail

# Remove extension
code --uninstall-extension AkashAi7.code-guardrail

# Remove files
rm -rf ~/.guardrail
```

---

## Troubleshooting

### Service won't start
```bash
# Check logs
cat ~/.guardrail/service/logs/error.log

# Check port 3000 availability
netstat -an | grep 3000

# Kill existing process
# Windows: Get-Process node | Stop-Process
# Linux/macOS: killall node
```

### Extension not detecting issues
1. Check service is running: `http://localhost:3000/health`
2. Check VS Code Developer Console: `Help > Toggle Developer Tools`
3. Look for Guardrail output panel: `View > Output > Guardrail`

### Provider issues
```bash
# Check what providers are available
curl http://localhost:3000/provider

# Force specific provider
# Edit ~/.guardrail/service/.env
PROVIDER_MODE=copilot  # or byok
```

---

## Support

- **Issues**: https://github.com/AkashAi7/Guardrail/issues
- **Discussions**: https://github.com/AkashAi7/Guardrail/discussions
- **Documentation**: https://github.com/AkashAi7/Guardrail/wiki
