# Custom Rules Examples

This directory contains example custom governance rules that demonstrate how to bring your own compliance features and rules to the Guardrail system.

## 📁 Directory Structure

```
examples/custom-rules/
├── security/
│   └── api-authentication.md     # Example: Internal API auth requirements
├── compliance/
│   └── data-retention.md         # Example: Data retention policies (GDPR, CCPA)
├── best-practices/
│   └── error-messages.md         # Example: Error message standards
└── README.md                     # This file
```

## 🚀 Usage

### Option 1: Use as Reference

Browse these examples to understand how to write custom rules:
- Rule structure and format
- Markdown frontmatter metadata
- Detection patterns
- Fix suggestions
- Compliance mappings

### Option 2: Use Directly

Point the Guardrail service to this directory:

```bash
# Set environment variable
export CUSTOM_GOVERNANCE_PATHS=/opt/guardrail/examples/custom-rules

# Or in .env file
CUSTOM_GOVERNANCE_PATHS=/path/to/guardrail/examples/custom-rules

# Start the service
cd service
npm run dev
```

### Option 3: Copy and Customize

```bash
# Create your own rules directory
mkdir -p /path/to/my-rules

# Copy examples as templates
cp -r examples/custom-rules/* /path/to/my-rules/

# Customize for your organization
vim /path/to/my-rules/security/api-authentication.md

# Configure service
export CUSTOM_GOVERNANCE_PATHS=/path/to/my-rules
```

## 📝 Example Rules

### 1. API Authentication (`security/api-authentication.md`)

**What it detects:**
- API endpoints without authentication middleware
- Routes accessing sensitive data without auth checks
- Missing JWT verification
- Unprotected admin/internal endpoints

**Why you need it:**
- Enforce company security policy for API endpoints
- Prevent unauthorized access to sensitive data
- SOC2 compliance for access controls

**Customize for:**
- Your specific auth library (e.g., `@company/auth`)
- Internal API patterns
- Framework-specific middleware

### 2. Data Retention (`compliance/data-retention.md`)

**What it detects:**
- Database tables without retention policies
- Logs stored indefinitely
- S3 buckets without lifecycle policies
- Missing data deletion endpoints (GDPR)
- No TTL indexes or cleanup jobs

**Why you need it:**
- GDPR Article 5(1)(e) - Storage Limitation
- GDPR Article 17 - Right to Erasure
- CCPA - Right to Deletion
- Reduce storage costs and breach risk

**Customize for:**
- Your company's retention policy periods
- Data classification requirements
- Industry-specific regulations (HIPAA, FINRA, etc.)

### 3. Error Messages (`best-practices/error-messages.md`)

**What it detects:**
- Stack traces in production responses
- Database errors exposed to users
- Generic "Something went wrong" messages
- Missing error codes or correlation IDs
- Inconsistent error formats

**Why you need it:**
- Security: Prevent information leakage
- UX: Provide helpful error messages
- Operations: Enable error tracking
- PCI-DSS 6.5.5 compliance

**Customize for:**
- Your error code conventions
- Logging standards
- API response format

## 🎯 How to Write Custom Rules

### 1. Choose a Category

```
security/         - Security vulnerabilities and threats
compliance/       - Regulatory and policy requirements  
best-practices/   - Code quality and standards
performance/      - Performance anti-patterns
```

### 2. Create Rule File

Use markdown with YAML frontmatter:

```markdown
---
title: Your Rule Name
severity: HIGH|MEDIUM|LOW|INFO
category: Security|Compliance|BestPractice|Performance
---

# Rule Title

## What to Detect
[Clear description]

## Why It Matters
[Business impact, compliance refs]

## Examples of Violations
❌ BAD: [code examples]

## How to Fix
✅ GOOD: [corrected code]

[Additional sections...]
```

### 3. Key Sections

**Required:**
- `What to Detect` - What code patterns to look for
- `Why It Matters` - Business/security/compliance impact
- `Examples of Violations` - Bad code examples
- `How to Fix` - Corrected code examples

**Recommended:**
- `Detection Patterns` - Specific patterns to search for
- `Severity Assignment` - When to use different severities
- `Remediation Checklist` - Steps to fix
- `References` - Links to docs, standards

**Optional:**
- `Exceptions` - When rule doesn't apply
- `Testing` - How to test fixes
- `Company Policy Requirements` - Internal policies

### 4. Make it Specific

❌ Bad (too vague):
```markdown
## What to Detect
Avoid security issues in authentication
```

