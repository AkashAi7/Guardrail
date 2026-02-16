#!/bin/bash

# Code Guardrail - Installation Script (macOS/Linux)
# ================================================

set -e

echo "🛡️  Code Guardrail Installation Script"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

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

# Install service
echo "📦 Installing Guardrail Service..."
cd service

if [ -f ".env" ]; then
    echo "  .env file already exists, skipping..."
else
    echo "  Creating .env file from template..."
    cp .env.example .env
fi

echo "  Installing dependencies..."
npm install

echo "  Building TypeScript..."
npm run build

echo -e "${GREEN}✓${NC} Service installed successfully"
echo ""

# Install extension
echo "📦 Installing VS Code Extension..."
cd ../extension

echo "  Installing dependencies..."
npm install

echo "  Compiling TypeScript..."
npm run compile

echo "  Packaging extension..."
npm run package

if [ "$HAS_VSCODE" = true ]; then
    echo "  Installing extension in VS Code..."
    VSIX_FILE=$(ls *.vsix | head -n1)
    code --install-extension "$VSIX_FILE" --force
    echo -e "${GREEN}✓${NC} Extension installed successfully"
else
    echo -e "${YELLOW}⚠${NC}  Manual installation required:"
    echo "  1. Open VS Code"
    echo "  2. Go to Extensions view (Ctrl+Shift+X)"
    echo "  3. Click '...' menu → Install from VSIX"
    echo "  4. Select: $(pwd)/$(ls *.vsix | head -n1)"
fi

cd ..

echo ""
echo "═══════════════════════════════════════════════"
echo -e "${GREEN}✓ Installation Complete!${NC}"
echo "═══════════════════════════════════════════════"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Start the service:"
echo "   cd service"
echo "   npm start"
echo ""
echo "2. Open VS Code and save any file to trigger analysis"
echo ""
echo "3. Or manually analyze with Ctrl+Shift+G (Cmd+Shift+G on Mac)"
echo ""
echo "📚 Documentation:"
echo "  • Main README: README.md"
echo "  • Service docs: service/README.md"
echo "  • Extension docs: extension/README.md"
echo "  • Governance rules: governance/README.md"
echo ""
echo "⚙️  Configuration:"
echo "  • Service: service/.env"
echo "  • VS Code: File → Preferences → Settings → Code Guardrail"
echo ""
echo "💡 Tip: The service must be running for the extension to work."
echo "    Use 'Code Guardrail: Start Local Service' from command palette."
echo ""
echo "Happy coding! 🎉"
