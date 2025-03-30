const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Función para escribir logs en un archivo
const logToFile = (message) => {
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync('bot-interaction.log', logMessage);
  console.log(message);
};

// El número de teléfono que quieres usar
// Usando solo el formato correcto especificado
const phoneFormats = [
  '51921826291',  // Formato completo: código de país (51) + número completo (PERÚ)
];
let currentFormatIndex = 0;
const getNextPhoneFormat = () => {
  return phoneFormats[0]; // Siempre usando el formato principal
};

// Ejecutar el bot
const botProcess = spawn('node', ['index.js'], {
  cwd: path.join(process.cwd(), 'Goku-Black-Bot-MD'),
  stdio: ['pipe', 'pipe', 'pipe']
});

// Enviar número de teléfono después de un tiempo predeterminado
// en caso de que la detección de patrones falle
setTimeout(() => {
  const phoneNumber = '51921826291';
  botProcess.stdin.write(phoneNumber + '\n');
  logToFile(`Número de teléfono enviado proactivamente después de espera: ${phoneNumber}`);
}, 15000); // 15 segundos después de iniciar

// Registrar la salida estándar del proceso
botProcess.stdout.on('data', (data) => {
  const output = data.toString();
  logToFile(`Bot output [${new Date().toISOString()}]: ${output.trim()}`);
  
  // Registrar absolutamente toda salida para diagnóstico
  console.log(`DIAGNÓSTICO BOT - SALIDA COMPLETA: ${output.trim()}`);
  
  // Guardar la última salida para análisis
  let lastOutput = output.trim();
  
  // Si la salida contiene texto relacionado con WhatsApp, logs especiales
  if (output.includes('WhatsApp') || 
      output.includes('Whatsapp') || 
      output.includes('whatsapp') ||
      output.includes('conexión') ||
      output.includes('conectando') ||
      output.includes('esperando') ||
      output.includes('vinculación') ||
      output.includes('código') ||
      output.includes('Baileys')) {
    logToFile(`🔄 ESTADO DE CONEXIÓN WHATSAPP: ${output.trim()}`);
  }
  
  // Cuando se muestre el menú de selección, elegir automáticamente la opción 2
  if (output.includes('Seleccione una opción') || 
      output.includes('Con código QR') || 
      output.includes('Con código de texto de 8 dígitos')) {
    setTimeout(() => {
      botProcess.stdin.write('2\n');
      logToFile('Opción 2 seleccionada automáticamente (Código de texto de 8 dígitos)');
    }, 1000);
  }
  
  // Patrones para detectar solicitud de número de teléfono
  const phonePatterns = [
    'Por favor, Ingrese el número de WhatsApp',
    'Ingrese el número de WhatsApp',
    '🚩 Por favor, Ingrese el número',
    'Ingrese su número de WhatsApp',
    'Número de teléfono completo',
    'Número de WhatsApp',
    'ngrese el número',
    'teléfono',
    'completo',
    'whatsapp',
    'celular',
    'móvil',
    'movil',
    'Escanea',
    'vincularse'
  ];
  
  // Verificar si alguno de los patrones está presente en la salida
  const phonePatternFound = phonePatterns.some(pattern => output.includes(pattern));
  
  // Cuando se solicite ingresar el número de teléfono, enviarlo automáticamente
  if (phonePatternFound) {
    setTimeout(() => {
      const phoneNumber = getNextPhoneFormat();
      botProcess.stdin.write(phoneNumber + '\n');
      logToFile(`Número de teléfono enviado automáticamente: ${phoneNumber}`);
    }, 1000);
  }
  
  // Imprimir código de vinculación cuando aparezca
  if (output.includes('CÓDIGO DE VINCULACIÓN') || 
      output.includes('Código de emparejamiento') || 
      output.includes('CÓDIGO DE VINCULACIÓN:') ||
      output.includes('código de vinculación') ||
      output.includes('código de 8 dígitos') ||
      output.includes('CÓDIGO') ||
      output.includes('código') ||
      output.includes('vinculación') ||
      output.includes('VINCULACIÓN') ||
      output.includes('conectarse') ||
      output.includes('Conectarse') ||
      output.includes('Escanea') ||
      output.includes('escanear') ||
      output.includes('dígitos')) {
    logToFile(`👑 POSIBLE CÓDIGO DE VINCULACIÓN DETECTADO: ${output.trim()} 👑`);
  }
  
  // Detectar errores o mensajes de invalidez
  if (output.includes('inválido') || 
      output.includes('invalido') || 
      output.includes('error') || 
      output.includes('Error') || 
      output.includes('incorrecto')) {
    logToFile(`⚠️ DETECTADO ERROR O NÚMERO INVÁLIDO: ${output.trim()}`);
  }
});

// Registrar la salida de error del proceso
botProcess.stderr.on('data', (data) => {
  logToFile(`ERROR: ${data}`);
});

// Cuando el proceso termine
botProcess.on('close', (code) => {
  logToFile(`Proceso del bot terminado con código: ${code}`);
});

// Manejar señales para cerrar el proceso correctamente
process.on('SIGINT', () => {
  botProcess.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  botProcess.kill('SIGTERM');
  process.exit();
});