/**
 * Configuration helper for MaycolAIUltra-MD
 * This file provides information about the configuration options
 * but doesn't replace the actual config.js in the bot directory
 */

const configTemplate = {
  // Owner contact info
  owner: [
    ['51921826291', 'SoyMaycol', true]
  ],
  
  // Moderators
  mods: ['51921826291'], 
  
  // Premium users
  prems: [],
  
  // Bot identity settings
  packname: 'MaycolAIUltra-MD',
  author: 'SoyMaycol',
  namebot: 'MaycolAIUltra-MD',
  wm: 'MaycolAIUltra-MD © Bot',
  
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
  footer: 'MaycolAIUltra-MD © Bot',
  
  // Social media links
  igfg: 'Follow on Instagram\nhttps://www.instagram.com/soymaycol',
  fgsc: 'Join to the channel\nhttps://whatsapp.com/channel/0029VayXJte65yD6LQGiRB0R',
  fgyt: 'Follow on YouTube\nhttps://youtube.com/@Ivamods15',
  fgpyp: 'Follow on Facebook\nhttps://facebook.com/soymaycol',
  
  // Bot images and assets
  fglog: 'https://i.postimg.cc/k59W5ZDT/descarga-5.jpg',
  thumb: 'https://i.pinimg.com/564x/8b/a9/e0/8ba9e0ea1aca0dabc453b86e0b3fca07.jpg',
  
  // Status messages
  wait: '*⌛ _Cargando..._*\n*▰▰▰▱▱▱▱▱*',
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
  thumbdoc: 'https://i.pinimg.com/564x/99/33/a1/9933a1d926ef27b08c2ca36e5a411db0.jpg',
  fileLength: 1024000,
  lenguajelatan: false
};

console.log('⚙️ MaycolAIUltra-MD Configuration Helper');
console.log('=====================================');
console.log('\nThis is a configuration helper. To properly configure your bot:');
console.log('\n1. Open the Goku-Black-Bot-MD/config.js file');
console.log('2. Modify the values according to your needs');
console.log('3. Save the file and restart the bot');

console.log('\n📝 Configuration Template:');
console.log('------------------------');
console.log(JSON.stringify(configTemplate, null, 2));

console.log('\n🚀 Once you have configured your bot, run start.js to launch it.');
