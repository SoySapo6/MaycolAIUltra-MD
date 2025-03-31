import fs from 'fs'

let handler = async (m, { conn, usedPrefix }) => {
  // Verificar si es el owner (número específico 51921826291 o owner general)
  const isDueño = m.sender === '51921826291@s.whatsapp.net' || global.owner.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
  if (!isDueño) return conn.reply(m.chat, '❌ *Este comando solo puede ser utilizado por el dueño del bot*', m)
  
  // Ruta al archivo GIF
  const ownerGif = './menuowner.gif'
  
  // Verificar si existe el GIF personalizado
  const useCustomGif = fs.existsSync(ownerGif)
  
  // Texto del menú
  let text = `
╭━━━━━━━━━━━━━━━╮
┃ ╭━━━━━━━━━━━━╮
┃ ┃ *🌌 𝙼𝙴𝙽𝚄 𝙾𝚆𝙽𝙴𝚁 🌌*
┃ ╰━━━━━━━━━━━━╯
╰━━━━━━━━━━━━━━━╯

*👑 EXCLUSIVO PARA:* @${global.owner[0]}

╭━━━━━━━━━━━━━━━╮
┃ ╭━━━━━━━━━━━━╮
┃ ┃ *ℹ️ INFORMACIÓN*
┃ ╰━━━━━━━━━━━━╯
┃ • ${usedPrefix}infobot
┃ • ${usedPrefix}actividad
┃ • ${usedPrefix}checkserver
┃ • ${usedPrefix}checkapi
┃ • ${usedPrefix}grouplist
╰━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━╮
┃ ╭━━━━━━━━━━━━╮
┃ ┃ *⚙️ CONFIGURACIÓN*
┃ ╰━━━━━━━━━━━━╯
┃ • ${usedPrefix}setbotname
┃ • ${usedPrefix}setbotbio
┃ • ${usedPrefix}setprefix
┃ • ${usedPrefix}resetprefix
┃ • ${usedPrefix}setwelcome
┃ • ${usedPrefix}setbye
┃ • ${usedPrefix}settextmenu
┃ • ${usedPrefix}settextowner
┃ • ${usedPrefix}setdbname
┃ • ${usedPrefix}setfakeimg
┃ • ${usedPrefix}setapikey
┃ • ${usedPrefix}resetapikey
┃ • ${usedPrefix}getapikey
┃ • ${usedPrefix}autoread <on/off>
╰━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━╮
┃ ╭━━━━━━━━━━━━╮
┃ ┃ *🗄️ BASE DE DATOS*
┃ ╰━━━━━━━━━━━━╯
┃ • ${usedPrefix}getdb
┃ • ${usedPrefix}backup
┃ • ${usedPrefix}resetuser
┃ • ${usedPrefix}resetalldb
┃ • ${usedPrefix}addxp
┃ • ${usedPrefix}addlimit
┃ • ${usedPrefix}resetlimit
┃ • ${usedPrefix}addprem
┃ • ${usedPrefix}delprem
┃ • ${usedPrefix}listprem
┃ • ${usedPrefix}ban
┃ • ${usedPrefix}unban
┃ • ${usedPrefix}banlist
╰━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━╮
┃ ╭━━━━━━━━━━━━╮
┃ ┃ *👥 GRUPOS*
┃ ╰━━━━━━━━━━━━╯
┃ • ${usedPrefix}promote | promover
┃ • ${usedPrefix}demote | degradar
┃ • ${usedPrefix}setgroupname | setname
┃ • ${usedPrefix}setgroupdesc | setdesc
┃ • ${usedPrefix}resetlink | resetgrouplink
┃ • ${usedPrefix}grupo <open/close>
┃ • ${usedPrefix}kickall
┃ • ${usedPrefix}todos | tagall
┃ • ${usedPrefix}totalmsgs
┃ • ${usedPrefix}join
┃ • ${usedPrefix}joinall
┃ • ${usedPrefix}bcgc
┃ • ${usedPrefix}bcbot
╰━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━╮
┃ ╭━━━━━━━━━━━━╮
┃ ┃ *🔧 AVANZADO*
┃ ╰━━━━━━━━━━━━╯
┃ • ${usedPrefix}addcmd
┃ • ${usedPrefix}delcmd
┃ • ${usedPrefix}listcmd
┃ • ${usedPrefix}eval
┃ • ${usedPrefix}readqr
┃ • ${usedPrefix}createqr
┃ • ${usedPrefix}translate
┃ • ${usedPrefix}fetch
╰━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━╮
┃ ╭━━━━━━━━━━━━╮
┃ ┃ *💻 SISTEMA*
┃ ╰━━━━━━━━━━━━╯
┃ • ${usedPrefix}cmd
┃ • ${usedPrefix}update
┃ • ${usedPrefix}restart
┃ • ${usedPrefix}cleartmp
┃ • ${usedPrefix}cleartemp
┃ • ${usedPrefix}clearallsessions
┃ • ${usedPrefix}getfile
┃ • ${usedPrefix}getplugin
╰━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━╮
┃ ╭━━━━━━━━━━━━╮
┃ ┃ *🔎 COMANDO BUSCAR*
┃ ╰━━━━━━━━━━━━╯
┃ Para buscar un comando,
┃ usa:
┃ *${usedPrefix}listcmd <texto>*
╰━━━━━━━━━━━━━━━╯

_Un total de 70 comandos exclusivos_
_⚠️ Usar con responsabilidad_
`
  
  // Enviar mensaje con GIF o imagen por defecto
  if (useCustomGif) {
    await conn.sendMessage(m.chat, {
      video: fs.readFileSync(ownerGif),
      caption: text,
      gifPlayback: true,
      mentions: [global.owner[0] + '@s.whatsapp.net']
    }, { quoted: m })
  } else {
    // Si no hay GIF, enviar como mensaje normal
    await conn.sendMessage(m.chat, {
      text,
      mentions: [global.owner[0] + '@s.whatsapp.net']
    }, { quoted: m })
  }
}

handler.help = ['ownermenu', 'menuowner']
handler.tags = ['owner']
handler.command = /^(ownermenu|menuowner)$/i

export default handler