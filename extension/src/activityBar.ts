import * as vscode from 'vscode';

export interface GuardrailSidebarState {
    serviceStatus: string;
    providerLabel: string;
    scanMode: string;
    model: string;
    totalIssues: number;
    criticalIssues: number;
}

export class GuardrailSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'codeGuardrail.dashboardView';

    private view?: vscode.WebviewView;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly getState: () => GuardrailSidebarState
    ) {}

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (typeof message?.command === 'string') {
                await vscode.commands.executeCommand(message.command);
            }
        });

        this.refresh();
    }

    refresh(): void {
        if (!this.view) {
            return;
        }

        const state = this.getState();
        this.view.webview.html = this.getHtml(this.view.webview, state);
    }

    private getHtml(webview: vscode.Webview, state: GuardrailSidebarState): string {
        const issueTone = state.criticalIssues > 0 ? 'critical' : state.totalIssues > 0 ? 'warning' : 'clean';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: var(--vscode-sideBar-background);
            padding: 12px;
        }
        .hero {
            border: 1px solid var(--vscode-sideBar-border);
            border-radius: 12px;
            padding: 14px;
            background: linear-gradient(135deg, rgba(12, 90, 156, 0.18), rgba(26, 111, 74, 0.12));
            margin-bottom: 12px;
        }
        .hero h2 {
            margin: 0 0 6px 0;
            font-size: 16px;
        }
        .hero p {
            margin: 0;
            color: var(--vscode-descriptionForeground);
            line-height: 1.4;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            margin-bottom: 12px;
        }
        .stat {
            border-radius: 10px;
            padding: 10px;
            border: 1px solid var(--vscode-sideBar-border);
            background: var(--vscode-editorWidget-background);
        }
        .stat .label {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
        }
        .stat .value {
            font-weight: 700;
            line-height: 1.3;
        }
        .value.critical {
            color: var(--vscode-errorForeground);
        }
        .value.warning {
            color: var(--vscode-editorWarning-foreground);
        }
        .value.clean {
            color: var(--vscode-testing-iconPassed);
        }
        .section {
            margin-top: 12px;
        }
        .section h3 {
            margin: 0 0 8px 0;
            font-size: 12px;
            text-transform: uppercase;
            color: var(--vscode-descriptionForeground);
            letter-spacing: 0.06em;
        }
        button {
            width: 100%;
            margin-bottom: 8px;
            border: 1px solid var(--vscode-button-border, transparent);
            border-radius: 8px;
            padding: 9px 10px;
            text-align: left;
            cursor: pointer;
            color: var(--vscode-button-foreground);
            background: var(--vscode-button-background);
        }
        button.secondary {
            color: var(--vscode-foreground);
            background: var(--vscode-editorWidget-background);
            border-color: var(--vscode-sideBar-border);
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        button.secondary:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .hint {
            margin-top: 10px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="hero">
        <h2>Guardrail Control Center</h2>
        <p>Copilot-first analysis with optional Microsoft Foundry, OpenAI, or Anthropic fallback.</p>
    </div>

    <div class="grid">
        <div class="stat">
            <span class="label">Service</span>
            <div class="value">${state.serviceStatus}</div>
        </div>
        <div class="stat">
            <span class="label">Provider</span>
            <div class="value">${state.providerLabel}</div>
        </div>
        <div class="stat">
            <span class="label">Model</span>
            <div class="value">${state.model}</div>
        </div>
        <div class="stat">
            <span class="label">Scan Mode</span>
            <div class="value">${state.scanMode}</div>
        </div>
    </div>

    <div class="stat">
        <span class="label">Findings</span>
        <div class="value ${issueTone}">${state.totalIssues} total, ${state.criticalIssues} critical</div>
    </div>

    <div class="section">
        <h3>Run</h3>
        <button onclick="run('codeGuardrail.analyzeFile')">Analyze Current File</button>
        <button onclick="run('codeGuardrail.scanProject')">Scan Entire Project</button>
        <button class="secondary" onclick="run('codeGuardrail.showIssuesPanel')">Open Findings Panel</button>
    </div>

    <div class="section">
        <h3>AI Setup</h3>
        <button onclick="run('codeGuardrail.chooseModel')">Choose Copilot Model</button>
        <button onclick="run('codeGuardrail.configureAiProvider')">Configure Foundry / 3P Provider</button>
        <button class="secondary" onclick="run('codeGuardrail.restartService')">Restart AI Service</button>
    </div>

    <div class="section">
        <h3>Rules</h3>
        <button class="secondary" onclick="run('codeGuardrail.manageRules')">Manage Rules</button>
        <button class="secondary" onclick="run('codeGuardrail.uploadComplianceDocument')">Upload Compliance Document</button>
    </div>

    <div class="hint">
        Default path: GitHub Copilot models from VS Code. External providers stay optional and can be saved as fallback or forced mode.
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        function run(command) {
            vscode.postMessage({ command });
        }
    </script>
</body>
</html>`;
    }
}