#!/bin/bash
# Code Guardrail - One-Click Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.sh | bash

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${BOLD}                                                               ${NC}${CYAN}║${NC}"
echo -e "${CYAN}║${BOLD}         🛡️  CODE GUARDRAIL - ONE-CLICK INSTALLER 🛡️          ${NC}${CYAN}║${NC}"
echo -e "${CYAN}║${BOLD}                                                               ${NC}${CYAN}║${NC}"
echo -e "${CYAN}║   Real-time Security & Compliance Analysis for VS Code       ║${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}→${NC} ${BOLD}Downloading installer...${NC}"

# Download and run the full installer from releases
INSTALLER_URL="https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install-from-release.sh"

if curl -fsSL "$INSTALLER_URL" | bash; then
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅  Installation completed successfully!                     ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌  Installation Failed                                      ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Please check:${NC}"
    echo -e "  ${BLUE}→${NC} Internet connection"
    echo -e "  ${BLUE}→${NC} GitHub accessibility"
    echo -e "  ${BLUE}→${NC} Or download manually: ${CYAN}https://github.com/AkashAi7/Guardrail/releases${NC}"
    echo ""
    exit 1
fi
