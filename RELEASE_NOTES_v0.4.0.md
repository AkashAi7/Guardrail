# Code Guardrail v0.4.0 - Critical Bug Fix Release

**Release Date:** February 19, 2026

## 🔥 Critical Fix: Extension Not Working Issue

This release fixes the critical issue where the extension was not showing security highlights on user machines.

### ✅ What Was Fixed

**Root Cause:** Installation scripts were distributing v0.1.0 instead of v0.4.0, causing functionality mismatch.

**Fixes:**
- ✅ Updated installation scripts to distribute v0.4.0
- ✅ Rebuilt extension with all dependencies included
- ✅ Added verification script to confirm installation
- ✅ Created comprehensive troubleshooting guide

### 📦 What's Included

**Extension Package** (`code-guardrail-0.4.0.vsix` - 6.95 MB)
- Standalone VS Code extension
- 20+ built-in security rules
- Real-time code analysis
- Zero external dependencies required
- Works completely offline

### ✨ Features

- **🛡️ Real-Time Security Scanning**
  - Hardcoded secrets detection (API keys, passwords, tokens)
  - SQL injection vulnerabilities
  - Cross-site scripting (XSS) risks
  - Command injection patterns
  - Path traversal issues
  - Weak cryptography usage

- **📋 Compliance Checking**
  - GDPR compliance (PII exposure detection)
  - HIPAA requirements
  - SOC2 best practices
  - PCI-DSS standards

- **🎯 Developer-Friendly**
  - Zero configuration required
  - No backend service needed
  - Instant feedback as you code
  - Problems panel integration
  - Status bar indicators

### 🚀 Installation

#### Quick Install (Recommended)
```powershell
# Windows
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex
```

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install.sh | bash
```

#### Manual Installation
```powershell
# Download VSIX from this release
code --install-extension code-guardrail-0.4.0.vsix
```

#### Verify Installation
```powershell
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/verify-installation.ps1 | iex
```

### ✅ Quick Test

After installation, create a test file:

```typescript
// test.ts
const password = "admin123";
const apiKey = "sk-1234567890";
```

Save the file and you should see:
- 🔴 Red squiggles under both lines
- ⚠️ Status bar: "Guardrail: 2 issue(s)"
- 📋 Issues in Problems panel (Ctrl+Shift+M)

### 🆙 Upgrading from v0.1.0

If you have v0.1.0 installed and it's not working:

```powershell
# 1. Uninstall old version
code --uninstall-extension akashai7.code-guardrail

# 2. Clean up
Remove-Item "$env:USERPROFILE\.vscode\extensions\*guardrail*" -Recurse -Force

# 3. Install v0.4.0
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex

# 4. Verify
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/verify-installation.ps1 | iex
```

### 📋 Requirements

- **VS Code:** 1.80.0 or higher
- **Operating System:** Windows 10+, macOS 10.15+, or Linux
- **No Node.js required** - Extension is fully self-contained

### 🐛 Troubleshooting

**Extension not showing highlights?**
1. Check version: Extensions → "Code Guardrail" → Should be 0.4.0
2. Look for shield icon (🛡️) in status bar
3. Test with sample code (see Quick Test above)

**Detailed troubleshooting:** See [TROUBLESHOOTING.md](https://github.com/AkashAi7/Guardrail/blob/main/TROUBLESHOOTING.md)

### 📚 Documentation

- **[Installation Guide](https://github.com/AkashAi7/Guardrail/blob/main/QUICK_INSTALL.md)** - Quick installation instructions
- **[Troubleshooting Guide](https://github.com/AkashAi7/Guardrail/blob/main/TROUBLESHOOTING.md)** - Comprehensive troubleshooting
- **[User Guide](https://github.com/AkashAi7/Guardrail/blob/main/README.md)** - Complete documentation

### 🔧 Technical Details

**What's Different from v0.1.0:**
- ✅ Complete rewrite of scanning engine
- ✅ Built-in pattern matching (no external service needed)
- ✅ Real-time analysis without delays
- ✅ Proper VS Code extension lifecycle integration
- ✅ Status bar integration
- ✅ Better diagnostic reporting

**Package Contents:**
- Extension core: `out/extension.js` (18 KB)
- Scanner engine: `out/scanner.js` (12 KB)
- Rule parser: `out/ruleParser.js` (7 KB)
- File importer: `out/fileImporter.js` (9 KB)
- Dependencies: mammoth, pdf-parse (bundled)

### 🙏 Special Thanks

Thanks to early testers who reported the installation issues, helping us identify and fix the version mismatch problem!

---

## 📥 Download

**[code-guardrail-0.4.0.vsix](https://github.com/AkashAi7/Guardrail/releases/download/v0.4.0/code-guardrail-0.4.0.vsix)** (6.95 MB)

**Checksums:**
```
SHA256: [Will be generated after upload]
```

---

## 🔄 Full Changelog

### Added
- ✨ Verification script for post-installation testing
- ✨ Comprehensive troubleshooting guide
- ✨ Automatic version detection in installer

### Fixed
- 🐛 Installation script now distributes correct version (0.4.0)
- 🐛 Extension activation issues on fresh installations
- 🐛 Missing dependencies in packaged extension

### Changed
- 📦 Updated installation scripts to use v0.4.0
- 📚 Enhanced documentation with verification steps
- 🔧 Improved error messages and logging

---

## 📊 Stats

- **Built-in Rules:** 20+ security patterns
- **File Types Supported:** 10 (.ts, .js, .tsx, .jsx, .py, .java, .cs, .go, .rb, .php)
- **Package Size:** 6.95 MB
- **Installation Time:** ~30 seconds
- **Zero Configuration Required:** ✅

---

**Questions or Issues?** Open an issue on [GitHub](https://github.com/AkashAi7/Guardrail/issues)
