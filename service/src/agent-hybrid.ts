/**
 * Hybrid Guardrail Agent
 * Uses provider abstraction to support both Copilot and BYOK
 */

import type { AnalysisRequest, AnalysisResult, Finding } from './types/index.js';
import { GovernanceLoader } from './governance-loader.js';
import { ProviderFactory } from './providers/provider-factory.js';
import type { LLMProvider, ProviderConfig } from './providers/base-provider.js';
import { createHash } from 'node:crypto';

const CACHE_SIZE_LIMIT = 500;

export class HybridGuardrailAgent {
  private provider: LLMProvider | null = null;
  private governanceLoader: GovernanceLoader;
  private governanceRules: string = '';
  private isInitialized: boolean = false;
  private complianceContext: Map<string, string> = new Map(); // Store uploaded compliance docs
  private baseGovernanceRules: string = ''; // Store original rules before enhancements
  private analysisCache: Map<string, AnalysisResult> = new Map();

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

    const content = request.content ?? '';
    const trimmedContent = content.trim();

    // Fast path: empty or trivially small files have nothing meaningful to analyze
    if (!trimmedContent || trimmedContent.length < 5) {
      return {
        filePath: request.filePath,
        findings: [],
        summary: { totalIssues: 0, high: 0, medium: 0, low: 0, info: 0 },
        analysisTime: 0
      };
    }

    const cacheKey = this.buildCacheKey(request);
    const cached = this.analysisCache.get(cacheKey);
    if (cached) {
      console.log(`♻️  Cache hit: ${request.filePath} (${cached.summary.totalIssues} issues)`);
      return { ...cached, filePath: request.filePath };
    }

    const lines = content.split('\n');
    const LINE_THRESHOLD = 200; // chunk only larger files; fewer LLM calls per file

    console.log(`\n🔍 Analyzing: ${request.filePath} (${request.language}, ${lines.length} lines)`);

    try {
      let result: AnalysisResult;

      if (lines.length > LINE_THRESHOLD) {
        result = await this.analyzeInChunks(request, lines);
      } else {
        // Small file — single-pass analysis
        result = await this.provider.analyze(request);
        console.log(`✅ Analysis complete: ${result.summary.totalIssues} issues found`);
      }

      this.storeInCache(cacheKey, result);
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

  /**
   * Split a large file into overlapping chunks and merge findings.
   */
  private async analyzeInChunks(
    request: AnalysisRequest,
    lines: string[]
  ): Promise<AnalysisResult> {
    const CHUNK_SIZE = 200;   // larger chunks → far fewer LLM calls per file
    const OVERLAP = 10;       // overlapping lines for context continuity
    const CHUNK_CONCURRENCY = 3; // parallel chunks per file, bounded to avoid overloading the provider
    const startTime = Date.now();

    // Build chunks
    const chunks: { content: string; startLine: number }[] = [];
    for (let i = 0; i < lines.length; i += CHUNK_SIZE - OVERLAP) {
      const end = Math.min(i + CHUNK_SIZE, lines.length);
      chunks.push({
        content: lines.slice(i, end).join('\n'),
        startLine: i + 1 // 1-based
      });
      if (end >= lines.length) break;
    }

    console.log(`📦 Large file (${lines.length} lines) — ${chunks.length} chunks, concurrency ${CHUNK_CONCURRENCY}`);

    const allFindings: Finding[] = [];

    const analyzeChunk = async (
      chunk: { content: string; startLine: number },
      idx: number
    ): Promise<Finding[]> => {
      try {
        const chunkRequest: AnalysisRequest = {
          ...request,
          content: chunk.content
        };
        const result = await this.provider!.analyze(chunkRequest);
        return result.findings.map(finding => ({
          ...finding,
          line: (finding.line || 1) + chunk.startLine - 1
        }));
      } catch (err: any) {
        console.warn(`  ⚠ Chunk ${idx + 1}/${chunks.length} failed: ${err.message}`);
        return [];
      }
    };

    // Process chunks in bounded parallel waves so we don't overload the provider
    for (let wave = 0; wave < chunks.length; wave += CHUNK_CONCURRENCY) {
      const slice = chunks.slice(wave, wave + CHUNK_CONCURRENCY);
      const waveResults = await Promise.all(
        slice.map((chunk, offset) => analyzeChunk(chunk, wave + offset))
      );
      for (const findings of waveResults) {
        allFindings.push(...findings);
      }
    }

    // Deduplicate findings by (line, title)
    const seen = new Set<string>();
    const uniqueFindings = allFindings.filter(f => {
      const key = `${f.line}:${f.title || f.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const summary = {
      totalIssues: uniqueFindings.length,
      high: uniqueFindings.filter(f => f.severity === 'HIGH').length,
      medium: uniqueFindings.filter(f => f.severity === 'MEDIUM').length,
      low: uniqueFindings.filter(f => f.severity === 'LOW').length,
      info: uniqueFindings.filter(f => f.severity === 'INFO').length
    };

    const analysisTime = Date.now() - startTime;
    console.log(`✅ Chunked analysis complete: ${uniqueFindings.length} issues in ${analysisTime}ms`);

    return {
      filePath: request.filePath,
      findings: uniqueFindings,
      summary,
      analysisTime
    };
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
    this.analysisCache.clear();
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
    this.analysisCache.clear();
    
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
    this.analysisCache.clear();
    console.log('✅ Agent cleaned up');
  }

  private buildCacheKey(request: AnalysisRequest): string {
    const hash = createHash('sha256');
    hash.update(request.language || '');
    hash.update('\u0001');
    hash.update(request.content || '');
    return `${request.language || 'unknown'}:${hash.digest('hex')}`;
  }

  private storeInCache(key: string, result: AnalysisResult): void {
    if (this.analysisCache.size >= CACHE_SIZE_LIMIT) {
      const oldestKey = this.analysisCache.keys().next().value;
      if (oldestKey) {
        this.analysisCache.delete(oldestKey);
      }
    }
    this.analysisCache.set(key, result);
  }

  isReady(): boolean {
    return this.isInitialized && this.provider !== null;
  }
}
