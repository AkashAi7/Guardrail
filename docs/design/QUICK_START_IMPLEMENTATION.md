# Quick Start: Building the MVP Runtime Guardrail System

## 📋 **Prerequisites**

1. **Install Copilot CLI**
   ```bash
   # Follow GitHub's official guide
   # https://docs.github.com/en/copilot/using-github-copilot/using-copilot-cli
   
   # Verify installation
   copilot --version
   
   # Authenticate
   copilot auth login
   ```

2. **Node.js & npm** (v18+)
   ```bash
   node --version  # v18.0.0 or higher
   npm --version
   ```

3. **VS Code** (for extension development)

---

## 🚀 **Step 1: Project Setup (5 minutes)**

```bash
# Create project structure
mkdir guardrail-system
cd guardrail-system

# Backend service
mkdir -p backend/src/tools
mkdir -p backend/rules/security
mkdir -p backend/rules/compliance

# VS Code extension
mkdir -p extension/src

# Initialize projects
cd backend && npm init -y
cd ../extension && npm init -y
cd ..
```

---

## 🔧 **Step 2: Backend Setup - Guardrail Service**

### **Install Dependencies**

```bash
cd backend

# Core dependencies
npm install @github/copilot-sdk express cors body-parser

# Development
npm install -D typescript @types/node @types/express ts-node nodemon

# Utilities
npm install yaml chokidar glob
```

### **TypeScript Configuration**

