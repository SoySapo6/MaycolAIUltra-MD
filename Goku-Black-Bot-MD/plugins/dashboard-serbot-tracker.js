/**
 * Plugin para rastrear la conexión de subBots con el dashboard
 * Permite al dashboard mostrar información sobre los subbots conectados
 */

import fetch from 'node-fetch';
import os from 'os';

// URL base del dashboard
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://b7467a67-cb11-4284-b09a-fa80d487d271-00-1nfssjab5ml8k.worf.repl.co';

// Función para registrar y mantener actualizado el estado de conexión del subbot
async function updateSubbotStatus(conn, isConnected = true) {
  try {
    // Obtener el número de teléfono del bot
    const phoneNumber = conn.user?.jid?.split('@')[0] || 'unknown';
    
    // Obtener información del dispositivo
    const deviceName = os.hostname() || 'Dispositivo desconocido';
    
    // Endpoint de la API
    const endpoint = isConnected ? 
      `${DASHBOARD_URL}/api/register-subbot` : 
      `${DASHBOARD_URL}/api/unregister-subbot`;
    
    // Enviar información al dashboard
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        deviceName,
        timestamp: Date.now()
      }),
    });
    
    // Registrar en la consola
    console.log(`Subbot ${phoneNumber} ${isConnected ? 'registrado' : 'desregistrado'} en el dashboard`);
  } catch (error) {
    console.error('Error al actualizar estado del subbot en el dashboard:', error);
  }
}

// Handler para el evento de conexión
export async function connectionUpdate(update) {
  const { connection, lastDisconnect } = update;
  
  // Registrar al conectarse
  if (connection === 'open') {
    await updateSubbotStatus(this, true);
  }
  
  // Desregistrar al desconectarse
  if (connection === 'close') {
    await updateSubbotStatus(this, false);
  }
}

// Handler para el evento de creación de jadibot
export async function participantsUpdate({ id, participants, action }) {
  // Verificar si es un evento de jadibot
  if (action === 'add' && participants.includes(this.user.jid)) {
    await updateSubbotStatus(this, true);
  }
  
  if (action === 'remove' && participants.includes(this.user.jid)) {
    await updateSubbotStatus(this, false);
  }
}

export default {
  connectionUpdate,
  participantsUpdate
}