# 🚀 VS Code Marketplace Publishing Guide

Complete guide to publish Code Guardrail extension to the VS Code Marketplace.

---

## 📋 Pre-Publishing Checklist

### ✅ Required Files (All Present)
- [x] `package.json` - With marketplace fields
- [x] `README.md` - Extension documentation
- [x] `CHANGELOG.md` - Version history
- [x] `LICENSE` - MIT License
- [x] `icon.png` - Extension icon (128x128)
- [x] `.vscodeignore` - Files to exclude

### ✅ Package.json Requirements
- [x] `name` - Unique extension name
- [x] `displayName` - User-friendly name
- [x] `description` - Clear description
- [x] `version` - Semantic version (0.1.0)
- [x] `publisher` - Your publisher ID
- [x] `icon` - Path to icon file
- [x] `repository` - GitHub repository URL
- [x] `license` - License type
- [x] `engines.vscode` - VS Code version compatibility

---

## 🎯 Step-by-Step Publishing Process

### Step 1: Create Icon (PNG format required)

VS Code Marketplace requires a **128x128 PNG icon**.

**Convert the SVG to PNG:**

**Option A: Using online tool**
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `extension/icon.svg`
3. Set dimensions: 128x128
4. Download as `icon.png`
5. Save to `extension/icon.png`

**Option B: Using ImageMagick (command line)**
```bash
# Install ImageMagick first
# Windows: choco install imagemagick
# macOS: brew install imagemagick
# Linux: apt install imagemagick

# Convert
convert -background none -resize 128x128 extension/icon.svg extension/icon.png
```

**Option C: Using Node.js**
```bash
cd extension
npm install sharp
node -e "require('sharp')('icon.svg').resize(128,128).png().toFile('icon.png')"
```

---

### Step 2: Create Publisher Account

1. **Sign in to Azure DevOps:**
   - Go to: https://aka.ms/vscode-create-publisher
   - Sign in with Microsoft account

2. **Create Personal Access Token (PAT):**
   - Go to: https://dev.azure.com/[your-org]/_usersSettings/tokens
   - Click "New Token"
   - Name: `VSCode Extension Publisher`
   - Organization: `All accessible organizations`
   - Scopes: **Marketplace** → **Manage** (check this)
   - Click "Create"
   - **SAVE THE TOKEN** - you can't see it again!

3. **Create Publisher:**
   - Go to: https://marketplace.visualstudio.com/manage
   - Click "Create publisher"
   - Publisher ID: `AkashAi7` (must match package.json)
   - Display Name: `Akash Dwivedi` (your name)
   - Email: Your email
   - Click "Create"

---

### Step 3: Install VSCE (Publishing Tool)

```bash
npm install -g @vscode/vsce
```

---

### Step 4: Login to Publisher

```bash
vsce login AkashAi7
```

Enter your Personal Access Token when prompted.

---

### Step 5: Package and Verify

```bash
cd extension

# Build the extension
npm install
npm run compile

# Package (creates .vsix file)
vsce package

# Expected output:
# code-guardrail-0.1.0.vsix created successfully!
```

**Test the packaged extension:**
```bash
code --install-extension code-guardrail-0.1.0.vsix
```

Test it works, then uninstall:
```bash
code --uninstall-extension AkashAi7.code-guardrail
```

---

### Step 6: Publish to Marketplace

```bash
cd extension

# Publish
vsce publish

# Or publish with specific version bump
vsce publish patch   # 0.1.0 → 0.1.1
vsce publish minor   # 0.1.0 → 0.2.0
vsce publish major   # 0.1.0 → 1.0.0
```

**Expected output:**
```
Publishing AkashAi7.code-guardrail@0.1.0...
Successfully published AkashAi7.code-guardrail@0.1.0!

Your extension will be live in a few minutes:
https://marketplace.visualstudio.com/items?itemName=AkashAi7.code-guardrail
```

---

### Step 7: Wait for Approval

- **Initial validation:** ~5 minutes
- **Marketplace listing:** ~10-15 minutes
- You'll receive email confirmation

---

### Step 8: Verify Publication

1. **Check Marketplace:**
   - https://marketplace.visualstudio.com/items?itemName=AkashAi7.code-guardrail

2. **Install from Marketplace:**
   ```bash
   code --install-extension AkashAi7.code-guardrail
   ```

3. **Or from VS Code UI:**
   - Open Extensions view (`Ctrl+Shift+X`)
   - Search: "Code Guardrail"
   - Click "Install"

---

## 🔄 Updating the Extension

### Update Version

Edit `extension/package.json`:
```json
{
  "version": "0.2.0"
}
```

