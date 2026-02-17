# Code Guardrail - Installation Guide

## 🚀 Quick Install (5 minutes)

### Prerequisites
- Windows/macOS/Linux
- Node.js 18+ installed
- VS Code installed
- GitHub Copilot CLI installed and authenticated

---

## 📦 Installation Steps

### Step 1: Install Copilot CLI (If Not Already Installed)

```bash
# Install
npm install -g @github/copilot

# Verify
copilot --version

# Authenticate (opens browser)
copilot auth
```

### Step 2: Download Code Guardrail

**Option A: From GitHub Releases**
```bash
# Download latest release
# Extract to a folder
```

**Option B: Clone Repository**
```bash
git clone https://github.com/AkashAi7/Guardrail.git
cd Guardrail
```

### Step 3: Start Backend Service

```bash
cd service
npm install
npm start
```

You should see:
```
🛡️  GUARDRAIL SERVICE
🚀 Server running on http://localhost:3000
✅ Copilot CLI connected
```

**Keep this terminal open!**

### Step 4: Install VS Code Extension

**Option A: From File**
```bash
cd ../extension
code --install-extension code-guardrail-0.1.0.vsix
```

**Option B: From VS Code**
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Click "..." menu → "Install from VSIX"
4. Select `extension/code-guardrail-0.1.0.vsix`

### Step 5: Verify Installation

1. Open any TypeScript file
2. Type insecure code (e.g., `const password = "admin123";`)
3. Wait 2 seconds
4. See red squiggles appear! ✨

---

## 🎯 For Demos/Testing

### One-Line Start (After Installation)

**Terminal 1: Start Backend**
```bash
cd Guardrail/service && npm start
```

**Terminal 2: Open Demo**
```bash
code Guardrail/DEMO.ts
```

---

## 🔧 Configuration

### Backend (.env file)
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
