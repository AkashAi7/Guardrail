---
title: Error Message Standards
severity: MEDIUM
category: BestPractice
---

# Error Message Standards

## What to Detect

Error messages that expose sensitive information, are too generic to be helpful, or don't follow company standards. Look for:

- Stack traces in production error responses
- Database error details exposed to users
- Internal paths or system information leaked
- Generic "Something went wrong" messages without context
- Missing error codes or correlation IDs
- Unstructured error messages

## Why It Matters

**Security Risk:**
Detailed error messages can expose:
- Internal system architecture
- Database schema and table names
- File paths and directory structures
- Version information of frameworks/libraries
- SQL queries and logic

Attackers use this information to craft targeted attacks.

**User Experience:**
Poor error messages frustrate users by:
- Not explaining what went wrong
- Not providing actionable steps to fix issues
- Making support troubleshooting difficult

**Operations:**
Without proper error tracking:
- Difficult to debug production issues
- No correlation between user reports and logs
- Can't measure error rates by type

**Compliance Impact:**
- PCI-DSS 6.5.5 - Improper Error Handling
- OWASP Top 10 - Security Misconfiguration

## Examples of Violations

❌ **BAD - Exposing stack traces:**
```javascript
app.post('/api/users', async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.json(user);
  } catch (error) {
    // VIOLATION: Sending full error with stack trace
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Client sees:
// {
//   "error": "duplicate key value violates unique constraint \"users_email_key\"",
//   "stack": "Error: ...\n    at /app/src/database.js:42:15\n ..."
// }
```

❌ **BAD - Exposing database errors:**
```javascript
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.query(
      'SELECT * FROM products WHERE id = $1', 
      [req.params.id]
    );
    res.json(product);
  } catch (error) {
    // VIOLATION: Exposing SQL error details
    res.status(500).json({ 
      error: error.message,
      detail: error.detail,
      query: error.query
    });
  }
});
```

❌ **BAD - Too generic:**
```javascript
app.post('/api/checkout', async (req, res) => {
  try {
    await processPayment(req.body);
    res.json({ success: true });
  } catch (error) {
    // VIOLATION: Not helpful to users
    res.status(500).json({ error: 'Something went wrong' });
  }
});
```

❌ **BAD - No error code or tracking:**
```javascript
app.put('/api/profile', async (req, res) => {
  try {
    await updateProfile(req.user.id, req.body);
    res.json({ success: true });
  } catch (error) {
    // VIOLATION: No error code, no correlation ID
    res.status(400).json({ error: 'Invalid request' });
  }
});
```

❌ **BAD - Unstructured errors:**
```javascript
// VIOLATION: Inconsistent error format
if (!user) {
  return res.status(404).send('User not found');
}

if (!isValid(data)) {
  return res.status(400).json({ message: 'Bad input' });
}

if (error) {
  return res.status(500).json({ error: { msg: 'Failed' } });
}
```

## How to Fix

✅ **GOOD - Structured error responses:**
```javascript
// Define standard error response format
class APIError extends Error {
  constructor(message, code, statusCode = 500, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Error response middleware
app.use((err, req, res, next) => {
  // Generate correlation ID for tracking
  const correlationId = req.id || generateId();

  // Log full error server-side (with stack trace)
  logger.error('Request failed', {
    correlationId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Determine if we should expose details (dev vs prod)
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Send safe error to client
  res.status(err.statusCode || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      correlationId,
      ...(isDevelopment && { stack: err.stack }), // Only in dev
      ...(err.details && { details: err.details })
    }
  });
});
```

✅ **GOOD - User-friendly error messages:**
```javascript
app.post('/api/checkout', async (req, res, next) => {
  try {
    const result = await processPayment(req.body);
    res.json({ success: true, orderId: result.orderId });
  } catch (error) {
    // Map internal errors to user-friendly messages
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return next(new APIError(
        'Your card was declined due to insufficient funds. Please try a different payment method.',
        'PAYMENT_DECLINED_INSUFFICIENT_FUNDS',
        402,
        { 
          declinedAmount: req.body.amount,
          suggestedAction: 'Try a different card or contact your bank'
        }
      ));
    }
    
    if (error.code === 'CARD_EXPIRED') {
      return next(new APIError(
        'Your card has expired. Please update your payment method.',
        'PAYMENT_CARD_EXPIRED',
        402,
        { suggestedAction: 'Update card expiration date' }
      ));
    }

    // Generic payment error (don't expose internal details)
    return next(new APIError(
      'We were unable to process your payment. Please try again or contact support.',
      'PAYMENT_PROCESSING_FAILED',
      500
    ));
  }
});
```

