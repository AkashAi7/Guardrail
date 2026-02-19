#!/bin/bash
# Code Guardrail Installer - AI-Only Version
# Quick install script for the AI-powered Code Guardrail extension

VERSION="${1:-0.6.0-ai-only}"

REPO_URL="https://github.com/AkashAi7/Guardrail"
RELEASE_URL="$REPO_URL/releases/download/v$VERSION"
EXTENSION_URL="$RELEASE_URL/code-guardrail-ai-only.vsix"

echo ""
echo "========================================"
echo "  🤖 Code Guardrail AI Installer"
echo "========================================"
echo ""
echo "Version: v$VERSION"
echo "AI-Powered Security Analysis"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================
# Check Prerequisites
# ============================================
echo -e "${CYAN}🔍 Checking prerequisites...${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    echo ""
    echo -e "${YELLOW}Please install Node.js first:${NC}"
    echo -e "${CYAN}  macOS: brew install node${NC}"
    echo -e "${CYAN}  Linux: sudo apt install nodejs npm${NC}"
    echo -e "${CYAN}  Or visit: https://nodejs.org/${NC}"
    echo ""
    exit 1
fi

# Check VS Code
if command -v code &> /dev/null; then
    CODE_VERSION=$(code --version | head -n 1)
    echo -e "${GREEN}✅ VS Code: $CODE_VERSION${NC}"
else
    echo -e "${RED}❌ VS Code not found${NC}"
    echo ""
    echo -e "${YELLOW}Please install VS Code first:${NC}"
    echo -e "${CYAN}  https://code.visualstudio.com/${NC}"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All prerequisites satisfied${NC}"

# ============================================
# Download Extension
# ============================================
echo ""
echo -e "${CYAN}📥 Downloading extension (~7MB)...${NC}"

TEMP_VSIX="/tmp/code-guardrail-ai-only.vsix"

if curl -L "$EXTENSION_URL" -o "$TEMP_VSIX" --fail --silent --show-error; then
    echo -e "${GREEN}✅ Downloaded extension${NC}"
else
    echo -e "${RED}❌ Failed to download from: $EXTENSION_URL${NC}"
    exit 1
fi

# ============================================
# Install Extension
# ============================================
echo ""
echo -e "${CYAN}🔧 Installing extension...${NC}"

# Check if extension is already installed
if code --list-extensions 2>&1 | grep -q "akashai7.code-guardrail"; then
    echo -e "${YELLOW}  Uninstalling previous version...${NC}"
    code --uninstall-extension akashai7.code-guardrail --force &> /dev/null
    sleep 2
fi

# Install new version
if code --install-extension "$TEMP_VSIX" --force &> /dev/null; then
    echo -e "${GREEN}✅ Extension installed successfully${NC}"
else
    echo -e "${YELLOW}⚠️ Extension may be installed but with warnings${NC}"
fi

rm -f "$TEMP_VSIX"

# ============================================
# Clone Repository (Optional)
# ============================================
echo ""
read -p "📦 Do you want to clone the repository with test files? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    REPO_PATH="$HOME/Guardrail"
    
    if [ -d "$REPO_PATH" ]; then
        echo -e "${YELLOW}  Repository already exists at: $REPO_PATH${NC}"
    else
        echo -e "${CYAN}  Cloning repository...${NC}"
        if git clone "$REPO_URL" "$REPO_PATH" &> /dev/null; then
            echo -e "${GREEN}✅ Repository cloned to: $REPO_PATH${NC}"
        else
            echo -e "${YELLOW}⚠️ Failed to clone repository (git may not be installed)${NC}"
        fi
    fi
fi

# ============================================
# Success Message
# ============================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Installation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}🤖 AI-Only Analysis Mode${NC}"
echo -e "   The service will auto-start when VS Code launches"
echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo ""
echo "  1. Restart VS Code (or reload window)"
echo "     • Press Ctrl+Shift+P (Cmd+Shift+P on macOS)"
echo "     • Type 'Reload Window'"
echo ""
echo "  2. Test with sample files:"
echo "     • Clone repo: git clone $REPO_URL"
echo "     • Open: test-files/test-auth-service.ts"
echo "     • Or: test-files/test-flask-api.py"
echo ""
echo "  3. Scan entire project:"
echo "     • Ctrl+Shift+P → 'Code Guardrail: Scan Entire Project'"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo -e "${CYAN}   $REPO_URL${NC}"
echo ""
echo -e "${YELLOW}✨ Features:${NC}"
echo "   • Detects hardcoded secrets (API keys, passwords)"
echo "   • Finds SQL injection vulnerabilities"
echo "   • Catches XSS, command injection, path traversal"
echo "   • Identifies weak cryptography"
echo "   • And much more..."
echo ""
