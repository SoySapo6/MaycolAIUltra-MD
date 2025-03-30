/**
 * Configuration helper for Goku Black Bot MD
 * This file provides information about the configuration options
 * but doesn't replace the actual config.js in the bot directory
 */

const configTemplate = {
  // Owner contact info
  owner: [
    ['NUMBER', 'NAME', true]  // Example: ['1234567890', 'YourName', true]
  ],
  
  // Moderators
  mods: [], 
  
  // Premium users
  prems: [],
  
  // Bot identity settings
  packname: 'Goku-Black-Bot',
  author: 'Your Name',
  namebot: 'Goku Black Bot MD',
  wm: 'Goku Black © Bot',
  
  // API Integration
  APIs: {
    // Add your APIs here
    amel: 'https://melcanz.com',
    xteam: 'https://api.xteam.xyz',
  },
  
  // API Keys for the services
  APIKeys: {
    // Add your API keys here
    'https://melcanz.com': 'melcanzkey',
    'https://api.xteam.xyz': 'xteamkey',
  },
  
  // Bot settings
  multiplier: 69,
  footer: 'Goku Black © Bot',
  
  // Social media links
  igfg: 'Follow on Instagram\nhttps://www.instagram.com/yourhandle',
  fgsc: 'Join to the channel\nhttps://t.me/yourchannel',
  fgyt: 'Follow on YouTube\nhttps://youtube.com/yourchannel',
  fgpyp: 'Follow on Facebook\nhttps://facebook.com/yourpage',
  
  // Bot images and assets
  fglog: 'https://i.imgur.com/jLsXRll.jpg',
  thumb: 'https://i.imgur.com/KLHCWq5.jpeg',
  
  // Status messages
  wait: '*⌛ _Charging..._*\n*▰▰▰▱▱▱▱▱*',
  rwait: '⌛',
  dmoji: '🤭',
  done: '✅',
  error: '❌',
  xmoji: '🔥',
  
  // Document type definitions
  dpptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ddocx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  dxlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  dpdf: 'application/pdf',
  drtf: 'text/rtf',
  
  // Miscellaneous settings
  thumbdoc: 'https://i.imgur.com/0PrLKIv.jpeg',
  fileLength: 1024000,
  lenguajelatan: false
};

console.log('⚙️ Goku Black Bot MD Configuration Helper');
console.log('=====================================');
console.log('\nThis is a configuration helper. To properly configure your bot:');
console.log('\n1. Open the Goku-Black-Bot-MD/config.js file');
console.log('2. Modify the values according to your needs');
console.log('3. Save the file and restart the bot');

console.log('\n📝 Configuration Template:');
console.log('------------------------');
console.log(JSON.stringify(configTemplate, null, 2));

console.log('\n🚀 Once you have configured your bot, run start.js to launch it.');
