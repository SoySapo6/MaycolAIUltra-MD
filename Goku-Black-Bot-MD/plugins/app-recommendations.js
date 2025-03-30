import fetch from 'node-fetch';
import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

// Categorías populares de aplicaciones
const APP_CATEGORIES = [
  'games', 'social', 'tools', 'education', 'entertainment', 
  'productivity', 'communication', 'music', 'photography', 'health'
];

// Palabras clave para diferentes intereses
const INTEREST_KEYWORDS = {
  'gaming': ['juegos', 'game', 'gaming', 'rpg', 'shooter', 'aventura', 'strategy'],
  'social': ['social', 'chat', 'amigos', 'redes', 'facebook', 'instagram'],
  'productivity': ['notas', 'trabajo', 'oficina', 'productividad', 'documentos', 'calendar'],
  'education': ['educacion', 'aprender', 'escuela', 'estudiar', 'universidad', 'idiomas'],
  'entertainment': ['entretenimiento', 'videos', 'series', 'peliculas', 'streaming', 'diversion'],
  'tools': ['herramientas', 'utilidades', 'recursos', 'limpieza', 'optimizacion'],
  'photography': ['foto', 'camara', 'filtros', 'edicion', 'selfie'],
  'music': ['musica', 'audio', 'canciones', 'reproductor', 'mp3', 'spotify'],
  'health': ['salud', 'ejercicio', 'fitness', 'dieta', 'bienestar'],
  'communication': ['mensajeria', 'llamadas', 'comunicacion', 'sms', 'email']
};

// Inicializar la base de datos de intereses si no existe
if (!global.db.data.users) {
  global.db.data.users = {};
}

// Asegurarse de que cada usuario tenga un perfil de intereses
Object.keys(global.db.data.users).forEach(userId => {
  if (!global.db.data.users[userId].appInterests) {
    global.db.data.users[userId].appInterests = {};
    Object.keys(INTEREST_KEYWORDS).forEach(category => {
      global.db.data.users[userId].appInterests[category] = 0;
    });
    global.db.data.users[userId].searchHistory = [];
  }
});

// Función para analizar texto y actualizar intereses
function updateUserInterests(userId, searchText) {
  const user = global.db.data.users[userId];
  
  if (!user.appInterests) {
    user.appInterests = {};
    Object.keys(INTEREST_KEYWORDS).forEach(category => {
      user.appInterests[category] = 0;
    });
  }
  
  if (!user.searchHistory) {
    user.searchHistory = [];
  }
  
  // Actualizar historial de búsqueda (mantener solo las últimas 10)
  user.searchHistory.unshift(searchText.toLowerCase());
  if (user.searchHistory.length > 10) {
    user.searchHistory = user.searchHistory.slice(0, 10);
  }
  
  // Analizar texto de búsqueda para identificar intereses
  const lowercaseText = searchText.toLowerCase();
  
  Object.keys(INTEREST_KEYWORDS).forEach(category => {
    // Comprobar si alguna palabra clave de la categoría está en el texto
    const matchingKeywords = INTEREST_KEYWORDS[category].filter(keyword => 
      lowercaseText.includes(keyword)
    );
    
    if (matchingKeywords.length > 0) {
      // Incrementar la puntuación de la categoría basado en las coincidencias
      user.appInterests[category] += matchingKeywords.length;
    }
  });
  
  // Guardar cambios
  global.db.data.users[userId] = user;
}

// Función para obtener recomendaciones personalizadas
async function getPersonalizedRecommendations(userId, limit = 5) {
  const user = global.db.data.users[userId];
  
  if (!user || !user.appInterests) {
    // Si no hay perfil de usuario, recomendar apps populares generales
    return getPopularApps(limit);
  }
  
  // Obtener las tres categorías con mayor puntuación
  const sortedInterests = Object.entries(user.appInterests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
  
  // Si no hay suficientes datos de interés, recomendar apps populares
  if (sortedInterests.length === 0 || sortedInterests[0][1] === 0) {
    return getPopularApps(limit);
  }
  
  try {
    // Buscar aplicaciones para cada categoría principal
    const recommendations = [];
    
    for (const category of sortedInterests) {
      if (recommendations.length >= limit) break;
      
      const appsToFetch = Math.ceil((limit - recommendations.length) / sortedInterests.length);
      const categoryApps = await searchAppsByCategory(category, appsToFetch);
      
      if (categoryApps && categoryApps.length > 0) {
        recommendations.push(...categoryApps);
      }
    }
    
    // Si no se encontraron suficientes recomendaciones, completar con apps populares
    if (recommendations.length < limit) {
      const remainingApps = await getPopularApps(limit - recommendations.length);
      recommendations.push(...remainingApps);
    }
    
    return recommendations.slice(0, limit);
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error);
    return getPopularApps(limit);
  }
}

