# Guardrail Service

Real-time code analysis service using **GitHub Copilot SDK** for semantic security, compliance, and best practice analysis.

## 🎯 Overview

This service wraps the GitHub Copilot SDK to perform intelligent code analysis using:
- **LLM-Powered Analysis**: Uses GitHub Copilot (GPT-4, Claude Sonnet 4.5, etc.) for semantic understanding
- **Rules-as-Prompts**: Governance rules written as natural language markdown files
- **Fallback Support**: Pattern-based analysis when SDK is unavailable

## 🏗️ Architecture

```
VS Code Extension → REST API → Guardrail Agent → Copilot SDK → GitHub Copilot CLI → LLM
                                       ↓
                                Governance Rules
                                (Markdown Files)
```

### How It Works

1. **Service Startup**: Initializes Copilot CLI server via SDK
2. **Analysis Request**: Receives code from extension
3. **Prompt Building**: Combines governance rules + code into analysis prompt
4. **SDK Session**: Creates Copilot session with custom system prompt
5. **LLM Analysis**: Copilot performs semantic analysis
6. **Response Parsing**: Extracts JSON findings from LLM response
7. **Results Return**: Sends structured findings back to extension

## 📋 Prerequisites

### Required

1. **Node.js 18+**
2. **GitHub Copilot CLI** installed and configured:
   ```bash
   # Install Copilot CLI
   npm install -g @github/copilot
   
   # Verify installation
   copilot --version
   
   # Authenticate
   copilot auth
   ```

3. **GitHub Copilot License**:
   - GitHub Copilot Individual/Business/Enterprise subscription
   - Or use BYOK (Bring Your Own Key) mode with OpenAI/Azure API

### Optional (for BYOK)

- OpenAI API key
- Azure OpenAI endpoint + key

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd service
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
# Server Configuration
PORT=3000
GOVERNANCE_PATH=../governance

# Copilot SDK Configuration
COPILOT_AUTH_METHOD=github    # or 'byok'
COPILOT_MODEL=gpt-4           # or 'claude-sonnet-4.5', etc.

# Analysis Settings
ANALYSIS_TIMEOUT_MS=10000
MAX_FILE_SIZE_MB=5
ENABLE_CACHING=false

# BYOK Configuration (optional - only if using API keys)
# OPENAI_API_KEY=sk-...
# AZURE_OPENAI_ENDPOINT=https://....openai.azure.com
# AZURE_OPENAI_KEY=...
# AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### 3. Start Service

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

### 4. Verify Service

```bash
curl http://localhost:3000/health
```

## 🔧 Configuration

### Authentication Methods

#### Option 1: GitHub Copilot (Default)

Uses your existing GitHub Copilot subscription:

```env
COPILOT_AUTH_METHOD=github
```

**Requirements**:
- GitHub Copilot CLI installed
- Authenticated via `copilot auth`
- Active Copilot subscription

#### Option 2: BYOK (Bring Your Own Key)

Use your own OpenAI or Azure OpenAI API:

```env
COPILOT_AUTH_METHOD=byok
OPENAI_API_KEY=sk-...
```

**Note**: BYOK support depends on your Copilot CLI version capabilities.

### Model Selection

Available models (check `copilot models` for your subscription):

- `gpt-4` (default) - OpenAI GPT-4
- `gpt-5` - OpenAI GPT-5 (if available)
- `claude-sonnet-4.5` - Anthropic Claude Sonnet 4.5
- `o1-mini` - OpenAI o1-mini
- `o1-preview` - OpenAI o1-preview

```env
COPILOT_MODEL=claude-sonnet-4.5
```

## 📡 API Endpoints

### `GET /health`

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### `GET /info`

Service information and configuration.

**Response**:
```json
{
  "service": "Guardrail Service",
  "version": "1.0.0",
  "model": "gpt-4",
  "authMethod": "github",
  "governanceRules": 6,
  "systemPromptLength": 15234
}
```

### `POST /analyze`

Analyze a single file.

**Request**:
```json
{
  "filePath": "src/auth.ts",
  "content": "const apiKey = 'hardcoded-secret';",
  "language": "typescript",
  "projectType": "web-app",
  "changedLines": [
    { "start": 1, "end": 1 }
  ]
}
```

**Response**:
```json
{
  "filePath": "src/auth.ts",
  "findings": [
    {
      "id": "sec-001",
      "severity": "HIGH",
      "category": "Security",
      "title": "Hardcoded API Key",
      "description": "API key hardcoded in source code",
      "line": 1,
      "column": 15,
      "snippet": "const apiKey = 'hardcoded-secret';",
      "complianceRefs": ["OWASP A02:2021"],
      "explanation": "Hardcoded credentials can be discovered...",
      "suggestedFix": "const apiKey = process.env.API_KEY;",
      "autoFixable": true,
      "references": [
        {
          "title": "OWASP Sensitive Data Exposure",
          "url": "https://owasp.org/..."
        }
      ]
    }
  ],
  "summary": {
    "totalIssues": 1,
    "high": 1,
    "medium": 0,
    "low": 0,
    "info": 0
  },
  "analysisTime": 1234
}
```

