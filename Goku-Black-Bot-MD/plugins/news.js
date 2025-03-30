import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const url = 'https://real-time-news-data.p.rapidapi.com/topic-news-by-section?topic=TECHNOLOGY&section=CAQiSkNCQVNNUW9JTDIwdk1EZGpNWFlTQldWdUxVZENHZ0pKVENJT0NBUWFDZ29JTDIwdk1ETnliSFFxQ2hJSUwyMHZNRE55YkhRb0FBKi4IACoqCAoiJENCQVNGUW9JTDIwdk1EZGpNWFlTQldWdUxVZENHZ0pKVENnQVABUAE&limit=500&country=US&lang=en';

    try {
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'real-time-news-data.p.rapidapi.com',
                'x-rapidapi-key': '4e92d111abmshcb213e2d41c45b4p115ab7jsneb6fa354bf45'
            }
        });

        let data = await response.json();

        if (!data.data || data.data.length === 0) {
            await conn.sendMessage(m.chat, { text: "📰 No se encontraron noticias recientes." });
            return;
        }

        let noticias = data.data.slice(0, 5); // Solo las primeras 5 noticias
        let newsText = "📰 *Últimas Noticias del Día:*\n\n";

        noticias.forEach((noticia, index) => {
            newsText += `📌 *${noticia.title}*\n🔗 ${noticia.link}\n🗞️ *Fuente:* ${noticia.source_name}\n📅 ${new Date(noticia.published_datetime_utc).toLocaleString()}\n\n`;
        });

        await conn.sendMessage(m.chat, { text: newsText });
    } catch (err) {
        await conn.sendMessage(m.chat, { text: "📰 ❌ Error al obtener las noticias." });
    }
}

handler.help = ['news']
handler.tags = ['información']
handler.command = ['news', 'noticias']
handler.estrellas = 20
handler.register = true
handler.group = true

export default handler;