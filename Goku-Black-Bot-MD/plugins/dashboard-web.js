import fetch from 'node-fetch';
import crypto from 'crypto';

// Ruta del servidor web
const DASHBOARD_URL = 'https://workspace-tasef31147.workspace.repl.co';

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
      const isOwner = global.owner.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
      
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
        // Si la cuenta ya existe, enviar mensaje alternativo
        await conn.sendMessage(m.chat, {
          text: `
📱 *ACCESO AL DASHBOARD WEB* 📱

Ya tienes una cuenta registrada en el dashboard.

🌐 *URL:* ${DASHBOARD_URL}/login
👤 *Usuario:* ${phoneNumber}

Si olvidaste tu contraseña, contacta con el administrador.

⚠️ El dashboard está funcionando correctamente.
`
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