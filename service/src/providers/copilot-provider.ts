/**
 * GitHub Copilot Provider
 * Uses @github/copilot-sdk to leverage user's existing Copilot subscription
 * 
 * Uses the modern sendAndWait() API with streaming support for real-time analysis.
 * The SDK manages Copilot CLI lifecycle automatically via JSON-RPC.
 */

import { CopilotClient, SessionEvent } from '@github/copilot-sdk';
import type { AnalysisRequest, AnalysisResult } from '../types/index.js';
import { BaseProvider, type ProviderConfig, type ProviderInfo } from './base-provider.js';

export class CopilotProvider extends BaseProvider {
  private copilotClient: CopilotClient;
  private isInitialized: boolean = false;

  constructor(config: ProviderConfig) {
    super(config);
    this.timeout = config.copilot?.timeout || 120000; // 2 min default for complex analysis
    
    this.copilotClient = new CopilotClient();
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Quick test: create a minimal session to verify auth
      const testSession = await this.copilotClient.createSession({
        model: this.config.copilot?.model || 'gpt-4.1',
      });
      // If createSession succeeds, SDK is available and authenticated
      this.isInitialized = true;
      return true;
    } catch (error: any) {
      console.error('❌ Copilot provider not available:', error.message);
      if (error.code === 'ENOENT') {
        console.error('   Copilot CLI not found. Install: https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('   Cannot connect to Copilot server');
      }
      return false;
    }
  }

  getInfo(): ProviderInfo {
    return {
      name: 'GitHub Copilot SDK',
      type: 'copilot',
      model: this.config.copilot?.model || 'gpt-4.1',
      authenticated: this.isInitialized,
      subscriptionType: 'github-copilot',
      estimatedCostPer1KTokens: 0 // Included in subscription
    };
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      const systemMessage = this.governanceRules || 
        'You are a code analysis assistant that identifies security vulnerabilities, compliance violations, and best practice issues. Always respond with valid JSON.';
      const userPrompt = this.buildAnalysisPrompt(request);

      console.log(`🔍 Copilot SDK: Analyzing ${request.filePath} with model ${this.config.copilot?.model || 'gpt-4.1'}...`);

      // Create a session with system message for governance context
      const session = await this.copilotClient.createSession({
        model: this.config.copilot?.model || 'gpt-4.1',
        systemMessage: {
          content: systemMessage,
        },
      });

      // Use sendAndWait for reliable response collection with timeout
      const response = await session.sendAndWait(
        { prompt: userPrompt },
        this.timeout
      );

      const responseContent = response?.data?.content || '';
      console.log(`📝 Response received (${responseContent.length} chars)`);

      if (!responseContent) {
        throw new Error('No response from Copilot SDK');
      }

      const result = this.parseAnalysisResponse(responseContent);
      const analysisTime = Date.now() - startTime;

      console.log(`✅ Copilot SDK analysis complete: ${result.summary.totalIssues} issues (${analysisTime}ms)`);

      return {
        ...result,
        filePath: request.filePath,
        analysisTime
      };

    } catch (error: any) {
      console.error('❌ Copilot SDK analysis failed:', error.message);
      
      if (error.message?.includes('timeout')) {
        console.error(`   Analysis timed out after ${this.timeout}ms. Consider increasing ANALYSIS_TIMEOUT_MS.`);
      }
      
      throw error;
    }
  }

  /**
   * Analyze with streaming - useful for large files where you want progress feedback
   */
  async analyzeWithStreaming(
    request: AnalysisRequest,
    onProgress?: (chunk: string) => void
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      const systemMessage = this.governanceRules || 
        'You are a code analysis assistant. Always respond with valid JSON.';
      const userPrompt = this.buildAnalysisPrompt(request);

      console.log(`🔍 Copilot SDK (streaming): Analyzing ${request.filePath}...`);

      const session = await this.copilotClient.createSession({
        model: this.config.copilot?.model || 'gpt-4.1',
        streaming: true,
        systemMessage: {
          content: systemMessage,
        },
      });

      let responseContent = '';

      // Set up streaming event handler
      session.on((event: SessionEvent) => {
        if (event.type === 'assistant.message_delta') {
          const delta = event.data.deltaContent;
          responseContent += delta;
          if (onProgress) {
            onProgress(delta);
          }
        }
      });

      // Send and wait for completion
      await session.sendAndWait(
        { prompt: userPrompt },
        this.timeout
      );

      if (!responseContent) {
        throw new Error('No streaming response from Copilot SDK');
      }

      const result = this.parseAnalysisResponse(responseContent);
      const analysisTime = Date.now() - startTime;

      return {
        ...result,
        filePath: request.filePath,
        analysisTime
      };

    } catch (error: any) {
      console.error('❌ Copilot streaming analysis failed:', error.message);
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
