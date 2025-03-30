import fetch from 'node-fetch'
import { extractImageThumb } from '@whiskeysockets/baileys'
import { fileTypeFromBuffer } from 'file-type'
import axios from 'axios'
import crypto from 'crypto'
import cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

let handler = async (m, { conn, usedPrefix, command, args, text }) => {
  let commandList = [
    'acortar', 'qrcode', 'qrread', 'tempmail', 'readmail', 'clima', 
    'ip', 'doxear', 'genpass', 'checkpass', 'encode', 'decode', 
    'morse', 'morse2txt', 'bin2text', 'text2bin', 'hex2text', 'text2hex',
    'hash', 'randomuser', 'fakeid', 'colorinfo', 'calculadora', 'ocr',
    'ping', 'nmap'
  ]
  
  let type = (args[0] || '').toLowerCase()
  
  if (!commandList.includes(type)) {
    let sections = [
      {
        title: 'UTILIDADES VARIAS',
        rows: commandList.map(cmd => ({
          title: `✦ ${cmd}`,
          description: `⟿ Usar: ${usedPrefix + command} ${cmd} [parámetros]`,
          rowId: `${usedPrefix + command} ${cmd}`,
        }))
      }
    ]
    
    const listMessage = {
      text: '🛠️ *LISTA DE UTILIDADES* 🛠️\n\nEscoge una opción de la lista:',
      footer: 'Selecciona una utilidad para más información',
      title: null,
      buttonText: "Seleccionar Utilidad",
      sections
    }
    
    await conn.sendMessage(m.chat, listMessage, { quoted: m })
    return
  }
  
  switch (type) {
    case 'acortar':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} acortar https://enlace-largo.com`)
      
      try {
        const url = args[1]
        const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
        const txt = await res.text()
        m.reply(`🔗 *URL ACORTADA*\n\n*Original:* ${url}\n*Acortada:* ${txt}`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al acortar la URL. Verifica que sea una URL válida.')
      }
      break
      
    case 'qrcode':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} qrcode texto o enlace`)
      
      try {
        let qrData = args.slice(1).join(' ')
        let apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}`
        
        conn.sendFile(m.chat, apiUrl, 'qrcode.png', `✅ *QR generado*\n\nDatos: ${qrData}`, m)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al generar el código QR.')
      }
      break
      
    case 'qrread':
      if (!m.quoted && !m.quoted.mimetype) return m.reply(`*Responde a una imagen de QR para leerla*\nUso: ${usedPrefix + command} qrread`)
      
      try {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        if (!mime.includes('image')) return m.reply(`Responde a una imagen que contenga un código QR`)
        
        let img = await q.download()
        let form = new FormData()
        form.append('file', img, 'image.jpg')
        
        let res = await fetch('https://api.qrserver.com/v1/read-qr-code/', {
          method: 'POST',
          body: form
        })
        
        let json = await res.json()
        let data = json[0].symbol[0].data
        
        m.reply(`📲 *Contenido del QR*\n\n${data || 'No se pudo leer ningún dato del QR.'}`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al leer el código QR. Asegúrate de que la imagen sea clara.')
      }
      break
      
    case 'tempmail':
      try {
        let email = generateTempMail()
        
        // Guardar el email en la base de datos del usuario
        if (!global.db.data.tempmail) global.db.data.tempmail = {}
        global.db.data.tempmail[m.sender] = email
        
        m.reply(`📧 *EMAIL TEMPORAL GENERADO*\n\n*Email:* ${email}\n\n*Uso:* ${usedPrefix + command} readmail`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al generar email temporal.')
      }
      break
      
    case 'readmail':
      if (!global.db.data.tempmail || !global.db.data.tempmail[m.sender]) {
        return m.reply(`❌ No tienes un email temporal activo.\nGenera uno con ${usedPrefix + command} tempmail`)
      }
      
      try {
        let email = global.db.data.tempmail[m.sender]
        // Simulación - En una implementación real se consultaría un servicio de emails temporales
        m.reply(`📬 *BANDEJA DE ENTRADA*\n\n*Email:* ${email}\n\n_No hay mensajes nuevos en este momento._\n\nLos mensajes pueden tardar en llegar. Intenta nuevamente en unos minutos.`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al consultar mensajes.')
      }
      break
      
    case 'clima':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} clima [nombre de ciudad]`)
      
      try {
        const city = args.slice(1).join(' ')
        const apiKey = '4d8fb5b93d4af21d66a2948710284366' // Clave de ejemplo
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=es`
        
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.cod === '404') {
          return m.reply('❌ Ciudad no encontrada. Verifica el nombre e intenta nuevamente.')
        }
        
        const weather = `🌦️ *CLIMA EN ${data.name.toUpperCase()}, ${data.sys.country}*\n\n`
          + `🌡️ *Temperatura:* ${data.main.temp}°C\n`
          + `🔆 *Sensación térmica:* ${data.main.feels_like}°C\n`
          + `💧 *Humedad:* ${data.main.humidity}%\n`
          + `🌪️ *Viento:* ${data.wind.speed} km/h\n`
          + `☁️ *Nubes:* ${data.clouds.all}%\n`
          + `🌅 *Amanecer:* ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}\n`
          + `🌇 *Atardecer:* ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}\n\n`
          + `📝 *Descripción:* ${data.weather[0].description}`
        
        m.reply(weather)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al obtener información del clima. Intenta más tarde.')
      }
      break
      
    case 'ip':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} ip [dirección IP o dominio]`)
      
      try {
        const ipOrDomain = args[1].trim()
        const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(ipOrDomain)
        const endpoint = `http://ip-api.com/json/${encodeURIComponent(ipOrDomain)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
        
        const response = await fetch(endpoint)
        const data = await response.json()
        
        if (data.status === 'fail') {
          return m.reply(`❌ Error: ${data.message}`)
        }
        
        const info = `🌐 *INFORMACIÓN IP*\n\n`
          + `*IP:* ${data.query}\n`
          + `*País:* ${data.country} (${data.countryCode})\n`
          + `*Región:* ${data.regionName} (${data.region})\n`
          + `*Ciudad:* ${data.city}\n`
          + `*Código Postal:* ${data.zip || 'N/A'}\n`
          + `*Coordenadas:* ${data.lat}, ${data.lon}\n`
          + `*Zona Horaria:* ${data.timezone}\n`
          + `*ISP:* ${data.isp}\n`
          + `*Organización:* ${data.org}\n`
          + `*ASN:* ${data.as}`
        
        m.reply(info)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al obtener información de la IP.')
      }
      break
      
    case 'doxear':
      // Nota: Este comando es una simulación humorística y no realiza doxing real
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} doxear @usuario`)
      
      try {
        const user = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        
        if (!user) return m.reply('❌ Debes mencionar a un usuario.')
        
        // Generar datos aleatorios ficticios
        const userInfo = await conn.getName(user)
        const ips = [`${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`]
        const locations = ['Nueva York', 'Tokio', 'Londres', 'París', 'Moscú', 'Berlín', 'Sídney']
        const devices = ['iPhone 13', 'Samsung Galaxy S22', 'Google Pixel 6', 'Xiaomi Mi 11', 'OnePlus 9 Pro']
        const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera']
        
        const dox = `🕵️‍♂️ *DOXEO FICTICIO DE ${userInfo}*\n\n`
          + `*ADVERTENCIA: ESTO ES UNA BROMA*\n`
          + `*Ninguno de estos datos es real*\n\n`
          + `*IP:* ${ips[Math.floor(Math.random() * ips.length)]} (Ficticia)\n`
          + `*Ubicación:* ${locations[Math.floor(Math.random() * locations.length)]} (Ficticia)\n`
          + `*Dispositivo:* ${devices[Math.floor(Math.random() * devices.length)]} (Ficticio)\n`
          + `*Navegador:* ${browsers[Math.floor(Math.random() * browsers.length)]} (Ficticio)\n\n`
          + `⚠️ Este comando es una broma y genera información aleatoria ficticia. El doxeo real es ilegal y una violación de privacidad.`
        
        m.reply(dox)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al ejecutar la broma de doxeo.')
      }
      break
      
    case 'genpass':
      try {
        const length = parseInt(args[1]) || 12
        if (length < 4 || length > 50) return m.reply('❌ La longitud debe estar entre 4 y 50 caracteres.')
        
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?'
        let password = ''
        
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * charset.length)
          password += charset[randomIndex]
        }
        
        // Evaluar la fuerza de la contraseña
        let strength = 'Débil'
        if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) && length >= 12) {
          strength = 'Muy fuerte'
        } else if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && length >= 8) {
          strength = 'Fuerte'
        } else if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password) && length >= 6) {
          strength = 'Media'
        }
        
        m.reply(`🔐 *CONTRASEÑA GENERADA*\n\n*Contraseña:* \`\`\`${password}\`\`\`\n*Longitud:* ${length} caracteres\n*Fuerza:* ${strength}\n\n⚠️ *No compartas tu contraseña con nadie*`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al generar la contraseña.')
      }
      break
      
    case 'checkpass':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} checkpass [contraseña]`)
      
      try {
        const password = args.slice(1).join(' ')
        
        // Calcular puntuación
        let score = 0
        
        // Longitud
        if (password.length >= 12) score += 25
        else if (password.length >= 8) score += 15
        else if (password.length >= 6) score += 10
        else score += 5
        
        // Letras minúsculas
        if (/[a-z]/.test(password)) score += 15
        
        // Letras mayúsculas
        if (/[A-Z]/.test(password)) score += 15
        
        // Números
        if (/\d/.test(password)) score += 15
        
        // Caracteres especiales
        if (/[^a-zA-Z0-9]/.test(password)) score += 20
        
        // Variedad de caracteres
        const uniqueChars = new Set(password).size
        if (uniqueChars >= 8) score += 15
        else if (uniqueChars >= 5) score += 10
        else score += 5
        
        // Penalizaciones
        
        // Patrones comunes
        if (/123|abc|qwerty|admin|password|letmein|welcome/i.test(password)) score -= 20
        
        // Repeticiones
        if (/(.)\1{2,}/.test(password)) score -= 15
        
        // Secuencias
        if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) score -= 15
        
        // Asegurar que la puntuación esté entre 0 y 100
        score = Math.max(0, Math.min(100, score))
        
        // Determinar calificación
        let rating
        if (score >= 80) rating = 'Excelente'
        else if (score >= 60) rating = 'Buena'
        else if (score >= 40) rating = 'Media'
        else if (score >= 20) rating = 'Débil'
        else rating = 'Muy débil'
        
        // Sugerencias
        let suggestions = []
        if (password.length < 12) suggestions.push('Aumentar la longitud a al menos 12 caracteres')
        if (!/[a-z]/.test(password)) suggestions.push('Incluir letras minúsculas')
        if (!/[A-Z]/.test(password)) suggestions.push('Incluir letras mayúsculas')
        if (!/\d/.test(password)) suggestions.push('Incluir números')
        if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('Incluir caracteres especiales (!@#$%^&*)')
        if (new Set(password).size < 8) suggestions.push('Usar mayor variedad de caracteres')
        
        let response = `🔐 *ANÁLISIS DE CONTRASEÑA*\n\n`
          + `*Puntuación:* ${score}/100\n`
          + `*Calificación:* ${rating}\n`
          
        if (suggestions.length > 0) {
          response += `\n*Sugerencias para mejorar:*\n`
          suggestions.forEach((suggestion, index) => {
            response += `${index + 1}. ${suggestion}\n`
          })
        }
        
        response += `\n⚠️ *Nota:* Este análisis se realiza localmente y tu contraseña no se envía a ningún servidor externo.`
        
        m.reply(response)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al analizar la contraseña.')
      }
      break
      
    case 'encode':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} encode [texto]`)
      
      try {
        const text = args.slice(1).join(' ')
        const methods = {
          base64: Buffer.from(text).toString('base64'),
          hex: Buffer.from(text).toString('hex'),
          uri: encodeURIComponent(text),
        }
        
        let response = `🔒 *TEXTO CODIFICADO*\n\n`
          + `*Original:* ${text}\n\n`
          + `*Base64:* ${methods.base64}\n`
          + `*Hexadecimal:* ${methods.hex}\n`
          + `*URI:* ${methods.uri}`
        
        m.reply(response)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al codificar el texto.')
      }
      break
      
    case 'decode':
      if (!args[1] || !args[2]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} decode [método] [texto]\n\nMétodos disponibles: base64, hex, uri`)
      
      try {
        const method = args[1].toLowerCase()
        const encodedText = args.slice(2).join(' ')
        
        let decodedText
        
        switch (method) {
          case 'base64':
            decodedText = Buffer.from(encodedText, 'base64').toString()
            break
          case 'hex':
            decodedText = Buffer.from(encodedText, 'hex').toString()
            break
          case 'uri':
            decodedText = decodeURIComponent(encodedText)
            break
          default:
            return m.reply('❌ Método no válido. Usa base64, hex o uri.')
        }
        
        m.reply(`🔓 *TEXTO DECODIFICADO*\n\n*Método:* ${method}\n*Texto codificado:* ${encodedText}\n*Resultado:* ${decodedText}`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al decodificar. Verifica que el texto esté correctamente codificado con el método especificado.')
      }
      break
      
    case 'morse':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} morse [texto]`)
      
      try {
        const text = args.slice(1).join(' ').toUpperCase()
        const morseDict = {
          'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
          'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
          'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
          'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
          '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--',
          '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...',
          ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
          '$': '...-..-', '@': '.--.-.', ' ': '/'
        }
        
        let morse = ''
        for (let i = 0; i < text.length; i++) {
          if (morseDict[text[i]]) {
            morse += morseDict[text[i]] + ' '
          } else {
            morse += text[i] + ' '
          }
        }
        
        m.reply(`📟 *TEXTO A CÓDIGO MORSE*\n\n*Texto original:* ${text}\n*Código Morse:* ${morse.trim()}`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al convertir a código Morse.')
      }
      break
      
    case 'morse2txt':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} morse2txt [código morse]`)
      
      try {
        const morse = args.slice(1).join(' ')
        const morseDict = {
          '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F', '--.': 'G', '....': 'H',
          '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P',
          '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
          '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2', '...--': '3', '....-': '4',
          '.....': '5', '-....': '6', '--...': '7', '---..': '8', '----.': '9', '.-.-.-': '.', '--..--': ',',
          '..--..': '?', '.----.': "'", '-.-.--': '!', '-..-.': '/', '-.--.': '(', '-.--.-': ')', '.-...': '&',
          '---...': ':', '-.-.-.': ';', '-...-': '=', '.-.-.': '+', '-....-': '-', '..--.-': '_', '.-..-.': '"',
          '...-..-': '$', '.--.-.': '@', '/': ' '
        }
        
        const morseArray = morse.split(' ')
        let text = ''
        
        for (let i = 0; i < morseArray.length; i++) {
          if (morseDict[morseArray[i]]) {
            text += morseDict[morseArray[i]]
          } else if (morseArray[i] === '') {
            // Do nothing for empty spaces between words
          } else {
            text += '?'
          }
        }
        
        m.reply(`📟 *CÓDIGO MORSE A TEXTO*\n\n*Código Morse:* ${morse}\n*Texto decodificado:* ${text}`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al convertir de código Morse a texto.')
      }
      break
      
    case 'bin2text':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} bin2text [código binario]`)
      
      try {
        const binary = args.slice(1).join(' ').replace(/\s/g, '')
        
        // Verificar que sea binario válido
        if (!/^[01]+$/.test(binary)) {
          return m.reply('❌ Ingresa solo dígitos binarios (0 y 1).')
        }
        
        // Dividir en grupos de 8 bits
        let bytes = []
        for (let i = 0; i < binary.length; i += 8) {
          bytes.push(binary.substr(i, 8))
        }
        
        // Convertir cada byte a su valor ASCII
        let text = ''
        for (let i = 0; i < bytes.length; i++) {
          const byte = bytes[i].padEnd(8, '0')
          const decimal = parseInt(byte, 2)
          text += String.fromCharCode(decimal)
        }
        
        m.reply(`📊 *BINARIO A TEXTO*\n\n*Binario:* ${binary}\n*Texto decodificado:* ${text}`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al convertir de binario a texto.')
      }
      break
      
    case 'text2bin':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} text2bin [texto]`)
      
      try {
        const text = args.slice(1).join(' ')
        let binary = ''
        
        for (let i = 0; i < text.length; i++) {
          const decimal = text.charCodeAt(i)
          const bin = decimal.toString(2).padStart(8, '0')
          binary += bin + ' '
        }
        
        m.reply(`📊 *TEXTO A BINARIO*\n\n*Texto original:* ${text}\n*Código binario:* ${binary.trim()}`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al convertir de texto a binario.')
      }
      break
      
    case 'hex2text':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} hex2text [código hexadecimal]`)
      
      try {
        const hex = args.slice(1).join(' ').replace(/\s/g, '')
        
        // Verificar que sea hexadecimal válido
        if (!/^[0-9A-Fa-f]+$/.test(hex)) {
          return m.reply('❌ Ingresa solo dígitos hexadecimales válidos (0-9, A-F).')
        }
        
        // Convertir hexadecimal a texto
        let text = ''
        for (let i = 0; i < hex.length; i += 2) {
          const byte = hex.substr(i, 2)
          const decimal = parseInt(byte, 16)
          text += String.fromCharCode(decimal)
        }
        
        m.reply(`📊 *HEXADECIMAL A TEXTO*\n\n*Hexadecimal:* ${hex}\n*Texto decodificado:* ${text}`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al convertir de hexadecimal a texto.')
      }
      break
      
    case 'text2hex':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} text2hex [texto]`)
      
      try {
        const text = args.slice(1).join(' ')
        let hex = ''
        
        for (let i = 0; i < text.length; i++) {
          const decimal = text.charCodeAt(i)
          const hexValue = decimal.toString(16).padStart(2, '0')
          hex += hexValue + ' '
        }
        
        m.reply(`📊 *TEXTO A HEXADECIMAL*\n\n*Texto original:* ${text}\n*Código hexadecimal:* ${hex.trim()}`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al convertir de texto a hexadecimal.')
      }
      break
      
    case 'hash':
      if (!args[1] || !args[2]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} hash [algoritmo] [texto]\n\nAlgoritmos disponibles: md5, sha1, sha256, sha512`)
      
      try {
        const algorithm = args[1].toLowerCase()
        const text = args.slice(2).join(' ')
        
        const validAlgorithms = ['md5', 'sha1', 'sha256', 'sha512']
        if (!validAlgorithms.includes(algorithm)) {
          return m.reply(`❌ Algoritmo no válido. Usa uno de estos: ${validAlgorithms.join(', ')}`)
        }
        
        const hash = crypto.createHash(algorithm).update(text).digest('hex')
        
        m.reply(`🔏 *HASH GENERADO*\n\n*Algoritmo:* ${algorithm}\n*Texto original:* ${text}\n*Hash:* ${hash}`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al generar el hash.')
      }
      break
      
    case 'randomuser':
      try {
        // Simulación de usuario aleatorio con datos ficticios
        const genders = ['male', 'female']
        const gender = genders[Math.floor(Math.random() * genders.length)]
        
        const maleNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles']
        const femaleNames = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen']
        
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson']
        
        const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com']
        
        const countries = ['US', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Spain', 'Italy', 'Japan', 'Brazil']
        
        const firstName = gender === 'male' 
          ? maleNames[Math.floor(Math.random() * maleNames.length)]
          : femaleNames[Math.floor(Math.random() * femaleNames.length)]
          
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
        const age = Math.floor(Math.random() * 50) + 18
        const domain = domains[Math.floor(Math.random() * domains.length)]
        const country = countries[Math.floor(Math.random() * countries.length)]
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`
        
        const user = {
          gender,
          name: {
            first: firstName,
            last: lastName
          },
          email,
          age,
          country,
          phone: `+${Math.floor(Math.random() * 90) + 10}${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`
        }
        
        m.reply(`👤 *USUARIO ALEATORIO GENERADO*\n\n*Nombre:* ${user.name.first} ${user.name.last}\n*Género:* ${user.gender === 'male' ? 'Masculino' : 'Femenino'}\n*Edad:* ${user.age} años\n*Email:* ${user.email}\n*País:* ${user.country}\n*Teléfono:* ${user.phone}\n\n⚠️ *Nota:* Este es un usuario ficticio generado aleatoriamente. Cualquier coincidencia con personas reales es pura casualidad.`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al generar usuario aleatorio.')
      }
      break
      
    case 'fakeid':
      try {
        // Nota: Esto genera una identidad ficticia, no un documento oficial
        
        const countries = [
          { name: 'Estados Unidos', format: '###-##-####', prefix: 'SSN: ' },
          { name: 'España', format: '########X', prefix: 'DNI: ' },
          { name: 'México', format: 'XXXX######XXX', prefix: 'CURP: ' },
          { name: 'Argentina', format: '##.###.###', prefix: 'DNI: ' },
          { name: 'Colombia', format: '###########', prefix: 'CC: ' },
          { name: 'Brasil', format: '###.###.###-##', prefix: 'CPF: ' },
          { name: 'Chile', format: '##.###.###-#', prefix: 'RUT: ' },
          { name: 'Perú', format: '########', prefix: 'DNI: ' }
        ]
        
        const selectedCountry = countries[Math.floor(Math.random() * countries.length)]
        
        function generateRandomID(format) {
          return format.replace(/#/g, () => Math.floor(Math.random() * 10))
                       .replace(/X/g, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)])
        }
        
        const maleNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles']
        const femaleNames = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen']
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson']
        
        const gender = Math.random() > 0.5 ? 'Masculino' : 'Femenino'
        const firstName = gender === 'Masculino'
          ? maleNames[Math.floor(Math.random() * maleNames.length)]
          : femaleNames[Math.floor(Math.random() * femaleNames.length)]
        const lastName1 = lastNames[Math.floor(Math.random() * lastNames.length)]
        const lastName2 = lastNames[Math.floor(Math.random() * lastNames.length)]
        
        const age = Math.floor(Math.random() * 60) + 18
        const birthDate = new Date()
        birthDate.setFullYear(birthDate.getFullYear() - age)
        birthDate.setMonth(Math.floor(Math.random() * 12))
        birthDate.setDate(Math.floor(Math.random() * 28) + 1)
        
        const formattedBirthDate = birthDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
        
        const id = selectedCountry.prefix + generateRandomID(selectedCountry.format)
        
        m.reply(`🪪 *IDENTIDAD FICTICIA GENERADA*\n\n*País:* ${selectedCountry.name}\n*Nombre completo:* ${firstName} ${lastName1} ${lastName2}\n*Género:* ${gender}\n*Fecha de nacimiento:* ${formattedBirthDate}\n*Edad:* ${age} años\n*Identificación:* ${id}\n\n⚠️ *Nota:* Esta información es completamente ficticia y generada aleatoriamente. No utilizar para fines oficiales o ilegales.`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al generar identidad ficticia.')
      }
      break
      
    case 'colorinfo':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} colorinfo [código de color hex] - Ejemplo: #FF0000`)
      
      try {
        let colorCode = args[1].trim()
        
        // Validar formato de color hexadecimal
        if (!colorCode.startsWith('#')) {
          colorCode = '#' + colorCode
        }
        
        if (!/^#[0-9A-Fa-f]{6}$/.test(colorCode)) {
          return m.reply('❌ Ingresa un código de color hexadecimal válido (Ejemplo: #FF0000)')
        }
        
        // Convertir HEX a RGB
        const r = parseInt(colorCode.substring(1, 3), 16)
        const g = parseInt(colorCode.substring(3, 5), 16)
        const b = parseInt(colorCode.substring(5, 7), 16)
        
        // Convertir RGB a HSL
        const rNorm = r / 255
        const gNorm = g / 255
        const bNorm = b / 255
        
        const max = Math.max(rNorm, gNorm, bNorm)
        const min = Math.min(rNorm, gNorm, bNorm)
        
        let h, s, l = (max + min) / 2
        
        if (max === min) {
          h = s = 0 // acromático
        } else {
          const d = max - min
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
          switch (max) {
            case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break
            case gNorm: h = (bNorm - rNorm) / d + 2; break
            case bNorm: h = (rNorm - gNorm) / d + 4; break
          }
          h /= 6
        }
        
        const hsl = {
          h: Math.round(h * 360),
          s: Math.round(s * 100),
          l: Math.round(l * 100)
        }
        
        // Convertir a CMYK
        let c, m, y, k
        
        if (r === 0 && g === 0 && b === 0) {
          c = m = y = 0
          k = 1
        } else {
          const rNormalized = r / 255
          const gNormalized = g / 255
          const bNormalized = b / 255
          
          k = 1 - Math.max(rNormalized, gNormalized, bNormalized)
          c = (1 - rNormalized - k) / (1 - k)
          m = (1 - gNormalized - k) / (1 - k)
          y = (1 - bNormalized - k) / (1 - k)
          
          c = Math.round(c * 100)
          m = Math.round(m * 100)
          y = Math.round(y * 100)
          k = Math.round(k * 100)
        }
        
        const colorInfo = `🎨 *INFORMACIÓN DEL COLOR*\n\n`
          + `*Código HEX:* ${colorCode}\n`
          + `*RGB:* rgb(${r}, ${g}, ${b})\n`
          + `*HSL:* hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)\n`
          + `*CMYK:* cmyk(${c}%, ${m}%, ${y}%, ${k}%)\n`
        
        m.reply(colorInfo)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al procesar la información del color.')
      }
      break
      
    case 'calculadora':
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} calculadora [expresión matemática]\n\nEjemplo: ${usedPrefix + command} calculadora 2+2*3`)
      
      try {
        // Eliminamos caracteres peligrosos para evitar inyección de código
        let expression = args.slice(1).join('').replace(/[^0-9+\-*/().%]/g, '')
        
        // Evaluamos con límites de seguridad
        const MathJS = () => {
          // Creamos un entorno sandbox para evaluar la expresión
          const sandbox = {
            result: null
          }
          
          // Evaluamos en el sandbox
          try {
            sandbox.result = Function('"use strict"; return (' + expression + ')')()
          } catch (e) {
            throw new Error('Expresión inválida')
          }
          
          return sandbox.result
        }
        
        const result = MathJS()
        
        // Formateamos el resultado para números grandes o pequeños
        let formattedResult
        if (typeof result === 'number') {
          if (Math.abs(result) >= 1e21 || (Math.abs(result) < 1e-6 && result !== 0)) {
            formattedResult = result.toExponential(6)
          } else {
            formattedResult = result
          }
        } else {
          formattedResult = result
        }
        
        m.reply(`🔢 *CALCULADORA*\n\n*Expresión:* ${expression}\n*Resultado:* ${formattedResult}`)
      } catch (e) {
        console.error(e)
        m.reply(`❌ Error al calcular: ${e.message}`)
      }
      break
      
    case 'ocr':
      if (!m.quoted) return m.reply(`*Responde a una imagen con texto*\nUso: ${usedPrefix + command} ocr`)
      
      try {
        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || ''
        
        if (!mime.startsWith('image/')) return m.reply('❌ Responde a una imagen que contenga texto')
        
        m.reply('🔍 Procesando imagen, por favor espera...')
        
        // Descargamos la imagen
        const media = await q.download()
        
        // Simulación de OCR - En un bot real se usaría un servicio de OCR como Tesseract o una API
        // Esta es una simulación para fines de demostración
        
        const textoExtraido = "Este es un texto simulado extraído de la imagen. En una implementación real, se utilizaría un servicio de OCR para extraer el texto real de la imagen."
        
        m.reply(`📝 *TEXTO EXTRAÍDO DE LA IMAGEN*\n\n${textoExtraido}\n\n_Nota: En una implementación real, se extraería el texto actual de la imagen utilizando un servicio de OCR._`)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al procesar la imagen para OCR.')
      }
      break
      
    case 'ping':
      try {
        const start = new Date()
        
        await m.reply('🏓 Calculando ping...')
        
        const end = new Date()
        const ping = end - start
        
        const serverInfo = {
          ping: `${ping}ms`,
          uptime: clockString(process.uptime() * 1000),
          cpu: process.cpuUsage(),
          memory: process.memoryUsage()
        }
        
        const ramUsed = serverInfo.memory.rss / 1024 / 1024
        const ramTotal = 512 // Asumiendo 512MB para un entorno típico de Replit
        const ramPercent = (ramUsed / ramTotal * 100).toFixed(2)
        
        const response = `🖥️ *INFORMACIÓN DEL SERVIDOR*\n\n`
          + `*Ping:* ${serverInfo.ping}\n`
          + `*Tiempo activo:* ${serverInfo.uptime}\n`
          + `*RAM:* ${ramUsed.toFixed(2)} MB / ${ramTotal} MB (${ramPercent}%)\n`
          + `*Fecha:* ${new Date().toLocaleString()}\n`
        
        m.reply(response)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error al obtener información del servidor.')
      }
      break
      
    case 'nmap':
      // Nota: Este es un comando simulado, no realiza un escaneo real
      if (!args[1]) return m.reply(`*Formato correcto:*\n${usedPrefix + command} nmap [dominio o IP]`)
      
      try {
        const target = args[1].trim()
        
        m.reply(`🔍 *SIMULACIÓN DE ESCANEO DE RED*\n\n*Objetivo:* ${target}\n\nIniciando escaneo simulado...\n\n_Nota: Este es un comando simulado con fines educativos. En un entorno real, se utilizaría una herramienta de escaneo de red como Nmap._`)
        
        // Simulamos un tiempo de espera
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const ports = [
          { port: 21, service: 'FTP', state: Math.random() > 0.5 ? 'open' : 'closed' },
          { port: 22, service: 'SSH', state: Math.random() > 0.5 ? 'open' : 'closed' },
          { port: 25, service: 'SMTP', state: Math.random() > 0.5 ? 'open' : 'closed' },
          { port: 80, service: 'HTTP', state: Math.random() > 0.3 ? 'open' : 'closed' },
          { port: 443, service: 'HTTPS', state: Math.random() > 0.3 ? 'open' : 'closed' },
          { port: 3306, service: 'MySQL', state: Math.random() > 0.7 ? 'open' : 'closed' },
          { port: 8080, service: 'HTTP-Proxy', state: Math.random() > 0.7 ? 'open' : 'closed' }
        ]
        
        let scanResult = `🔍 *RESULTADOS DE ESCANEO SIMULADO*\n\n*Objetivo:* ${target}\n*Escaneo completado*\n\n*Puertos encontrados:*\n`
        
        ports.forEach(port => {
          scanResult += `- Puerto ${port.port}/${port.service}: ${port.state}\n`
        })
        
        scanResult += `\n⚠️ *AVISO LEGAL:* Esta es una SIMULACIÓN con fines educativos. No se realizó ningún escaneo real en el objetivo. El uso de herramientas de escaneo sin autorización apropiada puede ser ilegal.`
        
        m.reply(scanResult)
      } catch (e) {
        console.error(e)
        m.reply('❌ Error en la simulación de escaneo.')
      }
      break
      
    default:
      m.reply(`⚠️ Utilidad no encontrada. Usa *${usedPrefix + command}* para ver todas las utilidades disponibles.`)
  }
}

// Funciones auxiliares
function generateTempMail() {
  const usernames = ['user', 'jonh', 'alex', 'maria', 'robert', 'tech', 'dev', 'admin', 'test', 'info']
  const domains = ['tempmail.org', 'temp-mail.org', 'fakeinbox.com', 'temp-box.net', 'mailinator.com']
  
  const username = usernames[Math.floor(Math.random() * usernames.length)]
  const randomNum = Math.floor(Math.random() * 10000)
  const domain = domains[Math.floor(Math.random() * domains.length)]
  
  return `${username}${randomNum}@${domain}`
}

function clockString(ms) {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

handler.help = ['utilidades']
handler.tags = ['tools', 'utilidades']
handler.command = ['utilidades', 'utils', 'herramientas']

export default handler