import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SecurityScanner, Finding, GuardrailConfig } from './scanner';
import { parseRulesFromMarkdown, loadRulesFromFolder, generateSampleRulesMarkdown } from './ruleParser';
import { importRulesFromFile, getSupportedExtensions, generateSampleTextRules } from './fileImporter';

let diagnosticCollection: vscode.DiagnosticCollection;
let scanner: SecurityScanner;
let statusBarItem: vscode.StatusBarItem;

const CONFIG_FILE_NAME = '.guardrail.json';
const RULES_FOLDER_NAME = '.guardrail';
const RULES_MD_FILE = 'guardrail-rules.md';

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Guardrail activating...');
    
    // Initialize components
    diagnosticCollection = vscode.languages.createDiagnosticCollection('code-guardrail');
    scanner = new SecurityScanner();
    
    // Load custom rules from workspace
    loadCustomRules();
    
    // Create status bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(shield-check) Guardrail: Ready';
    statusBarItem.tooltip = 'Code Guardrail - Active and scanning. Click for more options.';
    statusBarItem.command = 'codeGuardrail.showQuickPick';
    statusBarItem.show();
    
    // Register commands
    const analyzeCmd = vscode.commands.registerCommand('codeGuardrail.analyzeFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            analyzeDocument(editor.document);
        } else {
            vscode.window.showWarningMessage('No active file to analyze');
        }
    });
    
    const clearCmd = vscode.commands.registerCommand('codeGuardrail.clearDiagnostics', () => {
        diagnosticCollection.clear();
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
                case 'manage':
                    vscode.commands.executeCommand('codeGuardrail.manageRules');
                    break;
                case 'create-rule':
                    vscode.commands.executeCommand('codeGuardrail.createCustomRule');
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
                case 'about':
                    const builtInCount = scanner.getBuiltInRuleIds().length;
                    const categories = scanner.getCategories();
                    vscode.window.showInformationMessage(
                        `Code Guardrail v${context.extension.packageJSON.version}\n\n` +
                        `✅ ${builtInCount} built-in security rules\n` +
                        `📂 Categories: ${categories.join(', ')}\n\n` +
                        `No backend service required - everything runs locally!`,
                        'OK'
                    );
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
                if (!value) return 'URL is required';
                try {
                    new URL(value);
                    return null;
                } catch {
                    return 'Invalid URL format';
                }
            }
        });

        if (!url) return;

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
                    protocol.get(url, (res: any) => {
                        let data = '';
                        res.on('data', (chunk: string) => { data += chunk; });
                        res.on('end', () => {
                            // Save to .guardrail/ folder
                            const rulesDir = path.join(workspaceFolders![0].uri.fsPath, RULES_FOLDER_NAME);
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
                    }).on('error', (err: Error) => {
                        vscode.window.showErrorMessage(`Failed to download: ${err.message}`);
                        reject(err);
                    });
                });
            } catch (error: any) {
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
        if (!ruleName) return;

        const severity = await vscode.window.showQuickPick(['HIGH', 'MEDIUM', 'LOW', 'INFO'], {
            placeHolder: 'Select severity level'
        });
        if (!severity) return;

        const category = await vscode.window.showQuickPick([
            'security', 'compliance', 'best-practices', 'performance', 'custom'
        ], {
            placeHolder: 'Select rule category'
        });
        if (!category) return;

        const pattern = await vscode.window.showInputBox({
            prompt: 'Enter regex pattern to detect',
            placeHolder: '(api[_-]?key|token)\\s*[:=]\\s*["\'][^"\']+["\']',
            validateInput: (value) => {
                if (!value) return 'Pattern is required';
                try {
                    new RegExp(value, 'gi');
                    return null;
                } catch {
                    return 'Invalid regex pattern';
                }
            }
        });
        if (!pattern) return;

        const message = await vscode.window.showInputBox({
            prompt: 'Enter warning message',
            placeHolder: 'Hardcoded credentials detected. Use environment variables.',
            value: `${ruleName} - please review this code`
        });
        if (!message) return;

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

        if (!choice) return;

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const rulesDir = path.join(workspaceRoot, RULES_FOLDER_NAME);

        switch (choice.action) {
            case 'clone':
                const repoUrl = await vscode.window.showInputBox({
                    prompt: 'Enter Git repository URL',
                    placeHolder: 'https://github.com/yourorg/guardrail-rules.git'
                });
                if (!repoUrl) return;

                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Cloning organization rules repository...',
                    cancellable: false
                }, async () => {
                    try {
                        const { exec } = require('child_process');
                        await new Promise((resolve, reject) => {
                            exec(`git clone ${repoUrl} "${rulesDir}"`, (error: any, stdout: string, stderr: string) => {
                                if (error) reject(error);
                                else resolve(stdout);
                            });
                        });
                        
                        loadCustomRules();
                        vscode.window.showInformationMessage('✅ Organization rules cloned successfully!');
                    } catch (error: any) {
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

        if (!choice) return;

        switch (choice.action) {
            case 'create':
                vscode.commands.executeCommand('codeGuardrail.createCustomRule');
                break;
            case 'import-url':
                vscode.commands.executeCommand('codeGuardrail.importRulesFromUrl');
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

        const filters: { [key: string]: string[] } = {
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
                const rules = await importRulesFromFile(fileUri[0].fsPath);
                
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
                } else {
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
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to import rules: ${error.message}`);
        }
    });
    
    // Register on save handler
    const onSave = vscode.workspace.onDidSaveTextDocument((document) => {
        // Reload rules if config/rules file is saved
        const fileName = path.basename(document.fileName);
        const isRulesFile = 
            fileName === CONFIG_FILE_NAME ||
            fileName === RULES_MD_FILE ||
            document.fileName.includes(RULES_FOLDER_NAME);
        
        if (isRulesFile) {
            loadCustomRules();
            vscode.window.showInformationMessage('Code Guardrail rules reloaded');
        }
        
        if (shouldAnalyze(document)) {
            analyzeDocument(document);
        }
    });
    
    // Register on open handler
    const onOpen = vscode.workspace.onDidOpenTextDocument((document) => {
        if (shouldAnalyze(document)) {
            analyzeDocument(document);
        }
    });
    
    // Analyze currently open files
    if (vscode.window.activeTextEditor) {
        analyzeDocument(vscode.window.activeTextEditor.document);
    }
    
    context.subscriptions.push(
        diagnosticCollection,
        statusBarItem,
        analyzeCmd,
        clearCmd,
        showQuickPickCmd,
        showIssuesPanelCmd,
        reloadCmd,
        initCmd,
        importCmd,
        importUrlCmd,
        createRuleCmd,
        setupOrgCmd,
        manageRulesCmd,
        onSave,
        onOpen
    );
    
    // Show welcome message with clear next steps
    const builtInRuleCount = scanner.getBuiltInRuleIds().length;
    const message = `Code Guardrail is ready! ${builtInRuleCount} built-in security rules active. No setup required - just start coding!`;
    vscode.window.showInformationMessage(message, 'Test with Sample', 'View Rules')
        .then(selection => {
            if (selection === 'Test with Sample') {
                createSampleTestFile();
            } else if (selection === 'View Rules') {
                vscode.commands.executeCommand('codeGuardrail.initConfig');
            }
        });
    console.log('Code Guardrail activated successfully');
}

function loadCustomRules(): void {
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
                const config: GuardrailConfig = JSON.parse(configContent);
                scanner.loadCustomRules(config);
                console.log(`Loaded rules from ${configPath}`);
            } catch (error) {
                console.error(`Error loading ${configPath}:`, error);
                vscode.window.showErrorMessage(`Error loading ${CONFIG_FILE_NAME}: ${error}`);
            }
        }

        // 2. Load from guardrail-rules.md (single markdown file)
        const mdFilePath = path.join(folder.uri.fsPath, RULES_MD_FILE);
        if (fs.existsSync(mdFilePath)) {
            try {
                const content = fs.readFileSync(mdFilePath, 'utf8');
                const rules = parseRulesFromMarkdown(content);
                if (rules.length > 0) {
                    scanner.loadCustomRules({ rules });
                    console.log(`Loaded ${rules.length} rules from ${mdFilePath}`);
                }
            } catch (error) {
                console.error(`Error loading ${mdFilePath}:`, error);
                vscode.window.showErrorMessage(`Error loading ${RULES_MD_FILE}: ${error}`);
            }
        }

        // 3. Load from .guardrail/ folder (multiple .md files)
        const rulesFolder = path.join(folder.uri.fsPath, RULES_FOLDER_NAME);
        if (fs.existsSync(rulesFolder)) {
            try {
                const rules = loadRulesFromFolder(rulesFolder);
                if (rules.length > 0) {
                    scanner.loadCustomRules({ rules });
                    console.log(`Loaded ${rules.length} rules from ${rulesFolder}`);
                }
            } catch (error) {
                console.error(`Error loading from ${rulesFolder}:`, error);
                vscode.window.showErrorMessage(`Error loading rules from ${RULES_FOLDER_NAME}/: ${error}`);
            }
        }
    }
}

function createDefaultConfig(): void {
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
    const content = generateSampleRulesMarkdown();
    fs.writeFileSync(mdPath, content);
    
    vscode.workspace.openTextDocument(mdPath).then(doc => {
        vscode.window.showTextDocument(doc);
    });
    vscode.window.showInformationMessage(`Created ${RULES_MD_FILE} with example rules`);
}

function shouldAnalyze(document: vscode.TextDocument): boolean {
    if (document.uri.scheme !== 'file') return false;
    if (document.isUntitled) return false;
    
    const supportedExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cs', '.go', '.rb', '.php'];
    return supportedExtensions.some(ext => document.fileName.endsWith(ext));
}

function analyzeDocument(document: vscode.TextDocument) {
    const text = document.getText();
    const findings = scanner.scan(text, document.fileName);
    
    const diagnostics: vscode.Diagnostic[] = findings.map(finding => {
        const startPos = document.positionAt(finding.startOffset);
        const endPos = document.positionAt(finding.endOffset);
        const range = new vscode.Range(startPos, endPos);
        
        const severity = mapSeverity(finding.severity);
        const diagnostic = new vscode.Diagnostic(range, finding.message, severity);
        diagnostic.source = 'Code Guardrail';
        diagnostic.code = finding.ruleId;
        
        return diagnostic;
    });
    
    diagnosticCollection.set(document.uri, diagnostics);
    
    if (findings.length > 0) {
        const highCount = findings.filter(f => f.severity === 'HIGH').length;
        if (highCount > 0) {
            statusBarItem.text = `$(alert) Guardrail: ${findings.length} issue(s) (${highCount} critical)`;
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        } else {
            statusBarItem.text = `$(warning) Guardrail: ${findings.length} issue(s)`;
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
        statusBarItem.tooltip = `Code Guardrail found ${findings.length} security/compliance issue(s). Click to see options.`;
    } else {
        statusBarItem.text = '$(shield-check) Guardrail: Clean';
        statusBarItem.backgroundColor = undefined;
        statusBarItem.tooltip = 'Code Guardrail - No issues found. Click for options.';
    }
}

function mapSeverity(severity: string): vscode.DiagnosticSeverity {
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

function showIssuesPanel(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'guardrailIssues',
        '🛡️ Code Guardrail - Security Issues',
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // Get all diagnostics from all documents
    const allIssues: Array<{
        file: string;
        line: number;
        severity: string;
        message: string;
        code: string;
        quickFix: string;
    }> = [];

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
                } else if (msg.includes('sql injection')) {
                    quickFix = 'Use parameterized queries or prepared statements';
                } else if (msg.includes('xss') || msg.includes('innerhtml')) {
                    quickFix = 'Sanitize user input or use textContent instead';
                } else if (msg.includes('md5') || msg.includes('sha1')) {
                    quickFix = 'Use SHA-256 or stronger: crypto.createHash("sha256")';
                } else if (msg.includes('empty catch')) {
                    quickFix = 'Add error logging: console.error(err) or throw err';
                } else if (msg.includes('eval')) {
                    quickFix = 'Avoid eval(). Use JSON.parse() or safer alternatives';
                } else if (msg.includes('console.log')) {
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
    panel.webview.onDidReceiveMessage(
        message => {
            if (message.command === 'openFile') {
                const uri = vscode.Uri.file(vscode.workspace.workspaceFolders![0].uri.fsPath + '/' + message.file);
                vscode.window.showTextDocument(uri).then(editor => {
                    const position = new vscode.Position(message.line - 1, 0);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
                });
            }
        },
        undefined,
        context.subscriptions
    );
}

function getIssuesPanelHtml(issues: Array<{file: string; line: number; severity: string; message: string; code: string; quickFix: string}>): string {
    const criticalIssues = issues.filter(i => i.severity === 'HIGH');
    const mediumIssues = issues.filter(i => i.severity === 'MEDIUM');
    const lowIssues = issues.filter(i => i.severity === 'LOW');

    const renderIssue = (issue: any, index: number) => `
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
    
    vscode.window.showInformationMessage(
        '✅ Sample test file created! Save it (Ctrl+S) to see security issues highlighted.',
        'Got it'
    );
}

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
