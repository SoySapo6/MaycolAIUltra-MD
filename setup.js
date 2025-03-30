#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🤖 Welcome to Goku Black Bot MD Setup 🤖');
console.log('=======================================');
console.log('This script will help you set up the Goku Black Bot MD WhatsApp bot.');

// Define the repository URL
const repoUrl = 'https://github.com/Eliasivan/Goku-Black-Bot-MD.git';
const botDir = path.join(process.cwd(), 'Goku-Black-Bot-MD');

/**
 * Execute system commands and print output
 */
function executeCommand(command, options = {}) {
  console.log(`\n📌 Executing: ${command}`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      ...options
    });
    return true;
  } catch (error) {
    console.error(`❌ Error executing command: ${error.message}`);
    return false;
  }
}

/**
 * Clone the repository if it doesn't exist
 */
function cloneRepository() {
  if (fs.existsSync(botDir)) {
    console.log('\n📁 Bot directory already exists. Skipping clone...');
    return true;
  }
  
  console.log('\n🔄 Cloning the Goku Black Bot MD repository...');
  return executeCommand(`git clone ${repoUrl}`);
}

/**
 * Install dependencies
 */
function installDependencies() {
  console.log('\n📦 Installing dependencies...');
  
  // Change to the bot directory
  process.chdir(botDir);
  
  // Install dependencies using npm
  return executeCommand('npm install');
}

/**
 * Create or update configuration files
 */
function setupConfiguration() {
  console.log('\n⚙️ Setting up configuration...');
  
  // Create a helper file with instructions
  const instructionsPath = path.join(process.cwd(), 'bot-instructions.txt');
  const instructions = `GOKU BLACK BOT MD - INSTRUCCIONES

Para configurar correctamente el bot:

1. Edita el archivo config.js en la carpeta Goku-Black-Bot-MD para personalizar el bot
   - Agrega tu número de WhatsApp en el formato: 'YOURNUMBER' (ej: '123456789012')
   - Personaliza el nombre del bot y los mensajes

2. Para iniciar el bot:
   - Ejecuta: node start.js
   - Escanea el código QR que aparece con WhatsApp
   - El bot se conectará a tu cuenta de WhatsApp

3. Comandos principales:
   - .menu - Muestra el menú principal
   - .help - Muestra ayuda
   - .info - Información del bot

Si necesitas más ayuda, consulta la documentación completa en:
https://github.com/Eliasivan/Goku-Black-Bot-MD
`;

  try {
    fs.writeFileSync(instructionsPath, instructions);
    console.log('📝 Se ha creado un archivo de instrucciones (bot-instructions.txt)');
  } catch (error) {
    console.error(`Error al crear archivo de instrucciones: ${error.message}`);
  }
  
  // Check if config.js exists
  const configPath = path.join(botDir, 'config.js');
  if (!fs.existsSync(configPath)) {
    console.log('Creating default config.js file...');
    
    const defaultConfig = `
// Config.js file for Goku Black Bot MD
global.owner = ['YOURNUMBER', 'SECONDNUMBER']  // Example: ['123456789', '234567890']
global.mods = ['YOURNUMBER', 'SECONDNUMBER']   
global.prems = ['YOURNUMBER', 'SECONDNUMBER']

// Messages
global.packname = 'Goku-Black-Bot'
global.author = 'WhatsApp Bot'
global.namebot = 'Goku Black Bot MD'
global.wm = 'Goku Black © Bot'

// Links & API Keys
global.APIs = {
  amel: 'https://melcanz.com',
  xteam: 'https://api.xteam.xyz',
}

global.APIKeys = {
  'https://melcanz.com': 'melcanzkey',
  'https://api.xteam.xyz': 'xteamkey',
}

// Sticker WM
global.packname = 'Goku Black Bot MD'
global.author = 'WhatsApp Bot'

// Bot settings
global.multiplier = 69
global.footer = 'Goku Black © Bot'
global.igfg = 'Follow on Instagram\\nhttps://www.instagram.com/yourhandle'
global.fgsc = 'Join to the channel\\nhttps://t.me/yourchannel' 
global.fgyt = 'Follow on YouTube\\nhttps://youtube.com/yourchannel'
global.fgpyp = 'Follow on Facebook\\nhttps://facebook.com/yourpage'
global.fglog = 'https://i.imgur.com/jLsXRll.jpg'
global.thumb = 'https://i.imgur.com/KLHCWq5.jpeg'
global.wait = '*⌛ _Charging..._*\\n*▰▰▰▱▱▱▱▱*'
global.rwait = '⌛'
global.dmoji = '🤭'
global.done = '✅'
global.error = '❌' 
global.xmoji = '🔥' 

// Default settings
global.owner = [
  ['123456789', 'Owner', true]
]
global.mods = [] 
global.prems = [] 

// Customization
global.dpptx = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
global.ddocx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
global.dxlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
global.dpdf = 'application/pdf'
global.drtf = 'text/rtf'

global.thumbdoc = 'https://i.imgur.com/0PrLKIv.jpeg'

global.flaaa = [
  'https://flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=water-logo&script=water-logo&fontsize=90&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&fillTextColor=%23000&shadowGlow=false&shadowOpacity=25&fillTextPattern=Warning!&fillColor1Color=%23333&fillColor2Color=%23333&fillColor3Color=%23333&fillColor4Color=%23333&fillColor5Color=%23333&fillColor6Color=%23333&fillColor7Color=%23333&fillColor8Color=%23333&fillColor9Color=%23333&fillColor10Color=%23333&fillOutlineColor=%23E4E4E4&fillOutline2Color=%23E4E4E4&backgroundColor=%23999999&text=']

// Other settings
global.fileLength = 1024000
global.lenguajelatan = false

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log('Update \\'config.js\\'')
  delete require.cache[file]
  require(file)
})
`;
    
    fs.writeFileSync(configPath, defaultConfig);
    console.log('✅ Default config.js created! Please edit it with your personal details.');
  } else {
    console.log('✅ Config.js already exists.');
  }
  
  return true;
}

/**
 * Main setup function
 */
async function main() {
  // Step 1: Clone repository
  if (!cloneRepository()) {
    console.error('\n❌ Failed to clone repository. Please check your internet connection and try again.');
    process.exit(1);
  }
  
  // Step 2: Install dependencies
  if (!installDependencies()) {
    console.error('\n❌ Failed to install dependencies. Please check for errors and try again.');
    process.exit(1);
  }
  
  // Step 3: Setup configuration
  if (!setupConfiguration()) {
    console.error('\n❌ Failed to set up configuration. Please check for errors and try again.');
    process.exit(1);
  }
  
  console.log('\n✅ Goku Black Bot MD has been successfully set up!');
  console.log('\n📱 To start the bot, run: node start.js');
  console.log('\n⚠️ Remember to edit the config.js file to customize your bot before starting it.');
  console.log('\n🌐 For more information, please refer to the README.md file.');
  
  rl.close();
}

// Run the main function
main().catch(err => {
  console.error('An unexpected error occurred:', err);
  process.exit(1);
});
