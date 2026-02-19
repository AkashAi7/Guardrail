# 🛡️ Code Guardrail - Real-Time Security & Compliance Analysis

> Catch security vulnerabilities and compliance issues **as you code** with built-in pattern matching!

**✨ NEW: Now works completely standalone - no backend service required!**

Real-time code scanning with 20+ built-in security rules. Zero configuration, zero dependencies, just install and code!

## ✨ Features

- **🛡️ Real-Time Analysis:** Get instant feedback as you code
- **⚡ Zero Setup:** Install and start coding - that's it!
- **🔒 Security First:** Detects hardcoded secrets, SQL injection, XSS, and more
- **📋 Compliance Aware:** Built-in rules for GDPR, PCI-DSS, HIPAA, SOC2
- **💡 Educational:** Learn why issues matter with detailed explanations
- **🎯 Standalone:** Everything runs locally in VS Code - no external service needed
- **📝 Customizable:** Add your own rules using simple markdown files

## 🚀 Quick Start

### Installation

1. Install from VS Code Marketplace or from `.vsix` file:
   ```bash
   code --install-extension code-guardrail-0.4.0.vsix
   ```

2. **That's it!** No setup, no configuration, no backend service needed.

3. **Test it works:**
   - Click the shield icon (🛡️) in the status bar
   - Select "Test with Sample Code"  
   - Save the file (`Ctrl+S`)
   - See security issues highlighted!

### What You Get

**20+ Built-in Security Rules:**
- Hardcoded secrets and credentials
- SQL injection vulnerabilities
- Cross-site scripting (XSS)
- Command injection
- Path traversal
- Weak cryptography
- PII exposure
- And more!

**No Dependencies:**
- No Node.js required
- No backend service required
- No API keys required
- No internet connection required

Everything runs directly in VS Code using efficient pattern matching.

---

## 🎯 Two Usage Modes

### Mode 1: Standalone (Recommended for most users) ✅

**What you're using right now!**

- 20+ built-in security and compliance rules
- Pattern-based detection (regex)
- Fast and reliable
- Works offline
- **No setup required**

This mode is perfect for:
- Individual developers
- Quick security checks
- Learning security best practices
- Teams without infrastructure setup

### Mode 2: Advanced with Backend Service (Optional)

For AI-powered semantic analysis using GitHub Copilot or OpenAI.

**Requires:**
- Node.js 18+
- Backend service running
- GitHub Copilot OR API keys

**Provides:**
- LLM-powered semantic analysis
- Context-aware detection
- Natural language rule definitions
- Import rules from PDF/Word documents

See the [Full Installation Guide](../INSTALL.md) for backend setup.

---

## Commands

All commands accessible via Command Palette (`Ctrl+Shift+P`):

- **Code Guardrail: Analyze Current File** (`Ctrl+Shift+G`)
  - Analyze the currently open file

- **Code Guardrail: Analyze Entire Workspace**
  - Scan all files in the workspace

- **Code Guardrail: Clear All Issues**
  - Remove all diagnostics

- **Code Guardrail: Start Local Service**
  - Start the guardrail service

- **Code Guardrail: Stop Local Service**
  - Stop the guardrail service

- **Code Guardrail: Reload Governance Rules**
  - Reload governance rules without restarting

## Status Bar

The status bar shows the current state:

- **🛡️ Guardrail: Ready** - Service connected, no issues
- **🛡️ Guardrail: 5 issues** - Service connected with findings
- **⏳ Guardrail: Analyzing...** - Analysis in progress
- **⚠️ Guardrail: Offline** - Service not running (click to start)
- **❌ Guardrail: Error** - Connection error

## Ignoring Issues

### Per-Line Ignore

Add a comment above the line:

```typescript
// guardrail-ignore: hardcoded-secret - This is a public demo key
const API_KEY = "demo_12345";
```

### Per-File Ignore

Add at the top of the file:

```typescript
// guardrail-ignore-file
```

### Via Configuration

Update `codeGuardrail.ignoredFiles` in settings.

## Customizing Rules

### Add Custom Rules

1. Create a new markdown file in `service/governance/`:
   ```markdown
   ---
   title: Your Custom Rule
   severity: HIGH
   category: Security
   ---
   
   # Your Custom Rule
   
   ## What to Detect
   [Description...]
   
   ## Examples
   [Code examples...]
   ```

2. Reload governance:
   - Command: `Code Guardrail: Reload Governance Rules`
   - Or restart the service

### Modify Existing Rules

Edit markdown files in `service/governance/`:
- `security/` - Security rules
- `compliance/` - Compliance rules
- `best-practices/` - Code quality rules

See [Governance README](../service/governance/README.md) for details.

## Troubleshooting

### Extension Not Working?

**First, verify it's actually not working:**

