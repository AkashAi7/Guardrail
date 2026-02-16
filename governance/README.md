# Governance Rules Library

This directory contains governance rules that guide the Code Guardrail Agent's analysis. Rules are written as natural language markdown files that the LLM can understand directly (rules-as-prompts).

## Directory Structure

```
governance/
├── 00-system-prompt.md          # Core system instructions
├── security/                     # Security rules
│   ├── secrets-detection.md     # Hardcoded credentials
│   ├── sql-injection.md         # SQL injection prevention
│   └── xss-prevention.md        # XSS prevention
├── compliance/                   # Compliance rules (GDPR, HIPAA, etc.)
│   └── gdpr-pii.md              # GDPR personal data handling
└── best-practices/               # Code quality and best practices
    └── error-handling.md        # Async error handling

```

## How It Works

### Rules-as-Prompts Philosophy

Instead of complex rule engines with regex patterns and AST parsers, we use **natural language governance prompts** that the LLM understands natively:

1. **Markdown Format:** Each rule is a markdown file with frontmatter metadata
2. **Semantic Understanding:** The LLM reads the rules and applies them semantically
3. **Context-Aware:** Rules include examples, explanations, and context
4. **No Code Generation Needed:** LLM already knows programming languages

### Rule File Format

```markdown
---
title: Rule Name
severity: HIGH|MEDIUM|LOW|INFO
category: Security|Compliance|BestPractice|Performance
---

# Rule Title

## What to Detect
Clear description of what to look for...

## Why It Matters
Explain the risks, compliance requirements, business impact...

## Examples of Violations
❌ BAD: Show problematic code with multiple languages...

## How to Fix
✅ GOOD: Show the correct approach with working code...

## Detection Patterns
Patterns to search for (for reference)...

## Severity Assignment
When to assign HIGH vs MEDIUM vs LOW...

## References
Links to standards, documentation...

## Remediation Checklist
Steps to fix the issue...
```

### Metadata Fields

- **title:** Human-readable rule name
- **severity:** Default severity (can be adjusted by context)
- **category:** Security, Compliance, BestPractice, Performance, etc.

## Available Rules

### Core (Priority: CRITICAL)

#### `00-system-prompt.md`
Defines the agent's role, analysis approach, output format, and quality standards. This is always loaded first.

### Security Rules (Priority: HIGH)

#### `secrets-detection.md`
Detects hardcoded credentials:
- API keys, tokens, passwords
- Database credentials in connection strings
- Service-specific patterns (Stripe, AWS, GitHub, Azure)
- Private keys

**Compliance:** SOC2 CC6.1, GDPR Article 32, PCI-DSS 3.4

#### `sql-injection.md`
Prevents SQL injection vulnerabilities:
- String concatenation in queries
- Template literals with user input
- Dynamic table/column names
- Missing parameterization

**Compliance:** OWASP Top 10 #1, PCI-DSS 6.5.1, CWE-89

#### `xss-prevention.md`
Prevents Cross-Site Scripting:
- Unsafe HTML rendering (`innerHTML`, `dangerouslySetInnerHTML`)
- Unescaped template output
- URL manipulation without validation
- Missing Content Security Policy

**Compliance:** OWASP Top 10 #3, PCI-DSS 6.5.7, CWE-79

### Compliance Rules

#### `gdpr-pii.md`
GDPR personal data handling:
- PII collection without consent
- Unencrypted PII storage
- PII in logs
- Missing data subject rights (access, export, delete)
- Indefinite data retention

**Compliance:** GDPR Articles 6, 7, 13-22, 25, 32, 35

### Best Practices

#### `error-handling.md`
Async error handling patterns:
- Unhandled promise rejections
- Floating promises
- Missing try-catch in async functions
- Resource cleanup issues
- Generic error handling

## Adding New Rules

### Step 1: Create the Rule File

```bash
# Choose appropriate directory
governance/
  security/          # For security vulnerabilities
  compliance/        # For regulatory compliance
  best-practices/    # For code quality and patterns
  performance/       # For performance issues
```

### Step 2: Write the Rule

```markdown
---
title: Your Rule Name
severity: HIGH
category: Security
---

# Your Rule Name

## What to Detect
[Clear, specific description]

## Why It Matters
[Business impact, security risks, compliance requirements]

## Examples of Violations
❌ BAD:
```language
[problematic code]
```

## How to Fix
✅ GOOD:
```language
[correct code]
```

[More sections...]
```

### Step 3: Test the Rule

1. Restart the guardrail service (it auto-loads all `.md` files)
2. Test with sample code containing the issue
3. Verify the agent detects and explains it correctly
4. Ensure suggested fixes are accurate

### Step 4: Document It

Update this README's "Available Rules" section.

## Rule Writing Guidelines

### DO ✅

- **Be Specific:** Clearly define what code patterns to detect
- **Provide Context:** Explain WHY it matters (risks, compliance, impact)
- **Show Examples:** Include both bad and good code in multiple languages
- **Give Working Fixes:** Provide actual, syntactically correct solutions
- **Include References:** Link to OWASP, CWE, compliance docs, etc.
- **Explain Severity:** Define when to assign HIGH vs MEDIUM vs LOW
- **Consider False Positives:** Explain exceptions and acceptable cases

### DON'T ❌

