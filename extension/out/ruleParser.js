"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRulesFromMarkdown = parseRulesFromMarkdown;
exports.loadRulesFromFolder = loadRulesFromFolder;
exports.generateSampleRulesMarkdown = generateSampleRulesMarkdown;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Parses rules from various file formats (.md, .txt)
 *
 * Supported Markdown format:
 *
 * ## Rule Name
 * - Severity: HIGH | MEDIUM | LOW | INFO
 * - Pattern: `your-regex-pattern`
 * - Message: Description of the issue
 * - Category: category-name
 * - Languages: .ts, .js, .py (optional)
 */
function parseRulesFromMarkdown(content) {
    const rules = [];
    // Split by rule headers (## )
    const sections = content.split(/^##\s+/m).filter(s => s.trim());
    let ruleIndex = 1;
    for (const section of sections) {
        const lines = section.split('\n');
        const name = lines[0]?.trim();
        if (!name)
            continue;
        let severity = 'MEDIUM';
        let pattern = '';
        let message = '';
        let category = 'custom';
        let languages;
        for (const line of lines.slice(1)) {
            const trimmed = line.trim();
            // Parse: - Severity: HIGH
            const severityMatch = trimmed.match(/^-?\s*\*?\*?Severity\*?\*?:\s*(\w+)/i);
            if (severityMatch) {
                const sev = severityMatch[1].toUpperCase();
                if (['HIGH', 'MEDIUM', 'LOW', 'INFO'].includes(sev)) {
                    severity = sev;
                }
                continue;
            }
            // Parse: - Pattern: `regex` or - Pattern: regex
            const patternMatch = trimmed.match(/^-?\s*\*?\*?Pattern\*?\*?:\s*`?([^`]+)`?/i);
            if (patternMatch) {
                pattern = patternMatch[1].trim();
                continue;
            }
            // Parse: - Message: description
            const messageMatch = trimmed.match(/^-?\s*\*?\*?Message\*?\*?:\s*(.+)/i);
            if (messageMatch) {
                message = messageMatch[1].trim();
                continue;
            }
            // Parse: - Category: name
            const categoryMatch = trimmed.match(/^-?\s*\*?\*?Category\*?\*?:\s*(\S+)/i);
            if (categoryMatch) {
                category = categoryMatch[1].trim().toLowerCase();
                continue;
            }
            // Parse: - Languages: .ts, .js, .py
            const langMatch = trimmed.match(/^-?\s*\*?\*?Languages?\*?\*?:\s*(.+)/i);
            if (langMatch) {
                languages = langMatch[1].split(',').map(l => {
                    let ext = l.trim().toLowerCase();
                    if (!ext.startsWith('.'))
                        ext = '.' + ext;
                    return ext;
                });
                continue;
            }
        }
        // Only add if we have a valid pattern
        if (pattern) {
            rules.push({
                id: `CUSTOM${String(ruleIndex).padStart(3, '0')}`,
                name,
                pattern,
                flags: 'gi',
                severity,
                message: message || `${name} detected`,
                category,
                languages,
                enabled: true
            });
            ruleIndex++;
        }
    }
    return rules;
}
/**
 * Loads rules from a folder containing .md files
 */
function loadRulesFromFolder(folderPath) {
    const rules = [];
    if (!fs.existsSync(folderPath)) {
        return rules;
    }
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile() && file.endsWith('.md')) {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileRules = parseRulesFromMarkdown(content);
            // Prefix rule IDs with filename to avoid collisions
            const prefix = path.basename(file, '.md').toUpperCase().replace(/[^A-Z0-9]/g, '');
            fileRules.forEach((rule, idx) => {
                rule.id = `${prefix}${String(idx + 1).padStart(3, '0')}`;
            });
            rules.push(...fileRules);
        }
    }
    return rules;
}
/**
 * Generates a sample markdown rules file
 */
function generateSampleRulesMarkdown() {
    return `# Custom Guardrail Rules

Write your own security rules in simple markdown format!

---

## No Console Logs
- Severity: LOW
- Pattern: \`console\\.log\\(\`
- Message: Remove console.log statements before production
- Category: best-practices
- Languages: .ts, .js, .tsx, .jsx

## Hardcoded Database URL
- Severity: HIGH
- Pattern: \`mongodb://[^\\s]+\`
- Message: Database connection strings should use environment variables
- Category: secrets

## TODO Security Comment
- Severity: MEDIUM
- Pattern: \`TODO.*(?:security|auth|password|secret)\`
- Message: Security-related TODO found - please address before deployment
- Category: security

## Disabled ESLint Rule
- Severity: LOW
- Pattern: \`eslint-disable\`
- Message: ESLint rule disabled - ensure this is intentional
- Category: best-practices
- Languages: .ts, .js

---

## How to Write Rules

Each rule needs:
- **## Rule Name** - The heading becomes the rule name
- **Severity**: HIGH, MEDIUM, LOW, or INFO
- **Pattern**: A regex pattern (use backticks for special characters)
- **Message**: What to tell the developer
- **Category**: Group name for filtering
- **Languages**: (optional) Limit to specific file types (.ts, .py, etc.)

`;
}
//# sourceMappingURL=ruleParser.js.map