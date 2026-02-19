# 🛡️ Code Guardrail - Quick Reference Card

## Installation
```powershell
# Windows One-Line Install
iwr https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 -UseBasicParsing | iex

# macOS/Linux One-Line Install
curl -fsSL https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.sh | bash
```

## What It Does
- ✅ **Security**: SQL injection, XSS, secrets, crypto issues
- ✅ **Compliance**: GDPR, HIPAA, SOC2, PCI-DSS
- ✅ **Best Practices**: Error handling, async patterns, framework conventions

## Quick Start
1. **Run installer** (above)
2. **Open VS Code**
3. **Write code** - warnings appear automatically
4. **Hover for details** - get explanations and fixes

## Configuration (Optional)
Edit `.env` in service folder:
```env
# Use GitHub Copilot (default - no config needed)
PROVIDER=copilot

# Or use your own API key
PROVIDER=openai
OPENAI_API_KEY=sk-your-key

# Or Anthropic
PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key
```

## Verify Installation
```powershell
# Check service
curl http://localhost:3000/health

# Check extension
code --list-extensions | grep guardrail
```

## Common Commands (Ctrl+Shift+P)
- `Code Guardrail: Analyze Current File`
- `Code Guardrail: Clear All Issues`
- `Code Guardrail: Reload Rules`
- `Code Guardrail: Create Sample Rules`

## Troubleshooting
| Problem | Solution |
|---------|----------|
| Service won't start | Check Node.js 18+: `node --version` |
| Extension not working | Verify service: http://localhost:3000/health |
| Port 3000 in use | Edit `.env`: `PORT=3001`, restart service |
| No warnings showing | Restart VS Code, check Problems panel |

## Add Custom Rules
1. Go to `governance/` folder in service
2. Create/edit `.md` files with rules:
```markdown
# My Security Rule

## Detection Pattern
const password = "..."

## Risk
HIGH

## Explanation
Hardcoded passwords are security risks
```

## Project Structure
```
~/.guardrail/              Service installation
  ├── dist/                Compiled service
  ├── governance/          Rule definitions
  ├── .env                 Configuration
  └── start.bat/sh         Startup script

VS Code Extension          Auto-installed
  └── Settings accessible via File > Preferences
```

## URLs
- **GitHub**: https://github.com/AkashAi7/Guardrail
- **Issues**: https://github.com/AkashAi7/Guardrail/issues
- **Releases**: https://github.com/AkashAi7/Guardrail/releases
- **Docs**: https://github.com/AkashAi7/Guardrail/blob/main/README.md

## Support
- Open an issue on GitHub
- Check documentation
- Review troubleshooting guide

## Example Detection
```typescript
// ❌ Will be flagged
const query = "SELECT * FROM users WHERE id = " + userId;
const apiKey = "sk-1234567890";
const password = "admin123";

// ✅ Better approach
const query = db.prepare("SELECT * FROM users WHERE id = ?").bind(userId);
const apiKey = process.env.API_KEY;
const password = await getFromSecretManager();
```

## Performance
- **Lightweight**: ~100MB total install
- **Fast**: Analysis in < 1 second
- **Efficient**: Only analyzes changed code

## Requirements
- Node.js 18+
- VS Code 1.80+
- Windows 10+, macOS 10.15+, or Linux
- GitHub Copilot (optional) OR API key (optional)

---

**Version**: 0.1.0 | **License**: MIT | **Author**: AkashAi7
