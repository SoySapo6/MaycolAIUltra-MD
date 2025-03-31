/**
 * Comando para mostrar información sobre el dashboard web
 * Este es un complemento del comando dashboardweb existente
 * 
 * @author MaycolAIUltra
 */

let handler = async (m, { conn, usedPrefix, command }) => {
  try {
    // Verificar si el comando es .dashboardinfo
    if (command !== 'dashboardinfo') return;
    
    // URL del dashboard
    const dashboardUrl = 'http://localhost:5000';
    
    // Imagen del dashboard
    const dashboardImage = 'https://i.imgur.com/QvkdSMM.png';
    
    // Enviar información sobre el dashboard web
    await conn.sendMessage(m.chat, {
      image: { url: dashboardImage },
      caption: `
📊 *DASHBOARD WEB MEJORADO* 📊

🌐 *URL:* ${dashboardUrl}

✅ *Nuevas funciones:*
• Visualización de comandos más usados
• Estado de conexión de tu Sub-Bot
• Chat con Gemini AI incorporado
• Datos reales de tu actividad en el bot

⚙️ *¿Cómo acceder?*
1. Usa \`.dashboardweb\` para obtener tus credenciales
2. Inicia sesión con tu número y contraseña
3. Explora todas las funciones disponibles

📱 *Recomendado:* Usa Chrome o Firefox para una mejor experiencia.

🔒 *Nota:* Tus credenciales expiran en 24 horas por seguridad.
`,
      mentions: [m.sender]
    }, { quoted: m });
    
  } catch (e) {
    console.error(e);
    await m.reply('❌ Error al procesar la solicitud');
  }
};

handler.help = ['dashboardinfo'];
handler.tags = ['info'];
handler.command = /^dashboardinfo$/i;

export default handler;