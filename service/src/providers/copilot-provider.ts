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
    this.timeout = config.copilot?.timeout || 60000; // Increase to 60 seconds default
    
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

      const systemMessage = this.governanceRules || 'You are a code analysis assistant that identifies security, compliance, and best practice issues.';
      const userPrompt = this.buildAnalysisPrompt(request);

      console.log(`🔍 Copilot Provider: Analyzing ${request.filePath}...`);

      const session = await this.copilotClient.createSession({
        model: this.config.copilot?.model || 'gpt-4',
        systemMessage: {
          mode: 'replace',
          content: systemMessage,
        },
      });

      const result = await this.performAnalysis(session, request, userPrompt);
      
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
    userPrompt: string
  ): Promise<AnalysisResult> {
    try {
      // Collect the assistant's response
      let responseContent = '';
      
      const done = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error(`⏱️  Timeout after ${this.timeout}ms. Response so far: ${responseContent.substring(0, 100)}`);
          reject(new Error(`Analysis timeout after ${this.timeout}ms`));
        }, this.timeout);

        session.on('assistant.message', (event: any) => {
          console.log('📩 Received assistant.message event');
          responseContent += event.data.content || '';
        });

        session.on('session.idle', () => {
          console.log('✅ Session became idle');
          clearTimeout(timeout);
          resolve();
        });

        session.on('session.error', (event: any) => {
          console.error('❌ Session error event:', event.data?.message);
          clearTimeout(timeout);
          reject(new Error(event.data?.message || 'Session error'));
        });

        console.log('📡 Set up event listeners, sending prompt...');
      });

      // Send the analysis request
      await session.send({ prompt: userPrompt });
      console.log('📤 Prompt sent, waiting for response...');
      await done;

      console.log(`📝 Response received (${responseContent.length} chars)`);

      if (!responseContent) {
        throw new Error('No response from Copilot');
      }

      const result = this.parseAnalysisResponse(responseContent);
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
