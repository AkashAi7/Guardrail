#!/bin/bash
# Script to bundle service with extension for standalone distribution
# This allows the extension to work without cloning the repo

set -euo pipefail

echo "📦 Bundling service with extension..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/scripts/prepare-bundle.js"

echo "✅ Service bundled successfully!"
echo ""
echo "Now you can package the extension with:"
echo "   npm run package"
