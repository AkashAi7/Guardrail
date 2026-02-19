# Development Setup Guide

This guide helps you set up the Code Guardrail project for development on a fresh VM or new development machine.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+**: Required for both service and extension
  - Check version: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)
  - Or use nvm: `nvm install 18` (recommended)
- **VS Code**: Latest version
  - Download: [code.visualstudio.com](https://code.visualstudio.com/)
- **Git**: For cloning the repository
  - Check: `git --version`
  - Download: [git-scm.com](https://git-scm.com/)

## Quick Setup (3 Steps)

### 1. Clone the Repository

```bash
git clone https://github.com/AkashAi7/Guardrail.git
cd Guardrail
```

### 2. Install Dependencies

**Install both service and extension dependencies:**

```bash
# Install service dependencies
cd service
npm install

# Install extension dependencies  
cd ../extension
npm install

# Return to root
cd ..
```

### 3. Build the Project

**Build service:**

```bash
cd service
npm run build
```

**Build extension:**

```bash
cd ../extension
npm run compile
```

## Running the Project

### Start the Service

In one terminal:

```bash
cd service
npm run dev
```

The service will start on `http://localhost:3000`

### Run the Extension (Development Mode)

1. Open VS Code in the extension directory:
   ```bash
   cd extension
   code .
   ```

2. Press `F5` or go to `Run > Start Debugging`

3. A new VS Code window will open with the extension loaded

4. Test by opening any code file and checking for security issues

## Common Issues & Solutions

### Issue 1: `npm install` fails with "UNMET DEPENDENCY"

**Symptoms:**
```
npm error missing: @types/node@20.x
npm error missing: mammoth@^1.11.0
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue 2: Node.js version too old

**Symptoms:**
```
error: engines {"node":">=18.0.0"}
```

**Solution:**
```bash
# Check your Node.js version
node --version

# If < 18, upgrade using nvm (recommended):
nvm install 18
nvm use 18

# Or download from nodejs.org
```

### Issue 3: TypeScript compilation errors

**Symptoms:**
```
error TS2307: Cannot find module 'vscode'
```

**Solution:**
```bash
# Reinstall type definitions
npm install --save-dev @types/vscode @types/node

# Rebuild
npm run compile
```

### Issue 4: Extension doesn't activate in VS Code

**Symptoms:**
- Extension loads but shows no activity
- No errors in console

**Checklist:**
1. Ensure the service is running (`npm run dev` in service folder)
2. Check VS Code's Output panel (View → Output → "Code Guardrail")
3. Check Developer Tools console (Help → Toggle Developer Tools)
4. Verify `out/extension.js` exists after compilation

### Issue 5: Can't package extension (VSIX creation fails)

**Symptoms:**
```
command not found: vsce
```

**Solution:**
```bash
# The package.json now includes @vscode/vsce as a dev dependency
# Just reinstall:
npm install

# Then package:
npm run package
```

## Development Workflow

### Making Code Changes

**For Extension (TypeScript):**

1. Make your changes in `extension/src/`
2. Compile: `npm run compile`
3. Or use watch mode: `npm run watch`
4. Test by pressing `F5` in VS Code

**For Service (TypeScript):**

1. Make your changes in `service/src/`
2. The dev server auto-reloads: `npm run dev`
3. Or manually rebuild: `npm run build`

### Testing

**Test the extension:**
```bash
cd extension
npm test
```

**Test the service:**
```bash
cd service
npm test
```

### Packaging for Distribution

**Create VSIX file:**
```bash
cd extension
npm run package
```

This creates `code-guardrail-X.X.X.vsix`

**Install locally:**
```bash
code --install-extension code-guardrail-X.X.X.vsix
```

## Project Structure

```
Guardrail/
├── extension/           # VS Code extension
│   ├── src/            # TypeScript source
│   ├── out/            # Compiled JavaScript
│   ├── package.json    # Extension manifest
│   └── tsconfig.json   # TypeScript config
│
├── service/            # Backend service
│   ├── src/            # TypeScript source
│   ├── dist/           # Compiled JavaScript
│   ├── governance/     # Rule definitions
│   └── package.json    # Service config
│
└── scripts/            # Installation scripts
```

## IDE Setup (VS Code)

### Recommended Extensions

Install these for better development experience:

- **ESLint** - Code linting
- **TypeScript Vue Plugin** - Enhanced TypeScript support
- **GitLens** - Git integration
- **REST Client** - Test service API endpoints

### VS Code Settings

Create `.vscode/settings.json` in project root:

```json
{
  "editor.formatOnSave": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Debugging Configuration

The project includes `.vscode/launch.json` for debugging the extension.

**To debug:**
1. Set breakpoints in `extension/src/extension.ts`
2. Press `F5`
3. Breakpoints will hit in the new VS Code window

## Troubleshooting Checklist

Before asking for help, verify:

- [ ] Node.js version is 18+ (`node --version`)
- [ ] Dependencies are installed (`node_modules` exists in both folders)
- [ ] Code compiles without errors (`npm run compile`)
- [ ] Service is running (`curl http://localhost:3000/health`)
- [ ] VS Code Developer Tools show no errors (Help → Toggle Developer Tools)
- [ ] Extension output log shows no errors (View → Output → "Code Guardrail")

## Getting Help

If you encounter issues not covered here:

1. **Check existing issues**: [GitHub Issues](https://github.com/AkashAi7/Guardrail/issues)
2. **Check documentation**: See `INSTALL.md`, `README.md`, or service/extension READMEs
3. **Open a new issue**: Include:
   - Operating system and version
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - VS Code version
   - Full error message
   - Steps to reproduce

## Advanced Topics

### Using Different Service URL

If running service on different port or remote machine:

1. Update `extension/src/config.ts` or
2. Use VS Code setting: `codeGuardrail.serviceUrl`

### Custom Governance Rules

Add custom rules in `service/governance/custom/`:

1. Create markdown file with YAML frontmatter
2. Restart service
3. Rules automatically load

See `service/governance/README.md` for details.

### Environment Variables

Service configuration via `.env` file:

```bash
cd service
cp .env.example .env
# Edit .env with your settings
```

## Next Steps

After setup:

1. Read [DESIGN_BRAINSTORM.md](./DESIGN_BRAINSTORM.md) - Understand architecture
2. Read [WORKFLOW_SEQUENCE.md](./WORKFLOW_SEQUENCE.md) - Understand flows
3. Explore governance rules in `service/governance/`
4. Try adding a custom rule
5. Contribute! See `CONTRIBUTING.md`

---

**Happy coding! 🚀**