Update `extension/CHANGELOG.md`:
```markdown
## [0.2.0] - 2026-02-18
### Added
- New feature X
### Fixed
- Bug Y
```

### Publish Update

```bash
cd extension
npm run compile
vsce publish
```

---

## 📝 After Publishing

### 1. Update Installation Instructions

Update `README.md` and `INSTALL.md`:

**Old (manual install):**
```bash
git clone https://github.com/AkashAi7/Guardrail.git
cd Guardrail/extension
npm install && npm run compile && npm run package
code --install-extension code-guardrail-0.1.0.vsix
```

**New (marketplace install):**
```bash
# From command line
code --install-extension AkashAi7.code-guardrail

# Or search "Code Guardrail" in VS Code Extensions view
```

### 2. Add Marketplace Badge

Add to `README.md`:
```markdown
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/AkashAi7.code-guardrail)](https://marketplace.visualstudio.com/items?itemName=AkashAi7.code-guardrail)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/AkashAi7.code-guardrail)](https://marketplace.visualstudio.com/items?itemName=AkashAi7.code-guardrail)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/AkashAi7.code-guardrail)](https://marketplace.visualstudio.com/items?itemName=AkashAi7.code-guardrail)
```

### 3. Simplify Installer

Update `install.ps1` and `install.sh` to use marketplace install:
```powershell
# Install extension from marketplace (automatic)
code --install-extension AkashAi7.code-guardrail
```

---

## 🎨 Marketplace Page Customization

The marketplace uses your extension's `README.md` as the main page.

**Optimize for marketplace:**

1. **Add demo GIF/images** at the top
2. **Clear feature list**
3. **Installation instructions**
4. **Screenshots** of the extension in action
5. **Link to documentation**

Example structure:
```markdown
# Code Guardrail

![Demo](https://github.com/AkashAi7/Guardrail/raw/main/demo.gif)

## Features
- 🔒 Real-time security analysis
- 📜 Compliance checking (GDPR, HIPAA, SOC2)
- ⚡ Powered by GitHub Copilot SDK

## Quick Start
1. Install extension
2. Start service: `cd ~/.guardrail/service && npm start`
3. Save any file → See analysis!

## Screenshots
[Add screenshots]
```

---

## 🚨 Common Issues & Solutions

### Issue: "Publisher not found"
**Solution:** Create publisher first at https://marketplace.visualstudio.com/manage

### Issue: "Invalid icon"
**Solution:** Icon must be 128x128 PNG (not SVG)

### Issue: "Package contains restricted files"
**Solution:** Update `.vscodeignore` to exclude unnecessary files

### Issue: "Extension validation failed"
**Solution:** 
- Check all URLs in package.json are valid
- Ensure README.md is present and not empty
- Verify LICENSE file exists

### Issue: "Publisher name mismatch"
**Solution:** Ensure `publisher` in package.json matches your publisher ID exactly

---

## 📊 Analytics & Monitoring

After publishing, monitor your extension:

1. **Publisher Dashboard:**
   - https://marketplace.visualstudio.com/manage/publishers/AkashAi7
   - View installs, ratings, and Q&A

2. **GitHub Insights:**
   - Monitor issues and discussions
   - Track stars and forks

3. **User Feedback:**
   - Respond to marketplace Q&A
   - Address GitHub issues promptly

---

## 🔐 Security Best Practices

1. **Never commit PAT token** - Store securely
2. **Use GitHub Actions** for automated publishing (optional)
3. **Enable 2FA** on Microsoft account
4. **Review permissions** regularly

---

## 🎉 Post-Launch Checklist

After successful publication:

- [ ] Test installation from marketplace
- [ ] Update all documentation
- [ ] Announce on social media
- [ ] Submit to VS Code newsletter
- [ ] Create GitHub release (v0.1.0)
- [ ] Monitor for user feedback
- [ ] Plan next version updates

---

## 🔗 Useful Links

- **Marketplace:** https://marketplace.visualstudio.com/manage
- **Publishing Guide:** https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **Extension Guidelines:** https://code.visualstudio.com/api/references/extension-guidelines
- **Marketplace Insights:** https://marketplace.visualstudio.com/vscode

---

## 🆘 Need Help?

- VS Code Extension Docs: https://code.visualstudio.com/api
- Marketplace Support: vsmarketplace@microsoft.com
- GitHub Issues: https://github.com/AkashAi7/Guardrail/issues

---

**Ready to publish? Let's do it!** 🚀

1. Convert icon.svg → icon.png
2. Create publisher account
3. Run `vsce publish`
4. Celebrate! 🎉
