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
                label: '$(file-add) Create Sample Rules',
                description: 'Generate example rules file in workspace',
                action: 'init'
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
                case 'test':
                    createSampleTestFile();
                    break;
                case 'analyze':
                    vscode.commands.executeCommand('codeGuardrail.analyzeFile');
                    break;
                case 'reload':
                    vscode.commands.executeCommand('codeGuardrail.reloadRules');
                    break;
                case 'clear':
                    vscode.commands.executeCommand('codeGuardrail.clearDiagnostics');
                    break;
                case 'init':
                    vscode.commands.executeCommand('codeGuardrail.initConfig');
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
        reloadCmd,
        initCmd,
        importCmd,
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
