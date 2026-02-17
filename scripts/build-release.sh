#!/bin/bash
# Code Guardrail - Release Build Script
# Creates distribution packages for GitHub Releases

set -e

VERSION="${1:-0.1.0}"
RELEASE_DIR="./release"
SERVICE_DIR="./service"
EXTENSION_DIR="./extension"
GOVERNANCE_DIR="./governance"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}========================================"
echo -e "  Code Guardrail Release Builder v$VERSION"
echo -e "========================================${NC}"
echo ""

# Clean previous release
if [ -d "$RELEASE_DIR" ]; then
    echo -e "${YELLOW}Cleaning previous release...${NC}"
    rm -rf "$RELEASE_DIR"
fi

mkdir -p "$RELEASE_DIR"
echo -e "${GREEN}✅ Created release directory${NC}"

# ============================================
# Build Service
# ============================================
echo ""
echo -e "${CYAN}📦 Building Service...${NC}"

cd "$SERVICE_DIR"

# Install dependencies
echo "  Installing dependencies..."
npm install --production >/dev/null 2>&1

# Build TypeScript
echo "  Compiling TypeScript..."
npm run build >/dev/null 2>&1

# Create service package directory
SERVICE_PACKAGE_DIR="../$RELEASE_DIR/guardrail-service"
mkdir -p "$SERVICE_PACKAGE_DIR"

# Copy necessary files
echo "  Packaging service files..."
cp -r dist "$SERVICE_PACKAGE_DIR/"
cp -r node_modules "$SERVICE_PACKAGE_DIR/"
cp package.json "$SERVICE_PACKAGE_DIR/"
cp .env.example "$SERVICE_PACKAGE_DIR/"
cp README.md "$SERVICE_PACKAGE_DIR/"

# Copy governance rules
cp -r "../$GOVERNANCE_DIR" "$SERVICE_PACKAGE_DIR/"

# Create startup script (Unix)
cat > "$SERVICE_PACKAGE_DIR/start.sh" << 'EOF'
#!/bin/bash
echo "Starting Code Guardrail Service..."
node dist/index.js
EOF
chmod +x "$SERVICE_PACKAGE_DIR/start.sh"

# Create install script
cat > "$SERVICE_PACKAGE_DIR/install.sh" << 'EOF'
#!/bin/bash
echo "Code Guardrail Service Setup"
echo "============================"
echo ""

# Copy .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env configuration file"
else
    echo "✓ .env already exists"
fi

echo ""
echo "Setup complete! Start the service with:"
echo "  ./start.sh"
echo ""
EOF
chmod +x "$SERVICE_PACKAGE_DIR/install.sh"

echo -e "${GREEN}✅ Service packaged${NC}"

cd ..

# ============================================
# Build Extension
# ============================================
echo ""
echo -e "${CYAN}📦 Building Extension...${NC}"

cd "$EXTENSION_DIR"

# Install dependencies
echo "  Installing dependencies..."
npm install >/dev/null 2>&1

# Compile TypeScript
echo "  Compiling TypeScript..."
npm run compile >/dev/null 2>&1

# Package extension
echo "  Packaging extension..."
npx @vscode/vsce package --no-dependencies >/dev/null 2>&1

# Copy VSIX to release directory
VSIX_FILE=$(ls code-guardrail-*.vsix | head -n 1)
cp "$VSIX_FILE" "../$RELEASE_DIR/"

echo -e "${GREEN}✅ Extension packaged: $VSIX_FILE${NC}"

cd ..

# ============================================
# Create ZIP Archives
# ============================================
echo ""
echo -e "${CYAN}📦 Creating ZIP archives...${NC}"

# Service ZIP
echo "  Creating guardrail-service-v$VERSION.zip..."
cd "$RELEASE_DIR"
zip -q -r "guardrail-service-v$VERSION.zip" guardrail-service/

# Get file sizes
SERVICE_ZIP_SIZE=$(du -h "guardrail-service-v$VERSION.zip" | cut -f1)
EXTENSION_SIZE=$(du -h "code-guardrail-0.1.0.vsix" | cut -f1)

echo -e "${GREEN}✅ Archives created${NC}"

cd ..

# ============================================
# Create Release Notes
# ============================================
echo ""
echo -e "${CYAN}📝 Generating release notes...${NC}"

SERVICE_SHA256=$(shasum -a 256 "$RELEASE_DIR/guardrail-service-v$VERSION.zip" | cut -d' ' -f1)
EXTENSION_SHA256=$(shasum -a 256 "$RELEASE_DIR/code-guardrail-0.1.0.vsix" | cut -d' ' -f1)

cat > "$RELEASE_DIR/RELEASE_NOTES.md" << EOF
# Code Guardrail v$VERSION

**Real-time Intelligent Code Analysis powered by GitHub Copilot SDK**

---

## 🚀 Installation

### Quick Install (Recommended)

