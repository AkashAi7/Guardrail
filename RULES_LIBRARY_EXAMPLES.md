# GuardRail Rules Library - Examples

## 📋 **Rule Structure & Format**

Each rule follows this schema:

```yaml
rule_id: string          # Unique identifier (e.g., SEC-001)
name: string            # Human-readable name
category: string        # Security | Compliance | BestPractice | Performance
severity: string        # CRITICAL | HIGH | MEDIUM | LOW | INFO
enabled: boolean        # Can be disabled
languages: string[]     # Applicable languages
description: string     # Detailed explanation
patterns: Pattern[]     # Detection patterns
compliance_impact: ComplianceImpact[]
remediation: Remediation
references: Reference[]
```

---

## 🔒 **Security Rules**

### **Rule: SEC-001 - Hardcoded API Keys**

```yaml
# rules/security/hardcoded-secrets.yaml
rule_id: "SEC-001"
name: "Hardcoded API Keys and Secrets"
category: "Security"
severity: "CRITICAL"
enabled: true
languages: ["javascript", "typescript", "python", "java", "go", "csharp"]

description: |
  Detects hardcoded secrets, API keys, tokens, and passwords in source code.
  Credentials should never be committed to version control.

patterns:
  # Stripe Keys
  - type: "regex"
    pattern: '["'']((sk|pk)_(test|live)_[a-zA-Z0-9]{24,})["'']'
    severity: "CRITICAL"
    message: "Stripe API key detected"
    capture_groups: [1]

  # AWS Keys
  - type: "regex"
    pattern: '(AKIA[0-9A-Z]{16})'
    severity: "CRITICAL"
    message: "AWS Access Key ID detected"

  # Generic API Keys
  - type: "regex"
    pattern: '(?i)(api[_-]?key|apikey|api[_-]?secret)["\s]*[:=]["\s]*["''][a-zA-Z0-9_\-]{20,}["'']'
    severity: "HIGH"
    message: "Potential API key found"

  # Passwords
  - type: "regex"
    pattern: '(?i)(password|passwd|pwd)["\s]*[:=]["\s]*["''][^"'']{8,}["'']'
    severity: "HIGH"
    message: "Hardcoded password detected"
    exceptions:
      - 'password.*=.*""'  # Empty passwords (for defaults)
      - 'password.*=.*null'

  # Private Keys
  - type: "regex"
    pattern: '-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----'
    severity: "CRITICAL"
    message: "Private key embedded in code"

  # OAuth Tokens
  - type: "regex"
    pattern: '(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}'
    severity: "CRITICAL"
    message: "GitHub Personal Access Token detected"

exceptions:
  - path_pattern: ".*test.*"
    reason: "Test files may contain mock credentials"
  - path_pattern: ".*example.*"
    reason: "Example code"
  - path_pattern: ".*\\.env\\.example$"
    reason: "Environment variable templates"

compliance_impact:
  - regulation: "SOC2"
    control: "CC6.1 - Logical and Physical Access Controls"
    requirement: "Restrict access to system resources"
    risk: "CRITICAL"
    
  - regulation: "GDPR"
    article: "Article 32 - Security of Processing"
    requirement: "Implement appropriate technical measures for security"
    risk: "HIGH"
    
  - regulation: "PCI-DSS"
    requirement: "3.4 - Render PAN unreadable"
    risk: "CRITICAL"

remediation:
  recommendation: |
    Store secrets securely using one of these methods:
    
    1. Environment Variables (Development)
       - Add to .env file (gitignored)
       - Load via process.env or similar
    
    2. Secret Management Services (Production)
       - AWS Secrets Manager
       - Azure Key Vault
       - HashiCorp Vault
       - Google Secret Manager
    
    3. CI/CD Secret Storage
       - GitHub Secrets
       - GitLab CI Variables
       - CircleCI Environment Variables
  
  examples:
    - language: "javascript"
      before: |
        const apiKey = "sk-live-1234567890abcdef";
        const stripeClient = new Stripe(apiKey);
      
      after: |
        // Load from environment variable
        const apiKey = process.env.STRIPE_API_KEY;
        if (!apiKey) {
          throw new Error('STRIPE_API_KEY environment variable is required');
        }
        const stripeClient = new Stripe(apiKey);
        
        // .env file (never commit this):
        // STRIPE_API_KEY=sk-live-1234567890abcdef
    
    - language: "python"
      before: |
        api_key = "sk-live-1234567890abcdef"
        client = stripe.Client(api_key)
      
      after: |
        import os
        api_key = os.environ.get('STRIPE_API_KEY')
        if not api_key:
            raise ValueError('STRIPE_API_KEY environment variable required')
        client = stripe.Client(api_key)

  auto_fix:
    enabled: true
    strategy: "environment-variable"
    template: "process.env.{VAR_NAME}"
    instructions: |
      1. Extract the secret value
      2. Add to .env file with descriptive name
      3. Replace in code with environment variable access
      4. Update .gitignore to exclude .env
      5. Document required environment variables in README

references:
  - title: "OWASP: Use of Hard-coded Password"
    url: "https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password"
  - title: "CWE-798: Hard-coded Credentials"
    url: "https://cwe.mitre.org/data/definitions/798.html"
  - title: "GitHub Secret Scanning"
    url: "https://docs.github.com/en/code-security/secret-scanning"
```

