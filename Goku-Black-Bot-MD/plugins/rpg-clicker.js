import pkg from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // Verificar si la base de datos existe
  if (!global.db.data.clicker) global.db.data.clicker = {};
  // Verificar si el usuario existe en la base de datos
  if (!global.db.data.clicker[m.sender]) global.db.data.clicker[m.sender] = {
    clicks: 0,
    lastClick: 0,
    multiplier: 1,
    upgrades: {
      autoClick: 0,
      multiplier: 0
    }
  };

  // Obtener datos del usuario
  const user = global.db.data.clicker[m.sender];
  
  // Procesar el clic
  if (command === 'click') {
    // Incrementar contador de clics
    user.clicks += user.multiplier;
    user.lastClick = Date.now();
    
    // Mostrar mensaje de clics
    m.reply(`🎮 *¡CLIC!* 🎮\n\n✨ Tienes *${user.clicks.toLocaleString()}* clics\n⚡ Multiplicador: x${user.multiplier}`);
    return;
  }
  
  // Si es el comando principal, mostrar botón interactivo
  if (command === 'clicker') {
    // Obtener estadísticas
    const stats = `🎮 *RPG CLICKER* 🎮\n
✨ *Clics totales:* ${user.clicks.toLocaleString()}
⚡ *Multiplicador:* x${user.multiplier}
🤖 *Auto-clickers:* ${user.upgrades.autoClick}`;

    try {
      const message = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
              body: proto.Message.InteractiveMessage.Body.create({
                text: stats
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: '¡Haz clic para ganar puntos!'
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: 'RPG CLICKER',
                hasMediaAttachment: false
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                  {
                    "name": "cta_copy",
                    "buttonParamsJson": JSON.stringify({
                      "display_text": "¡CLICK!",
                      "copy_code": `.click`
                    })
                  },
                  {
                    "name": "cta_copy",
                    "buttonParamsJson": JSON.stringify({
                      "display_text": "Multiplicador (100 clics)",
                      "copy_code": `.clicker upgrade multiplier`
                    })
                  },
                  {
                    "name": "cta_copy",
                    "buttonParamsJson": JSON.stringify({
                      "display_text": "Auto-Clicker (500 clics)",
                      "copy_code": `.clicker upgrade auto`
                    })
                  }
                ]
              })
            })
          }
        }
      }, {
        'quoted': m
      });

      await conn.relayMessage(m.chat, message.message, { messageId: message.key.id });
    } catch (error) {
      console.error(error);
      m.reply('⚠️ Ocurrió un error al generar el juego de clicker');
    }
    return;
  }
  
  // Procesar compra de mejoras
  if (command === 'clicker' && text.startsWith('upgrade')) {
    const type = text.split(' ')[1];
    
    if (type === 'multiplier') {
      const cost = 100 * (user.upgrades.multiplier + 1);
      
      if (user.clicks < cost) {
        m.reply(`⚠️ Necesitas ${cost} clics para mejorar tu multiplicador. Te faltan ${cost - user.clicks} clics.`);
        return;
      }
      
      user.clicks -= cost;
      user.upgrades.multiplier += 1;
      user.multiplier += 1;
      
      m.reply(`✅ Has mejorado tu multiplicador a x${user.multiplier} por ${cost} clics.\n\n✨ Clics restantes: ${user.clicks}`);
      return;
    }
    
    if (type === 'auto') {
      const cost = 500 * (user.upgrades.autoClick + 1);
      
      if (user.clicks < cost) {
        m.reply(`⚠️ Necesitas ${cost} clics para comprar un auto-clicker. Te faltan ${cost - user.clicks} clics.`);
        return;
      }
      
      user.clicks -= cost;
      user.upgrades.autoClick += 1;
      
      m.reply(`✅ Has comprado un auto-clicker por ${cost} clics. Ahora tienes ${user.upgrades.autoClick} auto-clickers.\n\n✨ Clics restantes: ${user.clicks}`);
      return;
    }
    
    m.reply(`⚠️ Mejora no reconocida. Usa 'multiplier' o 'auto'.`);
    return;
  }
  
  // Procesar auto-clicker cada minuto (se ejecuta cada vez que se llama a un comando)
  const now = Date.now();
  if (user.upgrades.autoClick > 0 && (now - user.lastClick > 60000)) {
    const autoClicks = user.upgrades.autoClick * 10; // 10 clics por auto-clicker
    user.clicks += autoClicks;
    user.lastClick = now;
    // No enviar mensaje para evitar spam
  }
};

handler.help = ['clicker', 'click'];
handler.tags = ['game', 'rpg'];
handler.command = ['clicker', 'click'];

export default handler;