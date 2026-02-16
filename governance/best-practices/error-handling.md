---
title: Async Error Handling
severity: MEDIUM
category: BestPractice
---

# Best Practice: Async Error Handling

## What to Detect

Identify missing error handling in asynchronous code that can lead to unhandled promise rejections, application crashes, or silent failures.

### Common Issues

1. **Unhandled Promise Rejections**
   - `async` functions without `try-catch`
   - `.then()` without `.catch()`
   - Missing error handlers in promise chains

2. **Floating Promises**
   - `async` function calls without `await` or `.catch()`
   - Fire-and-forget promises that can fail silently

3. **Generic Error Handling**
   - Catching errors but not handling them properly
   - Empty catch blocks
   - Not propagating errors when appropriate

4. **Resource Cleanup Issues**
   - Missing `finally` blocks
   - Unclosed connections/files in error cases
   - No cleanup on failure

## Why It Matters

**Reliability Impact:**
- 🔴 Application crashes (unhandled rejection → process exit)
- 👻 Silent failures (errors swallowed, data loss)
- 🐛 Difficult debugging (stack traces lost)
- 💔 Poor user experience (unexpected behavior)
- 📊 Lost monitoring data (errors not logged)

**Production Issues:**
- Node.js will exit on unhandled rejections (Node 15+)
- Zombie resources (connections, files, memory leaks)
- Cascading failures in microservices
- Data inconsistency from partial operations

**Compliance/Operations:**
- SOC2 CC7.1: System monitoring (must log errors)
- SLA violations from undetected failures
- Incident response delays

## Examples of Violations

### ❌ BAD: Async Without Try-Catch

```typescript
// Will crash the application if database fails
async function getUser(id: string) {
  const user = await db.users.findById(id);  // No error handling!
  return user;
}

// Route handler without error handling
app.get('/users/:id', async (req, res) => {
  const user = await getUser(req.params.id);  // Crashes on error
  res.json(user);
});
```

### ❌ BAD: Promise Without Catch

```typescript
// Silent failure - error is never handled
function fetchUserData(id: string) {
  return fetch(`/api/users/${id}`)
    .then(res => res.json())
    .then(data => processData(data));
    // Missing .catch()! Error disappears into the void
}

// Partial error handling
somePromise
  .then(result => {
    console.log(result);
  })
  .catch(err => {
    // Empty catch - error is swallowed!
  });
```

### ❌ BAD: Floating Promises

```typescript
async function processOrder(order: Order) {
  // This promise is "floating" - we don't await or catch it
  sendEmail(order.customerEmail);  // If this fails, we never know!
  
  // Continue with other logic...
  await chargeCustomer(order);
}

// Fire-and-forget in event handler
button.addEventListener('click', () => {
  updateAnalytics();  // Returns promise, but not awaited or caught
  performAction();
});
```

### ❌ BAD: Generic Error Handling

```typescript
// Catching everything without proper handling
async function importData(file: File) {
  try {
    const data = await parseFile(file);
    await validateData(data);
    await saveToDatabase(data);
    return { success: true };
  } catch (error) {
    // Too generic - losing important error information
    return { success: false };
    // No logging, no differentiation between error types
  }
}

// Rethrowing without context
async function processPayment(amount: number) {
  try {
    await chargeCard(amount);
  } catch (error) {
    throw error;  // Just rethrowing without adding context
  }
}
```

### ❌ BAD: Missing Cleanup

```typescript
async function readConfigFile(path: string) {
  const file = await fs.open(path);
  const content = await file.readFile();
  await file.close();  // Never called if readFile() fails!
  return JSON.parse(content);
}

// Database connection not closed on error
async function updateUser(id: string, data: any) {
  const connection = await db.connect();
  await connection.query('UPDATE users SET ... WHERE id = ?', [id]);
  await connection.close();  // Leak if query fails!
}
```

## How to Fix

### ✅ GOOD: Try-Catch with Proper Error Handling

