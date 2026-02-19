---
title: GDPR Personal Data Handling
severity: HIGH
category: Compliance
---

# Compliance Rule: GDPR Personal Data (PII) Handling

## What to Detect

Identify code that collects, processes, stores, or transmits personal data (PII) without proper safeguards required by GDPR (General Data Protection Regulation).

### Personal Data Categories

**Direct Identifiers (HIGH risk):**
- Full name, email address, phone number
- Physical address, postal code
- National ID numbers, passport, driver's license
- Social security numbers
- IP addresses, device IDs, cookies

**Sensitive Personal Data (CRITICAL risk) - Article 9:**
- Health/medical data
- Racial or ethnic origin
- Political opinions, religious beliefs
- Trade union membership
- Genetic data, biometric data
- Sexual orientation, sex life data

**Financial Data:**
- Bank account numbers
- Credit card details
- Payment transaction history
- Salary, income information

**Online Identifiers:**
- Email addresses
- Usernames, social media handles
- IP addresses, MAC addresses
- Cookie IDs, advertising IDs
- Location data, GPS coordinates

## Why It Matters

**Legal Requirements (GDPR):**
- **Article 6:** Lawful Basis for Processing (consent, contract, legal obligation)
- **Article 7:** Conditions for Consent (freely given, specific, informed, unambiguous)
- **Article 13-14:** Information to be Provided (transparency)
- **Article 15-22:** Data Subject Rights (access, rectification, erasure, portability)
- **Article 25:** Data Protection by Design and Default
- **Article 32:** Security of Processing (encryption, pseudonymization)
- **Article 35:** Data Protection Impact Assessment (DPIA) for high-risk processing

**Compliance Violations:**
- **Fines:** Up to €20 million or 4% of global annual turnover (whichever is higher)
- **Article 83(5):** Basic principles violations, data subject rights violations
- **Article 83(4):** Controller/processor obligations, certification body violations

**Business Impact:**
- Average GDPR fine: €270,000+
- Reputational damage and loss of customer trust
- Lawsuits from data subjects
- Regulatory investigations and audits
- Potential business operations suspension

**Major Penalties:**
- Amazon: €746 million (2021)
- WhatsApp: €225 million (2021)
- Google: €90 million (2020)
- H&M: €35 million (2020)

## Examples of Violations

### ❌ BAD: Collecting PII Without Consent

```typescript
// No consent mechanism
async function createUser(req: Request) {
  const user = {
    email: req.body.email,           // PII
    fullName: req.body.fullName,     // PII
    phone: req.body.phone,           // PII
    ipAddress: req.ip,               // PII (IP is PII under GDPR!)
    dateOfBirth: req.body.dob,       // PII
  };
  
  await db.users.insert(user);
  return user;
}

// Missing: Consent checkbox, privacy policy link, purpose explanation
```

### ❌ BAD: Storing PII Without Encryption

```typescript
// Plain text storage of sensitive data
interface User {
  email: string;                    // Should be encrypted or hashed
  ssn: string;                      // VERY sensitive, must be encrypted
  medicalCondition: string;         // Article 9 special category!
  creditCard: string;               // Combine with PCI-DSS requirements
}

await db.users.create({
  email: user.email,
  ssn: user.ssn,                    // Stored in plain text - VIOLATION
});
```

### ❌ BAD: Logging PII

```typescript
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Logs contain PII - can be accessed by many people
  console.log(`Login attempt from ${email}`);  // VIOLATION
  logger.info(`User data: ${JSON.stringify(req.body)}`);  // VIOLATION
  
  // Error messages exposing PII
  throw new Error(`Login failed for user ${email}`);  // VIOLATION
});
```

### ❌ BAD: Indefinite Data Retention

```typescript
// No deletion logic - violates "storage limitation" principle
async function deleteUser(userId: string) {
  // Soft delete only
  await db.users.update(userId, { 
    isActive: false,
    deletedAt: new Date()
  });
  // Data still exists! GDPR requires actual deletion after retention period
}
```

