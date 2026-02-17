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
const scanner_1 = require("./scanner");
let diagnosticCollection;
let scanner;
let statusBarItem;
function activate(context) {
    console.log('Code Guardrail activating...');
    // Initialize components
    diagnosticCollection = vscode.languages.createDiagnosticCollection('code-guardrail');
    scanner = new scanner_1.SecurityScanner();
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
        }
        else {
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
    context.subscriptions.push(diagnosticCollection, statusBarItem, analyzeCmd, clearCmd, onSave, onOpen);
    vscode.window.showInformationMessage('Code Guardrail is active! Scanning for security issues.');
    console.log('Code Guardrail activated successfully');
}
function shouldAnalyze(document) {
    if (document.uri.scheme !== 'file')
        return false;
    if (document.isUntitled)
        return false;
    const supportedExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cs', '.go', '.rb', '.php'];
    return supportedExtensions.some(ext => document.fileName.endsWith(ext));
}
function analyzeDocument(document) {
    const text = document.getText();
    const findings = scanner.scan(text, document.fileName);
    const diagnostics = findings.map(finding => {
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
    }
    else {
        statusBarItem.text = '$(shield) Guardrail: Clean';
        statusBarItem.backgroundColor = undefined;
    }
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
function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
//# sourceMappingURL=extension.js.map