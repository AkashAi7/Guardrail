import * as vscode from 'vscode';
import { GuardrailClient } from './client';
import { DiagnosticsManager } from './diagnostics';
import { CodeActionsProvider } from './codeActions';
import { ServiceManager } from './serviceManager';
import { StatusBar } from './statusBar';

let client: GuardrailClient;
let diagnosticsManager: DiagnosticsManager;
let serviceManager: ServiceManager;
let statusBar: StatusBar;

export async function activate(context: vscode.ExtensionContext) {
  console.log('Code Guardrail extension activating...');

  // Initialize components
  client = new GuardrailClient();
  diagnosticsManager = new DiagnosticsManager();
  serviceManager = new ServiceManager();
  statusBar = new StatusBar();

  // Check service status
  const isConnected = await client.checkHealth();
  statusBar.update(isConnected ? 'connected' : 'disconnected');

  // Auto-start service if configured
  const config = vscode.workspace.getConfiguration('codeGuardrail');
  if (!isConnected && config.get('autoStartService')) {
    await serviceManager.start();
    const connected = await client.checkHealth();
    statusBar.update(connected ? 'connected' : 'disconnected');
  }

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('codeGuardrail.analyzeFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      await analyzeDocument(editor.document);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codeGuardrail.analyzeWorkspace', async () => {
      await analyzeWorkspace();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codeGuardrail.clearDiagnostics', () => {
      diagnosticsManager.clear();
      vscode.window.showInformationMessage('Cleared all Code Guardrail issues');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codeGuardrail.startService', async () => {
      statusBar.update('connecting');
      const success = await serviceManager.start();
      if (success) {
        statusBar.update('connected');
        vscode.window.showInformationMessage('Code Guardrail service started');
      } else {
        statusBar.update('disconnected');
        vscode.window.showErrorMessage('Failed to start Code Guardrail service');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codeGuardrail.stopService', async () => {
      await serviceManager.stop();
      statusBar.update('disconnected');
      vscode.window.showInformationMessage('Code Guardrail service stopped');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codeGuardrail.reloadGovernance', async () => {
      try {
        await client.reloadGovernance();
        vscode.window.showInformationMessage('Governance rules reloaded');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to reload governance: ${error}`);
      }
    })
  );

  // Register code actions provider
  const codeActionsProvider = new CodeActionsProvider(diagnosticsManager);
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { scheme: 'file' },
      codeActionsProvider,
      {
        providedCodeActionKinds: CodeActionsProvider.providedCodeActionKinds
      }
    )
  );

  // Listen to document changes
  const config = vscode.workspace.getConfiguration('codeGuardrail');

  if (config.get('autoAnalyzeOnSave')) {
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (shouldAnalyzeDocument(document)) {
          analyzeDocument(document);
        }
      })
    );
  }

  if (config.get('autoAnalyzeOnType')) {
    let timeout: NodeJS.Timeout | undefined;
    const debounceMs = config.get('analyzeOnTypeDebounce', 2000);

    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (!shouldAnalyzeDocument(event.document)) {
          return;
        }

        if (timeout) {
          clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
          analyzeDocument(event.document);
        }, debounceMs);
      })
    );
  }

  // Analyze open documents on startup
  vscode.workspace.textDocuments.forEach((document) => {
    if (shouldAnalyzeDocument(document)) {
      analyzeDocument(document);
    }
  });

  // Listen to configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('codeGuardrail')) {
        const newConfig = vscode.workspace.getConfiguration('codeGuardrail');
        client.updateConfig(
          newConfig.get('serviceUrl', 'http://localhost:3000')
        );
      }
    })
  );

  console.log('Code Guardrail extension activated');
}

export function deactivate() {
  diagnosticsManager?.dispose();
  statusBar?.dispose();
  serviceManager?.stop();
}

async function analyzeDocument(document: vscode.TextDocument) {
  if (!shouldAnalyzeDocument(document)) {
    return;
  }

  const config = vscode.workspace.getConfiguration('codeGuardrail');
  if (!config.get('enabled')) {
    return;
  }

  statusBar.update('analyzing');

  try {
    const result = await client.analyzeCode(
      document.getText(),
      document.languageId,
      vscode.workspace.asRelativePath(document.uri)
    );

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
  } catch (error) {
    console.error('Analysis error:', error);
    statusBar.update('error');

    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Network Error')) {
      vscode.window
        .showErrorMessage(
          'Code Guardrail service is not running',
          'Start Service',
          'Configure'
        )
        .then((selection) => {
          if (selection === 'Start Service') {
            vscode.commands.executeCommand('codeGuardrail.startService');
          } else if (selection === 'Configure') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'codeGuardrail');
          }
        });
    } else {
      vscode.window.showErrorMessage(`Code Guardrail analysis failed: ${errorMessage}`);
    }
  }
}

async function analyzeWorkspace() {
  const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');

  const config = vscode.workspace.getConfiguration('codeGuardrail');
  const ignoredPatterns = config.get('ignoredFiles', []);

  const filesToAnalyze = files.filter((file) => {
    const relativePath = vscode.workspace.asRelativePath(file);
    return !ignoredPatterns.some((pattern: string) => {
      return relativePath.match(new RegExp(pattern));
    });
  });

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Analyzing workspace',
      cancellable: true
    },
    async (progress, token) => {
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
    }
  );

  vscode.window.showInformationMessage(
    `Workspace analysis complete: ${filesToAnalyze.length} files analyzed`
  );
}

function shouldAnalyzeDocument(document: vscode.TextDocument): boolean {
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
  const ignoredPatterns = config.get('ignoredFiles', []) as string[];
  const relativePath = vscode.workspace.asRelativePath(document.uri);

  return !ignoredPatterns.some((pattern) => {
    return relativePath.match(new RegExp(pattern));
  });
}