---

### **Rule: SEC-002 - SQL Injection**

```yaml
# rules/security/sql-injection.yaml
rule_id: "SEC-002"
name: "SQL Injection Vulnerability"
category: "Security"
severity: "CRITICAL"
enabled: true
languages: ["javascript", "typescript", "python", "java", "php", "csharp"]

description: |
  Detects potential SQL injection vulnerabilities where user input is directly
  concatenated into SQL queries without proper sanitization or parameterization.

patterns:
  # JavaScript/TypeScript
  - type: "regex"
    pattern: '(query|execute)\s*\(\s*[`"\'].*SELECT.*\$\{.*\}.*[`"\']'
    language: ["javascript", "typescript"]
    severity: "CRITICAL"
    message: "Template literal concatenation in SQL query"
  
  - type: "regex"
    pattern: '(query|execute)\s*\(\s*[`"\']\s*SELECT.*\+.*[`"\']'
    language: ["javascript", "typescript"]
    severity: "CRITICAL"
    message: "String concatenation in SQL query"

  # Python
  - type: "regex"
    pattern: 'execute\s*\(\s*[f"\'"].*SELECT.*\{.*\}.*[f"\''"]'
    language: ["python"]
    severity: "CRITICAL"
    message: "F-string interpolation in SQL query"
  
  - type: "regex"
    pattern: 'execute\s*\(\s*["\'].*SELECT.*%\s*%.*["\']'
    language: ["python"]
    severity: "CRITICAL"
    message: "String formatting in SQL query"

  # AST-based detection (more accurate)
  - type: "ast"
    node_type: "CallExpression"
    callee_name: ["query", "execute", "sql"]
    check: |
      function(node) {
        // Check if argument contains template expressions
        const arg = node.arguments[0];
        return arg.type === 'TemplateLiteral' && 
               arg.expressions.length > 0 &&
               containsSQLKeywords(arg.quasis);
      }

exceptions:
  # Parameterized queries are safe
  - pattern: '\$\d+'  # PostgreSQL parameters
  - pattern: '\?'     # MySQL/SQLite parameters
  - pattern: ':[\w]+'  # Named parameters

compliance_impact:
  - regulation: "OWASP Top 10"
    category: "A03:2021 - Injection"
    risk: "CRITICAL"
  
  - regulation: "CWE"
    id: "CWE-89"
    name: "SQL Injection"
    risk: "CRITICAL"
  
  - regulation: "SOC2"
    control: "CC6.1 - Logical Access Security"
    risk: "CRITICAL"
  
  - regulation: "PCI-DSS"
    requirement: "6.5.1 - Injection Flaws"
    risk: "CRITICAL"

