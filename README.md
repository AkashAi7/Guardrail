# 🛡️ Code Guardrail

> **Real-time security & compliance analysis for VS Code** - No backend required, just install and code!

[![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)](https://github.com/AkashAi7/Guardrail/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.85%2B-007ACC.svg)](https://code.visualstudio.com/)

**Code Guardrail** detects security vulnerabilities, compliance violations, and code quality issues **as you type** - preventing problems before they reach production.

---

## ✨ Features

- 🔒 **Security Scanning** - Detects hardcoded secrets, SQL injection, XSS, weak crypto
- 📋 **Compliance Checking** - GDPR, HIPAA, SOC2, PCI-DSS rules built-in
- ⚡ **Real-Time Feedback** - Issues highlighted instantly on file save
- 🎯 **Zero Configuration** - Works out of the box with 20+ built-in rules
- 🏢 **Organization Rules** - Import and share custom rules across teams
- 🌐 **Multi-Language** - TypeScript, JavaScript, Python, Java, C#, Go, Ruby, PHP

---

## 🚀 Quick Install

**One command (Windows PowerShell):**

```powershell
irm https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install-from-release.ps1 | iex
```

**Manual Install:**

1. Download [code-guardrail-0.4.0.vsix](https://github.com/AkashAi7/Guardrail/releases/download/v0.4.0/code-guardrail-0.4.0.vsix)
2. Run: `code --install-extension code-guardrail-0.4.0.vsix`
3. Reload VS Code

**Verify Installation:**
```powershell
code --list-extensions | Select-String "guardrail"
```

➡️ **[Full Installation Guide](INSTALL.md)**

---

## 🎯 How It Works

**1. Install** → Extension activates automatically  
**2. Code** → Write code normally  
**3. Save** → Issues highlighted instantly (red/yellow squiggles)  
**4. Fix** → Click issue to see details and remediation

### Example

```typescript
// ❌ This will be flagged immediately on save:
const apiKey = "sk-1234567890";  // 🔴 Hardcoded API key detected

// ✅ Recommended fix:
const apiKey = process.env.API_KEY;  // No issues!
```

➡️ **[Getting Started Guide](GETTING_STARTED.md)**

---

## 📊 Built-in Rules

Code Guardrail includes **20+ professional security rules**:

| Category | Rules | Examples |
|----------|-------|----------|
| **Secrets** | API keys, passwords, tokens | AWS keys, GitHub tokens, database passwords |
| **Injection** | SQL, command, LDAP injection | Unsanitized user input in queries |
| **XSS** | Cross-site scripting | `innerHTML` with user data |
| **Crypto** | Weak algorithms, hardcoded keys | MD5, SHA1, hardcoded encryption keys |
| **Data Privacy** | PII exposure, sensitive logging | SSN, credit cards in logs |
| **Best Practices** | Empty catch, console.log | Error handling anti-patterns |

**View all rules:** `Ctrl+Shift+P` → "Code Guardrail: View Rules"

---

## 🏢 Organization Usage

### Import Organization Rules

```powershell
# From your command palette (Ctrl+Shift+P):
Code Guardrail: Setup Organization Rules
→ Enter: https://github.com/yourorg/security-rules.git
```

### Create Custom Rules

```powershell
# Command palette:
Code Guardrail: Create Custom Rule
→ Follow the interactive wizard
```

### Share Rules Across Teams

**Option 1: Git Repository**
```bash
# Clone rules to project
git submodule add https://github.com/yourorg/rules .guardrail
```

**Option 2: Single URL Import**
```
Ctrl+Shift+P → Import Rules from URL
→ https://yourorg.com/security-rules.md
```

➡️ **[Organization Setup Guide](docs/distribution/DISTRIBUTION_GUIDE.md)**

---

## 🎨 Quick Commands

Press `Ctrl+Shift+P` and type:

- `Code Guardrail: Test with Sample` - Create test file with issues
- `Code Guardrail: Analyze Current File` - Scan active file
- `Code Guardrail: Manage Rules` - View/edit custom rules
- `Code Guardrail: Create Custom Rule` - Add new rule
- `Code Guardrail: Import from URL` - Download org rules

**Or click the 🛡️ shield icon** in the status bar for quick access.

---

## 📖 Documentation

### User Guides
- **[Installation Guide](INSTALL.md)** - Detailed setup instructions
- **[Getting Started](GETTING_STARTED.md)** - First steps after installation
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

### Organization Setup
- **[Distribution Guide](docs/distribution/DISTRIBUTION_GUIDE.md)** - Sharing with teams
- **[Rule Library Examples](docs/design/RULES_LIBRARY_EXAMPLES.md)** - Sample rules

### Development
- **[Design Documentation](docs/design/)** - Architecture and design decisions
- **[Internal Documentation](docs/internal/)** - Development notes and debugging

---

## 🔧 Configuration

Code Guardrail works **without configuration**, but you can customize it:

### Workspace Rules (`.guardrail/`)

```
your-project/
├── .guardrail/
│   ├── security/
│   │   └── custom-rules.md
│   ├── compliance/
│   │   └── gdpr-rules.md
│   └── README.md
```

### Single File (`guardrail-rules.md`)

```markdown
## Custom API Key Pattern
- Severity: HIGH
- Pattern: `company_api_[A-Za-z0-9]{32}`
- Message: Use environment variables for API keys
- Category: security
```

### JSON Config (`.guardrail.json`)

```json
{
  "rules": [
    {
      "id": "CUSTOM-001",
      "pattern": "secret_key\\s*=\\s*['\"][^'\"]+['\"]",
      "severity": "HIGH",
      "message": "Hardcoded secret detected"
    }
  ]
}
```

---

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/AkashAi7/Guardrail/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AkashAi7/Guardrail/discussions)

---

## 📊 Statistics

- **20+ Built-in Rules** covering major security frameworks
- **8 Programming Languages** supported out of the box
- **Zero Backend Dependencies** - runs entirely in VS Code
- **< 100ms Scan Time** for most files
- **100% Local** - no data leaves your machine

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🌟 What's New in v0.4.0

- ✨ **Organization rule management** - Import, create, and share rules via Command Palette
- 🎯 **Interactive rule creation** - Wizard-based custom rule setup
- 🌐 **URL imports** - Download rules from any URL
- 🔧 **Better status bar** - Click shield icon for quick actions
- 🐛 **Installation fixes** - Gracefully handles existing installations
- 📦 **Improved packaging** - Single VSIX install with all dependencies

**[View Full Release Notes](RELEASE_NOTES_v0.4.0.md)**

---

<div align="center">

**Made with ❤️ for secure coding**

[⬆ Back to Top](#-code-guardrail)

</div>
