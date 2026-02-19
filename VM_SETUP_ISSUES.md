# Common VM Setup Issues - Quick Reference

This document provides quick solutions for common issues when setting up Code Guardrail on a new VM or development machine.

## Issue: Dependencies Not Installed

**Symptom:**
```
npm error missing: @types/node@20.x
npm error missing: mammoth@^1.11.0
```

**Quick Fix:**
```bash
cd extension
npm install

cd ../service  
npm install
```

## Issue: Wrong Node.js Version

**Symptom:**
```
error: engines {"node":">=18.0.0"}
```

**Quick Fix:**
```bash
# Check version
node --version

# If < 18, install Node 18+:
# Using nvm (recommended):
nvm install 18
nvm use 18

# Or download from nodejs.org
```

## Issue: TypeScript Compilation Fails

**Symptom:**
```
error TS2307: Cannot find module 'vscode'
```

**Quick Fix:**
```bash
cd extension
npm install --save-dev @types/vscode @types/node
npm run compile
```

## Issue: Can't Create VSIX Package

**Symptom:**
```
command not found: vsce
# OR
npm ERR! missing script: package
```

**Quick Fix:**
```bash
cd extension
npm install --save-dev @vscode/vsce
npm run package
```

## Issue: Extension Not Working in VS Code

**Quick Checks:**
1. Is the service running?
   ```bash
   cd service
   npm run dev
   ```

2. Check service health:
   ```bash
   curl http://localhost:3000/health
   ```

3. Check VS Code Output:
   - View → Output → Select "Code Guardrail"

4. Check Developer Tools:
   - Help → Toggle Developer Tools
   - Look for errors in Console

## Issue: Port 3000 Already in Use

**Symptom:**
```
Error: Port 3000 is already in use
```

**Quick Fix:**
```bash
# Option 1: Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9

# Option 2: Use different port
cd service
# Create/edit .env file
echo "PORT=3001" > .env
npm run dev
```

## Issue: git clone fails

**Symptom:**
```
Permission denied (publickey)
```

**Quick Fix:**
```bash
# Use HTTPS instead of SSH:
git clone https://github.com/AkashAi7/Guardrail.git

# Or set up SSH key:
ssh-keygen -t ed25519 -C "your_email@example.com"
# Add key to GitHub: Settings → SSH Keys
```

## Issue: npm install is slow

**Quick Fix:**
```bash
# Use a faster registry mirror (optional)
npm config set registry https://registry.npmjs.org/

# Or clear cache first:
npm cache clean --force
npm install
```

## Issue: VS Code Extension Not Loading

**Quick Fix:**
1. Ensure extension is compiled:
   ```bash
   cd extension
   npm run compile
   ls out/extension.js  # Should exist
   ```

2. Reload VS Code:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Reload Window"
   - Press Enter

3. Check extension is activated:
   - View → Extensions
   - Search for "Code Guardrail"
   - Should show as enabled

## Complete Fresh Setup (Copy-Paste)

If nothing else works, start completely fresh:

```bash
# 1. Ensure Node.js 18+ is installed
node --version  # Should be >= 18

# 2. Clone repo
git clone https://github.com/AkashAi7/Guardrail.git
cd Guardrail

# 3. Install service
cd service
npm install
npm run build

# 4. Install extension
cd ../extension
npm install
npm run compile

# 5. Start service (in one terminal)
cd ../service
npm run dev

# 6. Test extension (in VS Code)
# Press F5 in extension directory
```

## Still Having Issues?

1. **Check full setup guide:** [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)
2. **Check main docs:** [README.md](./README.md)
3. **Report an issue:** [GitHub Issues](https://github.com/AkashAi7/Guardrail/issues)

Include in your issue:
- OS and version
- Node.js version (`node --version`)
- npm version (`npm --version`)
- VS Code version
- Complete error message
- Steps to reproduce

---

**Quick Setup Time:** ~5-10 minutes on a fresh VM
**Disk Space Required:** ~200MB