attack_scenarios:
  - description: "Authentication Bypass"
    payload: "' OR '1'='1"
    impact: "Attacker gains unauthorized access"
    example: "SELECT * FROM users WHERE username = '' OR '1'='1' AND password = 'x'"
  
  - description: "Data Exfiltration"
    payload: "'; SELECT * FROM credit_cards; --"
    impact: "Sensitive data leaked"
  
  - description: "Data Destruction"
    payload: "'; DROP TABLE users; --"
    impact: "Data loss"

remediation:
  recommendation: |
    Always use parameterized queries (prepared statements) to prevent SQL injection.
    NEVER concatenate user input directly into SQL strings.
    
    Defense layers:
    1. Parameterized Queries (Primary defense)
    2. Input Validation (Secondary defense)
    3. Least Privilege Database User (Damage limitation)
    4. Web Application Firewall (Detection)
  
  examples:
    - language: "javascript"
      before: |
        // ❌ VULNERABLE
        const userId = req.query.id;
        const query = `SELECT * FROM users WHERE id = ${userId}`;
        db.query(query);
        
        // Attack: ?id=1 OR 1=1
      
      after: |
        // ✅ SECURE: Parameterized Query
        const userId = req.query.id;
        const query = 'SELECT * FROM users WHERE id = ?';
        db.query(query, [userId]);
        
        // Or with named parameters
        const query = 'SELECT * FROM users WHERE id = :id';
        db.query(query, { id: userId });
    
    - language: "python"
      before: |
        # ❌ VULNERABLE
        user_id = request.args.get('id')
        query = f"SELECT * FROM users WHERE id = {user_id}"
        cursor.execute(query)
      
      after: |
        # ✅ SECURE: Parameterized Query
        user_id = request.args.get('id')
        query = "SELECT * FROM users WHERE id = %s"
        cursor.execute(query, (user_id,))
        
        # Or with named parameters
        query = "SELECT * FROM users WHERE id = %(id)s"
        cursor.execute(query, {'id': user_id})
    
    - language: "java"
      before: |
        // ❌ VULNERABLE
        String userId = request.getParameter("id");
        String query = "SELECT * FROM users WHERE id = " + userId;
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(query);
      
      after: |
        // ✅ SECURE: PreparedStatement
        String userId = request.getParameter("id");
        String query = "SELECT * FROM users WHERE id = ?";
        PreparedStatement pstmt = conn.prepareStatement(query);
        pstmt.setString(1, userId);
        ResultSet rs = pstmt.executeQuery();

  auto_fix:
    enabled: true
    strategy: "parameterize"
    complexity: "medium"

references:
  - title: "OWASP SQL Injection"
    url: "https://owasp.org/www-community/attacks/SQL_Injection"
  - title: "OWASP SQL Injection Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"
  - title: "CWE-89: SQL Injection"
    url: "https://cwe.mitre.org/data/definitions/89.html"
```

---

## 📜 **Compliance Rules**

### **Rule: GDPR-001 - PII Logging**

```yaml
# rules/compliance/gdpr-pii-logging.yaml
rule_id: "GDPR-001"
name: "PII Logged Without Redaction"
category: "Compliance"
severity: "HIGH"
enabled: true
languages: ["*"]

description: |
  Detects logging of Personal Identifiable Information (PII) without proper
  redaction or anonymization, violating GDPR data protection requirements.

pii_fields:
  high_sensitivity:
    - "email"
    - "ssn"
    - "social_security"
    - "passport"
    - "drivers_license"
    - "credit_card"
    - "cvv"
    - "password"
    - "biometric"
  
  medium_sensitivity:
    - "phone"
    - "telephone"
    - "mobile"
    - "address"
    - "street"
    - "zipcode"
    - "postal_code"
    - "date_of_birth"
    - "dob"
    - "age"
  
  low_sensitivity:
    - "name"
    - "first_name"
    - "last_name"
    - "full_name"
    - "username"

