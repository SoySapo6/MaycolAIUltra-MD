// auto-auth.cjs - A CommonJS script to automatically start the WhatsApp Bot with QR code auth

console.log('🤖 Starting Goku Black Bot MD - Automatic QR Authentication');
console.log('========================================================');

// Import dependencies in CommonJS style
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a temporary script to handle the input
const tempScriptPath = './temp-input.js';
const tempScript = `
// Temporary input handler script
setTimeout(() => {
  process.stdout.write('\\n✅ Auto-selecting option 1 (QR code)\\n');
  process.stdin.write('1\\n');
}, 3000);
`;

try {
  // Write the temporary script
  fs.writeFileSync(tempScriptPath, tempScript);
  
  // Start a detached process to handle input
  const inputProcess = spawn('node', [tempScriptPath], {
    detached: true,
    stdio: 'inherit'
  });
  
  // Run the main bot process
  const botProcess = spawn('node', ['Ivan.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  botProcess.on('error', (err) => {
    console.error('Failed to start the bot:', err);
    try { fs.unlinkSync(tempScriptPath); } catch(e) {}
    process.exit(1);
  });
  
  botProcess.on('close', (code) => {
    console.log(`Bot process exited with code ${code}`);
    try { fs.unlinkSync(tempScriptPath); } catch(e) {}
    process.exit(code);
  });
} catch (error) {
  console.error(`Error: ${error.message}`);
  try { fs.unlinkSync(tempScriptPath); } catch(e) {}
  process.exit(1);
}