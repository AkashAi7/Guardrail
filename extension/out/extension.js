"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const scanner_1 = require("./scanner");
const ruleParser_1 = require("./ruleParser");
const fileImporter_1 = require("./fileImporter");
const serviceManager_1 = require("./serviceManager");
const activityBar_1 = require("./activityBar");
let diagnosticCollection;
let scanner;
let statusBarItem;
let serviceManager = null;
let scheduledScanTimer = null;
let sidebarProvider = null;
const CONFIG_FILE_NAME = '.guardrail.json';
const RULES_FOLDER_NAME = '.guardrail';
const RULES_MD_FILE = 'guardrail-rules.md';
function getConfig() {
    const cfg = vscode.workspace.getConfiguration('codeGuardrail');
    return {
        scanMode: cfg.get('scanMode', 'manual'),
        analyzeOnSave: cfg.get('analyzeOnSave', false),
        analyzeOnOpen: cfg.get('analyzeOnOpen', false),
        scheduledIntervalMinutes: cfg.get('scheduledIntervalMinutes', 15),
    };
}
function getIssueCounts() {
    let totalIssues = 0;
    let criticalIssues = 0;
    vscode.workspace.textDocuments.forEach(doc => {
        const diagnostics = diagnosticCollection.get(doc.uri) || [];
        totalIssues += diagnostics.length;
        criticalIssues += diagnostics.filter(diag => diag.severity === vscode.DiagnosticSeverity.Error).length;
    });
    return { totalIssues, criticalIssues };
}
function refreshSidebar() {
    sidebarProvider?.refresh();
}
async function attemptServiceStart(showPromptOnFailure = true) {
    if (!serviceManager) {
        return false;
    }
    const started = await serviceManager.start();
    if (!started && showPromptOnFailure) {
        const startupError = serviceManager.getLastStartupError();
        const selection = await vscode.window.showWarningMessage(startupError
            ? `Guardrail AI service is still unavailable: ${startupError}`
            : 'Guardrail AI service is still unavailable.', 'Configure AI Provider');
        if (selection === 'Configure AI Provider') {
            await vscode.commands.executeCommand('codeGuardrail.configureAiProvider');
        }
    }
    return started;
}
async function restartServiceWithPrompt() {
    if (!serviceManager) {
        return false;
    }
    await serviceManager.stop();
    return attemptServiceStart(true);
}
function activate(context) {
    console.log('Code Guardrail activating...');
    // Initialize components
    diagnosticCollection = vscode.languages.createDiagnosticCollection('code-guardrail');
    scanner = new scanner_1.SecurityScanner();
    sidebarProvider = new activityBar_1.GuardrailSidebarProvider(context.extensionUri, () => {
        const currentModel = vscode.workspace.getConfiguration('codeGuardrail').get('model', 'gpt-4.1');
        const { totalIssues, criticalIssues } = getIssueCounts();
        return {
            serviceStatus: serviceManager?.isRunning() ? 'Running' : 'Stopped',
            providerLabel: serviceManager?.getProviderDisplayLabel() || 'GitHub Copilot (auto)',
            scanMode: getConfig().scanMode,
            model: currentModel,
            totalIssues,
            criticalIssues
        };
    });
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(activityBar_1.GuardrailSidebarProvider.viewType, sidebarProvider));
    // Initialize and start the backend service
    serviceManager = new serviceManager_1.ServiceManager(context);
    serviceManager.start().then(started => {
        if (started) {
            console.log('✅ Guardrail AI service is running');
        }
        else {
            console.log('⚠️ Using local pattern matching only');
            const startupError = serviceManager?.getLastStartupError();
            const message = startupError
                ? `Guardrail AI service could not start: ${startupError}`
                : 'Guardrail AI service could not start automatically.';
            vscode.window.showWarningMessage(message, 'Configure AI Provider', 'Retry Start').then(async (selection) => {
                if (selection === 'Configure AI Provider' && serviceManager) {
                    await serviceManager.configureProvider();
                }
                else if (selection === 'Retry Start' && serviceManager) {
                    await attemptServiceStart(true);
                }
            });
        }
        refreshSidebar();
    }).catch(error => {
        console.error('Failed to start service:', error);
        refreshSidebar();
    });
    // Load custom rules from workspace
    loadCustomRules();
    // Create status bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'codeGuardrail.showQuickPick';
    statusBarItem.show();
    updateStatusBarForMode();
    refreshSidebar();
    // Register commands
    const analyzeCmd = vscode.commands.registerCommand('codeGuardrail.analyzeFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            analyzeDocument(editor.document);
        }
        else {
            vscode.window.showWarningMessage('No active file to analyze');
        }
    });
    // Scan entire project command
    const scanProjectCmd = vscode.commands.registerCommand('codeGuardrail.scanProject', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('No workspace folder open');
            return;
        }
        // Check if AI service is running
        if (!serviceManager || !serviceManager.isRunning()) {
            vscode.window.showErrorMessage('AI Service not running. Cannot scan project without AI service.', 'Configure AI Provider', 'Start Service').then(async (selection) => {
                if (selection === 'Configure AI Provider' && serviceManager) {
                    await serviceManager.configureProvider();
                }
                else if (selection === 'Start Service' && serviceManager) {
                    await attemptServiceStart(true);
                }
            });
            return;
        }
        const activeServiceManager = serviceManager;
        // Get all files in workspace
        const files = await vscode.workspace.findFiles('**/*.{ts,tsx,js,jsx,py,java,cs,go,rb,php}', '**/{node_modules,dist,out,build,.git,coverage,.next,bundled-service}/**');
        if (files.length === 0) {
            vscode.window.showInformationMessage('No code files found in workspace');
            return;
        }
        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Scanning project with AI...',
            cancellable: true
        }, async (progress, token) => {
            let analyzed = 0;
            let totalIssues = 0;
            const batchSize = 8;
            for (let batchStart = 0; batchStart < files.length; batchStart += batchSize) {
                if (token.isCancellationRequested) {
                    break;
                }
                const fileBatch = files.slice(batchStart, batchStart + batchSize);
                progress.report({
                    message: `${analyzed}/${files.length} files (${totalIssues} issues found)`,
                    increment: (fileBatch.length / files.length) * 100
                });
                try {
                    const documents = await Promise.all(fileBatch.map(fileUri => vscode.workspace.openTextDocument(fileUri)));
                    const response = await activeServiceManager.makeRequest('/analyze-batch', {
                        method: 'POST',
                        body: {
                            files: documents.map(document => ({
                                content: document.getText(),
                                filePath: document.fileName,
                                language: document.languageId
                            }))
                        },
                        timeout: Math.max(180000, documents.length * 45000)
                    });
                    if (response.success && Array.isArray(response.results)) {
                        for (let index = 0; index < documents.length; index++) {
                            const document = documents[index];
                            const result = response.results[index];
                            const findings = mapBackendFindings(document.getText(), result?.findings || []);
                            applyFindingsToDocument(document, findings);
                            totalIssues += findings.length;
                        }
                    }
                }
                catch (error) {
                    console.error(`Failed to analyze file batch starting at ${batchStart}:`, error);
                }
                analyzed += fileBatch.length;
            }
            progress.report({ message: `Complete: ${analyzed} files, ${totalIssues} issues` });
            // Show summary
            vscode.window.showInformationMessage(`\ud83e\udd16 Project scan complete! Analyzed ${analyzed} files, found ${totalIssues} issues.`, 'View Issues').then(selection => {
                if (selection === 'View Issues') {
                    vscode.commands.executeCommand('workbench.actions.view.problems');
                }
            });
        });
    });
    const clearCmd = vscode.commands.registerCommand('codeGuardrail.clearDiagnostics', () => {
        diagnosticCollection.clear();
        updateStatusBarForMode();
        refreshSidebar();
        vscode.window.showInformationMessage('Cleared all Code Guardrail issues');
    });
    const showQuickPickCmd = vscode.commands.registerCommand('codeGuardrail.showQuickPick', async () => {
        const items = [
            {
                label: '$(list-unordered) View Issues Panel',
                description: 'Show all detected issues with quick fixes',
                action: 'show-issues'
            },
            {
                label: '$(play) Test with Sample Code',
                description: 'Create a test file with intentional security issues',
                action: 'test'
            },
            {
                label: '$(file-code) Analyze Current File',
                description: 'Scan the active file for security issues',
                action: 'analyze'
            },
            {
                label: '$(folder) Scan Entire Project',
                description: 'Analyze all files in workspace with AI',
                action: 'scan-project'
            },
            {
                label: '$(book) Manage Rules',
                description: 'Create, import, or organize rules',
                action: 'manage'
            },
            {
                label: '$(add) Create Custom Rule',
                description: 'Interactively create a new security rule',
                action: 'create-rule'
            },
            {
                label: '$(cloud-upload) Upload Rule File',
                description: 'Upload .md, .txt, .pdf, or .docx rule files',
                action: 'upload-rule'
            },
            {
                label: '$(cloud-download) Import from URL',
                description: 'Download rules from organization repository',
                action: 'import-url'
            },
            {
                label: '$(refresh) Reload Rules',
                description: 'Reload custom rules from workspace',
                action: 'reload'
            },
            {
                label: '$(clear-all) Clear All Issues',
                description: 'Remove all diagnostics from the Problems panel',
                action: 'clear'
            },
            {
                label: '$(settings-gear) Toggle Scan Mode',
                description: `Current: ${getConfig().scanMode}`,
                action: 'toggle-mode'
            },
            {
                label: '$(settings) Choose Model',
                description: 'Select the model for AI analysis',
                action: 'choose-model'
            },
            {
                label: '$(key) Configure AI Provider',
                description: 'Set up Copilot or BYOK credentials for AI analysis',
                action: 'configure-provider'
            },
            {
                label: '$(play-circle) Start AI Service',
                description: 'Try to start the Guardrail background service now',
                action: 'start-service'
            },
            {
                label: '$(debug-restart) Restart AI Service',
                description: 'Restart the Guardrail background service',
                action: 'restart-service'
            },
            {
                label: '$(info) About Code Guardrail',
                description: 'View extension information',
                action: 'about'
            }
        ];
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Code Guardrail - Choose an action'
        });
        if (selected) {
            switch (selected.action) {
                case 'show-issues':
                    vscode.commands.executeCommand('codeGuardrail.showIssuesPanel');
                    break;
                case 'test':
                    createSampleTestFile();
                    break;
                case 'analyze':
                    vscode.commands.executeCommand('codeGuardrail.analyzeFile');
                    break;
                case 'scan-project':
                    vscode.commands.executeCommand('codeGuardrail.scanProject');
                    break;
                case 'manage':
                    vscode.commands.executeCommand('codeGuardrail.manageRules');
                    break;
                case 'create-rule':
                    vscode.commands.executeCommand('codeGuardrail.createCustomRule');
                    break;
                case 'upload-rule':
                    vscode.commands.executeCommand('codeGuardrail.uploadRuleFile');
                    break;
                case 'import-url':
                    vscode.commands.executeCommand('codeGuardrail.importRulesFromUrl');
                    break;
                case 'reload':
                    vscode.commands.executeCommand('codeGuardrail.reloadRules');
                    break;
                case 'clear':
                    vscode.commands.executeCommand('codeGuardrail.clearDiagnostics');
                    break;
                case 'toggle-mode':
                    vscode.commands.executeCommand('codeGuardrail.toggleScanMode');
                    break;
                case 'choose-model':
                    vscode.commands.executeCommand('codeGuardrail.chooseModel');
                    break;
                case 'configure-provider':
                    vscode.commands.executeCommand('codeGuardrail.configureAiProvider');
                    break;
                case 'start-service':
                    vscode.commands.executeCommand('codeGuardrail.startService');
                    break;
                case 'restart-service':
                    vscode.commands.executeCommand('codeGuardrail.restartService');
                    break;
                case 'about':
                    const builtInCount = scanner.getBuiltInRuleIds().length;
                    const categories = scanner.getCategories();
                    const aiStatus = serviceManager && serviceManager.isRunning()
                        ? '🤖 AI-powered analysis: Active'
                        : '📝 Pattern matching: Active (AI unavailable)';
                    vscode.window.showInformationMessage(`Code Guardrail v${context.extension.packageJSON.version}\n\n` +
                        `✅ ${builtInCount} built-in security rules\n` +
                        `📂 Categories: ${categories.join(', ')}\n` +
                        `${aiStatus}\n\n` +
                        `Hybrid intelligence: AI analysis with local fallback`, 'OK');
                    break;
            }
        }
    });
    const reloadCmd = vscode.commands.registerCommand('codeGuardrail.reloadRules', () => {
        loadCustomRules();
        // Re-analyze all open files
        vscode.workspace.textDocuments.forEach(doc => {
            if (shouldAnalyze(doc)) {
                analyzeDocument(doc);
            }
        });
        refreshSidebar();
        vscode.window.showInformationMessage('Code Guardrail rules reloaded');
    });
    const initCmd = vscode.commands.registerCommand('codeGuardrail.initConfig', () => {
        createDefaultConfig();
    });
    // Import rules from URL (for organization repositories)
    const importUrlCmd = vscode.commands.registerCommand('codeGuardrail.importRulesFromUrl', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showWarningMessage('Open a workspace folder first');
            return;
        }
        const url = await vscode.window.showInputBox({
            prompt: 'Enter URL to rules file (MD, JSON, or GitHub raw URL)',
            placeHolder: 'https://raw.githubusercontent.com/yourorg/rules/main/security-rules.md',
            validateInput: (value) => {
                if (!value)
                    return 'URL is required';
                try {
                    new URL(value);
                    return null;
                }
                catch {
                    return 'Invalid URL format';
                }
            }
        });
        if (!url)
            return;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Downloading rules from URL...',
            cancellable: false
        }, async () => {
            try {
                const https = require('https');
                const http = require('http');
                const protocol = url.startsWith('https') ? https : http;
                return new Promise((resolve, reject) => {
                    protocol.get(url, (res) => {
                        let data = '';
                        res.on('data', (chunk) => { data += chunk; });
                        res.on('end', () => {
                            // Save to .guardrail/ folder
                            const rulesDir = path.join(workspaceFolders[0].uri.fsPath, RULES_FOLDER_NAME);
                            if (!fs.existsSync(rulesDir)) {
                                fs.mkdirSync(rulesDir, { recursive: true });
                            }
                            const fileName = path.basename(new URL(url).pathname);
                            const outputPath = path.join(rulesDir, fileName);
                            fs.writeFileSync(outputPath, data);
                            loadCustomRules();
                            vscode.window.showInformationMessage(`Imported rules from ${fileName}`);
                            // Open the file
                            vscode.workspace.openTextDocument(outputPath).then(doc => {
                                vscode.window.showTextDocument(doc);
                            });
                            resolve(null);
                        });
                    }).on('error', (err) => {
                        vscode.window.showErrorMessage(`Failed to download: ${err.message}`);
                        reject(err);
                    });
                });
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to import from URL: ${error.message}`);
            }
        });
    });
    // Create new custom rule interactively
    const createRuleCmd = vscode.commands.registerCommand('codeGuardrail.createCustomRule', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showWarningMessage('Open a workspace folder first');
            return;
        }
        // Gather rule details through prompts
        const ruleName = await vscode.window.showInputBox({
            prompt: 'Enter rule name',
            placeHolder: 'Detect Hardcoded Credentials'
        });
        if (!ruleName)
            return;
        const severity = await vscode.window.showQuickPick(['HIGH', 'MEDIUM', 'LOW', 'INFO'], {
            placeHolder: 'Select severity level'
        });
        if (!severity)
            return;
        const category = await vscode.window.showQuickPick([
            'security', 'compliance', 'best-practices', 'performance', 'custom'
        ], {
            placeHolder: 'Select rule category'
        });
        if (!category)
            return;
        const pattern = await vscode.window.showInputBox({
            prompt: 'Enter regex pattern to detect',
            placeHolder: '(api[_-]?key|token)\\s*[:=]\\s*["\'][^"\']+["\']',
            validateInput: (value) => {
                if (!value)
                    return 'Pattern is required';
                try {
                    new RegExp(value, 'gi');
                    return null;
                }
                catch {
                    return 'Invalid regex pattern';
                }
            }
        });
        if (!pattern)
            return;
        const message = await vscode.window.showInputBox({
            prompt: 'Enter warning message',
            placeHolder: 'Hardcoded credentials detected. Use environment variables.',
            value: `${ruleName} - please review this code`
        });
        if (!message)
            return;
        // Create rule in markdown format
        const ruleId = ruleName.replace(/\s+/g, '-').toUpperCase();
        const ruleContent = `## ${ruleName}
- Severity: ${severity}
- Pattern: \`${pattern}\`
- Message: ${message}
- Category: ${category}

### Description
${ruleName} detected in code.

### Examples

#### ❌ Bad
\`\`\`typescript
// Add example of bad code here
\`\`\`

#### ✅ Good
\`\`\`typescript
// Add example of good code here
\`\`\`
`;
        // Save to .guardrail/ folder
        const rulesDir = path.join(workspaceFolders[0].uri.fsPath, RULES_FOLDER_NAME);
        if (!fs.existsSync(rulesDir)) {
            fs.mkdirSync(rulesDir, { recursive: true });
        }
        const fileName = `custom-${ruleId.toLowerCase()}.md`;
        const filePath = path.join(rulesDir, fileName);
        fs.writeFileSync(filePath, ruleContent);
        loadCustomRules();
        vscode.window.showInformationMessage(`Created custom rule: ${fileName}`);
        // Open the file for editing
        const doc = await vscode.workspace.openTextDocument(filePath);
        vscode.window.showTextDocument(doc);
    });
    // Setup organization rules structure
    const setupOrgCmd = vscode.commands.registerCommand('codeGuardrail.setupOrgRules', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showWarningMessage('Open a workspace folder first');
            return;
        }
        const choice = await vscode.window.showQuickPick([
            {
                label: '$(cloud-download) Clone from Organization Repository',
                description: 'Import rules from a Git repository',
                action: 'clone'
            },
            {
                label: '$(file-directory) Create Local Rules Structure',
                description: 'Set up .guardrail/ folder with examples',
                action: 'create'
            },
            {
                label: '$(link) Import from URL',
                description: 'Download rules from a URL',
                action: 'url'
            }
        ], {
            placeHolder: 'How would you like to set up organization rules?'
        });
        if (!choice)
            return;
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const rulesDir = path.join(workspaceRoot, RULES_FOLDER_NAME);
        switch (choice.action) {
            case 'clone':
                const repoUrl = await vscode.window.showInputBox({
                    prompt: 'Enter Git repository URL',
                    placeHolder: 'https://github.com/yourorg/guardrail-rules.git'
                });
                if (!repoUrl)
                    return;
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Cloning organization rules repository...',
                    cancellable: false
                }, async () => {
                    try {
                        const { exec } = require('child_process');
                        await new Promise((resolve, reject) => {
                            exec(`git clone ${repoUrl} "${rulesDir}"`, (error, stdout, stderr) => {
                                if (error)
                                    reject(error);
                                else
                                    resolve(stdout);
                            });
                        });
                        loadCustomRules();
                        vscode.window.showInformationMessage('✅ Organization rules cloned successfully!');
                    }
                    catch (error) {
                        vscode.window.showErrorMessage(`Failed to clone: ${error.message}`);
                    }
                });
                break;
            case 'create':
                // Create directory structure
                if (!fs.existsSync(rulesDir)) {
                    fs.mkdirSync(rulesDir, { recursive: true });
                }
                const subDirs = ['security', 'compliance', 'best-practices'];
                subDirs.forEach(dir => {
                    const dirPath = path.join(rulesDir, dir);
                    if (!fs.existsSync(dirPath)) {
                        fs.mkdirSync(dirPath, { recursive: true });
                    }
                });
                // Create README
                const readme = `# Organization Guardrail Rules

This folder contains custom security and compliance rules for your organization.

## Structure

- \`security/\` - Security-related rules
- \`compliance/\` - Compliance rules (GDPR, HIPAA, etc.)
- \`best-practices/\` - Code quality and best practices

## Adding Rules

Create markdown files in the appropriate folder. See example rules below.
`;
                fs.writeFileSync(path.join(rulesDir, 'README.md'), readme);
                // Create sample rule
                const sampleRule = `## Company API Key Detection
- Severity: HIGH
- Pattern: \`company_api_[A-Za-z0-9]{32}\`
- Message: Company API keys must not be hardcoded. Use environment variables.
- Category: security

### Description
Detects hardcoded company API keys in source code.

### Examples

#### ❌ Bad
\`\`\`typescript
const apiKey = "company_api_abc123xyz789";
\`\`\`

#### ✅ Good
\`\`\`typescript
const apiKey = process.env.COMPANY_API_KEY;
\`\`\`
`;
                fs.writeFileSync(path.join(rulesDir, 'security', 'company-api-keys.md'), sampleRule);
                loadCustomRules();
                vscode.window.showInformationMessage('✅ Organization rules structure created!');
                // Open README
                const readmePath = path.join(rulesDir, 'README.md');
                const doc = await vscode.workspace.openTextDocument(readmePath);
                vscode.window.showTextDocument(doc);
                break;
            case 'url':
                vscode.commands.executeCommand('codeGuardrail.importRulesFromUrl');
                break;
        }
    });
    // Manage rules
    const manageRulesCmd = vscode.commands.registerCommand('codeGuardrail.manageRules', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showWarningMessage('Open a workspace folder first');
            return;
        }
        const rulesDir = path.join(workspaceFolders[0].uri.fsPath, RULES_FOLDER_NAME);
        const hasRules = fs.existsSync(rulesDir);
        const items = [
            {
                label: '$(add) Create New Custom Rule',
                description: 'Interactively create a new rule',
                action: 'create'
            },
            {
                label: '$(cloud-download) Import from URL',
                description: 'Download rules from a URL',
                action: 'import-url'
            },
            {
                label: '$(cloud-upload) Upload Rule File',
                description: 'Upload one or more rule files (.md, .txt, .pdf, .docx)',
                action: 'upload-rule'
            },
            {
                label: '$(file-add) Import from File',
                description: 'Import from PDF, Word, or Markdown',
                action: 'import-file'
            },
            {
                label: '$(folder) Setup Organization Rules',
                description: 'Initialize organization rules structure',
                action: 'setup'
            },
            ...(hasRules ? [{
                    label: '$(folder-opened) Open Rules Folder',
                    description: 'View all custom rules',
                    action: 'open'
                }] : []),
            {
                label: '$(refresh) Reload Rules',
                description: 'Reload all rules from workspace',
                action: 'reload'
            }
        ];
        const choice = await vscode.window.showQuickPick(items, {
            placeHolder: 'Manage Code Guardrail Rules'
        });
        if (!choice)
            return;
        switch (choice.action) {
            case 'create':
                vscode.commands.executeCommand('codeGuardrail.createCustomRule');
                break;
            case 'import-url':
                vscode.commands.executeCommand('codeGuardrail.importRulesFromUrl');
                break;
            case 'upload-rule':
                vscode.commands.executeCommand('codeGuardrail.uploadRuleFile');
                break;
            case 'import-file':
                vscode.commands.executeCommand('codeGuardrail.importRules');
                break;
            case 'setup':
                vscode.commands.executeCommand('codeGuardrail.setupOrgRules');
                break;
            case 'open':
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(rulesDir), false);
                break;
            case 'reload':
                vscode.commands.executeCommand('codeGuardrail.reloadRules');
                break;
        }
    });
    // Show Issues Panel with quick fixes
    const showIssuesPanelCmd = vscode.commands.registerCommand('codeGuardrail.showIssuesPanel', () => {
        showIssuesPanel(context);
    });
    // Import rules from file (PDF, Word, MD, TXT)
    const importCmd = vscode.commands.registerCommand('codeGuardrail.importRules', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showWarningMessage('Open a workspace folder first');
            return;
        }
        const filters = {
            'All Supported': ['md', 'txt', 'pdf', 'docx', 'doc'],
            'Markdown': ['md'],
            'Text': ['txt'],
            'PDF': ['pdf'],
            'Word': ['docx', 'doc']
        };
        const fileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters,
            title: 'Select Rules File to Import'
        });
        if (!fileUri || fileUri.length === 0) {
            return;
        }
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Importing rules...',
                cancellable: false
            }, async () => {
                const rules = await (0, fileImporter_1.importRulesFromFile)(fileUri[0].fsPath);
                // Save to guardrail-rules.md in workspace
                const outputPath = path.join(workspaceFolders[0].uri.fsPath, RULES_MD_FILE);
                // Convert to markdown format
                let mdContent = `# Imported Rules\n\nImported from: ${path.basename(fileUri[0].fsPath)}\n\n`;
                for (const rule of rules) {
                    mdContent += `## ${rule.name}\n`;
                    mdContent += `- Severity: ${rule.severity}\n`;
                    mdContent += `- Pattern: \`${rule.pattern}\`\n`;
                    mdContent += `- Message: ${rule.message}\n`;
                    mdContent += `- Category: ${rule.category}\n`;
                    if (rule.languages) {
                        mdContent += `- Languages: ${rule.languages.join(', ')}\n`;
                    }
                    mdContent += '\n';
                }
                // Append or create
                if (fs.existsSync(outputPath)) {
                    const existing = fs.readFileSync(outputPath, 'utf8');
                    fs.writeFileSync(outputPath, existing + '\n\n' + mdContent);
                }
                else {
                    fs.writeFileSync(outputPath, mdContent);
                }
                // Reload rules
                loadCustomRules();
                // Re-analyze open files
                vscode.workspace.textDocuments.forEach(doc => {
                    if (shouldAnalyze(doc)) {
                        analyzeDocument(doc);
                    }
                });
                vscode.window.showInformationMessage(`Imported ${rules.length} rules from ${path.basename(fileUri[0].fsPath)}`);
                // Open the rules file
                const doc = await vscode.workspace.openTextDocument(outputPath);
                vscode.window.showTextDocument(doc);
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to import rules: ${error.message}`);
        }
    });
    // Upload Compliance Document
    const uploadComplianceDocumentCmd = vscode.commands.registerCommand('codeGuardrail.uploadComplianceDocument', async () => {
        try {
            // Step 1: Select compliance type
            const complianceTypes = [
                { label: 'GDPR', description: 'General Data Protection Regulation' },
                { label: 'HIPAA', description: 'Health Insurance Portability and Accountability Act' },
                { label: 'PCI-DSS', description: 'Payment Card Industry Data Security Standard' },
                { label: 'SOC2', description: 'Service Organization Control 2' },
                { label: 'ISO-27001', description: 'Information Security Management' },
                { label: 'Custom', description: 'Custom compliance framework' }
            ];
            const selectedType = await vscode.window.showQuickPick(complianceTypes, {
                placeHolder: 'Select compliance framework type',
                title: 'Upload Compliance Document'
            });
            if (!selectedType) {
                return;
            }
            // Step 2: Select document file
            const filters = {
                'All Supported': ['md', 'txt', 'pdf'],
                'Markdown': ['md'],
                'Text': ['txt'],
                'PDF': ['pdf']
            };
            const fileUri = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters,
                title: 'Select Compliance Document'
            });
            if (!fileUri || fileUri.length === 0) {
                return;
            }
            const filePath = fileUri[0].fsPath;
            const fileName = path.basename(filePath);
            // Step 3: Enter document name (default to filename)
            const documentName = await vscode.window.showInputBox({
                prompt: 'Enter a name for this compliance document',
                value: fileName.replace(/\.[^.]+$/, ''),
                placeHolder: 'e.g., GDPR Article 32 Requirements'
            });
            if (!documentName) {
                return;
            }
            // Step 4: Read file content
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Uploading ${documentName}...`,
                cancellable: false
            }, async () => {
                if (!serviceManager || !serviceManager.isRunning()) {
                    throw new Error('AI service is not running');
                }
                const fileContent = fs.readFileSync(filePath);
                // Upload to service
                const response = await serviceManager.makeRequest('/upload-compliance', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/octet-stream'
                    },
                    body: fileContent,
                    queryParams: {
                        documentName: documentName,
                        type: selectedType.label
                    }
                });
                if (response.success) {
                    vscode.window.showInformationMessage(`✅ Uploaded compliance document: ${documentName} (${selectedType.label})`);
                    // Re-analyze open files with new compliance context
                    vscode.workspace.textDocuments.forEach(doc => {
                        if (shouldAnalyze(doc)) {
                            analyzeDocument(doc);
                        }
                    });
                }
                else {
                    throw new Error(response.error || 'Upload failed');
                }
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to upload compliance document: ${error.message}`);
        }
    });
    // View Uploaded Compliance Documents
    const viewComplianceDocumentsCmd = vscode.commands.registerCommand('codeGuardrail.viewComplianceDocuments', async () => {
        try {
            if (!serviceManager || !serviceManager.isRunning()) {
                vscode.window.showErrorMessage('AI service is not running. Please start the service first.');
                return;
            }
            const response = await serviceManager.makeRequest('/compliance-documents', {
                method: 'GET'
            });
            if (!response.success || !response.documents) {
                vscode.window.showWarningMessage('No compliance documents uploaded');
                return;
            }
            const documents = response.documents;
            if (documents.length === 0) {
                vscode.window.showInformationMessage('No compliance documents uploaded. Use "Upload Compliance Document" to add one.');
                return;
            }
            const items = documents.map(doc => ({
                label: `$(file) ${doc.documentName}`,
                description: doc.type,
                detail: `Type: ${doc.type}`,
                document: doc
            }));
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: `${documents.length} compliance document(s) uploaded`,
                title: 'Uploaded Compliance Documents'
            });
            if (selected) {
                vscode.window.showInformationMessage(`Document: ${selected.document.documentName} (${selected.document.type})`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to list compliance documents: ${error.message}`);
        }
    });
    // Clear All Compliance Documents
    const clearComplianceDocumentsCmd = vscode.commands.registerCommand('codeGuardrail.clearComplianceDocuments', async () => {
        try {
            if (!serviceManager || !serviceManager.isRunning()) {
                vscode.window.showErrorMessage('AI service is not running. Please start the service first.');
                return;
            }
            // First check if any documents exist
            const listResponse = await serviceManager.makeRequest('/compliance-documents', {
                method: 'GET'
            });
            const documents = listResponse.documents || [];
            if (documents.length === 0) {
                vscode.window.showInformationMessage('No compliance documents to clear');
                return;
            }
            // Confirm deletion
            const confirmation = await vscode.window.showWarningMessage(`Clear all ${documents.length} compliance document(s)? This will remove the compliance context from analysis.`, { modal: true }, 'Clear All');
            if (confirmation !== 'Clear All') {
                return;
            }
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Clearing compliance documents...',
                cancellable: false
            }, async () => {
                if (!serviceManager || !serviceManager.isRunning()) {
                    throw new Error('AI service is not running');
                }
                const response = await serviceManager.makeRequest('/compliance-documents', {
                    method: 'DELETE'
                });
                if (response.success) {
                    vscode.window.showInformationMessage('✅ All compliance documents cleared');
                    // Re-analyze open files without compliance context
                    vscode.workspace.textDocuments.forEach(doc => {
                        if (shouldAnalyze(doc)) {
                            analyzeDocument(doc);
                        }
                    });
                }
                else {
                    throw new Error(response.error || 'Clear failed');
                }
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to clear compliance documents: ${error.message}`);
        }
    });
    // Upload Rule File — copies files directly into .guardrail/ folder
    const uploadRuleFileCmd = vscode.commands.registerCommand('codeGuardrail.uploadRuleFile', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showWarningMessage('Open a workspace folder first');
            return;
        }
        const fileUris = await vscode.window.showOpenDialog({
            canSelectMany: true,
            filters: {
                'Rule Files': ['md', 'txt', 'pdf', 'docx', 'doc'],
                'Markdown': ['md'],
                'Text': ['txt'],
                'PDF': ['pdf'],
                'Word': ['docx', 'doc']
            },
            title: 'Upload Rule File(s) to .guardrail/'
        });
        if (!fileUris || fileUris.length === 0) {
            return;
        }
        const rulesDir = path.join(workspaceFolders[0].uri.fsPath, RULES_FOLDER_NAME);
        if (!fs.existsSync(rulesDir)) {
            fs.mkdirSync(rulesDir, { recursive: true });
        }
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Uploading ${fileUris.length} rule file(s)...`,
            cancellable: false
        }, async (progress) => {
            const results = [];
            for (let i = 0; i < fileUris.length; i++) {
                const srcPath = fileUris[i].fsPath;
                const baseName = path.basename(srcPath);
                const ext = path.extname(srcPath).toLowerCase();
                progress.report({
                    message: `${i + 1}/${fileUris.length}: ${baseName}`,
                    increment: 100 / fileUris.length
                });
                try {
                    // Universal conversion layer: every file type → .md saved in .guardrail/
                    const mdName = ext === '.md'
                        ? baseName // keep .md as-is
                        : baseName.replace(/\.[^.]+$/, '.md'); // .docx/.doc/.pdf/.txt → .md
                    const destPath = path.join(rulesDir, mdName);
                    let mdContent;
                    let ruleCount = 0;
                    if (ext === '.md') {
                        // Already markdown — copy directly
                        mdContent = fs.readFileSync(srcPath, 'utf8');
                        ruleCount = (mdContent.match(/^## /gm) || []).length;
                    }
                    else if (ext === '.txt') {
                        // Plain text — wrap in markdown with filename as heading
                        const raw = fs.readFileSync(srcPath, 'utf8');
                        mdContent = `# ${baseName.replace(/\.[^.]+$/, '')}\n\n${raw}`;
                        ruleCount = (raw.match(/^## /gm) || []).length;
                    }
                    else {
                        // PDF / DOCX / DOC — extract text, try structured rule parse first,
                        // fall back to saving raw text as compliance context
                        const rawText = await (0, fileImporter_1.extractTextFromFile)(srcPath);
                        try {
                            const parsed = await (0, fileImporter_1.importRulesFromFile)(srcPath);
                            mdContent = `# Rules from ${baseName}\n\n`;
                            for (const rule of parsed) {
                                mdContent += `## ${rule.name}\n`;
                                mdContent += `- Severity: ${rule.severity}\n`;
                                mdContent += `- Pattern: \`${rule.pattern}\`\n`;
                                mdContent += `- Message: ${rule.message}\n`;
                                mdContent += `- Category: ${rule.category}\n`;
                                if (rule.languages) {
                                    mdContent += `- Languages: ${rule.languages.join(', ')}\n`;
                                }
                                mdContent += '\n';
                            }
                            ruleCount = parsed.length;
                        }
                        catch {
                            // No structured rules — save raw text as compliance context
                            mdContent = `# ${baseName.replace(/\.[^.]+$/, '')}\n\n${rawText}`;
                            ruleCount = 0;
                        }
                    }
                    fs.writeFileSync(destPath, mdContent);
                    results.push({ name: mdName, rules: ruleCount, success: true });
                }
                catch (err) {
                    const errMsg = err?.message || String(err);
                    console.error(`[Guardrail] Upload failed for ${baseName}:`, errMsg, err?.stack);
                    results.push({ name: baseName, rules: 0, success: false, error: errMsg });
                }
            }
            // Reload rules
            loadCustomRules();
            // Re-analyze open files
            vscode.workspace.textDocuments.forEach(doc => {
                if (shouldAnalyze(doc)) {
                    analyzeDocument(doc);
                }
            });
            // Build summary message
            const succeeded = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            const totalRules = succeeded.reduce((sum, r) => sum + r.rules, 0);
            const asContext = succeeded.filter(r => r.rules === 0).length;
            let summary = `✅ Uploaded ${succeeded.length} file(s)`;
            if (totalRules > 0) {
                summary += ` with ${totalRules} structured rule(s)`;
            }
            if (asContext > 0) {
                summary += ` (${asContext} saved as AI compliance context)`;
            }
            if (failed.length > 0) {
                const errDetails = failed.map(f => `${f.name}: ${f.error || 'unknown error'}`).join('\n');
                vscode.window.showErrorMessage(`Upload failed for ${failed.length} file(s): ${errDetails}`);
            }
            const action = await vscode.window.showInformationMessage(summary, 'Open Rules Folder');
            if (action === 'Open Rules Folder') {
                vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(rulesDir));
            }
        });
    });
    // Register on save handler
    const onSave = vscode.workspace.onDidSaveTextDocument((document) => {
        // Reload rules if config/rules file is saved
        const fileName = path.basename(document.fileName);
        const isRulesFile = fileName === CONFIG_FILE_NAME ||
            fileName === RULES_MD_FILE ||
            document.fileName.includes(RULES_FOLDER_NAME);
        if (isRulesFile) {
            loadCustomRules();
            vscode.window.showInformationMessage('Code Guardrail rules reloaded');
        }
        const cfg = getConfig();
        if (cfg.scanMode === 'realtime' && cfg.analyzeOnSave && shouldAnalyze(document)) {
            analyzeDocument(document);
        }
    });
    // Register on open handler
    const onOpen = vscode.workspace.onDidOpenTextDocument((document) => {
        const cfg = getConfig();
        if (cfg.scanMode === 'realtime' && cfg.analyzeOnOpen && shouldAnalyze(document)) {
            analyzeDocument(document);
        }
    });
    // Setup scheduled scanning
    setupScheduledScan();
    // Listen for configuration changes
    const onConfigChange = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('codeGuardrail')) {
            setupScheduledScan();
            updateStatusBarForMode();
            refreshSidebar();
        }
    });
    // Toggle scan mode command
    const toggleScanModeCmd = vscode.commands.registerCommand('codeGuardrail.toggleScanMode', async () => {
        const current = getConfig().scanMode;
        const items = [
            { label: 'Manual', description: current === 'manual' ? '(current)' : '', value: 'manual' },
            { label: 'Realtime', description: current === 'realtime' ? '(current)' : '', value: 'realtime' },
            { label: 'Scheduled', description: current === 'scheduled' ? '(current)' : '', value: 'scheduled' },
        ];
        const picked = await vscode.window.showQuickPick(items, { placeHolder: `Current mode: ${current}` });
        if (picked) {
            const cfg = vscode.workspace.getConfiguration('codeGuardrail');
            await cfg.update('scanMode', picked.value, vscode.ConfigurationTarget.Workspace);
            if (picked.value === 'realtime') {
                await cfg.update('analyzeOnSave', true, vscode.ConfigurationTarget.Workspace);
                await cfg.update('analyzeOnOpen', true, vscode.ConfigurationTarget.Workspace);
            }
            vscode.window.showInformationMessage(`Scan mode set to: ${picked.label}`);
        }
    });
    // Choose model command
    const chooseModelCmd = vscode.commands.registerCommand('codeGuardrail.chooseModel', async () => {
        const modelOptions = [
            {
                label: 'gpt-4.1',
                description: 'Recommended default for GitHub Copilot-backed analysis'
            },
            {
                label: 'gpt-4o',
                description: 'Balanced Copilot model option'
            },
            {
                label: 'gpt-5',
                description: 'Use when your Copilot environment exposes GPT-5'
            },
            {
                label: 'claude-sonnet-4.5',
                description: 'Alternative Copilot model family when available'
            },
            {
                label: 'Custom...',
                description: 'Enter a Copilot-accessible model name manually'
            }
        ];
        const currentModel = vscode.workspace.getConfiguration('codeGuardrail').get('model', 'gpt-4.1');
        const selected = await vscode.window.showQuickPick(modelOptions, {
            placeHolder: `Select the default GitHub Copilot model (current: ${currentModel})`
        });
        if (selected) {
            let modelName = selected.label;
            if (selected.label === 'Custom...') {
                const customModel = await vscode.window.showInputBox({
                    prompt: 'Enter the default GitHub Copilot model name',
                    value: currentModel,
                    ignoreFocusOut: true,
                    validateInput: value => value.trim().length === 0 ? 'Model name is required.' : undefined
                });
                if (!customModel) {
                    return;
                }
                modelName = customModel.trim();
            }
            await vscode.workspace.getConfiguration('codeGuardrail').update('model', modelName, vscode.ConfigurationTarget.Global);
            refreshSidebar();
            vscode.window.showInformationMessage(`Default Copilot model updated to ${modelName}. Restarting service...`);
            await restartServiceWithPrompt();
        }
    });
    const configureAiProviderCmd = vscode.commands.registerCommand('codeGuardrail.configureAiProvider', async () => {
        if (!serviceManager) {
            vscode.window.showErrorMessage('Guardrail AI service manager is not initialized.');
            return;
        }
        const started = await serviceManager.configureProvider();
        if (!started) {
            const startupError = serviceManager.getLastStartupError();
            if (startupError) {
                vscode.window.showWarningMessage(`Provider settings were updated, but the service is still unavailable: ${startupError}`);
            }
        }
        refreshSidebar();
    });
    const startServiceCmd = vscode.commands.registerCommand('codeGuardrail.startService', async () => {
        await attemptServiceStart(true);
        refreshSidebar();
    });
    const restartServiceCmd = vscode.commands.registerCommand('codeGuardrail.restartService', async () => {
        await restartServiceWithPrompt();
        refreshSidebar();
    });
    // Analyze currently open file only in realtime mode
    const cfg = getConfig();
    if (cfg.scanMode === 'realtime' && cfg.analyzeOnOpen && vscode.window.activeTextEditor) {
        analyzeDocument(vscode.window.activeTextEditor.document);
    }
    context.subscriptions.push(diagnosticCollection, statusBarItem, analyzeCmd, scanProjectCmd, clearCmd, showQuickPickCmd, showIssuesPanelCmd, reloadCmd, initCmd, importCmd, importUrlCmd, uploadRuleFileCmd, createRuleCmd, setupOrgCmd, manageRulesCmd, uploadComplianceDocumentCmd, viewComplianceDocumentsCmd, clearComplianceDocumentsCmd, toggleScanModeCmd, chooseModelCmd, configureAiProviderCmd, startServiceCmd, restartServiceCmd, onSave, onOpen, onConfigChange);
    // Show welcome message with clear next steps
    const builtInRuleCount = scanner.getBuiltInRuleIds().length;
    const message = `Code Guardrail is ready! ${builtInRuleCount} built-in rules are active now. Configure AI only if you want Copilot or BYOK analysis.`;
    vscode.window.showInformationMessage(message, 'Test with Sample', 'Setup AI', 'View Rules')
        .then(selection => {
        if (selection === 'Test with Sample') {
            createSampleTestFile();
        }
        else if (selection === 'Setup AI') {
            vscode.commands.executeCommand('codeGuardrail.configureAiProvider');
        }
        else if (selection === 'View Rules') {
            vscode.commands.executeCommand('codeGuardrail.initConfig');
        }
    });
    console.log('Code Guardrail activated successfully');
}
function loadCustomRules() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }
    scanner.clearCustomRules();
    for (const folder of workspaceFolders) {
        // 1. Load from .guardrail.json (JSON format)
        const configPath = path.join(folder.uri.fsPath, CONFIG_FILE_NAME);
        if (fs.existsSync(configPath)) {
            try {
                const configContent = fs.readFileSync(configPath, 'utf8');
                const config = JSON.parse(configContent);
                scanner.loadCustomRules(config);
                console.log(`Loaded rules from ${configPath}`);
            }
            catch (error) {
                console.error(`Error loading ${configPath}:`, error);
                vscode.window.showErrorMessage(`Error loading ${CONFIG_FILE_NAME}: ${error}`);
            }
        }
        // 2. Load from guardrail-rules.md (single markdown file)
        const mdFilePath = path.join(folder.uri.fsPath, RULES_MD_FILE);
        if (fs.existsSync(mdFilePath)) {
            try {
                const content = fs.readFileSync(mdFilePath, 'utf8');
                const rules = (0, ruleParser_1.parseRulesFromMarkdown)(content);
                if (rules.length > 0) {
                    scanner.loadCustomRules({ rules });
                    console.log(`Loaded ${rules.length} rules from ${mdFilePath}`);
                }
            }
            catch (error) {
                console.error(`Error loading ${mdFilePath}:`, error);
                vscode.window.showErrorMessage(`Error loading ${RULES_MD_FILE}: ${error}`);
            }
        }
        // 3. Load from .guardrail/ folder (multiple .md files)
        const rulesFolder = path.join(folder.uri.fsPath, RULES_FOLDER_NAME);
        if (fs.existsSync(rulesFolder)) {
            try {
                const rules = (0, ruleParser_1.loadRulesFromFolder)(rulesFolder);
                if (rules.length > 0) {
                    scanner.loadCustomRules({ rules });
                    console.log(`Loaded ${rules.length} rules from ${rulesFolder}`);
                }
            }
            catch (error) {
                console.error(`Error loading from ${rulesFolder}:`, error);
                vscode.window.showErrorMessage(`Error loading rules from ${RULES_FOLDER_NAME}/: ${error}`);
            }
        }
    }
}
function createDefaultConfig() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showWarningMessage('No workspace folder open');
        return;
    }
    const mdPath = path.join(workspaceFolders[0].uri.fsPath, RULES_MD_FILE);
    if (fs.existsSync(mdPath)) {
        vscode.window.showWarningMessage(`${RULES_MD_FILE} already exists`);
        vscode.workspace.openTextDocument(mdPath).then(doc => {
            vscode.window.showTextDocument(doc);
        });
        return;
    }
    // Create simple markdown file instead of JSON
    const content = (0, ruleParser_1.generateSampleRulesMarkdown)();
    fs.writeFileSync(mdPath, content);
    vscode.workspace.openTextDocument(mdPath).then(doc => {
        vscode.window.showTextDocument(doc);
    });
    vscode.window.showInformationMessage(`Created ${RULES_MD_FILE} with example rules`);
}
function shouldAnalyze(document) {
    if (document.uri.scheme !== 'file')
        return false;
    if (document.isUntitled)
        return false;
    const supportedExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cs', '.go', '.rb', '.php'];
    return supportedExtensions.some(ext => document.fileName.endsWith(ext));
}
function setupScheduledScan() {
    // Clear existing timer
    if (scheduledScanTimer) {
        clearInterval(scheduledScanTimer);
        scheduledScanTimer = null;
    }
    const cfg = getConfig();
    if (cfg.scanMode !== 'scheduled') {
        return;
    }
    const intervalMs = cfg.scheduledIntervalMinutes * 60 * 1000;
    scheduledScanTimer = setInterval(() => {
        // Scan all open text documents
        vscode.workspace.textDocuments.forEach(doc => {
            if (shouldAnalyze(doc)) {
                analyzeDocument(doc);
            }
        });
    }, intervalMs);
    console.log(`Scheduled scan every ${cfg.scheduledIntervalMinutes} min`);
}
function updateStatusBarForMode() {
    if (!statusBarItem) {
        return;
    }
    const mode = getConfig().scanMode;
    const modeLabel = mode === 'realtime' ? 'RT' : mode === 'scheduled' ? 'Sched' : 'Manual';
    statusBarItem.text = `$(shield-check) Guardrail [${modeLabel}]`;
    statusBarItem.tooltip = `Code Guardrail - Mode: ${mode}. Click for options.`;
    statusBarItem.backgroundColor = undefined;
}
async function analyzeDocument(document) {
    const text = document.getText();
    let findings = [];
    // AI-only analysis (no regex fallback)
    if (!serviceManager || !serviceManager.isRunning()) {
        vscode.window.showErrorMessage('❌ AI Service not running. Code Guardrail requires the AI service to analyze code.', 'Configure AI Provider', 'Retry Starting Service').then(async (selection) => {
            if (selection === 'Configure AI Provider' && serviceManager) {
                await serviceManager.configureProvider();
            }
            else if (selection === 'Retry Starting Service' && serviceManager) {
                await attemptServiceStart(true);
            }
        });
        statusBarItem.text = '$(alert) Guardrail: AI Service Required';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        statusBarItem.tooltip = 'AI service must be running for analysis. Click to retry.';
        refreshSidebar();
        return;
    }
    // Show progress while analyzing
    const lineCount = text.split('\n').length;
    statusBarItem.text = `$(sync~spin) Guardrail: Analyzing (${lineCount} lines)...`;
    statusBarItem.backgroundColor = undefined;
    // Scale timeout: 120s base + 60s per extra 80-line chunk
    const chunks = Math.ceil(lineCount / 70);
    const timeout = Math.max(120000, chunks * 120000);
    try {
        const response = await serviceManager.makeRequest('/analyze', {
            method: 'POST',
            body: {
                content: text,
                filePath: document.fileName,
                language: document.languageId
            },
            timeout
        });
        // Convert backend response to Finding format
        if (response.success && response.result && response.result.findings) {
            // Check for partial failures (e.g., timeout with empty findings)
            if (response.result.findings.length === 0 && response.result.error) {
                console.warn('⚠️ AI analysis returned no findings with error:', response.result.error);
                vscode.window.showWarningMessage(`AI analysis issue: ${response.result.error}. The service may need to be restarted.`, 'Restart Service').then(selection => {
                    if (selection === 'Restart Service' && serviceManager) {
                        restartServiceWithPrompt();
                    }
                });
                statusBarItem.text = '$(warning) Guardrail: Analysis Timeout';
                statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                statusBarItem.tooltip = response.result.error;
                refreshSidebar();
                return;
            }
            findings = mapBackendFindings(text, response.result.findings);
            console.log(`✅ AI analysis complete: ${findings.length} issues found`);
        }
    }
    catch (error) {
        console.error('❌ AI analysis failed:', error.message);
        vscode.window.showErrorMessage(`AI analysis failed: ${error.message}`);
        statusBarItem.text = '$(alert) Guardrail: Analysis Failed';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        refreshSidebar();
        return;
    }
    applyFindingsToDocument(document, findings);
    // Update status bar
    if (findings.length > 0) {
        const highCount = findings.filter(f => f.severity === 'HIGH').length;
        if (highCount > 0) {
            statusBarItem.text = `$(alert) Guardrail 🤖: ${findings.length} issue(s) (${highCount} critical)`;
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
        else {
            statusBarItem.text = `$(warning) Guardrail 🤖: ${findings.length} issue(s)`;
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
        statusBarItem.tooltip = `AI found ${findings.length} security/compliance issue(s). Click to see options.`;
    }
    else {
        statusBarItem.text = '$(shield-check) Guardrail 🤖: Clean';
        statusBarItem.backgroundColor = undefined;
        statusBarItem.tooltip = 'AI analysis - No issues found. Click for options.';
    }
    refreshSidebar();
}
function mapBackendFindings(text, backendFindings) {
    return backendFindings.map((finding) => {
        const lines = text.split('\n');
        let startOffset = 0;
        for (let i = 0; i < finding.line - 1 && i < lines.length; i++) {
            startOffset += lines[i].length + 1;
        }
        const endOffset = startOffset + (finding.snippet?.length || 50);
        return {
            ruleId: `🤖 ${finding.id || 'AI-001'}`,
            severity: finding.severity || 'MEDIUM',
            message: `${finding.title}: ${finding.description}`,
            startOffset,
            endOffset,
            category: finding.category?.toLowerCase() || 'security',
            quickFix: finding.suggestedFix
        };
    });
}
function applyFindingsToDocument(document, findings) {
    const diagnostics = findings.map(finding => {
        const startPos = document.positionAt(finding.startOffset);
        const endPos = document.positionAt(finding.endOffset);
        const range = new vscode.Range(startPos, endPos);
        const severity = mapSeverity(finding.severity);
        const diagnostic = new vscode.Diagnostic(range, finding.message, severity);
        diagnostic.source = 'Code Guardrail (🤖 AI)';
        diagnostic.code = finding.ruleId;
        return diagnostic;
    });
    diagnosticCollection.set(document.uri, diagnostics);
}
function mapSeverity(severity) {
    switch (severity.toUpperCase()) {
        case 'HIGH':
        case 'CRITICAL':
            return vscode.DiagnosticSeverity.Error;
        case 'MEDIUM':
            return vscode.DiagnosticSeverity.Warning;
        case 'LOW':
            return vscode.DiagnosticSeverity.Information;
        default:
            return vscode.DiagnosticSeverity.Hint;
    }
}
function showIssuesPanel(context) {
    const panel = vscode.window.createWebviewPanel('guardrailIssues', '🛡️ Code Guardrail - Security Issues', vscode.ViewColumn.Two, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    // Get all diagnostics from all documents
    const allIssues = [];
    // Collect issues from all documents
    vscode.workspace.textDocuments.forEach(doc => {
        const diagnostics = diagnosticCollection.get(doc.uri);
        if (diagnostics && diagnostics.length > 0) {
            diagnostics.forEach(diag => {
                const relativePath = vscode.workspace.asRelativePath(doc.uri);
                const severityLabel = diag.severity === vscode.DiagnosticSeverity.Error ? 'HIGH' :
                    diag.severity === vscode.DiagnosticSeverity.Warning ? 'MEDIUM' : 'LOW';
                // Generate quick fix based on issue type
                let quickFix = 'Review and fix manually';
                const msg = diag.message.toLowerCase();
                if (msg.includes('api key') || msg.includes('secret') || msg.includes('password')) {
                    quickFix = 'Move to environment variable: process.env.API_KEY';
                }
                else if (msg.includes('sql injection')) {
                    quickFix = 'Use parameterized queries or prepared statements';
                }
                else if (msg.includes('xss') || msg.includes('innerhtml')) {
                    quickFix = 'Sanitize user input or use textContent instead';
                }
                else if (msg.includes('md5') || msg.includes('sha1')) {
                    quickFix = 'Use SHA-256 or stronger: crypto.createHash("sha256")';
                }
                else if (msg.includes('empty catch')) {
                    quickFix = 'Add error logging: console.error(err) or throw err';
                }
                else if (msg.includes('eval')) {
                    quickFix = 'Avoid eval(). Use JSON.parse() or safer alternatives';
                }
                else if (msg.includes('console.log')) {
                    quickFix = 'Remove console.log or use proper logging library';
                }
                allIssues.push({
                    file: relativePath,
                    line: diag.range.start.line + 1,
                    severity: severityLabel,
                    message: diag.message,
                    code: diag.code?.toString() || 'GUARDRAIL',
                    quickFix: quickFix
                });
            });
        }
    });
    // Generate HTML content
    panel.webview.html = getIssuesPanelHtml(allIssues);
    // Handle messages from webview
    panel.webview.onDidReceiveMessage(message => {
        if (message.command === 'openFile') {
            const uri = vscode.Uri.file(vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + message.file);
            vscode.window.showTextDocument(uri).then(editor => {
                const position = new vscode.Position(message.line - 1, 0);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
            });
        }
    }, undefined, context.subscriptions);
}
function getIssuesPanelHtml(issues) {
    const criticalIssues = issues.filter(i => i.severity === 'HIGH');
    const mediumIssues = issues.filter(i => i.severity === 'MEDIUM');
    const lowIssues = issues.filter(i => i.severity === 'LOW');
    const renderIssue = (issue, index) => `
        <div class="issue ${issue.severity.toLowerCase()}">
            <div class="issue-header">
                <span class="severity-badge ${issue.severity.toLowerCase()}">${issue.severity}</span>
                <span class="issue-code">${issue.code}</span>
                <span class="issue-location" onclick="openFile('${issue.file}', ${issue.line})">
                    📄 ${issue.file}:${issue.line}
                </span>
            </div>
            <div class="issue-message">${issue.message}</div>
            <div class="quick-fix">
                <strong>💡 Quick Fix:</strong> ${issue.quickFix}
            </div>
        </div>
    `;
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                padding: 20px;
                color: var(--vscode-foreground);
                background: var(--vscode-editor-background);
            }
            .header {
                margin-bottom: 30px;
                border-bottom: 2px solid var(--vscode-panel-border);
                padding-bottom: 15px;
            }
            .header h1 {
                margin: 0 0 10px 0;
                color: var(--vscode-foreground);
            }
            .summary {
                display: flex;
                gap: 20px;
                margin: 15px 0;
            }
            .summary-item {
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: bold;
            }
            .critical { background: rgba(255, 0, 0, 0.15); color: #ff6b6b; }
            .medium { background: rgba(255, 165, 0, 0.15); color: #ffa726; }
            .low { background: rgba(100, 149, 237, 0.15); color: #64b5f6; }
            .clean { background: rgba(0, 255, 0, 0.15); color: #66bb6a; }
            
            .section {
                margin: 30px 0;
            }
            .section h2 {
                color: var(--vscode-foreground);
                margin-bottom: 15px;
            }
            .issue {
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-left: 4px solid;
                border-radius: 6px;
                padding: 15px;
                margin: 10px 0;
                transition: transform 0.2s;
            }
            .issue:hover {
                transform: translateX(5px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            .issue.high { border-left-color: #ff6b6b; }
            .issue.medium { border-left-color: #ffa726; }
            .issue.low { border-left-color: #64b5f6; }
            
            .issue-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
                font-size: 13px;
            }
            .severity-badge {
                padding: 4px 10px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 11px;
                text-transform: uppercase;
            }
            .severity-badge.high { background: #ff6b6b; color: white; }
            .severity-badge.medium { background: #ffa726; color: white; }
            .severity-badge.low { background: #64b5f6; color: white; }
            
            .issue-code {
                font-family: 'Courier New', monospace;
                background: var(--vscode-textCodeBlock-background);
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 11px;
            }
            .issue-location {
                color: var(--vscode-textLink-foreground);
                cursor: pointer;
                text-decoration: underline;
            }
            .issue-location:hover {
                color: var(--vscode-textLink-activeForeground);
            }
            .issue-message {
                margin: 10px 0;
                line-height: 1.5;
            }
            .quick-fix {
                background: var(--vscode-textBlockQuote-background);
                border-left: 3px solid var(--vscode-textBlockQuote-border);
                padding: 10px;
                margin-top: 10px;
                font-size: 13px;
                border-radius: 4px;
            }
            .quick-fix strong {
                color: var(--vscode-textLink-foreground);
            }
            .empty-state {
                text-align: center;
                padding: 60px 20px;
                color: var(--vscode-descriptionForeground);
            }
            .empty-state h2 {
                color: #66bb6a;
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🛡️ Code Guardrail - Security Analysis</h1>
            <div class="summary">
                <div class="summary-item critical">
                    🔴 Critical: ${criticalIssues.length}
                </div>
                <div class="summary-item medium">
                    🟡 Medium: ${mediumIssues.length}
                </div>
                <div class="summary-item low">
                    🔵 Low: ${lowIssues.length}
                </div>
                ${issues.length === 0 ? '<div class="summary-item clean">✅ No Issues Found!</div>' : ''}
            </div>
        </div>

        ${issues.length === 0 ? `
            <div class="empty-state">
                <h2>✨ All Clear!</h2>
                <p>No security issues detected in your code.</p>
                <p>Keep up the good work! 🎉</p>
            </div>
        ` : ''}

        ${criticalIssues.length > 0 ? `
            <div class="section">
                <h2>🔴 Critical Issues (${criticalIssues.length})</h2>
                ${criticalIssues.map((issue, i) => renderIssue(issue, i)).join('')}
            </div>
        ` : ''}

        ${mediumIssues.length > 0 ? `
            <div class="section">
                <h2>🟡 Medium Priority (${mediumIssues.length})</h2>
                ${mediumIssues.map((issue, i) => renderIssue(issue, i)).join('')}
            </div>
        ` : ''}

        ${lowIssues.length > 0 ? `
            <div class="section">
                <h2>🔵 Low Priority (${lowIssues.length})</h2>
                ${lowIssues.map((issue, i) => renderIssue(issue, i)).join('')}
            </div>
        ` : ''}

        <script>
            const vscode = acquireVsCodeApi();
            
            function openFile(file, line) {
                vscode.postMessage({
                    command: 'openFile',
                    file: file,
                    line: line
                });
            }
        </script>
    </body>
    </html>`;
}
async function createSampleTestFile() {
    const sampleCode = `// Code Guardrail Test File
// This file contains intentional security issues for testing

// Test 1: Hardcoded API Key (should show HIGH severity error)
const apiKey = "sk-1234567890abcdefghij";

// Test 2: Hardcoded Password (should show HIGH severity error)
const password = "admin123";

// Test 3: SQL Injection vulnerability (should show HIGH severity error)
function getUserById(userId) {
    const query = "SELECT * FROM users WHERE id = '" + userId + "'";
    return db.query(query);
}

// Test 4: XSS vulnerability (should show HIGH severity error)
function displayMessage(msg) {
    document.getElementById('output').innerHTML = msg;
}

// Test 5: Empty catch block - intentionally empty to test detection (should show MEDIUM severity warning)
try {
    riskyOperation();
} catch (err) {
    // Empty - this is a security anti-pattern that should be detected
}

// Save this file to see security issues highlighted!
// Issues will appear with red squiggles and in the Problems panel.
`;
    const doc = await vscode.workspace.openTextDocument({
        content: sampleCode,
        language: 'javascript'
    });
    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage('✅ Sample test file created! Save it (Ctrl+S) to see security issues highlighted.', 'Got it');
}
function deactivate() {
    // Stop the backend service
    if (serviceManager) {
        serviceManager.stop().then(() => {
            console.log('✅ Guardrail service stopped');
        });
    }
    if (scheduledScanTimer) {
        clearInterval(scheduledScanTimer);
        scheduledScanTimer = null;
    }
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
//# sourceMappingURL=extension.js.map