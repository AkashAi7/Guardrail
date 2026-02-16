# Bring Your Own Compliance and Rules

This guide explains how to add custom compliance features and rules to the Guardrail system.

## Overview

The Guardrail system supports loading governance rules from multiple directories, allowing you to:

- ✅ Add organization-specific compliance rules
- ✅ Include industry-specific security checks
- ✅ Maintain internal coding standards
- ✅ Keep custom rules separate from built-in rules
- ✅ Update custom rules without modifying the core system

## Quick Start

### 1. Create Your Custom Rules Directory

```bash
mkdir -p /path/to/my-custom-rules/security
mkdir -p /path/to/my-custom-rules/compliance
mkdir -p /path/to/my-custom-rules/best-practices
```

### 2. Add Your Rules as Markdown Files

Create a rule file, for example `/path/to/my-custom-rules/security/api-auth.md`:

```markdown
---
title: Internal API Authentication
severity: HIGH
category: Security
---

# Internal API Authentication

## What to Detect

All internal API endpoints must use JWT-based authentication with our company's auth library.

## Why It Matters

Unauthenticated internal APIs can be exploited by attackers who gain access to the internal network.

**Compliance Impact:**
- SOC2 CC6.1 - Access Controls
- Company Security Policy Section 4.2

## Examples of Violations

❌ BAD:
```javascript
app.get('/api/users', (req, res) => {
  // No authentication check!
  const users = await db.query('SELECT * FROM users');
  res.json(users);
});
```

## How to Fix

✅ GOOD:
```javascript
const { requireAuth } = require('@company/auth');

