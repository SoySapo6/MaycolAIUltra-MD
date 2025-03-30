import { promises as fs } from 'fs';

const charactersFilePath = './src/JSON/characters.json';

const cooldowns = {};

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error('❀ No se pudo cargar el archivo characters.json.');
    }
}

async function saveCharacters(characters) {
    try {
        await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8');
    } catch (error) {
        throw new Error('❀ No se pudo guardar el archivo characters.json.');
    }
}

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    // Verificar cooldown
    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remainingTime = Math.ceil((cooldowns[userId] - now) / 1000);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        return await conn.reply(m.chat, `𝑫𝑬𝑩𝑬𝑺 𝑬𝑺𝑷𝑬𝑹𝑨𝑹 *${minutes} 𝑴𝑰𝑵𝑼𝑻𝑶𝑺 𝒀 ${seconds} 𝑺𝑬𝑮𝑼𝑵𝑫𝑶* 𝑷𝑨𝑹𝑨 𝑼𝑺𝑨𝑹 *#ⓋⒺⓇ* 𝐷𝐸 𝑁𝑈𝐸𝑉𝑂＼（＠￣∇￣＠）／...`, m);
    }

    try {
        const characters = await loadCharacters();
        const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
        const randomImage = randomCharacter.url; // Asegúrate de que esto esté correcto

        const statusMessage = randomCharacter.user
            ? `Reclamado por @${randomCharacter.user.split('@')[0]}` 
            : 'Libre';

        const message = `Nombre » *${randomCharacter.name}*
❃ Valor » *${randomCharacter.value}*
₰ Estado » ${statusMessage}*
𝗕𝗬:𝗚𝗢𝗞𝗨-𝗕𝗟𝗔𝗖𝗞-𝗕𝗢𝗧-𝗠𝗗`; // Manejo de ID

        await conn.sendFile(m.chat, randomImage, `${randomCharacter.name}.jpg`, message, m);

        // Asignar usuario si está libre
        if (!randomCharacter.user) {
            randomCharacter.user = userId;
            await saveCharacters(characters);
        }

        cooldowns[userId] = now + 60 * 1000; // 1 minuto de cooldown

    } catch (error) {
        await conn.reply(m.chat, `✘ Error al cargar el personaje: ${error.message}`, m);
    }
};

handler.help = ['rb'];
handler.tags = ['rb'];
handler.command = ['rb'];

export default handler;