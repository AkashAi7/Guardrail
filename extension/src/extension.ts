import * as vscode from 'vscode';
import { SecurityScanner, Finding } from './scanner';

let diagnosticCollection: vscode.DiagnosticCollection;
let scanner: SecurityScanner;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Guardrail activating...');
    
    // Initialize components
    diagnosticCollection = vscode.languages.createDiagnosticCollection('code-guardrail');
    scanner = new SecurityScanner();
    
    // Create status bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(shield) Guardrail';
    statusBarItem.tooltip = 'Code Guardrail - Security Scanner Active';
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
    
    // Register on save handler
    const onSave = vscode.workspace.onDidSaveTextDocument((document) => {
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
        onSave,
        onOpen
    );
    
    vscode.window.showInformationMessage('Code Guardrail is active! Scanning for security issues.');
    console.log('Code Guardrail activated successfully');
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
        statusBarItem.text = `$(shield) Guardrail: ${findings.length} issue(s)`;
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
        statusBarItem.text = '$(shield) Guardrail: Clean';
        statusBarItem.backgroundColor = undefined;
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

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
