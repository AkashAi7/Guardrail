# Change Log

All notable changes to the "Code Guardrail" extension will be documented in this file.

## [0.1.0] - 2026-02-17

### 🎉 Initial Release - Hybrid Edition

#### ✨ Features
- **Real-time code analysis** with instant feedback as you type
- **Hybrid provider architecture**: Auto-detects GitHub Copilot OR uses BYOK (OpenAI/Anthropic/Azure)
- **Security vulnerability detection**: Hardcoded secrets, SQL injection, XSS, and more
- **Compliance checking**: Built-in rules for GDPR, HIPAA, PCI-DSS, SOC2
- **Smart diagnostics**: Error/Warning/Info squiggles directly in the editor
- **Quick fixes**: One-click code fixes with detailed explanations
- **Custom governance rules**: Define your own security and compliance policies
- **Workspace-wide analysis**: Scan entire projects in one command
- **Status bar integration**: See provider status and analysis results at a glance

#### 🤖 Supported LLM Providers
- GitHub Copilot (via @github/copilot-sdk) - $0 cost
- OpenAI (GPT-4o, GPT-4, GPT-3.5-turbo) - ~$0.03/1K tokens
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus) - ~$0.03/1K tokens
- Azure OpenAI (your own deployment) - your pricing

#### 📋 Built-in Rule Categories
- **Security**: Secrets, injection, XSS, crypto, auth
- **Compliance**: GDPR, HIPAA, PCI-DSS, SOC2
- **Best Practices**: Error handling, validation, code quality

#### 🎯 Commands
- `Guardrail: Analyze Current File` - Analyze the active file
- `Guardrail: Analyze Entire Workspace` - Scan all files in workspace
- `Guardrail: Clear Diagnostics` - Clear all issue markers
- `Guardrail: Start Local Service` - Start the backend service
- `Guardrail: Stop Local Service` - Stop the backend service
- `Guardrail: Reload Governance Rules` - Refresh rules without restart

#### ⚙️ Configuration Options
- `codeGuardrail.enabled` - Enable/disable the extension
- `codeGuardrail.serviceUrl` - Backend service URL (default: localhost:3000)
- `codeGuardrail.analyzeOnSave` - Auto-analyze when saving files
- `codeGuardrail.analyzeOnType` - Real-time analysis as you type
- `codeGuardrail.debounceMs` - Delay before analysis (default: 1000ms)
- `codeGuardrail.maxFileSize` - Skip large files (default: 1MB)

#### 🛠️ Technical Details
- Node.js backend service with Express REST API
- VS Code Extension API for diagnostics and code actions
- Hybrid provider detection with automatic fallback
- Support for TypeScript, JavaScript, Python, Java, and more

#### 📦 Installation
- Marketplace: Search "Code Guardrail" in VS Code Extensions
- Manual: Download from [GitHub Releases](https://github.com/AkashAi7/Guardrail/releases)
- Complete Setup: Use the one-click installer (includes backend service)

#### 🐛 Known Issues
- Backend service must be running on localhost:3000
- Some timeout issues with GitHub Copilot SDK (falls back to BYOK)
- Windows-only installer (macOS/Linux: manual installation)

#### 🔮 Coming Soon
- macOS/Linux installer
- Additional LLM providers (Gemini, Mistral)
- Team collaboration features
- Usage analytics dashboard
- GitHub Actions integration

---

## [Unreleased]

Future releases will be documented here.

---

**Feedback?** Report issues at [GitHub Issues](https://github.com/AkashAi7/Guardrail/issues)
