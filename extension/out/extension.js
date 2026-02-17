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
const client_1 = require("./client");
const diagnostics_1 = require("./diagnostics");
const codeActions_1 = require("./codeActions");
const serviceManager_1 = require("./serviceManager");
const statusBar_1 = require("./statusBar");
let client;
let diagnosticsManager;
let serviceManager;
let statusBar;
async function activate(context) {
    console.log('Code Guardrail extension activating...');
    // Get configuration once
    const config = vscode.workspace.getConfiguration('codeGuardrail');
    // Initialize components
    client = new client_1.GuardrailClient();
    diagnosticsManager = new diagnostics_1.DiagnosticsManager();
    serviceManager = new serviceManager_1.ServiceManager();
    statusBar = new statusBar_1.StatusBar();
    // Check service status
    const isConnected = await client.checkHealth();
    statusBar.update(isConnected ? 'connected' : 'disconnected');
    // Auto-start service if configured and not already running
    if (!isConnected && config.get('autoStartService')) {
        console.log('Attempting to auto-start service...');
        const started = await serviceManager.start();
        if (started) {
            // Wait a bit for service to initialize
            await new Promise(resolve => setTimeout(resolve, 2000));
            const connected = await client.checkHealth();
            statusBar.update(connected ? 'connected' : 'disconnected');
            if (connected) {
                vscode.window.showInformationMessage('Code Guardrail service started successfully. Analyzing your code...', 'Got it');
            }
            else {
                vscode.window.showWarningMessage('Code Guardrail service started but not responding. Check output logs.', 'View Logs').then(action => {
                    if (action === 'View Logs') {
                        vscode.commands.executeCommand('workbench.action.output.toggleOutput');
                    }
                });
            }
        }
    }
    else if (!isConnected) {
        vscode.window.showWarningMessage('Code Guardrail service is not running. Start it to enable code analysis.', 'Start Service', 'Dismiss').then(action => {
            if (action === 'Start Service') {
                vscode.commands.executeCommand('codeGuardrail.startService');
            }
        });
    }
    else {
        vscode.window.showInformationMessage('Code Guardrail is ready! Your code is being analyzed for security and compliance issues.', 'Got it');
    }
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('codeGuardrail.analyzeFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }
        await analyzeDocument(editor.document);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeGuardrail.analyzeWorkspace', async () => {
        await analyzeWorkspace();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeGuardrail.clearDiagnostics', () => {
        diagnosticsManager.clear();
        vscode.window.showInformationMessage('Cleared all Code Guardrail issues');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeGuardrail.startService', async () => {
        statusBar.update('connecting');
        const success = await serviceManager.start();
        if (success) {
            statusBar.update('connected');
            vscode.window.showInformationMessage('Code Guardrail service started');
        }
        else {
            statusBar.update('disconnected');
            vscode.window.showErrorMessage('Failed to start Code Guardrail service');
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeGuardrail.stopService', async () => {
        await serviceManager.stop();
        statusBar.update('disconnected');
        vscode.window.showInformationMessage('Code Guardrail service stopped');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeGuardrail.reloadGovernance', async () => {
        try {
            await client.reloadGovernance();
            vscode.window.showInformationMessage('Governance rules reloaded');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to reload governance: ${error}`);
        }
    }));
    // Register code actions provider
    const codeActionsProvider = new codeActions_1.CodeActionsProvider(diagnosticsManager);
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ scheme: 'file' }, codeActionsProvider, {
        providedCodeActionKinds: codeActions_1.CodeActionsProvider.providedCodeActionKinds
    }));
    // Listen to document changes
    if (config.get('autoAnalyzeOnSave')) {
        context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((document) => {
            if (shouldAnalyzeDocument(document)) {
                analyzeDocument(document);
            }
        }));
    }
    if (config.get('autoAnalyzeOnType')) {
        let timeout;
        const debounceMs = config.get('analyzeOnTypeDebounce', 2000);
        context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => {
            if (!shouldAnalyzeDocument(event.document)) {
                return;
            }
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                analyzeDocument(event.document);
            }, debounceMs);
        }));
    }
    // Analyze open documents on startup
    vscode.workspace.textDocuments.forEach((document) => {
        if (shouldAnalyzeDocument(document)) {
            analyzeDocument(document);
        }
    });
    // Listen to configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('codeGuardrail')) {
            const newConfig = vscode.workspace.getConfiguration('codeGuardrail');
            client.updateConfig(newConfig.get('serviceUrl', 'http://localhost:3000'));
        }
    }));
    console.log('Code Guardrail extension activated');
}
function deactivate() {
    diagnosticsManager?.dispose();
    statusBar?.dispose();
    serviceManager?.stop();
}
async function analyzeDocument(document) {
    if (!shouldAnalyzeDocument(document)) {
        return;
    }
    const config = vscode.workspace.getConfiguration('codeGuardrail');
    if (!config.get('enabled')) {
        return;
    }
    statusBar.update('analyzing');
    try {
        const result = await client.analyzeCode(document.getText(), document.languageId, vscode.workspace.asRelativePath(document.uri));
        // Filter by severity
        const severityFilter = config.get('severityFilter', ['HIGH', 'MEDIUM', 'LOW', 'INFO']);
        const showInfo = config.get('showInfoSeverity', true);
        const filteredFindings = result.findings.filter((finding) => {
            if (finding.severity === 'INFO' && !showInfo) {
                return false;
            }
            return severityFilter.includes(finding.severity);
        });
        diagnosticsManager.setDiagnostics(document.uri, filteredFindings);
        statusBar.update('connected', filteredFindings.length);
        // Show notification for high-severity issues
        const highSeverity = filteredFindings.filter((f) => f.severity === 'HIGH');
        if (highSeverity.length > 0) {
            const message = `Found ${highSeverity.length} high-severity issue(s) in ${document.fileName}`;
            vscode.window.showWarningMessage(message, 'View Issues').then((selection) => {
                if (selection === 'View Issues') {
                    vscode.commands.executeCommand('workbench.actions.view.problems');
                }
            });
        }
    }
    catch (error) {
        console.error('Analysis error:', error);
        statusBar.update('error');
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Network Error')) {
            // Only show the error message once per session to avoid spam
            if (!global.guardRailServiceErrorShown) {
                global.guardRailServiceErrorShown = true;
                vscode.window
                    .showErrorMessage('Code Guardrail service is not responding. Would you like to start it?', 'Start Service', 'View Logs', 'Dismiss')
                    .then((selection) => {
                    if (selection === 'Start Service') {
                        vscode.commands.executeCommand('codeGuardrail.startService');
                        global.guardRailServiceErrorShown = false; // Reset after user action
                    }
                    else if (selection === 'View Logs') {
                        vscode.commands.executeCommand('workbench.action.output.toggleOutput');
                    }
                });
            }
        }
        else {
            vscode.window.showErrorMessage(`Code analysis failed: ${errorMessage}`, 'View Logs').then(action => {
                if (action === 'View Logs') {
                    vscode.commands.executeCommand('workbench.action.output.toggleOutput');
                }
            });
        }
    }
}
async function analyzeWorkspace() {
    const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
    const config = vscode.workspace.getConfiguration('codeGuardrail');
    const ignoredPatterns = config.get('ignoredFiles', []);
    const filesToAnalyze = files.filter((file) => {
        const relativePath = vscode.workspace.asRelativePath(file);
        return !ignoredPatterns.some((pattern) => {
            return relativePath.match(new RegExp(pattern));
        });
    });
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing workspace',
        cancellable: true
    }, async (progress, token) => {
        let completed = 0;
        for (const file of filesToAnalyze) {
            if (token.isCancellationRequested) {
                break;
            }
            const document = await vscode.workspace.openTextDocument(file);
            if (shouldAnalyzeDocument(document)) {
                await analyzeDocument(document);
            }
            completed++;
            progress.report({
                increment: (100 / filesToAnalyze.length),
                message: `${completed}/${filesToAnalyze.length} files`
            });
        }
    });
    vscode.window.showInformationMessage(`Workspace analysis complete: ${filesToAnalyze.length} files analyzed`);
}
function shouldAnalyzeDocument(document) {
    // Ignore untitled documents
    if (document.isUntitled) {
        return false;
    }
    // Ignore certain schemes
    if (document.uri.scheme !== 'file') {
        return false;
    }
    // Check against ignored patterns
    const config = vscode.workspace.getConfiguration('codeGuardrail');
    const ignoredPatterns = config.get('ignoredFiles', []);
    const relativePath = vscode.workspace.asRelativePath(document.uri);
    return !ignoredPatterns.some((pattern) => {
        return relativePath.match(new RegExp(pattern));
    });
}
//# sourceMappingURL=extension.js.map