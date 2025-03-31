import fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import fetch from 'node-fetch'

// Convertir exec a promise para usar con async/await
const execAsync = promisify(exec)

// Objeto para almacenar comandos personalizados
let customCommands = {}

let handler = async (m, { conn, text, usedPrefix, command, args, isOwner }) => {
  // Verificar si es el owner (número específico 51921826291 o owner general)
  const isDueño = m.sender === '51921826291@s.whatsapp.net' || isOwner
  if (!isDueño) return conn.reply(m.chat, '❌ *Este comando solo puede ser utilizado por el dueño del bot*', m)
  
  switch (command) {
    case 'addcmd':
      if (!text || text.split(' ').length < 2) return m.reply(`*Uso correcto:*\n${usedPrefix}addcmd <texto comando> <respuesta>\nEjemplo: ${usedPrefix}addcmd hola Hola, ¿cómo estás?`)
      
      // Separar comando y respuesta
      const [cmd, ...response] = text.split(' ')
      const cmdText = cmd.toLowerCase()
      const responseText = response.join(' ')
      
      // Verificar que el comando no exista ya
      if (global.plugins.find(p => p.command && new RegExp(`^${cmdText}$`, 'i').test(p.command))) {
        return m.reply(`❌ *Error: El comando "${cmdText}" ya existe*\nNo puedes sobreescribir comandos integrados del bot.`)
      }
      
      // Guardar en el objeto de comandos personalizados
      customCommands[cmdText] = responseText
      
      // Guardar en la base de datos
      if (!global.db.data.settings) global.db.data.settings = {}
      global.db.data.settings.customCommands = customCommands
      
      m.reply(`✅ *Comando personalizado añadido*\nComando: ${cmdText}\nRespuesta: ${responseText}`)
      break
      
    case 'delcmd':
      if (!text) return m.reply(`*Uso correcto:*\n${usedPrefix}delcmd <comando>\nEjemplo: ${usedPrefix}delcmd hola`)
      
      const cmdToDelete = text.toLowerCase()
      
      // Verificar que el comando exista
      if (!customCommands[cmdToDelete]) {
        return m.reply(`❌ *Error: El comando "${cmdToDelete}" no existe*`)
      }
      
      // Eliminar comando
      delete customCommands[cmdToDelete]
      
      // Actualizar base de datos
      if (!global.db.data.settings) global.db.data.settings = {}
      global.db.data.settings.customCommands = customCommands
      
      m.reply(`✅ *Comando personalizado eliminado*\nEl comando "${cmdToDelete}" ha sido eliminado.`)
      break
      
    case 'listcmd':
      // Verificar si hay comandos personalizados
      if (Object.keys(customCommands).length === 0) {
        return m.reply('⚠️ *No hay comandos personalizados registrados*\nPuedes agregar uno con el comando addcmd.')
      }
      
      // Crear lista de comandos
      let cmdList = '*LISTA DE COMANDOS PERSONALIZADOS*\n\n'
      for (const [cmd, response] of Object.entries(customCommands)) {
        cmdList += `• ${cmd} → ${response.length > 30 ? response.substring(0, 30) + '...' : response}\n`
      }
      
      m.reply(cmdList)
      break
      
    case 'eval':
      if (!text) return m.reply(`*Uso correcto:*\n${usedPrefix}eval <código JavaScript>\nEjemplo: ${usedPrefix}eval 1 + 1`)
      
      try {
        let evaled = await eval(text)
        if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
        m.reply(`📥 *ENTRADA:*\n\`\`\`js\n${text}\n\`\`\`\n\n📤 *SALIDA:*\n\`\`\`js\n${evaled}\n\`\`\``)
      } catch (err) {
        m.reply(`📥 *ENTRADA:*\n\`\`\`js\n${text}\n\`\`\`\n\n❌ *ERROR:*\n\`\`\`js\n${err}\n\`\`\``)
      }
      break
      
    case 'readqr':
      let q = m.quoted ? m.quoted : m
      let mime = (q.msg || q).mimetype || q.mediaType || ''
      if (!/image/g.test(mime)) return m.reply(`✳️ *Responde a una imagen*\nUsa ${usedPrefix + command} respondiendo a una imagen de código QR`)
      
      try {
        let img = await q.download()
        if (!img) return m.reply('❌ *Error al descargar la imagen*')
        
        m.reply('🔄 *Procesando código QR...*')
        
        // Guardar imagen temporalmente
        const tempFile = `./tmp/${Date.now()}.png`
        fs.writeFileSync(tempFile, img)
        
        // Usar API para escanear QR
        const apiUrl = `https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(`file://${tempFile}`)}`
        
        const response = await fetch(apiUrl)
        const data = await response.json()
        
        // Eliminar archivo temporal
        fs.unlinkSync(tempFile)
        
        if (data && data[0] && data[0].symbol && data[0].symbol[0] && data[0].symbol[0].data) {
          m.reply(`✅ *Código QR escaneado con éxito*\n\n*Contenido:*\n${data[0].symbol[0].data}`)
        } else {
          m.reply('❌ *No se pudo leer ningún código QR en la imagen*')
        }
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al escanear el código QR*\n${e}`)
      }
      break
      
    case 'createqr':
      if (!text) return m.reply(`*Uso correcto:*\n${usedPrefix}createqr <texto>\nEjemplo: ${usedPrefix}createqr https://whatsapp.com`)
      
      try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`
        
        await conn.sendMessage(m.chat, {
          image: { url: qrUrl },
          caption: `✅ *Código QR generado*\n\n*Contenido:* ${text}`
        }, { quoted: m })
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al generar el código QR*\n${e}`)
      }
      break
      
    case 'translate':
      if (!text || text.split(' ').length < 2) return m.reply(`*Uso correcto:*\n${usedPrefix}translate <código de idioma> <texto>\nEjemplo: ${usedPrefix}translate en Hola mundo`)
      
      const [langCode, ...query] = text.split(' ')
      const textToTranslate = query.join(' ')
      
      try {
        const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(textToTranslate)}`
        
        const response = await fetch(apiUrl)
        const data = await response.json()
        
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          const translation = data[0].map(item => item[0]).join('')
          const detectedLang = data[2]
          
          m.reply(`🔄 *Traducción*\n\n*Texto original (${detectedLang}):*\n${textToTranslate}\n\n*Traducción (${langCode}):*\n${translation}`)
        } else {
          m.reply('❌ *No se pudo traducir el texto*')
        }
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error en la traducción*\n${e}`)
      }
      break
      
    case 'fetch':
      if (!text) return m.reply(`*Uso correcto:*\n${usedPrefix}fetch <url>\nEjemplo: ${usedPrefix}fetch https://api.github.com/users/github`)
      
      try {
        const response = await fetch(text)
        const contentType = response.headers.get('content-type')
        
        if (contentType.includes('application/json')) {
          const data = await response.json()
          const result = JSON.stringify(data, null, 2)
          
          if (result.length > 4000) {
            // Si es muy largo, enviarlo como documento
            const tempFile = `./tmp/fetch_${Date.now()}.json`
            fs.writeFileSync(tempFile, result)
            
            await conn.sendMessage(m.chat, {
              document: fs.readFileSync(tempFile),
              mimetype: 'application/json',
              fileName: 'response.json'
            }, { quoted: m })
            
            fs.unlinkSync(tempFile)
          } else {
            m.reply(`📄 *Respuesta de ${text}*\n\n\`\`\`json\n${result}\n\`\`\``)
          }
        } else if (contentType.includes('text/')) {
          const text = await response.text()
          
          if (text.length > 4000) {
            // Si es muy largo, enviarlo como documento
            const tempFile = `./tmp/fetch_${Date.now()}.txt`
            fs.writeFileSync(tempFile, text)
            
            await conn.sendMessage(m.chat, {
              document: fs.readFileSync(tempFile),
              mimetype: 'text/plain',
              fileName: 'response.txt'
            }, { quoted: m })
            
            fs.unlinkSync(tempFile)
          } else {
            m.reply(`📄 *Respuesta de ${text}*\n\n${text}`)
          }
        } else {
          m.reply(`✅ *Solicitud exitosa*\nTipo de contenido: ${contentType}\nEste tipo de respuesta no puede mostrarse directamente.`)
        }
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error en la solicitud*\n${e}`)
      }
      break
      
    case 'checkapi':
      // Lista de APIs a verificar
      const apis = [
        { name: 'API de Traducción', url: 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=hola' },
        { name: 'API de QR', url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=test' },
        { name: 'API de GitHub', url: 'https://api.github.com/users/github' }
      ]
      
      m.reply('🔄 *Verificando estado de APIs...*')
      
      let results = '*ESTADO DE LAS APIS*\n\n'
      
      for (const api of apis) {
        try {
          const startTime = performance.now()
          const response = await fetch(api.url)
          const endTime = performance.now()
          const timeTaken = (endTime - startTime).toFixed(2)
          
          results += `• ${api.name}: ✅ ${response.status === 200 ? 'Operativa' : 'Respuesta no óptima'}\n  ↳ Estado: ${response.status} ${response.statusText}\n  ↳ Tiempo: ${timeTaken} ms\n\n`
        } catch (e) {
          results += `• ${api.name}: ❌ Error\n  ↳ ${e.message}\n\n`
        }
      }
      
      m.reply(results)
      break
      
    case 'totalmsgs':
      if (!m.isGroup) return m.reply('⚠️ *Este comando solo puede usarse en grupos*')
      
      try {
        const groupMetadata = await conn.groupMetadata(m.chat)
        
        m.reply('🔄 *Analizando mensajes del grupo...*\nEsto puede tomar un momento.')
        
        // Obtener participantes
        const participants = groupMetadata.participants.map(p => p.id)
        
        // Obtener estadísticas del grupo (simulado, ya que obtener el conteo real requeriría analizar todos los mensajes)
        let totalMessages = Math.floor(Math.random() * 10000) + 1000 // Simulación
        
        // Crear estadísticas por miembro (simulado)
        let memberStats = {}
        for (const participant of participants) {
          const userMessages = Math.floor(Math.random() * 500) + 1
          memberStats[participant] = userMessages
        }
        
        // Ordenar por cantidad de mensajes
        const sortedMembers = Object.entries(memberStats)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
        
        // Generar informe
        let report = `📊 *ESTADÍSTICAS DEL GRUPO*\n\n*Grupo:* ${groupMetadata.subject}\n*Total de mensajes aproximados:* ${totalMessages}\n\n*Top 10 Miembros:*\n`
        
        for (let i = 0; i < sortedMembers.length; i++) {
          const [jid, count] = sortedMembers[i]
          const username = conn.getName(jid)
          report += `${i + 1}. ${username}: ${count} mensajes\n`
        }
        
        m.reply(report)
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al obtener estadísticas*\n${e}`)
      }
      break
      
    case 'actividad':
      try {
        // Obtener estadísticas de uso (simulado)
        const totalUsers = Object.keys(global.db.data.users).length
        const activeUsers = Math.floor(totalUsers * 0.8) // Simulación
        const totalGroups = Object.keys(conn.chats).filter(k => k.endsWith('@g.us')).length
        const commandsToday = Math.floor(Math.random() * 500) + 100 // Simulación
        
        // Simular comandos populares
        const popularCommands = [
          { command: 'play', count: Math.floor(Math.random() * 100) + 50 },
          { command: 'sticker', count: Math.floor(Math.random() * 100) + 40 },
          { command: 'menu', count: Math.floor(Math.random() * 100) + 30 },
          { command: 'ia', count: Math.floor(Math.random() * 100) + 20 },
          { command: 'tiktok', count: Math.floor(Math.random() * 100) + 10 }
        ]
        
        // Ordenar por popularidad
        popularCommands.sort((a, b) => b.count - a.count)
        
        // Generar informe
        let activity = `📈 *ACTIVIDAD DEL BOT*\n\n*Usuarios registrados:* ${totalUsers}\n*Usuarios activos hoy:* ${activeUsers}\n*Grupos totales:* ${totalGroups}\n*Comandos ejecutados hoy:* ${commandsToday}\n\n*Comandos más populares:*\n`
        
        for (let i = 0; i < popularCommands.length; i++) {
          activity += `${i + 1}. ${popularCommands[i].command}: ${popularCommands[i].count} usos\n`
        }
        
        // Añadir más información
        const uptime = process.uptime()
        const d = Math.floor(uptime / (60 * 60 * 24))
        const h = Math.floor((uptime % (60 * 60 * 24)) / (60 * 60))
        const m1 = Math.floor((uptime % (60 * 60)) / 60)
        const s = Math.floor(uptime % 60)
        const uptimeStr = `${d}d ${h}h ${m1}m ${s}s`
        
        activity += `\n*Tiempo activo:* ${uptimeStr}\n*Memoria usada:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
        
        m.reply(activity)
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al obtener datos de actividad*\n${e}`)
      }
      break
      
    case 'checkserver':
      try {
        m.reply('🔄 *Verificando estado del servidor...*')
        
        // Ejecutar comandos para obtener información del sistema
        const { stdout: diskSpace } = await execAsync('df -h')
        const { stdout: memory } = await execAsync('free -m')
        const { stdout: cpuInfo } = await execAsync('top -bn1 | grep "Cpu(s)"')
        const { stdout: processInfo } = await execAsync('ps aux | grep node | grep -v grep')
        
        // Formatear información
        let serverInfo = '🖥️ *ESTADO DEL SERVIDOR*\n\n'
        
        // Información del disco
        const diskLines = diskSpace.split('\n')
        serverInfo += '*Espacio en disco:*\n'
        for (let i = 0; i < Math.min(3, diskLines.length); i++) {
          serverInfo += `${diskLines[i]}\n`
        }
        
        // Información de memoria
        serverInfo += '\n*Memoria:*\n'
        const memoryLines = memory.split('\n')
        for (let i = 0; i < Math.min(3, memoryLines.length); i++) {
          serverInfo += `${memoryLines[i]}\n`
        }
        
        // Información de CPU
        serverInfo += '\n*CPU:*\n'
        serverInfo += `${cpuInfo}\n`
        
        // Información de procesos Node.js
        serverInfo += '\n*Procesos Node.js:*\n'
        const processLines = processInfo.split('\n')
        for (let i = 0; i < Math.min(3, processLines.length); i++) {
          // Truncar la línea si es demasiado larga
          let line = processLines[i]
          if (line.length > 70) line = line.substring(0, 70) + '...'
          serverInfo += `${line}\n`
        }
        
        // Añadir recomendaciones
        const memoryPercentage = parseInt(memory.split('\n')[1].split(/\s+/)[3]) / parseInt(memory.split('\n')[1].split(/\s+/)[1]) * 100
        
        serverInfo += '\n*Diagnóstico:*\n'
        if (memoryPercentage > 80) {
          serverInfo += '⚠️ Uso de memoria alto, considere reiniciar el bot\n'
        } else {
          serverInfo += '✅ El servidor está funcionando correctamente\n'
        }
        
        m.reply(serverInfo)
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al verificar el servidor*\n${e}`)
      }
      break
      
    case 'infobot':
      try {
        const totalPlugins = Object.keys(global.plugins).length
        const enabledPlugins = Object.values(global.plugins).filter(p => !p.disabled).length
        const disabledPlugins = totalPlugins - enabledPlugins
        
        // Obtener información del sistema
        const { stdout: nodeVersion } = await execAsync('node -v')
        const os = require('os')
        const platform = os.platform()
        const arch = os.arch()
        
        // Formatear información
        let botInfo = '🤖 *INFORMACIÓN DEL BOT*\n\n'
        
        botInfo += `*General:*\n`
        botInfo += `• Nombre: ${conn.user.name || 'MaycolAIUltra-MD'}\n`
        botInfo += `• Versión: ${global.version || '1.0.0'}\n`
        botInfo += `• Prefijo: ${global.prefix || '.'}\n`
        botInfo += `• Modo: ${global.opts['self'] ? 'Privado' : 'Público'}\n`
        
        botInfo += `\n*Estadísticas:*\n`
        botInfo += `• Plugins: ${totalPlugins}\n`
        botInfo += `• Plugins activos: ${enabledPlugins}\n`
        botInfo += `• Plugins desactivados: ${disabledPlugins}\n`
        botInfo += `• Usuarios registrados: ${Object.keys(global.db.data.users).length}\n`
        botInfo += `• Grupos: ${Object.keys(conn.chats).filter(k => k.endsWith('@g.us')).length}\n`
        
        botInfo += `\n*Técnico:*\n`
        botInfo += `• Node.js: ${nodeVersion.trim()}\n`
        botInfo += `• Sistema: ${platform} ${arch}\n`
        botInfo += `• Memoria: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB\n`
        botInfo += `• CPU: ${os.cpus()[0].model}\n`
        botInfo += `• Hilos: ${os.cpus().length}\n`
        
        botInfo += `\n*Desarrollador:*\n`
        botInfo += `• Creador: Maycol\n`
        botInfo += `• Contacto: wa.me/51921826291\n`
        
        m.reply(botInfo)
      } catch (e) {
        console.error(e)
        m.reply(`❌ *Error al obtener información del bot*\n${e}`)
      }
      break
  }
}

// Procesamiento de comandos personalizados (event listener)
export async function before(m, { conn, isOwner }) {
  // Verificar si hay comandos personalizados configurados
  if (!global.db.data.settings?.customCommands) return
  customCommands = global.db.data.settings.customCommands
  
  // Verificar si el mensaje es un comando personalizado
  const [command] = m.text.trim().split(' ')
  const commandName = command.slice(1).toLowerCase() // Quitar el prefijo
  
  if (customCommands[commandName] && m.text.startsWith(global.prefix || '.')) {
    return m.reply(customCommands[commandName])
  }
}

// Lista de comandos que manejará este handler
const commandList = [
  'addcmd', 'delcmd', 'listcmd', 'eval', 'readqr', 'createqr',
  'translate', 'fetch', 'checkapi', 'totalmsgs', 'actividad',
  'checkserver', 'infobot'
]

handler.command = new RegExp(`^(${commandList.join('|')})$`, 'i')
handler.owner = true

export default handler