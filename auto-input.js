const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// El número de teléfono que quieres usar
const phoneNumber = '51921826291';

// Ejecutar el bot
const botProcess = spawn('node', ['Ivan.js'], {
  cwd: path.join(process.cwd(), 'Goku-Black-Bot-MD'),
  stdio: ['pipe', 'pipe', 'pipe']
});

// Registrar la salida estándar del proceso
botProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  // Cuando se muestre el menú de selección, elegir automáticamente la opción 2
  if (output.includes('Seleccione una opción') || output.includes('Con código de texto de 8 dígitos')) {
    setTimeout(() => {
      botProcess.stdin.write('2\n');
      console.log('Opción 2 seleccionada automáticamente (Código de texto de 8 dígitos)');
    }, 1000);
  }
  
  // Cuando se solicite ingresar el número de teléfono, enviarlo automáticamente
  if (output.includes('Por favor, Ingrese el número de WhatsApp')) {
    setTimeout(() => {
      botProcess.stdin.write(phoneNumber + '\n');
      console.log(`Número de teléfono enviado automáticamente: ${phoneNumber}`);
    }, 1000);
  }
});

// Registrar la salida de error del proceso
botProcess.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

// Cuando el proceso termine
botProcess.on('close', (code) => {
  console.log(`Proceso del bot terminado con código: ${code}`);
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