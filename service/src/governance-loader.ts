import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
import { GovernanceRule } from './types/index.js';

export class GovernanceLoader {
  private rules: GovernanceRule[] = [];
  private systemPrompt: string = '';

  constructor(private governancePath: string) {}

  /**
   * Load all governance markdown files and build system prompt
   */
  async loadAll(): Promise<void> {
    console.log(`📚 Loading governance rules from: ${this.governancePath}`);

    if (!fs.existsSync(this.governancePath)) {
      console.warn(`⚠️  Governance path not found: ${this.governancePath}`);
      console.warn(`   Creating default governance structure...`);
      this.createDefaultGovernance();
    }

    // Find all markdown files
    const pattern = path.join(this.governancePath, '**/*.md').replace(/\\/g, '/');
    const files = await glob(pattern);

    console.log(`📄 Found ${files.length} governance files`);

    // Load each file
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const parsed = matter(content);
        
        const rule: GovernanceRule = {
          title: parsed.data.title || path.basename(file, '.md'),
          content: parsed.content,
          category: this.getCategoryFromPath(file),
          filePath: file,
        };

        this.rules.push(rule);
        console.log(`  ✅ Loaded: ${rule.category}/${rule.title}`);
      } catch (error) {
        console.error(`  ❌ Failed to load ${file}:`, error);
      }
    }

    // Build system prompt
    this.buildSystemPrompt();

    console.log(`✅ Loaded ${this.rules.length} governance rules`);
  }

  /**
   * Build comprehensive system prompt from all rules
   */
  private buildSystemPrompt(): void {
    let prompt = '# Code Guardrail Agent - Governance Instructions\n\n';
    prompt += 'You are an expert Code Security and Compliance Assistant.\n\n';
    prompt += 'Your role is to analyze code for security vulnerabilities, compliance violations, ';
    prompt += 'and best practice deviations.\n\n';
    prompt += '---\n\n';

    // Group rules by category
    const categories = new Map<string, GovernanceRule[]>();
    
    for (const rule of this.rules) {
      if (!categories.has(rule.category)) {
        categories.set(rule.category, []);
      }
      categories.get(rule.category)!.push(rule);
    }

    // Add each category
    for (const [category, categoryRules] of categories.entries()) {
      prompt += `\n## ${category.toUpperCase()} RULES\n\n`;
      
      for (const rule of categoryRules) {
        prompt += `### ${rule.title}\n\n`;
        prompt += rule.content;
        prompt += '\n\n---\n\n';
      }
    }

    // Add response format instructions
    prompt += this.getResponseFormatInstructions();

    this.systemPrompt = prompt;
  }

  /**
   * Get response format instructions
   */
  private getResponseFormatInstructions(): string {
    return `
## RESPONSE FORMAT

**CRITICAL:** You must ALWAYS respond with valid JSON in this exact format:

\`\`\`json
{
  "findings": [
    {
      "id": "auto-generated-unique-id",
      "severity": "HIGH|MEDIUM|LOW|INFO",
      "category": "Security|Compliance|BestPractice|Performance",
      "title": "Brief issue title",
      "description": "What's wrong (1-2 sentences)",
      "line": 42,
      "column": 10,
      "snippet": "const apiKey = \\"sk-123\\"",
      "complianceRefs": ["GDPR Article 32", "SOC2 CC6.1"],
      "explanation": "Detailed explanation of why this matters...",
      "suggestedFix": "const apiKey = process.env.API_KEY;",
      "autoFixable": true,
      "references": [
        {
          "title": "OWASP Guide",
          "url": "https://owasp.org/..."
        }
      ]
    }
  ],
  "summary": {
    "totalIssues": 3,
    "high": 1,
    "medium": 1,
    "low": 1,
    "info": 0
  }
}
\`\`\`

**Rules for your analysis:**
1. Be specific - include exact line numbers and code snippets
2. Be educational - explain WHY issues matter
3. Be actionable - provide working code fixes
4. Be accurate - avoid false positives
5. Cite compliance - reference specific regulations when applicable
6. Consider context - understand framework patterns and idioms

**NEVER:**
- Return non-JSON responses
- Flag test files with same severity as production code
- Miss critical security issues
- Provide vague or generic advice
`;
  }

  /**
   * Get category from file path
   */
  private getCategoryFromPath(filePath: string): string {
    const relativePath = path.relative(this.governancePath, filePath);
    const parts = relativePath.split(path.sep);
    
    if (parts.length > 1) {
      return parts[0];
    }
    
    return 'general';
  }

  /**
   * Create default governance structure
   */
  private createDefaultGovernance(): void {
    const dirs = [
      'security',
      'compliance',
      'best-practices',
      'performance',
    ];

    dirs.forEach(dir => {
      const dirPath = path.join(this.governancePath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    console.log(`✅ Created default governance structure`);
  }

  /**
   * Get the complete system prompt
   */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  /**
   * Get all loaded rules
   */
  getRules(): GovernanceRule[] {
    return this.rules;
  }

  /**
   * Reload governance rules
   */
  async reload(): Promise<void> {
    this.rules = [];
    this.systemPrompt = '';
    await this.loadAll();
  }
}
