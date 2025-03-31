// Script para mantener vivo el bot en Replit
const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const https = require('https');

// Función para hacer solicitudes HTTP usando el módulo nativo de Node.js
function simpleFetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: () => Promise.resolve(data)
        });
      });
    }).on('error', reject);
  });
}

// Variables de entorno de Replit
const REPLIT_SLUG = process.env.REPL_SLUG || 'my-repl';
const REPLIT_OWNER = process.env.REPL_OWNER || 'user';
const REPLIT_URL = 'https://b7467a67-cb11-4284-b09a-fa80d487d271-00-1nfssjab5ml8k.worf.repl.co';

// No creamos un servidor HTTP ya que el dashboard web ya está usando el puerto 5000
console.log('✅ Keep-Alive configurado para monitoreo sin servidor HTTP (usa el dashboard web)');

// Función para verificar si el bot está funcionando
function checkBotStatus() {
  const timestamp = new Date().toISOString();
  
  exec('ps aux | grep "[n]ode.*index.js"', (error, stdout, stderr) => {
    // Si no hay resultados, significa que el bot no está ejecutándose
    if (!stdout || stdout.trim() === '') {
      console.log(`[${timestamp}] ⚠️ Bot no detectado, reiniciando...`);
      
      // Reiniciar el bot
      exec('cd Goku-Black-Bot-MD && node index.js &', (err, stdout, stderr) => {
        if (err) {
          console.error(`[${timestamp}] Error al reiniciar el bot:`, err);
        } else {
          console.log(`[${timestamp}] ✅ Bot reiniciado correctamente`);
        }
      });
    } else {
      // Bot en funcionamiento
      console.log(`[${timestamp}] ✓ Bot detectado en ejecución`);
    }
  });
}

// Auto-ping para mantener activo el Replit
async function keepReplicationAlive() {
  const timestamp = new Date().toISOString();
  try {
    // Realizar ping a la URL de Replit
    const response = await simpleFetch(REPLIT_URL);
    if (response.ok) {
      console.log(`[${timestamp}] ✓ Ping a Replit exitoso`);
    } else {
      console.log(`[${timestamp}] ⚠️ Ping a Replit respondió con: ${response.status}`);
    }
  } catch (error) {
    console.error(`[${timestamp}] ✗ Error en ping a Replit:`, error.message);
  }
}

// Verificar el estado del bot cada 5 minutos
setInterval(checkBotStatus, 5 * 60 * 1000);

// Hacer ping al replit cada 15 minutos
setInterval(keepReplicationAlive, 15 * 60 * 1000);

// Mensaje inicial
console.log('✅ Sistema de monitoreo 24/7 activado para Goku-Black-Bot-MD');
console.log('✅ El bot se mantendrá activo automáticamente');
console.log(`✅ URL de Replit: ${REPLIT_URL}`);

// Ejecutar una verificación inicial
checkBotStatus();

// Hacer ping inicial
keepReplicationAlive();