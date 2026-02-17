import * as dotenv from 'dotenv';
import * as path from 'path';
import { ServiceConfig } from './types/index.js';

// Load environment variables
dotenv.config();

export const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  governancePath: process.env.GOVERNANCE_PATH || path.join(__dirname, '../../governance'),
  copilotAuthMethod: (process.env.COPILOT_AUTH_METHOD as 'github' | 'byok') || 'github',
  copilotModel: process.env.COPILOT_MODEL || 'gpt-4',
  analysisTimeout: parseInt(process.env.ANALYSIS_TIMEOUT_MS || '10000', 10),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10) * 1024 * 1024,
  enableCaching: process.env.ENABLE_CACHING === 'true',
  // BYOK (Bring Your Own Key) options
  openaiApiKey: process.env.OPENAI_API_KEY,
  azureOpenaiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenaiKey: process.env.AZURE_OPENAI_KEY,
  azureOpenaiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
};

export default config;
