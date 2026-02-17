# GitHub Releases Publishing Guide

This guide explains how to create and publish GitHub Releases for Code Guardrail.

## Why GitHub Releases?

- **Lightweight**: ~10MB download vs ~400MB full repo clone
- **Fast**: Users download pre-built artifacts, no compilation needed
- **Professional**: Versioned releases with changelogs
- **One-Click**: Single command installation from release artifacts

---

## Build Release Artifacts

### 1. Build the Release Package

Run the build script to create distribution files:

```powershell
# Windows
.\scripts\build-release.ps1 -Version "0.1.0"
```

```bash
# macOS/Linux
chmod +x scripts/build-release.sh
./scripts/build-release.sh 0.1.0
```

This creates:
- `release/guardrail-service-v0.1.0.zip` (~10MB) - Pre-built service with dependencies
- `release/code-guardrail-0.1.0.vsix` (~33KB) - VS Code extension
- `release/RELEASE_NOTES.md` - Auto-generated release notes

### 2. Verify Artifacts

```powershell
# Check what's in the service package
Expand-Archive -Path release/guardrail-service-v0.1.0.zip -DestinationPath temp-check
ls temp-check
# Should see: dist/, node_modules/, governance/, package.json, .env.example, start.bat, install.bat
```

---

## Publish to GitHub

### Option 1: GitHub Web UI (Recommended)

1. **Go to Releases Page**:
   - Visit: https://github.com/AkashAi7/Guardrail/releases
   - Click **"Draft a new release"**

2. **Create Tag**:
   - **Tag**: `v0.1.0` (must start with 'v')
   - **Target**: `main` branch
   - Click **"Create new tag: v0.1.0 on publish"**

3. **Release Details**:
   - **Title**: `Code Guardrail v0.1.0`
   - **Description**: Copy content from `release/RELEASE_NOTES.md`

4. **Upload Artifacts**:
   - Drag and drop:
     - `release/guardrail-service-v0.1.0.zip`
     - `release/code-guardrail-0.1.0.vsix`
   
5. **Add Installer Scripts** (Important!):
   - Upload `scripts/install-from-release.ps1` as `install.ps1`
   - Upload `scripts/install-from-release.sh` as `install.sh`

6. **Publish**:
   - ✅ Check **"Set as the latest release"**
   - Click **"Publish release"**

### Option 2: GitHub CLI

```bash
# Install GitHub CLI (if needed)
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

## Update Documentation

After publishing, update installation instructions:

### Update README.md

```markdown
## 🚀 Quick Install

### One-Line Installation (Recommended)

**Windows:**
```powershell
iwr -useb https://github.com/AkashAi7/Guardrail/releases/download/v0.1.0/install.ps1 | iex
```

**macOS/Linux:**
```bash
curl -fsSL https://github.com/AkashAi7/Guardrail/releases/download/v0.1.0/install.sh | bash
```

### Manual Installation

1. Download from [Latest Release](https://github.com/AkashAi7/Guardrail/releases/latest)
2. Extract `guardrail-service-v0.1.0.zip` to `~/.guardrail`
3. Install extension: `code --install-extension code-guardrail-0.1.0.vsix`
4. Start service: `cd ~/.guardrail && npm start`
```

---

## Test Installation

After publishing, verify the installation works:

### Windows Test

```powershell
# Remove existing installation
Remove-Item "$env:USERPROFILE\.guardrail" -Recurse -Force -ErrorAction SilentlyContinue
code --uninstall-extension akashai7.code-guardrail

# Test fresh install
iwr -useb https://github.com/AkashAi7/Guardrail/releases/download/v0.1.0/install.ps1 | iex

# Verify
curl http://localhost:3000/health
code --list-extensions | Select-String "guardrail"
```

### macOS/Linux Test

```bash
# Remove existing installation
rm -rf ~/.guardrail
code --uninstall-extension akashai7.code-guardrail

# Test fresh install
curl -fsSL https://github.com/AkashAi7/Guardrail/releases/download/v0.1.0/install.sh | bash

# Verify
curl http://localhost:3000/health
code --list-extensions | grep guardrail
```

---

## Release Versioning

Follow [Semantic Versioning](https://semver.org/):

- **v0.1.0** - Initial release
- **v0.1.1** - Patch (bug fixes)
- **v0.2.0** - Minor (new features, backward compatible)
- **v1.0.0** - Major (breaking changes)

### Update Version Numbers

Before building a new release:

```json
// service/package.json
{
  "version": "0.2.0"
}

// extension/package.json
{
  "version": "0.2.0"
}
```

Then rebuild:
```powershell
.\scripts\build-release.ps1 -Version "0.2.0"
```

---

## Automation (Future Enhancement)

### GitHub Actions Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build Release
        run: |
          chmod +x scripts/build-release.sh
          ./scripts/build-release.sh ${GITHUB_REF#refs/tags/v}
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            release/guardrail-service-*.zip
            release/code-guardrail-*.vsix
            scripts/install-from-release.ps1
            scripts/install-from-release.sh
          body_path: release/RELEASE_NOTES.md
```

Then just push a tag:
```bash
git tag v0.2.0
git push origin v0.2.0
# GitHub Actions automatically builds and publishes!
```

---

## Troubleshooting

### Build Errors

**"npm ERR! ENOENT: no such file or directory"**
- Ensure you run build from repository root
- Check Node.js and npm are installed

**"VSIX packaging failed"**
- Ensure extension compiles first: `cd extension && npm run compile`
- Check all required files exist (icon.png, README.md, etc.)

### Installation Errors

**"404 Not Found" during install**
- Verify release is published (not draft)
- Check URL matches: `v0.1.0` (with 'v' prefix)
- Ensure files are uploaded to release

**"Service won't start"**
- Check Node.js version: `node --version` (need 18+)
- Review logs: `~/.guardrail/service.log`
- Verify .env file exists: `ls ~/.guardrail/.env`

---

## Next Steps

1. ✅ Build release: `.\scripts\build-release.ps1`
2. ✅ Publish to GitHub: https://github.com/AkashAi7/Guardrail/releases/new
3. ✅ Test installation from release
4. ✅ Update README.md with release URLs
5. 🔄 (Optional) Setup GitHub Actions for automation

---

## Links

- **Repository**: https://github.com/AkashAi7/Guardrail
- **Releases**: https://github.com/AkashAi7/Guardrail/releases
- **Issues**: https://github.com/AkashAi7/Guardrail/issues
- **Discussions**: https://github.com/AkashAi7/Guardrail/discussions
