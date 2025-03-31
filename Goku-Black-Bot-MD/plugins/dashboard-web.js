import fetch from 'node-fetch';
import fs from 'fs';
import crypto from 'crypto';

// Ruta del servidor web
const SERVER_URL = 'https://' + process.env.REPL_ID + '.id.repl.co' || 'http://localhost:3001';
const API_SECRET = 'maycol-bot-secret'; // Cambiar a una clave segura en producción

let handler = async (m, { conn, usedPrefix, command }) => {
  try {
    // Verificar si el comando es .dashboardweb
    if (command !== 'dashboardweb') return;

    // Obtener el número de teléfono del usuario
    const phoneNumber = m.sender.split('@')[0];
    
    // Enviar mensaje de espera
    const waitMsg = await m.reply('🔄 *Generando credenciales para el dashboard web...*');
    
    try {
      // Solicitar credenciales al servidor
      const response = await fetch(`${SERVER_URL}/api/generate-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber,
          secret: API_SECRET
        })
      });
      
      // Verificar respuesta
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }
      
      // Obtener credenciales
      const data = await response.json();
      
      if (!data.success || !data.credentials) {
        throw new Error('No se pudieron generar las credenciales');
      }
      
      // Extraer credenciales
      const { username, password, token } = data.credentials;
      
      // Imagen de Hanako-kun para el mensaje
      const hanakoPic = 'https://i.imgur.com/QvkdSMM.png';
      
      // Enviar mensaje con credenciales
      await conn.sendMessage(m.chat, {
        image: { url: hanakoPic },
        caption: `✅ *DASHBOARD WEB GENERADO*\n\n🔒 *Credenciales de acceso*\n• *Usuario:* ${username}\n• *Contraseña:* ${password}\n\n🌐 *URL:* ${SERVER_URL}\n\n⚠️ *IMPORTANTE:*\n- Estas credenciales son de un solo uso\n- No compartas esta información con nadie\n- Las credenciales expiran en 24 horas\n\n💡 *Nota:* En el dashboard temático de Hanako-kun podrás consultar tus estadísticas, nivel, monedas y más. También podrás ver tu actividad reciente y los comandos disponibles.`,
        mentions: [m.sender]
      }, { quoted: m });
      
      // Eliminar mensaje de espera
      await conn.sendMessage(m.chat, { delete: waitMsg.key });
      
    } catch (error) {
      console.error('Error al generar credenciales:', error);
      await m.reply(`❌ *Error al generar credenciales*\n\n${error.message}\n\nVerifica que el servidor web esté funcionando correctamente. Si el problema persiste, contacta al propietario del bot.`);
    }
    
  } catch (e) {
    console.error(e);
    await m.reply('❌ Error al procesar la solicitud');
  }
};

handler.help = ['dashboardweb'];
handler.tags = ['info'];
handler.command = /^dashboardweb$/i;

export default handler;