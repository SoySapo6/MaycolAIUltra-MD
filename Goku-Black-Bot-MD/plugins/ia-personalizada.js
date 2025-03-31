import fetch from 'node-fetch'
import { delay } from '../lib/other-function.js'

// Almacenamiento para guardar la personalidad configurada por el dueño
let iaPersonalidad = 'Eres Delirius Bot, fuiste creado por darlingg'

let handler = async (m, { conn, args, text, usedPrefix, command, isOwner }) => {
  // Verificar si es el dueño del bot (número específico o owner general)
  const isDueño = m.sender === '51921826291@s.whatsapp.net' || isOwner
  
  // Si el comando es crearia, verificamos que sea el dueño
  if (command === 'crearia') {
    if (!isDueño) return m.reply('❌ Este comando solo puede ser utilizado por el dueño del bot.')
    
    if (!text) return m.reply(`*Formato correcto:*\n${usedPrefix}crearia [personalidad para la IA]\n\n*Ejemplo:*\n${usedPrefix}crearia Eres una IA experta en programación que responde técnicamente`)
    
    // Guardar la personalidad configurada
    iaPersonalidad = text
    
    m.reply(`✅ *Personalidad de la IA configurada correctamente*\n\nAhora la IA responderá según la personalidad:\n"${iaPersonalidad}"`)
    return
  }
  
  // Si el comando es ia, procesamos la consulta
  if (command === 'ia') {
    if (!text) return m.reply(`*Formato correcto:*\n${usedPrefix}ia [pregunta o mensaje]\n\n*Ejemplo:*\n${usedPrefix}ia Cuéntame sobre el universo`)
    
    // Notificar al usuario que se está procesando
    const respuestaEspera = await m.reply('🧠 *Procesando consulta...*\nPor favor, espere un momento mientras pienso en una respuesta.')
    
    try {
      // Preparar los parámetros para la petición
      const consulta = encodeURIComponent(text)
      const personalidad = encodeURIComponent(iaPersonalidad)
      
      // URL de la API
      const url = `https://delirius-apiofc.vercel.app/ia/gptprompt?text=${consulta}&prompt=${personalidad}`
      
      // Realizar la petición
      const response = await fetch(url)
      
      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        throw new Error(`Error en la consulta: ${response.status} ${response.statusText}`)
      }
      
      // Convertir la respuesta a JSON
      const data = await response.json()
      
      // Verificar si la respuesta contiene datos
      if (!data.status || !data.data) {
        throw new Error('Formato de respuesta inválido')
      }
      
      // Pequeña demora para dar sensación de procesamiento
      await delay(1000)
      
      // Enviar la respuesta al usuario
      await conn.sendMessage(m.chat, {
        text: `🤖 *Respuesta de la IA*\n\n${data.data}`,
        contextInfo: {
          mentionedJid: [m.sender]
        }
      }, { quoted: m })
      
      // Eliminar mensaje de espera
      await conn.sendMessage(m.chat, { delete: respuestaEspera.key })
      
    } catch (error) {
      console.error('Error en el comando ia:', error)
      m.reply(`❌ *Ocurrió un error al procesar tu consulta*\n\nDetalles: ${error.message}\n\nPor favor, intenta nuevamente más tarde.`)
    }
    return
  }
  
  // Si llega aquí es porque no coincide con ningún comando específico
  m.reply(`*Comandos disponibles:*\n\n▢ ${usedPrefix}ia [pregunta]\n_Realiza consultas a la IA con la personalidad configurada_\n\n${isDueño ? `▢ ${usedPrefix}crearia [personalidad]\n_Configura la personalidad de la IA (solo dueño)_` : ''}`)
}

// Definir los comandos que manejará este handler
handler.command = ['ia', 'crearia', 'iapersonalizada']
handler.tags = ['ai']
handler.help = [
  'ia <pregunta>',
  'crearia <personalidad>' // Este solo aparecerá en el menú para el dueño
]

// Este comando es público para cualquier usuario
handler.register = false

export default handler