# Imported Rules

Imported from: NeGD-start.txt

## * **Secret Management:** Never hardcode secrets
- Severity: HIGH
- Pattern: `password\s*[:=]\s*["'][^"']+["']`
- Message: * **Secret Management:** Never hardcode secrets (keys, tokens, passwords).
- Category: secrets

## * **Secret Management:** Never hardcode secrets
- Severity: HIGH
- Pattern: `secret\s*[:=]\s*["'][^"']+["']`
- Message: * **Secret Management:** Never hardcode secrets (keys, tokens, passwords).
- Category: secrets

## * **Secret Management:** Never hardcode secrets
- Severity: HIGH
- Pattern: `token\s*[:=]\s*["'][^"']+["']`
- Message: * **Secret Management:** Never hardcode secrets (keys, tokens, passwords).
- Category: secrets

## * **Secret Management:** Never hardcode secrets
- Severity: HIGH
- Pattern: `(?:password|secret|key)\s*[:=]\s*["']`
- Message: * **Secret Management:** Never hardcode secrets (keys, tokens, passwords).
- Category: secrets

## * **Query Safety:** Use parameterized queries
- Severity: HIGH
- Pattern: `(?:SELECT|INSERT|UPDATE|DELETE).*\+`
- Message: * **Query Safety:** Use parameterized queries or ORM-safe APIs; never build SQL/NoSQL queries via string concatenation.
- Category: sql-injection

## * **Transport Security:** Use modern TLS;
- Severity: HIGH
- Pattern: `rejectUnauthorized\s*:\s*false`
- Message: * **Transport Security:** Use modern TLS; no insecure ciphers or protocols; validate certificates; never "trust all.
- Category: security

## - [ ] **CORS:** Restrictive (explicit
- Severity: HIGH
- Pattern: `(?:credential|cred)\s*[:=]\s*["'][^"']+["']`
- Message: - [ ] **CORS:** Restrictive (explicit origins/methods); no wildcards with credentials.
- Category: secrets

