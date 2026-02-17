/**
 * Base Provider Interface
 * All LLM providers (Copilot, OpenAI, Anthropic, etc.) must implement this interface
 */
export class BaseProvider {
    config;
    governanceRules = '';
    timeout = 10000;
    constructor(config) {
        this.config = config;
    }
    async cleanup() {
        // Default: no cleanup needed
    }
    setGovernanceRules(rules) {
        this.governanceRules = rules;
    }
    buildAnalysisPrompt(request) {
        return `Analyze the following ${request.language} code for security vulnerabilities, code quality issues, and compliance violations.

File: ${request.filePath}
Language: ${request.language}
${request.projectType ? `Project Type: ${request.projectType}` : ''}

Code:
\`\`\`${request.language}
${request.content}
\`\`\`

${request.changedLines ? `Focus on these changed lines: ${JSON.stringify(request.changedLines)}` : ''}

Return your analysis as a JSON object with this structure:
{
  "findings": [
    {
      "severity": "high" | "medium" | "low" | "info",
      "category": "security" | "quality" | "compliance" | "performance",
      "title": "Brief title",
      "description": "Detailed description",
      "line": line_number,
      "snippet": "code snippet",
      "explanation": "Why this is an issue",
      "suggestedFix": "How to fix it",
      "autoFixable": boolean
    }
  ],
  "summary": {
    "totalIssues": number,
    "high": number,
    "medium": number,
    "low": number,
    "info": number
  }
}`;
    }
    parseAnalysisResponse(response) {
        try {
            // Remove markdown code blocks if present
            let jsonText = response.trim();
            const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (codeBlockMatch) {
                jsonText = codeBlockMatch[1].trim();
            }
            const parsed = JSON.parse(jsonText);
            return {
                filePath: '',
                findings: parsed.findings || [],
                summary: parsed.summary || {
                    totalIssues: 0,
                    high: 0,
                    medium: 0,
                    low: 0,
                    info: 0
                },
                analysisTime: 0
            };
        }
        catch (error) {
            console.error('Failed to parse LLM response:', error);
            throw new Error('Invalid response format from LLM');
        }
    }
}
