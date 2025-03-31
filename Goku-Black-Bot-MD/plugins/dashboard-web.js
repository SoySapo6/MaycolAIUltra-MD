import fetch from 'node-fetch';
import crypto from 'crypto';

// Ruta del servidor web
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://b7467a67-cb11-4284-b09a-fa80d487d271-00-1nfssjab5ml8k.worf.replit.dev';

/**
 * Comando para generar URL y credenciales para acceder al dashboard web
 * Disponible para todos los usuarios
 */
let handler = async (m, { conn, usedPrefix, command }) => {
  try {
    // Obtener el número de teléfono del usuario
    const phoneNumber = m.sender.split('@')[0];
    
    // Verificar si el usuario está registrado (puedes personalizar esta verificación)
    if (!global.db.data.users[m.sender]) {
      return m.reply(`❌ *No estás registrado*\n\nPara usar esta función, primero debes registrarte usando el comando: */reg nombre.edad*\nPor ejemplo: */reg MaycolBot.20*`);
    }
    
    // Enviar mensaje de espera
    const waitMsg = await m.reply('⏳ *Generando credenciales para acceso al dashboard web...*');
    
    try {
      // Generar contraseña aleatoria
      const tempPassword = generatePassword(8);
      const passwordHash = crypto.createHash('sha256').update(tempPassword).digest('hex');
      
      // Determinar si el usuario es owner
      const isOwner = global.owner
        .map(v => typeof v === 'string' ? v.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : v)
        .includes(m.sender);
      
      // Registrar la cuenta en el dashboard
      const response = await fetch(`${DASHBOARD_URL}/api/register-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: phoneNumber,
          password: passwordHash,
          token: generateToken(),
          isOwner: isOwner,
          registeredBy: 'bot-command'
        }),
      });
      
      const data = await response.json();
      
      // Eliminar mensaje de espera
      await conn.sendMessage(m.chat, { delete: waitMsg.key });
      
      if (data.success) {
        // Obtener datos del usuario para personalizar el mensaje
        const userData = global.db.data.users[m.sender];
        const userName = userData.name || phoneNumber;
        
        // Imagen para el mensaje
        const dashboardPic = 'https://i.imgur.com/QvkdSMM.png';
        
        // Enviar mensaje con credenciales
        await conn.sendMessage(m.chat, {
          image: { url: dashboardPic },
          caption: `
📱 *ACCESO AL DASHBOARD WEB* 📱

¡Hola ${userName}! Tus credenciales están listas:

🌐 *URL:* ${DASHBOARD_URL}/login
👤 *Usuario:* ${phoneNumber}
🔑 *Contraseña:* ${tempPassword}

📊 *Desde el dashboard podrás:*
• Ver estadísticas de uso del bot
• Verificar el estado de tus subbots
• Utilizar la IA de Zeta directamente
• Canjear códigos de recompensa
• Jugar a la ruleta
• Y mucho más...

⚠️ *IMPORTANTE:*
- No compartas estas credenciales con nadie
- Tu actividad queda registrada en el sistema

✨ Disfruta de tu experiencia personalizada!
`,
          mentions: [m.sender]
        }, { quoted: m });
        
      } else if (data.message && data.message.includes('ya existe')) {
        // Si la cuenta ya existe, generar una nueva contraseña para el usuario
        const newPassword = generatePassword(8);
        const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');
        
        try {
          // Intentar actualizar la contraseña (esto es opcional, depende de tu implementación del API)
          await fetch(`${DASHBOARD_URL}/api/update-account-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: phoneNumber,
              password: newPasswordHash,
              token: generateToken(),
              apiSecret: process.env.API_SECRET || 'maycol-bot-secret'
            }),
          }).catch(() => {
            // Ignorar errores para no bloquear el flujo
            console.log('Actualización de contraseña no soportada, se entrega la URL solamente');
          });
        } catch (e) {
          console.log('Error al actualizar contraseña:', e);
        }
        
        // Obtener datos del usuario para personalizar el mensaje
        const userData = global.db.data.users[m.sender];
        const userName = userData.name || phoneNumber;
        
        // Imagen para el mensaje
        const dashboardPic = 'https://i.imgur.com/QvkdSMM.png';
        
        // Enviar mensaje con enlace de acceso y credenciales
        await conn.sendMessage(m.chat, {
          image: { url: dashboardPic },
          caption: `
📱 *ACCESO AL DASHBOARD WEB* 📱

¡Hola ${userName}! Aquí tienes tu acceso al dashboard:

🌐 *URL:* ${DASHBOARD_URL}/login
👤 *Usuario:* ${phoneNumber}
🔑 *Contraseña:* ${newPassword}

📊 *Desde el dashboard podrás:*
• Ver estadísticas de uso del bot
• Verificar el estado de tus subbots
• Utilizar la IA de Zeta directamente
• Canjear códigos de recompensa
• Jugar a la ruleta
• Y mucho más...

⚠️ *IMPORTANTE:*
- No compartas estas credenciales con nadie
- Tu actividad queda registrada en el sistema

✨ Disfruta de tu experiencia personalizada!
`,
          mentions: [m.sender]
        }, { quoted: m });
        
      } else {
        await m.reply(`❌ *Error al generar credenciales*\n\n${data.message}`);
      }
      
    } catch (error) {
      console.error('Error al generar credenciales para dashboard:', error);
      await m.reply(`❌ *Error al generar credenciales*\n\nError del servidor: ${error.message || error}\n\nVerifica que el servidor web esté funcionando correctamente. Si el problema persiste, contacta al propietario del bot.`);
    }
    
  } catch (e) {
    console.error(e);
    await m.reply('❌ Error al procesar la solicitud');
  }
};

// Función para generar una contraseña aleatoria
function generatePassword(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Función para generar un token
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

handler.help = ['dashboardweb'];
handler.tags = ['info'];
handler.command = /^dashboardweb$/i;

export default handler;