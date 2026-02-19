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
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${BOLD}                                                               ${NC}${CYAN}║${NC}"
echo -e "${CYAN}║${BOLD}           🛡️  CODE GUARDRAIL INSTALLER 🛡️                   ${NC}${CYAN}║${NC}"
echo -e "${CYAN}║${BOLD}                                                               ${NC}${CYAN}║${NC}"
echo -e "${CYAN}║   Installing from GitHub Release (Lightweight ~10MB)         ║${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Version:${NC} ${BOLD}v$VERSION${NC}"
echo -e "${YELLOW}Install Directory:${NC} ${BOLD}$INSTALL_DIR${NC}"
echo ""

# ============================================
# Check Prerequisites
# ============================================
echo -e "${BOLD}${CYAN}📋 Checking Prerequisites${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Detect OS
OS_TYPE=$(uname -s)
NODE_INSTALLED=false
VSCODE_INSTALLED=false

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}  ✓${NC} Node.js ${BOLD}$NODE_VERSION${NC}"
    NODE_INSTALLED=true
else
    echo -e "${YELLOW}  ⚠  Node.js not found${NC}"
    echo -e "${BLUE}  →${NC} Attempting to install Node.js..."
    
    case "$OS_TYPE" in
        Linux*)
            # Try to detect package manager and install
            if command -v apt-get >/dev/null 2>&1; then
                # Debian/Ubuntu
                echo -e "${BLUE}    →${NC} Using apt to install Node.js..."
                sudo apt-get update && sudo apt-get install -y nodejs npm
                NODE_INSTALLED=true
                echo -e "${GREEN}    ✓${NC} Node.js installed via apt"
            elif command -v yum >/dev/null 2>&1; then
                # RHEL/CentOS/Fedora
                echo -e "${BLUE}    →${NC} Using yum to install Node.js..."
                sudo yum install -y nodejs npm
                NODE_INSTALLED=true
                echo -e "${GREEN}    ✓${NC} Node.js installed via yum"
            elif command -v brew >/dev/null 2>&1; then
                # Homebrew on Linux
                echo -e "${BLUE}    →${NC} Using Homebrew to install Node.js..."
                brew install node
                NODE_INSTALLED=true
                echo -e "${GREEN}    ✓${NC} Node.js installed via Homebrew"
            else
                echo -e "${RED}    ✗${NC} Could not detect package manager"
                echo -e "${YELLOW}    → Install Node.js manually: ${CYAN}https://nodejs.org/${NC}"
                exit 1
            fi
            ;;
        Darwin*)
            # macOS
            if command -v brew >/dev/null 2>&1; then
                echo -e "${BLUE}    →${NC} Using Homebrew to install Node.js..."
                brew install node
                NODE_INSTALLED=true
                echo -e "${GREEN}    ✓${NC} Node.js installed via Homebrew"
            else
                echo -e "${YELLOW}    ⚠  Homebrew not found. Installing Homebrew first...${NC}"
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                brew install node
                NODE_INSTALLED=true
                echo -e "${GREEN}    ✓${NC} Node.js installed via Homebrew"
            fi
            ;;
        *)
            echo -e "${RED}    ✗${NC} Unsupported OS: $OS_TYPE"
            echo -e "${YELLOW}    → Install Node.js manually: ${CYAN}https://nodejs.org/${NC}"
            exit 1
            ;;
    esac
fi

# Check VS Code
if command -v code >/dev/null 2>&1; then
    CODE_VERSION=$(code --version | head -n 1)
    echo -e "${GREEN}  ✓${NC} VS Code ${BOLD}$CODE_VERSION${NC}"
    VSCODE_INSTALLED=true
