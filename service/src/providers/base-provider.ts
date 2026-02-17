/**
 * Base Provider Interface
 * All LLM providers (Copilot, OpenAI, Anthropic, etc.) must implement this interface
 */

import type { AnalysisRequest, AnalysisResult } from '../types/index.js';

export interface LLMProvider {
  /**
   * Perform code analysis using the provider's LLM
   */
  analyze(request: AnalysisRequest): Promise<AnalysisResult>;

  /**
   * Check if the provider is available and properly configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get provider information (name, model, etc.)
   */
  getInfo(): ProviderInfo;

  /**
   * Cleanup resources (close connections, etc.)
   */
  cleanup(): Promise<void>;
}

export interface ProviderInfo {
  name: string;
  type: 'copilot' | 'openai' | 'anthropic' | 'azure-openai';
  model?: string;
  authenticated: boolean;
  subscriptionType?: string;
  estimatedCostPer1KTokens?: number;
}

export interface ProviderConfig {
  mode: 'auto' | 'copilot' | 'byok';
  
  // Copilot settings
  copilot?: {
    cliPath?: string;
    model?: string;
    timeout?: number;
  };
  
  // BYOK settings
  byok?: {
    provider: 'openai' | 'anthropic' | 'azure-openai';
    apiKey?: string;
    model?: string;
    endpoint?: string; // For Azure
    deployment?: string; // For Azure
  };
}

export abstract class BaseProvider implements LLMProvider {
  protected governanceRules: string = '';
  protected timeout: number = 10000;

  constructor(protected config: ProviderConfig) {}

  abstract analyze(request: AnalysisRequest): Promise<AnalysisResult>;
  abstract isAvailable(): Promise<boolean>;
  abstract getInfo(): ProviderInfo;

  async cleanup(): Promise<void> {
    // Default: no cleanup needed
  }

  setGovernanceRules(rules: string): void {
    this.governanceRules = rules;
  }

  protected buildAnalysisPrompt(request: AnalysisRequest): string {
    return `Analyze the following ${request.language} code for security vulnerabilities, code quality issues, and compliance violations.

File: ${request.filePath}
Language: ${request.language}
${request.projectType ? `Project Type: ${request.projectType}` : ''}

Code:
\`\`\`${request.language}
${request.content}
\`\`\`

${request.changedLines ? `Focus on these changed lines: ${JSON.stringify(request.changedLines)}` : ''}

Return your analysis as a JSON object with this structure:
{
  "findings": [
    {
      "severity": "high" | "medium" | "low" | "info",
      "category": "security" | "quality" | "compliance" | "performance",
      "title": "Brief title",
      "description": "Detailed description",
      "line": line_number,
      "snippet": "code snippet",
      "explanation": "Why this is an issue",
      "suggestedFix": "How to fix it",
      "autoFixable": boolean
    }
  ],
  "summary": {
    "totalIssues": number,
    "high": number,
    "medium": number,
    "low": number,
    "info": number
  }
}`;
  }

  protected parseAnalysisResponse(response: string): AnalysisResult {
    try {
      // Remove markdown code blocks if present
      let jsonText = response.trim();
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
      }

      const parsed = JSON.parse(jsonText);

      return {
        filePath: '',
        findings: parsed.findings || [],
        summary: parsed.summary || {
          totalIssues: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0
        },
        analysisTime: 0
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      throw new Error('Invalid response format from LLM');
    }
  }
}
