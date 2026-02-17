# GitHub Releases - Ready to Publish! 🚀

## ✅ What's Complete

### 1. Build System
- ✅ `scripts/build-release.ps1` - Windows build script
- ✅ `scripts/build-release.sh` - Linux/macOS build script
- ✅ Automated artifact creation (service ZIP + extension VSIX)
- ✅ Auto-generated release notes with checksums

### 2. Installation Scripts
- ✅ `scripts/install-from-release.ps1` - Windows one-line installer
- ✅ `scripts/install-from-release.sh` - Linux/macOS one-line installer
- ✅ Downloads from GitHub releases (lightweight ~104MB vs ~400MB repo)
- ✅ Automated service startup and extension installation

### 3. Documentation
- ✅ `GITHUB_RELEASES.md` - Complete publishing guide
- ✅ Versioning strategy (SemVer)
- ✅ Troubleshooting guide
- ✅ GitHub Actions automation template (future)

### 4. Release Artifacts (Built)
Located in `./release/`:
- ✅ `guardrail-service-v0.1.0.zip` (103.6 MB) - Pre-built service with dependencies
- ✅ `code-guardrail-0.1.0.vsix` (33 KB) - VS Code extension
- ✅ `RELEASE_NOTES.md` (3 KB) - Auto-generated release notes

---

## 🚀 Next Steps: Publish to GitHub

### Option 1: GitHub Web UI (Easy - Recommended)

#### Step 1: Go to Releases Page
Visit: **https://github.com/AkashAi7/Guardrail/releases/new**

#### Step 2: Create Tag
- **Tag**: `v0.1.0` (with 'v' prefix)
- **Target**: `main` branch
- Click **"Create new tag: v0.1.0 on publish"**

#### Step 3: Release Details
- **Title**: `Code Guardrail v0.1.0`
- **Description**: Copy content from `release/RELEASE_NOTES.md`

#### Step 4: Upload Files
Drag and drop these files:
1. `release/guardrail-service-v0.1.0.zip`
2. `release/code-guardrail-0.1.0.vsix`
3. Rename and upload: `scripts/install-from-release.ps1` → `install.ps1`
4. Rename and upload: `scripts/install-from-release.sh` → `install.sh`

#### Step 5: Publish
- ✅ Check **"Set as the latest release"**
- Click **"Publish release"**

---

### Option 2: GitHub CLI (Fast)

```bash
# Install GitHub CLI if needed
# Windows: winget install GitHub.cli
# macOS: brew install gh
# Linux: https://github.com/cli/cli#installation

# Login
gh auth login

# Create release
gh release create v0.1.0 \
  --title "Code Guardrail v0.1.0" \
  --notes-file release/RELEASE_NOTES.md \
  release/guardrail-service-v0.1.0.zip \
  release/code-guardrail-0.1.0.vsix \
  scripts/install-from-release.ps1#install.ps1 \
  scripts/install-from-release.sh#install.sh
```

---

## 🧪 Test the Release (After Publishing)

### Windows Test:
```powershell
# Remove existing installation
Remove-Item "$env:USERPROFILE\.guardrail" -Recurse -Force -ErrorAction SilentlyContinue
code --uninstall-extension akashai7.code-guardrail

# Test fresh install from release
iwr -useb https://github.com/AkashAi7/Guardrail/releases/download/v0.1.0/install.ps1 | iex

# Verify
curl http://localhost:3000/health
code --list-extensions | Select-String "guardrail"
```

### macOS/Linux Test:
```bash
# Remove existing installation
rm -rf ~/.guardrail
code --uninstall-extension akashai7.code-guardrail

# Test fresh install from release
curl -fsSL https://github.com/AkashAi7/Guardrail/releases/download/v0.1.0/install.sh | bash

# Verify
curl http://localhost:3000/health
code --list-extensions | grep guardrail
```

---

## 📝 Update Documentation (After Testing)

### Update README.md

Replace the installation section with:

```markdown
## 🚀 Quick Install

### One-Line Installation (Recommended)

**Windows:**
\```powershell
iwr -useb https://github.com/AkashAi7/Guardrail/releases/download/v0.1.0/install.ps1 | iex
\```

**macOS/Linux:**
\```bash
curl -fsSL https://github.com/AkashAi7/Guardrail/releases/download/v0.1.0/install.sh | bash
\```

Downloads only ~104MB of pre-built files vs ~400MB full repo clone!

### Manual Installation

Download from [**Latest Release**](https://github.com/AkashAi7/Guardrail/releases/latest):
1. Extract `guardrail-service-v0.1.0.zip` to `~/.guardrail`
2. Run: `code --install-extension code-guardrail-0.1.0.vsix`
3. Start: `cd ~/.guardrail/guardrail-service && npm start`
```

---

## 🎯 Benefits Summary

### Before (Repo Clone):
- ❌ ~400MB download (entire repo)
- ❌ Need to install dependencies (~5 minutes)
- ❌ Need to compile TypeScript
- ❌ Multiple manual steps

### After (GitHub Releases):
- ✅ ~104MB download (only needed files)
- ✅ Pre-built and ready to run
- ✅ **One command installation**
- ✅ Automatic service startup
- ✅ Professional versioning

---

## 📊 File Breakdown

### Service Package (103.6 MB)
- `dist/` - Compiled JavaScript
- `node_modules/` - Production dependencies
  - `@github/*` - 245 MB (GitHub Copilot SDK - required)
  - Other deps - ~5 MB
- `governance/` - Rules library
- `.env.example`, `package.json`, startup scripts

### Extension Package (33 KB)
- `out/` - Compiled extension
- Icons, README, LICENSE
- No source TypeScript (excluded via .vscodeignore)

---

## 🔄 Future Releases

### Update Version:
```json
// service/package.json & extension/package.json
{
  "version": "0.2.0"
}
```

### Build New Release:
```powershell
.\scripts\build-release.ps1 -Version "0.2.0"
```

### Publish:
Follow steps above with new version number.

---

## 💡 Tips

1. **Always test** the installer after publishing
2. **Update README.md** with the latest version numbers
3. **Create GitHub Issues** for user feedback
4. **Consider GitHub Actions** for automated releases (see GITHUB_RELEASES.md)
5. **Monitor download stats** at: https://github.com/AkashAi7/Guardrail/releases

---

## 📚 Resources

- **GITHUB_RELEASES.md** - Complete publishing guide with troubleshooting
- **VS_CODE_MARKETPLACE.md** - VS Code Marketplace publishing (parallel track)
- **INSTALL.md** - Full installation documentation
- **Repository**: https://github.com/AkashAi7/Guardrail

---

## ✨ You're Ready!

All files are prepared and committed. Just visit:
👉 **https://github.com/AkashAi7/Guardrail/releases/new**

And follow the steps above to publish your first release! 🎉
