## 🚀 Fully Automated - Zero Manual Setup!

This is a **game-changing release** - the extension now works completely automatically with **ZERO manual setup**!

### ⚡ What's New

**🎯 One-Click Installation**
- Just install the VSIX - that's it!
- Service auto-extracts and sets itself up on first run
- No repo cloning, no npm install, no manual steps
- Works instantly on **any machine**

**📦 Bundled Service**
- Pre-built service included in VSIX (~7MB)
- Auto-extracts to `~/.guardrail-service`
- Automatically installs dependencies (one-time, ~30 seconds)
- Runs automatically when VS Code starts

**✨ AI-Powered Analysis**
- Detects 30+ types of security vulnerabilities
- Hardcoded secrets, SQL injection, XSS, weak crypto
- Command injection, path traversal, missing auth
- And much more...

### 📥 Installation (Literally One Command!)

**Option 1: Direct Download**
- Download `code-guardrail-standalone.vsix` below
- Install: Extensions → ... → Install from VSIX
- **Done!** Restart VS Code and it works

**Option 2: Command Line**
```bash
code --install-extension code-guardrail-standalone.vsix
```

### 🎬 What Happens on First Run

1. Extension activates when VS Code starts
2. Detects no service installed
3. Auto-extracts bundled service to `~/.guardrail-service`
4. Runs `npm install` automatically (~30 seconds, one-time only)
5. Starts the AI service
6. **You're ready to go!** 🎉

Look for **🤖 AI** in the status bar.

### 🔍 Testing It Out

1. Open any TypeScript, Python, JavaScript file
2. AI automatically analyzes it for security issues
3. Issues appear in the Problems panel
4. Or use: `Ctrl+Shift+P` → "Code Guardrail: Scan Entire Project"

### 📚 Test Files

Want to see it in action? Clone the repo for test files:
```bash
git clone https://github.com/AkashAi7/Guardrail.git
cd Guardrail
code .
```

Open:
- `test-files/test-auth-service.ts` - 15 vulnerabilities
- `test-files/test-flask-api.py` - 17 vulnerabilities

### ⚙️ How It Works

```
1. Install VSIX → Extension activated
2. First run → Service auto-extracts to ~/.guardrail-service
3. Auto npm install → Dependencies installed
4. Service starts → Port 3000
5. AI analysis ready → Real-time security scanning
```

### 🆚 vs Previous Versions

| Feature | v0.6.0 | v0.7.0 (This Release) |
|---------|--------|------------------------|
| Repo cloning required | ✅ Yes | ❌ No |
| Manual npm install | ✅ Yes | ❌ No |
| Manual service start | ❌ No (auto) | ❌ No (auto) |
| Works on fresh machine | ⚠️ After setup | ✅ **Instantly** |
| Setup time | ~5 minutes | **~30 seconds** |

### 🎯 Breaking Changes

None! This is purely additive. If you had v0.6.0 working, it still works the same way.

### 📦 File Sizes

- VSIX: 7.04 MB (includes service + dependencies)
- First-run setup: Downloads ~10MB of production dependencies
- Total disk usage: ~17MB

### 🐛 Troubleshooting

If service doesn't start:
1. Check Output panel: View → Output → "Code Guardrail"
2. Ensure Node.js is installed: `node --version`
3. Check port 3000 is free: `netstat -ano | findstr :3000` (Windows) or `lsof -i :3000` (Mac/Linux)

### 🙏 Requirements

- VS Code 1.80+
- Node.js 18+ (for running the service)
- GitHub Copilot subscription (for AI analysis)

### 📖 Documentation

- [README](https://github.com/AkashAi7/Guardrail/blob/main/README.md)
- [Testing Guide](https://github.com/AkashAi7/Guardrail/blob/main/TESTING_ON_NEW_MACHINE.md)

---

**This is the version you want if you value your time!** 🚀

Just install and go - no repo needed, no manual setup, no headaches.

Commit: 9b565bb
