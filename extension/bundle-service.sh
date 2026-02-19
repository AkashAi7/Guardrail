#!/bin/bash
# Script to bundle service with extension for standalone distribution
# This allows the extension to work without cloning the repo

echo "📦 Bundling service with extension..."

EXTENSION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_SOURCE_DIR="$(dirname "$EXTENSION_DIR")/service"
BUNDLED_SERVICE_DIR="$EXTENSION_DIR/bundled-service"

# Check if service exists and is built
SERVICE_DIST_DIR="$SERVICE_SOURCE_DIR/dist"
if [ ! -d "$SERVICE_DIST_DIR" ]; then
    echo "❌ Service not built. Please run:"
    echo "   cd ../service"
    echo "   npm install"
    echo "   npm run build"
    exit 1
fi

# Clean and create bundled service directory
if [ -d "$BUNDLED_SERVICE_DIR" ]; then
    rm -rf "$BUNDLED_SERVICE_DIR"
fi
mkdir -p "$BUNDLED_SERVICE_DIR"

echo "  Copying service files..."

# Copy essential files
cp -r "$SERVICE_SOURCE_DIR/dist" "$BUNDLED_SERVICE_DIR/dist"
cp "$SERVICE_SOURCE_DIR/package.json" "$BUNDLED_SERVICE_DIR/package.json"

# Copy governance rules (relative path from service)
GOVERNANCE_SOURCE="$(dirname "$SERVICE_SOURCE_DIR")/governance"
if [ -d "$GOVERNANCE_SOURCE" ]; then
    cp -r "$GOVERNANCE_SOURCE" "$BUNDLED_SERVICE_DIR/governance"
    echo "  ✅ Copied governance rules"
fi

echo "✅ Service bundled successfully!"
echo "   Location: $BUNDLED_SERVICE_DIR"
echo ""
echo "Now you can package the extension with:"
echo "   npx @vscode/vsce package"
