import { createHash } from 'crypto';
import axios from 'axios';

/**
 * Plugin para enviar datos reales de usuario al dashboard web
 */
let handler = async (m, { conn, usedPrefix, command }) => {
  // Solo para propósitos de depuración, no responderá a comandos
  if (command) return;
};

/**
 * Esta función se ejecuta periódicamente para sincronizar datos de usuario
 */
export async function sincronizarDatosUsuario(conn) {
  try {
    // Obtener URL del dashboard desde variables de entorno
    // Si no existe, usar la URL predeterminada
    const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://workspace-tasef31147.replit.app';
    
    // Comprobar si la base de datos global está inicializada correctamente
    if (!global.db || !global.db.data || !global.db.data.users) {
      console.log('❌ Base de datos de usuarios no disponible');
      return false;
    }
    
    // Procesar los datos de todos los usuarios
    const usuarios = Object.entries(global.db.data.users).map(([id, userData]) => {
      // Obtener número de teléfono del ID
      const phoneNumber = id.split('@')[0];
      
      // Comprobar si es un número de teléfono válido
      if (!phoneNumber.match(/^\d+$/)) return null;
      
      // Filtrar y transformar los datos de usuario para enviar solo lo necesario
      return {
        phoneNumber,
        name: userData.name || `Usuario ${phoneNumber.substring(0, 6)}`,
        level: userData.level || 0,
        exp: userData.exp || 0,
        limit: userData.limit || 0,
        money: userData.money || userData.coins || 0,
        role: userData.role || 'Usuario',
        registered: userData.registered || false,
        registeredTime: userData.registeredTime || null,
        premium: userData.premium || false,
        premiumTime: userData.premiumTime || null,
        // Hash del número como identificador único para mayor seguridad
        userHash: createHash('sha256').update(phoneNumber).digest('hex').substring(0, 16)
      };
    }).filter(Boolean); // Eliminar usuarios nulos
    
    // Si no hay usuarios para sincronizar, finalizar
    if (usuarios.length === 0) {
      console.log('ℹ️ No hay usuarios para sincronizar con el dashboard');
      return false;
    }
    
    // Enviar datos al servidor del dashboard
    const response = await axios.post(`${DASHBOARD_URL}/api/sync-user-data`, {
      users: usuarios,
      apiSecret: process.env.API_SECRET || 'maycol-bot-secret'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000 // Timeout de 5 segundos
    });
    
    // Comprobar respuesta
    if (response.data && response.data.success) {
      console.log(`✅ Datos de ${usuarios.length} usuarios sincronizados con el dashboard`);
      return true;
    } else {
      console.log('❌ Error al sincronizar datos con el dashboard:', response.data?.message || 'Respuesta inválida');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error en la sincronización de datos de usuario:', error.message);
    return false;
  }
}

// Ejecutar sincronización cada 5 minutos (300000 ms)
setInterval(async () => {
  await sincronizarDatosUsuario(global.conn);
}, 300000);

// También sincronizar al cargar el plugin
setTimeout(async () => {
  await sincronizarDatosUsuario(global.conn);
}, 30000); // Esperar 30 segundos para asegurar que la base de datos esté cargada

handler.help = [];
handler.tags = ['hidden'];
handler.command = null; // No responde a ningún comando

export default handler;