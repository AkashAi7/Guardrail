# Compliance Document Upload Feature - Quick Start Guide

## Overview

The Code Guardrail extension now supports uploading custom compliance documents (GDPR, HIPAA, PCI-DSS, SOC2, ISO-27001, or custom frameworks). Once uploaded, the AI will analyze your code against these specific compliance requirements and cite violations with document references.

## ✅ What's New

### 1. **Upload Compliance Documents**
Upload PDF, Markdown, or text files containing compliance requirements. The AI will use these as context when analyzing your code.

### 2. **Compliance-Aware Analysis**
Findings now include:
- `complianceReference`: Citation to specific document sections
- `riskLevel`: Risk assessment (critical/high/medium/low)  
- `complianceImpact`: Array of impacted compliance areas

### 3. **Three New Commands**
```
Code Guardrail: Upload Compliance Document
Code Guardrail: View Uploaded Compliance Documents
Code Guardrail: Clear All Compliance Documents
```

## 🚀 Quick Start

### Step 1: Start the Service
The AI service must be running. If not already started:
- Open VS Code with the Code Guardrail extension
- The service starts automatically on activation
- Look for: `✅ Guardrail AI service started successfully!`

### Step 2: Upload a Compliance Document

1. **Open Command Palette**: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)

2. **Select Command**: Type and select:
   ```
   Code Guardrail: Upload Compliance Document
   ```

3. **Choose Framework Type**:
   - GDPR (General Data Protection Regulation)
   - HIPAA (Health Insurance Portability and Accountability Act)
   - PCI-DSS (Payment Card Industry Data Security Standard)
   - SOC2 (Service Organization Control 2)
   - ISO-27001 (Information Security Management)
   - Custom (Your own compliance framework)

4. **Select Document File**:
   - Supported formats: `.md`, `.txt`, `.pdf`
   - Example: `sample-gdpr-requirements.md`

5. **Enter Document Name**:
   - Give it a descriptive name
   - Example: "GDPR Article 32 Security Requirements"

6. **Wait for Upload**:
   ```
   ✅ Uploaded compliance document: GDPR Article 32 Security Requirements (GDPR)
   ```

### Step 3: Analyze Code with Compliance Context

Once uploaded, the AI automatically includes compliance context in all code analysis:

1. **Open a code file** (e.g., `test-auth-violations.ts`)
2. **The AI analyzes automatically** or use:
   ```
   Code Guardrail: Analyze Current File
   ```
3. **View compliance-aware findings** with specific document citations

## 📋 Try It Now

### Demo Files Included

**1. Sample Compliance Document**:
```
test-files/sample-gdpr-requirements.md
```
Contains GDPR Article 32 security requirements with code examples.

**2. Sample Code with Violations**:
```
test-files/test-auth-violations.ts
```
Contains intentional GDPR violations for testing:
- Plaintext password storage
- SQL injection vulnerabilities
- Hardcoded credentials
- No encryption
- Excessive PII logging
- Missing authorization checks
- No audit logging

### Complete Demo Workflow

```bash
# 1. Upload the sample GDPR document
Command Palette → "Upload Compliance Document"
→ Select: GDPR
→ Pick File: test-files/sample-gdpr-requirements.md
→ Name: "GDPR Security Requirements"
✅ Document uploaded!

# 2. Open the test file with violations
File → Open: test-files/test-auth-violations.ts

# 3. Analyze (automatic or manual)
Command Palette → "Analyze Current File"

# 4. View findings with compliance citations
Look for diagnostics with:
- Specific GDPR Article references
- Risk levels (critical/high/medium/low)
- Compliance impact areas
```

## 📊 View Uploaded Documents

To see what compliance documents are currently loaded:

```
Command Palette → Code Guardrail: View Uploaded Compliance Documents
```

Shows list with:
- Document name
- Framework type (GDPR, HIPAA, etc.)
- Upload status

## 🧹 Clear All Documents

To remove all uploaded compliance documents and return to default analysis:

```
Command Palette → Code Guardrail: Clear All Compliance Documents
```

Confirms before clearing:
```
⚠️ Clear all 1 compliance document(s)? 
   This will remove the compliance context from analysis.
```