patterns:
  - type: "semantic"
    description: "Logging statements containing PII"
    check: |
      Look for logging statements (console.log, logger.info, print, etc.)
      that include variables or expressions containing PII field names.
    
    examples:
      - "console.log('User email:', user.email)"
      - "logger.info(f'SSN: {ssn}')"
      - "System.out.println('Card: ' + creditCard)"
  
  - type: "regex"
    pattern: '(console\.log|logger\.(info|debug|warn)|print)\s*\(.*\b(email|ssn|password|credit_card)\b'
    severity: "HIGH"
    message: "Potential PII in log statement"

compliance_impact:
  - regulation: "GDPR"
    article: "Article 5(1)(f)"
    requirement: "Integrity and Confidentiality"
    description: "Personal data shall be processed in a manner that ensures appropriate security"
    risk: "HIGH"
    
  - regulation: "GDPR"
    article: "Article 32"
    requirement: "Security of Processing"
    description: "Implement appropriate technical measures"
    risk: "HIGH"
    
  - regulation: "GDPR"
    article: "Article 25"
    requirement: "Data Protection by Design"
    risk: "MEDIUM"

violations_result_in:
  - "GDPR fines up to €20 million or 4% of global annual turnover"
  - "Data Subject Access Request (DSAR) complications"
  - "Reputational damage"
  - "Regulatory investigations"

remediation:
  recommendation: |
    Options for handling PII in logs:
    
    1. **DON'T LOG PII** (Best Practice)
       - Only log non-sensitive identifiers (user_id, transaction_id)
       - Use correlation IDs for debugging
    
    2. **REDACT/MASK** (If logging is necessary)
       - Email: u***@example.com
       - SSN: ***-**-1234
       - Credit Card: ****-****-****-1234
    
    3. **HASH** (For correlation without exposure)
       - Store: hash(email) for grouping
       - Never reversible to original
    
    4. **USE SEPARATE AUDIT LOGS**
       - Encrypted at rest
       - Restricted access
       - Automatic retention policies
  
  examples:
    - language: "javascript"
      before: |
        // ❌ BAD: Logging PII
        console.log(`Creating user: ${email}, SSN: ${ssn}`);
        logger.info('Payment from', { 
          email: user.email,
          card: creditCard 
        });
      
      after: |
        // ✅ GOOD: Log only identifiers
        console.log(`Creating user: ${userId}`);
        logger.info('Payment processed', { 
          userId: user.id,
          transactionId: txId,
          lastFourDigits: card.slice(-4)
        });
        
        // Or use redaction helper
        logger.info('User registered', { 
          email: redact(user.email),  // u***@example.com
          userId: user.id
        });
    
    - language: "python"
      before: |
        # ❌ BAD: F-string with PII
        logging.info(f"User {email} logged in from {ip_address}")
        print(f"SSN: {ssn}, DOB: {dob}")
      
      after: |
        # ✅ GOOD: Redacted or no PII
        logging.info(f"User {user_id} logged in from {hash_ip(ip_address)}")
        logging.info(f"User verification: {user_id}")
        
        # Use structured logging with redaction
        logging.info("User registered", extra={
            'user_id': user_id,
            'email_hash': hashlib.sha256(email.encode()).hexdigest()[:16]
        })

  tools:
    - name: "pii-codex"
      description: "Automated PII detection and redaction"
      url: "https://github.com/microsoft/presidio"
    
    - name: "log4j-redact"
      description: "Java logging redaction"
    
    - name: "winston-pii-filter"
      description: "Node.js Winston PII filter"

references:
  - title: "GDPR Article 32"
    url: "https://gdpr-info.eu/art-32-gdpr/"
  - title: "NIST PII Guide"
    url: "https://www.nist.gov/privacy-framework"
  - title: "OWASP Logging Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html"
