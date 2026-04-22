# Change Log

All notable changes to the "Code Guardrail" extension will be documented in this file.

## [0.8.4] - 2026-04-22

### Fixed
- Prefer the bundled backend shipped inside the installed VSIX over a stale extracted copy in `~/.guardrail-service`, so extension updates actually run the current service code.
- Prevent installed users from getting stuck on an older backend after upgrading the extension, which could otherwise surface as repeated analysis timeouts.

## [0.8.3] - 2026-04-20

### Fixed
- Eliminate project scan request timeouts caused by large files spawning many serial AI calls.

### Improved
- Analyze chunks of a large file in parallel (bounded) instead of one-by-one, so big files no longer stall scans.
- Larger analysis chunks (200 lines with 10-line overlap) cut the number of AI calls per file by roughly 3x.
- In-memory result cache keyed by file content, so re-scanning unchanged files is instant.
- Skip empty and trivially small files instead of sending them to the model.

## [0.8.2] - 2026-04-20

### Fixed
- Handle `EADDRINUSE` startup conflicts by reconnecting to an existing healthy Guardrail service when possible and showing a precise port-conflict message otherwise.
- Replace the stale Node.js warning so startup errors now report the real Node.js 24+ requirement and detected version.

### Improved
- Speed up workspace scans by excluding generated output folders such as `out`, `dist`, `build`, and `bundled-service`.
- Batch project scan requests through `/analyze-batch` instead of sending one serial AI request per file.

## [0.8.1] - 2026-04-20

### Fixed
- Ship the backend service and its production dependencies inside the VSIX so users do not need to run a terminal setup step.
- Validate the local Node.js runtime before starting the packaged backend to make startup failures clearer.
- Resolve governance rules correctly from the packaged bundle so the release uses the real bundled policies.

### Added
- Activity bar entry and Guardrail control center for running scans, configuring providers, and managing rules without leaving VS Code.
- Clearer Copilot-first model selection with optional Microsoft Foundry, OpenAI, and Anthropic provider configuration.

---

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
