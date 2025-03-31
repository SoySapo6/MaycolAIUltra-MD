import { createHash } from 'crypto'
import PhoneNumber from 'awesome-phonenumber'
import { promises as fs } from 'fs'
import fetch from 'node-fetch'
import moment from 'moment-timezone'

let handler = async (m, { conn, usedPrefix, command, text, args, isOwner }) => {
  // Solo permitir acceso al owner
  if (!isOwner) return conn.reply(m.chat, '❌ *Este menú es exclusivo para el creador del bot*', m)
  
  // Obtener datos del usuario
  let user = global.db.data.users[m.sender]
  let name = await conn.getName(m.sender)
  let pp = await conn.profilePictureUrl(m.sender, 'image').catch(_ => './Menu.jpg')
  let { premium, level, limit, exp, lastclaim, registered, regTime, age } = global.db.data.users[m.sender]
  
  // Preparar información de fecha y tiempo
  let time = moment.tz('America/Lima').format('HH:mm:ss')
  let date = moment.tz('America/Lima').format('DD/MM/YYYY')
  
  // Personalización del menú
  let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length
  let more = String.fromCharCode(8206)
  let readMore = more.repeat(850)
  
  // Caracteres especiales para decoración
  let titleBot = '🌟 𝙼𝙴𝙽𝚄 𝙴𝚇𝙲𝙻𝚄𝚂𝙸𝚅𝙾 𝙳𝙴𝙻 𝚂𝚃𝙰𝙵𝙵 🌟'
  let sectionTitle = '┏━━━━━━━━━━━━━━━┓'
  let sectionEnd = '┗━━━━━━━━━━━━━━━┛'
  let lineStart = '┃ ➤ '
  let special = '꧁༺♛༻꧂'
  
  // Crear el mensaje del menú con los 70 comandos
  let menu = `${special} ${titleBot} ${special}
  
⋆⁺₊⋆ ⋆⁺₊⋆ ⋆⁺₊⋆ ⋆⁺₊⋆ ⋆⁺₊⋆ ⋆⁺₊⋆ ⋆⁺₊⋆
👑 𝐎𝐖𝐍𝐄𝐑: ${name}
⌚ 𝐇𝐎𝐑𝐀: ${time}
📅 𝐅𝐄𝐂𝐇𝐀: ${date}
🌍 𝐔𝐒𝐔𝐀𝐑𝐈𝐎𝐒: ${rtotalreg}
⋆⁺₊⋆ ⋆⁺₊⋆ ⋆⁺₊⋆ ⋆⁺₊⋆ ⋆⁺₊⋆ ⋆⁺₊⋆ ⋆⁺₊⋆
${readMore}

${sectionTitle}
     🔒 GESTIÓN DEL BOT 🔒
${sectionEnd}

${lineStart}${usedPrefix}modo publico
${lineStart}${usedPrefix}modo privado
${lineStart}${usedPrefix}autoadmin
${lineStart}${usedPrefix}setppbot
${lineStart}${usedPrefix}setprefix <prefijo>
${lineStart}${usedPrefix}resetprefix
${lineStart}${usedPrefix}autoread <on/off>
${lineStart}${usedPrefix}ban @usuario
${lineStart}${usedPrefix}unban @usuario
${lineStart}${usedPrefix}banlist
${lineStart}${usedPrefix}cleartmp
${lineStart}${usedPrefix}restart
${lineStart}${usedPrefix}update
${lineStart}${usedPrefix}backup

${sectionTitle}
     ⚙️ CONFIGURACIÓN ⚙️
${sectionEnd}

${lineStart}${usedPrefix}settextmenu <texto>
${lineStart}${usedPrefix}settextowner <texto>
${lineStart}${usedPrefix}setbotname <nombre>
${lineStart}${usedPrefix}setbotbio <texto>
${lineStart}${usedPrefix}setwelcome <texto>
${lineStart}${usedPrefix}setbye <texto>
${lineStart}${usedPrefix}setprofilebot <imagen>
${lineStart}${usedPrefix}setthumb <imagen>
${lineStart}${usedPrefix}setfakeimg <imagen>
${lineStart}${usedPrefix}sethttps <on/off>
${lineStart}${usedPrefix}setapikey <key>
${lineStart}${usedPrefix}resetapikey
${lineStart}${usedPrefix}getapikey

${sectionTitle}
     💾 BASE DE DATOS 💾
${sectionEnd}

${lineStart}${usedPrefix}resetuser @usuario
${lineStart}${usedPrefix}resetalldb
${lineStart}${usedPrefix}getdb
${lineStart}${usedPrefix}setdb
${lineStart}${usedPrefix}addprem @usuario <días>
${lineStart}${usedPrefix}delprem @usuario
${lineStart}${usedPrefix}listprem
${lineStart}${usedPrefix}resetprem
${lineStart}${usedPrefix}addxp @usuario <cantidad>
${lineStart}${usedPrefix}addlimit @usuario <cantidad>
${lineStart}${usedPrefix}resetlimit @usuario

${sectionTitle}
     📊 ESTADÍSTICAS 📊
${sectionEnd}

${lineStart}${usedPrefix}stats
${lineStart}${usedPrefix}botstat
${lineStart}${usedPrefix}checkapi
${lineStart}${usedPrefix}totalmsgs
${lineStart}${usedPrefix}actividad
${lineStart}${usedPrefix}checkserver
${lineStart}${usedPrefix}infobot
${lineStart}${usedPrefix}speedtest

${sectionTitle}
     🔄 GRUPOS & DIFUSIÓN 🔄
${sectionEnd}

${lineStart}${usedPrefix}promote @usuario
${lineStart}${usedPrefix}demote @usuario
${lineStart}${usedPrefix}grouplist
${lineStart}${usedPrefix}setgroupname <texto>
${lineStart}${usedPrefix}setgroupdesc <texto>
${lineStart}${usedPrefix}resetlink
${lineStart}${usedPrefix}todos <texto>
${lineStart}${usedPrefix}kickall
${lineStart}${usedPrefix}grupo close/open
${lineStart}${usedPrefix}bc <texto>
${lineStart}${usedPrefix}bcgc <texto>
${lineStart}${usedPrefix}bcbot <texto>
${lineStart}${usedPrefix}joinall <grupos>

${sectionTitle}
     🔍 AVANZADO 🔍
${sectionEnd}

${lineStart}${usedPrefix}addcmd <texto> <respuesta>
${lineStart}${usedPrefix}delcmd <texto>
${lineStart}${usedPrefix}listcmd
${lineStart}${usedPrefix}exec <código>
${lineStart}${usedPrefix}eval <código>
${lineStart}${usedPrefix}terminal <comando>
${lineStart}${usedPrefix}readqr <imagen>
${lineStart}${usedPrefix}createqr <texto>
${lineStart}${usedPrefix}translate <lang> <texto>
${lineStart}${usedPrefix}fetch <url>

✧ *Estos comandos son exclusivos del creador*
✧ *Su mal uso puede causar inestabilidad*

${special} *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʏᴄᴏʟᴀɪᴜʟᴛʀᴀ-ᴍᴅ* ${special}`

  // Usar la API de WhatsApp para un mensaje con formato avanzado
  const pp2 = './Goku-Black-Bot-MD/menuowner.gif'
  
  // Enviamos el menú con un mensaje elegante
  await conn.sendMessage(m.chat, {
    video: { url: pp2 },
    caption: menu,
    gifPlayback: true,
    gifAttribution: 2,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: `👑 MENÚ EXCLUSIVO STAFF 👑`,
        body: `🛡️ COMANDOS ESPECIALES`,
        thumbnailUrl: pp,
        sourceUrl: 'https://whatsapp.com/channel/0029VayXJte65yD6LQGiRB0R',
        mediaType: 1,
        renderLargerThumbnail: true,
        showAdAttribution: true
      }
    }
  }, { quoted: m })
}

handler.help = ['menuowner', 'ownermenu', 'staffmenu']
handler.tags = ['owner']
handler.command = /^(menuowner|ownermenu|staffmenu)$/i
handler.owner = true

export default handler