else
    echo -e "${YELLOW}  ⚠  VS Code not found${NC}"
    echo -e "${BLUE}  →${NC} Attempting to install VS Code..."
    
    case "$OS_TYPE" in
        Linux*)
            # Download and install VS Code for Linux
            if command -v apt-get >/dev/null 2>&1; then
                # Debian/Ubuntu
                echo -e "${BLUE}    →${NC} Installing VS Code via apt..."
                wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /tmp/packages.microsoft.gpg
                sudo install -o root -g root -m 644 /tmp/packages.microsoft.gpg /etc/apt/trusted.gpg.d/
                sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
                sudo apt-get update && sudo apt-get install -y code
                VSCODE_INSTALLED=true
                echo -e "${GREEN}    ✓${NC} VS Code installed via apt"
            elif command -v yum >/dev/null 2>&1; then
                # RHEL/CentOS/Fedora
                echo -e "${BLUE}    →${NC} Installing VS Code via yum..."
                sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
                sudo sh -c 'echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo'
                sudo yum install -y code
                VSCODE_INSTALLED=true
                echo -e "${GREEN}    ✓${NC} VS Code installed via yum"
            else
                echo -e "${RED}    ✗${NC} Could not install VS Code automatically"
                echo -e "${YELLOW}    → Install manually: ${CYAN}https://code.visualstudio.com/${NC}"
                exit 1
            fi
            ;;
        Darwin*)
            # macOS
            if command -v brew >/dev/null 2>&1; then
                echo -e "${BLUE}    →${NC} Using Homebrew to install VS Code..."
                brew install --cask visual-studio-code
                VSCODE_INSTALLED=true
                echo -e "${GREEN}    ✓${NC} VS Code installed via Homebrew"
            else
                echo -e "${RED}    ✗${NC} Homebrew not found"
                echo -e "${YELLOW}    → Install VS Code manually: ${CYAN}https://code.visualstudio.com/${NC}"
                exit 1
            fi
            ;;
        *)
            echo -e "${RED}    ✗${NC} Unsupported OS: $OS_TYPE"
            echo -e "${YELLOW}    → Install VS Code manually: ${CYAN}https://code.visualstudio.com/${NC}"
            exit 1
            ;;
    esac
fi

# Check unzip
if ! command -v unzip >/dev/null 2>&1; then
    echo -e "${YELLOW}  ⚠  unzip not found, attempting to install...${NC}"
    
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
            echo -e "${RED}    ✗${NC} unzip not found (unusual for macOS)"
            ;;
    esac
    
    if ! command -v unzip >/dev/null 2>&1; then
        echo -e "${RED}    ✗${NC} Failed to install unzip"
        exit 1
    fi
    echo -e "${GREEN}  ✓${NC} unzip installed"
fi

if [ "$NODE_INSTALLED" = true ] && [ "$VSCODE_INSTALLED" = true ]; then
    echo ""
    echo -e "${GREEN}  ✓ All prerequisites satisfied${NC}"
fi

# ============================================
# Download Service
# ============================================
echo ""
echo -e "${BOLD}${CYAN}📥 Downloading Service Package${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TEMP_ZIP=$(mktemp /tmp/guardrail-service.XXXXXX.zip)

echo -e "${BLUE}→${NC} Downloading from GitHub releases..."
if curl -L -o "$TEMP_ZIP" "$SERVICE_ZIP_URL" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Downloaded service package"
else
    echo -e "${RED}✗${NC} Failed to download from: $SERVICE_ZIP_URL"
    rm -f "$TEMP_ZIP"
    exit 1
fi

# ============================================
# Extract Service
# ============================================
echo ""
echo -e "${BOLD}${CYAN}📦 Extracting Service${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create install directory
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}  ⚠  Removing existing installation...${NC}"
    rm -rf "$INSTALL_DIR"
fi

mkdir -p "$INSTALL_DIR"

echo -e "${BLUE}→${NC} Extracting files..."
if unzip -q "$TEMP_ZIP" -d "$INSTALL_DIR"; then
    rm -f "$TEMP_ZIP"
    echo -e "${GREEN}✓${NC} Service extracted to: ${BOLD}$INSTALL_DIR${NC}"
else
    echo -e "${RED}✗${NC} Failed to extract service"
    rm -f "$TEMP_ZIP"
    exit 1
fi

