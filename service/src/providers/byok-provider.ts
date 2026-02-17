/**
 * BYOK (Bring Your Own Key) Provider
 * Uses OpenAI, Anthropic, or Azure OpenAI APIs directly with user-provided keys
 */

import type { AnalysisRequest, AnalysisResult } from '../types/index.js';
import { BaseProvider, type ProviderConfig, type ProviderInfo } from './base-provider.js';

export class BYOKProvider extends BaseProvider {
  private apiKey: string;
  private providerType: 'openai' | 'anthropic' | 'azure-openai';
  private model: string;
  private endpoint?: string;
  private deployment?: string;

  constructor(config: ProviderConfig) {
    super(config);

    if (!config.byok) {
      throw new Error('BYOK configuration is required');
    }

    this.apiKey = config.byok.apiKey || '';
    this.providerType = config.byok.provider;
    this.model = config.byok.model || this.getDefaultModel();
    this.endpoint = config.byok.endpoint;
    this.deployment = config.byok.deployment;

    if (!this.apiKey) {
      throw new Error('API key is required for BYOK provider');
    }
  }

  private getDefaultModel(): string {
    switch (this.providerType) {
      case 'openai':
        return 'gpt-4o';
      case 'anthropic':
        return 'claude-3-5-sonnet-20241022';
      case 'azure-openai':
        return 'gpt-4';
      default:
        return 'gpt-4o';
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test the API connection with a minimal request
      await this.testConnection();
      return true;
    } catch (error) {
      console.error(`❌ BYOK provider (${this.providerType}) not available:`, error);
      return false;
    }
  }

  getInfo(): ProviderInfo {
    const costs = {
      'openai': 0.03,
      'anthropic': 0.03,
      'azure-openai': 0.03
    };

    return {
      name: this.getProviderName(),
      type: this.providerType,
      model: this.model,
      authenticated: !!this.apiKey,
      estimatedCostPer1KTokens: costs[this.providerType]
    };
  }

  private getProviderName(): string {
    switch (this.providerType) {
      case 'openai':
        return 'OpenAI';
      case 'anthropic':
        return 'Anthropic';
      case 'azure-openai':
        return 'Azure OpenAI';
      default:
        return 'Unknown';
    }
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      console.log(`🔍 BYOK Provider (${this.providerType}): Analyzing ${request.filePath}...`);

      const systemPrompt = this.governanceRules 
        ? `${this.governanceRules}\n\n${this.buildAnalysisPrompt(request)}`
        : this.buildAnalysisPrompt(request);

      let responseText: string;

      switch (this.providerType) {
        case 'openai':
        case 'azure-openai':
          responseText = await this.analyzeWithOpenAI(systemPrompt);
          break;
        case 'anthropic':
          responseText = await this.analyzeWithAnthropic(systemPrompt);
          break;
        default:
          throw new Error(`Unsupported provider: ${this.providerType}`);
      }

      const result = this.parseAnalysisResponse(responseText);
      const analysisTime = Date.now() - startTime;

      console.log(`✅ BYOK analysis complete: ${result.summary.totalIssues} issues`);

      return {
        ...result,
        filePath: request.filePath,
        analysisTime
      };

    } catch (error) {
      console.error(`❌ BYOK analysis failed (${this.providerType}):`, error);
      throw error;
    }
  }

  private async analyzeWithOpenAI(prompt: string): Promise<string> {
    const url = this.providerType === 'azure-openai'
      ? `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=2024-02-15-preview`
      : 'https://api.openai.com/v1/chat/completions';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.providerType === 'azure-openai') {
      headers['api-key'] = this.apiKey;
    } else {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a code security and quality analysis expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();
    return data.choices[0].message.content;
  }

  private async analyzeWithAnthropic(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4000,
        temperature: 0.3,
        system: 'You are a code security and quality analysis expert.',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();
    return data.content[0].text;
  }

  private async testConnection(): Promise<void> {
    // Simple test to verify API credentials work
    try {
      switch (this.providerType) {
        case 'openai':
        case 'azure-openai':
          await this.analyzeWithOpenAI('Test connection. Reply with "OK".');
          break;
        case 'anthropic':
          await this.analyzeWithAnthropic('Test connection. Reply with "OK".');
          break;
      }
    } catch (error) {
      throw new Error(`Connection test failed: ${error}`);
    }
  }
}
