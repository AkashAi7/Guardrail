---
title: Internal API Authentication Required
severity: HIGH
category: Security
---

# Internal API Authentication Required

## What to Detect

All API endpoints that handle sensitive data must implement authentication using JWT tokens or session-based authentication. Look for route handlers that:

- Access user data, financial information, or PII
- Modify system state or database records
- Are under `/api/*`, `/internal/*`, or `/admin/*` paths
- Do not include authentication middleware

## Why It Matters

**Security Risk:**
Unauthenticated APIs are vulnerable to unauthorized access, data breaches, and system compromise. Even internal APIs can be exploited by:
- Attackers who gain network access
- Malicious insiders
- Cross-site request forgery (CSRF) attacks
- Server-side request forgery (SSRF) attacks

**Compliance Impact:**
- SOC2 CC6.1 - Logical and Physical Access Controls (CRITICAL)
- ISO 27001 A.9.1.2 - Access to networks and network services
- Company Security Policy Section 4.2 - API Security Requirements

**Business Impact:**
- Data breaches leading to regulatory fines
- Loss of customer trust
- Potential legal liability

## Examples of Violations

❌ **BAD - Express without authentication:**
```javascript
const express = require('express');
const app = express();

// VIOLATION: No authentication middleware
app.get('/api/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  res.json(users);
});

// VIOLATION: Modifying data without auth check
app.post('/api/users/:id/update', async (req, res) => {
  await db.query('UPDATE users SET email = ? WHERE id = ?', [req.body.email, req.params.id]);
  res.json({ success: true });
});
```

❌ **BAD - Fastify without authentication:**
```javascript
fastify.get('/api/payments', async (request, reply) => {
  // VIOLATION: Accessing financial data without auth
  const payments = await db.getPayments();
  return payments;
});
```

❌ **BAD - Next.js API route without authentication:**
```javascript
// pages/api/admin/users.js
export default async function handler(req, res) {
  // VIOLATION: Admin endpoint without auth check
  const users = await prisma.user.findMany();
  res.status(200).json(users);
}
```

## How to Fix

✅ **GOOD - Express with authentication middleware:**
```javascript
const express = require('express');
const { requireAuth, requireRole } = require('./middleware/auth');
const app = express();

// Proper authentication
app.get('/api/users', requireAuth, async (req, res) => {
  // req.user is populated by requireAuth middleware
  const users = await db.query('SELECT * FROM users WHERE org_id = ?', [req.user.orgId]);
  res.json(users);
});

// With role-based access control
app.post('/api/users/:id/update', requireAuth, requireRole('admin'), async (req, res) => {
  await db.query('UPDATE users SET email = ? WHERE id = ? AND org_id = ?', 
    [req.body.email, req.params.id, req.user.orgId]);
  res.json({ success: true });
});
```

✅ **GOOD - Fastify with authentication:**
```javascript
fastify.get('/api/payments', 
  { preHandler: fastify.authenticate },
  async (request, reply) => {
    const payments = await db.getPayments(request.user.id);
    return payments;
  }
);
```

✅ **GOOD - Next.js with authentication:**
```javascript
// pages/api/admin/users.js
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session || session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const users = await prisma.user.findMany({
    where: { orgId: session.user.orgId }
  });
  
  res.status(200).json(users);
}
```

✅ **GOOD - Using JWT verification:**
```javascript
const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.use('/api/*', requireAuth);
```

## Detection Patterns

Look for these patterns that indicate missing authentication:

1. **Route definitions without middleware:**
   - `app.get('/api/*', (req, res) => ...)`
   - `app.post('/api/*', (req, res) => ...)`
   - `fastify.route({ method: 'GET', url: '/api/*', handler: ... })`

2. **Database queries without user context:**
   - `SELECT * FROM users` (no WHERE clause with user context)
   - Operations without `req.user` or `req.session` checks

3. **Admin/internal endpoints without protection:**
   - Routes containing `/admin/`, `/internal/`, `/api/`
   - Routes that modify data (POST, PUT, DELETE, PATCH)

4. **Missing authorization headers:**
   - No checks for `req.headers.authorization`
   - No session validation

## Exceptions

Some endpoints may legitimately not require authentication:

1. **Public read-only endpoints:**
   - Health checks (`/health`, `/status`)
   - Public documentation (`/docs`, `/api-docs`)
   - Public content (`/blog`, `/public/*`)

2. **Authentication endpoints themselves:**
   - `/auth/login`
   - `/auth/register`
   - `/auth/forgot-password`

3. **Webhook receivers (should use other verification):**
   - Stripe webhooks (verify signature)
   - GitHub webhooks (verify signature)

## Severity Assignment

- **CRITICAL:** Endpoints accessing payment data, credentials, or sensitive PII
- **HIGH:** Endpoints accessing user data or modifying system state
- **MEDIUM:** Endpoints accessing non-sensitive data within user's scope
- **LOW:** Public endpoints with rate limiting

## Remediation Checklist

When fixing authentication issues:

- [ ] Add authentication middleware to all sensitive routes
- [ ] Verify JWT tokens or session cookies
- [ ] Implement role-based access control (RBAC) where needed
- [ ] Add user context to all database queries (prevent data leaks)
- [ ] Rate limit authentication endpoints
- [ ] Log authentication failures for security monitoring
- [ ] Use HTTPS in production (never HTTP for authenticated APIs)
- [ ] Rotate JWT secrets regularly
- [ ] Implement token expiration and refresh mechanisms

## Testing

Test that authentication is enforced:

```javascript
// Test unauthenticated request
const response = await fetch('http://localhost:3000/api/users');
assert(response.status === 401); // Should be unauthorized

// Test authenticated request
const authResponse = await fetch('http://localhost:3000/api/users', {
  headers: { 'Authorization': `Bearer ${validToken}` }
});
assert(authResponse.status === 200);

// Test expired token
const expiredResponse = await fetch('http://localhost:3000/api/users', {
  headers: { 'Authorization': `Bearer ${expiredToken}` }
});
assert(expiredResponse.status === 401);
```

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [SOC2 Access Control Requirements](https://www.aicpa.org/soc2)
- Company Security Policy: https://wiki.company.internal/security/api-authentication

## Additional Resources

- Internal auth library: `@company/auth` (recommended)
- Example implementations: `/examples/auth-patterns/`
- Security team contact: security@company.com