```

---

### **Rule: HIPAA-001 - PHI Protection**

```yaml
# rules/compliance/hipaa-phi-protection.yaml
rule_id: "HIPAA-001"
name: "Protected Health Information (PHI) Handling"
category: "Compliance"
severity: "CRITICAL"
enabled: true
languages: ["*"]

description: |
  Ensures Protected Health Information (PHI) is handled according to HIPAA
  Security Rule requirements, including encryption, access controls, and
  audit logging.

phi_identifiers:
  direct:
    - "medical_record_number"
    - "diagnosis"
    - "treatment"
    - "prescription"
    - "health_plan"
    - "lab_results"
    - "patient_id"
  
  indirect:
    - Combined with: ["name", "address", "date_of_birth"]
    - Geographic: "smaller than state level"
    - Dates: "birth, admission, discharge, death"

patterns:
  - type: "semantic"
    description: "PHI stored or transmitted without encryption"
    severity: "CRITICAL"
  
  - type: "ast"
    check: |
      Detect:
      1. PHI variables being logged
      2. PHI in database without encryption
      3. PHI transmitted over HTTP (not HTTPS)
      4. Missing access control checks

compliance_impact:
  - regulation: "HIPAA"
    rule: "Security Rule § 164.312(a)(2)(iv)"
    requirement: "Encryption and Decryption"
    description: "Implement mechanism to encrypt ePHI"
    risk: "CRITICAL"
  
  - regulation: "HIPAA"
    rule: "Security Rule § 164.312(b)"
    requirement: "Audit Controls"
    description: "Implement hardware, software, procedures to record/examine activity"
    risk: "HIGH"
  
  - regulation: "HIPAA"
    rule: "Privacy Rule § 164.502(b)"
    requirement: "Minimum Necessary"
    description: "Limit PHI to minimum necessary to accomplish purpose"
    risk: "HIGH"

penalties:
  - tier: "Tier 1"
    violation: "Unknowing"
    fine_range: "$100 - $50,000 per violation"
  
  - tier: "Tier 4"
    violation: "Willful Neglect (Uncorrected)"
    fine_range: "$50,000 per violation"
    maximum_annual: "$1.5 million"
  
  - criminal: "Wrongful disclosure"
    penalty: "Up to $250,000 and 10 years imprisonment"

remediation:
  requirements:
    encryption:
      - "AES-256 for data at rest"
      - "TLS 1.2+ for data in transit"
      - "Key management system"
    
    access_control:
      - "Role-based access (RBAC)"
      - "Unique user identification"
      - "Automatic logoff"
      - "Encryption of passwords"
    
    audit:
      - "Log all PHI access"
      - "Record user, time, action"
      - "Regular log review"
      - "6-year retention"
  
  examples:
    - language: "javascript"
      before: |
        // ❌ VIOLATION: Unencrypted PHI storage
        await db.patients.insert({
          name: 'John Doe',
          ssn: '123-45-6789',
          diagnosis: 'Diabetes Type 2',
          medications: ['Metformin']
        });
        
        // ❌ VIOLATION: PHI in logs
        console.log('Diagnosis:', patient.diagnosis);
      
      after: |
        // ✅ COMPLIANT: Encrypted PHI
        const encrypted = await encrypt({
          ssn: patient.ssn,
          diagnosis: patient.diagnosis,
          medications: patient.medications
        }, ENCRYPTION_KEY);
        
        await db.patients.insert({
          patient_id: patient.id,
          name_encrypted: await encrypt(patient.name),
          phi_encrypted: encrypted
        });
        
        // ✅ Audit logging (no PHI)
        await auditLog.record({
          action: 'PATIENT_UPDATE',
          user_id: currentUser.id,
          patient_id: patient.id,
          timestamp: new Date(),
          ip_address: hash(request.ip)
        });

references:
  - title: "HIPAA Security Rule"
    url: "https://www.hhs.gov/hipaa/for-professionals/security/index.html"
  - title: "NIST HIPAA Security Guidelines"
    url: "https://www.nist.gov/healthcare"
