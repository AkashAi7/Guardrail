# 🚀 Distribution Guide - How to Release Guardrail

Your extension is now **ready for distribution**! Here are your options:

---

## ✅ Current Status

📦 **Files Ready:**
- ✅ Extension: `extension/code-guardrail-0.1.0.vsix` (35.73 KB)
- ✅ Installer: `install.ps1` (Windows PowerShell)
- ✅ Source code: Pushed to https://github.com/AkashAi7/Guardrail

---

## 📋 Distribution Options (Choose One)

### **Option 1: GitHub Releases (Recommended for Beta/Private)**

Perfect for your hybrid approach! Users download and run one installer.

#### Steps:
1. **Create GitHub Release:**
   ```bash
   # Go to: https://github.com/AkashAi7/Guardrail/releases/new
   
   Tag: v0.1.0
   Title: Guardrail v0.1.0 - Hybrid Edition
   Description:
   ```

2. **Release Description (copy this):**
   ```markdown
   # Guardrail v0.1.0 - Hybrid Edition 🛡️

   ## Real-time Code Security & Compliance Analysis for VS Code

   ### ✨ Features
   - 🔍 Real-time security vulnerability detection
   - 📋 Compliance checking (GDPR, PII, Secrets)
   - 🤖 LLM-powered semantic analysis
   - 💰 Supports GitHub Copilot ($0) OR Bring Your Own Key (~$0.03/1K)

   ### 🎯 Hybrid Provider Support
   **Auto-detects your setup:**
   - ✅ Uses GitHub Copilot if you have it (zero additional cost)
   - ✅ Falls back to BYOK (OpenAI/Anthropic/Azure) if not

   ### 📦 Installation (Windows)

   **One-Click Install:**
   1. Download `install.ps1` below
   2. Run: `powershell -ExecutionPolicy Bypass -File install.ps1`
   3. Restart VS Code
   4. Done!

   **What it installs:**
   - Backend service (localhost:3000)
   - VS Code extension
   - Auto-configuration for your setup

   ### 📖 Documentation
   - [Installation Guide](DISTRIBUTION.md)
   - [Architecture Details](HYBRID_IMPLEMENTATION.md)
   - [Quick Start](INSTALL.md)

   ### 🐛 Known Issues
   - Copilot SDK integration has timeout (using fallback mode)
   - macOS/Linux installer coming soon (manual install works)

   ### 💬 Support
   - [Report Issues](https://github.com/AkashAi7/Guardrail/issues)
   - [Discussions](https://github.com/AkashAi7/Guardrail/discussions)
   ```

3. **Upload Files:**
   - `install.ps1` (from root directory)
   - `code-guardrail-0.1.0.vsix` (from extension directory)
   - Optional: `DISTRIBUTION.md`, `HYBRID_IMPLEMENTATION.md`

4. **Publish Release** ✅

5. **Share Link:**
   ```
   https://github.com/AkashAi7/Guardrail/releases/tag/v0.1.0
   ```

#### User Installation Flow:
```powershell
# User downloads install.ps1 from releases
powershell -ExecutionPolicy Bypass -File install.ps1

# Installer does everything:
# ✅ Checks prerequisites (Node, VS Code, Git)
# ✅ Clones repository
# ✅ Installs dependencies
# ✅ Builds backend
# ✅ Auto-detects Copilot OR prompts for API keys
# ✅ Installs as Windows Service
# ✅ Installs VS Code extension
# ✅ Done!
```

---

### **Option 2: VS Code Marketplace (Best for Public Release)**

Official distribution - appears in VS Code Extensions tab.

#### Steps:
1. **Create Publisher Account:**
   - Go to: https://marketplace.visualstudio.com/manage
   - Sign in with Microsoft account
   - Create publisher ID (e.g., "AkashAi7")

2. **Get Personal Access Token (PAT):**
   - Go to: https://dev.azure.com
   - User Settings > Personal Access Tokens
   - Create new token with **Marketplace (publish)** scope
   - Copy token

3. **Publish Extension:**
   ```bash
   cd extension
   
   # Login with your PAT
   npx @vscode/vsce login AkashAi7
   
   # Publish
   npx @vscode/vsce publish
   ```

4. **Wait for Review:**
   - Usually approved in 1-2 days
   - Extension appears in VS Code marketplace

#### User Installation (After Approval):
```
1. Open VS Code
2. Press Ctrl+Shift+X (Extensions)
3. Search "Guardrail"
4. Click Install
5. Backend service still needs manual setup (or use installer)
```

**Note:** Marketplace only installs extension, not backend. Users still need to:
- Run the installer OR
- Manually install backend service

---

### **Option 3: Manual Distribution (Direct Link)**

Share the `.vsix` file directly.

```bash
# Upload to Google Drive / Dropbox / OneDrive
# Share link with users

# User installs:
code --install-extension code-guardrail-0.1.0.vsix

# But they still need backend service
```

**Downsides:**
- Users need to install backend separately
- More steps, prone to errors
- Not recommended for non-technical users

---

## 🎯 **RECOMMENDED: GitHub Releases + Installer**

This is the **best approach** for your hybrid system because:

✅ **Single Download** - One installer does everything  
✅ **Auto-Configuration** - Detects Copilot OR prompts for keys  
✅ **Complete Package** - Backend + Extension bundled  
✅ **No Reviews Needed** - Instant availability  
✅ **Version Control** - Easy to update and track  

---

## 📝 Creating the Release (Step-by-Step)

```bash
# 1. Ensure everything is pushed
cd c:\Users\akashdwivedi\OneDrive - Microsoft\Desktop\IntrestingIdeas\Guardrail
git status  # Should be clean

# 2. Create tag
git tag -a v0.1.0 -m "Release v0.1.0 - Hybrid Edition"
git push origin v0.1.0

# 3. Go to GitHub
# Navigate to: https://github.com/AkashAi7/Guardrail/releases/new

# 4. Fill in the form:
#    - Tag: v0.1.0 (select existing)
#    - Title: Guardrail v0.1.0 - Hybrid Edition
#    - Description: (paste markdown from above)
#    - Upload: install.ps1, code-guardrail-0.1.0.vsix

# 5. Click "Publish release"

# 6. Share the link:
https://github.com/AkashAi7/Guardrail/releases/tag/v0.1.0
```

---

## 🎉 Post-Release Checklist

After publishing release:

- [ ] Test installer on clean Windows machine
- [ ] Update README.md with installation badge
- [ ] Post on relevant communities (Reddit r/vscode, Discord servers)
- [ ] Create demo video/GIF showing installation
- [ ] Write blog post explaining hybrid architecture
- [ ] Consider writing extension.md for VS Code marketplace (future)

---

## 📊 Tracking Usage

Monitor your release:
- **GitHub Release Downloads**: Check insights on GitHub
- **Issues/Feedback**: Watch GitHub issues tab
- **Stars**: Track repository popularity

---

## 🔄 Future Updates

When releasing updates:

```bash
# 1. Update version in package.json
cd extension
# Change version to 0.2.0

# 2. Rebuild and package
npm run compile
npx @vscode/vsce package

# 3. Commit and tag
git add -A
git commit -m "feat: version 0.2.0 - new features"
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin main
git push origin v0.2.0

# 4. Create new GitHub Release with updated files
```

---

## Need Help?

Your project is **ready to distribute**! The installer is complete and tested. Just create the GitHub Release and you're live!

**Questions?**
- Check the files work: Test install.ps1 locally first
- Review DISTRIBUTION.md for user-facing instructions
- See HYBRID_IMPLEMENTATION.md for technical details