# ============================================
# Configure Service
# ============================================
echo ""
echo -e "${BOLD}${CYAN}⚙️  Configuring Service${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ ! -f "$INSTALL_DIR/.env" ]; then
    if [ -f "$INSTALL_DIR/.env.example" ]; then
        cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
        echo -e "${GREEN}✓${NC} Created .env configuration"
    else
        echo -e "${YELLOW}  ⚠  No .env.example found, skipping configuration${NC}"
    fi
else
    echo -e "${GREEN}✓${NC} .env already exists"
fi

# ============================================
# Download & Install Extension
# ============================================
echo ""
echo -e "${BOLD}${CYAN}🔌 Installing VS Code Extension${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TEMP_VSIX=$(mktemp /tmp/code-guardrail.XXXXXX.vsix)

echo -e "${BLUE}→${NC} Downloading extension..."
if curl -L -o "$TEMP_VSIX" "$EXTENSION_URL" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Downloaded extension"
else
    echo -e "${RED}✗${NC} Failed to download from: $EXTENSION_URL"
    rm -f "$TEMP_VSIX"
    exit 1
fi

echo -e "${BLUE}→${NC} Installing in VS Code..."
if code --install-extension "$TEMP_VSIX" --force >/dev/null 2>&1; then
    rm -f "$TEMP_VSIX"
    echo -e "${GREEN}✓${NC} Extension installed"
else
    echo -e "${RED}✗${NC} Failed to install extension"
    rm -f "$TEMP_VSIX"
    exit 1
fi

# ============================================
# Start Service
# ============================================
echo ""
echo -e "${BOLD}${CYAN}🚀 Starting Service${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$INSTALL_DIR"

# Start service in background
echo -e "${BLUE}→${NC} Launching background service..."
nohup node dist/index.js > service.log 2> service-error.log &
SERVICE_PID=$!

sleep 3

# Check if service is running
if curl -s http://localhost:3000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Service started successfully (PID: ${BOLD}$SERVICE_PID${NC})"
else
    echo -e "${YELLOW}  ⚠  Service may not be running. Check logs:${NC}"
    echo -e "    ${CYAN}$INSTALL_DIR/service.log${NC}"
    echo -e "    ${CYAN}$INSTALL_DIR/service-error.log${NC}"
fi

# ============================================
# Success
# ============================================
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║              ✅  INSTALLATION COMPLETE! ✅                     ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}${CYAN}📍 Service Location${NC}"
echo -e "   $INSTALL_DIR"
echo ""
echo -e "${BOLD}${CYAN}🔧 Service Status${NC}"
echo -e "   ${GREEN}✓${NC} Running on ${BLUE}http://localhost:3000${NC}"
echo -e "   ${GREEN}✓${NC} Process ID: ${BOLD}$SERVICE_PID${NC}"
echo ""
echo -e "${BOLD}${YELLOW}🎯 Next Steps${NC}"
echo -e "   ${BOLD}1.${NC} Restart VS Code"
echo -e "   ${BOLD}2.${NC} Open any TypeScript/JavaScript file"
echo -e "   ${BOLD}3.${NC} Try adding:"
echo -e "      ${YELLOW}const password = \"admin123\";${NC}"
echo -e "      ${YELLOW}const apiKey = \"sk-1234567890\";${NC}"
echo -e "   ${BOLD}4.${NC} Save → See real-time analysis! ✨"
echo ""
echo -e "${BOLD}${CYAN}📚 Documentation${NC}"
echo -e "   ${BLUE}→${NC} ${CYAN}$REPO_URL${NC}"
echo ""
echo -e "${BOLD}${CYAN}🛠️  Manage Service${NC}"
echo -e "   ${BLUE}→${NC} Stop:  ${CYAN}kill $SERVICE_PID${NC}"
echo -e "   ${BLUE}→${NC} Start: ${CYAN}cd $INSTALL_DIR && node dist/index.js${NC}"
echo -e "   ${BLUE}→${NC} Logs:  ${CYAN}tail -f $INSTALL_DIR/service.log${NC}"
echo ""