### ❌ BAD: Sharing PII Without Consent

```typescript
// Sending to third-party analytics without consent
analytics.track({
  email: user.email,              // VIOLATION
  name: user.name,                // VIOLATION
  age: user.age,
  event: 'page_view'
});

// Sharing with marketing tool
await sendToMailchimp({
  email: user.email,              // Need explicit consent for marketing
  firstName: user.firstName
});
```

### ❌ BAD: No Data Subject Rights Implementation

```typescript
// API has no endpoints for:
// - Viewing personal data (Right to Access - Article 15)
// - Exporting personal data (Right to Portability - Article 20)
// - Deleting personal data (Right to Erasure - Article 17)
// - Correcting personal data (Right to Rectification - Article 16)
```

## How to Fix

### ✅ GOOD: Consent Management

```typescript
interface User {
  email: string;
  fullName: string;
  
  // Consent tracking (required!)
  consent: {
    marketing: boolean;
    analytics: boolean;
    thirdPartySharing: boolean;
    timestamp: Date;
    ipAddress: string;          // Record consent IP for audit
    version: string;            // Track which privacy policy version
  };
  
  // Purpose specification
  dataProcessingPurpose: string[];  // ["account_management", "order_fulfillment"]
}

async function createUser(req: Request) {
  // Validate consent was given
  if (!req.body.gdprConsent) {
    throw new Error('GDPR consent required');
  }
  
  const user = {
    email: req.body.email,
    fullName: req.body.fullName,
    consent: {
      marketing: req.body.marketingConsent || false,
      analytics: req.body.analyticsConsent || false,
      thirdPartySharing: req.body.thirdPartyConsent || false,
      timestamp: new Date(),
      ipAddress: req.ip,
      version: 'privacy-policy-v2.1'
    },
    dataProcessingPurpose: ['account_management']
  };
  
  await db.users.insert(user);
  
  // Send confirmation email (Article 13)
  await sendWelcomeEmail(user.email, {
    privacyPolicyUrl: 'https://example.com/privacy',
    rightsUrl: 'https://example.com/data-rights'
  });
  
  return user;
}
```

### ✅ GOOD: Encryption for PII

```typescript
import crypto from 'crypto';

// Encryption utility
class PIIEncryption {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  constructor() {
    // Key from environment or key management service
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) throw new Error('ENCRYPTION_KEY required');
    this.key = Buffer.from(keyString, 'hex');
  }
  
  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

const piiEncryption = new PIIEncryption();

// Store encrypted PII
async function createUser(userData: any) {
  const emailEncrypted = piiEncryption.encrypt(userData.email);
  const ssnEncrypted = piiEncryption.encrypt(userData.ssn);
  
  await db.users.insert({
    emailEncrypted: emailEncrypted.encrypted,
    emailIv: emailEncrypted.iv,
    emailTag: emailEncrypted.tag,
    ssnEncrypted: ssnEncrypted.encrypted,
    ssnIv: ssnEncrypted.iv,
    ssnTag: ssnEncrypted.tag,
  });
}
```

### ✅ GOOD: PII Anonymization for Logging

```typescript
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain}`;
}

function maskPII(data: any): any {
  const masked = { ...data };
  
  // Remove or mask PII fields
  if (masked.email) masked.email = maskEmail(masked.email);
  if (masked.ssn) masked.ssn = '***-**-' + masked.ssn.slice(-4);
  if (masked.creditCard) masked.creditCard = '****' + masked.creditCard.slice(-4);
  
  delete masked.password;
  delete masked.dateOfBirth;
  
  return masked;
}

