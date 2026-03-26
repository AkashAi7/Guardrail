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
    }
    /**
     * Start the backend service
     */
    async start() {
        // Check if service is already running
        if (await this.checkServiceHealth()) {
            console.log('✅ Service already running');
            this.isServiceRunning = true;
            return true;
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
            // Install dependencies
            console.log('📥 Installing service dependencies (one-time setup)...');
            vscode.window.showInformationMessage('⚙️ Setting up Guardrail AI service (one-time operation)...');
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
            // Use 'npm' and shell:true to ensure npm is found via PATH
            const installProcess = (0, child_process_1.spawn)('npm', ['install', '--production'], {
                cwd: servicePath,
                stdio: ['ignore', 'pipe', 'pipe'],
                shell: true // Required on Windows to find npm in PATH
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
                    vscode.window.showErrorMessage(`npm install failed. Try manually: cd ~/.guardrail-service && npm install`);
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
    async startService(servicePath) {
        if (this.startupAttempts >= this.maxStartupAttempts) {
            vscode.window.showErrorMessage('Failed to start Guardrail service after multiple attempts. Using local mode.');
            return false;
        }
        this.startupAttempts++;
        return new Promise((resolve) => {
            console.log('🚀 Starting Guardrail service...');
            const indexPath = path.join(servicePath, 'dist', 'index.js');
            console.log(`Service index path: ${indexPath}`);
            console.log(`Service path exists: ${fs.existsSync(indexPath)}`);
            // Use system Node.js (not VS Code's bundled one) - required for Node.js 22+ features
            // Use 'node' without extension - shell will resolve it on both platforms
            const nodeExecutable = 'node';
            console.log(`Using node executable: ${nodeExecutable}`);
            // Start the service
            this.serviceProcess = (0, child_process_1.spawn)(nodeExecutable, [indexPath], {
                cwd: servicePath,
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: false, // Keep as child process
                shell: true, // Use shell to find system node
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    PORT: this.servicePort.toString(),
                    COPILOT_MODEL: vscode.workspace.getConfiguration('codeGuardrail').get('model', 'gpt-4')
                }
            });
            // Handle spawn errors (e.g., node not found)
            this.serviceProcess.on('error', (err) => {
                console.error(`❌ Failed to spawn service process: ${err.message}`);
                vscode.window.showErrorMessage(`Failed to start service: ${err.message}. Is Node.js installed?`);
                resolve(false);
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
            // Handle stderr - capture all errors
            this.serviceProcess.stderr?.on('data', (data) => {
                const error = data.toString().trim();
                console.error(`[Service stderr] ${error}`);
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
                            this.startService(servicePath);
                        }, 2000);
                    }
                    else {
                        vscode.window.showErrorMessage('Guardrail service failed to restart. Falling back to local scanning.');
                        resolve(false);
                    }
                }
                else {
                    resolve(false);
                }
            });
            // Timeout check - if service doesn't start in 10 seconds, assume failure
            setTimeout(async () => {
                if (!this.isServiceRunning) {
                    const isHealthy = await this.checkServiceHealth();
                    if (isHealthy) {
                        this.isServiceRunning = true;
                        vscode.window.showInformationMessage('✅ Guardrail AI service connected!');
                        resolve(true);
                    }
                    else {
                        console.warn('⚠️ Service did not start in time, using local mode');
                        this.stop();
                        resolve(false);
                    }
                }
            }, 10000);
        });
    }
}
exports.ServiceManager = ServiceManager;
//# sourceMappingURL=serviceManager.js.map