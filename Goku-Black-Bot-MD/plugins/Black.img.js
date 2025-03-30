import axios from 'axios';

const handler = async (m, { conn, args }) => {
    if (!args[0]) {
        await conn.reply(m.chat, '✨ Por favor proporciona una descripción para generar la imagen.', m);
        return;
    }

    const prompt = args.join(' ');
    const apiUrl = `https://api.dorratz.com/v3/ai-image?prompt=${prompt}`;

    try {
        conn.reply(m.chat, '*🧧 Espere un momento...*', m);
await m.react('🕓');
        const response = await axios.get(apiUrl);

        if (response.data && response.data.data && response.data.data.image_link) {
            const imageUrl = response.data.data.image_link;

            await conn.sendMessage(m.chat, { image: { url: imageUrl } }, { quoted: m });
        } else {
            throw new Error('No se encontró la imagen en la respuesta.');
        }
    } catch (error) {
        console.error('Error al generar la imagen:', error);
        await conn.reply(m.chat,`${error}`, m);
    }
};

handler.command = ['dalle'];
handler.help = ['dalle'];
handler.tags = ['tools'];

export default handler;