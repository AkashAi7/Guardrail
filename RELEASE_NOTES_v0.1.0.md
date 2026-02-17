# Guardrail v0.1.0 - Hybrid Edition 🛡️

## Real-time Code Security & Compliance Analysis for VS Code

**First public release** supporting both GitHub Copilot and Bring Your Own Key!

---

## ✨ Features

- 🔍 **Real-time Security Analysis** - Detects vulnerabilities as you type
- 📋 **Compliance Checking** - GDPR, PII, Secrets, and custom rules
- 🤖 **LLM-Powered** - Semantic code understanding beyond regex
- ⚡ **Instant Feedback** - Red squiggles and quick fixes in VS Code
- 📝 **Custom Rules** - Define your own governance policies

---

## 🎯 Hybrid Provider Support (The Game Changer!)

**Auto-detects your setup and uses the best option:**

### Option 1: GitHub Copilot ($0)
- ✅ If you have GitHub Copilot, Guardrail uses it **automatically**
- ✅ Zero additional cost - leverages your existing subscription
- ✅ No API keys needed - works out of the box

### Option 2: Bring Your Own Key (~$0.03/1K tokens)
- ✅ OpenAI (GPT-4o, GPT-4, GPT-3.5-turbo)
- ✅ Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
- ✅ Azure OpenAI (your own deployment)
- ✅ Full control over costs and data

**The installer detects which mode works for you and configures everything!**

---

## 📦 Installation (Windows)

### One-Click Install:

1. **Download** `install.ps1` from the Assets below
2. **Run** this command:
   ```powershell
   powershell -ExecutionPolicy Bypass -File install.ps1
   ```
3. **Restart VS Code**
4. **Done!** Extension is installed and configured

### What the Installer Does:
- ✅ Checks prerequisites (Node.js, VS Code, Git)
- ✅ Clones repository and builds backend
- ✅ **Auto-detects GitHub Copilot** OR prompts for API keys
- ✅ Installs backend as Windows Service
- ✅ Installs VS Code extension
- ✅ Verifies everything works

---

## 🚀 Quick Start

After installation:

1. **Open any code file** in VS Code (TypeScript, JavaScript, Python, etc.)
2. **Look for red squiggles** on security issues
3. **Hover** to see violation details
4. **Click Quick Fix** (💡) to see recommendations
5. **Customize rules** in `service/governance-rules.json`

---

## 📖 Documentation

- **Installation Guide**: [DISTRIBUTION.md](https://github.com/AkashAi7/Guardrail/blob/main/DISTRIBUTION.md)
- **Architecture Details**: [HYBRID_IMPLEMENTATION.md](https://github.com/AkashAi7/Guardrail/blob/main/HYBRID_IMPLEMENTATION.md)
- **Release Guide**: [RELEASE_GUIDE.md](https://github.com/AkashAi7/Guardrail/blob/main/RELEASE_GUIDE.md)
- **Quick Start**: [INSTALL.md](https://github.com/AkashAi7/Guardrail/blob/main/INSTALL.md)

---

## 🔧 Configuration

### Hybrid Mode (Default)
No configuration needed! The system auto-detects:
- If you have GitHub Copilot → Uses Copilot
- If not → Prompts for API keys during install

### Manual BYOK Configuration
Edit `service/.env`:
```env
PROVIDER_MODE=byok
BYOK_OPENAI_API_KEY=sk-...
# OR
BYOK_ANTHROPIC_API_KEY=sk-ant-...
# OR
BYOK_AZURE_OPENAI_API_KEY=...
BYOK_AZURE_OPENAI_ENDPOINT=https://...
```

### Custom Rules
Edit `service/governance-rules.json`:
```json
{
  "rules": [
    {
      "id": "custom-rule-1",
      "category": "security",
      "severity": "error",
      "description": "Your custom rule"
    }
  ]
}
```

---

## 🎬 Demo

Try it with the included `DEMO.ts` file:

```typescript
// This file has intentional violations for testing

// ❌ Hardcoded API Key (detected!)
const apiKey = "sk-1234567890abcdef";

// ❌ SQL Injection Risk (detected!)
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ❌ PII Exposure (detected!)
console.log("User email: john@example.com");
```

**Expected Result**: Red squiggles with detailed explanations and fixes!

---

## 🐛 Known Issues

- **Copilot SDK Timeout**: Some users may experience timeouts with Copilot provider. System automatically falls back to BYOK if configured.
- **Windows Only**: Installer is PowerShell-based. macOS/Linux users can manually install (see docs).
- **Port 3000**: Backend requires port 3000 to be available.

---

## 🔮 Roadmap

- [ ] macOS/Linux installer
- [ ] VS Code Marketplace publication
- [ ] Additional LLM providers (Gemini, Mistral)
- [ ] Team collaboration features
- [ ] Usage analytics dashboard
- [ ] GitHub Actions integration

---

## 💬 Support & Feedback

- **Report Issues**: [GitHub Issues](https://github.com/AkashAi7/Guardrail/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AkashAi7/Guardrail/discussions)
- **Feature Requests**: Open an issue with [Feature Request] tag

---

## 📊 Technical Details

**Backend:**
- Node.js + Express REST API
- Hybrid provider architecture with auto-detection
- Supports both streaming and batch analysis

**Extension:**
- VS Code Extension API
- Real-time diagnostics provider
- Code actions (quick fixes)
- Status bar integration

**Security:**
- Runs entirely on localhost
- No data sent to third parties (except chosen LLM provider)
- API keys stored locally in `.env`

---

## 🙏 Acknowledgments

Built with:
- [@github/copilot-sdk](https://www.npmjs.com/package/@github/copilot-sdk)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [OpenAI](https://openai.com/), [Anthropic](https://anthropic.com/), [Azure](https://azure.microsoft.com/)

---

## 📄 License

MIT License - See [LICENSE](https://github.com/AkashAi7/Guardrail/blob/main/LICENSE) for details

---

## ⬇️ Downloads

**Required Files** (download from Assets below):
- ✅ `install.ps1` - Windows installer (auto-configures everything)
- ✅ `code-guardrail-0.1.0.vsix` - VS Code extension (included in installer)

**Installation command:**
```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

---

**Enjoy secure coding! 🛡️**
