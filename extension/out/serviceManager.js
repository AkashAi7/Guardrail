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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
class ServiceManager {
    get servicePort() {
        return vscode.workspace.getConfiguration('codeGuardrail').get('servicePort', 3000);
    }
    get serviceHost() {
        return `http://localhost:${this.servicePort}`;
    }
    constructor(context) {
        this.context = context;
        this.serviceProcess = null;
        this.isServiceRunning = false;
        this.startupAttempts = 0;
        this.maxStartupAttempts = 3;
        this.startupInProgress = null;
        this.lastStartupError = null;
    }
    getLastStartupError() {
        return this.lastStartupError;
    }
    getProviderDisplayLabel() {
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
    async configureProvider() {
        const selected = await vscode.window.showQuickPick([
            {
                label: 'Microsoft Foundry / Azure OpenAI',
                description: 'Save endpoint, deployment, and API key for an external Azure-hosted model',
                value: 'azure-openai'
            },
            {
                label: 'OpenAI',
                description: 'Save an OpenAI API key as an optional external provider',
                value: 'openai'
            },
            {
                label: 'Anthropic',
                description: 'Save an Anthropic API key as an optional external provider',
                value: 'anthropic'
            },
            {
                label: 'GitHub Copilot Default',
                description: 'Prefer VS Code Copilot models and fall back to a saved external provider when available',
                value: 'auto'
            },
            {
                label: 'GitHub Copilot Only',
                description: 'Force Guardrail to use GitHub Copilot only',
                value: 'copilot'
            },
            {
                label: 'Clear Saved External Provider',
                description: 'Remove saved Foundry/OpenAI/Anthropic settings and API key',
                value: 'clear'
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
            });
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
        let endpoint;
        let deployment;
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
                value: 'byok'
            },
            {
                label: 'Use as fallback after Copilot',
                description: 'Guardrail will prefer Copilot when available',
                value: 'auto'
            }
        ], {
            placeHolder: 'Choose how Guardrail should use the saved key'
        });
        if (!modePick) {
            return false;
        }
        const storedConfig = {
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
    async start() {
        if (this.startupInProgress) {
            return this.startupInProgress;
        }
        this.lastStartupError = null;
        this.startupInProgress = this.startInternal();
        try {
            return await this.startupInProgress;
        }
        finally {
            this.startupInProgress = null;
        }
    }
    async startInternal() {
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
            vscode.window.showWarningMessage('Guardrail AI service unavailable. The extension requires the service to function.', 'Learn More').then(selection => {
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
    async stop() {
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
    async checkServiceHealth() {
        try {
            const response = await this.makeRequest('/health', {
                method: 'GET',
                timeout: 2000
            });
            return response.status === 'ok';
        }
        catch {
            return false;
        }
    }
    /**
     * Get service status
     */
    isRunning() {
        return this.isServiceRunning;
    }
    /**
     * Get service URL
     */
    getServiceUrl() {
        return this.serviceHost;
    }
    /**
     * Make a request to the backend service
     */
    async makeRequest(endpoint, options) {
        const { method = 'GET', headers = {}, body = null, queryParams = {}, timeout = 30000 } = options || {};
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
            const fetchOptions = {
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
                }
                else if (typeof body === 'object') {
                    // JSON body (default behavior)
                    if (!fetchOptions.headers)
                        fetchOptions.headers = {};
                    fetchOptions.headers['Content-Type'] = 'application/json';
                    fetchOptions.body = JSON.stringify(body);
                }
                else {
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
        }
        catch (error) {
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
    async getServicePath() {
        const homeServicePath = path.join(require('os').homedir(), '.guardrail-service');
        const devServicePath = path.join(this.context.extensionPath, '..', 'service');
        // Priority 1: Check extracted service in home directory (has express installed)
        const homeIndexPath = path.join(homeServicePath, 'dist', 'index.js');
        const homeExpressPath = path.join(homeServicePath, 'node_modules', 'express');
        if (fs.existsSync(homeIndexPath) && fs.existsSync(homeExpressPath)) {
            console.log(`✅ Found installed service at: ${homeServicePath}`);
            return homeServicePath;
        }
        // Priority 2: Development mode - service folder next to extension (has express installed)
        const devIndexPath = path.join(devServicePath, 'dist', 'index.js');
        const devExpressPath = path.join(devServicePath, 'node_modules', 'express');
        if (fs.existsSync(devIndexPath) && fs.existsSync(devExpressPath)) {
            console.log(`✅ Found dev service at: ${devServicePath}`);
            return devServicePath;
        }
        // Priority 3: Extract bundled service to home directory and install deps
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
    async extractBundledService() {
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
            }
            else {
                console.error('❌ Failed to install service dependencies');
                return false;
            }
        }
        catch (error) {
            console.error('❌ Failed to extract bundled service:', error);
            return false;
        }
    }
    /**
     * Recursively copy directory
     */
    copyRecursiveSync(src, dest) {
        if (fs.statSync(src).isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            fs.readdirSync(src).forEach(item => {
                this.copyRecursiveSync(path.join(src, item), path.join(dest, item));
            });
        }
        else {
            fs.copyFileSync(src, dest);
        }
    }
    /**
     * Install service dependencies using npm
     */
    async installServiceDependencies(servicePath) {
        return new Promise((resolve) => {
            console.log(`📦 Running npm install in: ${servicePath}`);
            const installProcess = (0, child_process_1.spawn)(this.getNpmExecutable(), ['install', '--production'], {
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
                }
                else {
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
    async startService(servicePath, isRetry = false) {
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
            const errorBuffer = [];
            let settled = false;
            const settle = (value) => {
                if (!settled) {
                    settled = true;
                    resolve(value);
                }
            };
            // Start the service
            this.serviceProcess = (0, child_process_1.spawn)(nodeExecutable, [indexPath], {
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
                // Check for critical Node.js errors
                if (error.includes('ERR_UNKNOWN_BUILTIN_MODULE') ||
                    error.includes('node:sqlite') ||
                    error.includes('Cannot find module')) {
                    vscode.window.showErrorMessage(`Guardrail requires Node.js 22.5.0+. Current Node.js may be outdated.`);
                }
            });
            // Handle process exit
            this.serviceProcess.on('exit', (code) => {
                console.log(`Service exited with code ${code}`);
                this.isServiceRunning = false;
                this.serviceProcess = null;
                if (code !== 0 && code !== null) {
                    vscode.window.showWarningMessage('Guardrail service stopped unexpectedly. Attempting to restart...');
                    // Self-healing: try to restart the service up to maxStartupAttempts
                    if (this.startupAttempts < this.maxStartupAttempts) {
                        setTimeout(() => {
                            this.startService(servicePath, true).then(settle);
                        }, 2000);
                    }
                    else {
                        if (!this.lastStartupError) {
                            this.lastStartupError = errorBuffer.slice(-8).join('\n') || `Service exited with code ${code}`;
                        }
                        vscode.window.showErrorMessage('Guardrail service failed to restart. Falling back to local scanning.');
                        settle(false);
                    }
                }
                else {
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
                    }
                    else {
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
    getNodeExecutable() {
        return process.platform === 'win32' ? 'node.exe' : 'node';
    }
    getNpmExecutable() {
        return process.platform === 'win32' ? 'npm.cmd' : 'npm';
    }
    validateNodeRuntime() {
        const nodeExecutable = this.getNodeExecutable();
        const versionResult = (0, child_process_1.spawnSync)(nodeExecutable, ['--version'], {
            encoding: 'utf8',
            shell: false
        });
        if (versionResult.error || versionResult.status !== 0) {
            return {
                ok: false,
                message: 'Guardrail AI requires a system Node.js installation (v24 or newer) to run the packaged backend service.'
            };
        }
        const versionText = (versionResult.stdout || '').trim();
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
    getStoredProviderConfig() {
        return this.context.globalState.get(ServiceManager.providerConfigKey, { mode: 'auto' });
    }
    getExternalProviderLabel(provider) {
        switch (provider) {
            case 'azure-openai':
                return 'Microsoft Foundry / Azure OpenAI';
            case 'anthropic':
                return 'Anthropic';
            case 'openai':
                return 'OpenAI';
        }
    }
    async getServiceEnvironment() {
        const storedConfig = this.getStoredProviderConfig();
        const apiKey = await this.context.secrets.get(ServiceManager.providerSecretKey);
        const env = {
            ...process.env,
            NODE_ENV: 'production',
            PORT: this.servicePort.toString(),
            COPILOT_MODEL: vscode.workspace.getConfiguration('codeGuardrail').get('model', 'gpt-4'),
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
    async clearStoredProviderConfiguration() {
        await this.context.globalState.update(ServiceManager.providerConfigKey, { mode: 'auto' });
        await this.context.secrets.delete(ServiceManager.providerSecretKey);
    }
}
exports.ServiceManager = ServiceManager;
ServiceManager.providerConfigKey = 'guardrail.providerConfig';
ServiceManager.providerSecretKey = 'guardrail.providerApiKey';
//# sourceMappingURL=serviceManager.js.map