/**
 * Comando para generar URL y credenciales para acceder al dashboard web
 * Solo el owner del bot puede usarlo
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

// URL base del dashboard
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://workspace-tasef31147.workspace.repl.co';

let handler = async (m, { conn, args, usedPrefix }) => {
  // Comprobar si el usuario es propietario
  const isOwner = global.owner.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
  
  if (!isOwner) {
    return m.reply('❌ Este comando solo puede ser utilizado por el propietario del bot.');
  }
  
  try {
    // Mostrar mensaje de proceso
    await m.reply('⏳ Generando credenciales para acceso al dashboard web...');
    
    // Obtener información del usuario
    const phoneNumber = m.sender.split('@')[0];
    const tempPassword = generatePassword(8); // Contraseña temporal
    const passwordHash = crypto.createHash('sha256').update(tempPassword).digest('hex');
    
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
        isOwner: true,
        registeredBy: 'bot-command'
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Enviar credenciales al usuario
      const message = `
📱 *ACCESO AL DASHBOARD WEB* 📱

🌐 *URL:* ${DASHBOARD_URL}/login
👤 *Usuario:* ${phoneNumber}
🔑 *Contraseña:* ${tempPassword}

📊 Desde el dashboard podrás:
• Ver estadísticas de uso del bot
• Verificar el estado de los subbots
• Utilizar la IA de Zeta directamente
• Canjear códigos de recompensa
• Jugar a la ruleta
• Y mucho más...

⚠️ No compartas estas credenciales con nadie.
      `;
      
      return m.reply(message);
    } else if (data.message && data.message.includes('ya existe')) {
      // Si la cuenta ya existe, enviar mensaje alternativo
      const message = `
📱 *ACCESO AL DASHBOARD WEB* 📱

Ya tienes una cuenta registrada en el dashboard.

🌐 *URL:* ${DASHBOARD_URL}/login
👤 *Usuario:* ${phoneNumber}

Si olvidaste tu contraseña, contacta con el administrador.

⚠️ El dashboard está funcionando correctamente.
      `;
      
      return m.reply(message);
    } else {
      return m.reply(`❌ *Error al generar credenciales*\n\n${data.message}`);
    }
  } catch (error) {
    console.error('Error al generar credenciales para dashboard:', error);
    return m.reply(`❌ *Error al generar credenciales*\n\nError del servidor: ${error.message || error}\n\nVerifica que el servidor web esté funcionando correctamente. Si el problema persiste, contacta al propietario del bot.`);
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
handler.tags = ['owner'];
handler.command = /^(dashboardweb)$/i;
handler.rowner = true;

export default handler;