### `POST /analyze-batch`

Analyze multiple files in one request.

**Request**:
```json
{
  "files": [
    {
      "filePath": "src/auth.ts",
      "content": "...",
      "language": "typescript"
    },
    {
      "filePath": "src/db.ts",
      "content": "...",
      "language": "typescript"
    }
  ]
}
```

**Response**:
```json
{
  "results": [
    {
      "filePath": "src/auth.ts",
      "findings": [...],
      "summary": {...},
      "analysisTime": 1234
    },
    {
      "filePath": "src/db.ts",
      "findings": [...],
      "summary": {...},
      "analysisTime": 987
    }
  ],
  "totalFiles": 2,
  "totalIssues": 5,
  "totalTime": 2221
}
```

### `POST /reload-governance`

Reload governance rules from disk.

**Response**:
```json
{
  "message": "Governance rules reloaded",
  "rulesCount": 6
}
```

## 🔍 How SDK Integration Works

### 1. Client Initialization

```typescript
const copilotClient = new CopilotClient({
  useStdio: true,
  autoStart: false,
  autoRestart: true,
  logLevel: 'info',
});
```

### 2. Starting the CLI Server

```typescript
await copilotClient.start();
// Spawns GitHub Copilot CLI process
// Establishes JSON-RPC connection
```

### 3. Creating Analysis Session

```typescript
const session = await copilotClient.createSession({
  model: 'gpt-4',
  systemMessage: {
    mode: 'replace',
    content: governanceRulesAsSystemPrompt,
  },
});
```

### 4. Sending Analysis Request

```typescript
await session.send({
  prompt: `Analyze this code:\n\n${codeSnippet}`,
});
```

### 5. Receiving LLM Response

```typescript
session.on('assistant.message', (event) => {
  responseContent += event.data.content || '';
});

session.on('session.idle', () => {
  // Analysis complete
});
```

### 6. Cleanup

```typescript
await session.destroy();
await copilotClient.stop();
```

## 🛡️ Fallback Mode

If Copilot SDK is unavailable, the service falls back to pattern-based analysis:

- ✅ Still detects common issues (hardcoded secrets, SQL injection patterns)
- ⚠️ Less accurate than LLM analysis
- 🚀 Faster response time
- 📊 Clearly marked in logs

```
⚠️  Falling back to pattern-based analysis...
✅ Mock Analysis complete: 2 issues (45ms)
```

## 📁 Project Structure

```
service/
├── src/
│   ├── index.ts              # Service entry point
│   ├── server.ts             # Express REST API
│   ├── agent.ts              # Copilot SDK wrapper ⭐
│   ├── governance-loader.ts  # Loads markdown rules
│   ├── config.ts             # Environment config
│   └── types/
│       └── index.ts          # TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

## 🐛 Troubleshooting

### Error: "Cannot find module '@github/copilot-sdk'"

```bash
cd service
npm install
```

### Error: "Failed to start Copilot CLI"

**Check CLI installation**:
```bash
copilot --version
```

**Reinstall if needed**:
```bash
npm install -g @github/copilot
copilot auth
```

### Error: "Analysis timeout"

Increase timeout in `.env`:
```env
ANALYSIS_TIMEOUT_MS=20000
```

### Error: "Model not available"

Check available models:
```bash
copilot models
```

Use a model from your subscription.

### Service falls back to mock mode

**Causes**:
- Copilot CLI not installed
- Not authenticated
- Subscription expired
- CLI version incompatible

**Solution**: Install and authenticate Copilot CLI (see Prerequisites).

## 🔐 Security Notes

1. **System Message Replacement**: We use `mode: 'replace'` to provide our governance rules as the system prompt. This removes default SDK guardrails.

2. **API Keys**: If using BYOK, protect your `.env` file:
   ```bash
   chmod 600 .env
   ```

3. **Network**: Service runs on localhost by default. For remote access, use proper authentication.

## 📊 Performance

- **SDK Analysis**: 1-5 seconds per file (depends on LLM)
- **Mock Analysis**: 50-200ms per file (pattern matching)
- **Batch Analysis**: Processes files sequentially

## 🔄 Development

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
npm run lint:fix
```

### Type Check

```bash
npm run typecheck
```

## 📝 License

MIT

## 🤝 Contributing

1. Update governance rules in `../governance/`
2. Modify analysis logic in `src/agent.ts`
3. Test with real code samples
4. Submit PR

## 📚 Resources

- [GitHub Copilot SDK](https://github.com/github/copilot-sdk)
- [GitHub Copilot CLI](https://github.com/github/copilot)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GDPR Compliance](https://gdpr.eu/)
