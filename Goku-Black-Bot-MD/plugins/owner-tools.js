import fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import fetch from 'node-fetch'
import axios from 'axios'
import { performance } from 'perf_hooks'

// Convertir exec a promise para usar con async/await
const execAsync = promisify(exec)

let handler = async (m, { conn, text, args, usedPrefix, command, isOwner }) => {
  // Verificar si es el owner (número específico 51921826291 o owner general)
  const isDueño = m.sender === '51921826291@s.whatsapp.net' || isOwner
  if (!isDueño) return conn.reply(m.chat, '❌ *Este comando solo puede ser utilizado por el dueño del bot*', m)
  
  // Respuesta por defecto para comandos no implementados
  const notImplemented = () => {
    return m.reply(`✨ *Comando registrado:* ${command}\n\n_Este comando está en desarrollo. Pronto estará disponible con toda su funcionalidad._`)
  }
  
  // Implementación de los comandos
  switch (command) {
    // GESTIÓN DEL BOT
    case 'modo':
      if (!text) return m.reply(`*Uso correcto*: ${usedPrefix}modo <publico/privado>`)
      if (text === 'publico') {
        global.opts['self'] = false
        return m.reply('✅ *Modo público activado*\nAhora el bot responderá a todos los usuarios')
      } else if (text === 'privado') {
        global.opts['self'] = true
        return m.reply('🔒 *Modo privado activado*\nAhora el bot solo responderá al owner')
      } else {
        return m.reply(`*Opción inválida*\nUsa: ${usedPrefix}modo publico o ${usedPrefix}modo privado`)
      }
      break
      
    case 'autoadmin':
      conn.groupParticipantsUpdate(m.chat, [conn.user.jid], 'promote')
        .then(_ => m.reply('👑 *Bot promovido a administrador*'))
        .catch(_ => m.reply('❌ *Error al promover al bot*\nVerifica que seas admin y tengas los permisos necesarios'))
      break
      
    case 'setppbot':
      let q = m.quoted ? m.quoted : m
      let mime = (q.msg || q).mimetype || q.mediaType || ''
      if (!/image/g.test(mime)) return m.reply(`✳️ *Responde a una imagen*\nUsa ${usedPrefix + command} respondiendo a una imagen`)
      
      let img = await q.download()
      if (!img) return m.reply('❌ *Error al descargar la imagen*')
      
      try {
        await conn.updateProfilePicture(conn.user.jid, img)
        m.reply('✅ *Foto de perfil del bot actualizada*')
      } catch (e) {
        console.error(e)
        m.reply('❌ *Error al actualizar la foto de perfil*')
      }
      break
      
    case 'cleartmp':
      try {
        const tmp = ['/tmp']
        const deletedFiles = []
        
        for (const dir of tmp) {
          const files = fs.readdirSync(dir)
          for (const file of files) {
            // Excluir archivos importantes
            if (file !== 'creds.json' && !file.endsWith('.app')) {
              const filePath = `${dir}/${file}`
              fs.unlinkSync(filePath)
              deletedFiles.push(file)
            }
          }
        }
        
        m.reply(`🗑️ *Archivos temporales eliminados*\n\n*Total eliminados:* ${deletedFiles.length} archivos`)
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al limpiar archivos temporales*\n${e}`)
      }
      break
      
    case 'restart':
      await m.reply('🔄 *Reiniciando el bot...*\nEsto tomará aproximadamente 1 minuto')
      try {
        fs.writeFileSync('./restart.txt', 'restart')
        process.send('reset')
      } catch (e) {
        console.error(e)
        await execAsync('pm2 restart all')
        m.reply('✅ *Bot reiniciado exitosamente*')
      }
      break
      
    // ESTADÍSTICAS
    case 'stats':
    case 'botstat':
      const uptime = process.uptime()
      const d = Math.floor(uptime / (60 * 60 * 24))
      const h = Math.floor((uptime % (60 * 60 * 24)) / (60 * 60))
      const m1 = Math.floor((uptime % (60 * 60)) / 60)
      const s = Math.floor(uptime % 60)
      const uptimeStr = `${d}d ${h}h ${m1}m ${s}s`
      
      const totalUsers = Object.keys(global.db.data.users).length
      const totalGroups = Object.keys(conn.chats).filter(key => key.endsWith('@g.us')).length
      
      const stats = `
⚡ *ESTADÍSTICAS DEL BOT* ⚡

📊 *Generales*
👥 *Usuarios totales:* ${totalUsers}
👥 *Grupos totales:* ${totalGroups}
⏱️ *Tiempo activo:* ${uptimeStr}

📱 *Plataforma:* ${process.platform}
🧠 *RAM:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB / ${Math.round(require('os').totalmem / 1024 / 1024)} MB
🔄 *Versión Node.js:* ${process.version}
      `
      
      m.reply(stats)
      break
      
    case 'speedtest':
      m.reply('🔄 *Realizando prueba de velocidad...*')
      
      const start = performance.now()
      
      try {
        // Prueba de velocidad simple
        await axios.get('https://www.google.com')
        const end = performance.now()
        const timeTaken = (end - start).toFixed(2)
        
        m.reply(`⚡ *Resultados de la prueba de velocidad*\n\n*Ping:* ${timeTaken} ms\n\n_Para una prueba más detallada, usa el comando: ${usedPrefix}terminal speedtest_`)
      } catch (e) {
        m.reply('❌ *Error al realizar la prueba de velocidad*')
        console.error(e)
      }
      break
      
    // GRUPOS & DIFUSIÓN
    case 'bc':
    case 'broadcast':
      if (!text) return m.reply(`*Uso correcto*: ${usedPrefix}bc <texto>\n\nEjemplo: ${usedPrefix}bc Hola a todos`)
      
      const chats = Object.keys(conn.chats)
      const totalBC = chats.length
      let sent = 0
      
      m.reply(`🔄 *Enviando mensaje a ${totalBC} chats...*`)
      
      for (let id of chats) {
        await delay(1500) // Delay para evitar ban
        await conn.sendMessage(id, { text: `📢 *COMUNICADO OFICIAL*\n\n${text}\n\n*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʏᴄᴏʟᴀɪᴜʟᴛʀᴀ-ᴍᴅ*` })
        sent++
      }
      
      m.reply(`✅ *Mensaje difundido correctamente*\n\n*Total enviados:* ${sent} de ${totalBC} chats`)
      break
      
    case 'bcgc':
      if (!text) return m.reply(`*Uso correcto*: ${usedPrefix}bcgc <texto>\n\nEjemplo: ${usedPrefix}bcgc Hola a todos los grupos`)
      
      const groups = Object.keys(conn.chats).filter(key => key.endsWith('@g.us'))
      const totalGC = groups.length
      let sentGC = 0
      
      m.reply(`🔄 *Enviando mensaje a ${totalGC} grupos...*`)
      
      for (let id of groups) {
        await delay(1500) // Delay para evitar ban
        await conn.sendMessage(id, { text: `📢 *COMUNICADO OFICIAL A GRUPOS*\n\n${text}\n\n*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʏᴄᴏʟᴀɪᴜʟᴛʀᴀ-ᴍᴅ*` })
        sentGC++
      }
      
      m.reply(`✅ *Mensaje difundido correctamente a grupos*\n\n*Total enviados:* ${sentGC} de ${totalGC} grupos`)
      break
      
    // AVANZADO
    case 'exec':
      if (!text) return m.reply(`*Uso correcto*: ${usedPrefix}exec <código JavaScript>`)
      
      try {
        const util = require('util')
        let evalResult = await eval(`(async () => { ${text} })()`)
        
        evalResult = util.inspect(evalResult, { depth: 0 })
        await m.reply(`📥 *ENTRADA:*\n\`\`\`js\n${text}\n\`\`\`\n\n📤 *SALIDA:*\n\`\`\`js\n${evalResult}\n\`\`\``)
      } catch (e) {
        await m.reply(`📥 *ENTRADA:*\n\`\`\`js\n${text}\n\`\`\`\n\n❌ *ERROR:*\n\`\`\`js\n${e}\n\`\`\``)
      }
      break
      
    case 'terminal':
    case 'term':
      if (!text) return m.reply(`*Uso correcto*: ${usedPrefix}terminal <comando bash>`)
      
      try {
        m.reply(`🔄 *Ejecutando comando...*\n\`\`\`${text}\`\`\``)
        
        const { stdout, stderr } = await execAsync(text)
        
        if (stdout) {
          // Limitar salida para evitar mensajes demasiado largos
          const output = stdout.length > 4000 ? stdout.substring(0, 4000) + '... (salida truncada)' : stdout
          await m.reply(`📥 *COMANDO:*\n\`\`\`bash\n${text}\n\`\`\`\n\n📤 *SALIDA:*\n\`\`\`bash\n${output}\n\`\`\``)
        }
        
        if (stderr) {
          const errOutput = stderr.length > 4000 ? stderr.substring(0, 4000) + '... (salida truncada)' : stderr
          await m.reply(`📥 *COMANDO:*\n\`\`\`bash\n${text}\n\`\`\`\n\n❌ *ERROR:*\n\`\`\`bash\n${errOutput}\n\`\`\``)
        }
      } catch (e) {
        await m.reply(`📥 *COMANDO:*\n\`\`\`bash\n${text}\n\`\`\`\n\n❌ *ERROR:*\n\`\`\`bash\n${e}\n\`\`\``)
      }
      break
      
    // Si el comando no está implementado
    default:
      return notImplemented()
  }
}

// Función de retraso (para evitar spam)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Lista de comandos que manejará este handler
const commandList = [
  'modo', 'autoadmin', 'setppbot', 'cleartmp', 'restart',
  'stats', 'botstat', 'speedtest',
  'bc', 'broadcast', 'bcgc',
  'exec', 'terminal', 'term'
]

handler.command = new RegExp(`^(${commandList.join('|')})$`, 'i')
handler.owner = true

export default handler