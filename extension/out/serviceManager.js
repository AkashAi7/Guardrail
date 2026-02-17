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
exports.ServiceManager = void 0;
const vscode = __importStar(require("vscode"));
const child_process = __importStar(require("child_process"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class ServiceManager {
    constructor() {
        this.process = null;
        this.outputChannel = vscode.window.createOutputChannel('Code Guardrail Service');
    }
    async start() {
        if (this.process) {
            this.outputChannel.appendLine('Service is already running');
            return true;
        }
        const servicePath = await this.findServicePath();
        if (!servicePath) {
            const homeDir = process.env.HOME || process.env.USERPROFILE || '';
            const expectedPath = process.platform === 'win32'
                ? path.join(process.env.LOCALAPPDATA || '', 'Guardrail', 'service')
                : path.join(homeDir, '.guardrail', 'service');
            this.outputChannel.appendLine('Could not find guardrail service in any standard location');
            this.outputChannel.appendLine(`Expected location: ${expectedPath}`);
            this.outputChannel.appendLine('Please install the service using the installation script');
            this.outputChannel.show();
            const action = await vscode.window.showErrorMessage('Code Guardrail service not found. Please install the service first.', 'Open Installation Guide', 'Set Service Path');
            if (action === 'Open Installation Guide') {
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/AkashAi7/Guardrail#installation'));
            }
            else if (action === 'Set Service Path') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'codeGuardrail.servicePath');
            }
            return false;
        }
        this.outputChannel.appendLine(`Starting service from: ${servicePath}`);
        this.outputChannel.show();
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
                        }
                        else {
                            this.outputChannel.appendLine(`Failed to install dependencies (exit code: ${code})`);
                            resolve(false);
                        }
                    });
                }
                else {
                    this.startProcess(servicePath, resolve);
                }
            }
            catch (error) {
                this.outputChannel.appendLine(`Failed to start service: ${error}`);
                resolve(false);
            }
        });
    }
    startProcess(servicePath, resolve) {
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
            }
            else {
                resolve(false);
            }
        }, 3000);
    }
    async stop() {
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
            }
            else {
                resolve();
            }
        });
    }
    async findServicePath() {
        const config = vscode.workspace.getConfiguration('codeGuardrail');
        const configuredPath = config.get('servicePath');
        if (configuredPath && fs.existsSync(configuredPath)) {
            return configuredPath;
        }
        // FIRST: Check standard installation locations
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        const standardPaths = process.platform === 'win32'
            ? [
                path.join(process.env.LOCALAPPDATA || '', 'Guardrail', 'service'),
                path.join(homeDir, '.guardrail', 'service')
            ]
            : [
                path.join(homeDir, '.guardrail', 'service')
            ];
        for (const standardPath of standardPaths) {
            if (fs.existsSync(path.join(standardPath, 'package.json'))) {
                this.outputChannel.appendLine(`Found service at: ${standardPath}`);
                return standardPath;
            }
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
exports.ServiceManager = ServiceManager;
//# sourceMappingURL=serviceManager.js.map