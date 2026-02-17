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
      timeout: 120000, // 120 seconds - backend analysis can take 60+ seconds
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
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async getInfo(): Promise<ServiceInfo> {
    const response = await this.client.get<ServiceInfo>('/info');
    return response.data;
  }

  async analyzeCode(
    code: string,
    language: string,
    filename: string
  ): Promise<AnalysisResult> {
    const response = await this.client.post<{ success: boolean; result: AnalysisResult }>('/analyze', {
      content: code,
      language,
      filePath: filename
    });

    // Backend returns { success: true, result: AnalysisResult }
    if (response.data.success && response.data.result) {
      return response.data.result;
    }

    // Fallback - if result has findings directly
    if ((response.data as any).findings) {
      return response.data as any;
    }

    throw new Error('Invalid response from service: ' + JSON.stringify(response.data));
  }

  async analyzeBatch(
    files: Array<{ code: string; language: string; filename: string }>
  ): Promise<Array<AnalysisResult & { filename: string }>> {
    const response = await this.client.post('/analyze-batch', { files });
    return response.data.results;
  }

  async reloadGovernance(): Promise<void> {
    await this.client.post('/reload-governance');
  }
}
