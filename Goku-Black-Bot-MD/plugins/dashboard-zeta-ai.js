/**
 * Plugin para integrar la IA de Zeta en el dashboard
 * Permite usar el modelo de Zeta AI directamente desde el dashboard
 */

import fetch from 'node-fetch';

// URL base del dashboard
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://b7467a67-cb11-4284-b09a-fa80d487d271-00-1nfssjab5ml8k.worf.repl.co';
// URL del API de Zeta
const ZETA_API_URL = 'https://api.kyuurzy.site/api/ai/aizeta';

// Registrar el modelo de IA Zeta al cargar el plugin
const registerZetaModel = async () => {
  try {
    await fetch(`${DASHBOARD_URL}/api/register-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'zeta-ai',
        endpoint: ZETA_API_URL,
      }),
    });
    
    console.log('Modelo Zeta AI registrado con éxito en el dashboard');
  } catch (error) {
    console.error('Error al registrar modelo Zeta AI en el dashboard:', error);
  }
};

// Llamar a la función de registro al iniciar
registerZetaModel();

// Comando para hacer pruebas de integración con el dashboard
let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('Por favor proporciona un mensaje para consultar a Zeta AI');
  
  m.reply('Procesando tu consulta con Zeta AI...');
  
  try {
    // Consultar a la API de Zeta directamente
    const response = await fetch(`${ZETA_API_URL}?query=${encodeURIComponent(text)}`);
    const data = await response.json();
    
    let aiResponse;
    
    if (data.result && data.result.answer) {
      aiResponse = data.result.answer;
    } else if (data.gpt) {
      aiResponse = data.gpt;
    } else if (data.data) {
      aiResponse = data.data;
    } else {
      throw new Error('Formato de respuesta no reconocido');
    }
    
    // Responder al usuario
    m.reply(`🤖 *Zeta AI responde:*\n\n${aiResponse}\n\n📱 _Esta IA también está disponible en el dashboard._`);
    
  } catch (error) {
    console.error('Error al consultar Zeta AI:', error);
    m.reply(`❌ Error al consultar a Zeta AI: ${error.message}`);
  }
};

handler.help = ['zetadashboard <texto>'];
handler.tags = ['ai', 'dashboard'];
handler.command = /^(zetadashboard)$/i;

export default handler;