✅ Good (specific):
```markdown
## What to Detect
API endpoints that:
- Access user data without requireAuth middleware
- Use routes matching /api/*, /internal/*, /admin/*
- Perform database queries without user context (req.user)
- Are missing JWT token verification
```

### 5. Provide Working Code

Always include syntactically correct code that actually works:

```markdown
## How to Fix

✅ GOOD - Complete working example:
```javascript
const express = require('express');
const jwt = require('jsonwebtoken');

// Authentication middleware
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Protected route
app.get('/api/users', requireAuth, async (req, res) => {
  const users = await db.query(
    'SELECT * FROM users WHERE org_id = ?', 
    [req.user.orgId]
  );
  res.json(users);
});
```
\```
```

## 🧪 Testing Your Rules

### 1. Load and Verify

```bash
# Start service with custom rules
export CUSTOM_GOVERNANCE_PATHS=/path/to/custom-rules
cd service && npm run dev

# Check rules loaded
curl http://localhost:3000/rules | jq '.summary'
```

Expected output:
```json
{
  "total": 8,
  "builtIn": 5,
  "custom": 3,
  "byCategory": {
    "security": 5,
    "compliance": 2,
    "best-practices": 1
  }
}
```

### 2. Test Detection

Create test file with a violation:

```javascript
// test-auth.js
const express = require('express');
const app = express();

// This should trigger api-authentication.md rule
app.get('/api/users', (req, res) => {
  res.json([{ id: 1, email: 'test@example.com' }]);
});
```

Analyze it:

```bash
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "filePath": "test-auth.js",
  "content": "const express = require('express');\nconst app = express();\napp.get('/api/users', (req, res) => { res.json([{id:1}]); });",
  "language": "javascript"
}
EOF
```

Expected: Finding with your custom rule details.

### 3. Verify in Extension

1. Open VS Code with Guardrail extension
2. Create file with violation
3. Save file
4. Check for red squiggles and problem panel
5. Verify custom rule appears in diagnostics

## 📚 Real-World Examples

### Healthcare Organization

```bash
healthcare-rules/
├── compliance/
│   ├── hipaa-phi-encryption.md
│   ├── hipaa-audit-logging.md
│   ├── hipaa-access-controls.md
│   └── hipaa-data-retention.md
├── security/
│   ├── patient-data-access.md
│   └── medical-device-integration.md
└── best-practices/
    └── hl7-fhir-standards.md
```

### Financial Services

```bash
finance-rules/
├── compliance/
│   ├── pci-dss-cardholder-data.md
│   ├── pci-dss-encryption.md
│   ├── sox-audit-trail.md
│   └── aml-transaction-monitoring.md
├── security/
│   ├── payment-processing.md
│   └── fraud-detection.md
└── best-practices/
    └── financial-calculation-accuracy.md
```

### E-Commerce Platform

```bash
ecommerce-rules/
├── compliance/
│   ├── gdpr-consent.md
│   ├── ccpa-opt-out.md
│   └── cookie-compliance.md
├── security/
│   ├── payment-integration.md
│   ├── user-session-security.md
│   └── cart-tampering-prevention.md
└── best-practices/
    ├── inventory-management.md
    └── checkout-flow.md
```

## 🔄 Updating Rules

Rules are loaded at startup. To reload after changes:

```bash
# Hot reload without restart
curl -X POST http://localhost:3000/reload-governance

# Or restart service
npm run dev
```

## 📖 Additional Resources

- [Main Documentation](../../BRING_YOUR_OWN_RULES.md) - Complete guide
- [Governance README](../../governance/README.md) - Rule writing guidelines
- [Rule Library Examples](../../RULES_LIBRARY_EXAMPLES.md) - Built-in rule templates

## 💡 Tips

1. **Start Small:** Begin with 2-3 critical rules for your organization
2. **Be Specific:** Target exact patterns unique to your codebase
3. **Test Thoroughly:** Use sample code to verify detection works
4. **Document Well:** Future you will thank present you
5. **Version Control:** Keep rules in Git alongside your code
6. **Iterate:** Refine rules based on false positives/negatives
7. **Share:** Contribute useful rules back to the community

## 🤝 Contributing

If you create useful generic rules, consider contributing them:

1. Ensure rule is broadly applicable (not company-specific)
2. Test with multiple code examples
3. Write clear documentation
4. Submit PR to main repository

## 📧 Questions?

- Check [BRING_YOUR_OWN_RULES.md](../../BRING_YOUR_OWN_RULES.md)
- Review [governance/README.md](../../governance/README.md)
- Open a GitHub issue

---

**Remember:** Custom rules are just markdown files that guide the LLM. Write clearly, provide context, and show examples!
