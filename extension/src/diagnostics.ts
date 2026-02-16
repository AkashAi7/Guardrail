import * as vscode from 'vscode';
import { Finding } from './client';

export class DiagnosticsManager {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private findingsMap: Map<string, Finding[]>;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('codeGuardrail');
    this.findingsMap = new Map();
  }

  setDiagnostics(uri: vscode.Uri, findings: Finding[]) {
    // Store findings for later reference (for code actions)
    this.findingsMap.set(uri.toString(), findings);

    // Convert findings to VS Code diagnostics
    const diagnostics: vscode.Diagnostic[] = findings.map((finding) => {
      const line = Math.max(0, finding.line - 1); // Convert to 0-based
      const column = finding.column ? Math.max(0, finding.column - 1) : 0;

      // Try to determine the range more intelligently
      const range = new vscode.Range(
        new vscode.Position(line, column),
        new vscode.Position(line, column + (finding.snippet?.length || 100))
      );

      const diagnostic = new vscode.Diagnostic(
        range,
        this.formatDiagnosticMessage(finding),
        this.severityToDiagnosticSeverity(finding.severity)
      );

      diagnostic.code = finding.id;
      diagnostic.source = 'Code Guardrail';

      // Add related information
      if (finding.references && finding.references.length > 0) {
        diagnostic.relatedInformation = finding.references.map((ref) => {
          return new vscode.DiagnosticRelatedInformation(
            new vscode.Location(uri, range),
            `${ref.title}: ${ref.url}`
          );
        });
      }

      return diagnostic;
    });

    this.diagnosticCollection.set(uri, diagnostics);
  }

  getFindings(uri: vscode.Uri): Finding[] {
    return this.findingsMap.get(uri.toString()) || [];
  }

  getFinding(uri: vscode.Uri, line: number): Finding | undefined {
    const findings = this.getFindings(uri);
    // Line is 0-based from VS Code, findings use 1-based
    return findings.find((f) => f.line - 1 === line);
  }

  clear(uri?: vscode.Uri) {
    if (uri) {
      this.diagnosticCollection.delete(uri);
      this.findingsMap.delete(uri.toString());
    } else {
      this.diagnosticCollection.clear();
      this.findingsMap.clear();
    }
  }

  dispose() {
    this.diagnosticCollection.dispose();
    this.findingsMap.clear();
  }

  private formatDiagnosticMessage(finding: Finding): string {
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

  private severityToDiagnosticSeverity(
    severity: Finding['severity']
  ): vscode.DiagnosticSeverity {
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
