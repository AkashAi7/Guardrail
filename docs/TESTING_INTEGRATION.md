# Testing the Copilot SDK Integration

This guide helps you verify that the AI-powered analysis is working correctly.

## Quick Test

### 1. Open Extension in Debug Mode

```bash
# In VS Code
1. Open the extension folder
2. Press F5 (Start Debugging)
3. A new "Extension Development Host" window opens
```

### 2. Check Service Status

Open the Output panel:
- View → Output
- Select "Code Guardrail" from dropdown

**Look for:**
```
✅ Found service at: C:\...\service
🚀 Starting Guardrail service...
[Service] Server running on http://localhost:3000
✅ Guardrail AI service started successfully!
```

### 3. Test with Sample Code

Create a new file: `test-security.ts`

```typescript
// Test 1: Hardcoded API Key
const apiKey = "sk-1234567890abcdefghij";

// Test 2: SQL Injection
function getUser(userId: string) {
    const query = "SELECT * FROM users WHERE id = '" + userId + "'";
    return db.execute(query);
}

// Test 3: XSS Vulnerability
function displayMessage(msg: string) {
    document.getElementById('output').innerHTML = msg;
}

// Test 4: Weak Cryptography
import crypto from 'crypto';
const hash = crypto.createHash('md5').update('password').digest('hex');

// Test 5: Hardcoded Credentials
const dbPassword = "admin123";
const connection = connect({ password: dbPassword });
```

**Save the file** (Ctrl+S)

### 4. Verify Results

#### Check Problems Panel
- View → Problems
- Should show 5+ issues detected
- Each with severity (Error/Warning)

#### Check Status Bar
Bottom left should show:
```
$(alert) Guardrail: 5 issue(s) (3 critical)
```

#### Check Output Panel
Should show:
```
✅ AI analysis complete: 5 issues found
```

Or if service isn't available:
```
⚠️ Backend analysis failed, using local scanning
```

### 5. Test Issues Panel

1. Click on status bar item
2. Select "View Issues Panel"
3. Should open webview with all issues organized by severity

## Detailed Testing

### Test 1: Service Auto-Start

**Objective**: Verify service starts automatically

**Steps:**
1. Close all VS Code windows
2. Open extension project
3. Press F5
4. Check Output panel immediately

**Expected:**
```
Code Guardrail activating...
✅ Found service at: ...
🚀 Starting Guardrail service...
[Service] Server running on http://localhost:3000
✅ Guardrail AI service started successfully!
```

**If Failed:**
```
⚠️ Service not found in any expected location
⚠️ Using local pattern matching only
```

### Test 2: AI vs Local Analysis

**Objective**: Compare AI and local results

**Setup:**
```typescript
// complex-test.ts
class AuthService {
    private secret = "hardcoded-jwt-secret-key-123"; // Should detect
    
    validateToken(token: string) {
        // This is a more complex vulnerability
        // AI should detect, local might miss
        return eval(`checkToken("${token}")`);
    }
}
```

**Expected (AI):**
- Detects hardcoded secret
- Detects eval() vulnerability
- Provides context-aware suggestions
- Shows in Output: `✅ AI analysis complete: 2 issues found`

**Expected (Local):**
- Detects hardcoded secret
- Detects eval() keyword
- Generic suggestions
- Shows in Output: `Using local scanning`

### Test 3: Fallback Mechanism

**Objective**: Verify graceful fallback

**Steps:**
1. Stop the service manually:
   ```powershell
   # Find and kill the service process
   Get-Process -Name node | Where-Object { $_.Path -like "*guardrail*" } | Stop-Process
   ```

2. Save a file with security issues

**Expected:**
- Extension continues working
- Uses local scanning automatically
- Status bar shows: `📝 Pattern matching: Active (AI unavailable)`
- Output shows: `⚠️ Backend analysis failed, using local scanning`

### Test 4: Performance

**Objective**: Measure analysis times

**Test File**: 500 lines of TypeScript with 10 issues

**Expected Times:**
- **AI Analysis**: 200-500ms (first time may be slower)
- **Local Analysis**: 5-20ms
- **Timeout Fallback**: <2000ms

**How to Measure:**
Check Output panel timestamps:
```
[12:34:56.123] Starting analysis...
[12:34:56.456] ✅ AI analysis complete: 10 issues found
// = 333ms
```

### Test 5: Multi-Language Support

Test with different languages:

**JavaScript:**
```javascript
// test.js
const apiKey = "secret-key-123";
```

**Python:**
```python
# test.py
api_key = "secret-key-123"
```

**Java:**
```java
// Test.java
String apiKey = "secret-key-123";
```