```typescript
async function getUser(id: string) {
  try {
    const user = await db.users.findById(id);
    
    if (!user) {
      throw new NotFoundError(`User ${id} not found`);
    }
    
    return user;
  } catch (error) {
    // Log the error with context
    logger.error('Failed to get user', {
      userId: id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Re-throw with additional context
    if (error instanceof NotFoundError) {
      throw error;  // App-level errors bubble up
    }
    
    // Wrap infrastructure errors
    throw new DatabaseError('Failed to retrieve user', { cause: error });
  }
}

// Express route with error handling
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);
    res.json(user);
  } catch (error) {
    // Pass to error middleware
    next(error);
  }
});

// Or use async error wrapper
const asyncHandler = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUser(req.params.id);
  res.json(user);
}));
```

### ✅ GOOD: Promise Chain with Catch

```typescript
function fetchUserData(id: string): Promise<UserData> {
  return fetch(`/api/users/${id}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => processData(data))
    .catch(error => {
      logger.error('Failed to fetch user data', { userId: id, error });
      
      // Transform to application error
      if (error.message.includes('404')) {
        throw new NotFoundError(`User ${id} not found`);
      }
      
      throw new ApiError('Failed to fetch user data', { cause: error });
    });
}

// Or convert to async/await for clarity
async function fetchUserData(id: string): Promise<UserData> {
  try {
    const res = await fetch(`/api/users/${id}`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    return processData(data);
  } catch (error) {
    logger.error('Failed to fetch user data', { userId: id, error });
    throw new ApiError('Failed to fetch user data', { cause: error });
  }
}
```

### ✅ GOOD: Handling Floating Promises

```typescript
async function processOrder(order: Order) {
  try {
    // Option 1: Await if result matters
    await sendEmail(order.customerEmail);
    logger.info('Order confirmation sent', { orderId: order.id });
  } catch (emailError) {
    // Email failure shouldn't block order processing
    logger.error('Failed to send order email', {
      orderId: order.id,
      email: order.customerEmail,
      error: emailError
    });
    // Continue with order processing
  }
  
  // Option 2: Fire-and-forget with explicit catch
  sendEmail(order.customerEmail).catch(error => {
    logger.error('Email send failed', { orderId: order.id, error });
  });
  
  // Critical operation - must await
  await chargeCustomer(order);
}

// Background jobs with error handling
function scheduleBackgroundJob(job: () => Promise<void>) {
  job().catch(error => {
    logger.error('Background job failed', { error });
    // Optionally: send to error tracking service
    errorTracker.captureException(error);
  });
}

// Event handler with proper error handling
button.addEventListener('click', () => {
  (async () => {
    try {
      await updateAnalytics();
      await performAction();
    } catch (error) {
      logger.error('Click handler failed', { error });
      showErrorToast('Action failed. Please try again.');
    }
  })();
});
```

### ✅ GOOD: Specific Error Handling

```typescript
// Custom error types for better handling
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DatabaseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DatabaseError';
  }
}

// Differentiated error handling
async function importData(file: File) {
  try {
    const data = await parseFile(file);
    await validateData(data);
    await saveToDatabase(data);
    return { success: true, imported: data.length };
  } catch (error) {
    // Handle specific error types differently
    if (error instanceof ValidationError) {
      logger.warn('Data validation failed', {
        field: error.field,
        value: error.value
      });
      return {
        success: false,
        error: 'validation',
        message: `Invalid ${error.field}: ${error.message}`,
        field: error.field
      };
    }
    
    if (error instanceof DatabaseError) {
      logger.error('Database error during import', { error });
      return {
        success: false,
        error: 'database',
        message: 'Failed to save data. Please try again.'
      };
    }
    
    // Unknown error
    logger.error('Unexpected error during import', { error });
    return {
      success: false,
      error: 'unknown',
      message: 'An unexpected error occurred.'
    };
  }
}
```

### ✅ GOOD: Resource Cleanup with Finally

```typescript
async function readConfigFile(path: string): Promise<Config> {
  let file: FileHandle | null = null;
  
  try {
    file = await fs.open(path, 'r');
    const content = await file.readFile('utf-8');
    return JSON.parse(content);
  } catch (error) {
    logger.error('Failed to read config', { path, error });
    throw new ConfigError('Failed to load configuration', { cause: error });
  } finally {
    // Always close the file, even if errors occurred
    if (file) {
      await file.close().catch(err => {
        logger.error('Failed to close config file', { path, error: err });
      });
    }
  }
}