```json
// backend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### **Package.json Scripts**

```json
// backend/package.json (add to scripts section)
{
  "scripts": {
    "dev": "nodemon --watch 'src/**/*.ts' --exec 'ts-node' src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

---

## 💻 **Step 3: Core Implementation**

### **3.1 Main Copilot Client Wrapper**

```typescript
// backend/src/copilot-client.ts
import { CopilotClient, CopilotAgent } from '@github/copilot-sdk';

export interface AnalysisRequest {
  filePath: string;
  content: string;
  language: string;
  changedLines?: { start: number; end: number }[];
}

export interface Finding {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: 'Security' | 'Compliance' | 'BestPractice' | 'Performance';
  title: string;
  description: string;
  line: number;
  column: number;
  snippet: string;
  recommendation: string;
  suggestedFix?: string;
  complianceImpact?: Array<{
    regulation: string;
    requirement: string;
    risk: string;
  }>;
}

export interface AnalysisResult {
  filePath: string;
  findings: Finding[];
  analysisTime: number;
}

export class GuardrailCopilotClient {
  private client: CopilotClient;
  private agent: CopilotAgent | null = null;

  constructor() {
    // Initialize Copilot SDK
    this.client = new CopilotClient({
      // Uses default GitHub authentication
      // Can also use BYOK: { provider: 'azure-openai', apiKey: '...' }
    });
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Guardrail Agent...');

    // Create specialized agent for code analysis
    this.agent = await this.client.createAgent({
      name: 'guardrail-agent',
      systemPrompt: this.getSystemPrompt(),
      tools: this.getToolDefinitions(),
      model: 'gpt-4o', // or 'gpt-4', 'claude-3-5-sonnet'
    });

    console.log('✅ Agent initialized successfully');
  }

  private getSystemPrompt(): string {
    return `You are an expert Code Guardrail Assistant specializing in:
- Security vulnerability detection (OWASP Top 10, CWE)
- Compliance validation (GDPR, HIPAA, SOC2, PCI-DSS)
- Best practices for multiple programming languages
- Code quality and performance optimization

Your role is to analyze code changes and identify:
1. Security vulnerabilities (SQL injection, XSS, secrets, etc.)
2. Compliance violations (PII handling, logging, data protection)
3. Best practice deviations (error handling, patterns, conventions)
4. Performance issues (inefficient algorithms, resource leaks)

For each issue found, provide:
- Clear explanation of WHY it's a problem
- Specific compliance or security impact
- Actionable recommendation
- Exact code fix when possible
- References to standards/documentation

Be precise, educational, and constructive. Prioritize by severity and compliance risk.`;
  }

  private getToolDefinitions(): any[] {
    // Define custom tools that the agent can call
    return [
      {
        name: 'check_security_patterns',
        description: 'Scans code for common security vulnerabilities using pattern matching',
        parameters: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Code to analyze' },
            language: { type: 'string', description: 'Programming language' },
          },
          required: ['code', 'language'],
        },
        handler: async (params: any) => {
          return this.checkSecurityPatterns(params.code, params.language);
        },
      },
      {
        name: 'validate_compliance',
        description: 'Checks code against compliance requirements',
        parameters: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            regulations: {
              type: 'array',
              items: { type: 'string' },
              description: 'Regulations to check: GDPR, HIPAA, SOC2, PCI-DSS',
            },
          },
          required: ['code', 'regulations'],
        },
        handler: async (params: any) => {
          return this.validateCompliance(params.code, params.regulations);
        },
      },
      {
        name: 'suggest_fix',
        description: 'Generates code fix for identified issue',
        parameters: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Problematic code' },
            issue: { type: 'string', description: 'Description of the issue' },
            language: { type: 'string' },
          },
          required: ['code', 'issue', 'language'],
        },
        handler: async (params: any) => {
          return this.suggestFix(params.code, params.issue, params.language);
        },
      },
    ];
  }

  async analyzeCode(request: AnalysisRequest): Promise<AnalysisResult> {
    if (!this.agent) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    const startTime = Date.now();

    console.log(`🔍 Analyzing ${request.filePath}...`);

    // Build comprehensive analysis prompt
    const analysisPrompt = this.buildAnalysisPrompt(request);

    try {
      // Run the agent
      const response = await this.agent.run({
        userMessage: analysisPrompt,
        context: {
          file: request.filePath,
          language: request.language,
        },
      });

      // Parse agent's response into structured findings
      const findings = this.parseAgentResponse(response, request);

      const analysisTime = Date.now() - startTime;

      console.log(
        `✅ Analysis complete: ${findings.length} issues found (${analysisTime}ms)`
      );

      return {
        filePath: request.filePath,
        findings,
        analysisTime,
      };
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(request: AnalysisRequest): string {
    const { filePath, content, language, changedLines } = request;

    let prompt = `Analyze the following ${language} code for security, compliance, and best practice issues:\n\n`;

    prompt += `File: ${filePath}\n`;
    prompt += `Language: ${language}\n\n`;

    if (changedLines && changedLines.length > 0) {
      prompt += `Focus on changed lines: ${changedLines.map((l) => `${l.start}-${l.end}`).join(', ')}\n\n`;
    }

    prompt += `Code:\n\`\`\`${language}\n${content}\n\`\`\`\n\n`;

    prompt += `Please check for:\n`;
    prompt += `1. Security vulnerabilities (OWASP Top 10, CWE)\n`;
    prompt += `2. Compliance issues (GDPR, HIPAA, SOC2 - data handling, logging, access control)\n`;
    prompt += `3. Best practice violations (error handling, code patterns, conventions)\n`;
    prompt += `4. Performance concerns\n\n`;

    prompt += `For each issue found, provide:\n`;
    prompt += `- Issue ID (format: CAT-NNN, e.g., SEC-001)\n`;
    prompt += `- Severity: CRITICAL, HIGH, MEDIUM, LOW, or INFO\n`;
    prompt += `- Line number where the issue occurs\n`;
    prompt += `- Clear description\n`;
    prompt += `- Compliance impact (if applicable)\n`;
    prompt += `- Specific recommendation\n`;
    prompt += `- Suggested code fix\n\n`;

    prompt += `Use the available tools to perform thorough analysis.`;

    return prompt;
  }

  private parseAgentResponse(response: any, request: AnalysisRequest): Finding[] {
    // This is simplified - in production, you'd parse structured output
    // For now, we'll extract findings from the agent's text response

    const findings: Finding[] = [];
    const text = response.text || response.content || '';

    // Simple parsing logic (enhance this based on actual response format)
    const lines = text.split('\n');
    let currentFinding: Partial<Finding> | null = null;

    for (const line of lines) {
      // Look for issue identifiers
      if (line.match(/^(SEC|COMP|BP|PERF)-\d+/)) {
        if (currentFinding) {
          findings.push(currentFinding as Finding);
        }
        currentFinding = {
          id: line.match(/^[A-Z]+-\d+/)?.[0] || 'UNKNOWN',
          severity: 'MEDIUM',
          category: 'Security',
        };
      }

      // Extract other fields
      if (currentFinding && line.includes('Severity:')) {
        const severity = line.match(/Severity:\s*(CRITICAL|HIGH|MEDIUM|LOW|INFO)/i)?.[1];
        if (severity) {
          currentFinding.severity = severity.toUpperCase() as any;
        }
      }

      if (currentFinding && line.includes('Line:')) {
        const lineNum = line.match(/Line:\s*(\d+)/)?.[1];
        if (lineNum) {
          currentFinding.line = parseInt(lineNum);
        }
      }

      // ... continue parsing other fields
    }

    if (currentFinding) {
      findings.push(currentFinding as Finding);
    }

    return findings;
  }

  // Tool handler implementations
  private async checkSecurityPatterns(code: string, language: string): Promise<any> {
    const issues = [];

    // Hardcoded secrets
    if (/['"]sk[-_]live[-_][a-zA-Z0-9]{24,}['"]/.test(code)) {
      issues.push({
        type: 'hardcoded-secret',
        pattern: 'Stripe live key',
        severity: 'CRITICAL',
      });
    }

    if (/(?:password|passwd|pwd)\s*=\s*['"][^'"]{8,}['"]/.test(code)) {
      issues.push({
        type: 'hardcoded-password',
        severity: 'HIGH',
      });
    }

    // SQL Injection (basic check)
    if (language === 'javascript' || language === 'typescript') {
      if (/query\(['"]\s*SELECT.*\$\{.*\}/.test(code)) {
        issues.push({
          type: 'sql-injection',
          severity: 'CRITICAL',
        });
      }
    }

    // Add more patterns...

    return { issues };
  }

  private async validateCompliance(code: string, regulations: string[]): Promise<any> {
    const violations = [];

    for (const regulation of regulations) {
      if (regulation === 'GDPR') {
        // Check for PII logging
        if (/log.*\b(email|phone|ssn|address)\b/.test(code)) {
          violations.push({
            regulation: 'GDPR',
            article: 'Article 32',
            issue: 'Potential PII logging without redaction',
            severity: 'HIGH',
          });
        }
      }

      if (regulation === 'HIPAA') {
        // Check for PHI handling
        if (/\b(medical_record|diagnosis|treatment)\b/.test(code)) {
          violations.push({
            regulation: 'HIPAA',
            issue: 'PHI data handling detected - ensure encryption',
            severity: 'HIGH',
          });
        }
      }

      // Add more compliance checks...
    }

    return { violations };
  }

  private async suggestFix(
    code: string,
    issue: string,
    language: string
  ): Promise<any> {
    // Use LLM to generate fix suggestion
    // For MVP, return template-based fixes

    if (issue.includes('hardcoded')) {
      return {
        fix: code.replace(
          /const\s+(\w+)\s*=\s*['"][^'"]+['"]/,
          'const $1 = process.env.$1.toUpperCase()'
        ),
        explanation: 'Moved credential to environment variable',
      };
    }

    return { fix: null, explanation: 'Manual fix required' };
  }

  async shutdown(): Promise<void> {
    if (this.client) {
      await this.client.stop();
      console.log('🛑 Copilot client stopped');
    }
  }
}
```

### **3.2 Express API Server**

```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { GuardrailCopilotClient, AnalysisRequest } from './copilot-client';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Initialize Copilot client
const guardrailClient = new GuardrailCopilotClient();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'guardrail-service' });
});

