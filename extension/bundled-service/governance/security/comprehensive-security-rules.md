# Security Best Practices

## Secrets Management

Never hardcode sensitive credentials in source code. API keys, passwords, tokens, and other secrets must be stored in secure vaults or environment variables.

**Examples of violations:**
- Hardcoded API keys: `const apiKey = "sk-1234567890"`
- Hardcoded passwords: `const password = "admin123"`
- Database credentials in code: `const connectionString = "mongodb://admin:password@localhost"`
- JWT secrets: `const JWT_SECRET = "my-secret-key"`

**Correct approach:**
```typescript
// Use environment variables
const apiKey = process.env.API_KEY;
const password = process.env.DB_PASSWORD;
```

**Severity**: HIGH

---

## SQL Injection Prevention

All database queries must use parameterized queries or prepared statements. Never concatenate user input directly into SQL queries.

**Vulnerable code:**
```typescript
const query = "SELECT * FROM users WHERE id = '" + userId + "'";
const query = `DELETE FROM posts WHERE id = ${postId}`;
```

**Safe code:**
```typescript
// Parameterized query
const query = "SELECT * FROM users WHERE id = ?";
db.execute(query, [userId]);

// ORM usage
const user = await User.findOne({ where: { id: userId } });
```

**Severity**: HIGH

---

## Cross-Site Scripting (XSS) Prevention

Never insert untrusted data directly into HTML without proper sanitization or escaping.

**Vulnerable patterns:**
- `innerHTML = userInput` - Direct HTML injection
- `eval(userInput)` - Code execution
- `document.write(value)` - DOM manipulation with unescaped content
- `dangerouslySetInnerHTML` in React without sanitization

**Safe practices:**
```typescript
// Use textContent instead of innerHTML
element.textContent = userInput;

// React: Escape by default (avoid dangerouslySetInnerHTML)
return <div>{userInput}</div>;

// Sanitize if HTML is needed
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

**Severity**: HIGH

---

## Weak Cryptography

Do not use weak or deprecated cryptographic algorithms. MD5 and SHA1 are cryptographically broken and must not be used for security purposes.

**Avoid:**
- MD5 hashing: `crypto.createHash('md5')`
- SHA1 hashing: `crypto.createHash('sha1')`
- DES encryption
- ECB mode encryption

**Use instead:**
```typescript
// Strong hashing
const hash = crypto.createHash('sha256').update(data).digest('hex');

// Password hashing with bcrypt
const hashedPassword = await bcrypt.hash(password, 10);

// Secure encryption with AES-256-GCM
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
```

**Severity**: MEDIUM

---

## Input Validation

All user input must be validated before processing. Never trust client-side data.

**Required validations:**
- Type checking (string, number, boolean)
- Length/size limits
- Format validation (email, URL, phone)
- Whitelist allowed values
- Sanitize special characters

**Example:**
```typescript
// Bad: No validation
function createUser(email: string) {
    return db.insert({ email });
}

// Good: Proper validation
function createUser(email: string) {
    if (!email || typeof email !== 'string') {
        throw new Error('Invalid email');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }
    
    if (email.length > 254) {
        throw new Error('Email too long');
    }
    
    return db.insert({ email });
}
```

**Severity**: MEDIUM

---

## Command Injection Prevention

Never execute system commands with unsanitized user input. This can lead to arbitrary code execution.

**Vulnerable:**
```typescript
const { exec } = require('child_process');
exec(`ping ${userInput}`); // DANGEROUS!
```

**Safer approaches:**
```typescript
// 1. Avoid shell commands when possible
// 2. Use argument arrays instead of string interpolation
const { spawn } = require('child_process');
spawn('ping', [userInput]); // Arguments are escaped

// 3. Validate and whitelist input
const allowed = /^[a-zA-Z0-9.-]+$/;
if (allowed.test(userInput)) {
    spawn('ping', [userInput]);
}
```

**Severity**: HIGH

---

## Path Traversal Prevention

Validate all file paths to prevent directory traversal attacks. Users should not be able to access files outside the intended directory.

**Vulnerable:**
```typescript
const filePath = './uploads/' + req.params.filename;
fs.readFile(filePath); // Can access ../../../etc/passwd
```

**Safe:**
```typescript
const path = require('path');
const filename = path.basename(req.params.filename); // Remove directory components
const filePath = path.join('./uploads/', filename);

// Also check the resolved path
const resolvedPath = path.resolve(filePath);
if (!resolvedPath.startsWith(path.resolve('./uploads/'))) {
    throw new Error('Invalid file path');
}
```

**Severity**: HIGH

---

## Authentication & Authorization

Every sensitive endpoint must have proper authentication and authorization checks.

**Requirements:**
- Verify user identity (authentication)
- Check permissions (authorization)
- Use secure session management
- Implement rate limiting
- Log access attempts

**Example:**
```typescript
// Bad: No auth check
app.delete('/api/users/:id', (req, res) => {
    deleteUser(req.params.id);
});

// Good: With auth and authorization
app.delete('/api/users/:id', 
    authenticate,
    authorize(['admin']),
    rateLimit,
    (req, res) => {
        if (req.user.id !== req.params.id && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        deleteUser(req.params.id);
    }
);
```

**Severity**: HIGH

---

## Logging Sensitive Data

Never log sensitive information like passwords, credit cards, tokens, or PII.

**Do not log:**
- Passwords (even hashed)
- API keys and tokens
- Credit card numbers
- Social security numbers
- Health information
- Full request/response bodies containing sensitive data

**Safe logging:**
```typescript
// Bad
logger.info('User login', { username, password });

// Good
logger.info('User login', { username, timestamp: Date.now() });

// Redact sensitive fields
function sanitize(obj) {
    const redacted = { ...obj };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    sensitiveFields.forEach(field => {
        if (redacted[field]) redacted[field] = '[REDACTED]';
    });
    return redacted;
}
```

**Severity**: MEDIUM
