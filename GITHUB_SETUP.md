# GitHub Repository Setup Guide

This guide helps you prepare the Guardrail repository for public release and GitHub-based installation.

## 📋 Pre-Release Checklist

### 1. Repository Setup

- [ ] Create GitHub repository: `https://github.com/AkashAi7/Guardrail`
- [ ] Set repository to public (or keep private during testing)
- [ ] Add repository description: "*Real-time intelligent code analysis powered by GitHub Copilot SDK for security, compliance, and best practices*"
- [ ] Add topics/tags: `copilot`, `security`, `compliance`, `vscode-extension`, `code-quality`, `linter`
- [ ] Set default branch to `main`

### 2. Repository Files

Ensure these files are present:

- [x] **README.md** - Main documentation with quick install
- [x] **INSTALL.md** - Detailed installation instructions
- [x] **QUICK_INSTALL.md** - One-line installer guide
- [x] **LICENSE** - MIT License (or your choice)
- [x] **CHANGELOG.md** - Version history (extension/)
- [x] **.gitignore** - Ignore node_modules, .env, dist, etc.
- [x] **install.ps1** - Windows installer
- [x] **scripts/install.sh** - macOS/Linux installer
- [x] **service/.env.example** - Configuration template

### 3. Code Files

Verify all source files are committed:

- [x] `service/` - Backend service source
- [x] `extension/` - VS Code extension source
- [x] `governance/` - Governance rules
- [x] Documentation files

### 4. Configuration Files

- [x] **service/package.json** - Correct name, version, repository URL
- [x] **extension/package.json** - Correct publisher, repository URL
- [x] **service/tsconfig.json** - TypeScript configuration
- [x] **extension/tsconfig.json** - TypeScript configuration

### 5. Sensitive Data

Ensure NO sensitive data is committed:

- [ ] No `.env` files (only `.env.example`)
- [ ] No API keys or secrets
- [ ] No personal tokens
- [ ] Add `.gitignore` rules:
  ```gitignore
  # Environment
  .env
  .env.local
  
  # Dependencies
  node_modules/
  
  # Build outputs
  dist/
  out/
  *.vsix
  
  # Logs
  logs/
  *.log
  
  # OS files
  .DS_Store
  Thumbs.db
  ```

---

## 🚀 Publishing Steps

### Step 1: Commit All Files

```bash
# Check status
git status

# Add all files
git add .

# Commit
git commit -m "chore: Prepare for public release"

# Push to GitHub
git push origin main
```

### Step 2: Verify URLs in Code

Update these URLs to match your GitHub repository:

**install.ps1:**
```powershell
$REPO_URL = "https://github.com/AkashAi7/Guardrail.git"
```

**scripts/install.sh:**
```bash
REPO_URL="https://github.com/AkashAi7/Guardrail.git"
```

**extension/package.json:**
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/AkashAi7/Guardrail.git"
  }
}
```

### Step 3: Create GitHub Release (Optional but Recommended)

```bash
# Tag the release
git tag -a v0.1.0 -m "Initial public release"
git push origin v0.1.0
```

Then create a release on GitHub:
1. Go to: `https://github.com/AkashAi7/Guardrail/releases/new`
2. Select tag: `v0.1.0`
3. Release title: `v0.1.0 - Initial Release`
4. Description:
   ```markdown
   ## 🛡️ Guardrail v0.1.0 - Initial Release
   
   Real-time intelligent code analysis powered by GitHub Copilot SDK.
   
   ### Features
   - ✅ Real-time security analysis
   - ✅ Compliance checking (GDPR, HIPAA, SOC2, PCI-DSS)
   - ✅ Best practices enforcement
   - ✅ Hybrid mode: GitHub Copilot OR Bring Your Own Key
   
   ### Quick Install
   
   **Windows:**
   ```powershell
   iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex
   ```
   
   **macOS/Linux:**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install.sh | bash
   ```
   
   See [INSTALL.md](./INSTALL.md) for details.
   ```
5. Publish release

### Step 4: Test Installation

Test the one-line installer on a clean machine:

**Windows:**
```powershell
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex
```

**macOS/Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install.sh | bash
```

---

## 📖 Documentation Updates

### Update README.md

Ensure README.md has:
- Clear one-line installation commands
- Link to detailed installation guide
- System overview and architecture
- Quick verification steps
- Links to all documentation

### Update INSTALL.md