app.post('/login', (req, res) => {
  // Log without PII
  logger.info('Login attempt', { 
    userId: req.body.userId,           // OK if it's just an ID
    timestamp: new Date(),
    // email is NOT logged
  });
  
  // Or log masked version
  logger.info('User data', maskPII(req.body));
});
```

### ✅ GOOD: Data Retention and Deletion

```typescript
// Retention policy configuration
const RETENTION_POLICIES = {
  inactiveAccounts: 365 * 2,      // 2 years
  marketingConsent: 365 * 3,      // 3 years
  transactionRecords: 365 * 7,    // 7 years (legal requirement)
};

// Hard delete with cascades
async function deleteUserData(userId: string) {
  // Delete from all tables (Article 17: Right to Erasure)
  await db.transaction(async (tx) => {
    await tx.userProfiles.delete({ userId });
    await tx.userPreferences.delete({ userId });
    await tx.sessions.delete({ userId });
    await tx.activityLogs.delete({ userId });
    await tx.savedItems.delete({ userId });
    await tx.users.delete({ id: userId });
  });
  
  // Also remove from external services
  await analyticsService.deleteUser(userId);
  await emailService.unsubscribe(userEmail);
  
  logger.info('User data deleted', { 
    userId,
    deletedAt: new Date(),
    requestedBy: 'user'  // vs 'automated_retention'
  });
}

// Automated retention enforcement
async function enforceRetentionPolicies() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_POLICIES.inactiveAccounts);
  
  const inactiveUsers = await db.users.findMany({
    where: {
      lastLoginAt: { lt: cutoffDate },
      consentWithdrawn: true  // Or account deactivated
    }
  });
  
  for (const user of inactiveUsers) {
    await deleteUserData(user.id);
  }
}
```

### ✅ GOOD: Data Subject Rights Implementation

```typescript
// Article 15: Right to Access
app.get('/api/user/my-data', authenticate, async (req, res) => {
  const userId = req.user.id;
  
  // Gather all personal data
  const [profile, orders, preferences, activityLog] = await Promise.all([
    db.users.findUnique({ where: { id: userId } }),
    db.orders.findMany({ where: { userId } }),
    db.preferences.findMany({ where: { userId } }),
    db.activity.findMany({ where: { userId }, take: 1000 })
  ]);
  
  res.json({
    personalData: {
      profile: sanitizeForExport(profile),
      orders: orders.map(sanitizeForExport),
      preferences: preferences.map(sanitizeForExport),
      activityLog: activityLog.map(sanitizeForExport)
    },
    dataProcessingPurposes: profile.dataProcessingPurpose,
    consent: profile.consent,
    generatedAt: new Date(),
    format: 'JSON'  // GDPR requires machine-readable format
  });
});

// Article 20: Right to Data Portability
app.get('/api/user/export', authenticate, async (req, res) => {
  const userId = req.user.id;
  const data = await gatherUserData(userId);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=my-data.json');
  res.send(JSON.stringify(data, null, 2));
});

// Article 17: Right to Erasure
app.delete('/api/user/delete-account', authenticate, async (req, res) => {
  const userId = req.user.id;
  
  // Verify user intent
  if (req.body.confirmDelete !== 'DELETE MY ACCOUNT') {
    return res.status(400).json({ error: 'Confirmation required' });
  }
  
  await deleteUserData(userId);
  
  res.json({ 
    message: 'Account deleted successfully',
    deletedAt: new Date()
  });
});

// Article 16: Right to Rectification
app.patch('/api/user/update', authenticate, async (req, res) => {
  const userId = req.user.id;
  const updates = req.body;
  
  // Only allow updating PII fields, not system fields
  const allowed = ['email', 'fullName', 'phone', 'address'];
  const filtered = Object.keys(updates)
    .filter(k => allowed.includes(k))
    .reduce((obj, k) => ({ ...obj, [k]: updates[k] }), {});
  
  await db.users.update({
    where: { id: userId },
    data: filtered
  });
  
  res.json({ message: 'Profile updated' });
});

