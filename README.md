# Code Guardrail

AI-powered security & compliance scanner using GitHub Copilot SDK intelligence.

## Features
- **Real-time scanning**: Analyzes code on every save and open.
- **Auto Service Startup**: Requires zero manual installation. Installs Node dependencies and starts the backend service intelligently behind the scene.
- **Robust Backend**: Contains a self-healing process loop ensuring continuous protection.
- **Multi-Model Support**: Use `gpt-4`, `gpt-4o`, or `gpt-3.5-turbo` straight from settings.

## Local Setup (Beginner Guide)

Since this extension is not yet published to the VS Code Marketplace, follow these exact steps to build and install it locally from your machine:

### Prerequisites
1. **Node.js**: Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).
2. **Git**: Ensure [Git](https://git-scm.com/) is installed.

### Step 1: Clone the Repository
Open a terminal (like PowerShell or Command Prompt, **not** as Administrator) and run:
```bash
git clone https://github.com/AkashAi7/Guardrail.git
cd Guardrail
```

### Step 2: Build the Extension File (.vsix)
Next, navigate into the `extension` folder to install dependencies and package the extension:
```bash
cd extension
npm install
npm run package
```
*This will generate a file named roughly `code-guardrail-0.8.0.vsix` inside your `extension` folder.*

### Step 3: Install the Extension in VS Code
You can install this `.vsix` file directly inside VS Code:
1. Open **Visual Studio Code**.
2. Go to the **Extensions** view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3. Click the **`...` (Views and More Actions)** menu icon at the top right of the Extensions panel.
4. Select **"Install from VSIX..."** from the dropdown menu.
5. In the file explorer, navigate to the `Guardrail/extension` folder where you just generated the file, select your `.vsix` file, and click **Install**.

Alternatively, via command line (make sure you are still inside the `extension` folder where the VSIX was generated):
```bash
code --install-extension code-guardrail-0.8.0.vsix
```

### Step 4: Run Configuration
1. Once installed, the extension will activate in the background.
2. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and type **Code Guardrail: Show Menu**.
3. Select your preferred guardrail AI model (`gpt-4`, `gpt-4o`, `gpt-3.5-turbo`).

## Configuration
- `codeGuardrail.scanMode`: Choose between `realtime`, `manual`, or `scheduled`.
- `codeGuardrail.model`: Select between `gpt-4`, `gpt-4o`, and `gpt-3.5-turbo`.
