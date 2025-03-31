const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para iniciar el dashboard
function startDashboard() {
  console.log('🚀 Iniciando Dashboard Web automáticamente...');
  
  // Ruta al archivo del servidor dashboard
  const dashboardPath = path.join(__dirname, 'dashboard-server.cjs');
  
  // Verificar que el archivo existe
  if (!fs.existsSync(dashboardPath)) {
    console.error(`❌ No se encontró el archivo ${dashboardPath}`);
    return;
  }
  
  // Iniciar el servidor de dashboard como un proceso hijo
  const dashboard = spawn('node', [dashboardPath], {
    detached: true,
    stdio: 'inherit'
  });
  
  // Manejar eventos del proceso
  dashboard.on('error', (err) => {
    console.error('❌ Error al iniciar el dashboard:', err);
  });
  
  // No esperamos a que termine el proceso
  dashboard.unref();
  
  console.log('✅ Dashboard Web iniciado correctamente en segundo plano');
}

// Iniciar el dashboard web automáticamente
startDashboard();

module.exports = { startDashboard };