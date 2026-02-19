---
title: SQL Injection Prevention
severity: HIGH
category: Security
---

# Security Rule: SQL Injection Prevention

## What to Detect

Look for unsafe SQL query construction patterns where user input is concatenated directly into SQL statements, creating SQL injection vulnerabilities.

### Vulnerable Patterns

1. **String concatenation with user input**
2. **Template literals with unsanitized variables**
3. **String formatting with user-controlled data**
4. **Dynamic table/column names from user input**
5. **Unsafe query builders without parameterization**

## Why It Matters

**Security Risks:**
- 🗄️ Complete database compromise (read, modify, delete)
- 👤 Unauthorized access to sensitive data
- 🔓 Authentication bypass
- 💥 Data destruction or corruption
- 🚀 Lateral movement to other systems

**Compliance Violations:**
- **OWASP Top 10:** #1 Injection (2021)
- **PCI-DSS 6.5.1:** Injection flaws, particularly SQL injection  
- **GDPR Article 32:** Security of processing
- **HIPAA §164.312(a)(1):** Access Control
- **SOC2 CC6.1:** Logical and physical access controls
- **CWE-89:** Improper Neutralization of Special Elements

**Real-World Impact:**
- 65% of web application attacks involve SQL injection
- Average breach cost: $4.24M
- Can lead to complete system compromise
- Often used as initial foothold for advanced attacks

## Examples of Violations

### ❌ BAD: JavaScript/TypeScript

```typescript
// Direct string concatenation
async function getUser(userId: string) {
  const query = "SELECT * FROM users WHERE id = '" + userId + "'";
  return db.query(query);
  // Attack: userId = "1' OR '1'='1"
  // Result: SELECT * FROM users WHERE id = '1' OR '1'='1'
}

// Template literals (equally vulnerable!)
async function searchProducts(term: string) {
  const sql = `SELECT * FROM products WHERE name LIKE '%${term}%'`;
  return db.query(sql);
  // Attack: term = "%'; DROP TABLE products; --"
}

// Dynamic ORDER BY (subtle but dangerous)
function getUsers(sortBy: string) {
  return db.query(`SELECT * FROM users ORDER BY ${sortBy}`);
  // Attack: sortBy = "(SELECT CASE WHEN (1=1) THEN name ELSE id END)"
}

// String formatting
function authenticate(username: string, password: string) {
  const query = util.format(
    "SELECT * FROM users WHERE username = '%s' AND password = '%s'",
    username, password
  );
  return db.query(query);
}
```

### ❌ BAD: Python

```python
# F-strings (vulnerable!)
def get_user(user_id: str):
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)

# String concatenation
def search(keyword: str):
    sql = "SELECT * FROM posts WHERE title LIKE '%" + keyword + "%'"
    cursor.execute(sql)

# Format strings
def login(username: str, password: str):
    query = "SELECT * FROM users WHERE user = '{}' AND pass = '{}'".format(
        username, password
    )
    cursor.execute(query)
```

### ❌ BAD: C# / .NET

```csharp
// String concatenation
public User GetUser(string userId)
{
    string query = "SELECT * FROM Users WHERE Id = '" + userId + "'";
    return db.Query<User>(query).First();
}

// String interpolation
public List<Product> Search(string term)
{
    string sql = $"SELECT * FROM Products WHERE Name LIKE '%{term}%'";
    return db.Query<Product>(sql).ToList();
}
```

### ❌ BAD: PHP

```php
// Direct concatenation
$userId = $_GET['id'];
$query = "SELECT * FROM users WHERE id = '" . $userId . "'";
$result = mysqli_query($conn, $query);

// Double quotes interpolation
$sql = "SELECT * FROM products WHERE category = '$category'";
```

## How to Fix

### ✅ GOOD: Parameterized Queries (Best Practice)

**JavaScript/TypeScript - PostgreSQL (pg):**
```typescript
// Parameterized query with pg
async function getUser(userId: string) {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await db.query(query, [userId]);
  return result.rows[0];
}

// Multiple parameters
async function authenticate(username: string, password: string) {
  const query = `
    SELECT * FROM users 
    WHERE username = $1 AND password_hash = crypt($2, password_hash)
  `;
  const result = await db.query(query, [username, password]);
  return result.rows[0];
}

// LIKE queries (escape % and _ if needed)
async function searchProducts(term: string) {
  // Note: term itself is parameterized, % is in the query
  const query = 'SELECT * FROM products WHERE name ILIKE $1';
  const result = await db.query(query, [`%${term}%`]);
  return result.rows;
}
```

