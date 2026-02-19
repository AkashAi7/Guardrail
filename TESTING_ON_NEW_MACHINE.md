# Testing on a New Machine - AI-Only Version

This guide shows how to set up and test the **AI-only Code Guardrail** extension on a fresh machine.

## Prerequisites

1. **VS Code** installed
2. **Node.js** (v18+) and npm installed
3. **Git** installed
4. **GitHub Copilot subscription** (required for AI analysis)

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/AkashAi7/Guardrail.git
cd Guardrail
```

### Step 2: Install the Extension

#### Option A: Install from VSIX (Recommended)
1. Download `code-guardrail-ai-only.vsix` from the [latest release](https://github.com/AkashAi7/Guardrail/releases)
2. Open VS Code
3. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
4. Type "Install from VSIX" and select it
5. Browse to the downloaded VSIX file and install

#### Option B: Install from Source
```bash
cd extension
npm install
npm run compile
code --install-extension .
```

### Step 3: The Service Auto-Starts!

**You don't need to start the service manually!** The extension automatically:
- Starts the Node.js service when VS Code activates
- Checks service health before every analysis
- Shows clear error messages if the service isn't running

The service runs on `http://localhost:3000`

## Testing the AI Analysis

### Test 1: Analyze Individual Files

1. Open any of these test files:
   - `test-files/test-auth-service.ts` (15 intentional vulnerabilities)
   - `test-files/test-flask-api.py` (17 intentional vulnerabilities)

2. **The AI will automatically analyze the file** as soon as you open it

3. Check the **Problems panel** (View → Problems or `Ctrl+Shift+M`) to see detected issues

4. Look for the **🤖 AI** indicator in the status bar

### Test 2: Scan Entire Project

1. Press `Ctrl+Shift+P` to open Command Palette
2. Type "Code Guardrail"
3. Select **"Code Guardrail: Scan Entire Project with AI"**
4. Watch the progress UI showing "X/Y files (Z issues found)"
5. All issues appear in the Problems panel

### Test 3: Verify AI-Only Mode

1. Stop the service manually (if you want to test error handling):
   ```bash
   # Find the Node process on port 3000 and kill it
   ```

2. Try to analyze a file

3. You should see an **error dialog**: "AI service unavailable. Please ensure the service is running on http://localhost:3000"

4. **No regex fallback** - the extension only works with AI

## What Should Be Detected?

The test files contain these intentional vulnerabilities:

### test-auth-service.ts (TypeScript)
- ✅ Hardcoded API keys (Stripe, OpenAI, JWT)
- ✅ Hardcoded database credentials
- ✅ SQL injection (2 patterns: concatenation and template literals)
- ✅ XSS vulnerabilities
- ✅ Weak cryptography (MD5, SHA1)
- ✅ eval() usage
- ✅ Command injection
- ✅ Path traversal
- ✅ Missing authentication
- ✅ Logging sensitive data
- ✅ No input validation
- ✅ Weak random number generation
- ✅ Hardcoded AWS credentials

### test-flask-api.py (Python)
- ✅ Hardcoded Flask secret key
- ✅ Hardcoded database credentials
- ✅ SQL injection (multiple patterns)
- ✅ XSS via template injection
- ✅ Command injection
- ✅ Path traversal
- ✅ Weak hashing (MD5, SHA1)
- ✅ Insecure deserialization (pickle)
- ✅ eval() with user input
- ✅ Hardcoded AWS credentials
- ✅ Logging sensitive data
- ✅ Missing authentication
- ✅ Debug mode enabled
- ✅ Weak random generation

## Governance Rules

The AI learns from comprehensive security rules located in:
- `governance/security/comprehensive-security-rules.md`

These rules cover:
1. Secrets Management
2. SQL Injection Prevention
3. XSS Prevention
4. Weak Cryptography
5. Input Validation
6. Command Injection Prevention
7. Path Traversal Prevention
8. Authentication & Authorization
9. Logging Sensitive Data

## Troubleshooting

### Service Won't Start
- Check if port 3000 is already in use: `netstat -ano | findstr :3000` (Windows) or `lsof -i :3000` (Mac/Linux)
- Check Node.js is installed: `node --version`
- Check if GitHub Copilot extension is installed

### No Issues Detected
- Verify the service is running: `curl http://localhost:3000/health`
- Check VS Code Output panel: View → Output → "Code Guardrail"
- Look for any error messages in the Problems panel

### AI Analysis Times Out
- Default timeout is 30 seconds
- Complex files may take longer - check the Output panel for progress
- Large projects: Use "Scan Entire Project" which handles files one at a time

## Architecture

```
┌─────────────────────┐
│   VS Code Editor    │
│  (Extension Host)   │
└──────────┬──────────┘
           │
           │ Auto-starts & monitors
           ▼
┌─────────────────────┐
│   Node.js Service   │
│  (localhost:3000)   │
│                     │
│  Uses Copilot SDK   │
│  Reads governance   │
│  rules from disk    │
└─────────────────────┘
```

**Key Features:**
- ✅ **Auto-start**: Service launches automatically when VS Code starts
- ✅ **AI-only**: No regex fallback - pure AI-driven analysis
- ✅ **Smart**: Learns from governance rules
- ✅ **Fast**: Health checks before analysis
- ✅ **User-friendly**: Clear error messages and progress UI

## Next Steps

Once you've verified everything works:
1. Add your own governance rules to `governance/` folder
2. Test on your actual codebase
3. Customize the rules for your project's needs
4. Add more test files to validate coverage

## Support

For issues or questions:
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Review [GitHub Issues](https://github.com/AkashAi7/Guardrail/issues)
- See the main [README.md](README.md) for detailed documentation
