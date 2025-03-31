import fetch from 'node-fetch';

// URL del servidor de dashboard
const SERVER_URL = 'https://b0bf2dfb-c00c-474a-8bf7-bf54eeaa25f4-00-3d2kqsun32v2h.kirk.repl.co';
const API_SECRET = 'maycol-bot-secret'; // Debe coincidir con el secreto del servidor

/**
 * Plugin para registrar conexiones de serbot en el dashboard web
 */
let handler = async (m, { conn, usedPrefix, args, isOwner, command }) => {
  // Solo procesar .serbot o comandos relacionados
  if (!command.match(/^(serbot|jadibot|subbot)$/i)) return;
  
  // Obtener el número de teléfono del usuario
  const phoneNumber = m.sender.split('@')[0];
  
  // Registrar intento de conexión en el dashboard
  try {
    await registerSubBotConnection(phoneNumber, {
      deviceName: 'WhatsApp Web', // Podría obtenerse de más información del cliente
      botCommand: command,
      timestamp: new Date().toISOString()
    });
    
    // Continuar con el flujo normal del comando
    // No necesitamos retornar nada especial aquí
    
  } catch (error) {
    console.error('Error registrando subbot en dashboard:', error);
    // No interferir con el funcionamiento normal del comando
  }
};

/**
 * Registra la conexión de un subbot en el servidor del dashboard
 */
async function registerSubBotConnection(phoneNumber, deviceInfo) {
  try {
    const response = await fetch(`${SERVER_URL}/api/register-subbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber,
        deviceInfo,
        secret: API_SECRET
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Error desconocido');
    }
    
    // Opcional: registrar éxito en la consola para depuración
    console.log(`SubBot registrado para ${phoneNumber}`);
    
  } catch (error) {
    console.error('Error registrando subbot en dashboard:', error);
  }
}

// Define qué comandos activarán este plugin
handler.help = ['serbot', 'jadibot', 'subbot'];
handler.tags = ['jadibot'];
handler.command = /^(serbot|jadibot|subbot)$/i;

export default handler;