export interface Finding {
    ruleId: string;
    message: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    startOffset: number;
    endOffset: number;
    category: string;
}

interface SecurityRule {
    id: string;
    name: string;
    pattern: RegExp;
    severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    message: string;
    category: string;
    languages?: string[];
}

export class SecurityScanner {
    private rules: SecurityRule[] = [
        // === SECRETS & CREDENTIALS ===
        {
            id: 'SEC001',
            name: 'Hardcoded Password',
            pattern: /(?:password|passwd|pwd)\s*[:=]\s*["'`][^"'`]{3,}["'`]/gi,
            severity: 'HIGH',
            message: 'Hardcoded password detected. Use environment variables or a secrets manager.',
            category: 'secrets'
        },
        {
            id: 'SEC002',
            name: 'Hardcoded API Key',
            pattern: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*["'`][A-Za-z0-9_\-]{16,}["'`]/gi,
            severity: 'HIGH',
            message: 'Hardcoded API key detected. Use environment variables or a secrets manager.',
            category: 'secrets'
        },
        {
            id: 'SEC003',
            name: 'Hardcoded Secret/Token',
            pattern: /(?:secret|token|auth[_-]?token|access[_-]?token|bearer)\s*[:=]\s*["'`][A-Za-z0-9_\-]{16,}["'`]/gi,
            severity: 'HIGH',
            message: 'Hardcoded secret/token detected. Use environment variables or a secrets manager.',
            category: 'secrets'
        },
        {
            id: 'SEC004',
            name: 'AWS Access Key',
            pattern: /AKIA[0-9A-Z]{16}/g,
            severity: 'HIGH',
            message: 'AWS Access Key ID detected. Remove and rotate immediately.',
            category: 'secrets'
        },
        {
            id: 'SEC005',
            name: 'Private Key',
            pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
            severity: 'HIGH',
            message: 'Private key detected in code. Never commit private keys to source control.',
            category: 'secrets'
        },
        {
            id: 'SEC006',
            name: 'Connection String with Credentials',
            pattern: /(?:mongodb|mysql|postgres|redis|mssql):\/\/[^:]+:[^@]+@/gi,
            severity: 'HIGH',
            message: 'Database connection string with embedded credentials. Use environment variables.',
            category: 'secrets'
        },

        // === SQL INJECTION ===
        {
            id: 'SQL001',
            name: 'SQL Injection - String Concatenation',
            pattern: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+.{0,50}\+\s*(?:\w+|\$\{|\`)/gi,
            severity: 'HIGH',
            message: 'Potential SQL injection via string concatenation. Use parameterized queries.',
            category: 'sql-injection'
        },
        {
            id: 'SQL002',
            name: 'SQL Injection - Template Literal',
            pattern: /(?:query|execute|sql)\s*\(\s*`[^`]*\$\{/gi,
            severity: 'HIGH',
            message: 'Potential SQL injection via template literal. Use parameterized queries.',
            category: 'sql-injection'
        },
        {
            id: 'SQL003',
            name: 'SQL Injection - f-string (Python)',
            pattern: /(?:execute|cursor\.execute)\s*\(\s*f["']/gi,
            severity: 'HIGH',
            message: 'Potential SQL injection via f-string. Use parameterized queries.',
            category: 'sql-injection',
            languages: ['.py']
        },

        // === XSS PREVENTION ===
        {
            id: 'XSS001',
            name: 'Dangerous innerHTML',
            pattern: /\.innerHTML\s*=\s*(?!["'`]<)/g,
            severity: 'HIGH',
            message: 'Direct innerHTML assignment can lead to XSS. Use textContent or sanitize input.',
            category: 'xss'
        },
        {
            id: 'XSS002',
            name: 'Dangerous document.write',
            pattern: /document\.write\s*\(/g,
            severity: 'MEDIUM',
            message: 'document.write() can lead to XSS vulnerabilities. Use safer DOM methods.',
            category: 'xss'
        },
        {
            id: 'XSS003',
            name: 'Dangerous eval()',
            pattern: /\beval\s*\([^)]*\)/g,
            severity: 'HIGH',
            message: 'eval() executes arbitrary code and is a security risk. Avoid using eval().',
            category: 'xss'
        },
        {
            id: 'XSS004',
            name: 'dangerouslySetInnerHTML (React)',
            pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html/g,
            severity: 'MEDIUM',
            message: 'dangerouslySetInnerHTML can lead to XSS if input is not sanitized.',
            category: 'xss',
            languages: ['.tsx', '.jsx']
        },

        // === GDPR & PII ===
        {
            id: 'PII001',
            name: 'Email Logging',
            pattern: /(?:console\.log|logger?\.|print)\s*\([^)]*(?:email|e-mail)[^)]*\)/gi,
            severity: 'MEDIUM',
            message: 'Logging email addresses may violate GDPR. Avoid logging PII.',
            category: 'gdpr-pii'
        },
        {
            id: 'PII002',
            name: 'SSN Pattern',
            pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
            severity: 'HIGH',
            message: 'Potential SSN detected. Ensure PII is properly protected.',
            category: 'gdpr-pii'
        },
        {
            id: 'PII003',
            name: 'Credit Card Number',
            pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g,
            severity: 'HIGH',
            message: 'Potential credit card number detected. Never store card numbers in code.',
            category: 'gdpr-pii'
        },

        // === ERROR HANDLING ===
        {
            id: 'ERR001',
            name: 'Empty Catch Block',
            pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
            severity: 'MEDIUM',
            message: 'Empty catch block swallows errors. Log or handle the exception.',
            category: 'error-handling'
        },
        {
            id: 'ERR002',
            name: 'Console.log in Production',
            pattern: /console\.(log|debug|info)\s*\(/g,
            severity: 'LOW',
            message: 'Console logging should be removed or use a proper logging framework.',
            category: 'best-practices'
        },

        // === SECURITY BEST PRACTICES ===
        {
            id: 'SEC007',
            name: 'Insecure HTTP URL',
            pattern: /["'`]http:\/\/(?!localhost|127\.0\.0\.1)/g,
            severity: 'MEDIUM',
            message: 'Using HTTP instead of HTTPS. Use HTTPS for secure communication.',
            category: 'security'
        },
        {
            id: 'SEC008',
            name: 'Weak Crypto Algorithm',
            pattern: /(?:md5|sha1)\s*\(/gi,
            severity: 'MEDIUM',
            message: 'MD5/SHA1 are weak cryptographic algorithms. Use SHA-256 or better.',
            category: 'security'
        },
        {
            id: 'SEC009',
            name: 'Disabled SSL Verification',
            pattern: /(?:verify\s*=\s*False|rejectUnauthorized\s*:\s*false|InsecureSkipVerify\s*:\s*true)/gi,
            severity: 'HIGH',
            message: 'SSL certificate verification is disabled. This allows MITM attacks.',
            category: 'security'
        },
        {
            id: 'SEC010',
            name: 'Hardcoded IP Address',
            pattern: /["'`]\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}["'`]/g,
            severity: 'LOW',
            message: 'Hardcoded IP address. Consider using configuration or DNS.',
            category: 'best-practices'
        },

        // === COMMAND INJECTION ===
        {
            id: 'CMD001',
            name: 'Command Injection Risk',
            pattern: /(?:exec|spawn|system|popen|subprocess\.call)\s*\([^)]*\+/gi,
            severity: 'HIGH',
            message: 'Potential command injection via string concatenation. Sanitize input.',
            category: 'injection'
        },
        {
            id: 'CMD002',
            name: 'Shell=True Risk (Python)',
            pattern: /subprocess\.[^(]+\([^)]*shell\s*=\s*True/gi,
            severity: 'HIGH',
            message: 'Using shell=True with subprocess can lead to command injection.',
            category: 'injection',
            languages: ['.py']
        },

        // === PATH TRAVERSAL ===
        {
            id: 'PATH001',
            name: 'Path Traversal Risk',
            pattern: /(?:readFile|writeFile|open|fs\.)\s*\([^)]*\+/gi,
            severity: 'MEDIUM',
            message: 'File path constructed from user input may allow path traversal.',
            category: 'injection'
        }
    ];

    scan(code: string, fileName: string): Finding[] {
        const findings: Finding[] = [];
        const fileExt = '.' + fileName.split('.').pop()?.toLowerCase();

        for (const rule of this.rules) {
            // Skip rules not applicable to this file type
            if (rule.languages && !rule.languages.includes(fileExt)) {
                continue;
            }

            // Reset regex state
            rule.pattern.lastIndex = 0;
            
            let match;
            while ((match = rule.pattern.exec(code)) !== null) {
                findings.push({
                    ruleId: rule.id,
                    message: `[${rule.id}] ${rule.message}`,
                    severity: rule.severity,
                    startOffset: match.index,
                    endOffset: match.index + match[0].length,
                    category: rule.category
                });
            }
        }

        return findings;
    }
}