// Función para buscar aplicaciones por categoría
async function searchAppsByCategory(category, limit = 3) {
  try {
    // Usar la API de HappyMod para buscar apps de la categoría
    const api = `https://dark-core-api.vercel.app/api/search/happymod?key=api&text=${category}`;
    const response = await fetch(api);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results.slice(0, limit);
    }
    
    return [];
  } catch (error) {
    console.error(`Error al buscar apps de la categoría ${category}:`, error);
    return [];
  }
}

// Función para obtener aplicaciones populares generales
async function getPopularApps(limit = 5) {
  try {
    // Búsqueda de términos populares como fallback
    const popularTerms = ['games', 'social', 'popular', 'tools', 'essential'];
    const randomTerm = popularTerms[Math.floor(Math.random() * popularTerms.length)];
    
    const api = `https://dark-core-api.vercel.app/api/search/happymod?key=api&text=${randomTerm}`;
    const response = await fetch(api);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results.slice(0, limit);
    }
    
    return [];
  } catch (error) {
    console.error('Error al obtener apps populares:', error);
    return [];
  }
}

// Manejador para comando de ver perfil de intereses
let handler = async (m, { conn, usedPrefix, command }) => {
  const userId = m.sender;
  const user = global.db.data.users[userId];
  
  if (!user || !user.appInterests) {
    return m.reply(`⚠️ Aún no tienes un perfil de intereses. Usa ${usedPrefix}happymod para buscar aplicaciones y crear tu perfil.`);
  }
  
  // Obtener categorías de interés ordenadas por puntuación
  const sortedInterests = Object.entries(user.appInterests)
    .sort((a, b) => b[1] - a[1]);
  
  // Crear mensaje con el perfil de intereses
  let profileText = `
╭━━━━━━━━━⬣
┃ 📱 *TU PERFIL DE INTERESES*
┃┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
┃ Basado en tus búsquedas, estos son
┃ tus intereses principales:
┃
`;

  // Mostrar las 5 categorías principales con estrellas basadas en puntuación
  sortedInterests.slice(0, 5).forEach(([category, score]) => {
    // Normalizar puntuación a un rango de 1-5 estrellas
    const stars = Math.min(5, Math.max(1, Math.ceil(score / 2)));
    const starsDisplay = '⭐'.repeat(stars);
    
    const categoryNames = {
      'gaming': '🎮 Juegos',
      'social': '👥 Redes Sociales',
      'productivity': '📊 Productividad',
      'education': '📚 Educación',
      'entertainment': '🎬 Entretenimiento',
      'tools': '🔧 Herramientas',
      'photography': '📷 Fotografía',
      'music': '🎵 Música',
      'health': '❤️ Salud',
      'communication': '💬 Comunicación'
    };
    
    profileText += `┃ ${categoryNames[category] || category}: ${starsDisplay}\n`;
  });
  
  profileText += `┃
┃ Búsquedas recientes:
┃ ${user.searchHistory.slice(0, 5).join(', ') || 'Ninguna'}
╰━━━━━━━━━⬣`;

  await m.reply(profileText);
  
  // Obtener y mostrar recomendaciones personalizadas
  m.reply('🔍 Buscando recomendaciones basadas en tu perfil...');
  
  try {
    const recommendations = await getPersonalizedRecommendations(userId);
    
    if (!recommendations || recommendations.length === 0) {
      return m.reply('❌ No se pudieron encontrar recomendaciones. Intenta buscar más aplicaciones primero.');
    }
    
    // Crear mensaje interactivo con las recomendaciones
    const interactiveMessage = {
      header: { title: '📱 Recomendaciones Personalizadas' },
      hasMediaAttachment: false,
      body: { text: `Basado en tu perfil, estas son algunas aplicaciones que podrían interesarte:` },
      nativeFlowMessage: {
        buttons: [
          {
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: 'Apps Recomendadas Para Ti',
              sections: [
                {
                  title: '📱 RECOMENDACIONES PERSONALIZADAS',
                  rows: recommendations.map((app, index) => ({
                    title: `${app.name}`,
                    description: `⭐ ${app.stars} - ${app.description.substring(0, 40)}...`,
                    id: `rec_app_${index}`
                  }))
                }
              ]
            })
          }
        ],
        messageParamsJson: JSON.stringify({
          recommended_apps: recommendations
        })
      }
    };

    const message = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: interactiveMessage
        }
      }
    }, {
      quoted: m
    });

    await conn.relayMessage(m.chat, message.message, { messageId: message.key.id });
    
    // Guardar recomendaciones para acceso posterior
    if (!global.appRecommendations) global.appRecommendations = {};
    global.appRecommendations[m.chat] = {
      apps: recommendations,
      timestamp: new Date().getTime()
    };
    
  } catch (error) {
    console.error('Error al mostrar recomendaciones:', error);
    m.reply('❌ Ocurrió un error al generar recomendaciones. Por favor intenta más tarde.');
  }
};

