// Core type definitions for Guardrail Service

export interface AnalysisRequest {
  filePath: string;
  content: string;
  language: string;
  projectType?: string;
  changedLines?: { start: number; end: number }[];
}

export interface Finding {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: 'Security' | 'Compliance' | 'BestPractice' | 'Performance';
  title: string;
  description: string;
  line: number;
  column?: number;
  snippet: string;
  complianceRefs?: string[];
  explanation: string;
  suggestedFix: string;
  autoFixable: boolean;
  references?: Reference[];
}

export interface Reference {
  title: string;
  url: string;
}

export interface AnalysisResult {
  filePath: string;
  findings: Finding[];
  summary: {
    totalIssues: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  analysisTime: number;
}

export interface GovernanceRule {
  title: string;
  content: string;
  category: string;
  filePath: string;
}

export interface ServiceConfig {
  port: number;
  governancePath: string;
  copilotAuthMethod: 'github' | 'byok';
  copilotModel: string;
  analysisTimeout: number;
  maxFileSize: number;
  enableCaching: boolean;
  // BYOK (Bring Your Own Key) options
  openaiApiKey?: string;
  azureOpenaiEndpoint?: string;
  azureOpenaiKey?: string;
  azureOpenaiDeployment?: string;
}
