# Getting Started with Code Guardrail

Welcome! This guide will help you start using Code Guardrail in 5 minutes.

---

## Step 1: Test the Extension

After installation, let's verify it works:

1. Press `Ctrl+Shift+P`
2. Type: `Code Guardrail: Test with Sample`
3. Press Enter

A test file will open with intentional security issues.

**Save the file** (`Ctrl+S`) and you'll see:
- 🔴 Red squiggles under security issues
- ⚠️ Problems panel shows all issues
- 🛡️ Status bar shows issue count

---

## Step 2: Understanding Issues

### Visual Indicators

**Red Squiggles** = HIGH severity (critical security issues)
```typescript
const apiKey = "sk-1234567890";  // 🔴 Hardcoded API key
```

**Yellow Squiggles** = MEDIUM severity (warnings)
```typescript
try {
    riskyOp();
} catch (err) {  // 🟡 Empty catch block
}
```

**Blue Squiggles** = LOW/INFO severity (suggestions)

### Problems Panel

Press `Ctrl+Shift+M` to see all issues:
```
❗ Hardcoded API key detected. Use environment variables.
   Line 5, Column 15 | Code Guardrail (API_KEY_DETECTION)
```

Click any issue to jump to that line.

---

## Step 3: Quick Commands

Press `Ctrl+Shift+P` and type `Code Guardrail`:

| Command | What It Does |
|---------|--------------|
| **Test with Sample** | Creates test file with issues |
| **Analyze Current File** | Scans active file |
| **Manage Rules** | View/add custom rules |
| **Create Custom Rule** | Interactive rule wizard |
| **Import from URL** | Download org rules |

**Or click the 🛡️ shield** in the bottom status bar!

---

## Step 4: Real-World Usage

### Scenario: API Key in Code

**You write:**
```typescript
const apiKey = "sk-proj-abc123xyz789";
```

**You save (Ctrl+S):**
- 🔴 Red squiggle appears
- Hover to see: "Hardcoded API key detected"
- Problems panel shows the issue

**You fix:**
```typescript
const apiKey = process.env.API_KEY;  // ✅ No issue!
```

**You save again:**
- ✅ Issue disappears
- 🛡️ Status bar shows "Clean"

---

## Step 5: Built-in Rules

Code Guardrail automatically checks for:

### 🔒 Security Issues
- Hardcoded API keys, passwords, tokens
- SQL injection vulnerabilities  
- XSS (Cross-Site Scripting)
- Weak cryptography (MD5, SHA1)
- Command injection

### 📋 Compliance Issues
- PII in logs (SSN, credit cards)
- GDPR violations
- HIPAA data exposure
- Financial data in plaintext

### 💡 Best Practices
- Empty catch blocks
- Console.log in production
- Eval() usage
- TODO comments

**Total: 20+ built-in rules** across all categories.

---

## Step 6: Organization Rules (Optional)

### Import Your Company's Rules

```
Ctrl+Shift+P → Code Guardrail: Setup Organization Rules
→ Choose: "Clone from Organization Repository"
→ Enter: https://github.com/yourcompany/guardrail-rules.git
```

### Create Custom Rules

```
Ctrl+Shift+P → Code Guardrail: Create Custom Rule
→ Follow the wizard:
  - Name: "Company Database Password"
  - Severity: HIGH
  - Pattern: db_password\s*=\s*["'][^"']+["']
  - Message: "Use encrypted config for DB passwords"
```

---

## Status Bar Guide

| Icon | Meaning |
|------|---------|
| 🛡️ **Guardrail: Clean** | No issues found |
| ⚠️ **Guardrail: 3 issue(s)** | Medium/Low issues |
| 🚨 **Guardrail: 5 issue(s) (2 critical)** | HIGH severity issues present |

Click the icon for quick actions menu.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Command Palette | `Ctrl+Shift+P` |
| Problems Panel | `Ctrl+Shift+M` |
| Save File (trigger scan) | `Ctrl+S` |
| Quick Open | `Ctrl+P` |

---

## Tips & Tricks

### 1. Scan on Save
Issues are detected **the moment you save**. No manual scanning needed!

### 2. Hover for Details
Hover over any squiggle to see:
- Full error message
- Rule ID
- Severity level

### 3. Auto-Fix (Coming Soon)
Some issues will offer automatic fixes. Click the lightbulb 💡 icon.

### 4. Ignore False Positives
Add `// guardrail-ignore-next-line` above any line to suppress warnings.

### 5. Workspace-Specific Rules
Create `.guardrail/` folder in your project for custom rules that apply only to that project.

---

## Supported Languages

✅ TypeScript (`.ts`, `.tsx`)  
✅ JavaScript (`.js`, `.jsx`)  
✅ Python (`.py`)  
✅ Java (`.java`)  
✅ C# (`.cs`)  
✅ Go (`.go`)  
✅ Ruby (`.rb`)  
✅ PHP (`.php`)

Rules work across all languages!

---

## What's Next?

🎯 **Start Coding** - The extension is now active and scanning  
📚 **[Customize Rules](docs/distribution/DISTRIBUTION_GUIDE.md)** - Add organization-specific rules  
🐛 **[Troubleshooting](TROUBLESHOOTING.md)** - If you run into issues  

---

## Need Help?

- **Quick Test**: `Ctrl+Shift+P` → "Test with Sample"
- **Problems**: Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Issues**: [GitHub Issues](https://github.com/AkashAi7/Guardrail/issues)

---

**Happy Secure Coding! 🛡️**

[⬅ Back to README](README.md)
