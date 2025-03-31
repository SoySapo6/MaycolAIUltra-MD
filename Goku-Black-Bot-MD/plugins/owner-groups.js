import { areJidsSameUser } from '@whiskeysockets/baileys'

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
  // Verificar si es el owner (número específico 51921826291 o owner general)
  const isDueño = m.sender === '51921826291@s.whatsapp.net' || isOwner
  if (!isDueño) return conn.reply(m.chat, '❌ *Este comando solo puede ser utilizado por el dueño del bot*', m)
  
  switch (command) {
    case 'promote':
    case 'promover':
      if (!m.isGroup) return m.reply('⚠️ *Este comando solo puede usarse en grupos*')
      
      // Verificar permisos
      const botAdmin = await isBotAdmin(m.chat, conn)
      if (!botAdmin) return m.reply('❌ *Error: El bot debe ser administrador del grupo*')
      
      // Obtener usuarios a promover
      let users = m.mentionedJid.filter(u => !areJidsSameUser(u, conn.user.id))
      if (!users.length) {
        if (m.quoted && !areJidsSameUser(m.quoted.sender, conn.user.id)) users = [m.quoted.sender]
        else return m.reply(`*Uso correcto:*\n${usedPrefix + command} @usuario\n\nO responde a un mensaje con ${usedPrefix + command}`)
      }
      
      // Promover usuarios
      for (const user of users) {
        await conn.groupParticipantsUpdate(m.chat, [user], "promote")
          .catch(console.error)
      }
      
      const userText = users.map(u => '@' + u.split('@')[0]).join(', ')
      m.reply(`✅ *Usuario(s) promovido(s) a admin:*\n${userText}`, null, {
        mentions: users
      })
      break
      
    case 'demote':
    case 'degradar':
      if (!m.isGroup) return m.reply('⚠️ *Este comando solo puede usarse en grupos*')
      
      // Verificar permisos
      const botAdmin2 = await isBotAdmin(m.chat, conn)
      if (!botAdmin2) return m.reply('❌ *Error: El bot debe ser administrador del grupo*')
      
      // Obtener usuarios a degradar
      let dUsers = m.mentionedJid.filter(u => !areJidsSameUser(u, conn.user.id))
      if (!dUsers.length) {
        if (m.quoted && !areJidsSameUser(m.quoted.sender, conn.user.id)) dUsers = [m.quoted.sender]
        else return m.reply(`*Uso correcto:*\n${usedPrefix + command} @usuario\n\nO responde a un mensaje con ${usedPrefix + command}`)
      }
      
      // Degradar usuarios
      for (const user of dUsers) {
        await conn.groupParticipantsUpdate(m.chat, [user], "demote")
          .catch(console.error)
      }
      
      const dUserText = dUsers.map(u => '@' + u.split('@')[0]).join(', ')
      m.reply(`✅ *Usuario(s) degradado(s):*\n${dUserText}`, null, {
        mentions: dUsers
      })
      break
      
    case 'setgroupname':
    case 'setname':
      if (!m.isGroup) return m.reply('⚠️ *Este comando solo puede usarse en grupos*')
      
      // Verificar permisos
      const botAdmin3 = await isBotAdmin(m.chat, conn)
      if (!botAdmin3) return m.reply('❌ *Error: El bot debe ser administrador del grupo*')
      
      if (!args[0]) return m.reply(`*Uso correcto:*\n${usedPrefix + command} <nuevo nombre>\n\nEjemplo: ${usedPrefix + command} Grupo de MaycolAIUltra-MD`)
      
      // Cambiar nombre del grupo
      await conn.groupUpdateSubject(m.chat, args.join(" "))
        .then(_ => m.reply('✅ *Nombre del grupo actualizado*'))
        .catch(_ => m.reply('❌ *Error al actualizar el nombre*'))
      break
      
    case 'setgroupdesc':
    case 'setdesc':
      if (!m.isGroup) return m.reply('⚠️ *Este comando solo puede usarse en grupos*')
      
      // Verificar permisos
      const botAdmin4 = await isBotAdmin(m.chat, conn)
      if (!botAdmin4) return m.reply('❌ *Error: El bot debe ser administrador del grupo*')
      
      if (!args[0]) return m.reply(`*Uso correcto:*\n${usedPrefix + command} <nueva descripción>\n\nEjemplo: ${usedPrefix + command} Grupo oficial de MaycolAIUltra-MD`)
      
      // Cambiar descripción del grupo
      await conn.groupUpdateDescription(m.chat, args.join(" "))
        .then(_ => m.reply('✅ *Descripción del grupo actualizada*'))
        .catch(_ => m.reply('❌ *Error al actualizar la descripción*'))
      break
      
    case 'resetlink':
    case 'resetgrouplink':
      if (!m.isGroup) return m.reply('⚠️ *Este comando solo puede usarse en grupos*')
      
      // Verificar permisos
      const botAdmin5 = await isBotAdmin(m.chat, conn)
      if (!botAdmin5) return m.reply('❌ *Error: El bot debe ser administrador del grupo*')
      
      // Resetear enlace del grupo
      await conn.groupRevokeInvite(m.chat)
        .then(_ => m.reply('✅ *Enlace del grupo restablecido*'))
        .catch(_ => m.reply('❌ *Error al restablecer el enlace*'))
      break
      
    case 'todos':
    case 'tagall':
      if (!m.isGroup) return m.reply('⚠️ *Este comando solo puede usarse en grupos*')
      
      // Obtener metadatos del grupo
      const groupMetadata = await conn.groupMetadata(m.chat)
      const participants = groupMetadata.participants
      
      // Mensaje personalizado o predeterminado
      let message = args.join(' ').trim()
      if (!message) message = '👋 *ATENCIÓN A TODOS LOS MIEMBROS*'
      
      // Crear lista de menciones
      let mentions = participants.map(p => p.id)
      let list = '╭─「 📢 *MENCIÓN GENERAL* 」\n'
      
      participants.forEach((participant, i) => {
        list += `│ ${i + 1}. @${participant.id.split('@')[0]}\n`
      })
      
      list += `╰────「 *${groupMetadata.subject}* 」\n\n${message}`
      
      // Enviar mensaje con menciones
      conn.sendMessage(m.chat, {
        text: list,
        mentions
      })
      break
      
    case 'kickall':
      if (!m.isGroup) return m.reply('⚠️ *Este comando solo puede usarse en grupos*')
      
      // Verificar permisos
      const botAdmin6 = await isBotAdmin(m.chat, conn)
      if (!botAdmin6) return m.reply('❌ *Error: El bot debe ser administrador del grupo*')
      
      // Confirmar acción
      if (!args[0] || args[0].toLowerCase() !== 'confirmar') {
        return m.reply(`⚠️ *ADVERTENCIA*\nEste comando eliminará a todos los miembros del grupo, excepto al bot y a ti.\n\nSi estás seguro, escribe: ${usedPrefix}kickall confirmar`)
      }
      
      // Obtener metadatos del grupo
      const metadata = await conn.groupMetadata(m.chat)
      const participantes = metadata.participants
      
      // Filtrar para no expulsar al owner ni al bot
      const toKick = participantes
        .filter(p => !areJidsSameUser(p.id, conn.user.id) && !areJidsSameUser(p.id, m.sender))
        .map(p => p.id)
      
      if (toKick.length === 0) return m.reply('⚠️ *No hay miembros para expulsar*')
      
      m.reply(`🔄 *Expulsando a ${toKick.length} miembros...*`)
      
      // Expulsar miembros
      let kicked = 0
      for (const user of toKick) {
        await conn.groupParticipantsUpdate(m.chat, [user], "remove")
          .then(() => kicked++)
          .catch(console.error)
        
        // Delay para evitar ser limitado por WhatsApp
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      m.reply(`✅ *Operación completada*\nMiembros expulsados: ${kicked}/${toKick.length}`)
      break
      
    case 'grupo':
      if (!m.isGroup) return m.reply('⚠️ *Este comando solo puede usarse en grupos*')
      
      // Verificar permisos
      const botAdmin7 = await isBotAdmin(m.chat, conn)
      if (!botAdmin7) return m.reply('❌ *Error: El bot debe ser administrador del grupo*')
      
      if (!args[0]) return m.reply(`*Uso correcto:*\n${usedPrefix + command} <open/close>\n\nEjemplo: ${usedPrefix + command} close`)
      
      const action = args[0].toLowerCase()
      
      if (action === 'open' || action === 'abrir') {
        await conn.groupSettingUpdate(m.chat, 'not_announcement')
          .then(_ => m.reply('✅ *Grupo abierto correctamente*\nAhora todos los participantes pueden enviar mensajes.'))
          .catch(_ => m.reply('❌ *Error al abrir el grupo*'))
      } else if (action === 'close' || action === 'cerrar') {
        await conn.groupSettingUpdate(m.chat, 'announcement')
          .then(_ => m.reply('✅ *Grupo cerrado correctamente*\nAhora solo los administradores pueden enviar mensajes.'))
          .catch(_ => m.reply('❌ *Error al cerrar el grupo*'))
      } else {
        m.reply(`*Opción inválida*\nUsa: ${usedPrefix + command} open o ${usedPrefix + command} close`)
      }
      break
      
    case 'joinall':
      if (!args[0]) return m.reply(`*Uso correcto:*\n${usedPrefix + command} <enlaces de grupos separados por comas>\n\nEjemplo: ${usedPrefix + command} https://chat.whatsapp.com/abcd,https://chat.whatsapp.com/efgh`)
      
      const links = args[0].split(',').map(link => link.trim())
      
      if (links.length === 0) return m.reply('❌ *No se encontraron enlaces válidos*')
      
      m.reply(`🔄 *Intentando unir a ${links.length} grupos...*`)
      
      // Unirse a los grupos
      let success = 0
      let failure = 0
      
      for (const link of links) {
        const [_, code] = link.match(/chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i) || []
        
        if (!code) {
          failure++
          continue
        }
        
        try {
          await conn.groupAcceptInvite(code)
          success++
        } catch (e) {
          console.error(e)
          failure++
        }
        
        // Delay para evitar ser limitado por WhatsApp
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      
      m.reply(`✅ *Operación completada*\n\n✓ Grupos unidos: ${success}\n✗ Fallos: ${failure}`)
      break
      
    case 'bcgc':
      if (!args[0]) return m.reply(`*Uso correcto:*\n${usedPrefix + command} <mensaje>\n\nEjemplo: ${usedPrefix + command} Hola a todos los grupos`)
      
      const groupsOnly = Object.keys(conn.chats).filter(jid => jid.endsWith('@g.us'))
      
      if (groupsOnly.length === 0) return m.reply('❌ *El bot no está en ningún grupo*')
      
      m.reply(`🔄 *Enviando mensaje a ${groupsOnly.length} grupos...*`)
      
      // Enviar mensaje a todos los grupos
      let sent = 0
      for (const jid of groupsOnly) {
        await conn.sendMessage(jid, {
          text: `📢 *COMUNICADO OFICIAL*\n\n${args[0]}\n\n*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʏᴄᴏʟᴀɪᴜʟᴛʀᴀ-ᴍᴅ*`
        })
        sent++
        
        // Delay para evitar spam
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      m.reply(`✅ *Mensaje enviado a ${sent}/${groupsOnly.length} grupos*`)
      break
      
    case 'bcbot':
      if (!args[0]) return m.reply(`*Uso correcto:*\n${usedPrefix + command} <mensaje>\n\nEjemplo: ${usedPrefix + command} Nueva actualización disponible`)
      
      // Lista de subbots
      const subbots = Object.keys(global.conns || {})
      
      if (subbots.length === 0) return m.reply('❌ *No hay subbots conectados*')
      
      m.reply(`🔄 *Enviando mensaje a ${subbots.length} subbots...*`)
      
      // Enviar mensaje a todos los subbots
      let sentToSubbots = 0
      for (const jid of subbots) {
        if (global.conns[jid]) {
          await global.conns[jid].sendMessage(global.conns[jid].user.jid, {
            text: `📢 *COMUNICADO DEL BOTMASTER*\n\n${args[0]}\n\n*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʏᴄᴏʟᴀɪᴜʟᴛʀᴀ-ᴍᴅ*`
          })
          sentToSubbots++
        }
      }
      
      m.reply(`✅ *Mensaje enviado a ${sentToSubbots}/${subbots.length} subbots*`)
      break
      
    case 'join':
      if (!args[0]) return m.reply(`*Uso correcto:*\n${usedPrefix + command} <enlace de grupo>\n\nEjemplo: ${usedPrefix + command} https://chat.whatsapp.com/abcdef`)
      
      // Extraer código de invitación
      const [__, code] = args[0].match(/chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i) || []
      
      if (!code) return m.reply('❌ *Enlace inválido*\nAsegúrate de proporcionar un enlace de invitación válido')
      
      try {
        await conn.groupAcceptInvite(code)
        m.reply(`✅ *Bot añadido al grupo*`)
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al unirse al grupo*\n${e}`)
      }
      break
  }
}

// Función para verificar si el bot es administrador
async function isBotAdmin(jid, client) {
  const groupMetadata = await client.groupMetadata(jid)
  const participant = groupMetadata.participants.find(p => p.id === client.user.jid)
  return participant?.admin === 'admin' || participant?.admin === 'superadmin'
}

// Lista de comandos que manejará este handler
const commandList = [
  'promote', 'promover', 'demote', 'degradar', 'setgroupname', 'setname',
  'setgroupdesc', 'setdesc', 'resetlink', 'resetgrouplink', 'todos', 'tagall',
  'kickall', 'grupo', 'joinall', 'bcgc', 'bcbot', 'join'
]

handler.command = new RegExp(`^(${commandList.join('|')})$`, 'i')
handler.owner = true

export default handler