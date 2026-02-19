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
exports.parseRulesFromText = parseRulesFromText;
exports.importRulesFromFile = importRulesFromFile;
exports.getSupportedExtensions = getSupportedExtensions;
exports.generateSampleTextRules = generateSampleTextRules;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ruleParser_1 = require("./ruleParser");
/**
 * Import rules from various file formats
 * Supported: .md, .txt, .pdf, .doc, .docx
 */
// Dynamic imports for optional dependencies
let mammoth;
let pdfParse;
async function loadMammoth() {
    if (!mammoth) {
        try {
            mammoth = require('mammoth');
        }
        catch {
            throw new Error('Word document support not available');
        }
    }
    return mammoth;
}
async function loadPdfParse() {
    if (!pdfParse) {
        try {
            pdfParse = require('pdf-parse');
        }
        catch {
            throw new Error('PDF support not available');
        }
    }
    return pdfParse;
}
/**
 * Parse rules from plain text format
 * Supports multiple formats:
 *
 * Format 1 (Simple):
 * RULE: Rule Name
 * SEVERITY: HIGH
 * PATTERN: regex-pattern
 * MESSAGE: Description
 * CATEGORY: category-name
 * ---
 *
 * Format 2 (Markdown-style):
 * ## Rule Name
 * - Severity: HIGH
 * - Pattern: `regex`
 * - Message: Description
 */
function parseRulesFromText(content) {
    // Try markdown format first
    if (content.includes('## ') || content.includes('- Severity:') || content.includes('- Pattern:')) {
        return (0, ruleParser_1.parseRulesFromMarkdown)(content);
    }
    // Try simple text format
    return parseSimpleTextFormat(content);
}
function parseSimpleTextFormat(content) {
    const rules = [];
    // Split by rule separator (---, blank lines, or RULE:)
    const sections = content.split(/(?:^|\n)(?:---+|\n{2,}|(?=RULE:))/i).filter(s => s.trim());
    let ruleIndex = 1;
    for (const section of sections) {
        const lines = section.split('\n');
        let name = '';
        let severity = 'MEDIUM';
        let pattern = '';
        let message = '';
        let category = 'custom';
        let languages;
        for (const line of lines) {
            const trimmed = line.trim();
            // RULE: Name or Rule: Name
            const ruleMatch = trimmed.match(/^RULE\s*:\s*(.+)/i);
            if (ruleMatch) {
                name = ruleMatch[1].trim();
                continue;
            }
            // SEVERITY: HIGH
            const sevMatch = trimmed.match(/^SEVERITY\s*:\s*(\w+)/i);
            if (sevMatch) {
                const sev = sevMatch[1].toUpperCase();
                if (['HIGH', 'MEDIUM', 'LOW', 'INFO'].includes(sev)) {
                    severity = sev;
                }
                continue;
            }
            // PATTERN: regex
            const patMatch = trimmed.match(/^PATTERN\s*:\s*(.+)/i);
            if (patMatch) {
                pattern = patMatch[1].trim();
                // Remove surrounding quotes or backticks
                pattern = pattern.replace(/^["'`]|["'`]$/g, '');
                continue;
            }
            // MESSAGE: description
            const msgMatch = trimmed.match(/^MESSAGE\s*:\s*(.+)/i);
            if (msgMatch) {
                message = msgMatch[1].trim();
                continue;
            }
            // CATEGORY: name
            const catMatch = trimmed.match(/^CATEGORY\s*:\s*(\S+)/i);
            if (catMatch) {
                category = catMatch[1].trim().toLowerCase();
                continue;
            }
            // LANGUAGES: .ts, .js
            const langMatch = trimmed.match(/^LANGUAGES?\s*:\s*(.+)/i);
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
        if (name && pattern) {
            rules.push({
                id: `IMP${String(ruleIndex).padStart(3, '0')}`,
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
 * Extract text from a Word document (.docx)
 */
async function extractTextFromWord(filePath) {
    const mammothLib = await loadMammoth();
    const buffer = fs.readFileSync(filePath);
    const result = await mammothLib.extractRawText({ buffer });
    return result.value;
}
/**
 * Extract text from a PDF document
 */
async function extractTextFromPdf(filePath) {
    const pdfParseLib = await loadPdfParse();
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParseLib(buffer);
    return data.text;
}
/**
 * Import rules from any supported file format
 */
async function importRulesFromFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    let content;
    switch (ext) {
        case '.md':
        case '.txt':
            content = fs.readFileSync(filePath, 'utf8');
            break;
        case '.docx':
        case '.doc':
            content = await extractTextFromWord(filePath);
            break;
        case '.pdf':
            content = await extractTextFromPdf(filePath);
            break;
        default:
            throw new Error(`Unsupported file format: ${ext}. Supported: .md, .txt, .pdf, .docx`);
    }
    const rules = parseRulesFromText(content);
    if (rules.length === 0) {
        throw new Error('No valid rules found in the file. Make sure the file follows the expected format.');
    }
    return rules;
}
/**
 * Get supported file extensions for the file picker
 */
function getSupportedExtensions() {
    return {
        'Rule Files': ['md', 'txt', 'pdf', 'docx', 'doc'],
        'Markdown': ['md'],
        'Text': ['txt'],
        'PDF': ['pdf'],
        'Word': ['docx', 'doc']
    };
}
/**
 * Generate a sample rules document in simple text format
 */
function generateSampleTextRules() {
    return `# Security Rules for Code Guardrail

Copy this template to create your own rules.
Save as .txt, .md, .pdf, or .docx - all formats work!

---

RULE: No Hardcoded Passwords
SEVERITY: HIGH
PATTERN: password\\s*=\\s*["'][^"']+["']
MESSAGE: Never hardcode passwords. Use environment variables or a secrets manager.
CATEGORY: secrets

---

RULE: No Console Logs in Production
SEVERITY: LOW
PATTERN: console\\.log\\(
MESSAGE: Remove console.log statements before deploying to production.
CATEGORY: best-practices
LANGUAGES: .ts, .js, .tsx, .jsx

---

RULE: SQL Injection Risk
SEVERITY: HIGH
PATTERN: query\\s*\\(\\s*["'\`].*\\$\\{
MESSAGE: Potential SQL injection. Use parameterized queries instead.
CATEGORY: security

---

RULE: TODO Security Comments
SEVERITY: MEDIUM
PATTERN: TODO.*(?:security|auth|password|secret|token)
MESSAGE: Security-related TODO found. Address before deployment.
CATEGORY: security

---

# How to Write Your Own Rules:

RULE: Your Rule Name Here
SEVERITY: HIGH | MEDIUM | LOW | INFO
PATTERN: your-regex-pattern-here
MESSAGE: What you want developers to see
CATEGORY: your-category-name
LANGUAGES: .ts, .js (optional - limit to specific file types)

---

Tip: You can also use Markdown format with ## headers!
`;
}
//# sourceMappingURL=fileImporter.js.map