---
title: Hardcoded Secrets Detection
severity: HIGH
category: Security
---

# Security Rule: Hardcoded Secrets Detection

## What to Detect

Look for hardcoded sensitive credentials in source code including:

### API Keys and Tokens
- Generic API keys: `api_key = "abc123xyz"`
- Service-specific keys: Stripe, AWS, Azure, Google Cloud
- OAuth tokens and bearer tokens
- JWT secrets

### Credentials
- Passwords: `password = "mySecret123"`
- Database credentials in connection strings
- SSH/RSA private keys
- Certificate private keys

### Platform-Specific Patterns
- **Stripe:** `sk_live_`, `pk_live_`, `rk_live_`
- **AWS:** `AKIA...` (20 chars), Secret Access Keys
- **GitHub:** `ghp_`, `gho_`, `ghs_`, `ghr_` tokens
- **Azure:** Connection strings with AccountKey
- **Google:** API keys, OAuth client secrets

## Why It Matters

**Security Risks:**
- 🔓 Exposed in version control history (permanently!)
- 👁️ Visible to anyone with repository access
- 📝 Can leak in logs, error messages, stack traces
- 🚨 Enables unauthorized access to production systems
- 💰 Potential for financial loss or data breach

**Compliance Violations:**
- **SOC2 CC6.1:** Logical and Physical Access Controls (CRITICAL)
- **GDPR Article 32:** Security of Processing (HIGH)
- **PCI-DSS 3.4:** Render PAN unreadable anywhere it's stored (CRITICAL)
- **NIST 800-53 IA-5:** Authenticator Management
- **ISO 27001:** Access control and key management

**Real-World Impact:**
- Average cost of exposed credentials: $4.5M per incident
- 20% of data breaches involve compromised credentials
- Credentials remain in Git history even after deletion

## Examples of Violations

### ❌ BAD: TypeScript/JavaScript
```typescript
// Direct hardcoding
const STRIPE_SECRET = "sk_live_51HxYzABCDEF123456";
const API_KEY = "abc123def456xyz789";

// In configuration object
const config = {
  database: {
    host: "db.example.com",
    password: "P@ssw0rd123"  // NEVER!
  }
};

// Connection strings
const dbUrl = "postgresql://admin:supersecret@db.prod.com:5432/maindb";
```

### ❌ BAD: Python
```python
# Environment-like but still hardcoded
API_KEY = "sk_proj_abcd1234efgh5678"
DATABASE_URL = "mysql://root:password123@localhost/prod"

# In class attributes
class Config:
    SECRET_KEY = "django-insecure-hardcoded-key-12345"
    AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
```

### ❌ BAD: Java
```java
// Constants (still vulnerable!)
private static final String API_TOKEN = "ghp_16C7e42F292c6912E7710c838347Ae178B4a";

// JDBC URLs
String jdbcUrl = "jdbc:postgresql://localhost/db?user=admin&password=secret";
```

## How to Fix

### ✅ GOOD: Environment Variables (Development & CI/CD)

**TypeScript/JavaScript:**
```typescript
// Load from environment
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

// With validation
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const apiKey = getRequiredEnv('API_KEY');
```

**Python:**
```python
import os
from typing import Optional

# Basic
API_KEY = os.environ.get('API_KEY')
if not API_KEY:
    raise ValueError('API_KEY environment variable required')

# With defaults for dev (not production!)
def get_env(key: str, default: Optional[str] = None) -> str:
    value = os.getenv(key, default)
    if value is None:
        raise ValueError(f'Missing environment variable: {key}')
    return value

api_key = get_env('API_KEY')
```

**.env file (NEVER commit this!):**
```env
API_KEY=sk_live_actual_key_here
DATABASE_URL=postgresql://user:pass@localhost/db
STRIPE_SECRET_KEY=sk_live_stripe_key
```

**Important:**
```gitignore
# .gitignore - ALWAYS include
.env
.env.local
.env.*.local
*.env
secrets/
```

### ✅ BETTER: Secret Management Services (Production)

**AWS Secrets Manager:**
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getSecret(secretName: string): Promise<string> {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  return response.SecretString!;
}

const apiKey = await getSecret("prod/api/stripe-key");
```

**Azure Key Vault:**
```typescript
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();
const vaultUrl = "https://myvault.vault.azure.net";
const client = new SecretClient(vaultUrl, credential);

