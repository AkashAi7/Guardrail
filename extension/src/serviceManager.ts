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

        // Find service directory
        const servicePath = this.getServicePath();
        if (!servicePath) {
            vscode.window.showWarningMessage(
                'Guardrail backend service not found. Using local pattern matching only.',
                'Learn More'
            ).then(selection => {
                if (selection === 'Learn More') {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/AkashAi7/Guardrail#backend-service'));
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
    private getServicePath(): string | null {
        // Try multiple possible locations
        const possiblePaths = [
            // Development: ../service from extension folder
            path.join(this.context.extensionPath, '..', 'service'),
            // Bundled: service folder inside extension
            path.join(this.context.extensionPath, 'service'),
            // Global installation
            path.join(require('os').homedir(), '.guardrail', 'service')
        ];

        for (const servicePath of possiblePaths) {
            const indexPath = path.join(servicePath, 'dist', 'index.js');
            if (fs.existsSync(indexPath)) {
                console.log(`✅ Found service at: ${servicePath}`);
                return servicePath;
            }
        }

        console.warn('⚠️ Service not found in any expected location');
        return null;
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
