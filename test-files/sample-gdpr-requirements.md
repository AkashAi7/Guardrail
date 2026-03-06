# GDPR Security Requirements - Sample Document

## Article 32: Security of Processing

### 1. Data Encryption Requirements

**Requirement 32.1.a**: Implement encryption of personal data
- All personal data MUST be encrypted both at rest and in transit
- Use industry-standard encryption algorithms (AES-256 or stronger)
- Encryption keys must be stored separately from encrypted data
- Key rotation policy must be implemented

**Code Implications:**
- Database columns containing PII must use transparent data encryption
- API endpoints transmitting personal data must use TLS 1.2+
- Passwords must be hashed using bcrypt, argon2, or PBKDF2

### 2. Access Control

**Requirement 32.1.b**: Implement proper access controls
- Implement role-based access control (RBAC) for all systems
- Principle of least privilege must be enforced
- Authentication must use multi-factor authentication (MFA) for privileged access
- Session management must include timeout mechanisms

**Code Implications:**
- No hardcoded credentials in source code
- Authorization checks required before accessing personal data
- Session tokens must expire after 30 minutes of inactivity
- Audit logging required for all data access operations

### 3. Data Minimization

**Requirement 25**: Process only necessary data
- Collect only the minimum personal data required for the purpose
- Implement data retention policies with automatic deletion
- Anonymize or pseudonymize data wherever possible

**Code Implications:**
- Database queries should not select unnecessary PII fields
- Unused personal data fields must be removed from data models
- Log files must not contain full personal data (mask/redact PII)

### 4. Right to Erasure

**Requirement 17**: Implement data deletion capabilities
- Users must be able to request complete deletion of their data
- Deletion must be completed within 30 days
- All backups and replicas must be updated

**Code Implications:**
- Implement DELETE endpoints for user data
- Cascade deletes properly across related tables
- Soft deletes are NOT sufficient for GDPR compliance

### 5. Logging and Monitoring

**Requirement 32.1.d**: Implement security monitoring
- Log all access to personal data
- Implement intrusion detection systems
- Regular security audits required

**Code Implications:**
- Audit trails for data access, modification, and deletion
- Logs must be tamper-proof and retained for minimum 1 year
- Anomaly detection for unusual data access patterns

## Common Violations

### Critical Violations:
1. **Storing plaintext passwords** - Direct violation of Article 32.1.a
2. **No encryption on personal data fields** - Violation of Article 32.1.a
3. **Hardcoded credentials** - Security vulnerability and violation of 32.1.b
4. **SQL injection vulnerabilities** - Risk to data integrity (Article 32.1.b)
5. **No access logging** - Violation of Article 32.1.d

### High-Risk Violations:
1. **Excessive data collection** - Violation of Article 25
2. **No data retention policy** - Violation of Article 25
3. **Missing authorization checks** - Violation of Article 32.1.b
4. **Session tokens without expiration** - Security risk under Article 32

### Examples of Non-Compliant Code:

```javascript
// ❌ VIOLATION: Plaintext password storage
const user = {
    username: 'john@example.com',
    password: 'MyPassword123' // GDPR violation!
};

// ❌ VIOLATION: SQL injection vulnerability
const query = `SELECT * FROM users WHERE email = '${userInput}'`;

// ❌ VIOLATION: Excessive logging of PII
console.log('User logged in:', user.email, user.ssn, user.creditCard);

// ❌ VIOLATION: No authorization check
function getUserData(userId) {
    return database.query('SELECT * FROM personal_data WHERE user_id = ?', [userId]);
}
```

### Examples of Compliant Code:

```javascript
// ✅ COMPLIANT: Hashed password with bcrypt
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);

// ✅ COMPLIANT: Parameterized query prevents SQL injection
const query = 'SELECT * FROM users WHERE email = ?';
const result = await database.query(query, [userInput]);

// ✅ COMPLIANT: Masked PII in logs
console.log('User logged in:', maskEmail(user.email));

// ✅ COMPLIANT: Authorization check before data access
async function getUserData(userId, requesterId) {
    if (!await authorize(requesterId, 'read', userId)) {
        throw new UnauthorizedError();
    }
    return database.query('SELECT * FROM personal_data WHERE user_id = ?', [userId]);
}
```

## Enforcement Priority

1. **Immediate Action Required**: Plaintext passwords, SQL injection, hardcoded secrets
2. **High Priority**: Missing encryption, inadequate access controls, no audit logging
3. **Medium Priority**: Excessive data collection, missing retention policies
4. **Low Priority**: Documentation gaps, incomplete data mapping

---
*This is a simplified sample document for testing purposes. Actual GDPR compliance requires comprehensive legal review.*
