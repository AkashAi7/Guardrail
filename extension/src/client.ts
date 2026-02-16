import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';

export interface Finding {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  title: string;
  description: string;
  line: number;
  column?: number;
  snippet?: string;
  explanation: string;
  suggestedFix?: string;
  autoFixable: boolean;
  complianceRefs?: string[];
  references?: Array<{ title: string; url: string }>;
}

export interface AnalysisResult {
  findings: Finding[];
  summary: {
    totalIssues: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export interface ServiceInfo {
  name: string;
  version: string;
  status: string;
  governanceRulesLoaded: number;
}

export class GuardrailClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    const config = vscode.workspace.getConfiguration('codeGuardrail');
    this.baseURL = config.get('serviceUrl', 'http://localhost:3000');

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  updateConfig(baseURL: string) {
    this.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/health');
      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async getInfo(): Promise<ServiceInfo> {
    const response = await this.client.get<ServiceInfo>('/api/info');
    return response.data;
  }

  async analyzeCode(
    code: string,
    language: string,
    filename: string
  ): Promise<AnalysisResult> {
    const response = await this.client.post<AnalysisResult>('/api/analyze', {
      code,
      language,
      filename
    });

    return response.data;
  }

  async analyzeBatch(
    files: Array<{ code: string; language: string; filename: string }>
  ): Promise<Array<AnalysisResult & { filename: string }>> {
    const response = await this.client.post('/api/analyze-batch', { files });
    return response.data.results;
  }

  async reloadGovernance(): Promise<void> {
    await this.client.post('/api/reload-governance');
  }
}
