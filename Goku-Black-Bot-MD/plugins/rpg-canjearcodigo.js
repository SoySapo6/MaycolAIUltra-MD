import crypto from 'crypto';

// Función para generar un código aleatorio
const generateRedeemCode = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  return code;
};

// Función para verificar si un código es válido
const isValidCode = (code, storedCodes) => {
  return storedCodes.some(stored => 
    stored.code === code && !stored.redeemed && (stored.expiresAt === 0 || stored.expiresAt > Date.now())
  );
};

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  // Inicializar códigos de canje en la base de datos si no existen
  if (!global.db.data.redeemCodes) {
    global.db.data.redeemCodes = [];
  }

  // Comando para canjear un código
  if (command === 'canjearcodigo') {
    if (!text) return conn.reply(m.chat, `⚠️ Debes ingresar un código. Ejemplo: ${usedPrefix}canjearcodigo ABC123XYZ`, m);

    const code = text.trim().toUpperCase();
    const userId = m.sender;

    // Verificar si el código existe y es válido
    const codeIndex = global.db.data.redeemCodes.findIndex(c => 
      c.code === code && !c.redeemed && (c.expiresAt === 0 || c.expiresAt > Date.now())
    );

    if (codeIndex === -1) {
      return conn.reply(m.chat, '❌ Código inválido o ya ha sido canjeado.', m);
    }

    // Obtener la información del código
    const codeInfo = global.db.data.redeemCodes[codeIndex];
    
    // Marcar el código como canjeado
    global.db.data.redeemCodes[codeIndex].redeemed = true;
    global.db.data.redeemCodes[codeIndex].redeemedBy = userId;
    global.db.data.redeemCodes[codeIndex].redeemedAt = Date.now();

    // Verificar si el usuario existe en la base de datos
    if (!global.db.data.users[userId]) {
      global.db.data.users[userId] = {};
    }

    // Asignar las recompensas al usuario
    const { coins, exp, limit } = codeInfo.rewards;
    
    if (coins) {
      global.db.data.users[userId].money = (global.db.data.users[userId].money || 0) + coins;
    }
    
    if (exp) {
      global.db.data.users[userId].exp = (global.db.data.users[userId].exp || 0) + exp;
    }
    
    if (limit) {
      global.db.data.users[userId].limit = (global.db.data.users[userId].limit || 0) + limit;
    }

    // Enviar mensaje de confirmación
    return conn.reply(m.chat, `✅ ¡Código canjeado con éxito!
📊 Recompensas obtenidas:
${coins ? `💰 Monedas: +${coins}` : ''}
${exp ? `✨ Experiencia: +${exp}` : ''}
${limit ? `⏳ Límite: +${limit}` : ''}

¡Gracias por usar MaycolAIUltra-MD!`, m);
  }
  
  // Comando para generar un código (solo para el dueño)
  else if (command === 'generarcodigo') {
    // Verificar si el usuario es el dueño
    if (!global.owner.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)) {
      return conn.reply(m.chat, '❌ Solo el dueño del bot puede generar códigos.', m);
    }

    // Parse argumentos: monedas, exp, límite, días de expiración
    const parseArg = (argName) => {
      const arg = args.find(a => a.startsWith(`${argName}:`));
      return arg ? parseInt(arg.split(':')[1]) : 0;
    };

    const coins = parseArg('monedas');
    const exp = parseArg('exp');
    const limit = parseArg('limite');
    const expireDays = parseArg('dias');
    
    if (coins === 0 && exp === 0 && limit === 0) {
      return conn.reply(m.chat, `⚠️ Debes especificar al menos un tipo de recompensa.
Ejemplo: ${usedPrefix}generarcodigo monedas:1000 exp:500 limite:10 dias:7`, m);
    }

    // Generar código único
    const code = generateRedeemCode(10);
    
    // Calcular fecha de expiración (0 significa sin expiración)
    const expiresAt = expireDays > 0 ? Date.now() + (expireDays * 24 * 60 * 60 * 1000) : 0;

    // Guardar código en la base de datos
    global.db.data.redeemCodes.push({
      code,
      createdAt: Date.now(),
      createdBy: m.sender,
      expiresAt,
      redeemed: false,
      redeemedBy: null,
      redeemedAt: null,
      rewards: { coins, exp, limit }
    });

    // Enviar código al dueño
    return conn.reply(m.chat, `✅ Código generado con éxito:
📝 *CÓDIGO*: ${code}
📊 *RECOMPENSAS*:
${coins ? `💰 Monedas: ${coins}` : ''}
${exp ? `✨ Experiencia: ${exp}` : ''}
${limit ? `⏳ Límite: ${limit}` : ''}
${expireDays > 0 ? `⏰ Expira en: ${expireDays} días` : '⏰ Sin expiración'}

Comparte este código con los usuarios para que puedan canjearlo.`, m);
  }
  
  // Comando para listar códigos (solo para el dueño)
  else if (command === 'listcodigos') {
    // Verificar si el usuario es el dueño
    if (!global.owner.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)) {
      return conn.reply(m.chat, '❌ Solo el dueño del bot puede ver la lista de códigos.', m);
    }

    const codes = global.db.data.redeemCodes;
    if (!codes || codes.length === 0) {
      return conn.reply(m.chat, '📝 No hay códigos generados.', m);
    }

    // Filtrar códigos no expirados
    const validCodes = codes.filter(c => !c.redeemed && (c.expiresAt === 0 || c.expiresAt > Date.now()));
    const redeemedCodes = codes.filter(c => c.redeemed);

    let message = `📋 *LISTA DE CÓDIGOS*\n\n`;
    message += `🟢 *Códigos válidos*: ${validCodes.length}\n`;
    message += `🔴 *Códigos canjeados*: ${redeemedCodes.length}\n\n`;

    // Mostrar códigos válidos
    if (validCodes.length > 0) {
      message += `*CÓDIGOS DISPONIBLES:*\n`;
      validCodes.forEach((c, i) => {
        message += `${i + 1}. *${c.code}*\n`;
        message += `   💰 Monedas: ${c.rewards.coins || 0}\n`;
        message += `   ✨ Exp: ${c.rewards.exp || 0}\n`;
        message += `   ⏳ Límite: ${c.rewards.limit || 0}\n`;
        message += `   📅 Creado: ${new Date(c.createdAt).toLocaleDateString()}\n`;
        message += `   ⏰ Expira: ${c.expiresAt === 0 ? 'Nunca' : new Date(c.expiresAt).toLocaleDateString()}\n\n`;
      });
    }

    return conn.reply(m.chat, message, m);
  }
};

handler.help = [
  'canjearcodigo <código>',
  'generarcodigo monedas:X exp:Y limite:Z dias:W',
  'listcodigos'
];
handler.tags = ['rpg'];
handler.command = /^(canjearcodigo|generarcodigo|listcodigos)$/i;

export default handler;