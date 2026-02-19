# 🛡️ Code Guardrail - Quick Install Guide

> **Real-time Security & Compliance Analysis for VS Code**

---

## ⚡ One-Command Installation

### Windows
```powershell
iwr https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 -UseBasicParsing | iex
```

### macOS / Linux
```bash
curl -fsSL https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.sh | bash
```

**⏱️ Takes 2-3 minutes** | **📦 ~100MB download** | **🔄 Auto-installs everything**

---

## 📦 Alternative: Manual Installation

If you prefer manual installation or received a ZIP file:

### Step 1: Download
Either:
- Download from: https://github.com/AkashAi7/Guardrail/releases/latest
- Or use the ZIP file you received

### Step 2: Extract Service
```powershell
# Extract guardrail-service-v0.1.0.zip to a permanent location
# Example: C:\Guardrail (Windows) or ~/.guardrail (macOS/Linux)
```

### Step 3: Start Service
```powershell
cd C:\Guardrail  # or your install location
npm start
```

### Step 4: Install VS Code Extension
```powershell
# Install the extension
code --install-extension code-guardrail-0.1.0.vsix

# Restart VS Code
```

---

## ✅ Verify Installation

1. **Check Service**: Open http://localhost:3000/health in browser
   - Should see: `{"status":"ok"}`

2. **Check Extension**: Open VS Code
   - Open Command Palette (`Ctrl+Shift+P`)
   - Type "Code Guardrail"
   - Should see Guardrail commands

3. **Test Analysis**: Open any code file
   - Issues appear in the "Problems" panel
   - Inline warnings show in editor

---

## 🎯 What Does It Do?

Code Guardrail catches issues **while you code**:

✅ **Security Vulnerabilities**
- SQL injection
- XSS attacks
- Hardcoded secrets
- Insecure crypto

✅ **Compliance Violations**
- GDPR/PII detection
- HIPAA requirements
- SOC2 compliance
- PCI-DSS rules

✅ **Best Practices**
- Error handling patterns
- Framework conventions
- Code quality improvements

---

## 🔧 Configuration

### GitHub Copilot Users (Recommended)
No configuration needed! Auto-detected and free with your Copilot subscription.

### Bring Your Own Key (BYOK)
Edit `.env` file in the service directory:

```env
PROVIDER=openai     # or 'anthropic'
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

Then restart the service.

---

## 🚀 Quick Start

1. **Open a code file** in VS Code
2. **Write some code** with potential issues
3. **See warnings** appear in Problems panel
4. **Hover over issues** for detailed explanations
5. **Fix and move on!**

### Example: Try this in a `.ts` file
```typescript
const query = "SELECT * FROM users WHERE id = " + userId;
// ⚠️ Guardrail will warn: SQL Injection vulnerability
```

---

## 📚 Common Commands

Open Command Palette (`Ctrl+Shift+P`) and type:

- `Code Guardrail: Analyze Current File` - Manual scan
- `Code Guardrail: Clear All Issues` - Clear warnings
- `Code Guardrail: Reload Rules` - Refresh rules
- `Code Guardrail: Create Sample Rules` - Add example rules

---

## 🆘 Troubleshooting

### Service Not Starting
**Problem**: `npm start` fails  
**Solution**: 
- Check Node.js version: `node --version` (need 18+)
- Install dependencies: `npm install`
- Check port 3000 is free

### Extension Not Finding Service
**Problem**: No warnings appearing  
**Solution**:
- Verify service running: http://localhost:3000/health
- Check VS Code settings for correct service URL
- Restart VS Code

### Port 3000 Already in Use
**Problem**: "Port already in use" error  
**Solution**:
- Edit `.env` file: `PORT=3001` (or any free port)
- Restart service
- Update VS Code extension settings if needed

---

## 📖 Learn More

- **Full Documentation**: https://github.com/AkashAi7/Guardrail
- **Report Issues**: https://github.com/AkashAi7/Guardrail/issues
- **Request Features**: https://github.com/AkashAi7/Guardrail/issues/new

---

## 🎓 Sample Rules Included

The installation includes pre-configured rules for:

- **Security**: SQL injection, XSS, secrets detection
- **Compliance**: GDPR/PII, data handling
- **Best Practices**: Error handling, async/await

You can add custom rules by editing files in the `governance/` folder.

---

## 🔄 Updates

To update to a new version:

```powershell
# Re-run installer (Windows)
iwr https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 -UseBasicParsing | iex

# Or manually
1. Download new release
2. Replace service files
3. Update extension: code --install-extension code-guardrail-X.Y.Z.vsix --force
```

---

## ❤️ Support

Found this helpful? 
- ⭐ Star the repo: https://github.com/AkashAi7/Guardrail
- 🐛 Report bugs: https://github.com/AkashAi7/Guardrail/issues
- 💡 Suggest features: https://github.com/AkashAi7/Guardrail/discussions

---

**Happy Coding with Guardrails! 🛡️**