✅ **GOOD - Consistent error codes:**
```javascript
// Define error codes as constants
const ErrorCodes = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: 'AUTH_001',
  TOKEN_EXPIRED: 'AUTH_002',
  INSUFFICIENT_PERMISSIONS: 'AUTH_003',
  
  // Validation
  INVALID_INPUT: 'VAL_001',
  MISSING_REQUIRED_FIELD: 'VAL_002',
  INVALID_EMAIL_FORMAT: 'VAL_003',
  
  // Business Logic
  DUPLICATE_RESOURCE: 'BUS_001',
  RESOURCE_NOT_FOUND: 'BUS_002',
  OPERATION_NOT_ALLOWED: 'BUS_003',
  
  // External Services
  PAYMENT_FAILED: 'EXT_001',
  EMAIL_DELIVERY_FAILED: 'EXT_002',
  
  // System
  INTERNAL_ERROR: 'SYS_001',
  DATABASE_ERROR: 'SYS_002',
  RATE_LIMIT_EXCEEDED: 'SYS_003'
};

// Use error codes consistently
if (!user) {
  throw new APIError(
    'User not found',
    ErrorCodes.RESOURCE_NOT_FOUND,
    404
  );
}

if (await isDuplicateEmail(email)) {
  throw new APIError(
    'An account with this email already exists',
    ErrorCodes.DUPLICATE_RESOURCE,
    409,
    { field: 'email' }
  );
}
```

✅ **GOOD - Validation errors with details:**
```javascript
const { validationResult } = require('express-validator');

app.post('/api/users', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('name').notEmpty()
], async (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return next(new APIError(
      'Validation failed',
      ErrorCodes.INVALID_INPUT,
      400,
      {
        fields: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value
        }))
      }
    ));
  }
  
  // Process request...
});

// Client receives:
// {
//   "error": {
//     "code": "VAL_001",
//     "message": "Validation failed",
//     "correlationId": "req_abc123xyz",
//     "details": {
//       "fields": [
//         { "field": "email", "message": "Invalid email format", "value": "not-an-email" },
//         { "field": "password", "message": "Must be at least 8 characters", "value": "***" }
//       ]
//     }
//   }
// }
```

✅ **GOOD - Database error mapping:**
```javascript
app.post('/api/users', async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    // Map database errors to safe user messages
    if (error.code === '23505') { // PostgreSQL unique violation
      return next(new APIError(
        'A user with this email already exists',
        ErrorCodes.DUPLICATE_RESOURCE,
        409,
        { field: 'email' }
      ));
    }
    
    if (error.code === '23503') { // Foreign key violation
      return next(new APIError(
        'Referenced resource does not exist',
        ErrorCodes.RESOURCE_NOT_FOUND,
        400
      ));
    }

    // Generic database error (don't expose details)
    logger.error('Database error', { error, query: error.query });
    return next(new APIError(
      'Unable to create user. Please try again.',
      ErrorCodes.DATABASE_ERROR,
      500
    ));
  }
});
```

## Detection Patterns

Look for:

1. **Unsafe error exposure:**
   - `res.json({ error: error })` or `res.send(error)`
   - `error.stack` in responses
   - Database errors sent directly to client
   - File paths in error messages

2. **Generic messages:**
   - "Something went wrong"
   - "Error occurred"
   - "Failed" without context

3. **Inconsistent format:**
   - Different error response structures
   - Sometimes `error`, sometimes `message`
   - Missing status codes

4. **Missing metadata:**
   - No error codes
   - No correlation IDs
   - No actionable details

## Severity Assignment

- **HIGH:** Exposing stack traces, DB schemas, or system internals
- **MEDIUM:** Generic unhelpful messages or inconsistent formats
- **LOW:** Missing error codes or correlation IDs

## Remediation Checklist

- [ ] Create centralized error handling middleware
- [ ] Define standard error response format
- [ ] Create error code constants
- [ ] Map internal errors to user-friendly messages
- [ ] Add correlation IDs to all errors
- [ ] Log full errors server-side
- [ ] Remove stack traces from production responses
- [ ] Validate error messages don't expose internals
- [ ] Document error codes for API consumers
- [ ] Test error scenarios

## Testing

```javascript
describe('Error handling', () => {
  it('should not expose stack traces in production', async () => {
    process.env.NODE_ENV = 'production';
    
    const response = await request(app)
      .get('/api/users/invalid-id')
      .expect(404);
    
    expect(response.body.error.stack).toBeUndefined();
    expect(response.body.error.code).toBeDefined();
    expect(response.body.error.correlationId).toBeDefined();
  });

  it('should provide helpful validation errors', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'not-an-email' })
      .expect(400);
    
    expect(response.body.error.code).toBe('VAL_001');
    expect(response.body.error.details.fields).toContainEqual({
      field: 'email',
      message: expect.any(String)
    });
  });
});
```

## References

- [OWASP Error Handling](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)
- [RFC 7807 - Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc7807)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- Company API Standards: https://wiki.company.internal/standards/api-errors
