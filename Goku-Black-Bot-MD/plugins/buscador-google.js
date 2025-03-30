import axios from 'axios';
import cheerio from 'cheerio';

const googleSearch = async (query) => {
  try {
    const { data } = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
    const $ = cheerio.load(data);
    
    const results = [];

    $('div.g').each((index, element) => {
      const title = $(element).find('h3').text();
      const link = $(element).find('a').attr('href');
      const snippet = $(element).find('span.aCOpRe').text();
      
      if (title && link) {
        results.push({
          title,
          link,
          snippet
        });
      }
    });

    return results;
  } catch (error) {
    throw new Error("Error al realizar la búsqueda en Google: " + error.message);
  }
};

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) return conn.reply(m.chat, `🚩 Ingrese un término de búsqueda\n\nEjemplo:\n> *${usedPrefix + command}* café`, m, rcanal);

  await m.react('🕓');
  try {
    const results = await googleSearch(args.join(' '));
    
    if (results.length === 0) {
      return conn.reply(m.chat, 'No se encontraron resultados.', m);
    }

    let txt = '`乂  B Ú S Q U E  -  G O O G L E`\n\n';
    results.forEach((item) => {
      txt += `✩  *Título*: ${item.title}\n`;
      txt += `   *Enlace*: ${item.link}\n`;
      txt += `   *Descripción*: ${item.snippet || 'Sin descripción'}\n\n`;
    });

    await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
    await m.react('✅');
  } catch (error) {
    await conn.reply(m.chat, error.message, m);
    await m.react('✖️');
  }
};

handler.help = ['google *<término>*'];
handler.tags = ['search'];
handler.command = ['google'];
handler.register = true;

export default handler;