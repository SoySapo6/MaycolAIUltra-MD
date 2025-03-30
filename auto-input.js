const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ejecutar el bot en modo silencioso
const botProcess = spawn('node', ['index.js'], {
  cwd: path.join(process.cwd(), 'Goku-Black-Bot-MD'),
  stdio: ['pipe', 'pipe', 'pipe'] 
});

// Registrar la salida estándar pero SIN imprimirla en la consola
botProcess.stdout.on('data', (data) => {
  const output = data.toString();
  
  // No imprimimos nada a la consola
  
  // Solo procesamos el texto para detectar patrones
  
  // Cuando se muestre el menú de selección, elegir automáticamente la opción 2
  if (output.includes('Seleccione una opción') || 
      output.includes('Con código QR') || 
      output.includes('Con código de texto de 8 dígitos')) {
    setTimeout(() => {
      botProcess.stdin.write('2\n');
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
    'whatsapp'
  ];
  
  // Verificar si alguno de los patrones está presente en la salida
  const phonePatternFound = phonePatterns.some(pattern => output.includes(pattern));
  
  // Cuando se solicite ingresar el número de teléfono, enviarlo automáticamente
  if (phonePatternFound) {
    setTimeout(() => {
      const phoneNumber = '51921826291'; // Formato completo: código de país (51) + número completo (PERÚ)
      botProcess.stdin.write(phoneNumber + '\n');
    }, 1000);
  }
  
  // Si detectamos un código de vinculación, imprimirlo silenciosamente en un archivo
  if (output.includes('CÓDIGO DE VINCULACIÓN')) {
    fs.appendFileSync('codigo-vinculacion.txt', output.trim() + '\n');
  }
});

// Enviar número de teléfono después de un tiempo predeterminado en caso de que la detección falle
setTimeout(() => {
  botProcess.stdin.write('51921826291\n');
}, 15000);

// Manejar fin del proceso
botProcess.on('close', () => {
  process.exit();
});

// Manejar señales para cerrar correctamente
process.on('SIGINT', () => {
  botProcess.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  botProcess.kill('SIGTERM');
  process.exit();
});