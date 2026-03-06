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
  private complianceContext: Map<string, string> = new Map(); // Store uploaded compliance docs
  private baseGovernanceRules: string = ''; // Store original rules before enhancements

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
      this.baseGovernanceRules = this.governanceLoader.getSystemPrompt();
      this.governanceRules = this.baseGovernanceRules;
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
    this.baseGovernanceRules = this.governanceLoader.getSystemPrompt();
    await this.reloadGovernanceWithContext();
    console.log(`✅ Reloaded ${this.governanceRules.length} characters of governance rules`);
  }

  /**
   * Upload compliance document for contextual analysis
   */
  async uploadComplianceDocument(
    documentName: string,
    content: string,
    type: 'gdpr' | 'hipaa' | 'pci-dss' | 'soc2' | 'custom'
  ): Promise<void> {
    console.log(`📄 Uploading compliance document: ${documentName} (${type})`);
    
    // Store document in context map
    this.complianceContext.set(`${type}:${documentName}`, content);
    
    // Update governance rules to include document knowledge
    await this.reloadGovernanceWithContext();
    
    console.log(`✅ Document uploaded and context updated`);
  }

  /**
   * Rebuild governance rules with uploaded compliance documents
   */
  private async reloadGovernanceWithContext(): Promise<void> {
    let enhancedRules = this.baseGovernanceRules;
    
    if (this.complianceContext.size > 0) {
      enhancedRules += '\n\n---\n\n## UPLOADED COMPLIANCE DOCUMENTS\n\n';
      enhancedRules += 'You have access to the following compliance documents. ';
      enhancedRules += 'Use these as authoritative sources when analyzing code:\n\n';
      
      for (const [key, content] of this.complianceContext.entries()) {
        const [type, name] = key.split(':');
        enhancedRules += `### ${name} (${type.toUpperCase()})\n\n`;
        // Truncate content for token limits (keep first 2000 chars)
        const truncatedContent = content.length > 2000 
          ? content.substring(0, 2000) + '...'
          : content;
        enhancedRules += `${truncatedContent}\n\n`;
      }
      
      enhancedRules += '\n\n**CRITICAL**: When analyzing code, cross-reference against these documents ';
      enhancedRules += 'and cite specific sections/clauses when reporting violations.\n';
    }
    
    this.governanceRules = enhancedRules;
    
    // Update provider with new rules
    if (this.provider && 'setGovernanceRules' in this.provider) {
      (this.provider as any).setGovernanceRules(this.governanceRules);
    }
  }

  /**
   * Clear all uploaded compliance documents
   */
  clearComplianceContext(): void {
    this.complianceContext.clear();
    this.governanceRules = this.baseGovernanceRules;
    
    // Update provider with original rules
    if (this.provider && 'setGovernanceRules' in this.provider) {
      (this.provider as any).setGovernanceRules(this.governanceRules);
    }
    
    console.log('🧹 Cleared all compliance documents');
  }

  /**
   * Get list of uploaded compliance documents
   */
  getUploadedDocuments(): string[] {
    return Array.from(this.complianceContext.keys());
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
