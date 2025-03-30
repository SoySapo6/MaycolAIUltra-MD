import { xpRange } from '../lib/levelling.js'
import fs from 'fs'
import fetch from 'node-fetch'
import { join } from 'path'
import pkg from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;

let handler = async (m, { conn, args, usedPrefix, command, isPrems }) => {
  
  // RPG-Ultra V3 - Sistema de Juego de Rol Avanzado
  
  //━━━━━━━━━[ CONSTANTES GLOBALES ]━━━━━━━━━//
  
  const COOLDOWN_MINING = 5 * 60 * 1000 // 5 minutos
  const COOLDOWN_FARMING = 3 * 60 * 1000 // 3 minutos
  const COOLDOWN_HUNTING = 4 * 60 * 1000 // 4 minutos
  const COOLDOWN_ADVENTURE = 10 * 60 * 1000 // 10 minutos
  const COOLDOWN_DUEL = 30 * 60 * 1000 // 30 minutos
  const COOLDOWN_ROBBERY = 60 * 60 * 1000 // 1 hora
  const COOLDOWN_MARRIAGE = 24 * 60 * 60 * 1000 // 24 horas
  
  //━━━━━━━━━[ VERIFICACIÓN DE BASES DE DATOS ]━━━━━━━━━//
  
  // Asegúrese de que la base de datos de usuario exista
  if (!global.db.data.users[m.sender]) {
    global.db.data.users[m.sender] = {
      // Datos básicos
      exp: 0, limit: 10, lastclaim: 0, registered: false, name: conn.getName(m.sender),
      // RPG - Recursos
      health: 100, stamina: 100, mana: 20, 
      gold: 50, diamond: 0, emerald: 0, ruby: 0, iron: 0, stone: 0, wood: 0, leather: 0, string: 0,
      herb: 0, food: 5, potion: 1, seeds: 0, crops: 0, 
      // RPG - Equipamiento
      weapon: 0, armor: 0, pickaxe: 0, axe: 0, fishingrod: 0,
      // RPG - Habilidades
      strength: 5, agility: 5, intelligence: 5, charisma: 5, vitality: 5,
      // RPG - Estadísticas
      level: 0, kills: 0, deaths: 0, wins: 0, losses: 0,
      // RPG - Social
      reputation: 0, guild: '', clan: '', family: '', marriage: '', children: [],
      // RPG - Propiedad
      house: 0, farm: 0, barn: 0, workshop: 0, shop: 0,
      // RPG - Temporizado
      lastadventure: 0, lastmining: 0, lastfarming: 0, lasthunting: 0, lastduel: 0, lastrobbery: 0, lastmarriage: 0,
      // RPG - Mascotas
      pet: 0, petExp: 0, petLevel: 0, petName: '',
    }
  }
  
  // Asegúrese de que la base de datos de grupos exista
  if (m.isGroup) {
    if (!global.db.data.groups) {
      global.db.data.groups = {}
    }
    if (!global.db.data.groups[m.chat]) {
      global.db.data.groups[m.chat] = {
        // Datos de grupo para RPG
        guild: '', territory: '', resources: {}, wars: 0, alliances: []
      }
    }
  }
  
  //━━━━━━━━━[ MENSAJES DE AYUDA ]━━━━━━━━━//
  
  const helpText = `
╔══════════════════════
║ 🌟 𝐑𝐏𝐆-𝐔𝐥𝐭𝐫𝐚 𝐕𝟑 🌟
╠══════════════════════
║ ⚔️ *COMANDOS DE ACCIÓN* ⚔️
║
║ ➤ ${usedPrefix}rpgprofile
║ ➤ ${usedPrefix}adventure
║ ➤ ${usedPrefix}mine
║ ➤ ${usedPrefix}hunt
║ ➤ ${usedPrefix}farm
║ ➤ ${usedPrefix}fish
║ ➤ ${usedPrefix}craft
║ ➤ ${usedPrefix}sell
║ ➤ ${usedPrefix}buy
║ ➤ ${usedPrefix}shop
║
╠══════════════════════
║ 🏆 *SISTEMA SOCIAL* 🏆
║
║ ➤ ${usedPrefix}duel @usuario
║ ➤ ${usedPrefix}rob @usuario
║ ➤ ${usedPrefix}marry @usuario
║ ➤ ${usedPrefix}divorce
║ ➤ ${usedPrefix}family
║ ➤ ${usedPrefix}adopt @usuario
║ ➤ ${usedPrefix}guild
║ ➤ ${usedPrefix}clan
║
╠══════════════════════
║ 🏠 *PROPIEDADES* 🏠
║
║ ➤ ${usedPrefix}buyhouse
║ ➤ ${usedPrefix}buyfarm
║ ➤ ${usedPrefix}workshop
║ ➤ ${usedPrefix}buildshop
║
╠══════════════════════
║ 🐶 *MASCOTAS* 🐱
║
║ ➤ ${usedPrefix}pet
║ ➤ ${usedPrefix}petadopt
║ ➤ ${usedPrefix}petfeed
║ ➤ ${usedPrefix}petstats
║ ➤ ${usedPrefix}petadventure
║
╠══════════════════════
║ 🌐 *MULTIJUGADOR* 🌐
║
║ ➤ ${usedPrefix}createclan
║ ➤ ${usedPrefix}joinclan
║ ➤ ${usedPrefix}leaveclan
║ ➤ ${usedPrefix}clanwar
║ ➤ ${usedPrefix}territory
║ ➤ ${usedPrefix}alliance
║
╠══════════════════════
║ 📜 *HISTORIA Y MISIONES* 📜
║
║ ➤ ${usedPrefix}quest
║ ➤ ${usedPrefix}daily
║ ➤ ${usedPrefix}weekly
║ ➤ ${usedPrefix}story
║ ➤ ${usedPrefix}dungeon
║
╚══════════════════════`
  
  //━━━━━━━━━[ PROCESAMIENTO DE COMANDOS ]━━━━━━━━━//
  
  let user = global.db.data.users[m.sender]
  let time = user.lastclaim + 86400000
  let _uptime = process.uptime() * 1000
  
  // Comando principal y su procesamiento
  if (!args[0]) {
    try {
      // Creación de la lista interactiva de comandos RPG
      const interactiveMessage = {
        header: { title: '🌟 𝐑𝐏𝐆-𝐔𝐥𝐭𝐫𝐚 𝐕𝟑 - 𝐒𝐢𝐬𝐭𝐞𝐦𝐚 𝐝𝐞 𝐉𝐮𝐞𝐠𝐨 🌟' },
        hasMediaAttachment: false,
        body: { text: `¡Bienvenido al sistema RPG avanzado! Selecciona la categoría de comandos que deseas explorar.

• Para usar un comando simplemente escribe: .rpg [comando]
• Ejemplo: .rpg adventure, .rpg mine, .rpg profile

💪 ¡Adelante aventurero, grandes desafíos te esperan!` },
        nativeFlowMessage: {
          buttons: [
            {
              name: 'single_select',
              buttonParamsJson: JSON.stringify({
                title: '𝐒𝐞𝐥𝐞𝐜𝐜𝐢𝐨𝐧𝐚 𝐮𝐧𝐚 𝐜𝐚𝐭𝐞𝐠𝐨𝐫í𝐚',
                sections: [
                  {
                    title: '⚔️ COMANDOS DE ACCIÓN', 
                    highlight_label: "Popular",
                    rows: [
                      {
                        title: "│📊│PERFIL RPG", 
                        description: "Ver tu perfil con estadísticas, recursos y propiedades",
                        id: `${usedPrefix}rpg profile`
                      },
                      {
                        title: "│🏕️│AVENTURA", 
                        description: "Embárcate en una aventura para conseguir EXP y recursos",
                        id: `${usedPrefix}rpg adventure`
                      },
                      {
                        title: "│⛏️│MINAR", 
                        description: "Mina en busca de piedras preciosas y minerales",
                        id: `${usedPrefix}rpg mine`
                      },
                      {
                        title: "│🏹│CAZAR", 
                        description: "Caza animales para obtener comida y cuero",
                        id: `${usedPrefix}rpg hunt`
                      },
                      {
                        title: "│🌾│CULTIVAR", 
                        description: "Trabaja en tu granja para obtener cultivos y hierbas",
                        id: `${usedPrefix}rpg farm`
                      },
                      {
                        title: "│🎣│PESCAR", 
                        description: "Pesca una variedad de peces para alimento",
                        id: `${usedPrefix}rpg fish`
                      },
                      {
                        title: "│⚒️│FABRICAR", 
                        description: "Convierte recursos básicos en objetos valiosos",
                        id: `${usedPrefix}rpg craft`
                      }
                    ]
                  },
                  {
                    title: '🏆 SISTEMA SOCIAL', 
                    highlight_label: "Multijugador",
                    rows: [
                      {
                        title: "│⚔️│DUELO", 
                        description: "Desafía a otro jugador a un duelo de habilidades",
                        id: `${usedPrefix}rpg duel`
                      },
                      {
                        title: "│💰│ROBAR", 
                        description: "Intenta robar recursos de otro jugador",
                        id: `${usedPrefix}rpg rob`
                      },
                      {
                        title: "│💍│MATRIMONIO", 
                        description: "Propón matrimonio a otro jugador",
                        id: `${usedPrefix}rpg marry`
                      },
                      {
                        title: "│👨‍👩‍👧‍👦│FAMILIA", 
                        description: "Gestiona tu familia o adopta a otros jugadores",
                        id: `${usedPrefix}rpg family`
                      },
                      {
                        title: "│🛡️│CLAN", 
                        description: "Administra o únete a un clan de guerreros",
                        id: `${usedPrefix}rpg clan`
                      }
                    ]
                  },
                  {
                    title: '🏠 PROPIEDADES Y MASCOTAS', 
                    highlight_label: "Gestión",
                    rows: [
                      {
                        title: "│🏡│COMPRAR CASA", 
                        description: "Adquiere o mejora tu vivienda",
                        id: `${usedPrefix}rpg buyhouse`
                      },
                      {
                        title: "│🌱│COMPRAR GRANJA", 
                        description: "Adquiere o mejora tu granja para producir más cultivos",
                        id: `${usedPrefix}rpg buyfarm`
                      },
                      {
                        title: "│🔨│TALLER", 
                        description: "Construye un taller para mejorar el crafteo",
                        id: `${usedPrefix}rpg workshop`
                      },
                      {
                        title: "│🐶│MASCOTAS", 
                        description: "Gestiona tus mascotas que te ayudan en aventuras",
                        id: `${usedPrefix}rpg pet`
                      },
                      {
                        title: "│🦊│ADOPTAR MASCOTA", 
                        description: "Adopta una nueva mascota para tu aventura",
                        id: `${usedPrefix}rpg petadopt`
                      }
                    ]
                  },
                  {
                    title: '📜 MISIONES Y ECONOMÍA', 
                    highlight_label: "Diario",
                    rows: [
                      {
                        title: "│📋│MISIONES", 
                        description: "Acepta misiones para ganar recompensas especiales",
                        id: `${usedPrefix}rpg quest`
                      },
                      {
                        title: "│🌞│DIARIO", 
                        description: "Reclama tu recompensa diaria de recursos",
                        id: `${usedPrefix}rpg daily`
                      },
                      {
                        title: "│📖│HISTORIA", 
                        description: "Descubre la historia del mundo RPG",
                        id: `${usedPrefix}rpg story`
                      },
                      {
                        title: "│🏪│TIENDA", 
                        description: "Compra equipamiento, semillas y otros recursos",
                        id: `${usedPrefix}rpg shop`
                      },
                      {
                        title: "│💱│VENDER", 
                        description: "Vende tus recursos para obtener oro",
                        id: `${usedPrefix}rpg sell`
                      }
                    ]
                  }
                ]
              })
            }
          ],
          messageParamsJson: ''
        }
      };

      const message = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: interactiveMessage
          }
        }
      }, {
        quoted: m
      });

      await conn.relayMessage(m.chat, message.message, { messageId: message.key.id });
      return;
    } catch (error) {
      console.error('Error al generar menu RPG:', error);
      return conn.reply(m.chat, helpText, m); // Fallback al texto de ayuda normal
    }
  }
  
  let type = (args[0] || '').toLowerCase()
  
  //━━━━━━━━━[ IMPLEMENTACIÓN DE COMANDOS ]━━━━━━━━━//
  
  switch(type) {
    // Perfil RPG del jugador
    case 'profile':
    case 'rpgprofile':
      let pp = await conn.profilePictureUrl(m.sender, 'image').catch(_ => './src/avatar_contact.png')
      let expText = `
╔═══════════════════
║ 📊 𝐏𝐄𝐑𝐅𝐈𝐋 𝐃𝐄 𝐉𝐔𝐆𝐀𝐃𝐎𝐑 📊
╠═══════════════════
║ 👤 *Nombre:* ${user.name}
║ 🏅 *Nivel:* ${user.level}
║ ✨ *Experiencia:* ${user.exp}
║ ❤️ *Salud:* ${user.health}/100
║ ⚡ *Energía:* ${user.stamina}/100
║ 🔮 *Maná:* ${user.mana}/20
╠═══════════════════
║ 💰 *Oro:* ${user.gold}
║ 💎 *Diamantes:* ${user.diamond}
║ 🟢 *Esmeraldas:* ${user.emerald}
║ ❤️ *Rubíes:* ${user.ruby}
╠═══════════════════
║ ⚔️ *Fuerza:* ${user.strength}
║ 🏃 *Agilidad:* ${user.agility}
║ 🧠 *Inteligencia:* ${user.intelligence}
║ 🗣️ *Carisma:* ${user.charisma}
║ 💪 *Vitalidad:* ${user.vitality}
╠═══════════════════
║ 🏠 *Casa:* ${user.house ? 'Nivel ' + user.house : 'No tiene'}
║ 🌾 *Granja:* ${user.farm ? 'Nivel ' + user.farm : 'No tiene'}
║ 🏛️ *Gremio:* ${user.guild || 'No pertenece'}
║ 👨‍👩‍👧‍👦 *Familia:* ${user.family || 'No tiene'}
║ 💍 *Matrimonio:* ${user.marriage || 'Soltero/a'}
╠═══════════════════
║ 🐾 *Mascota:* ${user.pet ? user.petName + ' (Nivel ' + user.petLevel + ')' : 'No tiene'}
╚═══════════════════`
      conn.sendFile(m.chat, pp, 'profile.jpg', expText, m)
      break
    
    // Sistema de aventuras
    case 'adventure':
    case 'aventura':
      if (new Date - user.lastadventure < COOLDOWN_ADVENTURE) {
        let timeLeft = COOLDOWN_ADVENTURE - (new Date - user.lastadventure)
        return conn.reply(m.chat, `⏱️ Debes esperar ${Math.ceil(timeLeft / 60000)} minutos antes de otra aventura.`, m)
      }
      
      let rewards = {
        exp: Math.floor(Math.random() * 500) + 100,
        gold: Math.floor(Math.random() * 200) + 50,
        items: []
      }
      
      // Calcular probabilidades de encuentros
      let encounter = Math.random()
      let encounterText = ''
      
      if (encounter < 0.1) {
        // Encuentro peligroso - Dragon
        encounterText = `🐉 *¡Te has encontrado con un Dragón Ancestral!*\n\n`
        let success = (user.strength + user.agility + user.intelligence) > 30 || Math.random() < 0.3
        
        if (success) {
          encounterText += `Con gran valentía y estrategia, has logrado derrotar al Dragón. Entre sus tesoros encuentras:`
          rewards.exp += 1000
          rewards.gold += 800
          rewards.items.push('💎 5 Diamantes')
          rewards.items.push('❤️ 3 Rubíes')
          user.diamond += 5
          user.ruby += 3
        } else {
          encounterText += `El Dragón era demasiado fuerte. Has logrado escapar, pero con graves heridas.`
          user.health -= 50
          if (user.health < 0) user.health = 1
          rewards.exp = Math.floor(rewards.exp / 3)
          rewards.gold = Math.floor(rewards.gold / 4)
        }
      } else if (encounter < 0.3) {
        // Encuentro neutral - Mercader
        encounterText = `🧙‍♂️ *Te encuentras con un mercader místico*\n\n`
        encounterText += `Te ofrece un intercambio justo por tus habilidades. A cambio de ayudarlo a cruzar el bosque peligroso, te recompensa con:`
        rewards.exp += 200
        rewards.items.push('🧪 2 Pociones')
        user.potion += 2
      } else if (encounter < 0.6) {
        // Encuentro beneficioso - Cofre del tesoro
        encounterText = `🏆 *¡Has encontrado un antiguo cofre del tesoro!*\n\n`
        encounterText += `Al abrirlo descubres un botín espléndido:`
        rewards.gold += 300
        rewards.items.push('🟢 2 Esmeraldas')
        rewards.items.push('🧩 Fragmento de mapa')
        user.emerald += 2
      } else {
        // Encuentro común - Monstruos
        encounterText = `👾 *Te has adentrado en un nido de monstruos*\n\n`
        encounterText += `Después de una ardua batalla, logras salir victorioso. Recolectas:`
        rewards.items.push('🧶 5 Cuerdas')
        rewards.items.push('🧱 3 Piedras')
        rewards.items.push('🥩 2 Carnes')
        user.string += 5
        user.stone += 3
        user.food += 2
      }
      
      // Actualizar datos de usuario
      user.exp += rewards.exp
      user.gold += rewards.gold
      user.lastadventure = new Date
      
      // Construir mensaje de recompensa
      let rewardText = `
${encounterText}

*🎁 Recompensas obtenidas:*
✨ ${rewards.exp} EXP
💰 ${rewards.gold} Oro
${rewards.items.map(item => `• ${item}`).join('\n')}

❤️ Salud actual: ${user.health}/100
🔋 Energía: ${user.stamina - 20}/100`
      
      user.stamina -= 20
      if (user.stamina < 0) user.stamina = 0
      
      conn.reply(m.chat, rewardText, m)
      break
    
    // Sistema de minería
    case 'mine':
    case 'minar':
      if (new Date - user.lastmining < COOLDOWN_MINING) {
        let timeLeft = COOLDOWN_MINING - (new Date - user.lastmining)
        return conn.reply(m.chat, `⛏️ Tus herramientas aún se están enfriando. Espera ${Math.ceil(timeLeft / 60000)} minutos antes de volver a minar.`, m)
      }
      
      if (user.pickaxe < 1) {
        return conn.reply(m.chat, `🛠️ Necesitas un pico para minar. Compra uno en la tienda con ${usedPrefix}shop`, m)
      }
      
      if (user.stamina < 20) {
        return conn.reply(m.chat, `😫 Estás demasiado cansado para minar. Necesitas recuperar energía.`, m)
      }
      
      let miningSuccess = Math.random()
      let miningText = `⛏️ *Te adentras en las profundidades de la mina...*\n\n`
      let miningRewards = []
      
      // Calcular resultados de minería basados en la calidad del pico
      if (miningSuccess < 0.1) {
        // Hallazgo excepcional
        miningText += `💎 *¡VETA EXCEPCIONAL!* Has encontrado un filón rico en minerales preciosos.`
        let diamonds = Math.floor(Math.random() * 3) + 1
        let emeralds = Math.floor(Math.random() * 4) + 2
        let rubies = Math.floor(Math.random() * 2) + 1
        
        user.diamond += diamonds
        user.emerald += emeralds
        user.ruby += rubies
        user.exp += 450
        
        miningRewards.push(`💎 ${diamonds} Diamantes`)
        miningRewards.push(`🟢 ${emeralds} Esmeraldas`)
        miningRewards.push(`❤️ ${rubies} Rubíes`)
        miningRewards.push(`✨ 450 EXP`)
      } else if (miningSuccess < 0.4) {
        // Hallazgo bueno
        miningText += `⚒️ *¡Buen hallazgo!* Has encontrado una veta rica en minerales.`
        let iron = Math.floor(Math.random() * 8) + 5
        let stone = Math.floor(Math.random() * 15) + 10
        let gold_nuggets = Math.floor(Math.random() * 6) + 3
        
        user.iron += iron
        user.stone += stone
        user.gold += gold_nuggets
        user.exp += 200
        
        miningRewards.push(`⚙️ ${iron} Hierro`)
        miningRewards.push(`🧱 ${stone} Piedra`)
        miningRewards.push(`💰 ${gold_nuggets} Pepitas de oro`)
        miningRewards.push(`✨ 200 EXP`)
      } else {
        // Hallazgo común
        miningText += `🪨 Has encontrado algunos minerales comunes.`
        let stone = Math.floor(Math.random() * 10) + 5
        let iron = Math.floor(Math.random() * 5) + 1
        
        user.stone += stone
        user.iron += iron
        user.exp += 100
        
        miningRewards.push(`🧱 ${stone} Piedra`)
        miningRewards.push(`⚙️ ${iron} Hierro`)
        miningRewards.push(`✨ 100 EXP`)
      }
      
      // Probabilidad de desgaste del pico
      if (Math.random() < 0.2) {
        miningText += `\n\n🛠️ ¡Tu pico se ha desgastado un poco durante la minería!`
      }
      
      // Consumir energía
      user.stamina -= 20
      if (user.stamina < 0) user.stamina = 0
      
      user.lastmining = new Date
      
      let finalMiningText = `
${miningText}

*🎁 Recursos obtenidos:*
${miningRewards.map(item => `• ${item}`).join('\n')}

🔋 Energía restante: ${user.stamina}/100`
      
      conn.reply(m.chat, finalMiningText, m)
      break
    
    // Sistema de caza
    case 'hunt':
    case 'cazar':
      if (new Date - user.lasthunting < COOLDOWN_HUNTING) {
        let timeLeft = COOLDOWN_HUNTING - (new Date - user.lasthunting)
        return conn.reply(m.chat, `🏹 Debes esperar ${Math.ceil(timeLeft / 60000)} minutos antes de volver a cazar.`, m)
      }
      
      if (user.stamina < 15) {
        return conn.reply(m.chat, `😫 Estás demasiado cansado para cazar. Necesitas recuperar energía.`, m)
      }
      
      let huntSuccess = Math.random()
      let huntText = `🏹 *Te adentras en el bosque para cazar...*\n\n`
      let huntRewards = []
      
      if (huntSuccess < 0.15) {
        // Caza excepcional
        huntText += `🦌 *¡CAZA EXCEPCIONAL!* Has encontrado una criatura legendaria.`
        let leather = Math.floor(Math.random() * 5) + 5
        let food = Math.floor(Math.random() * 8) + 8
        let exp = 400
        
        user.leather += leather
        user.food += food
        user.exp += exp
        
        huntRewards.push(`🥩 ${food} Alimentos`)
        huntRewards.push(`🧣 ${leather} Cuero`)
        huntRewards.push(`✨ ${exp} EXP`)
      } else if (huntSuccess < 0.5) {
        // Caza buena
        huntText += `🦊 *¡Buena caza!* Has cazado varios animales.`
        let leather = Math.floor(Math.random() * 3) + 2
        let food = Math.floor(Math.random() * 5) + 3
        let exp = 200
        
        user.leather += leather
        user.food += food
        user.exp += exp
        
        huntRewards.push(`🥩 ${food} Alimentos`)
        huntRewards.push(`🧣 ${leather} Cuero`)
        huntRewards.push(`✨ ${exp} EXP`)
      } else {
        // Caza común
        huntText += `🐇 Has cazado algunas presas menores.`
        let food = Math.floor(Math.random() * 3) + 1
        let exp = 100
        
        user.food += food
        user.exp += exp
        
        huntRewards.push(`🥩 ${food} Alimentos`)
        huntRewards.push(`✨ ${exp} EXP`)
      }
      
      // Consumir energía
      user.stamina -= 15
      if (user.stamina < 0) user.stamina = 0
      
      user.lasthunting = new Date
      
      let finalHuntText = `
${huntText}

*🎁 Recursos obtenidos:*
${huntRewards.map(item => `• ${item}`).join('\n')}

🔋 Energía restante: ${user.stamina}/100`
      
      conn.reply(m.chat, finalHuntText, m)
      break
    
    // Sistema de agricultura
    case 'farm':
    case 'farming':
    case 'cultivar':
      if (new Date - user.lastfarming < COOLDOWN_FARMING) {
        let timeLeft = COOLDOWN_FARMING - (new Date - user.lastfarming)
        return conn.reply(m.chat, `🌱 Debes esperar ${Math.ceil(timeLeft / 60000)} minutos antes de volver a cultivar.`, m)
      }
      
      if (user.farm < 1) {
        return conn.reply(m.chat, `🏡 Necesitas una granja para cultivar. Compra una con ${usedPrefix}buyhouse`, m)
      }
      
      if (user.stamina < 10) {
        return conn.reply(m.chat, `😫 Estás demasiado cansado para trabajar la tierra. Necesitas recuperar energía.`, m)
      }
      
      if (user.seeds < 1) {
        return conn.reply(m.chat, `🌱 No tienes semillas para plantar. Cómpralas en ${usedPrefix}shop`, m)
      }
      
      let farmSuccess = Math.random()
      let farmText = `🌱 *Trabajas en tu granja...*\n\n`
      let farmRewards = []
      
      // El nivel de la granja afecta las recompensas
      let farmBonus = user.farm * 0.2
      
      if (farmSuccess < 0.1 + farmBonus) {
        // Cosecha excepcional
        farmText += `🌽 *¡COSECHA EXCEPCIONAL!* Tus cultivos han prosperado extraordinariamente.`
        let crops = Math.floor(Math.random() * 15) + 10
        let herbs = Math.floor(Math.random() * 5) + 3
        let exp = 350
        
        user.crops += crops
        user.herb += herbs
        user.exp += exp
        
        farmRewards.push(`🌽 ${crops} Cultivos`)
        farmRewards.push(`🌿 ${herbs} Hierbas`)
        farmRewards.push(`✨ ${exp} EXP`)
      } else if (farmSuccess < 0.4 + farmBonus) {
        // Buena cosecha
        farmText += `🥕 *¡Buena cosecha!* Tus cultivos han crecido bien.`
        let crops = Math.floor(Math.random() * 8) + 5
        let herbs = Math.floor(Math.random() * 3) + 1
        let exp = 200
        
        user.crops += crops
        user.herb += herbs
        user.exp += exp
        
        farmRewards.push(`🥕 ${crops} Cultivos`)
        farmRewards.push(`🌿 ${herbs} Hierbas`)
        farmRewards.push(`✨ ${exp} EXP`)
      } else {
        // Cosecha regular
        farmText += `🥔 Has logrado una cosecha modesta.`
        let crops = Math.floor(Math.random() * 5) + 2
        let exp = 100
        
        user.crops += crops
        user.exp += exp
        
        farmRewards.push(`🥔 ${crops} Cultivos`)
        farmRewards.push(`✨ ${exp} EXP`)
      }
      
      // Consumir semillas y energía
      user.seeds -= 1
      user.stamina -= 10
      if (user.stamina < 0) user.stamina = 0
      
      user.lastfarming = new Date
      
      let finalFarmText = `
${farmText}

*🎁 Recursos obtenidos:*
${farmRewards.map(item => `• ${item}`).join('\n')}

🌱 Semillas restantes: ${user.seeds}
🔋 Energía restante: ${user.stamina}/100`
      
      conn.reply(m.chat, finalFarmText, m)
      break
      
    // Sistema de duelos
    case 'duel':
    case 'duelo':
      if (!args[1]) return conn.reply(m.chat, `👤 Debes especificar a quién quieres desafiar.\n\nEjemplo: ${usedPrefix}duel @usuario`, m)
      
      if (new Date - user.lastduel < COOLDOWN_DUEL) {
        let timeLeft = COOLDOWN_DUEL - (new Date - user.lastduel)
        return conn.reply(m.chat, `⚔️ Estás agotado de tu último combate. Podrás volver a desafiar en ${Math.ceil(timeLeft / 60000)} minutos.`, m)
      }
      
      let mentionedJid = m.mentionedJid[0]
      if (!mentionedJid) return conn.reply(m.chat, `👤 Por favor, menciona correctamente a la persona que quieres desafiar.`, m)
      
      // Verificar si el oponente existe en la base de datos
      if (!global.db.data.users[mentionedJid]) {
        global.db.data.users[mentionedJid] = {
          exp: 0, limit: 10, lastclaim: 0, registered: false, name: conn.getName(mentionedJid),
          // RPG - Estadísticas básicas
          health: 100, strength: 5, agility: 5, intelligence: 5
        }
      }
      
      let opponent = global.db.data.users[mentionedJid]
      
      // Diálogo de desafío
      conn.reply(m.chat, `⚔️ *¡DESAFÍO DE DUELO!* ⚔️\n\n@${m.sender.split('@')[0]} ha desafiado a @${mentionedJid.split('@')[0]} a un duelo.\n\n@${mentionedJid.split('@')[0]} tienes 60 segundos para aceptar el duelo escribiendo *"acepto"*.`, m, {
        mentions: [m.sender, mentionedJid]
      })
      
      // Esperar respuesta del oponente
      conn.duelChallenges = conn.duelChallenges || {}
      conn.duelChallenges[m.chat] = {
        challenger: m.sender,
        challenged: mentionedJid,
        timeout: setTimeout(() => {
          if (conn.duelChallenges[m.chat]) {
            conn.reply(m.chat, `⏳ El tiempo para aceptar el desafío ha terminado. El duelo ha sido cancelado.`, m)
            delete conn.duelChallenges[m.chat]
          }
        }, 60 * 1000)
      }
      break
      
    // Sistema de robo
    case 'rob':
    case 'robar':
      if (!args[1]) return conn.reply(m.chat, `👤 Debes especificar a quién quieres robar.\n\nEjemplo: ${usedPrefix}rob @usuario`, m)
      
      if (new Date - user.lastrobbery < COOLDOWN_ROBBERY) {
        let timeLeft = COOLDOWN_ROBBERY - (new Date - user.lastrobbery)
        return conn.reply(m.chat, `🕵️ Las autoridades te están vigilando. Podrás volver a robar en ${Math.floor(timeLeft / 3600000)} horas y ${Math.floor((timeLeft % 3600000) / 60000)} minutos.`, m)
      }
      
      let targetJid = m.mentionedJid[0]
      if (!targetJid) return conn.reply(m.chat, `👤 Por favor, menciona correctamente a la persona a quien quieres robar.`, m)
      
      // Verificar si el objetivo existe en la base de datos
      if (!global.db.data.users[targetJid]) {
        global.db.data.users[targetJid] = {
          exp: 0, limit: 10, lastclaim: 0, registered: false, name: conn.getName(targetJid),
          gold: 50, // Mínimo para robar
        }
      }
      
      let target = global.db.data.users[targetJid]
      
      // Verificar si el objetivo tiene suficiente oro
      if (target.gold < 50) {
        return conn.reply(m.chat, `😔 @${targetJid.split('@')[0]} es demasiado pobre para robarle.`, m, {
          mentions: [targetJid]
        })
      }
      
      // Cálculo de probabilidad de éxito basado en atributos
      let successChance = 0.3 + (user.agility * 0.03) - (Math.random() * 0.2)
      let guardedChance = (target.intelligence * 0.02) + (target.agility * 0.01)
      
      if (Math.random() < guardedChance) {
        // El objetivo tiene protección (guardia, trampas, etc.)
        user.lastrobbery = new Date
        user.health -= 15
        if (user.health < 0) user.health = 1
        
        return conn.reply(m.chat, `🚨 *¡ROBO FALLIDO!* 🚨\n\n@${targetJid.split('@')[0]} tenía protección. Has sido herido durante el intento de robo y perdiste 15 de salud.`, m, {
          mentions: [targetJid]
        })
      }
      
      if (Math.random() < successChance) {
        // Robo exitoso
        let stolenAmount = Math.floor(target.gold * (Math.random() * 0.3 + 0.1)) // Entre 10% y 40% del oro
        if (stolenAmount < 10) stolenAmount = 10
        
        user.gold += stolenAmount
        target.gold -= stolenAmount
        user.lastrobbery = new Date
        
        // Mala reputación por robar
        user.reputation -= 5
        
        conn.reply(m.chat, `💰 *¡ROBO EXITOSO!* 💰\n\nHas robado ${stolenAmount} de oro a @${targetJid.split('@')[0]}.\n\n⚠️ Tu reputación ha disminuido por esta acción.`, m, {
          mentions: [targetJid]
        })
      } else {
        // Robo fallido
        user.lastrobbery = new Date
        user.gold -= Math.floor(user.gold * 0.05) // Pierde 5% de su oro como "multa"
        user.health -= 10
        if (user.health < 0) user.health = 1
        
        conn.reply(m.chat, `🚔 *¡ROBO FALLIDO!* 🚔\n\nHas sido sorprendido intentando robar a @${targetJid.split('@')[0]}. Pierdes algo de oro y salud por el forcejeo.`, m, {
          mentions: [targetJid]
        })
      }
      break
      
    // Sistema de matrimonio  
    case 'marry':
    case 'casar':
      if (!args[1]) return conn.reply(m.chat, `💍 Debes especificar a quién quieres proponer matrimonio.\n\nEjemplo: ${usedPrefix}marry @usuario`, m)
      
      if (user.marriage) {
        return conn.reply(m.chat, `💔 Ya estás casado/a con alguien. Primero debes divorciarte con ${usedPrefix}divorce.`, m)
      }
      
      let proposedJid = m.mentionedJid[0]
      if (!proposedJid) return conn.reply(m.chat, `👤 Por favor, menciona correctamente a la persona a quien quieres proponer matrimonio.`, m)
      
      // Verificar si el objetivo existe en la base de datos
      if (!global.db.data.users[proposedJid]) {
        global.db.data.users[proposedJid] = {
          exp: 0, limit: 10, lastclaim: 0, registered: false, name: conn.getName(proposedJid),
          marriage: '', // Estado civil inicial
        }
      }
      
      let proposed = global.db.data.users[proposedJid]
      
      if (proposed.marriage) {
        return conn.reply(m.chat, `💔 @${proposedJid.split('@')[0]} ya está casado/a con alguien más.`, m, {
          mentions: [proposedJid]
        })
      }
      
      // Enviar propuesta
      conn.reply(m.chat, `💍 *¡PROPUESTA DE MATRIMONIO!* 💍\n\n@${m.sender.split('@')[0]} ha propuesto matrimonio a @${proposedJid.split('@')[0]}.\n\n@${proposedJid.split('@')[0]} tienes 60 segundos para aceptar escribiendo *"acepto"*.`, m, {
        mentions: [m.sender, proposedJid]
      })
      
      // Esperar respuesta
      conn.marriageProposals = conn.marriageProposals || {}
      conn.marriageProposals[m.chat] = {
        proposer: m.sender,
        proposed: proposedJid,
        timeout: setTimeout(() => {
          if (conn.marriageProposals[m.chat]) {
            conn.reply(m.chat, `⏳ El tiempo para aceptar la propuesta ha terminado. La propuesta de matrimonio ha sido cancelada.`, m)
            delete conn.marriageProposals[m.chat]
          }
        }, 60 * 1000)
      }
      break
      
    // Sistema de divorcio  
    case 'divorce':
    case 'divorciar':
      if (!user.marriage) {
        return conn.reply(m.chat, `😐 No estás casado/a con nadie.`, m)
      }
      
      // Aplicar divorcio
      let exPartnerJid = user.marriage
      if (global.db.data.users[exPartnerJid]) {
        global.db.data.users[exPartnerJid].marriage = ''
      }
      
      user.marriage = ''
      
      conn.reply(m.chat, `💔 *¡DIVORCIO COMPLETADO!* 💔\n\nHas terminado tu matrimonio. Ahora eres oficialmente soltero/a de nuevo.`, m)
      break
      
    // Sistema de compra de casa  
    case 'buyhouse':
    case 'comprarcasa':
      let housePrice = user.house ? (user.house * 5000) + 10000 : 5000
      
      if (user.gold < housePrice) {
        return conn.reply(m.chat, `💰 No tienes suficiente oro. Necesitas ${housePrice} de oro para ${user.house ? 'mejorar tu casa al nivel ' + (user.house + 1) : 'comprar una casa'}.`, m)
      }
      
      user.gold -= housePrice
      
      if (!user.house) {
        user.house = 1
        conn.reply(m.chat, `🏠 *¡CASA COMPRADA!* 🏠\n\nHas adquirido tu primera casa por ${housePrice} de oro. Ahora tienes un lugar para vivir y descansar.`, m)
      } else {
        user.house += 1
        conn.reply(m.chat, `🏡 *¡CASA MEJORADA!* 🏡\n\nHas mejorado tu casa al nivel ${user.house} por ${housePrice} de oro. Tu hogar ahora es más grande y confortable.`, m)
      }
      break
      
    // Sistema de compra de granja  
    case 'buyfarm':
    case 'comprargranja':
      let farmPrice = user.farm ? (user.farm * 8000) + 15000 : 10000
      
      if (user.gold < farmPrice) {
        return conn.reply(m.chat, `💰 No tienes suficiente oro. Necesitas ${farmPrice} de oro para ${user.farm ? 'mejorar tu granja al nivel ' + (user.farm + 1) : 'comprar una granja'}.`, m)
      }
      
      if (!user.house) {
        return conn.reply(m.chat, `🏠 Primero necesitas tener una casa antes de adquirir una granja. Compra una casa con ${usedPrefix}buyhouse.`, m)
      }
      
      user.gold -= farmPrice
      
      if (!user.farm) {
        user.farm = 1
        conn.reply(m.chat, `🌾 *¡GRANJA COMPRADA!* 🌾\n\nHas adquirido tu primera granja por ${farmPrice} de oro. Ahora puedes cultivar y cosechar recursos.`, m)
      } else {
        user.farm += 1
        conn.reply(m.chat, `🚜 *¡GRANJA MEJORADA!* 🚜\n\nHas mejorado tu granja al nivel ${user.farm} por ${farmPrice} de oro. Podrás producir más cultivos y obtener mejores cosechas.`, m)
      }
      break
      
    // Sistema de mascotas  
    case 'pet':
    case 'mascota':
      if (!user.pet) {
        return conn.reply(m.chat, `🐾 No tienes ninguna mascota. Adopta una con ${usedPrefix}petadopt [tipo].`, m)
      }
      
      let petTypes = ['🐶 Perro', '🐱 Gato', '🦊 Zorro', '🐰 Conejo', '🦜 Loro', '🐉 Dragoncito']
      let petStats = `
╔═══════════════════
║ 🐾 𝐒𝐔 𝐌𝐀𝐒𝐂𝐎𝐓𝐀 🐾
╠═══════════════════
║ 📛 *Nombre:* ${user.petName || petTypes[user.pet - 1]}
║ 🏆 *Nivel:* ${user.petLevel}
║ ✨ *Experiencia:* ${user.petExp}
║ ❤️ *Cariño:* ${Math.min(100, user.petExp / 10)}%
╠═══════════════════
║ 💡 *Comandos de mascota:*
║ • ${usedPrefix}petfeed - Alimentar
║ • ${usedPrefix}petstats - Estadísticas
║ • ${usedPrefix}petadventure - Aventura
╚═══════════════════`
      
      conn.reply(m.chat, petStats, m)
      break
      
    // Adoptar mascota  
    case 'petadopt':
    case 'adoptarmascota':
      if (user.pet) {
        return conn.reply(m.chat, `🐾 Ya tienes una mascota. Solo puedes tener una a la vez.`, m)
      }
      
      if (!args[1]) {
        let petTypes = ['1. 🐶 Perro - Leal y enérgico',
                       '2. 🐱 Gato - Independiente y astuto',
                       '3. 🦊 Zorro - Inteligente y curioso',
                       '4. 🐰 Conejo - Ágil y adorable',
                       '5. 🦜 Loro - Parlanchín y colorido',
                       '6. 🐉 Dragoncito - Exótico y poderoso']
        
        return conn.reply(m.chat, `🐾 *ADOPCIÓN DE MASCOTAS* 🐾\n\nElige qué tipo de mascota quieres adoptar:\n\n${petTypes.join('\n')}\n\nUsa ${usedPrefix}petadopt [número] para adoptar.`, m)
      }
      
      let petChoice = parseInt(args[1])
      if (isNaN(petChoice) || petChoice < 1 || petChoice > 6) {
        return conn.reply(m.chat, `🐾 Opción inválida. Elige un número entre 1 y 6.`, m)
      }
      
      let petCost = [2000, 2000, 3000, 1500, 4000, 10000][petChoice - 1]
      
      if (user.gold < petCost) {
        return conn.reply(m.chat, `💰 No tienes suficiente oro. Necesitas ${petCost} de oro para adoptar esta mascota.`, m)
      }
      
      user.gold -= petCost
      user.pet = petChoice
      user.petExp = 0
      user.petLevel = 1
      user.petName = ['Perrito', 'Gatito', 'Zorrito', 'Conejito', 'Lorito', 'Dragoncito'][petChoice - 1]
      
      conn.reply(m.chat, `🐾 *¡MASCOTA ADOPTADA!* 🐾\n\nHas adoptado un ${['🐶 Perro', '🐱 Gato', '🦊 Zorro', '🐰 Conejo', '🦜 Loro', '🐉 Dragoncito'][petChoice - 1]} por ${petCost} de oro.\n\nPuedes ponerle un nombre usando ${usedPrefix}petname [nombre].`, m)
      break
      
    // Sistema de alimentar mascota  
    case 'petfeed':
    case 'alimentarmascota':
      if (!user.pet) {
        return conn.reply(m.chat, `🐾 No tienes ninguna mascota. Adopta una con ${usedPrefix}petadopt [tipo].`, m)
      }
      
      if (user.food < 2) {
        return conn.reply(m.chat, `🍖 No tienes suficiente comida para alimentar a tu mascota. Necesitas al menos 2 unidades de comida.`, m)
      }
      
      user.food -= 2
      user.petExp += 15
      
      // Subir de nivel
      if (user.petExp >= user.petLevel * 100) {
        user.petLevel += 1
        conn.reply(m.chat, `🐾 *¡TU MASCOTA HA SUBIDO DE NIVEL!* 🐾\n\n${user.petName} ha alcanzado el nivel ${user.petLevel}. Se ve más fuerte y feliz.`, m)
      } else {
        conn.reply(m.chat, `🍖 Has alimentado a ${user.petName}. Se ve más feliz y ha ganado 15 puntos de experiencia.`, m)
      }
      break
      
    // Sistema de aventura de mascota  
    case 'petadventure':
    case 'aventuramascota':
      if (!user.pet) {
        return conn.reply(m.chat, `🐾 No tienes ninguna mascota. Adopta una con ${usedPrefix}petadopt [tipo].`, m)
      }
      
      // Verificar si la mascota tiene suficiente nivel
      if (user.petLevel < 3) {
        return conn.reply(m.chat, `🐾 Tu mascota es demasiado pequeña para aventurarse. Necesita alcanzar al menos el nivel 3.`, m)
      }
      
      let petAdventureSuccess = Math.random()
      let petAdventureText = `🌳 *${user.petName} se aventura en el bosque...*\n\n`
      let petRewards = []
      
      if (petAdventureSuccess < 0.2) {
        // Aventura excepcional
        petAdventureText += `🌟 *¡HALLAZGO INCREÍBLE!* ${user.petName} ha encontrado un tesoro escondido.`
        let gold = Math.floor(Math.random() * 300) + 200
        let exp = 50
        let petExp = 50
        
        user.gold += gold
        user.exp += exp
        user.petExp += petExp
        
        petRewards.push(`💰 ${gold} Oro`)
        petRewards.push(`✨ ${exp} EXP para ti`)
        petRewards.push(`🐾 ${petExp} EXP para ${user.petName}`)
        
        // Objeto raro
        if (Math.random() < 0.3) {
          petRewards.push(`💎 1 Diamante`)
          user.diamond += 1
        }
      } else if (petAdventureSuccess < 0.6) {
        // Aventura buena
        petAdventureText += `🍖 ${user.petName} ha cazado algunas presas en el bosque.`
        let food = Math.floor(Math.random() * 4) + 2
        let exp = 30
        let petExp = 30
        
        user.food += food
        user.exp += exp
        user.petExp += petExp
        
        petRewards.push(`🍖 ${food} Alimentos`)
        petRewards.push(`✨ ${exp} EXP para ti`)
        petRewards.push(`🐾 ${petExp} EXP para ${user.petName}`)
      } else {
        // Aventura regular
        petAdventureText += `🌿 ${user.petName} ha explorado y jugado, pero no ha encontrado nada especial.`
        let exp = 15
        let petExp = 20
        
        user.exp += exp
        user.petExp += petExp
        
        petRewards.push(`✨ ${exp} EXP para ti`)
        petRewards.push(`🐾 ${petExp} EXP para ${user.petName}`)
      }
      
      // Subir de nivel a la mascota si corresponde
      if (user.petExp >= user.petLevel * 100) {
        user.petLevel += 1
        petAdventureText += `\n\n🎉 *¡${user.petName} ha subido al nivel ${user.petLevel}!*`
      }
      
      let finalPetAdventureText = `
${petAdventureText}

*🎁 Recompensas obtenidas:*
${petRewards.map(item => `• ${item}`).join('\n')}

🐾 Nivel de ${user.petName}: ${user.petLevel}
✨ EXP de mascota: ${user.petExp}/${user.petLevel * 100}`
      
      conn.reply(m.chat, finalPetAdventureText, m)
      break
    
    // Sistema de crear clan  
    case 'createclan':
    case 'crearclan':
      if (!args[1]) return conn.reply(m.chat, `🛡️ Debes especificar un nombre para tu clan.\n\nEjemplo: ${usedPrefix}createclan Lobos Salvajes`, m)
      
      if (user.clan) {
        return conn.reply(m.chat, `🛡️ Ya perteneces al clan "${user.clan}". Primero debes abandonarlo con ${usedPrefix}leaveclan.`, m)
      }
      
      if (user.gold < 5000) {
        return conn.reply(m.chat, `💰 No tienes suficiente oro. Necesitas 5000 de oro para crear un clan.`, m)
      }
      
      let clanName = args.slice(1).join(' ')
      if (clanName.length > 20) {
        return conn.reply(m.chat, `🛡️ El nombre del clan es demasiado largo. Máximo 20 caracteres.`, m)
      }
      
      // Verificar si el clan ya existe
      let clanExists = false
      Object.values(global.db.data.users).forEach(u => {
        if (u.clan && u.clan.toLowerCase() === clanName.toLowerCase()) {
          clanExists = true
        }
      })
      
      if (clanExists) {
        return conn.reply(m.chat, `🛡️ Ya existe un clan con ese nombre. Elige otro nombre.`, m)
      }
      
      user.gold -= 5000
      user.clan = clanName
      user.clanRank = 'líder'
      
      // Crear registro del clan
      global.db.data.clans = global.db.data.clans || {}
      global.db.data.clans[clanName] = {
        name: clanName,
        leader: m.sender,
        members: [m.sender],
        level: 1,
        exp: 0,
        territory: '',
        treasury: 1000, // Oro inicial del clan
        founded: new Date().toDateString()
      }
      
      conn.reply(m.chat, `🛡️ *¡CLAN CREADO!* 🛡️\n\nHas fundado el clan "${clanName}" por 5000 de oro.\n\nAhora puedes invitar a otros jugadores a unirse con ${usedPrefix}claninvite @usuario.`, m)
      break
    
    // Sistema de territorio
    case 'territory':
    case 'territorio':
      if (!user.clan) {
        return conn.reply(m.chat, `🏞️ Necesitas pertenecer a un clan para interactuar con territorios. Únete a uno con ${usedPrefix}joinclan [nombre] o crea el tuyo con ${usedPrefix}createclan [nombre].`, m)
      }
      
      if (!global.db.data.clans) {
        global.db.data.clans = {}
      }
      
      let clan = global.db.data.clans[user.clan]
      if (!clan) {
        return conn.reply(m.chat, `⚠️ Ha ocurrido un error con los datos de tu clan. Por favor, contacta al administrador.`, m)
      }
      
      if (!args[1]) {
        // Mostrar información de territorio
        let territoryInfo = `
╔══════════════════════
║ 🏞️ 𝐓𝐄𝐑𝐑𝐈𝐓𝐎𝐑𝐈𝐎 𝐃𝐄𝐋 𝐂𝐋𝐀𝐍 🏞️
╠══════════════════════
║ 🛡️ *Clan:* ${clan.name}
║ 👑 *Líder:* ${conn.getName(clan.leader)}
║ 👥 *Miembros:* ${clan.members.length}
╠══════════════════════
║ 🗺️ *Territorio actual:* ${clan.territory || 'Ninguno'}
${clan.territory ? `║ 💰 *Ingresos diarios:* ${Math.floor(clan.level * 200)} de oro` : ''}
╠══════════════════════
║ 💡 *Comandos disponibles:*
║ • ${usedPrefix}territory claim [nombre]
║ • ${usedPrefix}territory upgrade
║ • ${usedPrefix}territory info
╚══════════════════════`
        
        return conn.reply(m.chat, territoryInfo, m)
      }
      
      let territoryAction = args[1].toLowerCase()
      
      switch(territoryAction) {
        case 'claim':
        case 'reclamar':
          if (clan.territory) {
            return conn.reply(m.chat, `🏞️ Tu clan ya controla el territorio "${clan.territory}". Puedes mejorarlo con ${usedPrefix}territory upgrade.`, m)
          }
          
          if (user.clanRank !== 'líder') {
            return conn.reply(m.chat, `👑 Solo el líder del clan puede reclamar territorios.`, m)
          }
          
          if (clan.treasury < 2000) {
            return conn.reply(m.chat, `💰 El tesoro del clan no tiene suficiente oro. Necesitan 2000 de oro para reclamar un territorio.`, m)
          }
          
          let territoryName = args.slice(2).join(' ')
          if (!territoryName) {
            return conn.reply(m.chat, `🏞️ Debes especificar un nombre para tu territorio.\n\nEjemplo: ${usedPrefix}territory claim Valle Esmeralda`, m)
          }
          
          if (territoryName.length > 25) {
            return conn.reply(m.chat, `🏞️ El nombre del territorio es demasiado largo. Máximo 25 caracteres.`, m)
          }
          
          // Verificar si algún clan ya controla este territorio
          let territoryTaken = false
          Object.values(global.db.data.clans || {}).forEach(c => {
            if (c.territory && c.territory.toLowerCase() === territoryName.toLowerCase()) {
              territoryTaken = true
            }
          })
          
          if (territoryTaken) {
            return conn.reply(m.chat, `⚔️ Ese territorio ya está bajo el control de otro clan. Deberás desafiarlo para conquistarlo con ${usedPrefix}clanwar [nombre del clan].`, m)
          }
          
          clan.treasury -= 2000
          clan.territory = territoryName
          
          conn.reply(m.chat, `🏞️ *¡TERRITORIO RECLAMADO!* 🏞️\n\nTu clan ha establecido control sobre "${territoryName}".\n\nAhora recibirán ingresos diarios de ${Math.floor(clan.level * 200)} de oro en el tesoro del clan.`, m)
          break
          
        case 'upgrade':
        case 'mejorar':
          if (!clan.territory) {
            return conn.reply(m.chat, `🏞️ Tu clan no controla ningún territorio. Primero deben reclamar uno con ${usedPrefix}territory claim [nombre].`, m)
          }
          
          if (user.clanRank !== 'líder' && user.clanRank !== 'oficial') {
            return conn.reply(m.chat, `👑 Solo el líder y oficiales del clan pueden mejorar el territorio.`, m)
          }
          
          let upgradeCost = clan.level * 1500
          
          if (clan.treasury < upgradeCost) {
            return conn.reply(m.chat, `💰 El tesoro del clan no tiene suficiente oro. Necesitan ${upgradeCost} de oro para mejorar el territorio.`, m)
          }
          
          clan.treasury -= upgradeCost
          clan.level += 1
          
          conn.reply(m.chat, `🏞️ *¡TERRITORIO MEJORADO!* 🏞️\n\nHan invertido en la mejora de "${clan.territory}".\n\nNivel del clan: ${clan.level}\nIngresos diarios actualizados: ${Math.floor(clan.level * 200)} de oro`, m)
          break
          
        case 'info':
        case 'información':
          if (!clan.territory) {
            return conn.reply(m.chat, `🏞️ Tu clan no controla ningún territorio. Primero deben reclamar uno con ${usedPrefix}territory claim [nombre].`, m)
          }
          
          let territoryInfoDetailed = `
╔══════════════════════
║ 🏞️ 𝐓𝐄𝐑𝐑𝐈𝐓𝐎𝐑𝐈𝐎 "${clan.territory}" 🏞️
╠══════════════════════
║ 🛡️ *Controlado por:* ${clan.name}
║ 👑 *Administrado por:* ${conn.getName(clan.leader)}
║ 🏆 *Nivel del clan:* ${clan.level}
║ 💰 *Tesoro del clan:* ${clan.treasury} de oro
╠══════════════════════
║ 📊 *BENEFICIOS DIARIOS*
║ 💰 *Ingresos:* ${Math.floor(clan.level * 200)} de oro
║ 🧪 *Bonificaciones de recursos:* +${clan.level * 5}%
╠══════════════════════
║ 🔄 *Próxima mejora:* ${clan.level * 1500} de oro
╚══════════════════════`
          
          conn.reply(m.chat, territoryInfoDetailed, m)
          break
          
        default:
          conn.reply(m.chat, `🏞️ Acción de territorio no reconocida. Opciones disponibles:\n• claim [nombre] - Reclamar territorio\n• upgrade - Mejorar territorio\n• info - Ver información detallada`, m)
      }
      break
    
    // Sistema de misiones
    case 'quest':
    case 'misión':
    case 'mision':
      if (!user.activeQuest) {
        // No hay misión activa, generar una nueva
        let questTypes = [
          { type: 'hunt', name: 'Caza de Bestias', target: Math.floor(Math.random() * 5) + 3, reward: { gold: 500, exp: 300 } },
          { type: 'mine', name: 'Excavación Profunda', target: Math.floor(Math.random() * 5) + 5, reward: { gold: 400, exp: 350 } },
          { type: 'farm', name: 'Cosecha Abundante', target: Math.floor(Math.random() * 6) + 4, reward: { gold: 350, exp: 250 } },
          { type: 'craft', name: 'Artesanía Fina', target: Math.floor(Math.random() * 3) + 2, reward: { gold: 600, exp: 400 } },
          { type: 'adventure', name: 'Exploración Peligrosa', target: Math.floor(Math.random() * 3) + 1, reward: { gold: 700, exp: 500 } }
        ]
        
        let randomQuest = questTypes[Math.floor(Math.random() * questTypes.length)]
        user.activeQuest = randomQuest
        user.questProgress = 0
        
        let questText = `
╔══════════════════════
║ 📜 𝐍𝐔𝐄𝐕𝐀 𝐌𝐈𝐒𝐈Ó𝐍 📜
╠══════════════════════
║ 🔍 *Misión:* ${randomQuest.name}
║ 📋 *Objetivo:* ${randomQuest.type === 'hunt' ? 'Cazar' : 
                   randomQuest.type === 'mine' ? 'Minar' : 
                   randomQuest.type === 'farm' ? 'Cultivar' : 
                   randomQuest.type === 'craft' ? 'Fabricar' : 'Completar'} 
            ${randomQuest.target} ${randomQuest.type === 'hunt' ? 'presas' : 
                                  randomQuest.type === 'mine' ? 'minerales' : 
                                  randomQuest.type === 'farm' ? 'cosechas' : 
                                  randomQuest.type === 'craft' ? 'objetos' : 'aventuras'}
╠══════════════════════
║ 🎁 *RECOMPENSAS:*
║ 💰 ${randomQuest.reward.gold} Oro
║ ✨ ${randomQuest.reward.exp} EXP
╠══════════════════════
║ 📊 *Progreso:* 0/${randomQuest.target}
╚══════════════════════`
        
        conn.reply(m.chat, questText, m)
      } else {
        // Ya tiene una misión activa, mostrar progreso
        let questText = `
╔══════════════════════
║ 📜 𝐌𝐈𝐒𝐈Ó𝐍 𝐀𝐂𝐓𝐈𝐕𝐀 📜
╠══════════════════════
║ 🔍 *Misión:* ${user.activeQuest.name}
║ 📋 *Objetivo:* ${user.activeQuest.type === 'hunt' ? 'Cazar' : 
                   user.activeQuest.type === 'mine' ? 'Minar' : 
                   user.activeQuest.type === 'farm' ? 'Cultivar' : 
                   user.activeQuest.type === 'craft' ? 'Fabricar' : 'Completar'} 
            ${user.activeQuest.target} ${user.activeQuest.type === 'hunt' ? 'presas' : 
                                       user.activeQuest.type === 'mine' ? 'minerales' : 
                                       user.activeQuest.type === 'farm' ? 'cosechas' : 
                                       user.activeQuest.type === 'craft' ? 'objetos' : 'aventuras'}
╠══════════════════════
║ 🎁 *RECOMPENSAS:*
║ 💰 ${user.activeQuest.reward.gold} Oro
║ ✨ ${user.activeQuest.reward.exp} EXP
╠══════════════════════
║ 📊 *Progreso:* ${user.questProgress}/${user.activeQuest.target}
${user.questProgress >= user.activeQuest.target ? '║ ✅ *¡COMPLETADA! Reclama tu recompensa*' : ''}
╚══════════════════════`
        
        if (user.questProgress >= user.activeQuest.target && args[1] === 'claim') {
          // Reclamar recompensa
          user.gold += user.activeQuest.reward.gold
          user.exp += user.activeQuest.reward.exp
          
          let rewardText = `
╔══════════════════════
║ 🎉 𝐌𝐈𝐒𝐈Ó𝐍 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐀𝐃𝐀 🎉
╠══════════════════════
║ 🔍 *Misión:* ${user.activeQuest.name}
╠══════════════════════
║ 🎁 *RECOMPENSAS RECIBIDAS:*
║ 💰 ${user.activeQuest.reward.gold} Oro
║ ✨ ${user.activeQuest.reward.exp} EXP
╚══════════════════════`
          
          user.activeQuest = null
          user.questProgress = 0
          
          conn.reply(m.chat, rewardText, m)
        } else if (user.questProgress >= user.activeQuest.target) {
          conn.reply(m.chat, `${questText}\n\nUsa ${usedPrefix}quest claim para reclamar tu recompensa.`, m)
        } else {
          conn.reply(m.chat, questText, m)
        }
      }
      break
      
    // Misiones diarias
    case 'daily':
    case 'diaria':
      if (new Date - user.lastclaim < 86400000) {
        let remaining = 86400000 - (new Date - user.lastclaim)
        let hours = Math.floor(remaining / 3600000)
        let minutes = Math.floor((remaining % 3600000) / 60000)
        
        return conn.reply(m.chat, `⏱️ Ya has reclamado tu recompensa diaria. Vuelve en ${hours} horas y ${minutes} minutos.`, m)
      }
      
      // Recompensas diarias
      let dailyRewards = {
        gold: 500 + (user.level * 50),
        exp: 300 + (user.level * 30),
        potion: 2,
        food: 3,
        seeds: Math.floor(Math.random() * 5) + 1
      }
      
      // Actualizar datos de usuario
      user.gold += dailyRewards.gold
      user.exp += dailyRewards.exp
      user.potion += dailyRewards.potion
      user.food += dailyRewards.food
      user.seeds += dailyRewards.seeds
      user.lastclaim = new Date
      
      let dailyText = `
╔══════════════════════
║ 🎁 𝐑𝐄𝐂𝐎𝐌𝐏𝐄𝐍𝐒𝐀 𝐃𝐈𝐀𝐑𝐈𝐀 🎁
╠══════════════════════
║ 📆 *Fecha:* ${new Date().toLocaleDateString()}
╠══════════════════════
║ 💰 ${dailyRewards.gold} Oro
║ ✨ ${dailyRewards.exp} EXP
║ 🧪 ${dailyRewards.potion} Pociones
║ 🍖 ${dailyRewards.food} Alimentos
║ 🌱 ${dailyRewards.seeds} Semillas
╠══════════════════════
║ 📊 *Estadísticas actuales:*
║ 💰 ${user.gold} Oro total
║ 🏅 Nivel: ${user.level}
╚══════════════════════`
      
      conn.reply(m.chat, dailyText, m)
      break
      
    // Sistema de comercio  
    case 'shop':
    case 'tienda':
      let shopText = `
╔══════════════════════
║ 🛒 𝐓𝐈𝐄𝐍𝐃𝐀 𝐑𝐏𝐆 🛒
╠══════════════════════
║ 📋 *ARTÍCULOS DISPONIBLES:*
║
║ 🧪 *Poción* - 150 Oro
║ Recupera 25 de salud y 15 de energía
║ 
║ 🍖 *Alimento* - 100 Oro
║ Necesario para alimentar mascotas
║ 
║ 🌱 *Semillas* - 50 Oro
║ Para cultivar en tu granja
║ 
║ ⛏️ *Pico* - 800 Oro
║ Herramienta necesaria para minar
║ 
║ 🪓 *Hacha* - 750 Oro
║ Permite talar árboles eficientemente
║ 
║ 🎣 *Caña de pescar* - 650 Oro
║ Para pescar en ríos y lagos
║ 
║ 🗡️ *Espada* - 1500 Oro
║ Mejora tus habilidades de combate
║ 
║ 🛡️ *Armadura* - 2000 Oro
║ Protección contra daños
╠══════════════════════
║ 💡 *COMANDOS:*
║ • ${usedPrefix}buy [artículo] [cantidad]
║ • ${usedPrefix}sell [recurso] [cantidad]
╚══════════════════════`
      
      conn.reply(m.chat, shopText, m)
      break
      
    // Sistema de compra  
    case 'buy':
    case 'comprar':
      if (!args[1]) return conn.reply(m.chat, `🛒 Debes especificar qué quieres comprar.\n\nEjemplo: ${usedPrefix}buy pocion 2`, m)
      
      let item = args[1].toLowerCase()
      let quantity = parseInt(args[2]) || 1
      
      if (quantity < 1) return conn.reply(m.chat, `📊 La cantidad debe ser al menos 1.`, m)
      
      let prices = {
        'pocion': 150,
        'poción': 150,
        'alimento': 100,
        'comida': 100,
        'semillas': 50,
        'semilla': 50,
        'pico': 800,
        'hacha': 750,
        'caña': 650,
        'cañadepescar': 650,
        'espada': 1500,
        'armadura': 2000
      }
      
      if (!prices[item]) return conn.reply(m.chat, `🛒 Artículo no encontrado en la tienda. Usa ${usedPrefix}shop para ver los disponibles.`, m)
      
      let totalCost = prices[item] * quantity
      
      if (user.gold < totalCost) {
        return conn.reply(m.chat, `💰 No tienes suficiente oro. Necesitas ${totalCost} oro para comprar ${quantity} ${item}(s).`, m)
      }
      
      // Procesar compra
      user.gold -= totalCost
      
      switch(item) {
        case 'pocion':
        case 'poción':
          user.potion += quantity
          break
        case 'alimento':
        case 'comida':
          user.food += quantity
          break
        case 'semillas':
        case 'semilla':
          user.seeds += quantity
          break
        case 'pico':
          user.pickaxe += quantity
          break
        case 'hacha':
          user.axe += quantity
          break
        case 'caña':
        case 'cañadepescar':
          user.fishingrod += quantity
          break
        case 'espada':
          user.weapon += quantity
          break
        case 'armadura':
          user.armor += quantity
          break
      }
      
      conn.reply(m.chat, `🛍️ *¡COMPRA EXITOSA!*\n\nHas comprado ${quantity} ${item}(s) por ${totalCost} oro.`, m)
      break
      
    // Sistema de venta  
    case 'sell':
    case 'vender':
      if (!args[1]) return conn.reply(m.chat, `💰 Debes especificar qué quieres vender.\n\nEjemplo: ${usedPrefix}sell piedra 10`, m)
      
      let resource = args[1].toLowerCase()
      let amount = parseInt(args[2]) || 1
      
      if (amount < 1) return conn.reply(m.chat, `📊 La cantidad debe ser al menos 1.`, m)
      
      let sellPrices = {
        'piedra': 10,
        'hierro': 25,
        'madera': 15,
        'cuero': 30,
        'cuerda': 15,
        'cultivo': 40,
        'cultivos': 40,
        'hierba': 20,
        'hierbas': 20
      }
      
      // Precios especiales para gemas
      if (resource === 'diamante' || resource === 'diamantes') {
        sellPrices[resource] = 750
        if (user.diamond < amount) {
          return conn.reply(m.chat, `💎 No tienes suficientes diamantes. Solo tienes ${user.diamond}.`, m)
        }
        user.diamond -= amount
        user.gold += sellPrices[resource] * amount
        
        conn.reply(m.chat, `💰 *¡VENTA EXITOSA!*\n\nHas vendido ${amount} diamante(s) por ${sellPrices[resource] * amount} oro.`, m)
        return
      } else if (resource === 'esmeralda' || resource === 'esmeraldas') {
        sellPrices[resource] = 500
        if (user.emerald < amount) {
          return conn.reply(m.chat, `🟢 No tienes suficientes esmeraldas. Solo tienes ${user.emerald}.`, m)
        }
        user.emerald -= amount
        user.gold += sellPrices[resource] * amount
        
        conn.reply(m.chat, `💰 *¡VENTA EXITOSA!*\n\nHas vendido ${amount} esmeralda(s) por ${sellPrices[resource] * amount} oro.`, m)
        return
      } else if (resource === 'rubi' || resource === 'rubí' || resource === 'rubies' || resource === 'rubíes') {
        sellPrices[resource] = 600
        if (user.ruby < amount) {
          return conn.reply(m.chat, `❤️ No tienes suficientes rubíes. Solo tienes ${user.ruby}.`, m)
        }
        user.ruby -= amount
        user.gold += sellPrices[resource] * amount
        
        conn.reply(m.chat, `💰 *¡VENTA EXITOSA!*\n\nHas vendido ${amount} rubí(es) por ${sellPrices[resource] * amount} oro.`, m)
        return
      }
      
      if (!sellPrices[resource]) return conn.reply(m.chat, `🛒 Recurso no válido para vender. Recursos vendibles: piedra, hierro, madera, cuero, cuerda, cultivos, hierbas, diamante, esmeralda, rubí.`, m)
      
      // Verificar cantidad disponible
      switch(resource) {
        case 'piedra':
          if (user.stone < amount) {
            return conn.reply(m.chat, `🧱 No tienes suficiente piedra. Solo tienes ${user.stone}.`, m)
          }
          user.stone -= amount
          break
        case 'hierro':
          if (user.iron < amount) {
            return conn.reply(m.chat, `⚙️ No tienes suficiente hierro. Solo tienes ${user.iron}.`, m)
          }
          user.iron -= amount
          break
        case 'madera':
          if (user.wood < amount) {
            return conn.reply(m.chat, `🪵 No tienes suficiente madera. Solo tienes ${user.wood}.`, m)
          }
          user.wood -= amount
          break
        case 'cuero':
          if (user.leather < amount) {
            return conn.reply(m.chat, `🧣 No tienes suficiente cuero. Solo tienes ${user.leather}.`, m)
          }
          user.leather -= amount
          break
        case 'cuerda':
          if (user.string < amount) {
            return conn.reply(m.chat, `🧵 No tienes suficiente cuerda. Solo tienes ${user.string}.`, m)
          }
          user.string -= amount
          break
        case 'cultivo':
        case 'cultivos':
          if (user.crops < amount) {
            return conn.reply(m.chat, `🌽 No tienes suficientes cultivos. Solo tienes ${user.crops}.`, m)
          }
          user.crops -= amount
          break
        case 'hierba':
        case 'hierbas':
          if (user.herb < amount) {
            return conn.reply(m.chat, `🌿 No tienes suficientes hierbas. Solo tienes ${user.herb}.`, m)
          }
          user.herb -= amount
          break
      }
      
      // Calcular dinero recibido
      let receivedGold = sellPrices[resource] * amount
      user.gold += receivedGold
      
      conn.reply(m.chat, `💰 *¡VENTA EXITOSA!*\n\nHas vendido ${amount} ${resource}(s) por ${receivedGold} oro.`, m)
      break
      
    // Valores por defecto
    default:
      return conn.reply(m.chat, helpText, m)
  }
}

handler.help = ['rpg']
handler.tags = ['rpg']
handler.command = /^(rpg|rpgultra|ultra)$/i

export default handler