import fs from 'fs'

let handler = async (m, { conn, text, usedPrefix, command, args, isOwner }) => {
  // Verificar si es el owner (número específico 51921826291 o owner general)
  const isDueño = m.sender === '51921826291@s.whatsapp.net' || isOwner
  if (!isDueño) return conn.reply(m.chat, '❌ *Este comando solo puede ser utilizado por el dueño del bot*', m)
  
  switch (command) {
    case 'resetuser':
      if (!text && !m.quoted) return m.reply(`*Uso correcto:* ${usedPrefix}resetuser <@usuario>\nO responde a un mensaje con ${usedPrefix}resetuser`)
      
      let who
      if (m.isGroup) {
        who = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      } else {
        who = text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.chat
      }
      
      if (!(who in global.db.data.users)) return m.reply(`❌ El usuario ${who} no está registrado en la base de datos`)
      
      const defaultUserData = {
        limit: 20,
        exp: 0,
        level: 0,
        role: 'Novato',
        registered: false,
        premium: false,
        banned: false
      }
      
      global.db.data.users[who] = defaultUserData
      conn.reply(m.chat, `✅ Usuario ${who} reiniciado a valores por defecto`, m)
      break
      
    case 'resetalldb':
      // Pedir confirmación
      if (!text || text.toLowerCase() !== 'confirmar') {
        return m.reply(`⚠️ *ADVERTENCIA*\nEste comando reiniciará TODA la base de datos del bot.\n\nSi estás seguro, escribe: ${usedPrefix}resetalldb confirmar`)
      }
      
      // Crear respaldo antes de reiniciar
      const date = new Date().toISOString().replace(/:/g, '-')
      const backupPath = `./database_backup_${date}.json`
      fs.writeFileSync(backupPath, JSON.stringify(global.db.data, null, 2))
      
      // Reiniciar base de datos
      global.db.data = {
        users: {},
        chats: {},
        stats: {},
        msgs: {},
        sticker: {},
        settings: {},
        ...(global.db.data || {})
      }
      
      m.reply(`✅ *Base de datos reiniciada*\nSe ha creado un respaldo en: ${backupPath}`)
      break
      
    case 'getdb':
      try {
        const fullDB = JSON.stringify(global.db.data, null, 2)
        
        // Si la DB es muy grande, guardarla como archivo
        if (fullDB.length > 50000) {
          const dbFile = `./database_export_${new Date().toISOString().replace(/:/g, '-')}.json`
          fs.writeFileSync(dbFile, fullDB)
          await conn.sendMessage(m.chat, { document: fs.readFileSync(dbFile), mimetype: 'application/json', fileName: 'database.json' }, { quoted: m })
          fs.unlinkSync(dbFile) // Borrar después de enviar
          return
        }
        
        // Si es pequeña, mandarla como texto
        await m.reply(`🗄️ *Base de datos actual:*\n\n\`\`\`json\n${fullDB}\n\`\`\``)
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al obtener la base de datos*\n${e}`)
      }
      break
      
    case 'addprem':
      if (!text && !m.quoted) return m.reply(`*Uso correcto:* ${usedPrefix}addprem <@usuario> <días>\nEjemplo: ${usedPrefix}addprem @usuario 30`)
      
      let target
      let days = args[1] && args[1].match(/^\d+$/) ? parseInt(args[1]) : 30
      
      if (m.isGroup) {
        target = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      } else {
        target = text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.chat
      }
      
      if (!(target in global.db.data.users)) {
        global.db.data.users[target] = {}
      }
      
      // Calcular fecha de expiración
      const now = new Date()
      const expiration = new Date(now)
      expiration.setDate(now.getDate() + days)
      
      global.db.data.users[target].premium = true
      global.db.data.users[target].premiumExp = expiration.getTime()
      
      conn.reply(m.chat, `✅ *Usuario Premium Añadido*\n@${target.split('@')[0]} ahora es premium por ${days} días.\nExpira: ${expiration.toDateString()}`, m, {
        contextInfo: {
          mentionedJid: [target]
        }
      })
      break
      
    case 'delprem':
      if (!text && !m.quoted) return m.reply(`*Uso correcto:* ${usedPrefix}delprem <@usuario>\nO responde a un mensaje con ${usedPrefix}delprem`)
      
      let user
      if (m.isGroup) {
        user = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      } else {
        user = text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.chat
      }
      
      if (!(user in global.db.data.users)) return m.reply(`❌ El usuario no está registrado en la base de datos`)
      
      if (!global.db.data.users[user].premium) return m.reply(`❌ El usuario no es premium`)
      
      global.db.data.users[user].premium = false
      global.db.data.users[user].premiumExp = 0
      
      conn.reply(m.chat, `✅ *Usuario Premium Eliminado*\n@${user.split('@')[0]} ya no es usuario premium`, m, {
        contextInfo: {
          mentionedJid: [user]
        }
      })
      break
      
    case 'listprem':
      let premiumUsers = Object.entries(global.db.data.users).filter(([_, user]) => user.premium)
      
      if (premiumUsers.length === 0) return m.reply('❌ *No hay usuarios premium actualmente*')
      
      let txt = '👑 *USUARIOS PREMIUM* 👑\n\n'
      
      for (let [jid, user] of premiumUsers) {
        const username = user.name || `@${jid.split('@')[0]}`
        const expiry = user.premiumExp ? new Date(user.premiumExp).toDateString() : 'Permanente'
        txt += `• ${username}\n  ↳ Expira: ${expiry}\n\n`
      }
      
      conn.reply(m.chat, txt, m)
      break
      
    case 'addxp':
      if (!text && !m.quoted) return m.reply(`*Uso correcto:* ${usedPrefix}addxp <@usuario> <cantidad>\nEjemplo: ${usedPrefix}addxp @usuario 1000`)
      
      let xpTarget
      let amount = args[1] && args[1].match(/^\d+$/) ? parseInt(args[1]) : 1000
      
      if (m.isGroup) {
        xpTarget = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      } else {
        xpTarget = text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.chat
      }
      
      if (!(xpTarget in global.db.data.users)) {
        global.db.data.users[xpTarget] = {}
      }
      
      global.db.data.users[xpTarget].exp = (global.db.data.users[xpTarget].exp || 0) + amount
      
      conn.reply(m.chat, `✅ *XP Añadido*\nSe han añadido ${amount} XP a @${xpTarget.split('@')[0]}`, m, {
        contextInfo: {
          mentionedJid: [xpTarget]
        }
      })
      break
      
    case 'addlimit':
      if (!text && !m.quoted) return m.reply(`*Uso correcto:* ${usedPrefix}addlimit <@usuario> <cantidad>\nEjemplo: ${usedPrefix}addlimit @usuario 10`)
      
      let limitTarget
      let limitAmount = args[1] && args[1].match(/^\d+$/) ? parseInt(args[1]) : 10
      
      if (m.isGroup) {
        limitTarget = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      } else {
        limitTarget = text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.chat
      }
      
      if (!(limitTarget in global.db.data.users)) {
        global.db.data.users[limitTarget] = {}
      }
      
      global.db.data.users[limitTarget].limit = (global.db.data.users[limitTarget].limit || 0) + limitAmount
      
      conn.reply(m.chat, `✅ *Límite Añadido*\nSe han añadido ${limitAmount} límites a @${limitTarget.split('@')[0]}`, m, {
        contextInfo: {
          mentionedJid: [limitTarget]
        }
      })
      break
      
    case 'resetlimit':
      if (!text && !m.quoted) return m.reply(`*Uso correcto:* ${usedPrefix}resetlimit <@usuario>\nO responde a un mensaje con ${usedPrefix}resetlimit`)
      
      let limitUser
      if (m.isGroup) {
        limitUser = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      } else {
        limitUser = text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.chat
      }
      
      if (!(limitUser in global.db.data.users)) return m.reply(`❌ El usuario no está registrado en la base de datos`)
      
      global.db.data.users[limitUser].limit = 20 // Valor por defecto
      
      conn.reply(m.chat, `✅ *Límite Reiniciado*\nSe ha reiniciado el límite de @${limitUser.split('@')[0]} a 20`, m, {
        contextInfo: {
          mentionedJid: [limitUser]
        }
      })
      break
      
    case 'ban':
      if (!text && !m.quoted) return m.reply(`*Uso correcto:* ${usedPrefix}ban <@usuario>\nO responde a un mensaje con ${usedPrefix}ban`)
      
      let banTarget
      if (m.isGroup) {
        banTarget = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      } else {
        banTarget = text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.chat
      }
      
      if (!(banTarget in global.db.data.users)) {
        global.db.data.users[banTarget] = {}
      }
      
      global.db.data.users[banTarget].banned = true
      
      conn.reply(m.chat, `⛔ *Usuario Baneado*\n@${banTarget.split('@')[0]} ha sido baneado\nYa no podrá usar el bot`, m, {
        contextInfo: {
          mentionedJid: [banTarget]
        }
      })
      break
      
    case 'unban':
      if (!text && !m.quoted) return m.reply(`*Uso correcto:* ${usedPrefix}unban <@usuario>\nO responde a un mensaje con ${usedPrefix}unban`)
      
      let unbanTarget
      if (m.isGroup) {
        unbanTarget = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      } else {
        unbanTarget = text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.chat
      }
      
      if (!(unbanTarget in global.db.data.users)) return m.reply(`❌ El usuario no está registrado en la base de datos`)
      
      if (!global.db.data.users[unbanTarget].banned) return m.reply(`❌ El usuario no está baneado`)
      
      global.db.data.users[unbanTarget].banned = false
      
      conn.reply(m.chat, `✅ *Usuario Desbaneado*\n@${unbanTarget.split('@')[0]} ha sido desbaneado\nYa puede usar el bot nuevamente`, m, {
        contextInfo: {
          mentionedJid: [unbanTarget]
        }
      })
      break
      
    case 'banlist':
      let bannedUsers = Object.entries(global.db.data.users).filter(([_, user]) => user.banned)
      
      if (bannedUsers.length === 0) return m.reply('⚠️ *No hay usuarios baneados actualmente*')
      
      let list = '⛔ *USUARIOS BANEADOS* ⛔\n\n'
      
      for (let [jid, user] of bannedUsers) {
        const username = user.name || `@${jid.split('@')[0]}`
        list += `• ${username}\n`
      }
      
      conn.reply(m.chat, list, m)
      break
  }
}

// Lista de comandos que manejará este handler
const commandList = [
  'resetuser', 'resetalldb', 'getdb', 'addprem', 'delprem', 'listprem',
  'addxp', 'addlimit', 'resetlimit', 'ban', 'unban', 'banlist'
]

handler.command = new RegExp(`^(${commandList.join('|')})$`, 'i')
handler.owner = true

export default handler