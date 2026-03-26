# Code Guardrail

AI-powered security & compliance scanner using GitHub Copilot SDK intelligence.

## Features
- **Real-time scanning**: Analyzes code on every save and open.
- **Auto Service Startup**: Requires zero manual installation. Installs Node dependencies and starts the backend service intelligently behind the scene.
- **Robust Backend**: Contains a self-healing process loop ensuring continuous protection.
- **Multi-Model Support**: Use `gpt-4`, `gpt-4o`, or `gpt-3.5-turbo` straight from settings.

## 🛠️ Setup for Beginners 

If you are running into "ENOENT" or "file not found" errors, follow these exact steps.
**⚠️ IMPORTANT:** DO NOT open your terminal as Administrator and DO NOT run this inside `C:\Windows\System32`. 

### Step 1: Open a safe folder
Open a standard terminal (PowerShell or Command Prompt) and move to your Desktop:
```bash
cd ~/Desktop
```

### Step 2: Clone & Build the Extension
Copy and paste these commands one by one to download the code and build the installation file:
```bash
git clone https://github.com/AkashAi7/Guardrail.git
cd Guardrail/extension
npm install
npm run package
```
*(When it finishes, it will generate a file named `code-guardrail-0.8.0.vsix` inside your `extension` folder.)*

### Step 3: Install via VS Code (Visual Method - Error Free!)
Installing through the terminal can cause pathing errors. Use the VS Code interface instead:
1. Open **Visual Studio Code**.
2. Press **`Ctrl+Shift+X`** (or **`Cmd+Shift+X`** on Mac) to open your **Extensions** sidebar.
3. At the top right of the Extensions sidebar, click the **`...`** (Views and More Actions) menu icon.
4. Click **"Install from VSIX..."** in the dropdown.
5. A file explorer window will open. Navigate to your Desktop -> `Guardrail` -> `extension` folder.
6. Select the **`code-guardrail-0.8.0.vsix`** file and click **Install**.

### Step 4: Run Configuration
1. Once installed, the extension will activate in the background.
2. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and type **Code Guardrail: Show Menu**.
3. Select your preferred guardrail AI model (`gpt-4`, `gpt-4o`, `gpt-3.5-turbo`).

## Configuration
- `codeGuardrail.scanMode`: Choose between `realtime`, `manual`, or `scheduled`.
- `codeGuardrail.model`: Select between `gpt-4`, `gpt-4o`, and `gpt-3.5-turbo`.