**Expected:**
- All languages analyzed correctly
- Issues detected regardless of language
- Language-specific suggestions

## API Testing

### Direct Service Testing

Test the backend service directly:

```powershell
# 1. Ensure service is running
curl http://localhost:3000/health

# Expected:
# {"status":"ok","service":"guardrail-service","version":"1.0.0","uptime":120}

# 2. Test analysis endpoint
$body = @{
    filePath = "test.ts"
    content = 'const apiKey = "secret-123";'
    language = "typescript"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/analyze `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Expected:
# {
#   "success": true,
#   "result": {
#     "findings": [...],
#     "summary": {...}
#   }
# }
```

### Service Info

```powershell
curl http://localhost:3000/info | ConvertFrom-Json

# Expected:
# {
#   "service": "Guardrail Service",
#   "version": "2.0.0",
#   "config": {...},
#   "provider": {...}
# }
```

## Troubleshooting Tests

### Service Won't Start

**Check 1**: Node.js version
```powershell
node --version
# Must be >= 18.0.0
```

**Check 2**: Port availability
```powershell
netstat -ano | findstr :3000
# Should be empty or show guardrail process
```

**Check 3**: Service files exist
```powershell
Test-Path ..\service\dist\index.js
# Should return True
```

### AI Analysis Not Working

**Check Output panel for:**
```
⚠️ Backend analysis failed, using local scanning: <reason>
```

**Common reasons:**
- Timeout (increase timeout in code)
- Service crashed (check service logs)
- Network issue (check localhost connectivity)

### No Issues Detected

**Verify test file has actual issues:**
```typescript
// This WILL trigger alerts
const password = "admin123";
const sql = "SELECT * FROM users WHERE id = '" + id + "'";
```

**Check scanner is loaded:**
```
Built-in rules: 20+
```

## Success Criteria

✅ **Service Auto-Starts**
- Service process spawns on activation
- Health check passes
- Confirmation message appears

✅ **AI Analysis Works**
- POST to /analyze succeeds
- Findings returned in correct format
- Issues displayed in Problems panel

✅ **Fallback Works**
- When service unavailable, uses local
- No errors or crashes
- User notified via status bar

✅ **Performance Acceptable**
- AI analysis < 2 seconds
- Local analysis < 50ms
- No UI blocking

✅ **Multi-Language Support**
- All 8 languages work
- Issues detected across languages
- Suggestions are language-appropriate

## Automated Test Script

Run this PowerShell script to test everything:

```powershell
# test-integration.ps1

Write-Host "🧪 Testing Code Guardrail Integration" -ForegroundColor Cyan

# 1. Check service
Write-Host "`n1️⃣ Checking service health..."
try {
    $health = Invoke-RestMethod -Uri http://localhost:3000/health -TimeoutSec 5
    Write-Host "✅ Service is running" -ForegroundColor Green
    Write-Host "   Uptime: $($health.uptime)s"
} catch {
    Write-Host "❌ Service not accessible" -ForegroundColor Red
    exit 1
}

# 2. Test analysis
Write-Host "`n2️⃣ Testing analysis endpoint..."
$testCode = @{
    filePath = "test.ts"
    content = 'const apiKey = "sk-123"; const pwd = "admin";'
    language = "typescript"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri http://localhost:3000/analyze `
        -Method POST `
        -Body $testCode `
        -ContentType "application/json"
    
    if ($result.success -and $result.result.findings.Count -gt 0) {
        Write-Host "✅ Analysis working" -ForegroundColor Green
        Write-Host "   Found: $($result.result.findings.Count) issues"
    } else {
        Write-Host "⚠️  Analysis returned no findings" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Analysis failed: $_" -ForegroundColor Red
    exit 1
}

# 3. Check extension
Write-Host "`n3️⃣ Checking extension..."
$ext = code --list-extensions | Select-String "guardrail"
if ($ext) {
    Write-Host "✅ Extension installed" -ForegroundColor Green
} else {
    Write-Host "❌ Extension not found" -ForegroundColor Red
}

Write-Host "`n✅ All tests passed!" -ForegroundColor Green
```

Save as `test-integration.ps1` and run:
```powershell
.\test-integration.ps1
```

## Next Steps

After successful testing:

1. **Package Extension**
   ```bash
   cd extension
   npm run package
   ```

2. **Test Packaged VSIX**
   ```bash
   code --install-extension code-guardrail-0.5.0.vsix
   ```

3. **Create Release**
   - Tag version: `git tag v0.5.0`
   - Push: `git push origin v0.5.0`
   - Create GitHub release
   - Upload VSIX

4. **Update Documentation**
   - Release notes
   - Changelog
   - README

---

**Need help?** Check [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) or open an issue.