```

---

## ✅ **Best Practice Rules**

### **Rule: BP-001 - Missing Error Handling**

```yaml
# rules/best-practices/error-handling.yaml
rule_id: "BP-001"
name: "Missing Error Handling"
category: "BestPractice"
severity: "MEDIUM"
enabled: true
languages: ["javascript", "typescript", "python", "java", "go"]

description: |
  Detects async operations, external API calls, database queries, or file I/O
  operations that lack proper error handling (try-catch, error callbacks, etc.)

patterns:
  # JavaScript/TypeScript - async/await without try-catch
  - type: "ast"
    node_type: "FunctionDeclaration"
    check: |
      function(node) {
        if (!node.async) return false;
        // Check if function body has await but no try-catch
        const hasAwait = findAwait nodes(node.body);
        const hasTryCatch = findTryCatch(node.body);
        return hasAwait && !hasTryCatch;
      }
  
  # Promise without .catch()
  - type: "regex"
    pattern: '\.then\([^\)]+\)(?!\.catch)'
    language: ["javascript", "typescript"]
    message: "Promise chain missing .catch() handler"
  
  # Python - bare except
  - type: "regex"
    pattern: 'except:\s*$'
    language: ["python"]
    message: "Bare except clause catches all exceptions (too broad)"
    severity: "LOW"

risk_factors:
  - "Unhandled promise rejections crash Node.js applications"
  - "Uncaught exceptions expose stack traces (information leakage)"
  - "Poor user experience (cryptic error messages)"
  - "Difficult debugging without proper error context"

compliance_note: |
  PCI-DSS Requirement 6.5.5: Improper error handling can lead to
  information leakage that assists in attacks.

remediation:
  recommendation: |
    Always handle errors in async code:
    
    1. **Try-Catch for async/await**
    2. **.catch() for Promises**
    3. **Error callbacks for traditional Node.js**
    4. **Error boundaries in React**
    5. **Global error handlers as last resort**
    
    Best practices:
    - ✅ Be specific about what errors you're catching
    - ✅ Log errors with context (but not sensitive data!)
    - ✅ Return user-friendly error messages
    - ✅ Use error monitoring (Sentry, Datadog, etc.)
    - ❌ Don't swallow errors silently
    - ❌ Don't expose internal error details to users
  
  examples:
    - language: "typescript"
      before: |
        // ❌ BAD: No error handling
        async function processPayment(amount: number, cardToken: string) {
          const charge = await stripe.charges.create({
            amount,
            currency: 'usd',
            source: cardToken,
          });
          return charge.id;
        }
      
      after: |
        // ✅ GOOD: Comprehensive error handling
        async function processPayment(
          amount: number,
          cardToken: string
        ): Promise<{ success: boolean; chargeId?: string; error?: string }> {
          try {
            const charge = await stripe.charges.create({
              amount,
              currency: 'usd',
              source: cardToken,
            });
            
            logger.info('Payment processed', { 
              chargeId: charge.id,
              amount 
            });
            
            return { success: true, chargeId: charge.id };
            
          } catch (error) {
            logger.error('Payment failed', {
              error: error instanceof Error ? error.message : 'Unknown',
              amount,
              // Never log card details!
            });
            
            // Return user-friendly error
            if (error.type === 'StripeCardError') {
              return {
                success: false,
                error: 'Payment declined. Please check your card details.'
              };
            }
            
            if (error.type === 'StripeRateLimitError') {
              return {
                success: false,
                error: 'Too many requests. Please try again shortly.'
              };
            }
            
            return {
              success: false,
              error: 'Payment processing failed. Please try again.'
            };
          }
        }

references:
  - title: "Node.js Error Handling Best Practices"
    url: "https://nodejs.org/en/docs/guides/error-handling/"
  - title: "OWASP Error Handling"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html"
```

---

## 🎯 **How to Use These Rules**

### **1. Load Rules in Your Service**

```typescript
// backend/src/rule-loader.ts
import * as fs from 'fs';
import * as yaml from 'yaml';
import * as path from 'path';
import { glob } from 'glob';

