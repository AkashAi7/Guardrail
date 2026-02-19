import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

export class ServiceManager {
    private serviceProcess: ChildProcess | null = null;
    private readonly servicePort = 3000;
    private readonly serviceHost = 'http://localhost:3000';
    private isServiceRunning = false;
    private startupAttempts = 0;
    private readonly maxStartupAttempts = 3;

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Start the backend service
     */
    async start(): Promise<boolean> {
        // Check if service is already running
        if (await this.checkServiceHealth()) {
            console.log('✅ Service already running');
            this.isServiceRunning = true;
            return true;
        }

        // Find service directory (may trigger auto-extraction)
        const servicePath = await this.getServicePath();
        if (!servicePath) {
            vscode.window.showWarningMessage(
                'Guardrail AI service unavailable. The extension requires the service to function.',
                'Learn More'
            ).then(selection => {
                if (selection === 'Learn More') {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/AkashAi7/Guardrail#installation'));
                }
            });
            return false;
        }

        // Start the service
        return this.startService(servicePath);
    }

    /**
     * Stop the backend service
     */
    async stop(): Promise<void> {
        if (this.serviceProcess) {
            console.log('🛑 Stopping Guardrail service...');
            this.serviceProcess.kill('SIGTERM');
            this.serviceProcess = null;
            this.isServiceRunning = false;
            
            // Wait a bit for graceful shutdown
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    /**
     * Check if service is healthy
     */
    async checkServiceHealth(): Promise<boolean> {
        try {
            const response = await this.makeRequest('/health', 'GET', null, 2000);
            return response.status === 'ok';
        } catch {
            return false;
        }
    }

    /**
     * Get service status
     */
    isRunning(): boolean {
        return this.isServiceRunning;
    }

    /**
     * Get service URL
     */
    getServiceUrl(): string {
        return this.serviceHost;
    }

    /**
     * Make a request to the backend service
     */
    async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body: any = null, timeout: number = 30000): Promise<any> {
        const url = `${this.serviceHost}${endpoint}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const options: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    /**
     * Find the service directory
     */
    private async getServicePath(): Promise<string | null> {
        // Try multiple possible locations
        const possiblePaths = [
            // Development: ../service from extension folder
            path.join(this.context.extensionPath, '..', 'service'),
            // Bundled: service folder inside extension
            path.join(this.context.extensionPath, 'service'),
            // User's home directory (auto-extracted)
            path.join(require('os').homedir(), '.guardrail-service')
        ];

        for (const servicePath of possiblePaths) {
            const indexPath = path.join(servicePath, 'dist', 'index.js');
            if (fs.existsSync(indexPath)) {
                console.log(`✅ Found service at: ${servicePath}`);
                return servicePath;
            }
        }

        // If not found, try to extract bundled service
        console.log('⚙️ Service not found, checking for bundled service...');
        const extracted = await this.extractBundledService();
        if (extracted) {
            return path.join(require('os').homedir(), '.guardrail-service');
        }

        console.warn('⚠️ Service not found in any expected location');
        return null;
    }

    /**
     * Extract bundled service to user's home directory and install dependencies
     */
    private async extractBundledService(): Promise<boolean> {
        const bundledServicePath = path.join(this.context.extensionPath, 'bundled-service');
        const targetPath = path.join(require('os').homedir(), '.guardrail-service');

        // Check if bundled service exists
        if (!fs.existsSync(bundledServicePath)) {
            console.log('❌ No bundled service found');
            return false;
        }

        try {
            console.log('📦 Extracting bundled service...');
            
            // Copy bundled service to target location
            if (fs.existsSync(targetPath)) {
                // Clean existing installation
                fs.rmSync(targetPath, { recursive: true, force: true });
            }
            
            this.copyRecursiveSync(bundledServicePath, targetPath);
            console.log(`✅ Service extracted to: ${targetPath}`);

            // Install dependencies
            console.log('📥 Installing service dependencies (one-time setup)...');
            vscode.window.showInformationMessage('⚙️ Setting up Guardrail AI service (one-time operation)...');
            
            const installed = await this.installServiceDependencies(targetPath);
            if (installed) {
                console.log('✅ Service setup complete!');
                vscode.window.showInformationMessage('✅ Guardrail AI service ready!');
                return true;
            } else {
                console.error('❌ Failed to install service dependencies');
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to extract bundled service:', error);
            return false;
        }
    }

    /**
     * Recursively copy directory
     */
    private copyRecursiveSync(src: string, dest: string): void {
        if (fs.statSync(src).isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            fs.readdirSync(src).forEach(item => {
                this.copyRecursiveSync(path.join(src, item), path.join(dest, item));
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    }

    /**
     * Install service dependencies using npm
     */
    private async installServiceDependencies(servicePath: string): Promise<boolean> {
        return new Promise((resolve) => {
            const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
            
            const installProcess = spawn(npmCmd, ['install', '--production', '--silent'], {
                cwd: servicePath,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let output = '';
            installProcess.stdout?.on('data', (data) => {
                output += data.toString();
            });

            installProcess.stderr?.on('data', (data) => {
                output += data.toString();
            });

            installProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ npm install completed');
                    resolve(true);
                } else {
                    console.error('❌ npm install failed:', output);
                    resolve(false);
                }
            });

            // Timeout after 2 minutes
            setTimeout(() => {
                installProcess.kill();
                resolve(false);
            }, 120000);
        });
    }

    /**
     * Start the service process
     */
    private async startService(servicePath: string): Promise<boolean> {
        if (this.startupAttempts >= this.maxStartupAttempts) {
            vscode.window.showErrorMessage('Failed to start Guardrail service after multiple attempts. Using local mode.');
            return false;
        }

        this.startupAttempts++;

        return new Promise((resolve) => {
            console.log('🚀 Starting Guardrail service...');
            
            const indexPath = path.join(servicePath, 'dist', 'index.js');
            const nodeExecutable = process.execPath; // Use same Node.js as VS Code
            
            // Start the service
            this.serviceProcess = spawn(nodeExecutable, [indexPath], {
                cwd: servicePath,
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: false, // Keep as child process
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    PORT: this.servicePort.toString()
                }
            });

            // Handle stdout
            this.serviceProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                console.log(`[Service] ${output}`);
                
                // Check if service started successfully
                if (output.includes('Server running on')) {
                    this.isServiceRunning = true;
                    vscode.window.showInformationMessage('✅ Guardrail AI service started successfully!');
                    resolve(true);
                }
            });

            // Handle stderr
            this.serviceProcess.stderr?.on('data', (data) => {
                const error = data.toString();
                console.error(`[Service Error] ${error}`);
                
                // Don't show all errors - some are just warnings
                if (error.includes('ERROR') || error.includes('FATAL')) {
                    console.error('Service error:', error);
                }
            });

            // Handle process exit
            this.serviceProcess.on('exit', (code) => {
                console.log(`Service exited with code ${code}`);
                this.isServiceRunning = false;
                this.serviceProcess = null;
                
                if (code !== 0 && code !== null) {
                    vscode.window.showWarningMessage(
                        'Guardrail service stopped unexpectedly. Falling back to local scanning.'
                    );
                }
            });

            // Handle errors
            this.serviceProcess.on('error', (error) => {
                console.error('Failed to start service:', error);
                this.isServiceRunning = false;
                this.serviceProcess = null;
                resolve(false);
            });

            // Timeout check - if service doesn't start in 10 seconds, assume failure
            setTimeout(async () => {
                if (!this.isServiceRunning) {
                    const isHealthy = await this.checkServiceHealth();
                    if (isHealthy) {
                        this.isServiceRunning = true;
                        vscode.window.showInformationMessage('✅ Guardrail AI service connected!');
                        resolve(true);
                    } else {
                        console.warn('⚠️ Service did not start in time, using local mode');
                        this.stop();
                        resolve(false);
                    }
                }
            }, 10000);
        });
    }
}
