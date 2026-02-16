import * as vscode from 'vscode';

type StatusBarState = 'connected' | 'disconnected' | 'analyzing' | 'error' | 'connecting';

export class StatusBar {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'codeGuardrail.analyzeFile';
    this.update('disconnected');
    this.statusBarItem.show();
  }

  update(state: StatusBarState, issueCount?: number) {
    switch (state) {
      case 'connected':
        this.statusBarItem.text = issueCount !== undefined
          ? `$(shield) Guardrail: ${issueCount} issue${issueCount !== 1 ? 's' : ''}`
          : '$(shield) Guardrail: Ready';
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.tooltip = 'Code Guardrail is connected. Click to analyze current file.';
        break;

      case 'disconnected':
        this.statusBarItem.text = '$(shield) Guardrail: Offline';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.warningBackground'
        );
        this.statusBarItem.tooltip = 'Code Guardrail service is not running. Click to start.';
        this.statusBarItem.command = 'codeGuardrail.startService';
        break;

      case 'analyzing':
        this.statusBarItem.text = '$(loading~spin) Guardrail: Analyzing...';
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.tooltip = 'Analyzing code...';
        break;

      case 'error':
        this.statusBarItem.text = '$(error) Guardrail: Error';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.errorBackground'
        );
        this.statusBarItem.tooltip = 'Code Guardrail encountered an error. Check output for details.';
        break;

      case 'connecting':
        this.statusBarItem.text = '$(loading~spin) Guardrail: Connecting...';
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.tooltip = 'Connecting to Code Guardrail service...';
        break;
    }
  }

  dispose() {
    this.statusBarItem.dispose();
  }
}
