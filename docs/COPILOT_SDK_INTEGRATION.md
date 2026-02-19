# Copilot SDK Integration

## Overview

Code Guardrail v0.4.0 introduces **hybrid intelligence** - combining AI-powered analysis with local pattern matching for the best of both worlds.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VS Code Extension                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Extension Activation                                 │  │
│  │  - Initialize ServiceManager                          │  │
│  │  - Auto-start backend service                         │  │
│  │  - Start listening for file changes                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  analyzeDocument()                                    │  │
│  │  1. Check if service is running                       │  │
│  │  2. Try AI analysis first                             │  │
│  │  3. Fallback to local scanning if needed              │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│              ┌─────────────┴─────────────┐                  │
│              ▼                           ▼                  │
│  ┌────────────────────┐      ┌────────────────────┐       │
│  │  AI Analysis       │      │  Local Scanning     │       │
│  │  (Primary)         │      │  (Fallback)         │       │
│  └────────────────────┘      └────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   Backend Service (Node.js)    │
            │   - Port: 3000                 │
            │   - Auto-started by extension  │
            │   - GitHub Copilot SDK         │
            │   - Express REST API           │
            └───────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   GitHub Copilot SDK          │
            │   @github/copilot-sdk         │
            │   - Contextual analysis       │
            │   - Semantic understanding    │
            │   - Fix suggestions           │
            └───────────────────────────────┘
```

## How It Works

### 1. Extension Activation

When VS Code starts:

1. **ServiceManager** is initialized
2. Service path is discovered (bundled with extension)
3. Node.js process is spawned running `service/dist/index.js`
4. Health check confirms service is running
5. Extension shows status: "✅ Guardrail AI service started successfully!"

### 2. File Analysis Flow

When you save a file:

```typescript
// extension/src/extension.ts

async function analyzeDocument(document: vscode.TextDocument) {
    // 1. Try AI analysis (if service is running)
    if (serviceManager && serviceManager.isRunning()) {
        try {
            const response = await serviceManager.makeRequest('/analyze', 'POST', {
                content: text,
                filePath: document.fileName,
                language: document.languageId
            });
            // Use AI results
            findings = mapBackendResponse(response);
        } catch (error) {
            // 2. Fallback to local regex patterns
            findings = scanner.scan(text, document.fileName);
        }
    } else {
        // 3. Service not available - use local patterns
        findings = scanner.scan(text, document.fileName);
    }
    
    // Display results in Problems panel
    displayDiagnostics(findings);
}
```

### 3. Backend API

The service exposes REST endpoints:

#### **POST /analyze**

**Request:**
```json
{
  "filePath": "src/auth.ts",
  "content": "const apiKey = 'hardcoded-secret';",
  "language": "typescript"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "filePath": "src/auth.ts",
    "findings": [
      {
        "id": "SEC-002",
        "severity": "HIGH",
        "category": "Security",
        "title": "Hardcoded Secret",
        "description": "API key should not be hardcoded in source code",
        "line": 1,
        "snippet": "const apiKey = 'hardcoded-secret';",
        "explanation": "Hardcoded credentials expose secrets in version control",
        "suggestedFix": "Use environment variables: process.env.API_KEY",
        "autoFixable": false
      }
    ],
    "summary": {
      "totalIssues": 1,
      "high": 1,
      "medium": 0,
      "low": 0,
      "info": 0
    },
    "analysisTime": 234
  }
}
```

## Service Auto-Start

### ServiceManager Implementation

```typescript
// extension/src/serviceManager.ts

export class ServiceManager {
    private serviceProcess: ChildProcess | null = null;
    
