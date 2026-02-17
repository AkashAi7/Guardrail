import { AnalysisRequest, AnalysisResult, Finding } from './types/index.js';
import { GovernanceLoader } from './governance-loader.js';
import config from './config.js';
import { CopilotClient, CopilotSession } from '@github/copilot-sdk';

export class GuardrailAgent {
  private systemPrompt: string = '';
  private governanceLoader: GovernanceLoader;
  private copilotClient: CopilotClient;
  private isInitialized: boolean = false;

  constructor(governancePath: string) {
    this.governanceLoader = new GovernanceLoader(governancePath);
    
    // Initialize Copilot Client
    const clientOptions: any = {
      useStdio: true,
      autoStart: false, // We'll start it manually in initialize()
      autoRestart: true,
      logLevel: 'info',
    };

    // Add authentication based on config
    if (config.copilotAuthMethod === 'byok' && config.openaiApiKey) {
      // Note: BYOK support depends on CLI version capabilities
      console.log('⚠️  BYOK mode: Ensure your GitHub Copilot CLI supports custom providers');
    }

    this.copilotClient = new CopilotClient(clientOptions);
  }

  /**
   * Initialize the agent and load governance rules
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Guardrail Agent...');
    
    // Load governance prompts
    await this.governanceLoader.loadAll();
    this.systemPrompt = this.governanceLoader.getSystemPrompt();
    
    // Start Copilot CLI server
    try {
      await this.copilotClient.start();
      this.isInitialized = true;
      console.log('✅ Copilot CLI connected');
    } catch (error) {
      console.error('❌ Failed to start Copilot CLI:', error);
      console.log('⚠️  Falling back to mock analysis mode');
      // Don't throw - allow fallback to mock mode
    }
    
    console.log(`✅ Agent initialized with ${this.governanceLoader.getRules().length} rules`);
    console.log(`📏 System prompt length: ${this.systemPrompt.length} characters`);
  }

  /**
   * Analyze code using Copilot SDK
   */
  async analyzeCode(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    console.log(`🔍 Analyzing: ${request.filePath} (${request.language})`);

    // Build analysis prompt
    const userPrompt = this.buildAnalysisPrompt(request);

    // Try SDK analysis first, fallback to mock if not available
    if (this.isInitialized) {
      try {
        const analysisResult = await this.performSDKAnalysis(userPrompt);
        const analysisTime = Date.now() - startTime;
        
        console.log(`✅ SDK Analysis complete: ${analysisResult.findings.length} issues (${analysisTime}ms)`);
        
        return {
          ...analysisResult,
          filePath: request.filePath,
          analysisTime,
        };
      } catch (error) {
        console.error('❌ SDK Analysis failed:', error);
        console.log('⚠️  Falling back to pattern-based analysis...');
      }
    }

    // Fallback to mock analysis
    const mockResult = await this.mockAnalysis(request);
    const analysisTime = Date.now() - startTime;
    
    console.log(`✅ Mock Analysis complete: ${mockResult.findings.length} issues (${analysisTime}ms)`);
    
    return {
      ...mockResult,
      filePath: request.filePath,
      analysisTime,
    };
  }

  /**
   * Perform analysis using GitHub Copilot SDK
   */
  private async performSDKAnalysis(userPrompt: string): Promise<AnalysisResult> {
    // Create a new session
    const session = await this.copilotClient.createSession({
      model: config.copilotModel,
      systemMessage: {
        mode: 'replace',
        content: this.systemPrompt,
      },
    });

    try {
      // Collect the assistant's response
      let responseContent = '';
      
      const done = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Analysis timeout'));
        }, config.analysisTimeout);

        session.on('assistant.message', (event) => {
          responseContent += event.data.content || '';
        });

        session.on('session.idle', () => {
          clearTimeout(timeout);
          resolve();
        });

