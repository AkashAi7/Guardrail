# Code Guardrail

AI-powered security & compliance scanner using GitHub Copilot SDK intelligence.

## Features
- **Real-time scanning**: Analyzes code on every save and open.
- **Auto Service Startup**: Requires zero manual installation. Installs Node dependencies and starts the backend service intelligently behind the scene.
- **Robust Backend**: Contains a self-healing process loop ensuring continuous protection.
- **Multi-Model Support**: Use `gpt-4`, `gpt-4o`, or `gpt-3.5-turbo` straight from settings.

## Getting Started
1. Install the Extension from VS Code Marketplace or VSIX.
2. When activated, it will configure and start automatically.
3. Select your preferred guardrail AI model through the commands menu.

## Configuration
- `codeGuardrail.scanMode`: Choose between `realtime`, `manual`, or `scheduled`.
- `codeGuardrail.model`: Select between `gpt-4`, `gpt-4o`, and `gpt-3.5-turbo`.

## Requirements
- Node.js installed in the environment.
