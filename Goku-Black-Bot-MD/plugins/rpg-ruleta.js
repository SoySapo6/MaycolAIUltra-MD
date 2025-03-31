// Sistema de Ruleta para Goku-Black-Bot-MD / MaycolAIUltra-MD
// Creado para proporcionar diversión y recompensas a los usuarios

let handler = async (m, { conn, usedPrefix, command, args, isOwner }) => {
  const sender = m.sender;
  
  // Asegurarse de que el usuario exista en la base de datos
  if (!global.db.data.users[sender]) {
    global.db.data.users[sender] = {
      lastRoulette: 0,
      money: 0,
      exp: 0,
      limit: 0
    };
  }
  
  // Comprobar si el usuario tiene cooldown
  const cooldown = 10 * 60 * 1000; // 10 minutos
  const lastRoulette = global.db.data.users[sender].lastRoulette || 0;
  const now = Date.now();
  const timeLeft = lastRoulette + cooldown - now;
  
  if (timeLeft > 0 && !isOwner) {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return conn.reply(m.chat, `⏰ Debes esperar ${minutes} minutos y ${seconds} segundos antes de usar la ruleta nuevamente.`, m);
  }
  
  // Tipos de ruleta
  const ruletaTypes = {
    'normal': {
      cost: 50,
      rewards: [
        { type: 'money', min: 20, max: 200, chance: 0.5 },
        { type: 'exp', min: 10, max: 150, chance: 0.4 },
        { type: 'limit', min: 1, max: 3, chance: 0.1 }
      ]
    },
    'premium': {
      cost: 200,
      rewards: [
        { type: 'money', min: 100, max: 1000, chance: 0.4 },
        { type: 'exp', min: 50, max: 500, chance: 0.3 },
        { type: 'limit', min: 2, max: 8, chance: 0.2 },
        { type: 'diamond', min: 1, max: 2, chance: 0.1 }
      ]
    },
    'deluxe': {
      cost: 500,
      rewards: [
        { type: 'money', min: 300, max: 3000, chance: 0.35 },
        { type: 'exp', min: 200, max: 1000, chance: 0.25 },
        { type: 'limit', min: 5, max: 15, chance: 0.2 },
        { type: 'diamond', min: 1, max: 5, chance: 0.15 },
        { type: 'rare', min: 1, max: 1, chance: 0.05 }
      ]
    }
  };
  
  // Verificar qué tipo de ruleta quiere jugar el usuario
  const ruletaType = (args[0] || 'normal').toLowerCase();
  
  if (!ruletaTypes[ruletaType]) {
    return conn.reply(m.chat, `❌ Tipo de ruleta inválido. Las opciones son: normal, premium, deluxe.`, m);
  }
  
  const selectedRuleta = ruletaTypes[ruletaType];
  const cost = selectedRuleta.cost;
  
  // Verificar si el usuario tiene suficiente dinero
  if ((global.db.data.users[sender].money || 0) < cost) {
    return conn.reply(m.chat, `❌ No tienes suficientes monedas. Necesitas ${cost} monedas para jugar la ruleta ${ruletaType}.`, m);
  }
  
  // Cobrar el costo
  global.db.data.users[sender].money -= cost;
  
  // Función para determinar una recompensa basada en probabilidades
  function getRandomReward(rewards) {
    // Ordenar las recompensas por probabilidad de menor a mayor
    const sortedRewards = [...rewards].sort((a, b) => a.chance - b.chance);
    
    // Calcular probabilidades acumulativas
    let cumulativeChance = 0;
    const cumulativeRewards = sortedRewards.map(reward => {
      cumulativeChance += reward.chance;
      return { ...reward, cumulative: cumulativeChance };
    });
    
    // Generar un número aleatorio entre 0 y 1
    const randomNum = Math.random();
    
    // Encontrar la recompensa basada en el número aleatorio
    return cumulativeRewards.find(reward => randomNum <= reward.cumulative);
  }
  
  // Seleccionar recompensa
  const reward = getRandomReward(selectedRuleta.rewards);
  const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;
  
  // Aplicar recompensa
  let rewardMessage = '';
  switch(reward.type) {
    case 'money':
      global.db.data.users[sender].money = (global.db.data.users[sender].money || 0) + amount;
      rewardMessage = `💰 ¡Has ganado ${amount} monedas!`;
      break;
    case 'exp':
      global.db.data.users[sender].exp = (global.db.data.users[sender].exp || 0) + amount;
      rewardMessage = `✨ ¡Has ganado ${amount} de experiencia!`;
      break;
    case 'limit':
      global.db.data.users[sender].limit = (global.db.data.users[sender].limit || 0) + amount;
      rewardMessage = `⏳ ¡Has ganado ${amount} de límite!`;
      break;
    case 'diamond':
      global.db.data.users[sender].diamond = (global.db.data.users[sender].diamond || 0) + amount;
      rewardMessage = `💎 ¡Has ganado ${amount} diamantes!`;
      break;
    case 'rare':
      global.db.data.users[sender].uncommon = (global.db.data.users[sender].uncommon || 0) + amount;
      rewardMessage = `🎭 ¡Has ganado ${amount} item raro!`;
      break;
  }
  
  // Actualizar último uso de la ruleta
  global.db.data.users[sender].lastRoulette = now;
  
  // Mensaje de éxito
  const message = `
🎰 *RULETA ${ruletaType.toUpperCase()}* 🎰

${rewardMessage}

💵 Costo: ${cost} monedas
💰 Monedas restantes: ${global.db.data.users[sender].money}

¡Vuelve en 10 minutos para jugar de nuevo!
  `;
  
  return conn.reply(m.chat, message, m);
};

handler.help = ['ruleta [normal/premium/deluxe]'];
handler.tags = ['rpg', 'game'];
handler.command = /^(ruleta)$/i;
handler.register = true;

export default handler;