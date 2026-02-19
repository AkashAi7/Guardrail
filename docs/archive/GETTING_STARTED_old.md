# Getting Started with Code Guardrail

Step-by-step guide to get Code Guardrail running in under 5 minutes.

## Prerequisites

The following are required (the installer can auto-install them for you):

- ✅ **Node.js 18+** - **[Auto-installed if missing]** or [Download here](https://nodejs.org/)
- ✅ **VS Code 1.80+** - **[Auto-installed if missing]** or [Download here](https://code.visualstudio.com/)
- ✅ **GitHub Copilot CLI** - Required for LLM-powered analysis
  ```bash
  # Install Copilot CLI
  npm install -g @github/copilot
  
  # Verify installation
  copilot --version
  
  # Authenticate
  copilot auth
  ```
- ✅ **GitHub Copilot subscription** - [Sign up](https://github.com/features/copilot)
  - Individual, Business, or Enterprise plan
  - Or use BYOK with Azure OpenAI / OpenAI API key as alternative
- ✅ **Git** - For cloning the repository

> 💡 **Auto-Installation:** The one-line installer (see below) will automatically detect and install Node.js and VS Code if they're not present on your system.

## Installation

### Option 1: Automated Installation (Recommended)

#### Windows
```powershell
# Clone repository
git clone https://github.com/your-org/guardrail.git
cd guardrail

# Run installation script
.\scripts\install.ps1
```

#### macOS/Linux
```bash
# Clone repository
git clone https://github.com/your-org/guardrail.git
cd guardrail

# Make script executable and run
chmod +x scripts/install.sh
./scripts/install.sh
```

The script will:
1. Check prerequisites
2. Install service dependencies
3. Build the TypeScript code
4. Package and install VS Code extension
5. Configure environment

### Option 2: Manual Installation

#### Step 1: Install Backend Service

```bash
cd service

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env

# (Optional) Edit .env for custom settings

# Build TypeScript
npm run build
```

#### Step 2: Install VS Code Extension

```bash
cd extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension
npm run package

# Install in VS Code
code --install-extension code-guardrail-0.1.0.vsix
```

## First Run

### 1. Start the Service

```bash
cd service
npm start
```

You should see:
```
🛡️  Code Guardrail Service
Port: 3000
Governance rules loaded: 6
Status: Ready
```

**Leave this terminal open** - the service needs to run while you code.

### 2. Open VS Code

Launch VS Code and check the status bar (bottom right):

- **🛡️ Guardrail: Ready** - ✅ Connected and ready
- **⚠️ Guardrail: Offline** - ❌ Service not running

### 3. Test with Sample Code

Create a new file `test.ts`:

```typescript
// Test 1: Hardcoded secret (should trigger HIGH severity warning)
const API_KEY = "sk_live_abc123xyz456";

// Test 2: SQL injection (should trigger HIGH severity warning)
function getUser(userId: string) {
  const query = "SELECT * FROM users WHERE id = '" + userId + "'";
  return db.query(query);
}

// Test 3: XSS vulnerability (should trigger HIGH severity warning)
function displayComment(comment: string) {
  document.getElementById('comments').innerHTML = comment;
}

// Test 4: Missing error handling (should trigger MEDIUM severity warning)
async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}

// Test 5: PII without consent (should trigger HIGH severity warning)
async function createUser(email: string, name: string) {
  return db.users.create({ email, name });
}
```

**Save the file** (`Ctrl+S` / `Cmd+S`)

### 4. View Results

You should see:
- **Squiggly underlines** on problematic code
- **Problems panel** showing 5 issues
- **Status bar** showing "🛡️ Guardrail: 5 issues"

### 5. Use Quick Fixes

1. **Hover** over any underlined issue
2. **Click the lightbulb** (💡) or press `Ctrl+.`
3. Choose an action:
   - **Fix** - Apply suggested code
   - **Explain** - See detailed explanation
   - **View References** - Open OWASP/CWE docs
   - **Ignore** - Add ignore comment

## Configuration

### VS Code Settings

Open settings (`Ctrl+,`) and search for "Code Guardrail":

```json
{
  "codeGuardrail.enabled": true,
  "codeGuardrail.autoAnalyzeOnSave": true,
  "codeGuardrail.severityFilter": ["HIGH", "MEDIUM", "LOW", "INFO"]
}
```

### Service Configuration

Edit `service/.env`:

```env
# Port for the service
PORT=3000

# Path to governance rules
GOVERNANCE_PATH=../governance

# Copilot authentication method
COPILOT_AUTH_METHOD=github

# Or use BYOK (Bring Your Own Key)
# COPILOT_AUTH_METHOD=byok
# OPENAI_API_KEY=sk-...
```

## Common Tasks

### Analyze Current File

**Keyboard:** `Ctrl+Shift+G` (Windows/Linux) or `Cmd+Shift+G` (Mac)  
**Command Palette:** "Code Guardrail: Analyze Current File"

### Analyze Entire Workspace

**Command Palette:** "Code Guardrail: Analyze Entire Workspace"

This will scan all files (excluding `node_modules`, `dist`, etc.)

### Clear All Issues

**Command Palette:** "Code Guardrail: Clear All Issues"

### Reload Governance Rules

After modifying rules in `governance/`:

**Command Palette:** "Code Guardrail: Reload Governance Rules"

Or restart the service:
```bash
cd service
npm restart
```

### Start/Stop Service from VS Code

**Start:** Command Palette → "Code Guardrail: Start Local Service"  
**Stop:** Command Palette → "Code Guardrail: Stop Local Service"

## Understanding Results

### Severity Levels

| Level | Icon | Meaning | Example |
|-------|------|---------|---------|
| **HIGH** | 🔴 Error | Critical security or compliance issue | Hardcoded passwords, SQL injection |
| **MEDIUM** | 🟡 Warning | Important concern that should be addressed | Missing error handling |
| **LOW** | 🔵 Info | Improvement recommended | Code quality suggestions |
| **INFO** | 💚 Hint | Tips and suggestions | Best practice notes |

### Reading a Finding

```
[Security] Hardcoded API Key Detected
Found hardcoded Stripe API key in source code

📋 Compliance: SOC2 CC6.1, GDPR Article 32

Hardcoded credentials in source code can be exposed via 
version control history, even after removal...

💡 Suggested Fix:
const API_KEY = process.env.STRIPE_SECRET_KEY;
if (!API_KEY) throw new Error('STRIPE_SECRET_KEY required');
```

**Components:**
1. **Category** - Security, Compliance, BestPractice
2. **Title** - Brief description
3. **Compliance refs** - Which standards it violates
4. **Explanation** - Why it matters
5. **Suggested fix** - Working code to fix it

## Customizing Rules

### Add Your Own Rule

1. Create a file in `service/governance/`:
   ```bash
   service/governance/security/my-custom-rule.md
   ```

2. Use this template:
   ```markdown
   ---
   title: My Custom Security Check
   severity: HIGH
   category: Security
   ---
   
   # My Custom Security Check
   
   ## What to Detect
   [Describe what to look for]
   
   ## Why It Matters
   [Explain the risks]
   
   ## Examples of Violations
   ❌ BAD:
   ```typescript
   // Bad code example
   ```
   
   ## How to Fix
   ✅ GOOD:
   ```typescript
   // Good code example
   ```
   ```

3. Reload rules:
   ```bash
   curl -X POST http://localhost:3000/api/reload-governance
   ```

### Modify Existing Rules

Edit files in `service/governance/`:
- `security/` - Security vulnerabilities
- `compliance/` - Regulatory compliance
- `best-practices/` - Code quality

See [Governance README](../governance/README.md) for detailed guide.

## Troubleshooting

### Service Won't Start

**Error:** `EADDRINUSE: address already in use`

**Solution:** Port 3000 is taken. Either:

1. Stop the other service using port 3000
2. Change port in `.env`:
   ```env
   PORT=3001
   ```
   And update VS Code settings:
   ```json
   {
     "codeGuardrail.serviceUrl": "http://localhost:3001"
   }
   ```

### Extension Not Working

**Problem:** No issues appearing in Problems panel

**Checklist:**
1. ✅ Service is running (`http://localhost:3000/api/health`)
2. ✅ Extension is enabled in settings
3. ✅ File is not in ignored patterns
4. ✅ Check VS Code Output → "Code Guardrail"

### No Diagnostics Shown

**Solutions:**
1. Save the file (`Ctrl+S`)
2. Manually trigger: `Ctrl+Shift+G`
3. Check severity filter in settings
4. View service logs in output panel

### Service Connection Failed

**Error:** "ECONNREFUSED" or "Network Error"

**Solutions:**
1. Verify service is running: `http://localhost:3000/api/health`
2. Check firewall isn't blocking port 3000
3. Restart service: `npm start`
4. Check service logs for errors

### Performance Issues

**Problem:** VS Code feels slow

**Solutions:**
1. Disable analyze-on-type:
   ```json
   {
     "codeGuardrail.autoAnalyzeOnType": false
   }
   ```
2. Use analyze-on-save only (default)
3. Add more patterns to `ignoredFiles`
4. Increase debounce delay:
   ```json
   {
     "codeGuardrail.analyzeOnTypeDebounce": 3000
   }
   ```

## Next Steps

### Explore Governance Rules

Check out the built-in rules:
```bash
cd governance
ls -la security/        # Security rules
ls -la compliance/      # Compliance rules
ls -la best-practices/  # Best practice rules
```

Read the [Governance README](../governance/README.md) to understand how they work.

### Integrate with Your Team

1. **Version Control:** Commit governance rules with your code
2. **Team Standards:** Customize rules for your organization
3. **CI/CD:** Call the API from your pipeline (coming in v0.3.0)

### Advanced Configuration

See full documentation:
- [Main README](../README.md)
- [Service README](../service/README.md)
- [Extension README](../extension/README.md)

## Getting Help

**Issues:**
- Check [Troubleshooting](#troubleshooting) section
- Review [FAQ](../README.md#faq)
- Open [GitHub Issue](https://github.com/your-org/guardrail/issues)

**Questions:**
- [GitHub Discussions](https://github.com/your-org/guardrail/discussions)
- Check documentation
- Review examples

## Quick Reference

### Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Analyze file | `Ctrl+Shift+G` | `Cmd+Shift+G` |
| Quick fix | `Ctrl+.` | `Cmd+.` |
| Command palette | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| View problems | `Ctrl+Shift+M` | `Cmd+Shift+M` |

### Commands

- **Analyze Current File** - Scan the active file
- **Analyze Entire Workspace** - Scan all files
- **Clear All Issues** - Remove all diagnostics
- **Start Local Service** - Start the backend service
- **Stop Local Service** - Stop the backend service
- **Reload Governance Rules** - Reload rules without restart

### API Endpoints

```bash
# Health check
GET http://localhost:3000/api/health

# Get info
GET http://localhost:3000/api/info

# Analyze code
POST http://localhost:3000/api/analyze
{
  "code": "...",
  "language": "typescript",
  "filename": "test.ts"
}

# Reload governance
POST http://localhost:3000/api/reload-governance
```

---

**You're all set! Start coding with confidence. 🎉**

For more information, see the [Main README](../README.md).
