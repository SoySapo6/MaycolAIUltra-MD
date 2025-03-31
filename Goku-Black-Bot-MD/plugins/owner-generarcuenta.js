// Plugin para generar cuentas de acceso al dashboard exclusivamente para el owner
import { randomBytes, createHash } from 'crypto';
import fetch from 'node-fetch';

// Función para generar una contraseña aleatoria
const generatePassword = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = randomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
};

// Función para encriptar la contraseña
const hashPassword = (password) => {
  return createHash('sha256').update(password).digest('hex');
};

let handler = async (m, { conn, args, usedPrefix, command }) => {
  // Verificar si el usuario es owner (usando tu número específico)
  const ownerNumber = '51921826291@s.whatsapp.net'; // El número del propietario
  
  if (m.sender !== ownerNumber) {
    return conn.reply(m.chat, '❌ Este comando solo puede ser utilizado por el propietario del bot.', m);
  }
  
  // Generar credenciales
  const username = ownerNumber.split('@')[0]; // Usar el número del propietario como username
  const password = generatePassword(10); // Generar contraseña aleatoria
  const hashedPassword = hashPassword(password);
  const token = randomBytes(32).toString('hex');
  
  try {
    // Obtener la URL del dashboard
    const dashboardUrl = process.env.DASHBOARD_URL || 'https://b7467a67-cb11-4284-b09a-fa80d487d271-00-1nfssjab5ml8k.worf.repl.co';
    
    // Registrar las credenciales en el dashboard
    const response = await fetch(`${dashboardUrl}/api/register-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password: hashedPassword,
        token,
        isOwner: true,
        registeredBy: 'owner-command'
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Guardar credenciales en la base de datos
      if (!global.db.data.dashboardAccounts) {
        global.db.data.dashboardAccounts = [];
      }
      
      global.db.data.dashboardAccounts.push({
        username,
        passwordHash: hashedPassword,
        token,
        createdAt: Date.now(),
        isOwner: true
      });
      
      // Mensaje de éxito con las credenciales
      const successMessage = `
📱 *CUENTA GENERADA EXITOSAMENTE* 📱

👤 *Usuario:* ${username}
🔑 *Contraseña:* ${password}
🔐 *Token:* ${token}

🌐 *Dashboard URL:* ${dashboardUrl}

⚠️ *IMPORTANTE:* Guarda estas credenciales en un lugar seguro. No las compartas con nadie.
      `;
      
      return conn.reply(m.chat, successMessage, m);
    } else {
      throw new Error(data.message || 'Error desconocido al registrar la cuenta');
    }
  } catch (error) {
    console.error('Error al generar cuenta:', error);
    return conn.reply(m.chat, `❌ Error al generar la cuenta: ${error.message}`, m);
  }
};

handler.help = ['generarcuenta'];
handler.tags = ['owner'];
handler.command = /^(generarcuenta)$/i;
handler.rowner = true;

export default handler;