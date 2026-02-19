# 🚀 Auto-Install Prerequisites Feature

## Overview

The Code Guardrail installer now **automatically detects and installs missing prerequisites**, making installation truly one-click with zero manual setup required.

## What Gets Auto-Installed?

### Windows (PowerShell)
- ✅ **Node.js** (v20 LTS) - Downloads and installs silently via MSI installer
- ✅ **VS Code** - Downloads and installs latest stable version
- ✅ **PATH Configuration** - Automatically updates system PATH

### macOS
- ✅ **Homebrew** - Installs if not present
- ✅ **Node.js** - Installed via Homebrew
- ✅ **VS Code** - Installed via Homebrew Cask

### Linux
- ✅ **Node.js** - Installed via package manager (apt/yum/dnf)
- ✅ **VS Code** - Installed via official Microsoft repositories
- ✅ **unzip** - Auto-installed if missing

## How It Works

### Before (Old Behavior)
```
❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/
Installation failed. →  User has to manually install
```

### After (New Behavior)
```
⚠️ Node.js not found
📥 Downloading Node.js installer...
✅ Downloaded Node.js installer
🔧 Installing Node.js (this may take a few minutes)...
✅ Node.js installed: v20.11.1
✅ All prerequisites satisfied
→  Installation continues automatically!
```

## User Experience

### Windows
1. User runs: `iwr https://raw.githubusercontent.com/.../install.ps1 | iex`
2. Installer checks for Node.js and VS Code
3. If missing:
   - Downloads installers from official sources
   - Installs silently in background
   - Updates PATH automatically
4. Continues with Guardrail installation
5. **Total time:** ~5-8 minutes (with prerequisite installation)

### macOS/Linux
1. User runs: `curl -fsSL https://raw.githubusercontent.com/.../install.sh | bash`
2. Installer checks for Node.js and VS Code
3. If missing:
   - Detects package manager (apt/yum/brew)
   - Installs via native package manager
   - May prompt for sudo password
4. Continues with Guardrail installation
5. **Total time:** ~5-10 minutes (with prerequisite installation)

## Security Considerations

- ✅ Downloads from **official sources only**:
  - Node.js: `https://nodejs.org/dist/`
  - VS Code: `https://code.visualstudio.com/`
  - Package managers: Official system repos
- ✅ Uses HTTPS for all downloads
- ✅ Verifies installation success before proceeding
- ✅ No third-party mirrors or untrusted sources

## Permissions Required

### Windows
- **Standard installation:** User permissions (no admin)
- **Auto-install prerequisites:** Admin permissions (UAC prompt will appear)

### macOS/Linux
- **Standard installation:** User permissions
- **Auto-install prerequisites:** sudo permissions (prompted when needed)

## Fallback Behavior

If automatic installation fails:
```
❌ Failed to install Node.js automatically
   Please install manually from: https://nodejs.org/
```

The installer gracefully falls back to manual installation instructions.

## Benefits

### For Users
- 🚀 **True one-click installation** - No manual prerequisite setup
- ⏱️ **Saves time** - No need to visit multiple websites
- 🎯 **Reduces errors** - Correct versions installed automatically
- 💡 **Better UX** - Installation just works™

### For Support
- 📉 **Fewer support tickets** - "How do I install Node.js?"
- ✅ **Consistent environment** - Everyone gets the same versions
- 🔧 **Easier troubleshooting** - Known installation paths

## Technical Implementation

### PowerShell (Windows)

```powershell
# Check Node.js
try {
    $nodeVersion = node --version
    # Already installed
} catch {
    # Download and install Node.js
    $nodeInstallerUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
    Invoke-WebRequest -Uri $nodeInstallerUrl -OutFile $nodeInstaller
    Start-Process msiexec.exe -ArgumentList "/i", $nodeInstaller, "/quiet" -Wait
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + 
                [System.Environment]::GetEnvironmentVariable("Path","User")
}
```

### Bash (Linux/macOS)

```bash
# Detect OS and package manager
case "$(uname -s)" in
    Linux*)
        if command -v apt-get; then
            sudo apt-get update && sudo apt-get install -y nodejs npm
        elif command -v yum; then
            sudo yum install -y nodejs npm
        fi
        ;;
    Darwin*)
        if ! command -v brew; then
            # Install Homebrew
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install node
        ;;
esac
```

## Version Strategy

- **Node.js:** LTS version (currently v20.x)
  - Ensures stability and long-term support
  - Compatible with all Guardrail dependencies
  
- **VS Code:** Latest stable release
  - Always up-to-date with newest features
  - Best extension API compatibility

## Testing

Tested on:
- ✅ Windows 10/11 (PowerShell 5.1+)
- ✅ macOS 12+ (Intel and Apple Silicon)
- ✅ Ubuntu 20.04/22.04
- ✅ Debian 11/12
- ✅ RHEL/CentOS 8+
- ✅ Fedora 36+

## Future Enhancements

Potential future improvements:
- [ ] Version selection (choose Node.js version)
- [ ] Offline installation support
- [ ] Docker container option
- [ ] Pre-flight check with detailed report
- [ ] Automatic updates for prerequisites

## Troubleshooting

### Windows: "Cannot install Node.js"
- Ensure you have admin rights
- Check Windows Installer service is running
- Verify internet connection

### macOS: "Homebrew installation failed"
- Check Xcode Command Line Tools are installed: `xcode-select --install`
- Verify you have write access to `/usr/local`

### Linux: "Package manager not found"
- Install manually: `https://nodejs.org/`
- Or use NVM: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash`

## Related Documentation

- [INSTALL.md](./INSTALL.md) - Full installation guide
- [QUICK_INSTALL.md](./QUICK_INSTALL.md) - Quick start guide
- [README.md](./README.md) - Project overview

---

**Last Updated:** February 19, 2026  
**Feature Version:** 0.1.0+  
**Installer Version:** 2.0