// Database connection cleanup
async function updateUser(id: string, data: Partial<User>): Promise<void> {
  const connection = await db.connect();
  
  try {
    await connection.startTransaction();
    await connection.query('UPDATE users SET ? WHERE id = ?', [data, id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    logger.error('Failed to update user', { userId: id, error });
    throw new DatabaseError('Failed to update user', { cause: error });
  } finally {
    await connection.close();  // Always close
  }
}

// Using 'using' keyword (TypeScript 5.2+)
async function readConfig(path: string): Promise<Config> {
  using file = await fs.open(path, 'r');  // Automatically disposed
  const content = await file.readFile('utf-8');
  return JSON.parse(content);
}
```

### ✅ GOOD: Global Error Handlers

```typescript
// Node.js global handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason,
    promise
  });
  
  // Send to error tracking
  errorTracker.captureException(reason);
  
  // Optional: graceful shutdown
  if (isProductionCritical(reason)) {
    gracefulShutdown(1);
  }
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  errorTracker.captureException(error);
  
  // Always exit on uncaught exceptions
  gracefulShutdown(1);
});

// Express global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  
  res.status(500).json({ error: message });
});
```

## Detection Patterns

Look for:

1. **Async functions without try-catch:**
   ```regex
   async\s+function\s+\w+\([^)]*\)\s*{(?!.*try)
   ```

2. **Promises without .catch():**
   ```regex
   \.then\([^)]+\)[^.]*(?!\.catch)
   ```

3. **Floating promises (not awaited or caught):**
   - Function call returning Promise but result not used
   - No `await`, no `.then()`, no `.catch()`

4. **Empty or minimal catch blocks:**
   ```typescript
   catch (error) {}  // Empty
   catch (error) { console.log(error); }  // Only logging
   ```

5. **Missing finally for cleanup:**
   - File/connection opened without finally
   - Try-catch without resource cleanup

## Severity Assignment

**HIGH when:**
- In critical paths (payment, auth, data writes)
- Public API endpoints
- Main application entry points

**MEDIUM (default) when:**
- General application code
- Background jobs
- Internal utilities

**LOW when:**
- Test code
- Development-only code
- Already wrapped by error boundary

**INFO when:**
- Suggestion for improvement
- Non-critical code paths

## Auto-Fix Strategy

1. **Wrap in try-catch:**
   ```typescript
   // Before
   async function fn() {
     await operation();
   }
   
   // After
   async function fn() {
     try {
       await operation();
     } catch (error) {
       logger.error('Operation failed', { error });
       throw error;
     }
   }
   ```

2. **Add .catch() to promise:**
   ```typescript
   // Before
   promise.then(result => handleResult(result));
   
   // After
   promise
     .then(result => handleResult(result))
     .catch(error => {
       logger.error('Promise failed', { error });
       throw error;
     });
   ```

3. **Add await or catch to floating promise:**
   ```typescript
   // Before
   sendNotification();
   
   // After
   sendNotification().catch(error => {
     logger.error('Notification failed', { error });
   });
   ```

## References

- [Promise Error Handling](https://javascript.info/promise-error-handling)
- [Async/Await Error Handling](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await#error_handling)
- [Node.js Error Handling Best Practices](https://nodejs.org/en/docs/guides/error-handling/)
- [OWASP: Error Handling](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)

## Remediation Checklist

- [ ] Wrap all async functions in try-catch
- [ ] Add .catch() to all promise chains
- [ ] Handle or explicitly ignore floating promises
- [ ] Use finally for resource cleanup
- [ ] Log errors with sufficient context
- [ ] Set up global error handlers
- [ ] Use structured error types
- [ ] Don't leak sensitive info in error messages
- [ ] Test error paths explicitly
- [ ] Monitor unhandled rejections in production

---

**Golden Rule:** Every async operation must have error handling. No exceptions!
