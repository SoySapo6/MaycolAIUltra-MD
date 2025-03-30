const http = require('http');
const { exec } = require('child_process');

// Crear un servidor HTTP simple para mantener activa la replit
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot está funcionando 24/7\n');
});

// Escuchar en el puerto 5000 (importante para Replit)
server.listen(5000, () => {
  console.log('✅ Servidor keep-alive iniciado en el puerto 5000');
});

// Función para verificar si el bot está funcionando
function checkBotStatus() {
  exec('ps aux | grep "[n]ode.*index.js"', (error, stdout, stderr) => {
    // Si no hay resultados, significa que el bot no está ejecutándose
    if (!stdout || stdout.trim() === '') {
      console.log('⚠️ Bot no detectado, reiniciando...');
      // Reiniciar el bot
      exec('cd Goku-Black-Bot-MD && node index.js &', (err, stdout, stderr) => {
        if (err) {
          console.error('Error al reiniciar el bot:', err);
        } else {
          console.log('✅ Bot reiniciado correctamente');
        }
      });
    }
  });
}

// Verificar el estado del bot cada 5 minutos
setInterval(checkBotStatus, 5 * 60 * 1000);

// Mensaje inicial
console.log('✅ Sistema de monitoreo 24/7 activado para Goku-Black-Bot-MD');
console.log('✅ El bot se mantendrá activo automáticamente');

// Ejecutar una verificación inicial
checkBotStatus();