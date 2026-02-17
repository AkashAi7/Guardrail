/**
 * GitHub Copilot Provider
 * Uses @github/copilot-sdk to leverage user's existing Copilot subscription
 */
import { CopilotClient } from '@github/copilot-sdk';
import { BaseProvider } from './base-provider.js';
export class CopilotProvider extends BaseProvider {
    copilotClient;
    isInitialized = false;
    constructor(config) {
        super(config);
        this.timeout = config.copilot?.timeout || 10000;
        this.copilotClient = new CopilotClient();
    }
    async isAvailable() {
        try {
            if (!this.isInitialized) {
                await this.copilotClient.start();
                this.isInitialized = true;
            }
            return true;
        }
        catch (error) {
            console.error('❌ Copilot provider not available:', error);
            return false;
        }
    }
    getInfo() {
        return {
            name: 'GitHub Copilot',
            type: 'copilot',
            model: this.config.copilot?.model || 'gpt-4',
            authenticated: this.isInitialized,
            subscriptionType: 'github-copilot',
            estimatedCostPer1KTokens: 0 // Included in subscription
        };
    }
    async analyze(request) {
        const startTime = Date.now();
        try {
            if (!this.isInitialized) {
                await this.copilotClient.start();
                this.isInitialized = true;
            }
            const systemPrompt = this.governanceRules
                ? `${this.governanceRules}\n\n${this.buildAnalysisPrompt(request)}`
                : this.buildAnalysisPrompt(request);
            console.log(`🔍 Copilot Provider: Analyzing ${request.filePath}...`);
            const session = await this.copilotClient.createSession();
            const result = await this.performAnalysis(session, request, systemPrompt);
            await session.destroy();
            const analysisTime = Date.now() - startTime;
            return {
                ...result,
                filePath: request.filePath,
                analysisTime
            };
        }
        catch (error) {
            console.error('❌ Copilot analysis failed:', error);
            throw error;
        }
    }
    async performAnalysis(session, request, systemPrompt) {
        return new Promise((resolve, reject) => {
            let responseText = '';
            const timeoutId = setTimeout(() => {
                reject(new Error('Analysis timeout'));
            }, this.timeout);
            session.on('assistant.message', (message) => {
                if (message.data && message.data.content) {
                    responseText += message.data.content;
                }
            });
            session.on('session.idle', () => {
                clearTimeout(timeoutId);
                try {
                    const result = this.parseAnalysisResponse(responseText);
                    console.log(`✅ Copilot analysis complete: ${result.summary.totalIssues} issues`);
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            });
            session.on('session.error', (error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
            // Send the analysis request
            session.prompt(systemPrompt).catch(reject);
        });
    }
    async cleanup() {
        if (this.isInitialized) {
            try {
                await this.copilotClient.stop();
                this.isInitialized = false;
                console.log('✅ Copilot provider cleaned up');
            }
            catch (error) {
                console.error('❌ Error cleaning up Copilot provider:', error);
            }
        }
    }
}
