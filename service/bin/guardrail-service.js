#!/usr/bin/env node
import { GuardrailServer } from '../dist/index.js';

const server = new GuardrailServer();
server.start().catch((error) => {
  console.error('Failed to start Guardrail service:', error);
  process.exit(1);
});
