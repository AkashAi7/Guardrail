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
exports.extractTextFromFile = extractTextFromFile;
exports.importRulesFromFile = importRulesFromFile;
exports.getSupportedExtensions = getSupportedExtensions;
exports.generateSampleTextRules = generateSampleTextRules;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ruleParser_1 = require("./ruleParser");
const naturalLanguageParser_1 = require("./naturalLanguageParser");
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
 * Extract text from old Word 97-2003 .doc files (OLE Compound Binary)
 * Pure JS — no native deps. Scans for readable text runs, filters XML/metadata.
 */
function extractTextFromOleDoc(filePath) {
    const buf = fs.readFileSync(filePath);
    // Pass 1: Scan for UTF-16LE runs (every other byte = 0x00)
    const utf16Chunks = [];
    let i = 0;
    while (i < buf.length - 1) {
        if (buf[i + 1] === 0 && buf[i] >= 0x20 && buf[i] < 0x7F) {
            let run = '';
            while (i < buf.length - 1 &&
                buf[i + 1] === 0 &&
                (buf[i] >= 0x20 || buf[i] === 0x0D || buf[i] === 0x0A)) {
                if (buf[i] === 0x0D || buf[i] === 0x0A) {
                    run += '\n';
                }
                else {
                    run += String.fromCharCode(buf[i]);
                }
                i += 2;
            }
            const cleaned = run.trim();
            // Filter out XML/metadata blobs, keep prose-looking text
            if (cleaned.length > 8 && !cleaned.startsWith('<') && !cleaned.startsWith('{') && !cleaned.includes('xmlns')) {
                utf16Chunks.push(cleaned);
            }
        }
        else {
            i++;
        }
    }
    // Pass 2: Latin-1 printable runs as fallback
    const latin1Chunks = [];
    let j = 0;
    while (j < buf.length) {
        if (buf[j] >= 0x20 && buf[j] < 0x7F) {
            let run = '';
            while (j < buf.length && ((buf[j] >= 0x20 && buf[j] < 0x7F) || buf[j] === 0x0A || buf[j] === 0x0D)) {
                run += String.fromCharCode(buf[j]);
                j++;
            }
            const cleaned = run.trim();
            if (cleaned.length > 10 && !cleaned.startsWith('<') && !cleaned.startsWith('{') && !cleaned.includes('xmlns') && !cleaned.includes('<?xml')) {
                latin1Chunks.push(cleaned);
            }
        }
        else {
            j++;
        }
    }
    // Use whichever pass produced more content
    const primary = utf16Chunks.join('\n').trim();
    const secondary = latin1Chunks.join('\n').trim();
    const result = primary.length >= secondary.length ? primary : secondary;
    // Detect DRM/encryption: EncryptedPackage in OLE directory = content is locked
    const allText = (primary + ' ' + secondary).toLowerCase();
    if (allText.includes('encryptedpackage') || allText.includes('drmencrypted')) {
        throw new Error('This file is DRM/IRM-protected. The content is encrypted and cannot be read. ' +
            'Please open it in Word, remove protection (File → Info → Protect Document), ' +
            'save as .docx or export as .txt, then re-upload.');
    }
    if (result.trim().length < 100) {
        throw new Error('Could not extract readable text from this file. ' +
            'Please open it in Word and save as .docx or export as .txt, then re-upload.');
    }
    return result;
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
        const rules = (0, ruleParser_1.parseRulesFromMarkdown)(content);
        if (rules.length > 0)
            return rules;
    }
    // Try simple structured text format
    if (content.toLowerCase().includes('rule:') || content.toLowerCase().includes('pattern:')) {
        const rules = parseSimpleTextFormat(content);
        if (rules.length > 0)
            return rules;
    }
    // Fallback: Use natural language parsing (no format required!)
    return (0, naturalLanguageParser_1.parseNaturalLanguageRules)(content);
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
 * Extract text from a Word document.
 * - Modern .docx (ZIP/OOXML): uses mammoth
 * - Old .doc (OLE binary, Word 97-2003): uses pure-JS OLE scanner
 */
async function extractTextFromWord(filePath) {
    // Detect format by magic bytes
    const header = Buffer.allocUnsafe(4);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, header, 0, 4, 0);
    fs.closeSync(fd);
    const hex = header.toString('hex');
    if (hex === 'd0cf11e0') {
        // Old OLE binary .doc — extract with pure-JS scanner
        console.log('[Guardrail] Detected OLE binary .doc, using fallback extractor');
        return extractTextFromOleDoc(filePath);
    }
    if (!hex.startsWith('504b')) {
        // Unknown format — still try mammoth, let it give a clear error
        console.warn('[Guardrail] Unknown file header, attempting mammoth anyway');
    }
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
 * Extract raw text from any supported file format (no rule parsing)
 */
async function extractTextFromFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.md':
        case '.txt':
            return fs.readFileSync(filePath, 'utf8');
        case '.docx':
        case '.doc':
            return await extractTextFromWord(filePath);
        case '.pdf':
            return await extractTextFromPdf(filePath);
        default:
            throw new Error(`Unsupported file format: ${ext}. Supported: .md, .txt, .pdf, .docx`);
    }
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
        throw new Error('No rules found. Try including keywords like: "don\'t hardcode passwords", "avoid console.log", "no API keys", etc.');
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