    async start(): Promise<boolean> {
        // 1. Check if already running
        if (await this.checkServiceHealth()) {
            return true;
        }
        
        // 2. Find service location
        const servicePath = this.getServicePath();
        
        // 3. Spawn Node.js process
        this.serviceProcess = spawn(nodeExecutable, [indexPath], {
            cwd: servicePath,
            env: {
                ...process.env,
                PORT: '3000'
            }
        });
        
        // 4. Wait for service to be ready
        return this.waitForHealthCheck();
    }
}
```

### Service Discovery

The extension looks for the service in these locations:

1. **Development**: `../service` (when running from source)
2. **Bundled**: `extension/service` (packaged in VSIX)
3. **Global**: `~/.guardrail/service` (standalone installation)

## Benefits of Hybrid Approach

### ✅ AI Analysis (When Available)

- **Contextual Understanding**: Understands code semantics
- **Complex Patterns**: Detects subtle vulnerabilities
- **Better Explanations**: Detailed fix suggestions
- **Adaptive**: Learns from governance rules

### ✅ Local Scanning (Always Available)

- **Offline Support**: Works without network
- **Zero Latency**: Instant responses
- **Privacy**: No code leaves your machine
- **Reliable**: Always works even if service fails

### ✅ Seamless Experience

- **No Configuration**: Service auto-starts
- **Automatic Fallback**: Degradation is invisible
- **Status Visibility**: Shows which mode is active
- **Performance**: Uses fastest available method

## Development Setup

### 1. Build the Extension

```bash
cd extension
npm install
npm run compile
```

### 2. Build the Service

```bash
cd service
npm install
npm run build
```

### 3. Test in VS Code

1. Open extension folder in VS Code
2. Press F5 to launch Extension Development Host
3. Open a file with security issues
4. Check Output panel for service logs

### 4. Verify Integration

Open any code file and check:

```typescript
// This should trigger an alert
const apiKey = "sk-1234567890";
```

- Status bar shows issue count
- Problems panel shows the issue
- Output shows whether AI or local scanning was used

## Configuration

### Extension Settings

Future versions will support:

```json
{
  "codeGuardrail.useAI": true,
  "codeGuardrail.servicePort": 3000,
  "codeGuardrail.fallbackToLocal": true,
  "codeGuardrail.serviceTimeout": 10000
}
```

### Environment Variables

Service configuration:

```bash
# Service
PORT=3000
NODE_ENV=production

# Copilot SDK (auto-detected from VS Code)
GITHUB_TOKEN=<auto>
```

## Troubleshooting

### Service Won't Start

Check Output panel (View → Output → Code Guardrail):

```
[Service] Starting Guardrail service...
[Service Error] Port 3000 already in use
```

**Solution**: Change port or stop conflicting process

### AI Analysis Not Working

Status bar shows: `📝 Pattern matching: Active (AI unavailable)`

**Possible causes**:
1. Service failed to start
2. Service crashed
3. Timeout exceeded
4. Network issues

**Extension automatically falls back to local scanning**

### Viewing Service Logs

Open VS Code Output panel:
- View → Output
- Select "Code Guardrail" from dropdown
- Watch for:
  - `✅ Guardrail AI service started successfully!`
  - `✅ AI analysis complete: X issues found`
  - `⚠️ Backend analysis failed, using local scanning`

## Performance

### Benchmarks

| Method | Avg Time | Max Time | Reliability |
|--------|----------|----------|-------------|
| AI Analysis | 200-500ms | 2s | 98% (with network) |
| Local Scanning | 5-20ms | 50ms | 100% |
| Hybrid (this) | 5-500ms | 2s | 100% |

### Optimization

- AI analysis runs async (non-blocking)
- Results cached for unchanged files
- Local scanning always available as backup
- Service process reused across analyses

## Future Enhancements

### Planned Features

1. **Configuration Options**: Port, timeout, fallback behavior
2. **Service Status Panel**: Live view of service health
3. **Analysis Mode Selection**: Force AI or local
4. **Custom LLM Providers**: BYOK (Bring Your Own Key)
5. **Batch Analysis**: Scan entire workspace with AI

### API Expansion

Future endpoints:
- `POST /analyze-workspace` - Scan entire project
- `POST /explain` - Deep dive on specific issue
- `POST /auto-fix` - Apply suggested fixes
- `GET /statistics` - Analysis history and stats

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Code style guidelines
- Testing requirements
- PR process

## License

MIT License - see [LICENSE](../LICENSE)

---

**Questions?** Open an issue at https://github.com/AkashAi7/Guardrail/issues