const secret = await client.getSecret("api-key");
const apiKey = secret.value;
```

**HashiCorp Vault:**
```python
import hvac

client = hvac.Client(url='https://vault.example.com')
client.token = os.environ['VAULT_TOKEN']

secret = client.secrets.kv.v2.read_secret_version(path='prod/api-keys')
api_key = secret['data']['data']['stripe_key']
```

### ✅ BEST: Managed Identity / Workload Identity

**Azure Managed Identity:**
```typescript
// No secrets needed at all!
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// Automatically uses managed identity in Azure
const credential = new DefaultAzureCredential();
const client = new SecretClient(vaultUrl, credential);
```

## Detection Patterns

When analyzing code, check for:

### 1. Direct Assignment Patterns
```regex
(?:api[_-]?key|apikey|api[_-]?secret|token|password|passwd|pwd|secret)\s*[:=]\s*["'][^"']{8,}["']
```

### 2. Service-Specific Patterns
```regex
# Stripe
['"](?:sk|pk|rk)_(live|test)_[a-zA-Z0-9]{24,}['"]

# AWS
AKIA[0-9A-Z]{16}

# GitHub
gh[ps]_[a-zA-Z0-9]{36}

# Private Keys
-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----
```

### 3. Connection Strings
```regex
(?:postgresql|mysql|mongodb|redis)://[^:]+:[^@]+@
```

### 4. Context Analysis
- Variable names suggesting secrets
- Comments mentioning "temporary" or "TODO: move to env"
- Base64 encoded strings that decode to credentials

## Severity Assignment

**Always HIGH unless:**
- It's clearly a fake/example value (e.g., `"your-api-key-here"`)
- It's in a test file AND clearly marked as mock data
- It's in documentation/example files

**Upgrade to CRITICAL if:**
- It's a production API key (`_live_`, `prod`, etc.)
- Database credentials for production
- Cloud provider root/admin credentials

## Auto-Fix Strategy

1. **Extract the value**
2. **Determine environment variable name:**
   - Convert to SCREAMING_SNAKE_CASE
   - Make descriptive: `API_KEY` → `STRIPE_API_KEY`
3. **Replace in code:**
   ```typescript
   // Before
   const apiKey = "sk_live_123";
   
   // After
   const apiKey = process.env.STRIPE_API_KEY;
   if (!apiKey) throw new Error('STRIPE_API_KEY required');
   ```
4. **Add to .env.example:**
   ```
   STRIPE_API_KEY=your_key_here
   ```
5. **Update .gitignore** to exclude `.env`
6. **Add to README:** Document required environment variables

## Exceptions and False Positives

### Acceptable in These Cases:
- **Test Fixtures:** Clearly marked mock/test data
  ```typescript
  const MOCK_API_KEY = "test_key_12345"; // OK in test files
  ```

- **Example/Documentation:**
  ```typescript
  // Example usage (not real key):
  // const key = "sk_live_abc123...";
  ```

- **Public/Demo Keys:**
  ```typescript
  // Documented as public demo key
  const DEMO_KEY = "pk_test_public_demo_12345";
  ```

### How to Suppress:
```typescript
// guardrail-ignore: hardcoded-secret - Public demo key from documentation
const PUBLIC_API_KEY = "pk_demo_12345";
```

## References

- [OWASP: Use of Hard-coded Password](https://owasp.org/www-community/vulnerabilities/Use_of_hardcoded_password)
- [CWE-798: Use of Hard-coded Credentials](https://cwe.mitre.org/data/definitions/798.html)
- [GitHub: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [NIST: Authentication Management](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-63b.pdf)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)

## Remediation Checklist

When fixing hardcoded secrets:
- [ ] Move secret to environment variable or secret manager
- [ ] Update .env.example with placeholder
- [ ] Ensure .env in .gitignore
- [ ] Rotate the exposed secret (invalidate old one)
- [ ] Scan Git history for the secret
- [ ] Consider using git-secrets or similar tools
- [ ] Document required environment variables in README
- [ ] Set up CI/CD secrets properly
- [ ] Enable secret scanning (GitHub, GitLab, etc.)

---

**Remember:** Once a secret is committed to Git, assume it's compromised. Always rotate exposed credentials!
