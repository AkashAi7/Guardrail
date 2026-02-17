import * as dotenv from 'dotenv';
import * as path from 'path';
import { ServiceConfig } from './types/index.js';
import type { ProviderConfig } from './providers/base-provider.js';

// Load environment variables
dotenv.config();

// Determine provider mode
const getProviderMode = (): 'auto' | 'copilot' | 'byok' => {
  const mode = process.env.PROVIDER_MODE?.toLowerCase();
  if (mode === 'copilot' || mode === 'byok') {
    return mode;
  }
  return 'auto'; // Default: auto-detect
};

// Determine BYOK provider type
const getBYOKProvider = (): 'openai' | 'anthropic' | 'azure-openai' => {
  if (process.env.AZURE_OPENAI_KEY) return 'azure-openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return 'openai'; // Default
};

// Build provider configuration
export const providerConfig: ProviderConfig = {
  mode: getProviderMode(),
  copilot: {
    model: process.env.COPILOT_MODEL || 'gpt-4',
    timeout: parseInt(process.env.ANALYSIS_TIMEOUT_MS || '60000', 10) // Increased to 60s for Copilot response
  },
  byok: {
    provider: getBYOKProvider(),
    apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AZURE_OPENAI_KEY,
    model: process.env.BYOK_MODEL || undefined,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT
  }
};

export const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  governancePath: process.env.GOVERNANCE_PATH || path.join(__dirname, '../../governance'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10) * 1024 * 1024,
  enableCaching: process.env.ENABLE_CACHING === 'true',
  providerConfig
};

export default config;
