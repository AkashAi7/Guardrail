# Steps to Create GitHub Release v0.4.0

## Method 1: Using GitHub CLI (Recommended)

### Prerequisites
Install GitHub CLI if not already installed:
```powershell
winget install GitHub.cli
```

### Create Release

```powershell
# 1. Navigate to project directory
cd "c:\Users\akashdwivedi\OneDrive - Microsoft\Desktop\IntrestingIdeas\Guardrail"

# 2. Login to GitHub (if not already)
gh auth login

# 3. Create release with VSIX file
gh release create v0.4.0 `
  ".\extension\code-guardrail-0.4.0.vsix#Code Guardrail Extension v0.4.0" `
  --title "Code Guardrail v0.4.0 - Critical Bug Fix" `
  --notes-file ".\RELEASE_NOTES_v0.4.0.md" `
  --repo AkashAi7/Guardrail

# 4. Verify release was created
gh release view v0.4.0 --repo AkashAi7/Guardrail
```

---

## Method 2: Using GitHub Web Interface

### Step 1: Commit and Push Changes

```powershell
cd "c:\Users\akashdwivedi\OneDrive - Microsoft\Desktop\IntrestingIdeas\Guardrail"

# Stage all changes
git add .

# Commit
git commit -m "Release v0.4.0 - Fix installation version mismatch

- Update install scripts to distribute v0.4.0
- Add verification script
- Add troubleshooting guide
- Rebuild extension package
- Update documentation"

# Push to main branch
git push origin main

# Create and push tag
git tag -a v0.4.0 -m "Version 0.4.0 - Critical bug fix release"
git push origin v0.4.0
```

### Step 2: Create Release on GitHub

1. **Go to GitHub:**
   - Navigate to: https://github.com/AkashAi7/Guardrail

2. **Create Release:**
   - Click "Releases" (right sidebar)
   - Click "Draft a new release"

3. **Configure Release:**
   - **Tag:** Select `v0.4.0` (or create new if not exists)
   - **Title:** `Code Guardrail v0.4.0 - Critical Bug Fix`
   - **Description:** Copy content from `RELEASE_NOTES_v0.4.0.md`

4. **Upload VSIX File:**
   - Click "Attach binaries by dropping them here or selecting them"
   - Upload: `extension\code-guardrail-0.4.0.vsix` (6.95 MB)

5. **Publish:**
   - Check "Set as the latest release"
   - Click "Publish release"

---

## Method 3: Using Git Commands + Manual Upload

### Step 1: Create and Push Tag

```powershell
cd "c:\Users\akashdwivedi\OneDrive - Microsoft\Desktop\IntrestingIdeas\Guardrail"

# Create tag
git tag -a v0.4.0 -m "Version 0.4.0"

# Push tag
git push origin v0.4.0
```

### Step 2: Upload Manually
1. Go to: https://github.com/AkashAi7/Guardrail/releases/new?tag=v0.4.0
2. Fill in release details (see Method 2 above)
3. Upload VSIX file

---

## Post-Release Verification

### 1. Test Installation from Release

```powershell
# Test that the installation script works with the new release
# (You may need to update the script to point to v0.4.0)

# Test download URL
$testUrl = "https://github.com/AkashAi7/Guardrail/releases/download/v0.4.0/code-guardrail-0.4.0.vsix"
Invoke-WebRequest -Uri $testUrl -Method Head
# Should return 200 OK
```

### 2. Test End-to-End Installation

On a test machine:
```powershell
# Clear previous installations
code --uninstall-extension akashai7.code-guardrail
Remove-Item "$env:USERPROFILE\.guardrail" -Recurse -Force -ErrorAction SilentlyContinue

# Install from release
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex

# Verify
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/verify-installation.ps1 | iex
```

### 3. Update Documentation Links

Make sure these files reference the correct release:
- [ ] README.md - Installation section
- [ ] QUICK_INSTALL.md - Download links
- [ ] INSTALL.md - Manual installation steps

---

## Files to Include in Release

✅ **Required:**
- [x] `code-guardrail-0.4.0.vsix` (6.95 MB) - Extension package

📄 **Release Notes:**
- [x] `RELEASE_NOTES_v0.4.0.md` - Full release notes

📚 **Optional Documentation (link from release notes):**
- README.md
- QUICK_INSTALL.md
- TROUBLESHOOTING.md
- FIX_SUMMARY.md

---

## Release Checklist

Before publishing:
- [ ] Extension version in package.json is 0.4.0
- [ ] VSIX file is built and tested locally
- [ ] All changes committed to main branch
- [ ] Installation scripts point to v0.4.0
- [ ] Release notes written and reviewed
- [ ] CHANGELOG.md updated

After publishing:
- [ ] Test installation from release URL
- [ ] Verify VSIX downloads correctly
- [ ] Run verification script on clean machine
- [ ] Update marketplace listing (if applicable)
- [ ] Announce release to users

---

## Quick Copy-Paste: GitHub CLI Command

```powershell
cd "c:\Users\akashdwivedi\OneDrive - Microsoft\Desktop\IntrestingIdeas\Guardrail"

gh release create v0.4.0 `
  ".\extension\code-guardrail-0.4.0.vsix#Code Guardrail Extension v0.4.0" `
  --title "Code Guardrail v0.4.0 - Critical Bug Fix" `
  --notes "## Critical Fix: Extension Not Working Issue

This release fixes the critical issue where the extension was not showing security highlights.

**What was fixed:**
- Installation scripts now distribute v0.4.0 (was v0.1.0)
- Added verification script
- Created comprehensive troubleshooting guide
- Rebuilt extension with all dependencies

**Installation:**
\`\`\`powershell
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.ps1 | iex
\`\`\`

**Verify:**
\`\`\`powershell
iwr -useb https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/verify-installation.ps1 | iex
\`\`\`

See full release notes: https://github.com/AkashAi7/Guardrail/blob/main/RELEASE_NOTES_v0.4.0.md" `
  --repo AkashAi7/Guardrail `
  --latest
```

---

## Troubleshooting Release Creation

### "Tag already exists"
```powershell
# Delete local tag
git tag -d v0.4.0

# Delete remote tag
git push origin :refs/tags/v0.4.0

# Recreate
git tag -a v0.4.0 -m "Version 0.4.0"
git push origin v0.4.0
```

### "Authentication failed"
```powershell
# Re-authenticate with GitHub CLI
gh auth login
```

### "File too large"
GitHub releases support files up to 2GB. Your VSIX (6.95 MB) is well within limits.

---

## Need Help?

If you encounter issues:
1. Check GitHub CLI is installed: `gh --version`
2. Check authentication: `gh auth status`
3. Check you're in the right directory: `pwd`
4. Check VSIX file exists: `Test-Path .\extension\code-guardrail-0.4.0.vsix`
