#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const botDir = path.join(process.cwd(), 'Goku-Black-Bot-MD');

console.log('🤖 Starting MaycolAIUltra-MD 🤖');
console.log('==============================');

/**
 * Check if setup is complete
 */
function checkSetup() {
  if (!fs.existsSync(botDir)) {
    console.error('❌ Bot directory not found. Please run setup.js first.');
    process.exit(1);
  }
  
  const packageJsonPath = path.join(botDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ Invalid bot directory. Package.json not found.');
    process.exit(1);
  }
}

/**
 * Start the WhatsApp bot
 */
function startBot() {
  console.log('\n🚀 Starting the WhatsApp bot...');
  console.log('📱 Please be ready to scan the QR code with your WhatsApp to connect the bot.');
  console.log('\n⚠️ Note: Press Ctrl+C to stop the bot at any time.');
  
  // Change to the bot directory
  process.chdir(botDir);
  
  // Start the bot using node
  const botProcess = spawn('node', ['.'], {
    stdio: 'inherit',
    shell: true
  });
  
  botProcess.on('error', (error) => {
    console.error(`\n❌ Failed to start the bot: ${error.message}`);
    process.exit(1);
  });
  
  // Log when the bot exits
  botProcess.on('close', (code) => {
    console.log(`\n👋 Bot process exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle SIGINT (Ctrl+C) to gracefully exit
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping the bot...');
    botProcess.kill('SIGINT');
  });
}

/**
 * Main function
 */
function main() {
  // Check if setup is complete
  checkSetup();
  
  // Start the bot
  startBot();
}

// Run the main function
main();