**JavaScript/TypeScript - MySQL (mysql2):**
```typescript
import mysql from 'mysql2/promise';

async function getUser(userId: string) {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );
  return rows[0];
}

// Named parameters
async function updateUser(userId: string, email: string, name: string) {
  const [result] = await db.query(
    'UPDATE users SET email = ?, name = ? WHERE id = ?',
    [email, name, userId]
  );
  return result;
}
```

**Python - with parameterization:**
```python
import psycopg2

def get_user(user_id: str):
    # PostgreSQL style
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    return cursor.fetchone()

def search_products(term: str):
    # Parameterized LIKE
    cursor.execute(
        "SELECT * FROM products WHERE name ILIKE %s",
        (f'%{term}%',)
    )
    return cursor.fetchall()

# SQLite
import sqlite3

def get_user_sqlite(user_id: str):
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    return cursor.fetchone()
```

**C# / .NET:**
```csharp
using Dapper;

public User GetUser(string userId)
{
    string query = "SELECT * FROM Users WHERE Id = @UserId";
    return db.QueryFirst<User>(query, new { UserId = userId });
}

public List<Product> SearchProducts(string term)
{
    string query = "SELECT * FROM Products WHERE Name LIKE @SearchTerm";
    return db.Query<Product>(query, new { SearchTerm = $"%{term}%" }).ToList();
}

// Entity Framework (already safe)
public User GetUser(string userId)
{
    return dbContext.Users.FirstOrDefault(u => u.Id == userId);
}
```

**PHP - Prepared Statements:**
```php
// MySQLi
$stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
$stmt->bind_param("s", $userId);
$stmt->execute();
$result = $stmt->get_result();

// PDO
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute(['id' => $userId]);
$result = $stmt->fetch();
```

### ✅ GOOD: ORM Usage (Usually Safe)

**TypeScript - TypeORM:**
```typescript
import { Repository } from 'typeorm';

// Query builder (safe)
async function getUser(userId: string) {
  return userRepository
    .createQueryBuilder('user')
    .where('user.id = :id', { id: userId })
    .getOne();
}

// Repository methods (safe)
async function searchProducts(term: string) {
  return productRepository
    .createQueryBuilder('product')
    .where('product.name ILIKE :term', { term: `%${term}%` })
    .getMany();
}
```

**Python - SQLAlchemy:**
```python
from sqlalchemy import select

# ORM query (safe)
def get_user(user_id: str):
    stmt = select(User).where(User.id == user_id)
    return session.execute(stmt).scalar_one()

# Multiple conditions
def search_products(term: str):
    stmt = select(Product).where(Product.name.ilike(f'%{term}%'))
    return session.execute(stmt).scalars().all()
```

**C# - Entity Framework:**
```csharp
// LINQ (safe)
public User GetUser(string userId)
{
    return dbContext.Users
        .Where(u => u.Id == userId)
        .FirstOrDefault();
}

public List<Product> SearchProducts(string term)
{
    return dbContext.Products
        .Where(p => EF.Functions.Like(p.Name, $"%{term}%"))
        .ToList();
}
```

### ⚠️ CAREFUL: Dynamic Identifiers

When you MUST use dynamic table/column names (rare!), use whitelisting:

```typescript
// BAD: Direct interpolation
function getDataFromTable(tableName: string) {
  return db.query(`SELECT * FROM ${tableName}`);  // NEVER DO THIS
}

// GOOD: Whitelist approach
const ALLOWED_TABLES = ['users', 'products', 'orders'];

function getDataFromTable(tableName: string) {
  if (!ALLOWED_TABLES.includes(tableName)) {
    throw new Error('Invalid table name');
  }
  // Now safe for identifier (not a value)
  return db.query(`SELECT * FROM ${tableName}`);
}

// BETTER: Map to actual values
const TABLE_MAP: Record<string, string> = {
  'users': 'app_users',
  'products': 'app_products'
};

function getDataFromTable(tableKey: string) {
  const tableName = TABLE_MAP[tableKey];
  if (!tableName) {
    throw new Error('Invalid table');
  }
  return db.query(`SELECT * FROM ${tableName}`);
}
```

