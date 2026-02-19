import { CustomRuleConfig } from './scanner';

/**
 * Intelligent rule parser that extracts security rules from natural language text
 * No specific format required - just describe what you want to detect
 */

interface ExtractedIntent {
    name: string;
    pattern: string;
    message: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    category: string;
}

// Common security-related keywords and their patterns
const KEYWORD_PATTERNS: { [key: string]: { pattern: string; category: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' } } = {
    'password': { pattern: 'password\\s*[:=]\\s*["\'][^"\']+["\']', category: 'secrets', severity: 'HIGH' },
    'api key': { pattern: 'api[_-]?key\\s*[:=]\\s*["\'][^"\']+["\']', category: 'secrets', severity: 'HIGH' },
    'apikey': { pattern: 'api[_-]?key\\s*[:=]\\s*["\'][^"\']+["\']', category: 'secrets', severity: 'HIGH' },
    'secret': { pattern: 'secret\\s*[:=]\\s*["\'][^"\']+["\']', category: 'secrets', severity: 'HIGH' },
    'token': { pattern: 'token\\s*[:=]\\s*["\'][^"\']+["\']', category: 'secrets', severity: 'HIGH' },
    'credential': { pattern: '(?:credential|cred)\\s*[:=]\\s*["\'][^"\']+["\']', category: 'secrets', severity: 'HIGH' },
    'console.log': { pattern: 'console\\.log\\(', category: 'best-practices', severity: 'LOW' },
    'console log': { pattern: 'console\\.log\\(', category: 'best-practices', severity: 'LOW' },
    'debugger': { pattern: '\\bdebugger\\b', category: 'best-practices', severity: 'MEDIUM' },
    'eval': { pattern: '\\beval\\s*\\(', category: 'security', severity: 'HIGH' },
    'innerhtml': { pattern: '\\.innerHTML\\s*=', category: 'xss', severity: 'HIGH' },
    'inner html': { pattern: '\\.innerHTML\\s*=', category: 'xss', severity: 'HIGH' },
    'sql injection': { pattern: 'query\\s*\\([^)]*\\+', category: 'sql-injection', severity: 'HIGH' },
    'sql': { pattern: '(?:SELECT|INSERT|UPDATE|DELETE).*\\+', category: 'sql-injection', severity: 'HIGH' },
    'http://': { pattern: '["\']http://(?!localhost)', category: 'security', severity: 'MEDIUM' },
    'todo': { pattern: 'TODO', category: 'best-practices', severity: 'INFO' },
    'fixme': { pattern: 'FIXME', category: 'best-practices', severity: 'MEDIUM' },
    'hack': { pattern: '//\\s*HACK', category: 'best-practices', severity: 'MEDIUM' },
    'hardcode': { pattern: '(?:password|secret|key)\\s*[:=]\\s*["\']', category: 'secrets', severity: 'HIGH' },
    'hard code': { pattern: '(?:password|secret|key)\\s*[:=]\\s*["\']', category: 'secrets', severity: 'HIGH' },
    'hard-code': { pattern: '(?:password|secret|key)\\s*[:=]\\s*["\']', category: 'secrets', severity: 'HIGH' },
    'private key': { pattern: '-----BEGIN.*PRIVATE KEY-----', category: 'secrets', severity: 'HIGH' },
    'aws': { pattern: 'AKIA[0-9A-Z]{16}', category: 'secrets', severity: 'HIGH' },
    'connection string': { pattern: '(?:mongodb|mysql|postgres)://[^\\s]+', category: 'secrets', severity: 'HIGH' },
    'database url': { pattern: '(?:mongodb|mysql|postgres)://[^\\s]+', category: 'secrets', severity: 'HIGH' },
    'alert(': { pattern: '\\balert\\s*\\(', category: 'best-practices', severity: 'LOW' },
    'document.write': { pattern: 'document\\.write\\s*\\(', category: 'xss', severity: 'MEDIUM' },
    'ssl': { pattern: 'verify\\s*[=:]\\s*false', category: 'security', severity: 'HIGH' },
    'certificate': { pattern: 'rejectUnauthorized\\s*:\\s*false', category: 'security', severity: 'HIGH' },
};

// Action verbs that indicate a rule
const NEGATIVE_VERBS = [
    'don\'t', 'dont', 'do not', 'never', 'avoid', 'remove', 'delete',
    'prohibit', 'ban', 'block', 'prevent', 'disallow', 'forbid',
    'no ', 'stop', 'eliminate', 'flag', 'warn', 'detect', 'find',
    'catch', 'identify', 'alert', 'report', 'check for', 'look for',
    'scan for', 'search for', 'must not', 'should not', 'shouldn\'t',
    'cannot', 'can\'t'
];

// Severity indicators
const SEVERITY_INDICATORS: { [key: string]: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' } = {
    'critical': 'HIGH',
    'severe': 'HIGH',
    'high': 'HIGH',
    'important': 'HIGH',
    'dangerous': 'HIGH',
    'security': 'HIGH',
    'vulnerability': 'HIGH',
    'medium': 'MEDIUM',
    'moderate': 'MEDIUM',
    'warning': 'MEDIUM',
    'low': 'LOW',
    'minor': 'LOW',
    'info': 'INFO',
    'informational': 'INFO',
    'note': 'INFO',
    'suggestion': 'INFO',
    'hint': 'INFO'
};

/**
 * Parse rules from completely free-form natural language text
 */
export function parseNaturalLanguageRules(text: string): CustomRuleConfig[] {
    const rules: CustomRuleConfig[] = [];
    const seenPatterns = new Set<string>();
    
    // Normalize text
    const normalizedText = text.toLowerCase();
    
    // Split into sentences/lines
    const segments = text
        .split(/[.\n\r]/)
        .map(s => s.trim())
        .filter(s => s.length > 5);
    
    let ruleIndex = 1;
    
    for (const segment of segments) {
        const lowerSegment = segment.toLowerCase();
        
        // Check if this looks like a rule (contains negative verb or action word)
        const hasActionWord = NEGATIVE_VERBS.some(verb => lowerSegment.includes(verb));
        
        if (!hasActionWord && !lowerSegment.includes('rule') && !lowerSegment.includes('pattern')) {
            continue;
        }
        
        // Try to match known keywords
        for (const [keyword, config] of Object.entries(KEYWORD_PATTERNS)) {
            if (lowerSegment.includes(keyword) && !seenPatterns.has(config.pattern)) {
                seenPatterns.add(config.pattern);
                
                // Determine severity from context
                let severity = config.severity;
                for (const [indicator, sev] of Object.entries(SEVERITY_INDICATORS)) {
                    if (lowerSegment.includes(indicator)) {
                        severity = sev;
                        break;
                    }
                }
                
                // Create a nice rule name from the segment
                const name = createRuleName(segment, keyword);
                
                rules.push({
                    id: `NL${String(ruleIndex).padStart(3, '0')}`,
                    name,
                    pattern: config.pattern,
                    flags: 'gi',
                    severity,
                    message: cleanMessage(segment),
                    category: config.category,
                    enabled: true
                });
                
                ruleIndex++;
            }
        }
        
        // Try to extract custom patterns from the text
        // Look for quoted strings or backtick patterns
        const customPatterns = segment.match(/["`']([^"`']{3,})["`']/g);
        if (customPatterns) {
            for (const match of customPatterns) {
                const pattern = match.slice(1, -1);
                if (pattern.length >= 3 && !seenPatterns.has(pattern)) {
                    // Check if it looks like a regex or code pattern
                    if (looksLikePattern(pattern)) {
                        seenPatterns.add(pattern);
                        
                        let severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' = 'MEDIUM';
                        for (const [indicator, sev] of Object.entries(SEVERITY_INDICATORS)) {
                            if (lowerSegment.includes(indicator)) {
                                severity = sev;
                                break;
                            }
                        }
                        
                        rules.push({
                            id: `NL${String(ruleIndex).padStart(3, '0')}`,
                            name: `Custom: ${pattern.substring(0, 30)}`,
                            pattern: escapeRegexIfNeeded(pattern),
                            flags: 'gi',
                            severity,
                            message: cleanMessage(segment),
                            category: 'custom',
                            enabled: true
                        });
                        
                        ruleIndex++;
                    }
                }
            }
        }
    }
    
    // Also look for bullet points and numbered lists
    const listItems = text.match(/^[\s]*[-•*\d.]+\s+.+$/gm);
    if (listItems) {
        for (const item of listItems) {
            const cleanItem = item.replace(/^[\s]*[-•*\d.]+\s+/, '').trim();
            const lowerItem = cleanItem.toLowerCase();
            
            for (const [keyword, config] of Object.entries(KEYWORD_PATTERNS)) {
                if (lowerItem.includes(keyword) && !seenPatterns.has(config.pattern)) {
                    seenPatterns.add(config.pattern);
                    
                    rules.push({
                        id: `NL${String(ruleIndex).padStart(3, '0')}`,
                        name: createRuleName(cleanItem, keyword),
                        pattern: config.pattern,
                        flags: 'gi',
                        severity: config.severity,
                        message: cleanMessage(cleanItem),
                        category: config.category,
                        enabled: true
                    });
                    
                    ruleIndex++;
                }
            }
        }
    }
    
    return rules;
}

function createRuleName(segment: string, keyword: string): string {
    // Try to create a concise rule name
    const words = segment.split(/\s+/).slice(0, 6);
    let name = words.join(' ');
    
    if (name.length > 50) {
        name = name.substring(0, 47) + '...';
    }
    
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function cleanMessage(segment: string): string {
    // Remove leading action words and clean up
    let msg = segment
        .replace(/^(don't|dont|do not|never|avoid|remove|delete|no|stop)\s+/i, '')
        .trim();
    
    // Capitalize first letter
    msg = msg.charAt(0).toUpperCase() + msg.slice(1);
    
    // Ensure it ends with a period
    if (!msg.endsWith('.') && !msg.endsWith('!')) {
        msg += '.';
    }
    
    return msg;
}

function looksLikePattern(str: string): boolean {
    // Check if string looks like code or a pattern
    const codeIndicators = [
        /[(){}[\]]/, // Brackets
        /\w+\.\w+/, // Object.property
        /\w+\(/, // Function call
        /[=:;]/, // Assignment/statement
        /\\[dswDSW]/, // Regex classes
        /[*+?]/, // Regex quantifiers
        /\|/, // Regex alternation
    ];
    
    return codeIndicators.some(re => re.test(str));
}

function escapeRegexIfNeeded(str: string): string {
    // If it already looks like a regex, use as-is
    if (/[\\.*+?^${}()|[\]]/.test(str)) {
        return str;
    }
    // Otherwise, escape it for literal matching
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract document title/summary for imported rules
 */
export function extractDocumentTitle(text: string): string {
    const lines = text.split('\n').filter(l => l.trim());
    
    // Look for a title (first heading or first line)
    for (const line of lines.slice(0, 5)) {
        const cleaned = line.replace(/^[#\-=*]+\s*/, '').trim();
        if (cleaned.length > 3 && cleaned.length < 100) {
            return cleaned;
        }
    }
    
    return 'Imported Rules';
}
