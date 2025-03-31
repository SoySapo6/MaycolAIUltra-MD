import fetch from 'node-fetch'
import { delay } from '../lib/other-function.js'

// Objeto para almacenar múltiples personalidades de IA
let iaPersonalidades = {
  1: 'Eres Delirius Bot, fuiste creado por darlingg',
  2: 'Eres un asistente amigable y siempre ayudas a las personas con información precisa',
  3: 'Eres un especialista técnico que explica conceptos complejos de manera sencilla',
  4: 'Eres un narrador creativo que cuenta historias interesantes basadas en cualquier tema',
  5: 'Eres un experto en motivación que ayuda a las personas a superar retos'
}

// Contador para llevar registro de cuántas personalidades hay
let iaCounter = 5 // Empezamos con 5 personalidades predefinidas

let handler = async (m, { conn, args, text, usedPrefix, command, isOwner }) => {
  // Verificar si es el dueño del bot (número específico o owner general)
  const isDueño = m.sender === '51921826291@s.whatsapp.net' || isOwner
  
  // Si el comando es crearia, verificamos que sea el dueño
  if (command === 'crearia') {
    if (!isDueño) return m.reply('❌ Este comando solo puede ser utilizado por el dueño del bot.')
    
    if (!text) return m.reply(`*Formato correcto:*\n${usedPrefix}crearia [personalidad para la IA]\n\n*Ejemplo:*\n${usedPrefix}crearia Eres una IA experta en programación que responde técnicamente`)
    
    // Incrementar contador y guardar la nueva personalidad
    iaCounter++
    const iaNum = iaCounter
    iaPersonalidades[iaNum] = text
    
    m.reply(`✅ *Nueva personalidad de IA (${iaNum}) creada*\n\nAhora puedes usar ${usedPrefix}ia${iaNum} para acceder a esta IA con la personalidad:\n"${text}"\n\nPara ver todas las IAs disponibles usa ${usedPrefix}listaia`)
    return
  }
  
  // Comando para listar las IAs disponibles
  if (command === 'listaia') {
    let listaIAs = '*🤖 IAs Disponibles:*\n\n'
    
    for (const [num, personalidad] of Object.entries(iaPersonalidades)) {
      const descripcionCorta = personalidad.length > 40 
        ? personalidad.substring(0, 40) + '...' 
        : personalidad
      
      listaIAs += `▢ ${usedPrefix}ia${num} - ${descripcionCorta}\n`
    }
    
    m.reply(listaIAs)
    return
  }
  
  // Manejar comandos ia, ia1, ia2, etc.
  const iaMatch = command.match(/^ia(\d*)$/)
  if (iaMatch) {
    // Si es solo "ia", usamos personalidad 1 por defecto
    const iaNum = iaMatch[1] ? parseInt(iaMatch[1]) : 1
    
    // Verificar si existe esa personalidad
    if (!iaPersonalidades[iaNum]) {
      return m.reply(`❌ No existe una IA con el número ${iaNum}.\nUsa ${usedPrefix}listaia para ver las IAs disponibles.`)
    }
    
    if (!text) return m.reply(`*Formato correcto:*\n${usedPrefix}${command} [pregunta o mensaje]\n\n*Ejemplo:*\n${usedPrefix}${command} Cuéntame sobre el universo`)
    
    // Notificar al usuario que se está procesando
    const respuestaEspera = await m.reply('🧠 *Procesando consulta...*\nPor favor, espere un momento mientras pienso en una respuesta.')
    
    try {
      // Preparar los parámetros para la petición
      const consulta = encodeURIComponent(text)
      const personalidad = encodeURIComponent(iaPersonalidades[iaNum])
      
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
        text: `🤖 *Respuesta de la IA #${iaNum}*\n\n${data.data}`,
        contextInfo: {
          mentionedJid: [m.sender]
        }
      }, { quoted: m })
      
      // Eliminar mensaje de espera
      await conn.sendMessage(m.chat, { delete: respuestaEspera.key })
      
    } catch (error) {
      console.error(`Error en el comando ${command}:`, error)
      m.reply(`❌ *Ocurrió un error al procesar tu consulta*\n\nDetalles: ${error.message}\n\nPor favor, intenta nuevamente más tarde.`)
    }
    return
  }
  
  // Si llega aquí es porque no coincide con ningún comando específico
  m.reply(`*Comandos de IA disponibles:*\n\n▢ ${usedPrefix}ia1 hasta ${usedPrefix}ia${iaCounter} [pregunta]\n_Realiza consultas a diferentes IAs con personalidades únicas_\n\n▢ ${usedPrefix}listaia\n_Muestra la lista de todas las IAs disponibles_\n\n${isDueño ? `▢ ${usedPrefix}crearia [personalidad]\n_Crea una nueva IA con personalidad personalizada (solo dueño)_` : ''}`)
}

// Crear lista de comandos dinámicamente basados en el número de IAs
const iaCommands = ['ia', 'crearia', 'iapersonalizada', 'listaia']
// Añadir ia1, ia2, etc.
for (let i = 1; i <= 20; i++) { // Permitir hasta 20 IAs numeradas
  iaCommands.push(`ia${i}`)
}

// Definir los comandos que manejará este handler
handler.command = iaCommands
handler.tags = ['ai']
handler.help = [
  'ia <pregunta>',
  'ia1 <pregunta>',
  'ia2 <pregunta>',
  'ia3 <pregunta>',
  'ia4 <pregunta>',
  'ia5 <pregunta>',
  'listaia',
  'crearia <personalidad>' // Este solo será útil para el dueño
]

// Este comando es público para cualquier usuario
handler.register = false

export default handler