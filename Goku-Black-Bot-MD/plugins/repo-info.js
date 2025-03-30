import fetch from 'node-fetch';

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        let Codes = '`📂  I N F O R M A C I Ó N  D E L  B O T`\n\n';
        Codes += `    ✩  *NOMBRE DEL BOT* : MaycolAIUltra-MD\n`;
        Codes += `    ✩  *CREADOR* : SoyMaycol\n`;
        Codes += `    ✩  *NÚMERO DE CONTACTO* : +51 921 826 291\n`;
        Codes += `    ✩  *CANAL DE WHATSAPP* : https://whatsapp.com/channel/0029VayXJte65yD6LQGiRB0R\n`;
        Codes += `    ✩  *TEMA* : Hanako Kun Anime\n`;
        Codes += `    ✩  *DESCRIPCIÓN* : Bot de WhatsApp con funciones avanzadas e inteligencia artificial\n\n`;
        Codes += `*¡Gracias por usar MaycolAIUltra-MD!*\n\n`;
        Codes += `> *Creado por SoyMaycol*`;

        await conn.sendMessage(m.chat, {
            image: { url: 'https://i.postimg.cc/k59W5ZDT/descarga-5.jpg' },
            caption: Codes,
            contextInfo: { 
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363276986902836@newsletter',
                    newsletterName: 'Power by SoyMaycol',
                    serverMessageId: 143
                }
            }
        }, { quoted: m });

    } catch (error) {
        await conn.reply(m.chat, "Lo siento, ocurrió un error al obtener la información del repositorio. Por favor, intenta de nuevo más tarde.", m);
    }
}

handler.tags = ['info'];
handler.help = ['repo', 'sc', 'script', 'info'];
handler.command = ['repo', 'sc', 'script', 'info'];
handler.register = true;

export default handler;