After clearing, code analysis returns to default security scanning without compliance-specific checks.

## 🔧 Architecture

### Backend Service Changes
**New API Endpoints**:
- `POST /upload-compliance` - Upload document with metadata
- `GET /compliance-documents` - List uploaded documents  
- `DELETE /compliance-documents` - Clear all documents

**Agent Enhancements**:
- Compliance context stored in memory (`Map<string, string>`)
- System prompt dynamically rebuilt with uploaded docs
- Enhanced analysis prompts cite specific document sections
- Findings enriched with compliance metadata

### Extension Changes
**New Commands**:
- `codeGuardrail.uploadComplianceDocument` - File picker + type selector
- `codeGuardrail.viewComplianceDocuments` - Quick pick list
- `codeGuardrail.clearComplianceDocuments` - Confirmation dialog

**Enhanced Service Manager**:
- Support for raw body uploads (Buffer)
- Query parameter support
- Flexible options-based API

## 📝 Expected Analysis Output

### Without Compliance Document:
```typescript
// Standard security finding
🤖 Hardcoded credentials detected
Severity: High
Location: line 12
```

### With GDPR Compliance Document:
```typescript
// Compliance-aware finding
🤖 GDPR Violation: Hardcoded credentials (Article 32.1.b)
Severity: Critical
Compliance Reference: GDPR Article 32.1.b - Access Control
Risk Level: Critical
Compliance Impact: 
  - Data Security (Article 32)
  - Access Control Requirements
  - Authentication Standards
Location: line 12

Violation details: Hardcoded password 'SuperSecret123!' violates 
GDPR Article 32.1.b requirement for secure credential management.
This creates unauthorized access risk to personal data.

Remediation: Store credentials in environment variables or 
secure credential management system (e.g., Azure Key Vault, AWS 
Secrets Manager).
```

## 🎯 Supported File Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| Markdown | `.md` | Preferred format, supports rich formatting |
| Plain Text | `.txt` | Simple text compliance documents |
| PDF | `.pdf` | Requires pdf-parse dependency (already included) |

## ⚙️ Token Limit Management

Large compliance documents are automatically truncated to 2000 characters to manage token limits. The system prioritizes:
1. Document headers and section titles
2. Requirement definitions
3. Code implications
4. Violation examples

For best results:
- Keep documents focused and relevant
- Use clear section headers
- Include code examples of violations and compliance

## 🐛 Troubleshooting

### "AI service is not running"
**Problem**: Commands fail with service error
**Solution**: 
```
Command Palette → Code Guardrail: Show Menu → Retry Starting Service
```

### Document upload fails
**Problem**: Upload returns error
**Solution**:
1. Check file format (PDF/TXT/MD only)
2. Verify file is not corrupted
3. Check file size (< 10MB recommended)
4. Ensure service is running

### Analysis doesn't cite compliance document
**Problem**: Findings don't include compliance references
**Solution**:
1. Verify document uploaded: `View Uploaded Compliance Documents`
2. Re-analyze file: `Analyze Current File`
3. Check document content is relevant to code violations
4. Try more specific compliance requirements

### Memory issues with multiple documents
**Problem**: Service becomes slow with many documents
**Solution**:
1. Clear unused documents: `Clear All Compliance Documents`
2. Upload only currently relevant frameworks
3. Keep documents focused and concise

## 🔐 Security Notes

- Compliance documents are stored **in-memory only** (not persisted to disk)
- Documents are cleared when service restarts
- Content is never sent outside your local environment
- All analysis happens locally via GitHub Copilot SDK

## 📚 Next Steps

1. **Create custom compliance documents** for your organization
2. **Upload multiple frameworks** for comprehensive analysis
3. **Integrate with CI/CD** using the service API endpoints
4. **Export findings** for compliance audit reports

## 🤝 Contributing

Found an issue or have suggestions for compliance features?
- Submit issues: [GitHub Issues](https://github.com/AkashAi7/Guardrail/issues)
- Contribute: See `CONTRIBUTING.md`

---

**Built with GitHub Copilot SDK** | **Version 0.7.0** | **February 2026**
