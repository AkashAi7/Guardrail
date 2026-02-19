#!/bin/bash

# Code Guardrail - Installation Script (macOS/Linux)
# ================================================
# GitHub-based installation with automatic setup

set -e

# Configuration
INSTALL_DIR="${INSTALL_DIR:-$HOME/.guardrail}"
REPO_URL="https://github.com/AkashAi7/Guardrail.git"
BRANCH="${BRANCH:-main}"
SERVICE_PORT=3000

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${BOLD}                                                               ${NC}${CYAN}║${NC}"
echo -e "${CYAN}║${BOLD}       🛡️  GUARDRAIL INSTALLER - DEVELOPMENT MODE 🛡️         ${NC}${CYAN}║${NC}"
echo -e "${CYAN}║${BOLD}                                                               ${NC}${CYAN}║${NC}"
echo -e "${CYAN}║   Real-time Code Security & Compliance Analysis               ║${NC}"
echo -e "${CYAN}║   Supports: GitHub Copilot OR Bring Your Own Key              ║${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${BOLD}${CYAN}📋 Checking Prerequisites${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}  ✗${NC} Git is not installed"
    echo -e "    ${YELLOW}→ Install from: ${CYAN}https://git-scm.com/${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓${NC} Git ${BOLD}$(git --version | cut -d' ' -f3)${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}  ✗${NC} Node.js is not installed"
    echo -e "    ${YELLOW}→ Install from: ${CYAN}https://nodejs.org/${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}  ✗${NC} Node.js version must be 18+ (current: $(node -v))"
    exit 1
fi
echo -e "${GREEN}  ✓${NC} Node.js ${BOLD}$(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}  ✗${NC} npm is not installed"
    exit 1
fi
echo -e "${GREEN}  ✓${NC} npm ${BOLD}$(npm -v)${NC}"

# Check VS Code
if ! command -v code &> /dev/null; then
    echo -e "${YELLOW}  ⚠${NC} VS Code CLI not found (extension installation will be manual)"
    HAS_VSCODE=false
else
    echo -e "${GREEN}  ✓${NC} VS Code ${BOLD}$(code --version | head -n1)${NC}"
    HAS_VSCODE=true
fi

echo ""

# Clone or update repository
echo -e "${BOLD}${CYAN}📦 Installing Backend Service${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}  ⚠  Existing installation found at:${NC} $INSTALL_DIR"
    read -p "    Remove and reinstall? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "    ${BLUE}→${NC} Removing existing installation..."
        rm -rf "$INSTALL_DIR"
        echo -e "    ${GREEN}✓${NC} Removed"
    else
        echo -e "    ${RED}✗${NC} Installation aborted"
        exit 0
    fi
fi

echo -e "${BLUE}→${NC} Cloning from GitHub (${BOLD}$BRANCH${NC} branch)..."
git clone -b "$BRANCH" --single-branch "$REPO_URL" "$INSTALL_DIR"
echo -e "${GREEN}✓${NC} Downloaded successfully"
echo ""

# Install service
cd "$INSTALL_DIR/service"

if [ -f ".env" ]; then
    echo -e "${YELLOW}  ⚠  .env file already exists, keeping existing configuration...${NC}"
else
    echo -e "${BLUE}→${NC} Creating .env file from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}  ✓${NC} Created .env file"
    else
        echo -e "${RED}  ✗${NC} .env.example not found"
        exit 1
    fi
fi

echo -e "${BLUE}→${NC} Installing dependencies..."
npm install --no-audit

echo -e "${BLUE}→${NC} Building TypeScript..."
npm run build

echo -e "${GREEN}✓${NC} Service installed successfully"
echo ""

# Install extension
echo -e "${BOLD}${CYAN}🔌 Installing VS Code Extension${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$INSTALL_DIR/extension"

echo -e "${BLUE}→${NC} Installing dependencies..."
npm install --no-audit

echo -e "${BLUE}→${NC} Compiling TypeScript..."
npm run compile

echo -e "${BLUE}→${NC} Packaging extension..."
# Install vsce if needed
if ! command -v vsce &> /dev/null; then
    echo -e "${BLUE}→${NC} Installing vsce..."
    npm install -g @vscode/vsce
fi

npm run package

if [ "$HAS_VSCODE" = true ]; then
    echo -e "${BLUE}→${NC} Installing extension in VS Code..."
    VSIX_FILE=$(ls *.vsix 2>/dev/null | head -n1)
    if [ -n "$VSIX_FILE" ]; then
        code --install-extension "$VSIX_FILE" --force
        echo -e "${GREEN}✓${NC} Extension installed successfully"
    else
        echo -e "${RED}  ✗${NC} No .vsix file found"
    fi
else
    echo -e "${YELLOW}  ⚠  Manual installation required:${NC}"
    echo -e "    ${BLUE}→${NC} Open VS Code"
    echo -e "    ${BLUE}→${NC} Go to Extensions view (Ctrl+Shift+X)"
    echo -e "    ${BLUE}→${NC} Click '...' menu → Install from VSIX"
    echo -e "    ${BLUE}→${NC} Select: $INSTALL_DIR/extension/$(ls *.vsix | head -n1)"
fi

cd "$INSTALL_DIR"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║              ✅  INSTALLATION COMPLETE! ✅                     ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}${CYAN}📍 Installation Directory${NC}"
echo -e "   ${INSTALL_DIR}"
echo ""
echo -e "${BOLD}${CYAN}🌐 Service URL${NC}"
echo -e "   ${BLUE}http://localhost:$SERVICE_PORT${NC}"
echo ""
echo -e "${BOLD}${YELLOW}🚀 Next Steps:${NC}"
echo ""
echo -e "${BOLD}1.${NC} Start the service:"
echo -e "   ${CYAN}cd $INSTALL_DIR/service${NC}"
echo -e "   ${CYAN}npm start${NC}"
echo ""
echo -e "${BOLD}2.${NC} Restart VS Code"
echo ""
echo -e "${BOLD}3.${NC} Open any TypeScript/JavaScript file and save it"
echo -e "   ${GREEN}→ Analysis will run automatically!${NC}"
echo ""
echo -e "${BOLD}${CYAN}📚 Documentation${NC}"
echo -e "   ${BLUE}→${NC} Main README: ${CYAN}$INSTALL_DIR/README.md${NC}"
echo -e "   ${BLUE}→${NC} Governance rules: ${CYAN}$INSTALL_DIR/governance/README.md${NC}"
echo ""
echo -e "${BOLD}${CYAN}⚙️  Configuration${NC}"
echo -e "   ${BLUE}→${NC} Service: ${CYAN}$INSTALL_DIR/service/.env${NC}"
echo -e "   ${BLUE}→${NC} VS Code: Preferences → Settings → Code Guardrail"
echo ""
echo -e "${CYAN}💡 Tip:${NC} The service must be running for the extension to work."
echo -e "   Use 'Code Guardrail: Start Local Service' from command palette."
echo ""
echo -e "${BOLD}Happy coding! 🎉${NC}"
