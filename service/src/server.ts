import express, { Request, Response } from 'express';
import cors from 'cors';
import { GuardrailAgent } from './agent.js';
import { AnalysisRequest } from './types/index.js';
import config from './config.js';

export class GuardrailServer {
  private app: express.Application;
  private agent: GuardrailAgent;

  constructor() {
    this.app = express();
    this.agent = new GuardrailAgent(config.governancePath);
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
    this.app.get('/info', (req, res) => {
      res.json({
        service: 'Guardrail Service',
        version: '1.0.0',
        config: {
          governancePath: config.governancePath,
          model: config.copilotModel,
          authMethod: config.copilotAuthMethod,
        },
      });
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
        console.log('🛡️  GUARDRAIL SERVICE');
        console.log('='.repeat(60));
        console.log(`🚀 Server running on http://localhost:${config.port}`);
        console.log(`📚 Governance path: ${config.governancePath}`);
        console.log(`🤖 Copilot model: ${config.copilotModel}`);
        console.log(`🔐 Auth method: ${config.copilotAuthMethod}`);
        console.log('='.repeat(60) + '\n');
        console.log('📊 Endpoints:');
        console.log(`   GET  /health              - Health check`);
        console.log(`   GET  /info                - Service info`);
        console.log(`   POST /analyze             - Analyze single file`);
        console.log(`   POST /analyze-batch       - Analyze multiple files`);
        console.log(`   POST /reload-governance   - Reload governance rules`);
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
