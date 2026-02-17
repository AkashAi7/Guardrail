/**
 * Simple Copilot SDK test - using exact pattern from agent.ts
 */

import { CopilotClient } from '@github/copilot-sdk';

async function testCopilot() {
  console.log('🧪 Testing Copilot SDK with simple pattern...\n');

  const copilotClient = new CopilotClient();
  
  try {
    // Start the client
    console.log('1️⃣ Starting Copilot client...');
    await copilotClient.start();
    console.log('✅ Client started\n');

    // Create session with system message
    console.log('2️⃣ Creating session...');
    const session = await copilotClient.createSession({
      model: 'gpt-4',
      systemMessage: {
        mode: 'replace',
        content: 'You are a code security analyzer. Respond with "WORKING" if you can see this message.',
      },
    });
    console.log('✅ Session created\n');

    // Set up response collection
    let responseContent = '';
    
    const done = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log(`❌ Timeout! Response so far: "${responseContent}"`);
        reject(new Error('Timeout after 60s'));
      }, 60000); // 60 second timeout

      session.on('assistant.message', (event: any) => {
        console.log('📩 Received assistant.message event');
        console.log('   Content:', event.data.content);
        responseContent += event.data.content || '';
      });

      session.on('session.idle', () => {
        console.log('✅ Session became idle');
        clearTimeout(timeout);
        resolve();
      });

      session.on('session.error', (event: any) => {
        console.error('❌ Session error:', event.data?.message);
        clearTimeout(timeout);
        reject(new Error(event.data?.message || 'Session error'));
      });
    });

    // Send test prompt
    console.log('3️⃣ Sending test prompt...');
    await session.send({ prompt: 'Can you see this? Just respond with WORKING.' });
    console.log('✅ Prompt sent, waiting for response...\n');

    // Wait for response
    await done;

    console.log('\n4️⃣ Final response:');
    console.log('━'.repeat(60));
    console.log(responseContent);
    console.log('━'.repeat(60));

    // Clean up
    await session.destroy();
    await copilotClient.stop();

    console.log('\n✅ Test complete!');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCopilot();
