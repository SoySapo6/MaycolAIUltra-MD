import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * Plugin para rastrear los sub-bots creados con .serbot y mostrarlos en el dashboard
 */
let handler = async (m, { conn, usedPrefix, command }) => {
  // Solo para depuración, no responderá a comandos directamente
  if (command === 'debugserbottracker') {
    const subBots = await getConnectedSubBots();
    m.reply(`🤖 Registro de sub-bots:\n\n${JSON.stringify(subBots, null, 2)}`);
  }
};

/**
 * Obtiene la lista de números conectados como sub-bots
 * @returns {Promise<Array>} Lista de números conectados
 */
export async function getConnectedSubBots() {
  try {
    // Directorio donde se almacenan las sesiones de los sub-bots
    const jadiBotDir = './jadibots';
    
    // Comprobar si el directorio existe
    if (!fs.existsSync(jadiBotDir)) {
      return [];
    }
    
    // Leer el directorio para obtener las carpetas de sesión
    const sessions = fs.readdirSync(jadiBotDir).filter(file => {
      const stats = fs.statSync(path.join(jadiBotDir, file));
      return stats.isDirectory() && /^\d+$/.test(file); // Solo directorios con nombres numéricos
    });
    
    // Obtener información de cada sub-bot
    const subBots = sessions.map(phoneNumber => {
      // Verificar si tiene archivo de credenciales (símbolo de conexión activa)
      const credsFile = path.join(jadiBotDir, phoneNumber, 'creds.json');
      const isConnected = fs.existsSync(credsFile);
      
      let deviceInfo = null;
      try {
        // Intentar leer información del dispositivo desde las credenciales
        if (isConnected) {
          const credsData = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
          deviceInfo = {
            name: credsData.me?.name || 'Dispositivo desconocido',
            id: credsData.me?.id?.split(':')[0] || phoneNumber
          };
        }
      } catch (e) {
        console.error(`Error al leer credenciales de ${phoneNumber}:`, e);
      }
      
      // Obtener tiempo de creación del directorio como aproximación
      const sessionDir = path.join(jadiBotDir, phoneNumber);
      const stats = fs.statSync(sessionDir);
      
      return {
        phoneNumber,
        isConnected,
        deviceName: deviceInfo?.name || `Sub-bot ${phoneNumber}`,
        connectedAt: stats.birthtime.getTime()
      };
    });
    
    return subBots;
    
  } catch (error) {
    console.error('Error al obtener sub-bots conectados:', error);
    return [];
  }
}

/**
 * Sincroniza el estado de los sub-bots con el dashboard
 */
export async function syncSubBotsWithDashboard() {
  try {
    // Obtener URL del dashboard desde variables de entorno
    const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://workspace-tasef31147.replit.app';
    
    // Obtener lista de sub-bots conectados
    const subBots = await getConnectedSubBots();
    
    if (subBots.length === 0) {
      console.log('✅ No hay sub-bots para sincronizar con el dashboard');
      return;
    }
    
    // Registrar cada sub-bot en el dashboard
    for (const bot of subBots) {
      try {
        await axios.post(`${DASHBOARD_URL}/api/register-subbot`, {
          phoneNumber: bot.phoneNumber,
          deviceName: bot.deviceName,
          apiSecret: process.env.API_SECRET || 'maycol-bot-secret'
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 segundos de timeout
        });
        
        console.log(`✅ Sub-bot ${bot.phoneNumber} registrado en el dashboard`);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          console.error(`❌ Error al registrar sub-bot ${bot.phoneNumber}:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error en la sincronización de sub-bots:', error.message);
  }
}

// Sincronizar cada 5 minutos
setInterval(syncSubBotsWithDashboard, 5 * 60 * 1000);

// También sincronizar al cargar el plugin
setTimeout(syncSubBotsWithDashboard, 30000); // Esperar 30 segundos para asegurar que todo está cargado

// Escuchar eventos de conexión de nuevos sub-bots
global.conns = global.conns || [];

// Función para registrar un nuevo sub-bot cuando se conecta
export async function registerNewSubBot(conn) {
  if (!conn || !conn.user) return;
  
  try {
    const phoneNumber = conn.user.jid.split('@')[0];
    const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://workspace-tasef31147.replit.app';
    
    await axios.post(`${DASHBOARD_URL}/api/register-subbot`, {
      phoneNumber,
      deviceName: conn.user.name || `Sub-bot ${phoneNumber}`,
      apiSecret: process.env.API_SECRET || 'maycol-bot-secret'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log(`✅ Nuevo sub-bot ${phoneNumber} registrado en el dashboard`);
  } catch (error) {
    if (error.code !== 'ECONNREFUSED') {
      console.error('❌ Error al registrar nuevo sub-bot:', error.message);
    }
  }
}

// Ajustes para el comando de depuración
handler.help = ['debugserbottracker'];
handler.tags = ['owner'];
handler.command = /^(debugserbottracker)$/i;
handler.owner = true;

export default handler;