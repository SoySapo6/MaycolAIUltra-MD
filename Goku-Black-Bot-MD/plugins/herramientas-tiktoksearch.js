import fetch from 'node-fetch';

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(m.chat, `🚩 Ingrese una consulta para buscar videos en TikTok.\n\nEjemplo:\n> *${usedPrefix + command}* NinoNakanoEdits`, m, rcanal);
  }

  await m.react('🕓');
  try {
    const res = await fetch(`https://api.agungny.my.id/api/tiktok-search?q=${encodeURIComponent(text)}`);
    const json = await res.json();

    if (!json.status || !json.result || !json.result.videos.length) {
      await m.react('✖️');
      return await conn.reply(m.chat, 'No se encontraron resultados para esta búsqueda.', m);
    }

    let txt = `*乂 T I K T O K - B U S C A R*\n\n`;
    
    json.result.videos.forEach(video => {
      txt += `✩ *Título* : ${video.title || 'Sin título'}\n`;
      txt += `✩ *ID del Video* : ${video.video_id}\n`;
      txt += `✩ *Región* : ${video.region}\n`;
      txt += `✩ *Duración* : ${video.duration} segundos\n`;
      txt += `✩ *Reproducciones* : ${video.play_count}\n`;
      txt += `✩ *Likes* : ${video.digg_count}\n`;
      txt += `✩ *Comentarios* : ${video.comment_count}\n`;
      txt += `✩ *Compartidos* : ${video.share_count}\n`;
      txt += `✩ *Descargas* : ${video.download_count}\n`;
      txt += `✩ *Tamaño* : ${video.size} bytes\n`;
      txt += `✩ *Música* : ${video.music_info.title || 'Sin música'}\n`;
      txt += `✩ *Autor de Música* : ${video.music_info.author || 'Desconocido'}\n`;
      txt += `✩ *URL del Video* : https://www.tiktok.com/@${video.author.unique_id}/video/${video.video_id}\n\n`;
      txt += `✩ *Avatar* : https://www.tiktok.com${video.author.avatar}\n\n`; 
    });

    await conn.reply(m.chat, txt, m, rcanal);
    await m.react('✅');
  } catch (error) {
    console.error(error);
    await m.react('✖️');
    await conn.reply(m.chat, 'Hubo un error al procesar la solicitud. Intenta de nuevo más tarde.', m);
  }
};

handler.help = ['tiktoksearch <consulta>'];
handler.tags = ['tools'];
handler.command = ['tiktoksearch', 'buscarTikTok', 'ttsearch'];
handler.register = true;

export default handler;