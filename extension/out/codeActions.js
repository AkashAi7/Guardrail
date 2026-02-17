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
exports.CodeActionsProvider = void 0;
exports.registerCodeActionCommands = registerCodeActionCommands;
const vscode = __importStar(require("vscode"));
class CodeActionsProvider {
    constructor(diagnosticsManager) {
        this.diagnosticsManager = diagnosticsManager;
    }
    provideCodeActions(document, range, context, token) {
        const codeActions = [];
        // Get findings for this document at the current line
        const finding = this.diagnosticsManager.getFinding(document.uri, range.start.line);
        if (!finding) {
            return undefined;
        }
        // Quick fix action if auto-fixable
        if (finding.autoFixable && finding.suggestedFix) {
            const fixAction = new vscode.CodeAction(`Fix: ${finding.title}`, vscode.CodeActionKind.QuickFix);
            fixAction.edit = new vscode.WorkspaceEdit();
            // Apply the suggested fix
            // For now, we'll replace the entire line
            // In a more sophisticated version, we'd parse the AST or use better range detection
            const line = document.lineAt(range.start.line);
            fixAction.edit.replace(document.uri, line.range, finding.suggestedFix);
            fixAction.diagnostics = context.diagnostics.filter((d) => d.code === finding.id);
            codeActions.push(fixAction);
        }
        // Show explanation action
        const explainAction = new vscode.CodeAction(`Explain: ${finding.title}`, vscode.CodeActionKind.Empty);
        explainAction.command = {
            command: 'codeGuardrail.showExplanation',
            title: 'Show Explanation',
            arguments: [finding]
        };
        codeActions.push(explainAction);
        // View references action
        if (finding.references && finding.references.length > 0) {
            const refsAction = new vscode.CodeAction('View References', vscode.CodeActionKind.Empty);
            refsAction.command = {
                command: 'codeGuardrail.showReferences',
                title: 'View References',
                arguments: [finding.references]
            };
            codeActions.push(refsAction);
        }
        // Ignore this issue action
        const ignoreAction = new vscode.CodeAction('Ignore this issue', vscode.CodeActionKind.Empty);
        ignoreAction.edit = new vscode.WorkspaceEdit();
        const position = new vscode.Position(range.start.line, 0);
        ignoreAction.edit.insert(document.uri, position, `// guardrail-ignore: ${finding.id} - \n`);
        codeActions.push(ignoreAction);
        return codeActions;
    }
}
exports.CodeActionsProvider = CodeActionsProvider;
CodeActionsProvider.providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
];
// Register command handlers for code actions
function registerCodeActionCommands(context) {
    context.subscriptions.push(vscode.commands.registerCommand('codeGuardrail.showExplanation', (finding) => {
        const panel = vscode.window.createWebviewPanel('guardrailExplanation', `Code Guardrail: ${finding.title}`, vscode.ViewColumn.Two, {});
        panel.webview.html = getExplanationHtml(finding);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeGuardrail.showReferences', (references) => {
        const items = references.map((ref) => ({
            label: ref.title,
            description: ref.url,
            url: ref.url
        }));
        vscode.window.showQuickPick(items).then((selected) => {
            if (selected) {
                vscode.env.openExternal(vscode.Uri.parse(selected.url));
            }
        });
    }));
}
function getExplanationHtml(finding) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${finding.title}</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          padding: 20px;
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
        }
        h1 {
          color: var(--vscode-errorForeground);
          border-bottom: 2px solid var(--vscode-errorForeground);
          padding-bottom: 10px;
        }
        h2 {
          color: var(--vscode-textLink-foreground);
          margin-top: 20px;
        }
        .severity {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 3px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .severity.HIGH {
          background-color: #f14c4c;
          color: white;
        }
        .severity.MEDIUM {
          background-color: #cca700;
          color: white;
        }
        .severity.LOW {
          background-color: #0e639c;
          color: white;
        }
        .severity.INFO {
          background-color: #00aa00;
          color: white;
        }
        .category {
          display: inline-block;
          padding: 4px 8px;
          background-color: var(--vscode-badge-background);
          color: var(--vscode-badge-foreground);
          border-radius: 3px;
          margin-left: 10px;
        }
        pre {
          background-color: var(--vscode-textCodeBlock-background);
          padding: 10px;
          border-radius: 5px;
          overflow-x: auto;
        }
        code {
          font-family: var(--vscode-editor-font-family);
        }
        .compliance {
          background-color: var(--vscode-inputValidation-warningBackground);
          border-left: 4px solid var(--vscode-inputValidation-warningBorder);
          padding: 10px;
          margin: 10px 0;
        }
        .references {
          list-style: none;
          padding: 0;
        }
        .references li {
          margin: 5px 0;
        }
        .references a {
          color: var(--vscode-textLink-foreground);
          text-decoration: none;
        }
        .references a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <h1>${finding.title}</h1>
      <div>
        <span class="severity ${finding.severity}">${finding.severity}</span>
        <span class="category">${finding.category}</span>
      </div>

      <h2>Description</h2>
      <p>${finding.description}</p>

      <h2>Explanation</h2>
      <p>${finding.explanation}</p>

      ${finding.snippet ? `
        <h2>Problematic Code</h2>
        <pre><code>${escapeHtml(finding.snippet)}</code></pre>
      ` : ''}

      ${finding.suggestedFix ? `
        <h2>Suggested Fix</h2>
        <pre><code>${escapeHtml(finding.suggestedFix)}</code></pre>
      ` : ''}

      ${finding.complianceRefs && finding.complianceRefs.length > 0 ? `
        <h2>Compliance Requirements</h2>
        <div class="compliance">
          <strong>Standards:</strong> ${finding.complianceRefs.join(', ')}
        </div>
      ` : ''}

      ${finding.references && finding.references.length > 0 ? `
        <h2>References</h2>
        <ul class="references">
          ${finding.references.map((ref) => `
            <li>📚 <a href="${ref.url}">${ref.title}</a></li>
          `).join('')}
        </ul>
      ` : ''}
    </body>
    </html>
  `;
}
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
//# sourceMappingURL=codeActions.js.map