1. Click the shield icon in status bar → "Test with Sample Code"
2. Save the generated file (`Ctrl+S`)
3. You should see 5+ security issues highlighted

If no issues appear, see detailed troubleshooting below.

---

### No Issues Appearing

**Symptom:** Saved files but no squiggly lines or problems showing

**Common causes:**

1. **Your code is actually clean!** ✅  
   - The extension only shows issues when it detects security problems
   - Try the test sample (click shield icon → "Test with Sample Code")

2. **File type not supported:**
   - Supported: `.ts`, `.js`, `.tsx`, `.jsx`, `.py`, `.java`, `.cs`, `.go`, `.rb`, `.php`
   - Check your file extension

3. **Problems panel closed:**
   - Press `Ctrl+Shift+M` to open Problems panel

4. **Auto-analyze disabled:**
   - Settings → Search "codeGuardrail"
   - Ensure `autoAnalyzeOnSave` is `true`

---

### Extension Doesn't Activate

**Symptom:** No shield icon in status bar, no activation message

**Solutions:**

1. **Reload VS Code:**
   - `Ctrl+Shift+P` → "Developer: Reload Window"

2. **Check if installed:**
   - Extensions view (`Ctrl+Shift+X`)
   - Search "Code Guardrail"
   - Should be installed and enabled

3. **Check VS Code version:**
   - Requires VS Code 1.80.0+
   - Help → About

4. **Check for errors:**
   - View → Output → Select "Code Guardrail"

---

### Windows-Specific Issues

**See the comprehensive [Windows Troubleshooting Guide](../WINDOWS_TROUBLESHOOTING.md) for:**
- Permission errors
- Antivirus blocking
- Path issues
- And more Windows-specific solutions

---

### Service Not Starting (Advanced Mode Only)

**Note:** Basic standalone mode doesn't need a service!

If you're using the optional backend service:

1. **Check if port 3000 is available:**
   ```bash
   netstat -ano | findstr :3000  # Windows
   lsof -i :3000                  # Mac/Linux
   ```

2. **Start service manually:**
   ```bash
   cd service
   npm install
   npm start
   ```

3. **Use different port:**
   - Update `.env`: `PORT=3001`
   - Update extension setting: `codeGuardrail.serviceUrl`

---

### Performance Issues

**Problem:** Editor feels slow

**Solutions:**
1. Disable analyze-on-type: `codeGuardrail.autoAnalyzeOnType: false`
2. Use analyze-on-save only (default)
3. Increase debounce delay: `codeGuardrail.analyzeOnTypeDebounce: 3000`
4. Add more patterns to `ignoredFiles`

### False Positives

**Problem:** Getting incorrect warnings

**Solutions:**
1. Add ignore comment for specific case
2. Adjust rule severity in governance files
3. Report false positive (see Contributing)

## Development

### Building from Source

```bash
# Install dependencies
cd extension
npm install

# Compile TypeScript
npm run compile

# Watch mode (for development)
npm run watch

# Package extension
npm run package
```

### Testing

```bash
npm test
```

### Installing Local Build

1. Package the extension:
   ```bash
   npm run package
   ```

2. Install `.vsix` file:
   - VS Code: Extensions → ⋯ → Install from VSIX
   - Or: `code --install-extension code-guardrail-0.1.0.vsix`

## Architecture

```
Extension (VS Code)
  ↓
HTTP API
  ↓
Local Service (Node.js)
  ↓
Copilot SDK
  ↓
GitHub Copilot / OpenAI
```

**Data Flow:**
1. Extension sends code to local service via REST API
2. Service loads governance rules (markdown prompts)
3. Service queries Copilot SDK with code + rules
4. LLM analyzes code semantically and returns findings
5. Service formats response (JSON)
6. Extension displays diagnostics in VS Code

**Privacy:** All code stays local. Only anonymized prompts sent to Copilot.

## Contributing

Contributions welcome! Areas to help:

- **Governance Rules:** Add new security/compliance rules
- **Language Support:** Improve detection for specific languages
- **Features:** Quick fixes, code lenses, hover info
- **Testing:** More test cases and edge cases
- **Documentation:** Examples, tutorials, videos

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE)

## Support

- **Issues:** [GitHub Issues](https://github.com/your-org/guardrail/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/guardrail/discussions)
- **Docs:** [Full Documentation](https://your-org.github.io/guardrail)

## Acknowledgments

- Built with [GitHub Copilot SDK](https://github.com/github/copilot-sdk)
- Inspired by [Semgrep](https://semgrep.dev/), [CodeQL](https://codeql.github.com/), and [Snyk](https://snyk.io/)
- Security rules based on [OWASP](https://owasp.org/) guidelines
- Compliance rules based on official frameworks (GDPR, PCI-DSS, HIPAA, SOC2)

---

**Made with ❤️ for developers who care about security and code quality**
