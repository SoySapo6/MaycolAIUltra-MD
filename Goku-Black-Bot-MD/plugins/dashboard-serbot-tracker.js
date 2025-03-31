import https from 'https';

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
 * Registra la conexión de un subbot en el servidor del dashboard (usando https nativo)
 */
async function registerSubBotConnection(phoneNumber, deviceInfo) {
  return new Promise((resolve, reject) => {
    try {
      const data = JSON.stringify({
        phoneNumber,
        deviceInfo,
        secret: API_SECRET
      });
      
      // Extraer host y path de la URL
      const url = new URL(`${SERVER_URL}/api/register-subbot`);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };
      
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode !== 200) {
            console.error(`Error del servidor: ${res.statusCode} ${res.statusMessage}`);
            return resolve(); // No fallar completamente
          }
          
          try {
            const jsonResponse = JSON.parse(responseData);
            if (!jsonResponse.success) {
              console.error('Error en respuesta:', jsonResponse.message);
            } else {
              console.log(`SubBot registrado para ${phoneNumber}`);
            }
            resolve();
          } catch (e) {
            console.error('Error parseando JSON de respuesta:', e);
            resolve();
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('Error enviando datos al dashboard:', error.message);
        resolve(); // No fallar completamente
      });
      
      req.write(data);
      req.end();
      
    } catch (error) {
      console.error('Error general registrando subbot:', error);
      resolve(); // No fallar completamente
    }
  });
}

// Define qué comandos activarán este plugin
handler.help = ['serbot', 'jadibot', 'subbot'];
handler.tags = ['jadibot'];
handler.command = /^(serbot|jadibot|subbot)$/i;

export default handler;