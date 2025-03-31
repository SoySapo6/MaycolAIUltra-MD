import https from 'https';

// URL del servidor de dashboard
const SERVER_URL = 'https://b7467a67-cb11-4284-b09a-fa80d487d271-00-1nfssjab5ml8k.worf.repl.co';
const API_SECRET = 'maycol-bot-secret'; // Debe coincidir con el secreto del servidor

/**
 * Plugin para registrar el uso de comandos en el dashboard web
 */
export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
  // Solo procesar mensajes de texto que parezcan comandos
  if (!m.text || !m.text.startsWith('.') || m.fromMe) return;

  try {
    // Extraer el comando del mensaje (primera palabra después del punto)
    const commandMatch = m.text.match(/^\.([^\s]+)/);
    if (!commandMatch) return;
    
    const command = commandMatch[1].toLowerCase();
    const phoneNumber = m.sender.split('@')[0];
    
    // Enviar información del comando al servidor de dashboard
    registerCommandUsage(phoneNumber, command).catch(e => {
      console.error('Error registrando comando en dashboard:', e);
    });
    
  } catch (error) {
    console.error('Error en dashboard-command-tracker:', error);
  }
}

/**
 * Registra el uso de un comando en el servidor del dashboard (usando https nativo)
 */
async function registerCommandUsage(phoneNumber, command) {
  return new Promise((resolve, reject) => {
    try {
      const data = JSON.stringify({
        phoneNumber,
        command,
        secret: API_SECRET
      });
      
      // Extraer host y path de la URL
      const url = new URL(`${SERVER_URL}/api/register-command`);
      
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
              console.log(`Comando "${command}" registrado para ${phoneNumber}`);
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
      console.error('Error general registrando comando:', error);
      resolve(); // No fallar completamente
    }
  });
}

// Exportar para uso en el bot
export default { before };