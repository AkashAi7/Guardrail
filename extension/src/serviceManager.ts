import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, spawnSync, ChildProcess } from 'child_process';

type ProviderMode = 'auto' | 'copilot' | 'byok';
type ByokProvider = 'openai' | 'anthropic' | 'azure-openai';

interface StoredProviderConfig {
    mode: ProviderMode;
    provider?: ByokProvider;
    model?: string;
    endpoint?: string;
    deployment?: string;
}

export class ServiceManager {
    private static readonly providerConfigKey = 'guardrail.providerConfig';
    private static readonly providerSecretKey = 'guardrail.providerApiKey';
    private serviceProcess: ChildProcess | null = null;
    private get servicePort(): number {
        return vscode.workspace.getConfiguration('codeGuardrail').get<number>('servicePort', 3000);
    }
    private get serviceHost(): string {
        return `http://localhost:${this.servicePort}`;
    }
    private isServiceRunning = false;
    private startupAttempts = 0;
    private readonly maxStartupAttempts = 3;
    private startupInProgress: Promise<boolean> | null = null;
    private lastStartupError: string | null = null;

    constructor(private context: vscode.ExtensionContext) {}

    getLastStartupError(): string | null {
        return this.lastStartupError;
    }

    getProviderDisplayLabel(): string {
        const storedConfig = this.getStoredProviderConfig();

        if (storedConfig.mode === 'copilot') {
            return 'GitHub Copilot';
        }

        if (storedConfig.mode === 'byok' && storedConfig.provider) {
            return this.getExternalProviderLabel(storedConfig.provider);
        }

        if (storedConfig.provider) {
            return `Copilot + ${this.getExternalProviderLabel(storedConfig.provider)} fallback`;
        }

        return 'GitHub Copilot (auto)';
    }

    async configureProvider(): Promise<boolean> {
        const selected = await vscode.window.showQuickPick([
            {
                label: 'Microsoft Foundry / Azure OpenAI',
                description: 'Save endpoint, deployment, and API key for an external Azure-hosted model',
                value: 'azure-openai' as const
            },
            {
                label: 'OpenAI',
                description: 'Save an OpenAI API key as an optional external provider',
                value: 'openai' as const
            },
            {
                label: 'Anthropic',
                description: 'Save an Anthropic API key as an optional external provider',
                value: 'anthropic' as const
            },
            {
                label: 'GitHub Copilot Default',
                description: 'Prefer VS Code Copilot models and fall back to a saved external provider when available',
                value: 'auto' as const
            },
            {
                label: 'GitHub Copilot Only',
                description: 'Force Guardrail to use GitHub Copilot only',
                value: 'copilot' as const
            },
            {
                label: 'Clear Saved External Provider',
                description: 'Remove saved Foundry/OpenAI/Anthropic settings and API key',
                value: 'clear' as const
            }
        ], {
            placeHolder: 'Choose how Guardrail should select its AI provider'
        });

        if (!selected) {
            return false;
        }

        if (selected.value === 'clear') {
            await this.clearStoredProviderConfiguration();
            vscode.window.showInformationMessage('Saved BYOK settings cleared.');
            await this.stop();
            return this.start();
        }

        if (selected.value === 'auto' || selected.value === 'copilot') {
            const existing = this.getStoredProviderConfig();
            await this.context.globalState.update(ServiceManager.providerConfigKey, {
                ...existing,
                mode: selected.value
            } satisfies StoredProviderConfig);
            vscode.window.showInformationMessage(`Guardrail provider mode set to ${selected.label}. Restarting service...`);
            await this.stop();
            return this.start();
        }

        const apiKey = await vscode.window.showInputBox({
            prompt: `Enter your ${selected.label} API key`,
            password: true,
            ignoreFocusOut: true,
            validateInput: value => value.trim().length === 0 ? 'API key is required.' : undefined
        });

        if (!apiKey) {
            return false;
        }

        const model = await vscode.window.showInputBox({
            prompt: `Optional model override for ${selected.label}`,
            ignoreFocusOut: true,
            value: selected.value === 'azure-openai' ? 'gpt-4o' : '',
            placeHolder: selected.value === 'azure-openai' ? 'Example: gpt-4o or your Foundry deployment model' : 'Leave blank to use the provider default'
        });

        let endpoint: string | undefined;
        let deployment: string | undefined;

        if (selected.value === 'azure-openai') {
            endpoint = await vscode.window.showInputBox({
                prompt: 'Azure OpenAI / Foundry endpoint',
                ignoreFocusOut: true,
                placeHolder: 'https://your-resource.openai.azure.com',
                validateInput: value => {
                    const trimmed = value.trim();
                    if (!trimmed) {
                        return 'Endpoint is required.';
                    }
                    return /^https?:\/\//i.test(trimmed) ? undefined : 'Endpoint must start with http:// or https://';
                }
            });

            if (!endpoint) {
                return false;
            }

            deployment = await vscode.window.showInputBox({
                prompt: 'Azure OpenAI deployment name',
                ignoreFocusOut: true,
                validateInput: value => value.trim().length === 0 ? 'Deployment name is required.' : undefined
            });

            if (!deployment) {
                return false;
            }
        }

        const modePick = await vscode.window.showQuickPick([
            {
                label: 'Use this provider by default',
                description: 'Guardrail will start directly in BYOK mode',
                value: 'byok' as const
            },
            {
                label: 'Use as fallback after Copilot',
                description: 'Guardrail will prefer Copilot when available',
                value: 'auto' as const
            }
        ], {
            placeHolder: 'Choose how Guardrail should use the saved key'
        });

        if (!modePick) {
            return false;
        }

        const storedConfig: StoredProviderConfig = {
            mode: modePick.value,
            provider: selected.value,
            model: model?.trim() || undefined,
            endpoint: endpoint?.trim().replace(/\/+$/, '') || undefined,
            deployment: deployment?.trim() || undefined
        };

        await this.context.globalState.update(ServiceManager.providerConfigKey, storedConfig);
        await this.context.secrets.store(ServiceManager.providerSecretKey, apiKey.trim());

        vscode.window.showInformationMessage(`${selected.label} credentials saved. Restarting Guardrail AI service...`);
        await this.stop();
        return this.start();
    }

