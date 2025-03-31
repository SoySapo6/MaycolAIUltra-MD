/**
 * Plugin para registrar el uso de comandos en el dashboard
 * Este plugin permite llevar un seguimiento de los comandos más utilizados
 */

import fetch from 'node-fetch';

// URL base del dashboard
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://b7467a67-cb11-4284-b09a-fa80d487d271-00-1nfssjab5ml8k.worf.repl.co';

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
  // Solo procesar mensajes de texto y comandos
  if (!m.text) return;
  
  // Verificar si es un comando basado en el prefijo
  const prefix = '.'; // Usar un prefijo fijo para evitar problemas
  if (typeof m.text === 'string' && m.text.indexOf(prefix) === 0) {
    // Extraer el comando del mensaje
    const commandText = m.text.slice(prefix.length).trim().split(' ')[0];
  
    try {
      // Registrar el comando en el dashboard
      await fetch(`${DASHBOARD_URL}/api/register-command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: commandText,
          user: m.sender,
          timestamp: Date.now()
        }),
      });
    } catch (error) {
      console.error('Error al registrar comando en el dashboard:', error);
    }
  }
}

export default { before }