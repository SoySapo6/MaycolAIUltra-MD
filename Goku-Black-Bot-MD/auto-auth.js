// auto-auth.js - A script to automatically start the WhatsApp Bot with QR auth
// This script handles the input selection automatically

console.log('🤖 Starting Goku Black Bot MD - Automatic QR Authentication');
console.log('========================================================');

// Import dependencies using ES Module syntax
import readline from 'readline';
import { spawn } from 'child_process';
import * as fs from 'fs';

// Create a script to automatically select option 1
const tempScriptPath = './temp-input.js';
const tempScript = `
// Temporary script to automatically select option 1
process.stdin.resume();
process.stdin.setEncoding('utf8');

// After a delay, write '1' to stdin
setTimeout(() => {
  process.stdout.write('Automatically selecting option 1 (QR code)\\n');
  process.stdin.write('1\\n');
}, 3000);
`;

try {
  // Write the temporary script
  fs.writeFileSync(tempScriptPath, tempScript);
  
  // Run the temporary script in the background
  const inputProcess = spawn('node', [tempScriptPath], {
    stdio: 'inherit',
    detached: true
  });
  
  // Run the main bot process
  const botProcess = spawn('node', ['Ivan.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  botProcess.on('error', (err) => {
    console.error('Failed to start the bot:', err);
    try { fs.unlinkSync(tempScriptPath); } catch {}
    process.exit(1);
  });
  
  botProcess.on('close', (code) => {
    console.log(`Bot process exited with code ${code}`);
    try { fs.unlinkSync(tempScriptPath); } catch {}
    process.exit(code);
  });
} catch (error) {
  console.error(`Error: ${error.message}`);
  try { fs.unlinkSync(tempScriptPath); } catch {}
  process.exit(1);
}