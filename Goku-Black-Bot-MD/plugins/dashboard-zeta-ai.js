import axios from 'axios';

/**
 * Plugin para registrar el modelo de Zeta AI en el dashboard web
 */
let handler = async (m, { conn, usedPrefix, command }) => {
  // Esta función solo responde al comando de prueba
  if (command === 'testai') {
    const respuesta = await consultarZetaAI('Hola, ¿quién eres?');
    m.reply(`🤖 Respuesta de Zeta AI:\n\n${respuesta}`);
  }
};

/**
 * Consulta a la API de Zeta AI
 * @param {string} query - Mensaje para la IA
 * @returns {Promise<string>} - Respuesta de la IA
 */
export async function consultarZetaAI(query) {
  try {
    // URL del API de Zeta AI
    const apiUrl = 'https://api.kyuurzy.site/api/ai/aizeta';
    
    // Realizar la consulta
    const response = await axios.get(`${apiUrl}?query=${encodeURIComponent(query)}`, {
      timeout: 30000 // 30 segundos de timeout para respuestas lentas
    });
    
    // Procesar la respuesta
    if (response.data && response.data.result && response.data.result.answer) {
      return response.data.result.answer;
    } else if (response.data && response.data.gpt) {
      return response.data.gpt;
    } else if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return 'No pude obtener una respuesta clara de la IA. Intenta con otra pregunta.';
    
  } catch (error) {
    console.error('Error al consultar Zeta AI:', error.message);
    return `Error al procesar tu consulta: ${error.message}`;
  }
}

/**
 * Registra el modelo de IA en el dashboard
 */
export async function registrarModeloIA() {
  try {
    // Obtener URL del dashboard desde variables de entorno
    const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://b7467a67-cb11-4284-b09a-fa80d487d271-00-1nfssjab5ml8k.worf.replit.dev';
    
    // Datos del modelo
    const modelData = {
      type: 'zeta-ai',
      endpoint: 'https://api.kyuurzy.site/api/ai/aizeta',
      apiSecret: process.env.API_SECRET || 'maycol-bot-secret'
    };
    
    // Registrar el modelo en el dashboard
    const response = await axios.post(`${DASHBOARD_URL}/api/register-ai`, modelData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 segundos de timeout
    });
    
    // Comprobar respuesta
    if (response.data && response.data.success) {
      console.log('Modelo Zeta AI registrado con éxito en el dashboard');
      return true;
    } else {
      console.log('Error al registrar modelo IA en el dashboard:', response.data?.message || 'Respuesta inválida');
      return false;
    }
    
  } catch (error) {
    if (error.code !== 'ECONNREFUSED') {
      console.error('Error al registrar modelo IA:', error.message);
    }
    return false;
  }
}

// Registrar el modelo cuando se carga el plugin
setTimeout(registrarModeloIA, 15000); // Esperar 15 segundos para asegurar que todo está cargado

handler.help = ['testai'];
handler.tags = ['ai'];
handler.command = /^(testai)$/i;

export default handler;