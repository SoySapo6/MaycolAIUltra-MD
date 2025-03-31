import fs from 'fs'
import { createHash } from 'crypto'
import fetch from 'node-fetch'
import { exec } from 'child_process'
import { promisify } from 'util'

// Convertir exec a promise para usar con async/await
const execAsync = promisify(exec)

let handler = async (m, { conn, text, usedPrefix, command, args, isOwner }) => {
  // Verificar si es el owner (número específico 51921826291 o owner general)
  const isDueño = m.sender === '51921826291@s.whatsapp.net' || isOwner
  if (!isDueño) return conn.reply(m.chat, '❌ *Este comando solo puede ser utilizado por el dueño del bot*', m)
  
  switch (command) {
    case 'setbotname':
      if (!text) return m.reply(`*Uso correcto:* ${usedPrefix}setbotname <nombre>\nEjemplo: ${usedPrefix}setbotname MaycolAIUltra-MD`)
      
      try {
        await conn.updateProfileName(text)
        m.reply(`✅ *Nombre del bot actualizado*\nNuevo nombre: ${text}`)
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al actualizar el nombre del bot*\n${e}`)
      }
      break
      
    case 'setbotbio':
      if (!text) return m.reply(`*Uso correcto:* ${usedPrefix}setbotbio <texto>\nEjemplo: ${usedPrefix}setbotbio Bot oficial de MaycolAIUltra-MD`)
      
      try {
        await conn.updateProfileStatus(text)
        m.reply(`✅ *Biografía del bot actualizada*\nNueva bio: ${text}`)
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al actualizar la biografía del bot*\n${e}`)
      }
      break
      
    case 'setwelcome':
      if (!text) return m.reply(`*Uso correcto:* ${usedPrefix}setwelcome <texto>\nEjemplo: ${usedPrefix}setwelcome ¡Bienvenido @user al grupo @group!`)
      
      if (!global.db.data.settings) global.db.data.settings = {}
      global.db.data.settings.welcome = text
      m.reply(`✅ *Mensaje de bienvenida actualizado*\nNuevo mensaje: ${text}\n\nVariables disponibles:\n- @user (mención al usuario)\n- @group (nombre del grupo)\n- @desc (descripción del grupo)`)
      break
      
    case 'setbye':
      if (!text) return m.reply(`*Uso correcto:* ${usedPrefix}setbye <texto>\nEjemplo: ${usedPrefix}setbye ¡Adiós @user, regresa pronto!`)
      
      if (!global.db.data.settings) global.db.data.settings = {}
      global.db.data.settings.bye = text
      m.reply(`✅ *Mensaje de despedida actualizado*\nNuevo mensaje: ${text}\n\nVariables disponibles:\n- @user (mención al usuario)\n- @group (nombre del grupo)`)
      break
      
    case 'setprefix':
      if (!text) return m.reply(`*Uso correcto:* ${usedPrefix}setprefix <símbolo>\nEjemplo: ${usedPrefix}setprefix /`)
      
      global.prefix = text.trim()
      m.reply(`✅ *Prefijo actualizado*\nNuevo prefijo: ${text}\n\nAhora los comandos se usarán así: ${text}help`)
      break
      
    case 'resetprefix':
      global.prefix = '.'
      m.reply('✅ *Prefijo reiniciado*\nSe ha vuelto al prefijo por defecto: .')
      break
      
    case 'autoread':
      if (!text) return m.reply(`*Uso correcto:* ${usedPrefix}autoread <on/off>\nEjemplo: ${usedPrefix}autoread on`)
      
      const action = text.toLowerCase()
      if (action === 'on') {
        global.db.data.settings.autoread = true
        m.reply('✅ *Autoread activado*\nEl bot marcará todos los mensajes como leídos automáticamente')
      } else if (action === 'off') {
        global.db.data.settings.autoread = false
        m.reply('✅ *Autoread desactivado*\nEl bot ya no marcará los mensajes como leídos automáticamente')
      } else {
        m.reply(`❌ *Opción inválida*\nUsa ${usedPrefix}autoread on o ${usedPrefix}autoread off`)
      }
      break
      
    case 'backup':
      m.reply('🔄 *Creando backup de la base de datos...*')
      
      try {
        // Crear un respaldo de la base de datos
        const date = new Date().toISOString().replace(/:/g, '-')
        const backupPath = `./backup_${date}.json`
        fs.writeFileSync(backupPath, JSON.stringify(global.db.data, null, 2))
        
        // Enviar el archivo como documento
        await conn.sendMessage(m.chat, {
          document: fs.readFileSync(backupPath),
          mimetype: 'application/json',
          fileName: `backup_${date}.json`
        }, { quoted: m })
        
        // Eliminar el archivo temporal
        fs.unlinkSync(backupPath)
        
        m.reply('✅ *Backup creado y enviado con éxito*')
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al crear el backup*\n${e}`)
      }
      break
      
    case 'setdbname':
      if (!text) return m.reply(`*Uso correcto:* ${usedPrefix}setdbname <nombre>\nEjemplo: ${usedPrefix}setdbname MaycolAIUltraDB`)
      
      try {
        // Leer el archivo de configuración
        const configPath = './config.js'
        let configContent = fs.readFileSync(configPath, 'utf-8')
        
        // Reemplazar el nombre de la base de datos
        configContent = configContent.replace(/global.DATABASE_NAME\s*=\s*(['"]).*?\1/, `global.DATABASE_NAME = '${text}'`)
        
        // Guardar el archivo modificado
        fs.writeFileSync(configPath, configContent)
        
        m.reply(`✅ *Nombre de la base de datos actualizado*\nNuevo nombre: ${text}\n\n⚠️ Es necesario reiniciar el bot para aplicar los cambios`)
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al actualizar el nombre de la base de datos*\n${e}`)
      }
      break
      
    case 'settextmenu':
      if (!text) return m.reply(`*Uso correcto:* ${usedPrefix}settextmenu <texto>\nEjemplo: ${usedPrefix}settextmenu Mi nuevo menú personalizado`)
      
      if (!global.db.data.settings) global.db.data.settings = {}
      global.db.data.settings.menuText = text
      m.reply(`✅ *Texto del menú actualizado*\nNuevo texto: ${text}`)
      break
      
    case 'settextowner':
      if (!text) return m.reply(`*Uso correcto:* ${usedPrefix}settextowner <texto>\nEjemplo: ${usedPrefix}settextowner Texto personalizado para el owner`)
      
      if (!global.db.data.settings) global.db.data.settings = {}
      global.db.data.settings.ownerText = text
      m.reply(`✅ *Texto del owner actualizado*\nNuevo texto: ${text}`)
      break
      
    case 'grouplist':
      const groups = Object.entries(conn.chats)
        .filter(([jid, _]) => jid.endsWith('@g.us'))
        .map(([jid, chat]) => ({ jid, ...chat }))
      
      if (groups.length === 0) return m.reply('❌ *El bot no está en ningún grupo*')
      
      let txt = '📋 *LISTA DE GRUPOS* 📋\n\n'
      
      for (const group of groups) {
        const metadata = await conn.groupMetadata(group.jid).catch(_ => null)
        if (metadata) {
          txt += `• ${metadata.subject} | ${metadata.participants.length} miembros\n`
          txt += `  ID: ${group.jid}\n\n`
        }
      }
      
      m.reply(txt)
      break
      
    case 'setfakeimg':
      let q = m.quoted ? m.quoted : m
      let mime = (q.msg || q).mimetype || q.mediaType || ''
      if (!/image/g.test(mime)) return m.reply(`✳️ *Responde a una imagen*\nUsa ${usedPrefix + command} respondiendo a una imagen`)
      
      let img = await q.download()
      if (!img) return m.reply('❌ *Error al descargar la imagen*')
      
      try {
        // Guardar la imagen como fakeimg.jpg
        fs.writeFileSync('./fakeimg.jpg', img)
        
        m.reply('✅ *Imagen falsa configurada correctamente*')
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al configurar la imagen falsa*\n${e}`)
      }
      break
      
    case 'setapikey':
      if (!text) return m.reply(`*Uso correcto:* ${usedPrefix}setapikey <clave>\nEjemplo: ${usedPrefix}setapikey tu_clave_api`)
      
      if (!global.db.data.settings) global.db.data.settings = {}
      global.db.data.settings.apikey = text
      m.reply(`✅ *API Key actualizada*\nNueva clave: ${text}`)
      break
      
    case 'resetapikey':
      if (!global.db.data.settings) global.db.data.settings = {}
      delete global.db.data.settings.apikey
      m.reply('✅ *API Key reiniciada*')
      break
      
    case 'getapikey':
      if (!global.db.data.settings || !global.db.data.settings.apikey) {
        return m.reply('❌ *No hay API Key configurada*')
      }
      
      m.reply(`🔑 *API Key actual:* ${global.db.data.settings.apikey}`)
      break
  }
}

// Lista de comandos que manejará este handler
const commandList = [
  'setbotname', 'setbotbio', 'setwelcome', 'setbye', 'setprefix', 'resetprefix',
  'autoread', 'backup', 'setdbname', 'settextmenu', 'settextowner',
  'grouplist', 'setfakeimg', 'setapikey', 'resetapikey', 'getapikey'
]

handler.command = new RegExp(`^(${commandList.join('|')})$`, 'i')
handler.owner = true

export default handler