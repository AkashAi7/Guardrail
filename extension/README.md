# 🛡️ Code Guardrail - Real-Time Security & Compliance Analysis

> Catch security vulnerabilities and compliance issues **as you type** with AI-powered code analysis!

Real-time intelligent code analysis using **GitHub Copilot** or **your own API keys** for security, compliance, and best practices.

## ✨ Features

- **🛡️ Real-Time Analysis:** Get instant feedback as you code
- **🤖 Hybrid AI:** Uses GitHub Copilot ($0) OR Bring Your Own Key (~$0.03/1K)
- **📋 Compliance Aware:** Built-in rules for GDPR, PCI-DSS, HIPAA, SOC2
- **🔒 Security First:** Detects hardcoded secrets, SQL injection, XSS, and more
- **💡 Smart Fixes:** Auto-fix suggestions with one click
- **📚 Educational:** Learn why issues matter with detailed explanations
- **🎯 Zero Config:** Auto-detects your setup and works out of the box

## 🎯 Hybrid Provider Support

**The extension automatically detects and uses the best option for you:**

### ✅ Option 1: GitHub Copilot (Free!)
- If you have GitHub Copilot, the extension uses it automatically
- **Zero additional cost** - leverages your existing subscription
- No API keys needed

### ✅ Option 2: Bring Your Own Key (~$0.03/1K tokens)
- OpenAI (GPT-4o, GPT-4, GPT-3.5)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
- Azure OpenAI (your deployment)
- Full control over costs and data

## 📦 Installation

### Recommended: One-Click Installer (Windows)

The easiest way to get started is with our all-in-one installer:

1. **Download** the installer from [GitHub Releases](https://github.com/AkashAi7/Guardrail/releases)
2. **Run** this command:
   ```powershell
   powershell -ExecutionPolicy Bypass -File install.ps1
   ```
3. **Restart VS Code**
4. **Done!** Extension and backend service are configured

**The installer automatically:**
- ✅ Detects if you have GitHub Copilot
- ✅ Prompts for API keys if needed
- ✅ Installs and starts the backend service
- ✅ Installs this extension

### Manual Installation (Advanced)

If you prefer manual setup or already have the backend service:

1. **Install the Extension** (you're here!)
2. **Install Backend Service:**
   ```bash
   git clone https://github.com/AkashAi7/Guardrail.git
   cd Guardrail/service
   npm install
   npm run build
   npm start
   ```
3. **Configure Provider** (optional if using Copilot):
   - Copy `service/.env.example` to `service/.env`
   - Add your API keys if using BYOK

## 🚀 Quick Start

Once installed, the extension works automatically!

### Analyze Code

- **Automatic:** Issues appear as you type (enabled by default)
- **Manual:** Press `Ctrl+Shift+G` (Windows/Linux) or `Cmd+Shift+G` (Mac)
- **Command Palette:** `Code Guardrail: Analyze Current File`

### Check Backend Status

- Look at the status bar (bottom right): "🛡️ Guardrail: Ready"
- Or run: `Code Guardrail: Check Service Status`

## Features in Detail

### Real-Time Diagnostics

Issues appear directly in your editor with squiggly underlines:
- 🔴 **Red (Error):** HIGH severity - critical security or compliance issues
- 🟡 **Yellow (Warning):** MEDIUM severity - important concerns
- 🔵 **Blue (Info):** LOW severity - improvements recommended
- 💚 **Green (Hint):** INFO - suggestions and tips

### Quick Fixes

Hover over an issue and click the lightbulb (💡) to see available actions:
- **Fix:** Apply suggested code fix automatically
- **Explain:** View detailed explanation with examples
- **View References:** See OWASP, CWE, and compliance docs
- **Ignore:** Add ignore comment for false positives

### Governance Rules

Built-in rules cover:

**Security:**
- Hardcoded secrets and credentials
- SQL injection vulnerabilities
- Cross-site scripting (XSS)
- Insecure cryptography
- Authentication bypasses

**Compliance:**
- GDPR personal data handling
- HIPAA PHI protection
- PCI-DSS payment data security
- SOC2 access controls

**Best Practices:**
- Async error handling
- Input validation
- Code quality patterns

### Workspace Analysis

Analyze your entire workspace:
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: `Code Guardrail: Analyze Entire Workspace`
3. View all issues in the Problems panel

## Configuration

### Extension Settings

Access via: File → Preferences → Settings → Extensions → Code Guardrail

#### Basic Settings

- **`codeGuardrail.enabled`** (default: `true`)
  - Enable/disable the extension

- **`codeGuardrail.serviceUrl`** (default: `http://localhost:3000`)
  - URL of the guardrail service

- **`codeGuardrail.autoAnalyzeOnSave`** (default: `true`)
  - Automatically analyze when saving files

- **`codeGuardrail.autoAnalyzeOnType`** (default: `false`)
  - Analyze while typing (may be slower)

#### Advanced Settings

- **`codeGuardrail.severityFilter`** (default: `["HIGH", "MEDIUM", "LOW", "INFO"]`)
  - Which severity levels to display

- **`codeGuardrail.ignoredFiles`** (default: `["**/node_modules/**", "**/dist/**", ...]`)
  - Glob patterns for files to ignore

- **`codeGuardrail.autoStartService`** (default: `true`)
  - Automatically start service on extension activation

- **`codeGuardrail.servicePath`** (default: auto-detected)
  - Custom path to the guardrail service directory

### Example Configuration

```json
{
  "codeGuardrail.enabled": true,
  "codeGuardrail.autoAnalyzeOnSave": true,
  "codeGuardrail.severityFilter": ["HIGH", "MEDIUM"],
  "codeGuardrail.ignoredFiles": [
    "**/node_modules/**",
    "**/test/**",
    "**/*.test.ts"
  ]
}
```

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

### Service Not Starting

**Problem:** "Code Guardrail service is not running"

**Solutions:**
1. Check if port 3000 is available:
   ```bash
   netstat -ano | findstr :3000  # Windows
   lsof -i :3000                  # Mac/Linux
   ```

2. Manually start the service:
   ```bash
   cd service
   npm install
   npm start
   ```

3. Configure a different port:
   - Update `.env` in service: `PORT=3001`
   - Update extension setting: `codeGuardrail.serviceUrl`

### No Issues Detected

**Problem:** Code has issues but nothing appears

**Check:**
1. Extension is enabled: `codeGuardrail.enabled: true`
2. File is not in ignored patterns
3. Severity filter includes the issue level
4. Check service logs: View → Output → "Code Guardrail Service"

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