- **Don't Be Vague:** Avoid "avoid bad practices" without specifics
- **Don't Skip Why:** Never just say "this is wrong" without explaining risks
- **Don't Use Pseudocode:** Always provide real, working code examples
- **Don't Forget Context:** Include language-specific and framework-specific examples
- **Don't Over-Flag:** Explain when something is acceptable (tests, docs, etc.)

## Customizing for Your Organization

### Option 1: Add Organization-Specific Rules

```markdown
---
title: Internal API Authentication
severity: HIGH
category: Security
---

# Internal API Authentication

All internal APIs must use our JWT-based authentication...

[Company-specific requirements]
```

### Option 2: Modify Severity Levels

Edit existing rules to match your risk tolerance:

```markdown
# Change severity in frontmatter
---
severity: MEDIUM  # Was HIGH, but we have other controls
---
```

### Option 3: Add Company Standards

```markdown
---
title: Acme Corp Logging Standards
severity: MEDIUM
category: BestPractice
---

# Logging Standards

All services must use our centralized logging library...
```

### Option 4: Disable Rules

Remove or rename files to disable:
```bash
# Disable a rule
mv secrets-detection.md secrets-detection.md.disabled
```

## Integration with Agent

### How Rules Are Loaded

1. **Startup:** `GovernanceLoader` scans `governance/` directory recursively
2. **Parse:** Reads all `.md` files using gray-matter (frontmatter + content)
3. **Categorize:** Groups rules by their category
4. **Build Prompt:** Combines all rules into a comprehensive system prompt
5. **Inject:** System prompt is sent with every analysis request

### System Prompt Structure

```
[00-system-prompt.md - Core instructions]

---

SECURITY RULES:

[secrets-detection.md]

[sql-injection.md]

[xss-prevention.md]

---

COMPLIANCE RULES:

[gdpr-pii.md]

---

BEST PRACTICES:

[error-handling.md]

---

Now analyze the user's code using these governance rules...
```

### Rule Priority

1. **System Prompt** (00-system-prompt.md) - Always first
2. **Security** - Highest priority in analysis
3. **Compliance** - Required by law/regulation
4. **Best Practices** - Important but not critical

## Testing Rules

### Manual Testing

```bash
# Start the service
cd service
npm run dev

# Send test request
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const API_KEY = \"sk_live_12345\";",
    "language": "typescript",
    "filename": "config.ts"
  }'
```

### Automated Testing

Create test files:

```typescript
// tests/rules/secrets-detection.test.ts
describe('Secrets Detection Rule', () => {
  it('should detect hardcoded API keys', async () => {
    const code = 'const key = "sk_live_12345";';
    const result = await agent.analyzeCode(code, 'typescript', 'test.ts');
    
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].category).toBe('Security');
    expect(result.findings[0].severity).toBe('HIGH');
  });
});
```

## Performance Considerations

### Token Usage

Each rule adds to the system prompt:
- **Average rule size:** 1,000-3,000 tokens
- **Total system prompt:** ~10,000-20,000 tokens
- **Cost impact:** Minimal with modern LLMs

### Loading Time

- Rules are loaded once at startup
- Changes require service restart (or `/reload-governance` endpoint)
- No runtime performance impact

### Caching

The system prompt is built once and reused for all requests:
```typescript
const systemPrompt = governanceLoader.buildSystemPrompt();
// Reused for every code analysis
```

## Maintenance

### Regular Updates

- **Monthly:** Review and update rules based on new vulnerabilities
- **Quarterly:** Add new compliance requirements
- **Annually:** Major review of all rules

### Sources to Monitor

- OWASP Top 10 updates
- CWE/SANS Top 25
- CVE bulletins
- Framework security advisories
- Compliance regulation changes

### Version Control

Track rule changes in Git:
```bash
git log governance/security/secrets-detection.md
```

## Examples by Use Case

### Financial Services
- PCI-DSS compliance rules
- SOX audit trail requirements
- Financial data encryption

### Healthcare
- HIPAA PHI protection
- Medical data retention policies
- Audit logging requirements

### E-Commerce
- Payment data security
- PII protection (GDPR, CCPA)
- Session management

### SaaS
- Multi-tenant data isolation
- API security best practices
- Rate limiting and DDoS protection

## FAQ

**Q: Can I write rules in YAML or JSON instead of Markdown?**  
A: Technically yes, but Markdown is preferred because LLMs understand natural language better than structured rule definitions.

**Q: How detailed should rules be?**  
A: Detailed enough to be clear, but concise enough to fit in context. Aim for 1000-3000 tokens per rule.

**Q: Can I have language-specific rules?**  
A: Yes! Either create separate files (`sql-injection-python.md`) or include language-specific sections in one file.

**Q: How do I test rule changes without restarting?**  
A: Send a POST request to `/api/reload-governance` endpoint.

**Q: What if two rules conflict?**  
A: The LLM will use its judgment. Generally, Security > Compliance > Best Practices in priority.

**Q: Can I use regex patterns?**  
A: You can include them as reference in "Detection Patterns" sections, but the LLM does semantic analysis, not regex matching.

## Contributing

To contribute new rules:

1. Fork the repository
2. Create a new rule file following the template
3. Test thoroughly with various code samples
4. Submit a pull request with:
   - The new rule file
   - Test cases
   - Example code showing detection
   - Updates to this README

## Support

For questions or issues:
- Check existing rules for examples
- Review the system prompt for analysis approach
- Test with the `/api/analyze` endpoint
- Check service logs for errors

---

**Remember:** Rules are prompts that guide the LLM. Write clearly, provide context, and show examples!
