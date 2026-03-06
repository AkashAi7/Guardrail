import express, { Request, Response } from 'express';
import cors from 'cors';
import { HybridGuardrailAgent } from './agent-hybrid.js';
import { AnalysisRequest } from './types/index.js';
import config from './config.js';

export class GuardrailServer {
  private app: express.Application;
  private agent: HybridGuardrailAgent;

  constructor() {
    this.app = express();
    this.agent = new HybridGuardrailAgent(
      config.governancePath,
      config.providerConfig
    );
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: `${config.maxFileSize}b` }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    // Error handling
    this.app.use((err: Error, req: Request, res: Response, next: Function) => {
      console.error('Server error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message,
      });
    });
  }

  private setupRoutes(): void {
    // Root endpoint - API documentation
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Code Guardrail API',
        version: '2.0.0',
        description: 'Real-time code analysis with hybrid provider support (Copilot + BYOK)',
        endpoints: {
          'GET /': 'This help message',
          'GET /health': 'Service health check',
          'GET /info': 'Service configuration and status',
          'GET /provider': 'Current LLM provider information',
          'POST /analyze': 'Analyze a single file',
          'POST /analyze-batch': 'Analyze multiple files',
          'POST /reload-governance': 'Reload governance rules',
          'POST /upload-compliance': 'Upload compliance document (query params: documentName, type)',
          'GET /compliance-documents': 'List uploaded compliance documents',
          'DELETE /compliance-documents': 'Clear all uploaded documents'
        },
        examples: {
          analyze: {
            url: 'POST http://localhost:3000/analyze',
            body: {
              filePath: 'example.ts',
              content: 'const apiKey = "hardcoded-secret";',
              language: 'typescript'
            }
          },
          uploadCompliance: {
            url: 'POST http://localhost:3000/upload-compliance?documentName=GDPR%20Article%2025&type=gdpr',
            headers: {
              'Content-Type': 'text/plain'
            },
            body: 'Your compliance document text here...'
          }
        },
        documentation: 'https://github.com/AkashAi7/Guardrail',
        status: 'running'
      });
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        service: 'guardrail-service',
        version: '1.0.0',
        uptime: process.uptime(),
      });
    });

    // Service info
    this.app.get('/info', async (req, res) => {
      const providerInfo = await this.agent.getProviderInfo();
      res.json({
        service: 'Guardrail Service',
        version: '2.0.0',
        config: {
          governancePath: config.governancePath,
          providerMode: config.providerConfig.mode,
        },
        provider: providerInfo
      });
    });

    // Provider info endpoint
    this.app.get('/provider', async (req, res) => {
      try {
        const providerInfo = await this.agent.getProviderInfo();
        if (!providerInfo) {
          return res.status(503).json({
            error: 'Provider not initialized'
          });
        }
        res.json(providerInfo);
      } catch (error: any) {
        res.status(500).json({
          error: error.message
        });
      }
    });

    // Main analysis endpoint
    this.app.post('/analyze', async (req: Request, res: Response) => {
      try {
        const request: AnalysisRequest = req.body;

        // Validate request
        if (!request.filePath || !request.content || !request.language) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['filePath', 'content', 'language'],
          });
        }

        // Check file size
        if (request.content.length > config.maxFileSize) {
          return res.status(413).json({
            error: 'File too large',
            maxSize: config.maxFileSize,
            actualSize: request.content.length,
          });
        }

        // Perform analysis
        const result = await this.agent.analyzeCode(request);

        res.json({
          success: true,
          result,
        });
      } catch (error: any) {
        console.error('Analysis error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Batch analysis endpoint
    this.app.post('/analyze-batch', async (req: Request, res: Response) => {
      try {
        const requests: AnalysisRequest[] = req.body.files;

        if (!Array.isArray(requests)) {
          return res.status(400).json({
            error: 'Expected array of files',
          });
        }

        // Analyze all files in parallel
        const results = await Promise.all(
          requests.map(request => this.agent.analyzeCode(request))
        );

        res.json({
          success: true,
          results,
        });
      } catch (error: any) {
        console.error('Batch analysis error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Reload governance rules
    this.app.post('/reload-governance', async (req: Request, res: Response) => {
      try {
        await this.agent.reloadGovernance();
        res.json({
          success: true,
          message: 'Governance rules reloaded',
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Upload compliance document endpoint
    this.app.post('/upload-compliance', express.raw({ type: '*/*', limit: '10mb' }), async (req: Request, res: Response) => {
      try {
        const documentName = req.query.documentName as string;
        const type = req.query.type as 'gdpr' | 'hipaa' | 'pci-dss' | 'soc2' | 'custom';
        
        if (!documentName || !type) {
          return res.status(400).json({ 
            error: 'Missing documentName or type query parameters',
            example: '/upload-compliance?documentName=MyDoc&type=gdpr'
          });
        }

        // Get content from request body
        const content = req.body.toString('utf-8');
        
        if (!content || content.length === 0) {
          return res.status(400).json({ error: 'Empty document content' });
        }

        // Upload to agent
        await this.agent.uploadComplianceDocument(documentName, content, type);

        res.json({
          success: true,
          message: `Document ${documentName} uploaded successfully`,
          documentSize: content.length,
        });

      } catch (error: any) {
        console.error('Upload failed:', error);
        res.status(500).json({ 
          success: false,
          error: 'Failed to upload document',
          details: error.message 
        });
      }
    });

    // Get list of uploaded documents
    this.app.get('/compliance-documents', (req: Request, res: Response) => {
      try {
        const documents = this.agent.getUploadedDocuments();
        res.json({ 
          success: true,
          documents,
          count: documents.length 
        });
      } catch (error: any) {
        console.error('Failed to get documents:', error);
        res.status(500).json({ 
          success: false,
          error: 'Failed to retrieve documents' 
        });
      }
    });

    // Clear all compliance documents
    this.app.delete('/compliance-documents', (req: Request, res: Response) => {
      try {
        this.agent.clearComplianceContext();
        res.json({ 
          success: true, 
          message: 'All compliance documents cleared' 
        });
      } catch (error: any) {
        console.error('Failed to clear documents:', error);
        res.status(500).json({ 
          success: false,
          error: 'Failed to clear documents' 
        });
      }
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
      });
    });
  }

  async start(): Promise<void> {
    try {
      // Initialize agent
      await this.agent.initialize();

      // Start server
      this.app.listen(config.port, () => {
        console.log('\n' + '='.repeat(60));
        console.log('🛡️  GUARDRAIL SERVICE - HYBRID EDITION');
        console.log('='.repeat(60));
        console.log(`🚀 Server running on http://localhost:${config.port}`);
        console.log(`📚 Governance path: ${config.governancePath}`);
        console.log(`🔀 Provider mode: ${config.providerConfig.mode}`);
        console.log('='.repeat(60) + '\n');
        console.log('📊 Endpoints:');
        console.log(`   GET  /                    - API documentation`);
        console.log(`   GET  /health              - Health check`);
        console.log(`   GET  /info                - Service info`);
        console.log(`   GET  /provider            - Provider info`);
        console.log(`   POST /analyze             - Analyze single file`);
        console.log(`   POST /analyze-batch       - Analyze multiple files`);
        console.log(`   POST /reload-governance   - Reload governance rules`);
        console.log(`   POST /upload-compliance   - Upload compliance document`);
        console.log(`   GET  /compliance-documents - List uploaded documents`);
        console.log(`   DELETE /compliance-documents - Clear all documents`);
        console.log('\n' + '='.repeat(60) + '\n');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down gracefully...');
        await this.agent.cleanup();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down gracefully...');
        await this.agent.cleanup();
        process.exit(0);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}
