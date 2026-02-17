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
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                           ║${NC}"
echo -e "${CYAN}║${BOLD}           GUARDRAIL INSTALLER - HYBRID EDITION            ${NC}${CYAN}║${NC}"
echo -e "${CYAN}║                                                           ║${NC}"
echo -e "${CYAN}║  Real-time Code Security & Compliance Analysis           ║${NC}"
echo -e "${CYAN}║  Supports: GitHub Copilot OR Bring Your Own Key          ║${NC}"
echo -e "${CYAN}║                                                           ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${CYAN}Checking prerequisites...${NC}"
echo ""

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed${NC}"
    echo "Please install Git from https://git-scm.com/"
    exit 1
fi
echo -e "${GREEN}✓${NC} Git $(git --version | cut -d' ' -f3)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher (current: $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} npm $(npm -v)"

# Check VS Code
if ! command -v code &> /dev/null; then
    echo -e "${YELLOW}⚠${NC}  VS Code CLI not found (extension installation will be manual)"
    HAS_VSCODE=false
else
    echo -e "${GREEN}✓${NC} VS Code $(code --version | head -n1)"
    HAS_VSCODE=true
fi

echo ""

# Clone or update repository
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${CYAN}Installing Guardrail Backend Service${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo ""

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠${NC}  Existing installation found at $INSTALL_DIR"
    read -p "Remove and reinstall? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing existing installation..."
        rm -rf "$INSTALL_DIR"
        echo -e "${GREEN}✓${NC} Removed"
    else
        echo "Aborted."
        exit 0
    fi
fi

echo "Cloning Guardrail from GitHub ($BRANCH branch)..."
git clone -b "$BRANCH" --single-branch "$REPO_URL" "$INSTALL_DIR"
echo -e "${GREEN}✓${NC} Downloaded successfully"
echo ""

# Install service
echo "Installing backend dependencies (this may take a minute)..."
cd "$INSTALL_DIR/service"

echo "Installing backend dependencies (this may take a minute)..."
cd "$INSTALL_DIR/service"

if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠${NC}  .env file already exists, keeping existing configuration..."
else
    echo "Creating .env file from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓${NC} Created .env file"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
fi

echo "Installing dependencies..."
npm install --no-audit

echo "Building TypeScript..."
npm run build

echo -e "${GREEN}✓${NC} Service installed successfully"
echo ""

# Install extension
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${CYAN}Installing VS Code Extension${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo ""

cd "$INSTALL_DIR/extension"

echo "Installing dependencies..."
npm install --no-audit

echo "Compiling TypeScript..."
npm run compile

echo "Packaging extension..."
# Install vsce if needed
if ! command -v vsce &> /dev/null; then
    echo "Installing vsce..."
    npm install -g @vscode/vsce
fi

npm run package

if [ "$HAS_VSCODE" = true ]; then
    echo "Installing extension in VS Code..."
    VSIX_FILE=$(ls *.vsix 2>/dev/null | head -n1)
    if [ -n "$VSIX_FILE" ]; then
        code --install-extension "$VSIX_FILE" --force
        echo -e "${GREEN}✓${NC} Extension installed successfully"
    else
        echo -e "${RED}❌ No .vsix file found${NC}"
    fi
else
    echo -e "${YELLOW}⚠${NC}  Manual installation required:"
    echo "  1. Open VS Code"
    echo "  2. Go to Extensions view (Ctrl+Shift+X)"
    echo "  3. Click '...' menu → Install from VSIX"
    echo "  4. Select: $INSTALL_DIR/extension/$(ls *.vsix | head -n1)"
fi

cd "$INSTALL_DIR"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Installation Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Installation Directory:${NC} $INSTALL_DIR"
echo -e "${CYAN}Service URL:${NC} http://localhost:$SERVICE_PORT"
echo ""
echo -e "${BOLD}🚀 Next Steps:${NC}"
echo ""
echo -e "${YELLOW}1. Start the service:${NC}"
echo "   cd $INSTALL_DIR/service"
echo "   npm start"
echo ""
echo -e "${YELLOW}2. Restart VS Code${NC}"
echo ""
echo -e "${YELLOW}3. Open any TypeScript/JavaScript file and save it${NC}"
echo "   → Analysis will run automatically!"
echo ""
echo -e "${CYAN}📚 Documentation:${NC}"
echo "  • Main README: $INSTALL_DIR/README.md"
echo "  • Governance rules: $INSTALL_DIR/governance/README.md"
echo ""
echo -e "${CYAN}⚙️  Configuration:${NC}"
echo "  • Service: $INSTALL_DIR/service/.env"
echo "  • VS Code: Preferences → Settings → Code Guardrail"
echo ""
echo -e "${CYAN}💡 Tip:${NC} The service must be running for the extension to work."
echo "    Use 'Code Guardrail: Start Local Service' from command palette."
echo ""
echo "Happy coding! 🎉"
