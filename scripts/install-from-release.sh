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

# Detect OS
OS_TYPE=$(uname -s)
NODE_INSTALLED=false
VSCODE_INSTALLED=false

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
    NODE_INSTALLED=true
else
    echo -e "${YELLOW}⚠️ Node.js not found${NC}"
    echo -e "${CYAN}📥 Attempting to install Node.js...${NC}"
    
    case "$OS_TYPE" in
        Linux*)
            # Try to detect package manager and install
            if command -v apt-get >/dev/null 2>&1; then
                # Debian/Ubuntu
                echo -e "${CYAN}Using apt to install Node.js...${NC}"
                sudo apt-get update && sudo apt-get install -y nodejs npm
                NODE_INSTALLED=true
                echo -e "${GREEN}✅ Node.js installed via apt${NC}"
            elif command -v yum >/dev/null 2>&1; then
                # RHEL/CentOS/Fedora
                echo -e "${CYAN}Using yum to install Node.js...${NC}"
                sudo yum install -y nodejs npm
                NODE_INSTALLED=true
                echo -e "${GREEN}✅ Node.js installed via yum${NC}"
            elif command -v brew >/dev/null 2>&1; then
                # Homebrew on Linux
                echo -e "${CYAN}Using Homebrew to install Node.js...${NC}"
                brew install node
                NODE_INSTALLED=true
                echo -e "${GREEN}✅ Node.js installed via Homebrew${NC}"
            else
                echo -e "${RED}❌ Could not detect package manager${NC}"
                echo -e "${YELLOW}   Please install Node.js manually from: https://nodejs.org/${NC}"
                exit 1
            fi
            ;;
        Darwin*)
            # macOS
            if command -v brew >/dev/null 2>&1; then
                echo -e "${CYAN}Using Homebrew to install Node.js...${NC}"
                brew install node
                NODE_INSTALLED=true
                echo -e "${GREEN}✅ Node.js installed via Homebrew${NC}"
            else
                echo -e "${YELLOW}⚠️ Homebrew not found. Installing Homebrew first...${NC}"
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                brew install node
                NODE_INSTALLED=true
                echo -e "${GREEN}✅ Node.js installed via Homebrew${NC}"
            fi
            ;;
        *)
            echo -e "${RED}❌ Unsupported OS: $OS_TYPE${NC}"
            echo -e "${YELLOW}   Please install Node.js manually from: https://nodejs.org/${NC}"
            exit 1
            ;;
    esac
fi

# Check VS Code
if command -v code >/dev/null 2>&1; then
    CODE_VERSION=$(code --version | head -n 1)
    echo -e "${GREEN}✅ VS Code: $CODE_VERSION${NC}"
    VSCODE_INSTALLED=true
else
    echo -e "${YELLOW}⚠️ VS Code not found${NC}"
    echo -e "${CYAN}📥 Attempting to install VS Code...${NC}"
    
    case "$OS_TYPE" in
        Linux*)
            # Download and install VS Code for Linux
            if command -v apt-get >/dev/null 2>&1; then
                # Debian/Ubuntu
                echo -e "${CYAN}Installing VS Code via apt...${NC}"
                wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /tmp/packages.microsoft.gpg
                sudo install -o root -g root -m 644 /tmp/packages.microsoft.gpg /etc/apt/trusted.gpg.d/
                sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
                sudo apt-get update && sudo apt-get install -y code
                VSCODE_INSTALLED=true
                echo -e "${GREEN}✅ VS Code installed via apt${NC}"
            elif command -v yum >/dev/null 2>&1; then
                # RHEL/CentOS/Fedora
                echo -e "${CYAN}Installing VS Code via yum...${NC}"
                sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
                sudo sh -c 'echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo'
                sudo yum install -y code
                VSCODE_INSTALLED=true
                echo -e "${GREEN}✅ VS Code installed via yum${NC}"
            else
                echo -e "${RED}❌ Could not install VS Code automatically${NC}"
                echo -e "${YELLOW}   Please install manually from: https://code.visualstudio.com/${NC}"
                exit 1
            fi
            ;;
        Darwin*)
            # macOS
            if command -v brew >/dev/null 2>&1; then
                echo -e "${CYAN}Using Homebrew to install VS Code...${NC}"
                brew install --cask visual-studio-code
                VSCODE_INSTALLED=true
                echo -e "${GREEN}✅ VS Code installed via Homebrew${NC}"
            else
                echo -e "${RED}❌ Homebrew not found${NC}"
                echo -e "${YELLOW}   Please install VS Code manually from: https://code.visualstudio.com/${NC}"
                exit 1
            fi
            ;;
        *)
            echo -e "${RED}❌ Unsupported OS: $OS_TYPE${NC}"
            echo -e "${YELLOW}   Please install VS Code manually from: https://code.visualstudio.com/${NC}"
            exit 1
            ;;
    esac
fi

# Check unzip
if ! command -v unzip >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ unzip not found, attempting to install...${NC}"
    
    case "$OS_TYPE" in
        Linux*)
            if command -v apt-get >/dev/null 2>&1; then
                sudo apt-get install -y unzip
            elif command -v yum >/dev/null 2>&1; then
                sudo yum install -y unzip
            fi
            ;;
        Darwin*)
            # unzip should be pre-installed on macOS
            echo -e "${RED}❌ unzip not found (unusual for macOS)${NC}"
            ;;
    esac
    
    if ! command -v unzip >/dev/null 2>&1; then
        echo -e "${RED}❌ Failed to install unzip${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ unzip installed${NC}"
fi

if [ "$NODE_INSTALLED" = true ] && [ "$VSCODE_INSTALLED" = true ]; then
    echo ""
    echo -e "${GREEN}✅ All prerequisites satisfied${NC}"
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