// Main analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const request: AnalysisRequest = req.body;

    // Validate request
    if (!request.filePath || !request.content || !request.language) {
      return res.status(400).json({
        error: 'Missing required fields: filePath, content, language',
      });
    }

    // Perform analysis
    const result = await guardrailClient.analyzeCode(request);

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Batch analysis endpoint
app.post('/api/analyze-batch', async (req, res) => {
  try {
    const requests: AnalysisRequest[] = req.body.files;

    const results = await Promise.all(
      requests.map((request) => guardrailClient.analyzeCode(request))
    );

    res.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start server
async function start() {
  try {
    // Initialize Copilot client
    await guardrailClient.initialize();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Guardrail Service running on http://localhost:${PORT}`);
      console.log(`📊 Analytics: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      await guardrailClient.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start service:', error);
    process.exit(1);
  }
}

start();
```

---

## 🧪 **Step 4: Test the Backend**

### **Sample Test File**

```typescript
// backend/src/test.ts
import { GuardrailCopilotClient } from './copilot-client';

async function test() {
  const client = new GuardrailCopilotClient();
  await client.initialize();

  const testCode = `
const apiKey = "sk-live-1234567890abcdef";

function getUserData(userId) {
  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
  return db.query(query);
}

function createUser(email, ssn) {
  console.log(\`Creating user: \${email}, SSN: \${ssn}\`);
  // ... more code
}
`;

  const result = await client.analyzeCode({
    filePath: 'test.js',
    content: testCode,
    language: 'javascript',
  });

  console.log('\n🔍 Analysis Results:\n');
  console.log(JSON.stringify(result, null, 2));

  await client.shutdown();
}

test();
```

### **Run the Test**

```bash
cd backend
npm run dev

# In another terminal
npx ts-node src/test.ts
```

---

## 🎨 **Step 5: VS Code Extension (Basic)**

### **Install Extension Dependencies**

```bash
cd extension

npm install @types/vscode @types/node
npm install axios

# Install VS Code extension tools
npm install -g @vscode/vsce yo generator-code
```

### **Extension Main File**

```typescript
// extension/src/extension.ts
import * as vscode from 'vscode';
import axios from 'axios';

const GUARDRAIL_API = 'http://localhost:3000/api';

export function activate(context: vscode.ExtensionContext) {
  console.log('🛡️ Guardrail extension is now active!');

  const diagnosticCollection = vscode.languages.createDiagnosticCollection('guardrails');
  context.subscriptions.push(diagnosticCollection);

  // Command: Analyze current file
  const analyzeCommand = vscode.commands.registerCommand(
    'guardrail.analyze',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active file to analyze');
        return;
      }

      await analyzeDocument(editor.document, diagnosticCollection);
    }
  );

  context.subscriptions.push(analyzeCommand);

  // Auto-analyze on save
  const onSaveListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (shouldAnalyze(document)) {
      await analyzeDocument(document, diagnosticCollection);
    }
  });

  context.subscriptions.push(onSaveListener);

  vscode.window.showInformationMessage('✅ Guardrail protection enabled!');
}

async function analyzeDocument(
  document: vscode.TextDocument,
  diagnosticCollection: vscode.DiagnosticCollection
) {
  // Show progress
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Analyzing code...',
      cancellable: false,
    },
    async (progress) => {
      try {
        const response = await axios.post(`${GUARDRAIL_API}/analyze`, {
          filePath: document.fileName,
          content: document.getText(),
          language: document.languageId,
        });

        const { result } = response.data;

        // Convert findings to VS Code diagnostics
        const diagnostics: vscode.Diagnostic[] = result.findings.map(
          (finding: any) => {
            const line = finding.line - 1; // VS Code is 0-indexed
            const range = new vscode.Range(line, 0, line, 100);

            const diagnostic = new vscode.Diagnostic(
              range,
              `[${finding.id}] ${finding.title}: ${finding.description}`,
              mapSeverity(finding.severity)
            );

            diagnostic.source = 'Guardrail';
            diagnostic.code = finding.id;

            return diagnostic;
          }
        );

        diagnosticCollection.set(document.uri, diagnostics);

        vscode.window.showInformationMessage(
          `✅ Analysis complete: ${result.findings.length} issues found`
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `❌ Analysis failed: ${error.message}`
        );
      }
    }
  );
}

function shouldAnalyze(document: vscode.TextDocument): boolean {
  // Only analyze supported file types
  const supportedLanguages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'go',
  ];
  return supportedLanguages.includes(document.languageId);
}