export interface Rule {
  rule_id: string;
  name: string;
  category: string;
  severity: string;
  enabled: boolean;
  languages: string[];
  patterns: Pattern[];
  compliance_impact?: ComplianceImpact[];
  remediation: Remediation;
}

export class RuleLoader {
  private rules: Map<string, Rule> = new Map();
  private rulesPath: string;

  constructor(rulesPath: string) {
    this.rulesPath = rulesPath;
  }

  async loadAll(): Promise<void> {
    console.log(`📚 Loading rules from ${this.rulesPath}...`);

    const ruleFiles = await glob(`${this.rulesPath}/**/*.yaml`);

    for (const file of ruleFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const rule = yaml.parse(content) as Rule;

        if (rule.enabled) {
          this.rules.set(rule.rule_id, rule);
          console.log(`  ✅ Loaded ${rule.rule_id}: ${rule.name}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to load ${file}:`, error);
      }
    }

    console.log(`📚 Loaded ${this.rules.size} rules`);
  }

  getRulesByLanguage(language: string): Rule[] {
    return Array.from(this.rules.values()).filter(
      (rule) =>
        rule.languages.includes('*') || rule.languages.includes(language)
    );
  }

  getRulesByCategory(category: string): Rule[] {
    return Array.from(this.rules.values()).filter(
      (rule) => rule.category === category
    );
  }

  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }
}
```

### **2. Execute Rules Against Code**

```typescript
// backend/src/rule-executor.ts
export class RuleExecutor {
  async execute(code: string, rules: Rule[]): Promise<Violation[]> {
    const violations: Violation[] = [];

    for (const rule of rules) {
      for (const pattern of rule.patterns) {
        if (pattern.type === 'regex') {
          const matches = this.executeRegexPattern(code, pattern);
          violations.push(...this.toViolations(matches, rule));
        }
        
        if (pattern.type === 'ast') {
          const matches = await this.executeASTPattern(code, pattern);
          violations.push(...this.toViolations(matches, rule));
        }
        
        if (pattern.type === 'semantic') {
          // Use Copilot agent for semantic analysis
          const matches = await this.executeSemanticPattern(code, pattern);
          violations.push(...this.toViolations(matches, rule));
        }
      }
    }

    return violations;
  }

  private executeRegexPattern(code: string, pattern: Pattern): Match[] {
    const regex = new RegExp(pattern.pattern, 'gim');
    const matches: Match[] = [];
    let match;

    while ((match = regex.exec(code)) !== null) {
      matches.push({
        index: match.index,
        text: match[0],
        line: this.getLineNumber(code, match.index),
      });
    }

    return matches;
  }

  private getLineNumber(code: string, index: number): number {
    return code.substring(0, index).split('\n').length;
  }
}
```

---

## 📊 **Rule Statistics & Maintenance**

### **Track Rule Effectiveness**

```yaml
# Track these metrics per rule:
metrics:
  true_positives: 1247    # Correctly identified issues
  false_positives: 89     # Incorrectly flagged
  false_negatives: 23     # Missed issues
  suppressions: 45        # User-suppressed findings
  
  precision: 0.933        # TP / (TP + FP) = 93.3%
  recall: 0.982           # TP / (TP + FN) = 98.2%
  
  avg_fix_time: "3.2min"
  auto_fix_applied: 892   # 71.5%
```

### **Rule Governance**

```yaml
# Who can modify rules:
governance:
  rule_owners:
    security_team: ["SEC-*"]
    compliance_team: ["GDPR-*", "HIPAA-*", "PCI-*"]
    architecture_team: ["BP-*", "PERF-*"]
  
  approval_process:
    new_rule: "Pull request + 2 approvals"
    severity_change: "Security team approval"
    disable_rule: "Team lead + security approval"
  
  review_cadence: "quarterly"
```

---

**These rules form the foundation of your guardrail system! 🛡️**

Add more rules over time as you discover new patterns and compliance requirements.