    /**
     * Start the backend service
     */
    async start(): Promise<boolean> {
        if (this.startupInProgress) {
            return this.startupInProgress;
        }

        this.lastStartupError = null;

        this.startupInProgress = this.startInternal();
        try {
            return await this.startupInProgress;
        } finally {
            this.startupInProgress = null;
        }
    }

    private async startInternal(): Promise<boolean> {
        // Check if service is already running
        if (await this.checkServiceHealth()) {
            console.log('✅ Service already running');
            this.isServiceRunning = true;
            return true;
        }

        const runtimeCheck = this.validateNodeRuntime();
        if (!runtimeCheck.ok) {
            const runtimeMessage = runtimeCheck.message || 'Guardrail AI could not validate the local Node.js runtime.';
            this.lastStartupError = runtimeMessage;
            vscode.window.showErrorMessage(runtimeMessage, 'Open Node.js Downloads').then(selection => {
                if (selection === 'Open Node.js Downloads') {
                    vscode.env.openExternal(vscode.Uri.parse('https://nodejs.org/en/download'));
                }
            });
            return false;
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
            this.startupAttempts = 0;
            
            // Wait a bit for graceful shutdown
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    /**
     * Check if service is healthy
     */
    async checkServiceHealth(): Promise<boolean> {
        try {
            const response = await this.makeRequest('/health', {
                method: 'GET',
                timeout: 2000
            });
            return response.status === 'ok' && response.service === 'guardrail-service';
        } catch {
            return false;
        }
    }

    private async waitForHealthyService(timeoutMs = 4000, intervalMs = 500): Promise<boolean> {
        const deadline = Date.now() + timeoutMs;

        while (Date.now() < deadline) {
            if (await this.checkServiceHealth()) {
                return true;
            }

            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        return false;
    }

    private async handleAddressInUse(settle: (value: boolean) => void): Promise<void> {
        const connectedToExistingService = await this.waitForHealthyService();

        if (connectedToExistingService) {
            this.isServiceRunning = true;
            this.lastStartupError = null;
            vscode.window.showInformationMessage(`Connected to an existing Guardrail AI service on port ${this.servicePort}.`);
            settle(true);
            return;
        }

        const portConflictMessage = `Port ${this.servicePort} is already in use by another process. Stop the process using that port or change the codeGuardrail.servicePort setting.`;
        this.lastStartupError = portConflictMessage;
        vscode.window.showErrorMessage(portConflictMessage, 'Open Settings').then(selection => {
            if (selection === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'codeGuardrail.servicePort');
            }
        });
        settle(false);
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
    async makeRequest(endpoint: string, options?: {
        method?: 'GET' | 'POST' | 'DELETE';
        headers?: Record<string, string>;
        body?: any;
        queryParams?: Record<string, string>;
        timeout?: number;
    }): Promise<any> {
        const {
            method = 'GET',
            headers = {},
            body = null,
            queryParams = {},
            timeout = 30000
        } = options || {};

        // Build URL with query parameters
        let url = `${this.serviceHost}${endpoint}`;
        const queryString = Object.entries(queryParams)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        if (queryString) {
            url += `?${queryString}`;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const fetchOptions: RequestInit = {
                method,
                headers: {
                    ...headers
                },
                signal: controller.signal
            };

            // Handle body - support both JSON and raw Buffer
            if (body !== null) {
                if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
                    // Raw body (e.g., file upload)
                    fetchOptions.body = body;
                } else if (typeof body === 'object') {
                    // JSON body (default behavior)
                    if (!fetchOptions.headers) fetchOptions.headers = {};
                    (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
                    fetchOptions.body = JSON.stringify(body);
                } else {
                    // String or other primitive
                    fetchOptions.body = body;
                }
            }

            const response = await fetch(url, fetchOptions);
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
        const homeServicePath = path.join(require('os').homedir(), '.guardrail-service');
        const devServicePath = path.join(this.context.extensionPath, '..', 'service');
        const bundledServicePath = path.join(this.context.extensionPath, 'bundled-service');

        // Priority 1: Packaged installs should run the bundled service directly so updates
        // always use the code shipped in the current VSIX instead of a stale extracted copy.
        const bundledIndexPath = path.join(bundledServicePath, 'dist', 'index.js');
        const bundledExpressPath = path.join(bundledServicePath, 'node_modules', 'express');
        if (fs.existsSync(bundledIndexPath) && fs.existsSync(bundledExpressPath)) {
            console.log(`✅ Found bundled service at: ${bundledServicePath}`);
            return bundledServicePath;
        }
        
        // Priority 2: Check extracted service in home directory (legacy fallback)
        const homeIndexPath = path.join(homeServicePath, 'dist', 'index.js');
        const homeExpressPath = path.join(homeServicePath, 'node_modules', 'express');
        if (fs.existsSync(homeIndexPath) && fs.existsSync(homeExpressPath)) {
            console.log(`✅ Found installed service at: ${homeServicePath}`);
            return homeServicePath;
        }

        // Priority 3: Development mode - service folder next to extension (has express installed)
        const devIndexPath = path.join(devServicePath, 'dist', 'index.js');
        const devExpressPath = path.join(devServicePath, 'node_modules', 'express');
        if (fs.existsSync(devIndexPath) && fs.existsSync(devExpressPath)) {
            console.log(`✅ Found dev service at: ${devServicePath}`);
            return devServicePath;
        }

        // Priority 4: Extract bundled service to home directory and install deps
        console.log('⚙️ Service not found with dependencies, extracting bundled service...');
        const extracted = await this.extractBundledService();
        if (extracted) {
            return homeServicePath;
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

            const packagedNodeModules = path.join(targetPath, 'node_modules', 'express');
            if (fs.existsSync(packagedNodeModules)) {
                console.log('✅ Using prebundled service dependencies');
                vscode.window.showInformationMessage('✅ Guardrail AI service is packaged and ready.');
                return true;
            }

            // Fallback for legacy bundles without node_modules
            console.log('📥 Legacy bundle detected, installing service dependencies...');
            vscode.window.showInformationMessage('⚙️ Finishing Guardrail AI service setup...');

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
            console.log(`📦 Running npm install in: ${servicePath}`);

            const installProcess = spawn(this.getNpmExecutable(), ['install', '--production'], {
                cwd: servicePath,
                stdio: ['ignore', 'pipe', 'pipe'],
                shell: false
            });

            let output = '';
            installProcess.stdout?.on('data', (data) => {
                const text = data.toString();
                output += text;
                console.log(`[npm] ${text.trim()}`);
            });

            installProcess.stderr?.on('data', (data) => {
                const text = data.toString();
                output += text;
                console.log(`[npm stderr] ${text.trim()}`);
            });

            installProcess.on('error', (err) => {
                console.error(`❌ npm spawn error: ${err.message}`);
                vscode.window.showErrorMessage(`Failed to run npm install: ${err.message}`);
                resolve(false);
            });

            installProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ npm install completed successfully');
                    resolve(true);
                } else {
                    console.error(`❌ npm install failed with code ${code}:`, output);
                    this.lastStartupError = output.trim() || `npm install failed with code ${code}`;
                    vscode.window.showErrorMessage('npm install failed while preparing Guardrail AI service.');
                    resolve(false);
                }
            });

            // Timeout after 3 minutes (npm can be slow)
            setTimeout(() => {
                console.error('❌ npm install timeout');
                installProcess.kill();
                resolve(false);
            }, 180000);
        });
    }

