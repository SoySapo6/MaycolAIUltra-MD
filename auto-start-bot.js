#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🤖 Starting Goku Black Bot MD with QR code authentication...');
console.log('========================================================');

const botDir = path.join(process.cwd(), 'Goku-Black-Bot-MD');

try {
  // Change to the bot directory
  process.chdir(botDir);
  
  // Start our custom auto-auth script (CommonJS version)
  const botProcess = spawn('node', ['auto-auth.cjs'], {
    stdio: 'inherit',
    shell: true
  });
  
  botProcess.on('error', (error) => {
    console.error(`\n❌ Failed to start the bot: ${error.message}`);
    process.exit(1);
  });
  
  // Handle Ctrl+C to gracefully exit
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping the bot...');
    botProcess.kill('SIGINT');
  });
  
  botProcess.on('close', (code) => {
    console.log(`\n👋 Bot process exited with code ${code}`);
    process.exit(code);
  });
} catch (error) {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
}