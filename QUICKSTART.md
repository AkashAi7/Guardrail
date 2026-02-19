# Quick Start - Code Guardrail Extension

**Just want the VS Code extension? You're in the right place!**

## Installation (2 minutes)

### Step 1: Install Extension

**Option A: From VS Code Marketplace** (Coming soon)
```
Search "Code Guardrail" in VS Code Extensions
```

**Option B: From .vsix file**
```bash
code --install-extension code-guardrail-0.4.0.vsix
```

### Step 2: That's It!

**No setup required. No configuration. No backend service.**

The extension has 20+ built-in security rules and works immediately.

---

## Verify It's Working (30 seconds)

1. **Open VS Code** (or reload if already open)
2. **Look for the shield icon** (🛡️) in the bottom left status bar
3. **Click the shield** → Select "Test with Sample Code"
4. **Save the file** (`Ctrl+S` or `Cmd+S`)
5. **See red squiggles!** ✨

You should see 5+ security issues highlighted in the test file.

---

## What You Get

### Built-in Security Rules

The extension automatically scans for:

**Secrets & Credentials:**
- Hardcoded passwords
- API keys
- Database credentials
- AWS keys
- Private keys

**Security Vulnerabilities:**
- SQL injection
- Cross-site scripting (XSS)
- Command injection
- Path traversal
- Weak cryptography

**Compliance (GDPR, PCI-DSS, HIPAA):**
- PII exposure (emails, SSN, credit cards)
- Unencrypted data transmission
- Missing consent tracking

**Best Practices:**
- Empty catch blocks
- Console.log in production
- Insecure HTTP URLs

### Where Issues Appear

1. **In the editor:** Red/yellow squiggly underlines
2. **Problems panel:** Press `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (Mac)
3. **Status bar:** Shows count like "🛡️ Guardrail: 3 issues"

---

## Usage

### Automatic Scanning (Default)

The extension automatically scans when you:
- Save a file (`Ctrl+S` / `Cmd+S`)
- Open a file

No action needed!

### Manual Scanning

**Method 1: Status bar**
- Click the shield icon (🛡️)
- Select "Analyze Current File"

**Method 2: Command Palette**
- Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
- Type: "Code Guardrail: Analyze Current File"

### Supported Languages

- TypeScript/JavaScript (`.ts`, `.js`, `.tsx`, `.jsx`)
- Python (`.py`)
- Java (`.java`)
- C# (`.cs`)
- Go (`.go`)
- Ruby (`.rb`)
- PHP (`.php`)

---

## Customization (Optional)

### Add Your Own Rules

1. **Create rules file** in your workspace:
   - Click shield icon → "Create Sample Rules"
   - This creates `guardrail-rules.md`

2. **Edit the file** to add custom rules:
   ```markdown
   ## My Custom Rule
   - Severity: HIGH
   - Pattern: `forbidden_function\(`
   - Message: Do not use forbidden_function
   - Category: security
   ```

3. **Save the file** → Rules auto-reload!

### Disable Specific Rules

In your workspace, create `.guardrail.json`:

```json
{
  "disabledRules": ["SEC010", "ERR002"],
  "enabledCategories": ["security", "gdpr-pii"]
}
```

---

## Common Questions

**Q: Do I need Node.js?**  
A: No! The extension works standalone.

**Q: Do I need the backend service?**  
A: No! That's optional for AI-powered analysis.

**Q: Do I need GitHub Copilot?**  
A: No! The extension has built-in pattern-based rules.

**Q: Does it work offline?**  
A: Yes! Everything runs locally in VS Code.

**Q: Is my code sent anywhere?**  
A: No! All scanning happens locally on your machine.

**Q: How do I know it's working?**  
A: Click the shield icon → "Test with Sample Code" → Save file → See issues!

**Q: Why don't I see any issues?**  
A: Your code might be clean! Try the test sample to verify scanning works.

**Q: Can I use this for my team?**  
A: Yes! Commit `.guardrail.json` or `guardrail-rules.md` to share rules.

---

## Troubleshooting

**Extension not activating?**
1. Reload VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Check VS Code version: Must be 1.80.0+ (Help → About)
3. Check Extensions view: Should show "Code Guardrail" installed

**No issues appearing?**
1. Test with sample: Click shield icon → "Test with Sample Code"
2. Check file type is supported (see list above)
3. Open Problems panel: `Ctrl+Shift+M`

**Windows-specific issues?**
- See [Windows Troubleshooting Guide](./WINDOWS_TROUBLESHOOTING.md)

**Still stuck?**
- Check [Full Installation Guide](./INSTALL.md)
- Open an issue: https://github.com/AkashAi7/Guardrail/issues

---

## Next Steps

### Learn More

- **View all rules:** Click shield icon → "About Code Guardrail"
- **Customize rules:** Click shield icon → "Create Sample Rules"
- **Advanced features:** See [Extension README](./extension/README.md)

### Share with Team

1. Install extension on team machines
2. Create `.guardrail.json` in your repository
3. Define custom rules for your codebase
4. Commit rules file to version control

### Upgrade to AI-Powered (Optional)

Want semantic analysis using AI?

1. Install Node.js 18+
2. Follow [Full Installation Guide](./INSTALL.md)
3. Set up backend service with Copilot/OpenAI

---

**That's it! Happy secure coding! 🛡️**

For more details, see the [Full Documentation](./README.md).
