# Installation Guide

Complete installation instructions for Code Guardrail v0.4.0.

## Quick Install (Recommended)

**Windows PowerShell:**
```powershell
irm https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install-from-release.ps1 | iex
```

This will:
1. Check prerequisites (Node.js, VS Code)
2. Download the extension (6 MB)
3. Install to VS Code
4. Verify installation

**Expected output:**
```
✅ Node.js: v20.11.1
✅ VS Code: 1.109.4
✅ Downloading extension...
✅ Installing to VS Code...
✅ Code Guardrail v0.4.0 installed successfully!
```

---

## Manual Installation

### Step 1: Download

Download the VSIX file from GitHub releases:
- **[code-guardrail-0.4.0.vsix](https://github.com/AkashAi7/Guardrail/releases/download/v0.4.0/code-guardrail-0.4.0.vsix)** (6 MB)

### Step 2: Install

**Option A: Command Line**
```powershell
code --install-extension code-guardrail-0.4.0.vsix
```

**Option B: VS Code UI**
1. Open VS Code
2. Press `Ctrl+Shift+P`
3. Type: "Extensions: Install from VSIX"
4. Select the downloaded `.vsix` file

### Step 3: Verify

```powershell
code --list-extensions | Select-String "guardrail"
```

Expected: `akashai7.code-guardrail`

---

## Prerequisites

- **VS Code**: 1.85.0 or higher ([Download](https://code.visualstudio.com/))
- **Node.js**: Not required (extension is self-contained)

---

## Upgrading from v0.1.0

If you have the old version installed:

```powershell
# 1. Uninstall old version
code --uninstall-extension akashai7.code-guardrail

# 2. Remove old files
Remove-Item "$env:USERPROFILE\.vscode\extensions\*guardrail*" -Recurse -Force

# 3. Install new version
irm https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install-from-release.ps1 | iex
```

---

## Verification

After installation, test that it works:

```powershell
# Download verification script
irm https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/verify-installation.ps1 | iex
```

This will:
1. Check extension is installed
2. Verify version is 0.4.0
3. Create a test file
4. Check that issues are detected

---

## Troubleshooting

If installation fails, see **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**.

Common issues:
- **Extension not found**: Restart VS Code
- **Old version persists**: Manually delete from `%USERPROFILE%\.vscode\extensions\`
- **Permission denied**: Run PowerShell as Administrator

---

## Next Steps

➡️ **[Getting Started Guide](GETTING_STARTED.md)** - Learn how to use Code Guardrail  
➡️ **[Organization Setup](docs/distribution/DISTRIBUTION_GUIDE.md)** - Share rules with your team

---

[⬅ Back to README](README.md)
