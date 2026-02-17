/**
 * Test Hybrid Provider System
 */

import { ProviderFactory } from './src/providers/provider-factory.js';
import { CopilotDetector } from './src/auth/copilot-detector.js';

async function testProviders() {
  console.log('='.repeat(60));
  console.log('🧪 Testing Hybrid Provider System');
  console.log('='.repeat(60) + '\n');

  // Test 1: Copilot Detection
  console.log('📍 Test 1: Copilot Auto-Detection');
  console.log('-'.repeat(60));
  const detector = new CopilotDetector();
  const copilotStatus = await detector.detect();
  console.log('Status:', JSON.stringify(copilotStatus, null, 2));
  console.log();

  // Test 2: Available Providers
  console.log('📍 Test 2: Available Providers');
  console.log('-'.repeat(60));
  const available = await ProviderFactory.getAvailableProviders();
  console.log('Available:', JSON.stringify(available, null, 2));
  console.log();

  // Test 3: Try Creating Provider in Auto Mode
  console.log('📍 Test 3: Create Provider (Auto Mode)');
  console.log('-'.repeat(60));
  try {
    const provider = await ProviderFactory.createProvider({
      mode: 'auto',
      copilot: {
        model: 'gpt-4',
        timeout: 10000
      }
    });

    const info = provider.getInfo();
    console.log('✅ Provider created successfully!');
    console.log('Info:', JSON.stringify(info, null, 2));

    await provider.cleanup();
  } catch (error: any) {
    console.error('❌ Provider creation failed:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test Complete');
  console.log('='.repeat(60));
}

testProviders().catch(console.error);