Ensure INSTALL.md has:
- Multiple installation methods
- Prerequisites clearly listed
- Troubleshooting section
- Configuration examples
- Uninstall instructions

### Create QUICK_INSTALL.md

One-page guide with:
- One-line install commands
- Custom installation options
- Quick verification steps
- Common troubleshooting

---

## 🔒 Security Best Practices

### Secrets Management

1. **Never commit secrets** to the repository
2. Use `.env.example` as template
3. Add `.env` to `.gitignore`
4. Document required environment variables

### Code Review

1. Review all code before pushing
2. Check for hardcoded credentials
3. Verify no debug code is committed
4. Ensure error messages don't leak sensitive info

---

## 🎯 Post-Publishing Tasks

### 1. Update Installation Links

Test that these URLs work:
- `https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1`
- `https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install.sh`

### 2. Create GitHub Issues Templates

Create `.github/ISSUE_TEMPLATE/`:

**bug_report.md:**
```markdown
---
name: Bug Report
about: Report a bug or issue
---

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior.

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g., Windows 11, macOS 14]
- Node.js version: [e.g., 20.0.0]
- VS Code version: [e.g., 1.85.0]

**Logs**
Paste relevant logs here.
```

**feature_request.md:**
```markdown
---
name: Feature Request
about: Suggest a new feature
---

**Feature Description**
Clear description of the feature.

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should this work?
```

### 3. Enable GitHub Pages (Optional)

For hosting documentation:
1. Settings → Pages
2. Source: Deploy from branch
3. Branch: `main` / `docs` folder
4. Save

### 4. Set Up GitHub Actions (Optional)

Create `.github/workflows/ci.yml` for automated testing:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install service dependencies
      run: |
        cd service
        npm install
        npm run build
    
    - name: Install extension dependencies
      run: |
        cd extension
        npm install
        npm run compile
```

### 5. Add Badges to README

Add status badges:

```markdown
[![GitHub release](https://img.shields.io/github/v/release/AkashAi7/Guardrail)](https://github.com/AkashAi7/Guardrail/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/AkashAi7/Guardrail?style=social)](https://github.com/AkashAi7/Guardrail)
```

---

## 🤝 Community Setup

### Enable Discussions

1. Settings → Features
2. Enable "Discussions"
3. Create categories:
   - 💬 General
   - 💡 Ideas
   - 🙏 Q&A
   - 📣 Announcements

### Create Contributing Guide

Create `CONTRIBUTING.md`:

```markdown
# Contributing to Guardrail

We welcome contributions! Here's how to get started:

## Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies:
   ```bash
   cd service && npm install
   cd ../extension && npm install
   ```
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Follow existing coding style
5. Write clear commit messages

## Code of Conduct

Be respectful and inclusive. We value contributions from everyone.
```

---

## ✅ Final Verification Checklist

Before announcing the release:

- [ ] Repository is public
- [ ] README.md has clear installation instructions
- [ ] One-line installer works on Windows
- [ ] One-line installer works on macOS/Linux
- [ ] Service starts without errors
- [ ] Extension installs successfully
- [ ] Basic analysis works (test with DEMO.ts)
- [ ] Documentation is complete
- [ ] No secrets in repository
- [ ] License file is present
- [ ] Repository URL is correct everywhere
- [ ] GitHub release is created
- [ ] Issue templates are set up

---

## 📢 Announcement

After everything is set up, announce on:

1. **GitHub Discussions** - Pin an announcement
2. **VS Code Marketplace** - If publishing extension
3. **Social Media** - Twitter, LinkedIn, etc.
4. **Dev Communities** - Reddit (r/vscode), Dev.to, etc.

### Sample Announcement

```markdown
🎉 Introducing Guardrail - Real-time Code Security & Compliance

Guardrail provides intelligent, real-time feedback as you code, catching:
✅ Security vulnerabilities (SQL injection, secrets, XSS)
✅ Compliance issues (GDPR, HIPAA, SOC2, PCI-DSS)
✅ Best practice violations

Powered by GitHub Copilot SDK (or bring your own API key)

Quick Install:
Windows: iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex
macOS/Linux: curl -fsSL https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install.sh | bash

GitHub: https://github.com/AkashAi7/Guardrail
```

---

## 🆘 Support

If you encounter issues during setup:
1. Check the [Troubleshooting](./INSTALL.md#troubleshooting) section
2. Search [existing issues](https://github.com/AkashAi7/Guardrail/issues)
3. Create a new issue with details

Happy shipping! 🚀