```python
# Dynamic column with whitelist
ALLOWED_SORT_COLUMNS = ['name', 'created_at', 'price']

def get_products(sort_by: str):
    if sort_by not in ALLOWED_SORT_COLUMNS:
        raise ValueError('Invalid sort column')
    
    # Safe because we validated against whitelist
    query = f"SELECT * FROM products ORDER BY {sort_by}"
    cursor.execute(query)
    return cursor.fetchall()
```

## Detection Patterns

### Regex Patterns for Analysis

Common vulnerable patterns:
```regex
# String concatenation in queries
(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE).*["+].*["+]

# Template literals with SQL
`.*(?:SELECT|INSERT|UPDATE|DELETE).*\$\{.*\}`

# Python f-strings with SQL
f["'].*(?:SELECT|INSERT|UPDATE|DELETE).*\{.*\}

# Format strings
\.format\(.*(?:SELECT|INSERT|UPDATE|DELETE)

# Direct + concatenation
"(?:SELECT|INSERT|UPDATE|DELETE).*"\s*\+\s*\w+
```

### Semantic Analysis

Look for:
1. SQL keywords in string literals
2. Variables from user input (function parameters, request objects)
3. String operations (concat, template literals, format) combining SQL + variables
4. Database execution methods: `execute()`, `query()`, `raw()`
5. Absence of parameterized query syntax (`$1`, `?`, `@param`)

### Context Clues

**Higher Risk:**
- Parameter names: `userId`, `searchTerm`, `input`, `filter`
- From web requests: `req.params`, `req.query`, `$_GET`, `request.form`
- Interactive functions: `search`, `find`, `filter`, `authenticate`

**Lower Risk:**
- Admin-only functions with hardcoded values
- Migration scripts with static SQL
- Internal functions with validated enums

## Severity Assignment

**Always HIGH unless:**
- It's in a test file with clearly mocked database
- It's commented-out code or documentation
- The input is from a hardcoded constant (not user-supplied)

**Upgrade to CRITICAL if:**
- Used in authentication/authorization
- Accessible from public API endpoints
- Involves sensitive tables (users, payments, credentials)
- No authentication required to reach the code

## Auto-Fix Strategy

1. **Identify the query construction**
2. **Extract variables being interpolated**
3. **Replace with parameterized syntax:**
   - PostgreSQL: `$1`, `$2`, ...
   - MySQL: `?`
   - Oracle: `:1`, `:2`, ...
   - Named: `@param`, `:param`
4. **Create parameter array**
5. **Update the query call:**
   ```typescript
   // Before
   db.query(`SELECT * FROM users WHERE id = '${userId}'`)
   
   // After
   db.query('SELECT * FROM users WHERE id = $1', [userId])
   ```

## Exceptions and False Positives

### Acceptable Cases:
```typescript
// Static queries (no variables)
const users = await db.query('SELECT * FROM users');

// Hardcoded constants
const TABLE_NAME = 'app_users';
const query = `SELECT * FROM ${TABLE_NAME}`;  // OK if constant

// Query builders with proper escaping
const query = queryBuilder
  .select('*')
  .from('users')
  .where('id', '=', userId);  // Query builder handles parameterization
```

### How to Suppress:
```typescript
// guardrail-ignore: sql-injection - Using validated enum value
const sortColumn = SORT_COLUMNS[userChoice];  // Already validated
const query = `SELECT * FROM products ORDER BY ${sortColumn}`;
```

## Testing for SQL Injection

Common test payloads:
```
' OR '1'='1
' OR '1'='1' --
' OR '1'='1' /*
admin'--
'; DROP TABLE users; --
1' UNION SELECT null, username, password FROM users--
' AND 1=CONVERT(int, (SELECT @@version))--
```

## References

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [OWASP Query Parameterization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Query_Parameterization_Cheat_Sheet.html)
- [PortSwigger: SQL Injection](https://portswigger.net/web-security/sql-injection)
- [PCI DSS Requirement 6.5.1](https://www.pcisecuritystandards.org/)

## Remediation Checklist

- [ ] Replace string concatenation with parameterized queries
- [ ] Use `?` or `$1` style placeholders
- [ ] Pass parameters as separate array/object
- [ ] Validate dynamic identifiers against whitelist
- [ ] Test with SQL injection payloads
- [ ] Use ORM when possible for added safety
- [ ] Enable SQL query logging for audit
- [ ] Apply principle of least privilege for database users
- [ ] Use prepared statements for all user input

---

**Golden Rule:** NEVER concatenate user input into SQL queries. Always use parameterized queries or ORMs.
