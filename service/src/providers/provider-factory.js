/**
 * Provider Factory
 * Automatically selects the best available LLM provider
 */
import { CopilotDetector } from '../auth/copilot-detector.js';
import { CopilotProvider } from './copilot-provider.js';
import { BYOKProvider } from './byok-provider.js';
export class ProviderFactory {
    /**
     * Create an LLM provider based on configuration and auto-detection
     */
    static async createProvider(config) {
        console.log(`🏭 Provider Factory: Creating provider (mode: ${config.mode})...`);
        // Mode 1: Force Copilot
        if (config.mode === 'copilot') {
            return await this.createCopilotProvider(config);
        }
        // Mode 2: Force BYOK
        if (config.mode === 'byok') {
            return await this.createBYOKProvider(config);
        }
        // Mode 3: Auto - Try Copilot first, fall back to BYOK
        if (config.mode === 'auto') {
            // Try Copilot first
            const copilotStatus = await new CopilotDetector().detect();
            if (copilotStatus.available && copilotStatus.authenticated) {
                console.log('✅ Auto-detected: Using GitHub Copilot provider');
                return await this.createCopilotProvider(config);
            }
            console.log('⚠️ Copilot not available, checking BYOK configuration...');
            // Fall back to BYOK if configured
            if (config.byok?.apiKey) {
                console.log('✅ Using BYOK provider');
                return await this.createBYOKProvider(config);
            }
            // Neither available
            throw new Error('No LLM provider available. Please:\n' +
                '1. Install and authenticate GitHub Copilot in VS Code, OR\n' +
                '2. Configure BYOK with API keys (OpenAI/Anthropic/Azure)');
        }
        throw new Error(`Invalid provider mode: ${config.mode}`);
    }
    static async createCopilotProvider(config) {
        try {
            const provider = new CopilotProvider(config);
            const isAvailable = await provider.isAvailable();
            if (!isAvailable) {
                throw new Error('Copilot provider is not available');
            }
            const info = provider.getInfo();
            console.log(`✅ Copilot Provider initialized: ${info.model}`);
            return provider;
        }
        catch (error) {
            throw new Error(`Failed to initialize Copilot provider: ${error.message}`);
        }
    }
    static async createBYOKProvider(config) {
        try {
            if (!config.byok) {
                throw new Error('BYOK configuration is required but not provided');
            }
            const provider = new BYOKProvider(config);
            const isAvailable = await provider.isAvailable();
            if (!isAvailable) {
                throw new Error('BYOK provider is not available (check API keys)');
            }
            const info = provider.getInfo();
            console.log(`✅ BYOK Provider initialized: ${info.name} (${info.model})`);
            return provider;
        }
        catch (error) {
            throw new Error(`Failed to initialize BYOK provider: ${error.message}`);
        }
    }
    /**
     * Get status of all available providers (for diagnostics)
     */
    static async getAvailableProviders() {
        const detector = new CopilotDetector();
        const copilotStatus = await detector.detect();
        const copilotAvailable = copilotStatus.available && copilotStatus.authenticated;
        // BYOK availability depends on environment variables
        const byokAvailable = !!(process.env.OPENAI_API_KEY ||
            process.env.ANTHROPIC_API_KEY ||
            process.env.AZURE_OPENAI_KEY);
        let recommended = 'none';
        if (copilotAvailable) {
            recommended = 'copilot'; // Prefer Copilot (included in subscription)
        }
        else if (byokAvailable) {
            recommended = 'byok';
        }
        return {
            copilot: copilotAvailable,
            byok: byokAvailable,
            recommended
        };
    }
}
