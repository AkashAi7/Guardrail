import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export class ServiceManager {
  private process: child_process.ChildProcess | null = null;
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('Code Guardrail Service');
  }

  async start(): Promise<boolean> {
    if (this.process) {
      this.outputChannel.appendLine('Service is already running');
      return true;
    }

    const servicePath = await this.findServicePath();
    if (!servicePath) {
      vscode.window.showErrorMessage(
        'Could not find guardrail service. Please configure the service path in settings.'
      );
      return false;
    }

    this.outputChannel.appendLine(`Starting service from: ${servicePath}`);

    return new Promise((resolve) => {
      try {
        // Check if node_modules exists
        const nodeModulesPath = path.join(servicePath, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
          this.outputChannel.appendLine('Installing dependencies...');
          const installProcess = child_process.spawn('npm', ['install'], {
            cwd: servicePath,
            shell: true
          });

          installProcess.on('close', (code) => {
            if (code === 0) {
              this.startProcess(servicePath, resolve);
            } else {
              this.outputChannel.appendLine(`Failed to install dependencies (exit code: ${code})`);
              resolve(false);
            }
          });
        } else {
          this.startProcess(servicePath, resolve);
        }
      } catch (error) {
        this.outputChannel.appendLine(`Failed to start service: ${error}`);
        resolve(false);
      }
    });
  }

  private startProcess(servicePath: string, resolve: (value: boolean) => void) {
    this.process = child_process.spawn('npm', ['start'], {
      cwd: servicePath,
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development'
      }
    });

    this.process.stdout?.on('data', (data) => {
      this.outputChannel.append(data.toString());
    });

    this.process.stderr?.on('data', (data) => {
      this.outputChannel.append(data.toString());
    });

    this.process.on('error', (error) => {
      this.outputChannel.appendLine(`Service error: ${error.message}`);
    });

    this.process.on('exit', (code) => {
      this.outputChannel.appendLine(`Service exited with code ${code}`);
      this.process = null;
    });

    // Wait a bit for the service to start
    setTimeout(() => {
      if (this.process) {
        this.outputChannel.appendLine('Service started successfully');
        this.outputChannel.show();
        resolve(true);
      } else {
        resolve(false);
      }
    }, 3000);
  }

  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    this.outputChannel.appendLine('Stopping service...');

    return new Promise((resolve) => {
      if (this.process) {
        this.process.on('exit', () => {
          this.outputChannel.appendLine('Service stopped');
          this.process = null;
          resolve();
        });

        // Try graceful shutdown first
        this.process.kill('SIGTERM');

        // Force kill after 5 seconds
        setTimeout(() => {
          if (this.process) {
            this.process.kill('SIGKILL');
            this.process = null;
            resolve();
          }
        }, 5000);
      } else {
        resolve();
      }
    });
  }

  private async findServicePath(): Promise<string | null> {
    const config = vscode.workspace.getConfiguration('codeGuardrail');
    const configuredPath = config.get<string>('servicePath');

    if (configuredPath && fs.existsSync(configuredPath)) {
      return configuredPath;
    }

    // Try to find service in workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      for (const folder of workspaceFolders) {
        const servicePath = path.join(folder.uri.fsPath, 'service');
        if (fs.existsSync(path.join(servicePath, 'package.json'))) {
          return servicePath;
        }
      }

      // Check if we're in the guardrail repo itself
      for (const folder of workspaceFolders) {
        const repoServicePath = path.join(folder.uri.fsPath, '..', 'service');
        if (fs.existsSync(path.join(repoServicePath, 'package.json'))) {
          return path.resolve(repoServicePath);
        }
      }
    }

    // Try common locations relative to extension
    const extensionPath = __dirname;
    const possiblePaths = [
      path.join(extensionPath, '..', '..', 'service'),
      path.join(extensionPath, '..', '..', '..', 'service')
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(path.join(possiblePath, 'package.json'))) {
        return path.resolve(possiblePath);
      }
    }

    return null;
  }

  dispose() {
    this.stop();
    this.outputChannel.dispose();
  }
}
