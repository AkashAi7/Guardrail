#!/bin/bash
# Code Guardrail - One-Click Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/AkashAi7/Guardrail/main/install.sh | bash

set -e

echo ""
echo "========================================"
echo "  🛡️  Code Guardrail Installer"
echo "========================================"
echo ""
echo "Downloading installer..."

# Download and run the full installer from releases
INSTALLER_URL="https://raw.githubusercontent.com/AkashAi7/Guardrail/main/scripts/install-from-release.sh"

if curl -fsSL "$INSTALLER_URL" | bash; then
    echo ""
    echo "✅ Installation completed successfully!"
else
    echo ""
    echo "❌ Failed to download installer"
    echo ""
    echo "Please check:"
    echo "  1. Internet connection"
    echo "  2. GitHub is accessible"
    echo "  3. Or download manually from: https://github.com/AkashAi7/Guardrail/releases"
    exit 1
fi