app.get('/api/users', requireAuth, async (req, res) => {
  const users = await db.query('SELECT * FROM users WHERE org_id = ?', [req.user.orgId]);
  res.json(users);
});
```

## Detection Patterns

Look for:
- Express/Fastify route handlers without authentication middleware
- API endpoints that access sensitive data
- Routes under `/api/*` or `/internal/*` paths

## Severity Assignment

- HIGH: Endpoints that access PII or financial data
- MEDIUM: Endpoints that access non-sensitive user data
- LOW: Public read-only endpoints

## References

- [Company Auth Library Docs](https://docs.company.com/auth)
- [Internal Security Policy](https://wiki.company.com/security)
```

### 3. Configure the Service

Add your custom paths to the environment configuration:

**Option A: Environment Variable**

```bash
export CUSTOM_GOVERNANCE_PATHS=/path/to/my-custom-rules,/another/path/to/rules
```

**Option B: .env File**

```env
CUSTOM_GOVERNANCE_PATHS=/path/to/my-custom-rules,/another/path/to/rules
```

**Option C: Docker Compose**

```yaml
services:
  guardrail:
    environment:
      - CUSTOM_GOVERNANCE_PATHS=/app/custom-rules,/app/team-rules
    volumes:
      - ./my-custom-rules:/app/custom-rules
      - ./team-rules:/app/team-rules
```

### 4. Start the Service

```bash
cd service
npm run dev
```

You should see output like:

```
📚 Loading governance rules from 2 location(s)

📂 Loading from built-in path: /app/governance
   📄 Found 5 governance files
     ✅ Loaded: security/secrets-detection [built-in]
     ✅ Loaded: security/sql-injection [built-in]
     ...

📂 Loading from custom path: /path/to/my-custom-rules
   📄 Found 3 governance files
     ✅ Loaded: security/api-auth [custom]
     ✅ Loaded: compliance/data-retention [custom]
     ...

✅ Total loaded: 8 governance rules
   - Built-in: 5 rules
   - Custom: 3 rules
```

### 5. Verify Rules Are Loaded

```bash
curl http://localhost:3000/rules
```

Response:

```json
{
  "success": true,
  "summary": {
    "total": 8,
    "builtIn": 5,
    "custom": 3,
    "byCategory": {
      "security": 5,
      "compliance": 2,
      "best-practices": 1
    }
  },
  "rules": [
    {
      "title": "secrets-detection",
      "category": "security",
      "source": "built-in",
      "sourcePath": "/app/governance",
      "filePath": "/app/governance/security/secrets-detection.md"
    },
    {
      "title": "Internal API Authentication",
      "category": "security",
      "source": "custom",
      "sourcePath": "/path/to/my-custom-rules",
      "filePath": "/path/to/my-custom-rules/security/api-auth.md"
    }
    // ... more rules
  ]
}
```

## Directory Structure

Organize your custom rules using the same structure as built-in rules:

```
my-custom-rules/
├── security/           # Security-specific rules
│   ├── api-auth.md
│   ├── internal-services.md
│   └── data-encryption.md
├── compliance/         # Regulatory compliance rules
│   ├── data-retention.md
│   ├── audit-logging.md
│   └── sox-controls.md
├── best-practices/     # Coding standards and patterns
│   ├── error-messages.md
│   ├── logging-standards.md
│   └── naming-conventions.md
└── performance/        # Performance-related rules
    └── database-queries.md
```

## Rule File Format

Each rule file must follow this format:

```markdown
---
title: Human-Readable Rule Name
severity: HIGH|MEDIUM|LOW|INFO
category: Security|Compliance|BestPractice|Performance
---

# Rule Title

## What to Detect
Clear description of what code patterns to look for

## Why It Matters
Business impact, security risks, compliance requirements

## Examples of Violations
❌ BAD: [problematic code with explanations]

## How to Fix
✅ GOOD: [correct code with working examples]

## Detection Patterns
Patterns to search for (optional, for reference)

## Severity Assignment
When to assign different severity levels

## References
- [Link to standards]
- [Link to documentation]
```

## Use Cases

### 1. Industry-Specific Compliance

**Healthcare (HIPAA):**
```bash
my-rules/
└── compliance/
    ├── hipaa-phi-encryption.md
    ├── hipaa-audit-logging.md
    └── hipaa-access-controls.md
```

**Finance (PCI-DSS):**
```bash
my-rules/
└── compliance/
    ├── pci-cardholder-data.md
    ├── pci-encryption-transit.md
    └── pci-access-logging.md
```

### 2. Company Coding Standards

```markdown
---
title: Company Logging Standards
severity: MEDIUM
category: BestPractice
---

# Company Logging Standards

All services must use our centralized logging library with structured logging.

## What to Detect
- Use of console.log/console.error
- Missing correlation IDs
- Unstructured log messages

## How to Fix
✅ Use @company/logger:
```javascript
const logger = require('@company/logger');

logger.info('User login', {
  userId: user.id,
  correlationId: req.correlationId,
  event: 'user.login'
});
```
```

### 3. Framework-Specific Rules

```markdown
---
title: React State Management
severity: LOW
category: BestPractice
---

# React State Management

Use our approved state management library (Zustand) for global state.

## What to Detect
- Direct use of Redux
- Context API for complex state
- Props drilling more than 2 levels

## Why It Matters
Consistent state management improves maintainability and team velocity.
```

### 4. Multi-Team Setup

Each team can have their own rules:

```bash
# Configure multiple custom paths
CUSTOM_GOVERNANCE_PATHS=/company-wide-rules,/team-frontend-rules,/team-backend-rules
```

```
/company-wide-rules/        # Organization-wide standards
  ├── security/
  └── compliance/

/team-frontend-rules/       # Frontend team standards
  ├── best-practices/
  │   ├── react-patterns.md
  │   └── accessibility.md
  └── performance/

/team-backend-rules/        # Backend team standards
  ├── best-practices/
  │   ├── api-design.md
  │   └── database-patterns.md
  └── performance/
```

## Best Practices

### ✅ DO

1. **Use Clear Titles:** Make rule names descriptive and searchable
2. **Provide Examples:** Include both bad and good code samples
3. **Explain Why:** Always include business/security impact
4. **Be Specific:** Define exact patterns to detect
5. **Link References:** Point to internal docs, standards, or external resources
6. **Version Control:** Keep custom rules in Git
7. **Review Regularly:** Update rules as standards evolve

### ❌ DON'T

1. **Don't Be Vague:** Avoid generic advice without specifics
2. **Don't Duplicate:** Check if a built-in rule already covers this
3. **Don't Over-Restrict:** Leave room for valid exceptions
4. **Don't Skip Testing:** Test rules with sample code before deploying
5. **Don't Hardcode Secrets:** Keep sensitive info out of rule examples

## Updating Custom Rules

### Reload Rules Without Restart

```bash
curl -X POST http://localhost:3000/reload-governance
```

This reloads all rules from all configured paths without restarting the service.

### Hot Reload in Development

If you're frequently editing rules during development:

```bash
# Watch for changes and auto-reload
watch -n 5 'curl -X POST http://localhost:3000/reload-governance'
```

## Testing Custom Rules

### 1. Test with Sample Code

Create a test file with code that should trigger your rule:

```javascript
// test-api-auth.js
const express = require('express');
const app = express();

// This SHOULD be flagged by api-auth.md rule
app.get('/api/users', (req, res) => {
  res.json([{ id: 1, name: 'Alice' }]);
});
```

### 2. Analyze with API

```bash
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "test-api-auth.js",
    "content": "const app = express();\napp.get(\"/api/users\", (req, res) => { res.json([{id:1}]); });",
    "language": "javascript"
  }'
```

### 3. Verify Detection

Check that your custom rule appears in the findings:

```json
{
  "success": true,
  "result": {
    "findings": [
      {
        "title": "Internal API Authentication",
        "severity": "HIGH",
        "category": "Security",
        "description": "API endpoint missing authentication middleware",
        // ...
      }
    ]
  }
}
```

## Advanced Configuration

### Conditional Loading

Load different rules based on environment:

```bash
# .env.production
CUSTOM_GOVERNANCE_PATHS=/company-rules,/strict-security-rules

# .env.development
CUSTOM_GOVERNANCE_PATHS=/company-rules,/dev-friendly-rules
```

### Priority and Overrides

Rules from custom paths are loaded **after** built-in rules. The LLM considers all rules, but you can emphasize priority in the rule content:

```markdown
---
title: CRITICAL - Company Data Classification
severity: HIGH
category: Compliance
---

**⚠️ MANDATORY COMPANY POLICY - BLOCKING VIOLATION**

This rule takes precedence over standard GDPR rules...
```

### Excluding Built-in Rules

If you want to disable a built-in rule, create a custom rule with the same category/title that explicitly states it should be ignored, or remove the built-in governance path entirely:

```bash
# Use ONLY custom rules (no built-in rules)
GOVERNANCE_PATH=/my-custom-rules
CUSTOM_GOVERNANCE_PATHS=
```

## Troubleshooting

### Rules Not Loading

```bash
# Check service logs
npm run dev

# Look for:
# ⚠️  Custom governance path not found: /path/to/rules
```

**Solution:** Verify the path exists and contains `.md` files.

### Rules Not Detecting Issues

1. **Check rule is loaded:**
   ```bash
   curl http://localhost:3000/rules | jq '.rules[] | select(.title == "Your Rule")'
   ```

2. **Reload rules:**
   ```bash
   curl -X POST http://localhost:3000/reload-governance
   ```

3. **Test with obvious violation:** Make sure your test code clearly violates the rule.

4. **Check LLM response:** Review service logs for analysis details.

### Path Issues in Docker

```yaml
services:
  guardrail:
    volumes:
      # Mount custom rules as read-only
      - ./custom-rules:/app/custom-rules:ro
    environment:
      # Use container path
      - CUSTOM_GOVERNANCE_PATHS=/app/custom-rules
```

## Examples Repository

See `examples/custom-rules/` directory for complete examples:

- `examples/custom-rules/company-security/` - Company-specific security rules
- `examples/custom-rules/hipaa-compliance/` - Healthcare compliance rules
- `examples/custom-rules/coding-standards/` - Coding standards and patterns

## Support

- **Documentation:** See [governance/README.md](./governance/README.md) for rule writing guidelines
- **Examples:** Check [RULES_LIBRARY_EXAMPLES.md](./RULES_LIBRARY_EXAMPLES.md) for rule templates
- **API Reference:** See [service/README.md](./service/README.md) for API documentation

## Summary

The "Bring Your Own Rules" feature allows you to:

1. ✅ **Keep custom rules separate** from built-in rules
2. ✅ **Load rules from multiple directories** for team-specific standards
3. ✅ **Update rules without code changes** - just edit markdown files
4. ✅ **Version control your governance** - rules are just files in Git
5. ✅ **Maintain organizational compliance** - add industry-specific checks
6. ✅ **Scale across teams** - each team can have their own rule sets

Start small with a few critical rules, then expand your governance library over time!