        session.on('session.error', (event) => {
          clearTimeout(timeout);
          reject(new Error(event.data?.message || 'Session error'));
        });
      });

      // Send the analysis request
      await session.send({ prompt: userPrompt });
      await done;

      // Parse the response
      const analysisResult = this.parseAnalysisResponse(responseContent);
      
      // Clean up session
      await session.destroy();
      
      return analysisResult;
    } catch (error) {
      // Ensure session is destroyed even on error
      try {
        await session.destroy();
      } catch (cleanupError) {
        console.error('Error destroying session:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Build analysis prompt for the LLM
   */
  private buildAnalysisPrompt(request: AnalysisRequest): string {
    let prompt = 'Please analyze the following code for security, compliance, and best practice issues:\n\n';
    
    prompt += `**File:** ${request.filePath}\n`;
    prompt += `**Language:** ${request.language}\n`;
    
    if (request.projectType) {
      prompt += `**Project Type:** ${request.projectType}\n`;
    }
    
    if (request.changedLines && request.changedLines.length > 0) {
      const lineRanges = request.changedLines
        .map(l => `${l.start}-${l.end}`)
        .join(', ');
      prompt += `**Changed Lines:** ${lineRanges}\n`;
    }
    
    prompt += '\n**Code:**\n';
    prompt += '```' + request.language + '\n';
    prompt += request.content;
    prompt += '\n```\n\n';
    
    prompt += '**Instructions:**\n';
    prompt += '1. Focus on REAL issues with security/compliance impact\n';
    prompt += '2. Be specific about line numbers and code snippets\n';
    prompt += '3. Provide working fixes, not just descriptions\n';
    prompt += '4. Return response in strict JSON format as specified in system prompt\n';
    
    return prompt;
  }

  /**
   * Parse LLM response into structured AnalysisResult
   */
  private parseAnalysisResponse(responseContent: string): AnalysisResult {
    try {
      // Extract JSON from response (handle code blocks)
      let jsonStr = responseContent.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        const lines = jsonStr.split('\n');
        jsonStr = lines.slice(1, -1).join('\n');
        if (jsonStr.startsWith('json')) {
          jsonStr = jsonStr.substring(4);
        }
      }
      
      const parsed = JSON.parse(jsonStr);
      
      // Validate structure
      if (!parsed.findings || !Array.isArray(parsed.findings)) {
        throw new Error('Invalid response structure: missing findings array');
      }
      
      return {
        filePath: '',
        findings: parsed.findings,
        summary: parsed.summary || this.calculateSummary(parsed.findings),
        analysisTime: 0,
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Response content:', responseContent);
      throw new Error('Failed to parse analysis response from LLM');
    }
  }

  /**
   * Calculate summary from findings
   */
  private calculateSummary(findings: Finding[]) {
    return {
      totalIssues: findings.length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length,
      info: findings.filter(f => f.severity === 'INFO').length,
    };
  }

  /**
   * Fallback pattern-based analysis (used when LLM failsed in your system prompt\n';
    prompt += '2. Check for security vulnerabilities, compliance violations, and best practice issues\n';
    prompt += '3. Return results as valid JSON (as specified in your system prompt)\n';
    prompt += '4. Be specific with line numbers and code snippets\n';
    prompt += '5. Provide actionable fixes with working code examples\n';
    
    return prompt;
  }

  /**
   * Mock analysis for testing (replace with real Copilot SDK)
   */
  private async mockAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    const findings: Finding[] = [];
    const content = request.content;

    // Simple pattern matching for demo purposes
    // In production, this would be done by the LLM
    
    // Check for hardcoded secrets
    const secretPatterns = [
      /['"]sk[-_](live|test)[-_][a-zA-Z0-9]{24,}['"]/g,
      /(?:api[_-]?key|apikey)['"]\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/gi,
      /(?:password|passwd|pwd)['"]\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    ];

    secretPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const line = this.getLineNumber(content, match.index);
        findings.push({
          id: `SEC-${Math.random().toString(36).substr(2, 9)}`,
          severity: 'HIGH',
          category: 'Security',
          title: 'Hardcoded Secret Detected',
          description: 'Sensitive credential found in source code',
          line,
          column: match.index - content.lastIndexOf('\n', match.index),
          snippet: match[0],
          complianceRefs: ['SOC2 CC6.1', 'GDPR Article 32'],
          explanation: 'Hardcoded credentials in source code are a critical security vulnerability. They can be exposed through version control, logs, or error messages.',
          suggestedFix: 'const apiKey = process.env.API_KEY;\nif (!apiKey) throw new Error(\'API_KEY required\');',
          autoFixable: true,
          references: [
            {
              title: 'OWASP: Use of Hard-coded Password',
              url: 'https://owasp.org/www-community/vulnerabilities/Use_of_hardcoded_password'
            }
          ]
        });
      }
    });

    // Check for SQL injection
    if (content.match(/query\s*\(\s*[`"'].*\$\{.*\}.*[`"']/)) {
      const match = content.match(/query\s*\(\s*[`"'].*\$\{.*\}.*[`"']/)!;
      const line = this.getLineNumber(content, content.indexOf(match[0]));
      
      findings.push({
        id: `SEC-${Math.random().toString(36).substr(2, 9)}`,
        severity: 'HIGH',
        category: 'Security',
        title: 'SQL Injection Vulnerability',
        description: 'Unsanitized input in SQL query',
        line,
        snippet: match[0].substring(0, 50) + '...',
        complianceRefs: ['OWASP A03:2021', 'CWE-89'],
        explanation: 'String interpolation in SQL queries allows attackers to inject malicious SQL code. Always use parameterized queries.',
        suggestedFix: 'const query = \'SELECT * FROM users WHERE id = ?\';\ndb.query(query, [userId]);',
        autoFixable: true,
        references: [
          {
            title: 'OWASP SQL Injection',
            url: 'https://owasp.org/www-community/attacks/SQL_Injection'
          }
        ]
      });
    }

    const summary = {
      totalIssues: findings.length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length,
      info: findings.filter(f => f.severity === 'INFO').length,
    };

    return {
      filePath: request.filePath,
      findings,
      summary,
      analysisTime: 0,
    };
  }

  /**
   * Get line number from string index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Reload governance rules
   */
  async reloadGovernance(): Promise<void> {
    console.log('🔄 Reloading governance rules...');
    await this.governanceLoader.reload();
    this.systemPrompt = this.governanceLoader.getSystemPrompt();
    console.log('✅ Governance rules reloaded');
  }

  /**
   * Clean up resources (call on shutdown)
   */
  async cleanup(): Promise<void> {
    if (this.isInitialized) {
      console.log('🛑 Stopping Copilot CLI...');
      try {
        await this.copilotClient.stop();
        this.isInitialized = false;
        console.log('✅ Copilot CLI stopped');
      } catch (error) {
        console.error('❌ Error stopping Copilot CLI:', error);
      }
    }
  }
}