// Manejador para selección de aplicación recomendada
handler.before = async (m, { conn }) => {
  if (!m.message) return;
  
  const selectedId = m.message?.buttonsResponseMessage?.selectedButtonId || 
                     m.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
                     
  if (!selectedId || !selectedId.startsWith('rec_app_')) return;
  
  // Extraer el índice de la app seleccionada
  const index = parseInt(selectedId.split('_').pop());
  
  // Verificar si tenemos recomendaciones guardadas
  if (!global.appRecommendations || !global.appRecommendations[m.chat]) {
    return m.reply('⚠️ Las recomendaciones han expirado. Por favor solicita nuevas recomendaciones.');
  }
  
  // Verificar si las recomendaciones han expirado (más de 5 minutos)
  const now = new Date().getTime();
  if (now - global.appRecommendations[m.chat].timestamp > 5 * 60 * 1000) {
    delete global.appRecommendations[m.chat];
    return m.reply('⚠️ Las recomendaciones han expirado. Por favor solicita nuevas recomendaciones.');
  }
  
  // Obtener la app seleccionada
  const apps = global.appRecommendations[m.chat].apps;
  if (!apps || !apps[index]) {
    return m.reply('⚠️ No se encontró la aplicación seleccionada.');
  }
  
  const selectedApp = apps[index];
  
  // Mostrar detalles completos de la app seleccionada
  let detailText = `
╭━━━━━━━━━⬣
┃ 🍭 *App Recomendada Para Ti*
┃┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
┃ 📱 *Nombre:* 
┃ ${selectedApp.name}
┃┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
┃ ✏️ *Descripción:* 
┃ ${selectedApp.description}
┃┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
┃ ⭐ *Valoración:* ${selectedApp.stars}
┃┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
┃ 📎 *Link de Descarga:* 
┃ ${selectedApp.link}
╰━━━━━━━━━⬣`;

  await conn.sendMessage(m.chat, { image: { url: selectedApp.image }, caption: detailText }, { quoted: m });
  
  return true; // Marcar como manejado
};

// Interceptar búsquedas de happymod para actualizar perfil de intereses
const originalHappymodHandler = global.plugins.find(p => 
  p.help && p.help.includes && (
    p.help.includes('happymod') || 
    p.help.includes('happymodsearch') || 
    p.help.includes('hpmodsearch')
  )
);

if (originalHappymodHandler && originalHappymodHandler.handler) {
  const originalFunction = originalHappymodHandler.handler;
  
  originalHappymodHandler.handler = async (m, ctx) => {
    // Llamar al manejador original
    const result = await originalFunction(m, ctx);
    
    // Actualizar perfil de intereses si hay texto de búsqueda
    if (ctx.text && m.sender) {
      updateUserInterests(m.sender, ctx.text);
    }
    
    return result;
  };
}

handler.help = ['appperfil', 'intereses', 'misapps'];
handler.tags = ['tools'];
handler.command = /^(appperfil|intereses|misapps|recomendaciones)$/i;

export default handler;