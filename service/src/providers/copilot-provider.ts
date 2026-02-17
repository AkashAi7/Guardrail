/**
 * GitHub Copilot Provider
 * Uses @github/copilot-sdk to leverage user's existing Copilot subscription
 */

import { CopilotClient, CopilotSession } from '@github/copilot-sdk';
import type { AnalysisRequest, AnalysisResult } from '../types/index.js';
import { BaseProvider, type ProviderConfig, type ProviderInfo } from './base-provider.js';

export class CopilotProvider extends BaseProvider {
  private copilotClient: CopilotClient;
  private isInitialized: boolean = false;

  constructor(config: ProviderConfig) {
    super(config);
    this.timeout = config.copilot?.timeout || 10000;
    
    this.copilotClient = new CopilotClient();
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.copilotClient.start();
        this.isInitialized = true;
      }
      return true;
    } catch (error: any) {
      console.error('❌ Copilot provider not available:', error.message);
      // Don't throw, just return false so factory can try fallback
      return false;
    }
  }

  getInfo(): ProviderInfo {
    return {
      name: 'GitHub Copilot',
      type: 'copilot',
      model: this.config.copilot?.model || 'gpt-4',
      authenticated: this.isInitialized,
      subscriptionType: 'github-copilot',
      estimatedCostPer1KTokens: 0 // Included in subscription
    };
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
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

    } catch (error) {
      console.error('❌ Copilot analysis failed:', error);
      throw error;
    }
  }

  private async performAnalysis(
    session: CopilotSession, 
    request: AnalysisRequest,
    systemPrompt: string
  ): Promise<AnalysisResult> {
    try {
      // Use sendAndWait - it automatically handles the response
      const response = await session.sendAndWait(
        { prompt: systemPrompt },
        this.timeout
      );

      if (!response || !response.data.content) {
        throw new Error('No response from Copilot');
      }

      const result = this.parseAnalysisResponse(response.data.content);
      console.log(`✅ Copilot analysis complete: ${result.summary.totalIssues} issues`);
      return result;

    } catch (error: any) {
      console.error('❌ Copilot session error:', error.message);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.isInitialized) {
      try {
        await this.copilotClient.stop();
        this.isInitialized = false;
        console.log('✅ Copilot provider cleaned up');
      } catch (error) {
        console.error('❌ Error cleaning up Copilot provider:', error);
      }
    }
  }
}
