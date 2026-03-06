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
  // Enhanced compliance fields
  complianceReference?: string; // Specific document section violated
  riskLevel?: string; // Business impact of the violation
  complianceImpact?: string[]; // List of compliance frameworks affected (GDPR, HIPAA, etc)
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
  error?: string;
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
  maxFileSize: number;
  enableCaching: boolean;
  providerConfig: any; // ProviderConfig from providers module
}
