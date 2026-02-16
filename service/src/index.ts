import { GuardrailServer } from './server';

// Main entry point
async function main() {
  console.log('🛡️  Starting Guardrail Service...\n');
  
  const server = new GuardrailServer();
  await server.start();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