    /**
     * Start the service process
     */
    private async startService(servicePath: string, isRetry = false): Promise<boolean> {
        if (!isRetry) {
            this.startupAttempts = 0;
        }

        if (this.startupAttempts >= this.maxStartupAttempts) {
            vscode.window.showErrorMessage('Failed to start Guardrail service after multiple attempts. Using local mode.');
            return false;
        }

        this.startupAttempts++;

        return new Promise(async (resolve) => {
            console.log('🚀 Starting Guardrail service...');
            
            const indexPath = path.join(servicePath, 'dist', 'index.js');
            console.log(`Service index path: ${indexPath}`);
            console.log(`Service path exists: ${fs.existsSync(indexPath)}`);

            const nodeExecutable = this.getNodeExecutable();
            console.log(`Using node executable: ${nodeExecutable}`);

            const serviceEnv = await this.getServiceEnvironment();
            const errorBuffer: string[] = [];
            let addressInUseDetected = false;
            let settled = false;
            const settle = (value: boolean) => {
                if (!settled) {
                    settled = true;
                    resolve(value);
                }
            };
            
            // Start the service
            this.serviceProcess = spawn(nodeExecutable, [indexPath], {
                cwd: servicePath,
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: false, // Keep as child process
                shell: false,
                env: serviceEnv
            });

            // Handle spawn errors (e.g., node not found)
            this.serviceProcess.on('error', (err) => {
                console.error(`❌ Failed to spawn service process: ${err.message}`);
                this.lastStartupError = err.message;
                vscode.window.showErrorMessage(`Failed to start service: ${err.message}. Is Node.js installed?`);
                settle(false);
            });

            // Handle stdout
            this.serviceProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                console.log(`[Service] ${output}`);
                
                // Check if service started successfully
                if (output.includes('Server running on')) {
                    this.isServiceRunning = true;
                    this.lastStartupError = null;
                    vscode.window.showInformationMessage('✅ Guardrail AI service started successfully!');
                    settle(true);
                }
            });

            // Handle stderr - capture all errors
            this.serviceProcess.stderr?.on('data', (data) => {
                const error = data.toString().trim();
                console.error(`[Service stderr] ${error}`);
                if (error) {
                    errorBuffer.push(error);
                    this.lastStartupError = errorBuffer.slice(-8).join('\n');
                }

                if (error.includes('EADDRINUSE') || error.includes('address already in use')) {
                    addressInUseDetected = true;
                    void this.handleAddressInUse(settle);
                    return;
                }
                
                // Check for critical Node.js errors
                if (error.includes('ERR_UNKNOWN_BUILTIN_MODULE') || 
                    error.includes('node:sqlite') ||
                    error.includes('Cannot find module')) {
                    const detectedVersion = this.getInstalledNodeVersion();
                    vscode.window.showErrorMessage(
                        `Guardrail requires Node.js 24 or newer. Detected ${detectedVersion}. If this version is already new enough, another Node runtime or a startup module mismatch is causing the backend failure.`
                    );
                }
            });

            // Handle process exit
            this.serviceProcess.on('exit', (code) => {
                console.log(`Service exited with code ${code}`);
                this.isServiceRunning = false;
                this.serviceProcess = null;

                if (settled) {
                    return;
                }

                if (addressInUseDetected) {
                    settle(false);
                    return;
                }
                
                if (code !== 0 && code !== null) {
                    vscode.window.showWarningMessage(
                        'Guardrail service stopped unexpectedly. Attempting to restart...'
                    );
                    
                    // Self-healing: try to restart the service up to maxStartupAttempts
                    if (this.startupAttempts < this.maxStartupAttempts) {
                        setTimeout(() => {
                            this.startService(servicePath, true).then(settle);
                        }, 2000);
                    } else {
                        if (!this.lastStartupError) {
                            this.lastStartupError = errorBuffer.slice(-8).join('\n') || `Service exited with code ${code}`;
                        }
                        vscode.window.showErrorMessage('Guardrail service failed to restart. Falling back to local scanning.');
                        settle(false);
                    }
                } else {
                    settle(false);
                }
            });

            // Timeout check - Copilot startup can take a while on first boot
            setTimeout(async () => {
                if (!this.isServiceRunning && !settled) {
                    const isHealthy = await this.checkServiceHealth();
                    if (isHealthy) {
                        this.isServiceRunning = true;
                        this.lastStartupError = null;
                        vscode.window.showInformationMessage('✅ Guardrail AI service connected!');
                        settle(true);
                    } else {
                        if (!this.lastStartupError) {
                            this.lastStartupError = errorBuffer.slice(-8).join('\n') || 'Service did not become healthy before the startup timeout.';
                        }
                        console.warn('⚠️ Service did not start in time, using local mode');
                        await this.stop();
                        settle(false);
                    }
                }
            }, 20000);
        });
    }

    private getNodeExecutable(): string {
        return process.platform === 'win32' ? 'node.exe' : 'node';
    }

    private getNpmExecutable(): string {
        return process.platform === 'win32' ? 'npm.cmd' : 'npm';
    }

    private getInstalledNodeVersion(): string {
        const nodeExecutable = this.getNodeExecutable();
        const versionResult = spawnSync(nodeExecutable, ['--version'], {
            encoding: 'utf8',
            shell: false
        });

        if (versionResult.error || versionResult.status !== 0) {
            return 'unknown';
        }

        return (versionResult.stdout || '').trim() || 'unknown';
    }

    private validateNodeRuntime(): { ok: boolean; message?: string } {
        const versionText = this.getInstalledNodeVersion();

        if (versionText === 'unknown') {
            return {
                ok: false,
                message: 'Guardrail AI requires a system Node.js installation (v24 or newer) to run the packaged backend service.'
            };
        }

        const versionMatch = versionText.match(/^v?(\d+)\.(\d+)\.(\d+)/);
        if (!versionMatch) {
            return {
                ok: false,
                message: `Guardrail AI could not determine your Node.js version from "${versionText}".`
            };
        }

        const major = parseInt(versionMatch[1], 10);
        if (major < 24) {
            return {
                ok: false,
                message: `Guardrail AI requires Node.js 24 or newer because the bundled GitHub Copilot SDK depends on it. Detected ${versionText}.`
            };
        }

        return { ok: true };
    }

    private getStoredProviderConfig(): StoredProviderConfig {
        return this.context.globalState.get<StoredProviderConfig>(ServiceManager.providerConfigKey, { mode: 'auto' });
    }

    private getExternalProviderLabel(provider: ByokProvider): string {
        switch (provider) {
            case 'azure-openai':
                return 'Microsoft Foundry / Azure OpenAI';
            case 'anthropic':
                return 'Anthropic';
            case 'openai':
                return 'OpenAI';
        }
    }

    private async getServiceEnvironment(): Promise<NodeJS.ProcessEnv> {
        const storedConfig = this.getStoredProviderConfig();
        const apiKey = await this.context.secrets.get(ServiceManager.providerSecretKey);
        const env: NodeJS.ProcessEnv = {
            ...process.env,
            NODE_ENV: 'production',
            PORT: this.servicePort.toString(),
            COPILOT_MODEL: vscode.workspace.getConfiguration('codeGuardrail').get<string>('model', 'gpt-4'),
            PROVIDER_MODE: storedConfig.mode || 'auto'
        };

        if (!storedConfig.provider || !apiKey) {
            return env;
        }

        if (storedConfig.model) {
            env.BYOK_MODEL = storedConfig.model;
        }

        if (storedConfig.provider === 'azure-openai') {
            env.AZURE_OPENAI_KEY = apiKey;
            if (storedConfig.endpoint) {
                env.AZURE_OPENAI_ENDPOINT = storedConfig.endpoint;
            }
            if (storedConfig.deployment) {
                env.AZURE_OPENAI_DEPLOYMENT = storedConfig.deployment;
            }
            return env;
        }

        if (storedConfig.provider === 'openai') {
            env.OPENAI_API_KEY = apiKey;
            return env;
        }

        if (storedConfig.provider === 'anthropic') {
            env.ANTHROPIC_API_KEY = apiKey;
        }

        return env;
    }

    private async clearStoredProviderConfiguration(): Promise<void> {
        await this.context.globalState.update(ServiceManager.providerConfigKey, { mode: 'auto' } satisfies StoredProviderConfig);
        await this.context.secrets.delete(ServiceManager.providerSecretKey);
    }
}
