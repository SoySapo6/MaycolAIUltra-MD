import fetch from 'node-fetch';

// URL del servidor de dashboard
const SERVER_URL = 'https://b0bf2dfb-c00c-474a-8bf7-bf54eeaa25f4-00-3d2kqsun32v2h.kirk.repl.co';
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
 * Registra el uso de un comando en el servidor del dashboard
 */
async function registerCommandUsage(phoneNumber, command) {
  try {
    const response = await fetch(`${SERVER_URL}/api/register-command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber,
        command,
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
    console.log(`Comando "${command}" registrado para ${phoneNumber}`);
    
  } catch (error) {
    console.error('Error registrando comando en dashboard:', error);
  }
}

// Exportar para uso en el bot
export default { before };