**Windows:**
\`\`\`powershell
iwr -useb https://github.com/AkashAi7/Guardrail/releases/download/v$VERSION/install.ps1 | iex
\`\`\`

**macOS/Linux:**
\`\`\`bash
curl -fsSL https://github.com/AkashAi7/Guardrail/releases/download/v$VERSION/install.sh | bash
\`\`\`

### Manual Install

1. **Download Service:** \`guardrail-service-v$VERSION.zip\` ($SERVICE_ZIP_SIZE)
2. **Download Extension:** \`code-guardrail-0.1.0.vsix\` ($EXTENSION_SIZE)

**Setup:**
\`\`\`bash
# Extract service
unzip guardrail-service-v$VERSION.zip -d ~/.guardrail

# Install extension
code --install-extension code-guardrail-0.1.0.vsix

# Start service
cd ~/.guardrail/guardrail-service
./start.sh
\`\`\`

---

## ✨ Features

- ✅ **Real-time Security Analysis** - Catch vulnerabilities as you code
- ✅ **Compliance Checking** - GDPR, HIPAA, SOC2, PCI-DSS
- ✅ **Best Practices Enforcement** - Framework conventions, code quality
- ✅ **Hybrid Mode** - Works with GitHub Copilot OR your own API keys
- ✅ **Zero Configuration** - Auto-detects and configures automatically

---

## 📋 What's Included

### Service Package (\`guardrail-service-v$VERSION.zip\`)
- Pre-built backend service
- All dependencies included
- Governance rules library
- Configuration templates
- Startup scripts

### VS Code Extension (\`code-guardrail-0.1.0.vsix\`)
- VS Code extension
- One-click installation
- Real-time diagnostics
- Quick fixes
- Status bar integration

---

## 🎯 Quick Start

1. **Install** using one-line command above
2. **Start Service**: The installer will start it automatically
3. **Test**: Open any TypeScript/JavaScript file, add:
   \`\`\`typescript
   const password = "admin123";
   const apiKey = "sk-1234567890";
   \`\`\`
4. **Save** → See red squiggles appear! ✨

---

## 📚 Documentation

- [Installation Guide](https://github.com/AkashAi7/Guardrail/blob/main/INSTALL.md)
- [Quick Start](https://github.com/AkashAi7/Guardrail#quick-start-5-minutes)
- [Configuration](https://github.com/AkashAi7/Guardrail/blob/main/service/.env.example)
- [Governance Rules](https://github.com/AkashAi7/Guardrail/tree/main/governance)

---

## 🔧 Requirements

- **Node.js** 18 or higher
- **VS Code** 1.80 or higher
- **Operating System:** Windows 10+, macOS 10.15+, or Linux

**Optional:**
- GitHub Copilot (for free LLM) OR
- OpenAI API Key / Anthropic API Key (for BYOK mode)

---

## 🐛 Issues & Feedback

- [Report Issues](https://github.com/AkashAi7/Guardrail/issues)
- [Discussions](https://github.com/AkashAi7/Guardrail/discussions)

---

## 📊 Checksums

**SHA256:**
\`\`\`
guardrail-service-v$VERSION.zip:
$SERVICE_SHA256

code-guardrail-0.1.0.vsix:
$EXTENSION_SHA256
\`\`\`

---

**Full Changelog:** [CHANGELOG.md](https://github.com/AkashAi7/Guardrail/blob/main/CHANGELOG.md)
EOF

echo -e "${GREEN}✅ Release notes generated${NC}"

# ============================================
# Summary
# ============================================
echo ""
echo -e "${GREEN}========================================"
echo -e "  ✅ Release Build Complete!"
echo -e "========================================${NC}"
echo ""
echo -e "${CYAN}Release artifacts created in: $RELEASE_DIR${NC}"
echo ""
echo -e "${YELLOW}📦 Files:${NC}"
echo "  • guardrail-service-v$VERSION.zip ($SERVICE_ZIP_SIZE)"
echo "  • code-guardrail-0.1.0.vsix ($EXTENSION_SIZE)"
echo "  • RELEASE_NOTES.md"
echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo "  1. Create GitHub release: https://github.com/AkashAi7/Guardrail/releases/new"
echo "  2. Tag: v$VERSION"
echo "  3. Upload: release/guardrail-service-v$VERSION.zip"
echo "  4. Upload: release/code-guardrail-0.1.0.vsix"
echo "  5. Copy: release/RELEASE_NOTES.md → Release description"
echo "  6. Publish release"
echo ""
echo -e "${CYAN}Or use GitHub CLI: gh release create v$VERSION \\${NC}"
echo -e "${CYAN}  --notes-file release/RELEASE_NOTES.md \\${NC}"
echo -e "${CYAN}  release/guardrail-service-v$VERSION.zip \\${NC}"
echo -e "${CYAN}  release/code-guardrail-0.1.0.vsix${NC}"
echo ""
