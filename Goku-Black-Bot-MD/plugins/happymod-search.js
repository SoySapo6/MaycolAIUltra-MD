import fetch from 'node-fetch';
import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

let handler = async(m, { conn, text, usedPrefix, command }) => {

  if (!text) return m.reply(`📩 Ingresa Un Texto Para Buscar En Happy Mod\n> Ejemplo: ${usedPrefix + command} Minecraft`);

  try {
    let api = `https://dark-core-api.vercel.app/api/search/happymod?key=api&text=${text}`;
    
    let response = await fetch(api);
    let json = await response.json();
    let results = json.results;
    
    if (!results || results.length === 0) {
      return m.reply(`🍭 No Encontramos Resultados Para : ${text}`);
    }
    
    m.react('🕑');
    
    // Limitamos los resultados a un máximo de 10 para que la lista no sea muy larga
    const maxResults = Math.min(results.length, 10);
    results = results.slice(0, maxResults);
    
    try {
      // Creamos la lista interactiva con los resultados
      const interactiveMessage = {
        header: { title: '🔍 Resultados de HappyMod' },
        hasMediaAttachment: false,
        body: { text: `Encontré ${results.length} aplicaciones para: "${text}"\nSelecciona una para ver más detalles:` },
        nativeFlowMessage: {
          buttons: [
            {
              name: 'single_select',
              buttonParamsJson: JSON.stringify({
                title: 'Aplicaciones Encontradas',
                sections: [
                  {
                    title: '📱 APPS DISPONIBLES',
                    rows: results.map((app, index) => ({
                      title: `${app.name}`,
                      description: `⭐ ${app.stars} - ${app.description.substring(0, 40)}...`,
                      id: `happymod_result_${index}`
                    }))
                  }
                ]
              })
            }
          ],
          messageParamsJson: JSON.stringify({
            happymod_results: results
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
      
      // Guardamos los resultados en memoria para poder acceder a ellos cuando el usuario elija uno
      if (!global.happymod) global.happymod = {};
      global.happymod[m.chat] = {
        results: results,
        timestamp: new Date().getTime()
      };
      
      m.react('✅');
    } catch (listError) {
      console.error('Error al crear lista interactiva:', listError);
      
      // En caso de error, mostrar el primer resultado como fallback
      let firstApp = results[0];
      let txt = `🍭 *Título:* ${firstApp.name}\n✏️ *Descripción:* ${firstApp.description}\n🌟 *Estrellas:* ${firstApp.stars}\n📎 *Link:* ${firstApp.link}`;
      
      conn.sendMessage(m.chat, { image: { url: firstApp.image }, caption: txt }, { quoted: m });
    }
  } catch (e) {
    m.reply(`Error: ${e.message}`);
    m.react('✖️');
  }
}

// Manejador para cuando el usuario selecciona una app de la lista
handler.before = async (m, { conn }) => {
  if (!m.message) return;
  
  const selectedId = m.message?.buttonsResponseMessage?.selectedButtonId || 
                     m.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
                     
  if (!selectedId || !selectedId.startsWith('happymod_result_')) return;
  
  // Extraer el índice del resultado seleccionado
  const index = parseInt(selectedId.split('_').pop());
  
  // Verificar si tenemos los resultados guardados
  if (!global.happymod || !global.happymod[m.chat]) {
    return m.reply('⚠️ Los resultados han expirado. Por favor realiza una nueva búsqueda.');
  }
  
  // Verificar si el resultado ha expirado (más de 5 minutos)
  const now = new Date().getTime();
  if (now - global.happymod[m.chat].timestamp > 5 * 60 * 1000) {
    delete global.happymod[m.chat];
    return m.reply('⚠️ Los resultados han expirado. Por favor realiza una nueva búsqueda.');
  }
  
  // Obtener el resultado seleccionado
  const results = global.happymod[m.chat].results;
  if (!results || !results[index]) {
    return m.reply('⚠️ No se encontró el resultado seleccionado.');
  }
  
  const selectedApp = results[index];
  
  // Mostrar detalles completos de la app seleccionada
  let detailText = `
╭━━━━━━━━━⬣
┃ 🍭 *HappyMod - App Mod*
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

handler.command = ['happymod', 'happymodsearch', 'hpmodsearch'];

export default handler;