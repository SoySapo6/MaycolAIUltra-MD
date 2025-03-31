/**
 * Funciones auxiliares para el bot MaycolAIUltra-MD
 */

/**
 * Crea una promesa que se resuelve después de un tiempo especificado
 * @param {number} ms - Tiempo de espera en milisegundos
 * @returns {Promise<void>} Promesa que se resuelve después del tiempo especificado
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Genera un ID aleatorio con el formato y longitud especificados
 * @param {string} [format='xxxx-xxxx-xxxx'] - Formato del ID (x: caracter aleatorio, #: número aleatorio)
 * @returns {string} ID generado
 */
export function generateRandomID(format = 'xxxx-xxxx-xxxx') {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let result = ''
  
  for (let i = 0; i < format.length; i++) {
    if (format[i] === 'x') {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    } else if (format[i] === '#') {
      result += Math.floor(Math.random() * 10)
    } else {
      result += format[i]
    }
  }
  
  return result
}

/**
 * Formatea un número de bytes en una representación legible
 * @param {number} bytes - Número de bytes a formatear
 * @param {number} [decimals=2] - Número de decimales a mostrar
 * @returns {string} Representación formateada
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Convierte milisegundos a formato de tiempo legible (HH:MM:SS)
 * @param {number} ms - Tiempo en milisegundos
 * @returns {string} Tiempo formateado
 */
export function clockString(ms) {
  const h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
  const m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  const s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

/**
 * Obtiene una fecha formateada
 * @param {Date} [date=new Date()] - Objeto de fecha
 * @returns {string} Fecha formateada
 */
export function getFormattedDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Trunca un texto si excede la longitud máxima
 * @param {string} str - Texto a truncar
 * @param {number} [maxLength=100] - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncateString(str, maxLength = 100) {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}