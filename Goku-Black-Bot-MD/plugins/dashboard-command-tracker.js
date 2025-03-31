import axios from 'axios';

/**
 * Plugin para registrar el uso de comandos en el dashboard
 * Este plugin no responde a comandos, solo registra automáticamente
 */
let handler = async (m, { conn, usedPrefix, command }) => {
  // Solo para depuración, no responderá a comandos directamente
  if (command === 'debugcommandtracker') {
    m.reply('🔍 Plugin de seguimiento de comandos activo');
  }
};

/**
 * Registra el uso del comando en el dashboard
 * @param {Object} data - Datos del comando ejecutado
 * @param {String} data.command - Nombre del comando
 * @param {String} data.user - ID del usuario
 */
export async function registerCommandUsage(data) {
  try {
    // Obtener URL del dashboard desde variables de entorno
    const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://workspace-tasef31147.replit.app';
    
    if (!data || !data.command) {
      return false;
    }
    
    // Obtener datos completos necesarios
    const commandData = {
      command: data.command,
      // Si no se proporciona usuario, usar 'sistema'
      user: data.user || 'sistema',
      timestamp: Date.now(),
      success: data.success || true
    };
    
    // Enviar registro al dashboard
    const response = await axios.post(`${DASHBOARD_URL}/api/register-command`, commandData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_SECRET || 'maycol-bot-secret'}`
      },
      timeout: 3000 // 3 segundos de timeout
    });
    
    // Comprobar respuesta
    if (response.data && response.data.success) {
      // console.log(`✅ Comando ${data.command} registrado en el dashboard`);
      return true;
    } else {
      console.log('❌ Error al registrar comando en el dashboard:', response.data?.message || 'Respuesta inválida');
      return false;
    }
    
  } catch (error) {
    // Error silencioso para no interrumpir la ejecución normal
    if (error.code !== 'ECONNREFUSED') {
      console.error('❌ Error al registrar comando:', error.message);
    }
    return false;
  }
}

// Función para interceptar comandos y registrarlos
export function setupCommandTracking(conn) {
  try {
    // Verificar que conn tenga las propiedades necesarias
    if (!conn || !conn.ev) {
      console.error('❌ No se puede configurar el seguimiento de comandos: objeto conn incompleto');
      return;
    }
    
    // Usar el evento de mensajes entrantes para registrar comandos
    conn.ev.on('messages.upsert', async ({ messages }) => {
      try {
        if (!messages || !messages[0]) return;
        
        const m = messages[0];
        
        // Si es un comando (comienza con prefijo)
        if (m.text && global.prefix && m.text.startsWith(global.prefix) && m.text.length > 1) {
          // Extraer el nombre del comando (sin el prefijo)
          const fullCommand = m.text.slice(global.prefix.length).trim().split(/\s+/)[0];
          
          // Registrar el uso del comando
          registerCommandUsage({
            command: fullCommand,
            user: m.sender || m.key.remoteJid
          });
        }
      } catch (error) {
        console.error('Error al rastrear comando:', error);
      }
    });
    
    console.log('✅ Sistema de seguimiento de comandos para dashboard activado');
  } catch (error) {
    console.error('❌ Error al configurar seguimiento de comandos:', error);
  }
}

// Activar el rastreo de comandos al iniciar el plugin (después de un breve retraso)
setTimeout(() => {
  if (global.conn) {
    setupCommandTracking(global.conn);
  } else {
    console.error('❌ No se pudo activar el seguimiento de comandos: conn no está disponible');
  }
}, 5000); // Esperar 5 segundos para asegurar que todo está cargado

handler.help = ['debugcommandtracker'];
handler.tags = ['owner'];
handler.command = /^(debugcommandtracker)$/i;
handler.owner = true;

export default handler;