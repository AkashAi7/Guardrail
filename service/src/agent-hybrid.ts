/**
 * Hybrid Guardrail Agent
 * Uses provider abstraction to support both Copilot and BYOK
 */

import type { AnalysisRequest, AnalysisResult, Finding } from './types/index.js';
import { GovernanceLoader } from './governance-loader.js';
import { ProviderFactory } from './providers/provider-factory.js';
import type { LLMProvider, ProviderConfig } from './providers/base-provider.js';

export class HybridGuardrailAgent {
  private provider: LLMProvider | null = null;
  private governanceLoader: GovernanceLoader;
  private governanceRules: string = '';
  private isInitialized: boolean = false;

  constructor(
    private governancePath: string,
    private providerConfig: ProviderConfig
  ) {
    this.governanceLoader = new GovernanceLoader(governancePath);
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Hybrid Guardrail Agent...');

    try {
      // Load governance rules
      console.log('📋 Loading governance rules...');
      await this.governanceLoader.loadAll();
      this.governanceRules = this.governanceLoader.getSystemPrompt();
      console.log(`✅ Loaded ${this.governanceRules.length} characters of governance rules`);

      // Create provider using factory
      console.log('🏭 Creating LLM provider...');
      this.provider = await ProviderFactory.createProvider(this.providerConfig);

      // Set governance rules in provider
      if ('setGovernanceRules' in this.provider) {
        (this.provider as any).setGovernanceRules(this.governanceRules);
      }

      const providerInfo = this.provider.getInfo();
      console.log(`✅ Provider initialized: ${providerInfo.name} (${providerInfo.model})`);
      console.log(`💰 Estimated cost: $${providerInfo.estimatedCostPer1KTokens?.toFixed(4) || 0}/1K tokens`);

      this.isInitialized = true;
      console.log('✅ Hybrid Guardrail Agent initialized successfully');

    } catch (error: any) {
      console.error('❌ Failed to initialize agent:', error.message);
      throw error;
    }
  }

  async analyzeCode(request: AnalysisRequest): Promise<AnalysisResult> {
    if (!this.isInitialized || !this.provider) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    console.log(`\n🔍 Analyzing: ${request.filePath} (${request.language})`);

    try {
      // Use provider to perform analysis
      const result = await this.provider.analyze(request);

      console.log(`✅ Analysis complete: ${result.summary.totalIssues} issues found`);
      console.log(`   - High: ${result.summary.high}`);
      console.log(`   - Medium: ${result.summary.medium}`);
      console.log(`   - Low: ${result.summary.low}`);
      console.log(`   - Info: ${result.summary.info}`);

      return result;

    } catch (error: any) {
      console.error('❌ Analysis failed:', error.message);

      // Return empty result on error
      return {
        filePath: request.filePath,
        findings: [],
        summary: {
          totalIssues: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0
        },
        analysisTime: 0,
        error: error.message
      };
    }
  }

  async analyzeBatch(requests: AnalysisRequest[]): Promise<AnalysisResult[]> {
    console.log(`\n📦 Batch Analysis: ${requests.length} files`);

    const results: AnalysisResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.analyzeCode(request);
        results.push(result);
      } catch (error) {
        console.error(`Failed to analyze ${request.filePath}:`, error);
        results.push({
          filePath: request.filePath,
          findings: [],
          summary: { totalIssues: 0, high: 0, medium: 0, low: 0, info: 0 },
          analysisTime: 0
        });
      }
    }

    const totalIssues = results.reduce((sum, r) => sum + r.summary.totalIssues, 0);
    console.log(`✅ Batch analysis complete: ${totalIssues} total issues across ${results.length} files`);

    return results;
  }

  async reloadGovernance(): Promise<void> {
    console.log('🔄 Reloading governance rules...');
    await this.governanceLoader.reload();
    this.governanceRules = this.governanceLoader.getSystemPrompt();
    
    if (this.provider && 'setGovernanceRules' in this.provider) {
      (this.provider as any).setGovernanceRules(this.governanceRules);
    }
    
    console.log(`✅ Reloaded ${this.governanceRules.length} characters of governance rules`);
  }

  async getProviderInfo() {
    if (!this.provider) {
      return null;
    }
    return this.provider.getInfo();
  }

  async cleanup(): Promise<void> {
    if (this.provider) {
      await this.provider.cleanup();
      this.provider = null;
    }
    this.isInitialized = false;
    console.log('✅ Agent cleaned up');
  }

  isReady(): boolean {
    return this.isInitialized && this.provider !== null;
  }
}
