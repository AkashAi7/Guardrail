#!/bin/bash
# Code Guardrail Installer - GitHub Release
# Installs from pre-built release artifacts (lightweight, ~10MB)

set -e

VERSION="${VERSION:-0.1.0}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.guardrail}"
REPO_URL="https://github.com/AkashAi7/Guardrail"
RELEASE_BASE_URL="$REPO_URL/releases/download/v$VERSION"
SERVICE_ZIP_URL="$RELEASE_BASE_URL/guardrail-service-v$VERSION.zip"
EXTENSION_URL="$RELEASE_BASE_URL/code-guardrail-0.1.0.vsix"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}========================================"
echo -e "  Code Guardrail Installer"
echo -e "========================================${NC}"
echo ""
echo -e "${YELLOW}Version: v$VERSION${NC}"
echo -e "${YELLOW}Install Directory: $INSTALL_DIR${NC}"
echo ""

# ============================================
# Check Prerequisites
# ============================================
echo -e "${CYAN}🔍 Checking prerequisites...${NC}"

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/${NC}"
    exit 1
fi

# Check VS Code
if command -v code >/dev/null 2>&1; then
    CODE_VERSION=$(code --version | head -n 1)
    echo -e "${GREEN}✅ VS Code: $CODE_VERSION${NC}"
else
    echo -e "${RED}❌ VS Code not found. Please install from https://code.visualstudio.com/${NC}"
    exit 1
fi

# Check unzip
if ! command -v unzip >/dev/null 2>&1; then
    echo -e "${RED}❌ unzip not found. Please install unzip${NC}"
    exit 1
fi

# ============================================
# Download Service
# ============================================
echo ""
echo -e "${CYAN}📥 Downloading service package...${NC}"

TEMP_ZIP=$(mktemp /tmp/guardrail-service.XXXXXX.zip)

if curl -L -o "$TEMP_ZIP" "$SERVICE_ZIP_URL" 2>/dev/null; then
    echo -e "${GREEN}✅ Downloaded service package${NC}"
else
    echo -e "${RED}❌ Failed to download service from: $SERVICE_ZIP_URL${NC}"
    rm -f "$TEMP_ZIP"
    exit 1
fi

# ============================================
# Extract Service
# ============================================
echo ""
echo -e "${CYAN}📦 Extracting service...${NC}"

# Create install directory
if [ -d "$INSTALL_DIR" ]; then
    echo -e "  ${YELLOW}Removing existing installation...${NC}"
    rm -rf "$INSTALL_DIR"
fi

mkdir -p "$INSTALL_DIR"

if unzip -q "$TEMP_ZIP" -d "$INSTALL_DIR"; then
    rm -f "$TEMP_ZIP"
    echo -e "${GREEN}✅ Service extracted to: $INSTALL_DIR${NC}"
else
    echo -e "${RED}❌ Failed to extract service${NC}"
    rm -f "$TEMP_ZIP"
    exit 1
fi

# ============================================
# Configure Service
# ============================================
echo ""
echo -e "${CYAN}⚙️ Configuring service...${NC}"

if [ ! -f "$INSTALL_DIR/.env" ]; then
    if [ -f "$INSTALL_DIR/.env.example" ]; then
        cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
        echo -e "${GREEN}✅ Created .env configuration${NC}"
    else
        echo -e "${YELLOW}⚠️ No .env.example found, skipping configuration${NC}"
    fi
else
    echo -e "${GREEN}✅ .env already exists${NC}"
fi

# ============================================
# Download & Install Extension
# ============================================
echo ""
echo -e "${CYAN}📥 Downloading VS Code extension...${NC}"

TEMP_VSIX=$(mktemp /tmp/code-guardrail.XXXXXX.vsix)

if curl -L -o "$TEMP_VSIX" "$EXTENSION_URL" 2>/dev/null; then
    echo -e "${GREEN}✅ Downloaded extension${NC}"
else
    echo -e "${RED}❌ Failed to download extension from: $EXTENSION_URL${NC}"
    rm -f "$TEMP_VSIX"
    exit 1
fi

echo ""
echo -e "${CYAN}🔧 Installing VS Code extension...${NC}"

if code --install-extension "$TEMP_VSIX" --force >/dev/null 2>&1; then
    rm -f "$TEMP_VSIX"
    echo -e "${GREEN}✅ Extension installed${NC}"
else
    echo -e "${RED}❌ Failed to install extension${NC}"
    rm -f "$TEMP_VSIX"
    exit 1
fi

# ============================================
# Start Service
# ============================================
echo ""
echo -e "${CYAN}🚀 Starting service...${NC}"

cd "$INSTALL_DIR"

# Start service in background
nohup node dist/index.js > service.log 2> service-error.log &
SERVICE_PID=$!

sleep 3

# Check if service is running
if curl -s http://localhost:3000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Service started successfully (PID: $SERVICE_PID)${NC}"
else
    echo -e "${YELLOW}⚠️ Service may not be running. Check logs:${NC}"
    echo -e "   ${YELLOW}$INSTALL_DIR/service.log${NC}"
    echo -e "   ${YELLOW}$INSTALL_DIR/service-error.log${NC}"
fi

# ============================================
# Success
# ============================================
echo ""
echo -e "${GREEN}========================================"
echo -e "  ✅ Installation Complete!"
echo -e "========================================${NC}"
echo ""
echo -e "${CYAN}📍 Service Location:${NC}"
echo -e "   $INSTALL_DIR"
echo ""
echo -e "${CYAN}🔧 Service Status:${NC}"
echo -e "   ${GREEN}✓ Running on http://localhost:3000${NC}"
echo -e "   ${GREEN}✓ Process ID: $SERVICE_PID${NC}"
echo ""
echo -e "${CYAN}🎯 Next Steps:${NC}"
echo -e "   1. Restart VS Code"
echo -e "   2. Open any TypeScript/JavaScript file"
echo -e "   3. Try adding:"
echo -e "      ${YELLOW}const password = \"admin123\";${NC}"
echo -e "      ${YELLOW}const apiKey = \"sk-1234567890\";${NC}"
echo -e "   4. Save → See real-time analysis! ✨"
echo ""
echo -e "${CYAN}📚 Documentation:${NC}"
echo -e "   $REPO_URL"
echo ""
echo -e "${CYAN}🛠️ Manage Service:${NC}"
echo -e "   Stop:  kill $SERVICE_PID"
echo -e "   Start: cd $INSTALL_DIR && node dist/index.js"
echo -e "   Logs:  tail -f $INSTALL_DIR/service.log"
echo ""
