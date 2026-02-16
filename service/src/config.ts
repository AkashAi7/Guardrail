import * as dotenv from 'dotenv';
import * as path from 'path';
import { ServiceConfig } from './types';

// Load environment variables
dotenv.config();

// Parse custom governance paths from environment variable
// Format: comma-separated list of paths
// Example: CUSTOM_GOVERNANCE_PATHS=/path/to/custom1,/path/to/custom2
const parseCustomPaths = (): string[] => {
  const customPathsEnv = process.env.CUSTOM_GOVERNANCE_PATHS;
  if (!customPathsEnv) {
    return [];
  }
  return customPathsEnv
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => path.resolve(p)); // Normalize to absolute paths
};

export const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  governancePath: process.env.GOVERNANCE_PATH || path.join(__dirname, '../../governance'),
  customGovernancePaths: parseCustomPaths(),
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
