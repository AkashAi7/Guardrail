import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { ServiceConfig } from './types/index.js';
import type { ProviderConfig } from './providers/base-provider.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveGovernancePath = (): string => {
  const explicitPath = process.env.GOVERNANCE_PATH;
  if (explicitPath) {
    return explicitPath;
  }

  const bundledPath = path.join(__dirname, '../governance');
  if (fs.existsSync(bundledPath)) {
    return bundledPath;
  }

  return path.join(__dirname, '../../governance');
};

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
    model: process.env.COPILOT_MODEL || 'gpt-4.1',
    timeout: parseInt(process.env.ANALYSIS_TIMEOUT_MS || '120000', 10) // 120s (2 min) for Copilot response
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
  governancePath: resolveGovernancePath(),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10) * 1024 * 1024,
  enableCaching: process.env.ENABLE_CACHING === 'true',
  providerConfig
};

export default config;
