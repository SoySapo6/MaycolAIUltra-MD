let handler = async (m, { conn, command, usedPrefix }) => {
let staff = `🚩 *EQUIPO DE AYUDANTES*
🍟 *Bot:* ${global.botname}
✨️ *Versión:* ${global.vs}

👑 *Propietario:*

• Ivan
🍟 *Rol:* Propietario
🚩 *Número:* wa.me/595972157130
✨️ *GitHub:* https://github.com/Eliasivan

🌸  *Colaboradores:*

• Dioneibi
🍟 *Rol:* Developer
🚩 *Número:* Wa.me/18294868853

• Jose Mods
🍟 *Rol:* Developer
🚩 *Número:* Wa.me/51950148255`

await conn.sendFile(m.chat, icons, 'yaemori.jpg', staff.trim(), fkontak, true, {
contextInfo: {
'forwardingScore': 200,
'isForwarded': false,
externalAdReply: {
showAdAttribution: true,
renderLargerThumbnail: false,
title: `🥷 Developers 👑`,
body: `🚩 Staff Oficial`,
mediaType: 1,
sourceUrl: redes,
thumbnailUrl: icono
}}
}, { mentions: m.sender })
m.react(emoji)

}
handler.help = ['staff']
handler.command = ['colaboradores', 'staff']
handler.register = true
handler.tags = ['main']

export default handler