// Article 21: Right to Object
app.post('/api/user/withdraw-consent', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { consentType } = req.body;  // 'marketing', 'analytics', etc.
  
  await db.users.update({
    where: { id: userId },
    data: {
      [`consent.${consentType}`]: false,
      [`consent.withdrawnAt`]: new Date()
    }
  });
  
  // Stop processing immediately
  if (consentType === 'marketing') {
    await unsubscribeFromMarketing(userId);
  }
  
  res.json({ message: `Consent withdrawn for ${consentType}` });
});
```

### ✅ GOOD: Third-Party Data Sharing Controls

```typescript
async function sendToAnalytics(userId: string, event: string) {
  const user = await db.users.findUnique({ where: { id: userId } });
  
  // Check consent before sending
  if (!user.consent.analytics) {
    logger.info('Analytics tracking skipped - no consent', { userId });
    return;
  }
  
  // Send only non-PII or anonymized data
  analytics.track({
    anonymousId: hashUserId(userId),  // Pseudonymization
    event,
    timestamp: new Date()
    // NO email, name, or direct identifiers
  });
}

// Data Processing Agreement (DPA) with third-party
await sendToExternalService({
  userId: hashedUserId,              // Pseudonymized
  consentGiven: user.consent.thirdPartySharing,
  dpaReference: 'DPA-2024-001',    // Track which DPA covers this
  legalBasis: 'consent'              // Article 6 basis
});
```

## Detection Patterns

Look for:

1. **PII Collection Without Consent:**
   - Variables named: `email`, `phone`, `ssn`, `address`, `dob`
   - HTTP request fields containing PII
   - No consent checking logic

2. **Unencrypted PII Storage:**
   - Database inserts/updates with PII fields
   - No encryption methods called
   - Plain text in schema definitions

3. **PII in Logs:**
   - `console.log()`, `logger.*()` with user objects
   - Error messages containing email/names
   - Request/response logging without masking

4. **Missing Data Subject Rights:**
   - No `/export`, `/delete-account` endpoints
   - No data download functionality
   - No consent withdrawal mechanism

5. **Indefinite Retention:**
   - Soft deletes only (no hard delete logic)
   - No retention policy enforcement code
   - No automated cleanup jobs

## Severity Assignment

**HIGH (default) when:**
- Direct PII (email, name, phone) collected/stored/processed
- No consent mechanism present
- PII logged or exposed

**CRITICAL when:**
- Special category data (Article 9): health, biometric, religion, etc.
- Large-scale processing
- Systematic monitoring
- Vulnerable data subjects (children)
- Cross-border transfers without safeguards

**MEDIUM when:**
- PII used but with partial protections
- Internal processing with some safeguards
- Limited scope

## References

- [GDPR Full Text](https://gdpr-info.eu/)
- [ICO GDPR Guidance](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/)
- [Article 29 Working Party Guidelines](https://ec.europa.eu/newsroom/article29/items/611236)
- [NIST Privacy Framework](https://www.nist.gov/privacy-framework)
- [OWASP Privacy Risks](https://owasp.org/www-project-top-10-privacy-risks/)

## Remediation Checklist

- [ ] Obtain and record explicit consent for all PII processing
- [ ] Implement encryption for PII at rest and in transit
- [ ] Remove PII from logs or mask/pseudonymize
- [ ] Implement data subject rights endpoints (access, export, delete)
- [ ] Define and enforce data retention policies
- [ ] Conduct and document Data Protection Impact Assessment (DPIA)
- [ ] Establish Data Processing Agreements (DPA) with processors
- [ ] Implement consent management system
- [ ] Add privacy policy and cookie consent notices
- [ ] Train developers on GDPR requirements
- [ ] Appoint Data Protection Officer (DPO) if required
- [ ] Document lawful basis for each processing activity

---

**Remember:** GDPR applies to any organization processing EU residents' data, regardless of where the organization is located!
