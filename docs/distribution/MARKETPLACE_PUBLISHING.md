# 📦 VS Code Marketplace Publishing Guide

## Step-by-Step: Publishing Guardrail to VS Code Marketplace

---

## Prerequisites ✅

- [x] Extension packaged (.vsix file)
- [x] Publisher name set in package.json: **AkashAi7**
- [ ] Microsoft Account (for Azure DevOps)
- [ ] Publisher account created on VS Code Marketplace
- [ ] Personal Access Token (PAT) from Azure DevOps

---

## Step 1: Create Publisher Account

### 1.1 Go to VS Code Marketplace Management
```
https://marketplace.visualstudio.com/manage
```

### 1.2 Sign in with Microsoft Account
- Use your Microsoft/GitHub account
- Accept terms and conditions

### 1.3 Create Publisher
- Click **"Create publisher"**
- **Publisher ID**: `AkashAi7` (must match package.json)
- **Display Name**: `Akash Dwivedi` or `AkashAi7`
- **Description**: `Developer focused on code security and AI tools`
- Click **"Create"**

---

## Step 2: Get Personal Access Token (PAT)

### 2.1 Go to Azure DevOps
```
https://dev.azure.com
```
- Sign in with the SAME Microsoft account

### 2.2 Create PAT
1. Click your profile icon (top right)
2. Click **"Personal access tokens"**
3. Click **"+ New Token"**

### 2.3 Configure Token
- **Name**: `VSCode Marketplace Publishing`
- **Organization**: Select **"All accessible organizations"**
- **Expiration**: 90 days (or custom)
- **Scopes**: Click **"Show all scopes"** → Select **"Marketplace"** → Check **"Manage"**
- Click **"Create"**

### 2.4 Copy Token
- ⚠️ **COPY THE TOKEN NOW** - You won't see it again!
- Save it temporarily (we'll use it in Step 3)

---

## Step 3: Login with VSCE

Run this command and paste your PAT when prompted:

```powershell
cd "c:\Users\akashdwivedi\OneDrive - Microsoft\Desktop\IntrestingIdeas\Guardrail\extension"

npx @vscode/vsce login AkashAi7
# When prompted, paste your PAT token
```

**Expected Output:**
```
Personal Access Token: ************************************
The Personal Access Token verification succeeded for the publisher 'AkashAi7'.
```

---

## Step 4: Publish Extension

### Option A: Publish Current Version (0.1.0)

```powershell
cd "c:\Users\akashdwivedi\OneDrive - Microsoft\Desktop\IntrestingIdeas\Guardrail\extension"

npx @vscode/vsce publish
```

### Option B: Publish and Increment Version

```powershell
# Publish as patch (0.1.0 → 0.1.1)
npx @vscode/vsce publish patch

# Publish as minor (0.1.0 → 0.2.0)
npx @vscode/vsce publish minor

# Publish as major (0.1.0 → 1.0.0)
npx @vscode/vsce publish major
```

---

## Step 5: Verify Publication

### 5.1 Check Marketplace
After 1-2 minutes, visit:
```
https://marketplace.visualstudio.com/items?itemName=AkashAi7.code-guardrail
```

### 5.2 Search in VS Code
1. Open VS Code
2. Press `Ctrl+Shift+X`
3. Search for **"Code Guardrail"**
4. Should see your extension!

### 5.3 Install from Marketplace
```bash
# Users can now install with:
code --install-extension AkashAi7.code-guardrail
```

---

## 📝 Important Notes

### ⚠️ Backend Service Requirement
The extension requires the backend service to function. Users must:
1. Install the backend service (using `install.ps1`)
2. OR manually set up the service

**Add to README.md:**
```markdown
## Installation

### Option 1: Complete Setup (Recommended)
Download and run the installer from [GitHub Releases](https://github.com/AkashAi7/Guardrail/releases):
```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

### Option 2: Extension Only (Advanced)
If you already have the backend service running:
1. Install from VS Code Marketplace: Search "Code Guardrail"
2. Ensure backend is running on `localhost:3000`
```

### 📊 Marketplace Review Process
- **Automatic**: Most extensions are auto-approved
- **Manual Review**: If extension has certain permissions/features
- **Timeline**: 1-2 days typically
- **Status**: Check at https://marketplace.visualstudio.com/manage

### 🔄 Publishing Updates
```powershell
cd extension

# Make changes to code...
npm run compile

# Publish update (auto-increments version)
npx @vscode/vsce publish patch
```

---

## 🚨 Pre-Publication Checklist

Before publishing, ensure:

- [ ] README.md is comprehensive and helpful
- [ ] CHANGELOG.md documents version changes
- [ ] LICENSE file is present (MIT)
- [ ] Icon is added (optional but recommended)
- [ ] Screenshots/GIFs showing extension in action
- [ ] Extension works correctly (test on clean VS Code)
- [ ] No sensitive data in code
- [ ] Repository is public and accessible

---

## 🎨 Optional: Add Extension Icon

Create a 128x128 PNG icon and update package.json:

```json
{
  "icon": "icon.png",
  "galleryBanner": {
    "color": "#1e1e1e",
    "theme": "dark"
  }
}
```

---

## 📸 Optional: Add Screenshots

Create a `images/` folder with screenshots:

```markdown
## README.md
![Feature 1](images/screenshot1.png)
![Feature 2](images/screenshot2.png)
```

---

## 🔗 Useful Links

- **Marketplace Management**: https://marketplace.visualstudio.com/manage
- **Azure DevOps**: https://dev.azure.com
- **Publishing Guide**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **VSCE Documentation**: https://github.com/microsoft/vscode-vsce

---

## 🎯 Quick Command Reference

```powershell
# Login
npx @vscode/vsce login AkashAi7

# Publish
npx @vscode/vsce publish

# Publish with version bump
npx @vscode/vsce publish patch   # 0.1.0 → 0.1.1
npx @vscode/vsce publish minor   # 0.1.0 → 0.2.0
npx @vscode/vsce publish major   # 0.1.0 → 1.0.0

# Package without publishing
npx @vscode/vsce package

# Show extension info
npx @vscode/vsce show AkashAi7.code-guardrail

# Unpublish (careful!)
npx @vscode/vsce unpublish AkashAi7.code-guardrail
```

---

## 🎉 After Publishing

1. **Update GitHub README**: Add marketplace badge
   ```markdown
   [![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/AkashAi7.code-guardrail)](https://marketplace.visualstudio.com/items?itemName=AkashAi7.code-guardrail)
   ```

2. **Update GitHub Release**: Mention marketplace availability

3. **Share on Social Media**: Twitter, LinkedIn, Reddit (r/vscode)

4. **Monitor Reviews**: Respond to user feedback

---

**Ready to publish? Start with Step 1! 🚀**
