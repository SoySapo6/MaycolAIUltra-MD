import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, usedPrefix, command }) => {
    if (global.conn.user.jid !== m.sender) {
        return m.reply('Este comando solo puede ser usado en el bot principal.');
    }
    const pathJadiBot = path.join(`./${global.jadi}`);
    if (!fs.existsSync(pathJadiBot)) {
        return m.reply('No se encontraron SubBots. El directorio `jadibots` no existe.');
    }
    const subbots = fs.readdirSync(pathJadiBot);
    if (subbots.length === 0) {
        return m.reply('No hay SubBots para eliminar.');
    }

    let message = 'Lista de SubBots. Responda con el número del SubBot que desea eliminar.

';
    subbots.forEach((bot, index) => {
        message += `${index + 1}. ${bot}
`;
    });
    message += '
Responda a este mensaje con el número del bot a eliminar. Tienes 30 segundos.';

    await conn.sendMessage(m.chat, { text: message }, { quoted: m }).then(() => {
        conn.deleteBot = conn.deleteBot || {};
        conn.deleteBot[m.chat] = {
            list: subbots,
            message: m,
            timeout: setTimeout(() => {
                m.reply('Se acabó el tiempo.');
                delete conn.deleteBot[m.chat];
            }, 30000)
        };
    });
};

handler.before = async (m, { conn }) => {
    conn.deleteBot = conn.deleteBot || {};
    if (!m.quoted || !m.quoted.fromMe || !m.quoted.text) return;
    if (!m.text.match(/^[0-9]+$/)) return;

    const context = conn.deleteBot[m.chat];
    if (!context) return;

    const choice = parseInt(m.text) - 1;
    if (choice < 0 || choice >= context.list.length) {
        return m.reply('Número inválido. Por favor, elija un número de la lista.');
    }

    const botId = context.list[choice];
    const botPath = path.join(`./${global.jadi}/`, botId);

    try {
        fs.rmSync(botPath, { recursive: true, force: true });
        m.reply(`La sesión del SubBot ${botId} ha sido eliminada.`);
        // Also disconnect the sub-bot if it's currently running
        const subBotConnection = global.conns.find(c => c.user?.id.startsWith(botId));
        if (subBotConnection) {
            subBotConnection.ws.close();
        }
    } catch (e) {
        m.reply(`Error al eliminar la sesión del SubBot: ${e.message}`);
    } finally {
        clearTimeout(context.timeout);
        delete conn.deleteBot[m.chat];
    }
};

handler.help = ['deletebot'];
handler.tags = ['owner'];
handler.command = /^(deletebot|eliminarsesion)$/i;
handler.owner = true;

export default handler;