function mapSeverity(severity: string): vscode.DiagnosticSeverity {
  switch (severity) {
    case 'CRITICAL':
    case 'HIGH':
      return vscode.DiagnosticSeverity.Error;
    case 'MEDIUM':
      return vscode.DiagnosticSeverity.Warning;
    case 'LOW':
      return vscode.DiagnosticSeverity.Information;
    default:
      return vscode.DiagnosticSeverity.Hint;
  }
}

export function deactivate() {
  console.log('🛡️ Guardrail extension deactivated');
}
```

### **Extension Package.json**

```json
// extension/package.json
{
  "name": "guardrail-extension",
  "displayName": "Code Guardrail",
  "description": "Runtime guardrails for compliance and security",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Linters", "Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "guardrail.analyze",
        "title": "Guardrail: Analyze Current File"
      }
    ],
    "configuration": {
      "title": "Guardrail",
      "properties": {
        "guardrail.apiUrl": {
          "type": "string",
          "default": "http://localhost:3000/api",
          "description": "Guardrail API URL"
        },
        "guardrail.autoAnalyze": {
          "type": "boolean",
          "default": true,
          "description": "Automatically analyze on file save"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

### **Extension tsconfig.json**

```json
// extension/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true
  },
  "exclude": ["node_modules", ".vscode-test"]
}
```

---

## 🏃 **Step 6: Run Everything**

### **Terminal 1: Start Backend**

```bash
cd backend
npm run dev

# You should see:
# 🚀 Initializing Guardrail Agent...
# ✅ Agent initialized successfully
# 🚀 Guardrail Service running on http://localhost:3000
```

### **Terminal 2: Test Backend (Optional)**

```bash
# Test with curl
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "test.js",
    "content": "const password = \"hardcoded123\";",
    "language": "javascript"
  }'
```

### **Terminal 3: Run Extension**

```bash
cd extension
npm run compile

# Press F5 in VS Code to launch Extension Development Host
# Or:
code --extensionDevelopmentPath=./extension
```

### **Test in VS Code:**

1. Create a test file `test.js`:
   ```javascript
   const apiKey = "sk-live-1234567890abcdef";
   
   function getUser(id) {
     const query = `SELECT * FROM users WHERE id = ${id}`;
     return db.query(query);
   }
   ```

2. Save the file

3. You should see red squiggly lines under security issues!

---

## 📊 **Step 7: Next Steps for Full Implementation**

### **Immediate Enhancements:**
1. **Better Response Parsing**: Structure agent responses as JSON
2. **Code Actions**: Add quick-fix buttons
3. **Rule Configuration**: Load rules from YAML files
4. **Caching**: Cache analysis results for unchanged code
5. **Pre-commit Hook**: Git hook integration

### **Future Features:**
1. **Dashboard**: Web UI for team analytics
2. **Multi-language Support**: Expand beyond JS/TS
3. **Custom Rules**: Allow teams to define their own
4. **CI/CD Integration**: GitHub Actions, GitLab CI
5. **Learning System**: ML-based false positive reduction

---

## 🎯 **Success Checklist**

- [ ] Backend service starts successfully
- [ ] Copilot SDK initializes
- [ ] Can analyze code via API
- [ ] VS Code extension activates
- [ ] Sees diagnostics in editor
- [ ] Auto-analyzes on save
- [ ] Performance < 5 seconds

---

## 🆘 **Troubleshooting**

### **"Copilot CLI not found"**
```bash
# Install Copilot CLI
gh extension install github/gh-copilot

# Or download from GitHub releases
```

### **"Authentication failed"**
```bash
# Re-authenticate
copilot auth login

# Or set token
export GITHUB_TOKEN="your-token"
```

### **"Analysis times out"**
- Check Copilot CLI is running: `copilot --version`
- Reduce code size being analyzed
- Check network connectivity

### **"Extension not working"**
- Check backend is running: `curl http://localhost:3000/health`
- Check VS Code output panel: "Guardrail" logs
- Reload VS Code window

---

## 📚 **Resources**

- [Copilot SDK Docs](https://github.com/github/copilot-sdk/tree/main/docs)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GDPR Developer Guide](https://gdpr.eu/developer-guide/)

---

**You now have a working MVP! 🎉**

Next: Add more security rules, improve parsing, build the dashboard, and scale!
