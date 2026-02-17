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
exports.DiagnosticsManager = void 0;
const vscode = __importStar(require("vscode"));
class DiagnosticsManager {
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('codeGuardrail');
        this.findingsMap = new Map();
    }
    setDiagnostics(uri, findings) {
        // Store findings for later reference (for code actions)
        this.findingsMap.set(uri.toString(), findings);
        // Convert findings to VS Code diagnostics
        const diagnostics = findings.map((finding) => {
            const line = Math.max(0, finding.line - 1); // Convert to 0-based
            const column = finding.column ? Math.max(0, finding.column - 1) : 0;
            // Try to determine the range more intelligently
            const range = new vscode.Range(new vscode.Position(line, column), new vscode.Position(line, column + (finding.snippet?.length || 100)));
            const diagnostic = new vscode.Diagnostic(range, this.formatDiagnosticMessage(finding), this.severityToDiagnosticSeverity(finding.severity));
            diagnostic.code = finding.id;
            diagnostic.source = 'Code Guardrail';
            // Add related information
            if (finding.references && finding.references.length > 0) {
                diagnostic.relatedInformation = finding.references.map((ref) => {
                    return new vscode.DiagnosticRelatedInformation(new vscode.Location(uri, range), `${ref.title}: ${ref.url}`);
                });
            }
            return diagnostic;
        });
        this.diagnosticCollection.set(uri, diagnostics);
    }
    getFindings(uri) {
        return this.findingsMap.get(uri.toString()) || [];
    }
    getFinding(uri, line) {
        const findings = this.getFindings(uri);
        // Line is 0-based from VS Code, findings use 1-based
        return findings.find((f) => f.line - 1 === line);
    }
    clear(uri) {
        if (uri) {
            this.diagnosticCollection.delete(uri);
            this.findingsMap.delete(uri.toString());
        }
        else {
            this.diagnosticCollection.clear();
            this.findingsMap.clear();
        }
    }
    dispose() {
        this.diagnosticCollection.dispose();
        this.findingsMap.clear();
    }
    formatDiagnosticMessage(finding) {
        let message = `[${finding.category}] ${finding.title}: ${finding.description}`;
        if (finding.complianceRefs && finding.complianceRefs.length > 0) {
            message += `\n\n📋 Compliance: ${finding.complianceRefs.join(', ')}`;
        }
        if (finding.explanation) {
            message += `\n\n${finding.explanation}`;
        }
        if (finding.suggestedFix) {
            message += `\n\n💡 Suggested Fix:\n${finding.suggestedFix}`;
        }
        return message;
    }
    severityToDiagnosticSeverity(severity) {
        switch (severity) {
            case 'HIGH':
                return vscode.DiagnosticSeverity.Error;
            case 'MEDIUM':
                return vscode.DiagnosticSeverity.Warning;
            case 'LOW':
                return vscode.DiagnosticSeverity.Information;
            case 'INFO':
                return vscode.DiagnosticSeverity.Hint;
            default:
                return vscode.DiagnosticSeverity.Warning;
        }
    }
}
exports.DiagnosticsManager = DiagnosticsManager;
//# sourceMappingURL=diagnostics.js.map