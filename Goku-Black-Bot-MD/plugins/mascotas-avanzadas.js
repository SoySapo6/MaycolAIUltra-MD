import fetch from 'node-fetch'
import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

let handler = async (m, { conn, args, usedPrefix, command, text }) => {
  // Base de datos en memoria para las mascotas
  if (!global.db.data.mascots) {
    global.db.data.mascots = {}
  }
  
  // Obtener o crear los datos de mascota del usuario
  const userId = m.sender
  if (!global.db.data.mascots[userId]) {
    global.db.data.mascots[userId] = {
      hasMascot: false,
      name: '',
      type: '',
      level: 1,
      exp: 0,
      health: 100,
      happiness: 100,
      energy: 100,
      hunger: 0,
      thirst: 0,
      lastFed: Date.now(),
      lastPlayed: Date.now(),
      lastTrained: Date.now(),
      skills: [],
      accessories: [],
      inventory: [],
      achievements: [],
      friendship: 0,
      evolution: 0,
      color: 'normal',
      personality: ''
    }
  }
  
  let mascot = global.db.data.mascots[userId]
  
  // Lista de tipos de mascotas disponibles con emojis y descripciones
  const mascotTypes = [
    { id: 'dog', emoji: '🐶', name: 'Perro', description: 'Leal y juguetón. Ideal para aventuras.' },
    { id: 'cat', emoji: '🐱', name: 'Gato', description: 'Independiente y astuto. Bueno encontrando tesoros.' },
    { id: 'fox', emoji: '🦊', name: 'Zorro', description: 'Inteligente y ágil. Experto en búsquedas.' },
    { id: 'rabbit', emoji: '🐰', name: 'Conejo', description: 'Adorable y veloz. Recolecta recursos rápidamente.' },
    { id: 'parrot', emoji: '🦜', name: 'Loro', description: 'Hablador y colorido. Puede repetir mensajes.' },
    { id: 'dragon', emoji: '🐉', name: 'Dragón', description: 'Poderoso y místico. Raro y difícil de entrenar.' },
    { id: 'hamster', emoji: '🐹', name: 'Hámster', description: 'Pequeño y curioso. Encuentra pequeños tesoros.' },
    { id: 'panda', emoji: '🐼', name: 'Panda', description: 'Tranquilo y adorable. Da buena suerte.' },
    { id: 'wolf', emoji: '🐺', name: 'Lobo', description: 'Salvaje y protector. Bueno en combate.' },
    { id: 'penguin', emoji: '🐧', name: 'Pingüino', description: 'Elegante y social. Experto nadador.' }
  ]
  
  // Lista de personalidades disponibles
  const personalities = [
    { id: 'playful', name: 'Juguetón', effect: 'Gana felicidad más rápido' },
    { id: 'brave', name: 'Valiente', effect: 'Mejor en aventuras' },
    { id: 'shy', name: 'Tímido', effect: 'Necesita más atención' },
    { id: 'smart', name: 'Inteligente', effect: 'Aprende habilidades más rápido' },
    { id: 'loyal', name: 'Leal', effect: 'Vínculo más fuerte con el dueño' },
    { id: 'curious', name: 'Curioso', effect: 'Encuentra más objetos' },
    { id: 'lazy', name: 'Perezoso', effect: 'Consume menos energía' },
    { id: 'energetic', name: 'Enérgico', effect: 'Más activo pero necesita más comida' }
  ]
  
  // Lista de colores especiales
  const specialColors = [
    { id: 'normal', name: 'Normal', emoji: '⚪' },
    { id: 'golden', name: 'Dorado', emoji: '🟡' },
    { id: 'cosmic', name: 'Cósmico', emoji: '🔮' },
    { id: 'shadow', name: 'Sombra', emoji: '⚫' },
    { id: 'crystal', name: 'Cristal', emoji: '💎' },
    { id: 'fire', name: 'Fuego', emoji: '🔥' },
    { id: 'water', name: 'Agua', emoji: '💧' },
    { id: 'nature', name: 'Naturaleza', emoji: '🍃' }
  ]
  
  // Habilidades que pueden aprender las mascotas
  const availableSkills = [
    { id: 'fetch', name: 'Buscar', description: 'Recupera objetos en aventuras', minLevel: 2 },
    { id: 'guard', name: 'Guardia', description: 'Protege de ataques', minLevel: 3 },
    { id: 'trick', name: 'Truco', description: 'Realiza trucos divertidos', minLevel: 2 },
    { id: 'heal', name: 'Curación', description: 'Cura a su dueño', minLevel: 5 },
    { id: 'hunt', name: 'Cazar', description: 'Encuentra comida', minLevel: 4 },
    { id: 'search', name: 'Rastrear', description: 'Encuentra tesoros escondidos', minLevel: 3 },
    { id: 'swim', name: 'Nadar', description: 'Puede aventurarse en el agua', minLevel: 4 },
    { id: 'dig', name: 'Excavar', description: 'Desentierra tesoros', minLevel: 3 },
    { id: 'fly', name: 'Volar', description: 'Puede explorar el cielo', minLevel: 6 },
    { id: 'mimic', name: 'Imitar', description: 'Imita sonidos y acciones', minLevel: 4 }
  ]
  
  // Accesorios disponibles para las mascotas
  const accessories = [
    { id: 'collar', name: 'Collar', emoji: '🔷', effect: 'Aumenta la amistad' },
    { id: 'hat', name: 'Sombrero', emoji: '🎩', effect: 'Protege del calor' },
    { id: 'boots', name: 'Botas', emoji: '👢', effect: 'Mejora velocidad' },
    { id: 'backpack', name: 'Mochila', emoji: '🎒', effect: 'Aumenta inventario' },
    { id: 'glasses', name: 'Gafas', emoji: '👓', effect: 'Mejora la percepción' },
    { id: 'armor', name: 'Armadura', emoji: '🛡️', effect: 'Protección extra' },
    { id: 'scarf', name: 'Bufanda', emoji: '🧣', effect: 'Protege del frío' },
    { id: 'gloves', name: 'Guantes', emoji: '🧤', effect: 'Mejora destreza' }
  ]
  
  // Subcomandos disponibles
  if (!args[0]) {
    const helpMenu = `
╭━━━━━━━━━⬣
┃ 🐾 *SISTEMA DE MASCOTAS* 🐾
┃≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
┃
┃ *Comandos Disponibles:*
┃
┃ *${usedPrefix}mascota adoptar*
┃ _Adopta una nueva mascota_
┃
┃ *${usedPrefix}mascota nombre [nombre]*
┃ _Dale un nombre a tu mascota_
┃
┃ *${usedPrefix}mascota info*
┃ _Ver información de tu mascota_
┃
┃ *${usedPrefix}mascota alimentar*
┃ _Alimenta a tu mascota_
┃
┃ *${usedPrefix}mascota jugar*
┃ _Juega con tu mascota_
┃
┃ *${usedPrefix}mascota entrenar*
┃ _Entrena a tu mascota_
┃
┃ *${usedPrefix}mascota aventura*
┃ _Envía a tu mascota de aventura_
┃
┃ *${usedPrefix}mascota habilidades*
┃ _Ver y aprender habilidades_
┃
┃ *${usedPrefix}mascota accesorios*
┃ _Ver y equipar accesorios_
┃
┃ *${usedPrefix}mascota evolucionar*
┃ _Evoluciona a tu mascota_
┃
┃ *${usedPrefix}mascota color*
┃ _Cambia el color de tu mascota_
┃
┃ *${usedPrefix}mascota logros*
┃ _Ver logros de tu mascota_
┃
┃ *${usedPrefix}mascota personalidad*
┃ _Ver o cambiar personalidad_
┃
┃ *${usedPrefix}mascota interactuar*
┃ _Interactúa con tu mascota_
╰━━━━━━━━━━━━━━━━━━⬣
`
    return conn.reply(m.chat, helpMenu, m)
  }
  
  const subcommand = args[0].toLowerCase()
  
  // Subcomando: adoptar
  if (subcommand === 'adoptar' || subcommand === 'adopt') {
    // Verificar si ya tiene mascota
    if (mascot.hasMascot) {
      return conn.reply(m.chat, `🐾 *Ya tienes una mascota*\n\nYa tienes a *${mascot.name || 'tu mascota'}* (${getMascotTypeEmoji(mascot.type)} ${getMascotTypeName(mascot.type)}). Solo puedes tener una mascota a la vez.`, m)
    }
    
    // Si no especificó tipo, mostrar opciones
    if (!args[1]) {
      let mascotTypesList = `
╭━━━━━━━━━⬣
┃ 🐾 *ADOPCIÓN DE MASCOTAS* 🐾
┃≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
┃
┃ *Elige un tipo de mascota:*
┃
`
      mascotTypes.forEach((type, index) => {
        mascotTypesList += `┃ *${index + 1}.* ${type.emoji} ${type.name}\n┃ _${type.description}_\n┃\n`
      })
      
      mascotTypesList += `┃\n┃ *Uso:* ${usedPrefix}mascota adoptar [número]`
      mascotTypesList += `\n╰━━━━━━━━━━━━━━━━━━⬣`
      
      return conn.reply(m.chat, mascotTypesList, m)
    }
    
    // Adoptar la mascota seleccionada
    const typeIndex = parseInt(args[1]) - 1
    if (isNaN(typeIndex) || typeIndex < 0 || typeIndex >= mascotTypes.length) {
      return conn.reply(m.chat, `❌ *Número inválido*\n\nPor favor selecciona un número entre 1 y ${mascotTypes.length}.`, m)
    }
    
    // Asignar un tipo de mascota
    const selectedType = mascotTypes[typeIndex]
    mascot.type = selectedType.id
    mascot.hasMascot = true
    
    // Asignar una personalidad aleatoria
    const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)]
    mascot.personality = randomPersonality.id
    
    // Posibilidad de color especial (5% de probabilidad)
    const colorRoll = Math.random() * 100
    if (colorRoll <= 5) {
      const specialColorsList = specialColors.filter(c => c.id !== 'normal')
      const randomSpecialColor = specialColorsList[Math.floor(Math.random() * specialColorsList.length)]
      mascot.color = randomSpecialColor.id
    }
    
    // Mensaje de adopción exitosa
    const adoptionMessage = `
╭━━━━━━━━━⬣
┃ 🎉 *¡MASCOTA ADOPTADA!* 🎉
┃≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
┃
┃ Has adoptado un ${selectedType.emoji} *${selectedType.name}*
┃
┃ *Personalidad:* ${getPersonalityName(mascot.personality)}
┃ *Color:* ${getColorName(mascot.color)} ${getColorEmoji(mascot.color)}
┃
┃ *¡Ponle un nombre!* Usa:
┃ *${usedPrefix}mascota nombre [nombre]*
╰━━━━━━━━━━━━━━━━━━⬣
`
    
    return conn.reply(m.chat, adoptionMessage, m)
  }
  
  // --- Verificar que el usuario tenga mascota para los demás comandos ---
  if (!mascot.hasMascot && subcommand !== 'adoptar' && subcommand !== 'adopt') {
    return conn.reply(m.chat, `🐾 *No tienes una mascota*\n\nAdopta una mascota primero usando:\n*${usedPrefix}mascota adoptar*`, m)
  }
  
  // Actualizar estado de la mascota (hambre, sed, energía, etc.)
  updateMascotStatus(mascot)
  
  // Subcomando: nombre
  if (subcommand === 'nombre' || subcommand === 'name') {
    if (!args[1]) {
      return conn.reply(m.chat, `⚠️ *Debes especificar un nombre*\n\nUso: *${usedPrefix}mascota nombre [nombre]*`, m)
    }
    
    // Obtener el nombre (permitir espacios)
    const newName = args.slice(1).join(' ')
    
    // Verificar longitud del nombre
    if (newName.length < 2 || newName.length > 15) {
      return conn.reply(m.chat, `⚠️ *Nombre inválido*\n\nEl nombre debe tener entre 2 y 15 caracteres.`, m)
    }
    
    // Asignar nuevo nombre
    mascot.name = newName
    
    return conn.reply(m.chat, `✅ *Nombre cambiado con éxito*\n\nTu ${getMascotTypeEmoji(mascot.type)} ${getMascotTypeName(mascot.type)} ahora se llama *${newName}*.`, m)
  }
  
  // Subcomando: info
  if (subcommand === 'info' || subcommand === 'información' || subcommand === 'informacion' || subcommand === 'estado' || subcommand === 'status') {
    const expNextLevel = mascot.level * 100
    const progressBar = createProgressBar(mascot.exp, expNextLevel, 10)
    
    // Calcular tiempo desde la última alimentación
    const lastFedTimeAgo = getTimeAgo(mascot.lastFed)
    const lastPlayedTimeAgo = getTimeAgo(mascot.lastPlayed)
    
    // Determinar mensajes de estado
    const hungerStatus = getStatusEmoji(100 - mascot.hunger)
    const thirstStatus = getStatusEmoji(100 - mascot.thirst)
    const happinessStatus = getStatusEmoji(mascot.happiness)
    const energyStatus = getStatusEmoji(mascot.energy)
    const healthStatus = getStatusEmoji(mascot.health)
    
    const mascotInfo = `
╭━━━━━━━━━⬣
┃ 🐾 *INFORMACIÓN DE MASCOTA* 🐾
┃≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
┃
┃ ${getColorEmoji(mascot.color)} *${mascot.name || 'Sin nombre'}* ${getMascotTypeEmoji(mascot.type)}
┃ *Tipo:* ${getMascotTypeName(mascot.type)}
┃ *Nivel:* ${mascot.level} 
┃ *EXP:* ${mascot.exp}/${expNextLevel}
┃ ${progressBar}
┃
┃ *Personalidad:* ${getPersonalityName(mascot.personality)}
┃ *Color:* ${getColorName(mascot.color)}
┃ *Evolución:* ${getEvolutionStage(mascot.evolution)}
┃
┃ *Estado actual:*
┃ *❤️ Salud:* ${mascot.health}% ${healthStatus}
┃ *😊 Felicidad:* ${mascot.happiness}% ${happinessStatus}
┃ *⚡ Energía:* ${mascot.energy}% ${energyStatus}
┃ *🍖 Hambre:* ${100 - mascot.hunger}% ${hungerStatus}
┃ *💧 Sed:* ${100 - mascot.thirst}% ${thirstStatus}
┃
┃ *Última alimentación:* ${lastFedTimeAgo}
┃ *Último juego:* ${lastPlayedTimeAgo}
┃
┃ *Habilidades:* ${mascot.skills.length > 0 ? 
        mascot.skills.map(skill => getSkillName(skill)).join(', ') : 
        'Ninguna aún'}
┃
┃ *Accesorios:* ${mascot.accessories.length > 0 ? 
        mascot.accessories.map(acc => getAccessoryEmoji(acc) + ' ' + getAccessoryName(acc)).join(', ') : 
        'Ninguno equipado'}
╰━━━━━━━━━━━━━━━━━━⬣
`
    
    return conn.reply(m.chat, mascotInfo, m)
  }
  
  // Subcomando: alimentar
  if (subcommand === 'alimentar' || subcommand === 'feed') {
    // Verificar si la mascota necesita comida
    if (mascot.hunger < 20) {
      return conn.reply(m.chat, `🍖 *${mascot.name || 'Tu mascota'}* no tiene hambre en este momento.`, m)
    }
    
    // Alimentar a la mascota
    const previousHunger = mascot.hunger
    mascot.hunger = Math.max(0, mascot.hunger - 60)
    mascot.thirst = Math.min(100, mascot.thirst + 15) // Aumenta la sed
    mascot.health = Math.min(100, mascot.health + 10)
    mascot.lastFed = Date.now()
    
    // Obtener exp por alimentar
    mascot.exp += 10
    checkLevelUp(conn, m, mascot)
    
    // Efectos de personalidad
    if (mascot.personality === 'energetic') {
      mascot.energy = Math.min(100, mascot.energy + 15)
    }
    
    return conn.reply(m.chat, `
🍖 *¡${mascot.name || 'Tu mascota'}* ha sido alimentad${mascot.name ? 'a' : 'o'}!*

*Hambre:* ${previousHunger}% → ${mascot.hunger}%
*Salud:* +10%
*EXP:* +10

${mascot.name || 'Tu mascota'} se ve mucho más feliz ahora.
`, m)
  }
  
  // Subcomando: jugar
  if (subcommand === 'jugar' || subcommand === 'play') {
    // Verificar energía
    if (mascot.energy < 30) {
      return conn.reply(m.chat, `⚡ *${mascot.name || 'Tu mascota'}* está demasiado cansad${mascot.name ? 'a' : 'o'} para jugar ahora.\n\nDeja que descanse un poco más.`, m)
    }
    
    // Jugar con la mascota
    const games = [
      'perseguir la pelota',
      'saltar obstáculos',
      'jugar al escondite',
      'dar vueltas en círculos',
      'hacer trucos',
      'explorar los alrededores',
      'correr juntos',
      'hacer mimos'
    ]
    
    const selectedGame = games[Math.floor(Math.random() * games.length)]
    mascot.happiness = Math.min(100, mascot.happiness + 30)
    mascot.energy = Math.max(0, mascot.energy - 30)
    mascot.hunger = Math.min(100, mascot.hunger + 15)
    mascot.thirst = Math.min(100, mascot.thirst + 20)
    mascot.lastPlayed = Date.now()
    
    // Obtener exp por jugar
    mascot.exp += 15
    mascot.friendship += 2
    checkLevelUp(conn, m, mascot)
    
    // Efectos de personalidad
    let bonusText = ''
    if (mascot.personality === 'playful') {
      mascot.happiness = Math.min(100, mascot.happiness + 10)
      bonusText = '\n\n*¡Bonus!* Por ser jugueton, ganó +10% de felicidad extra.'
    }
    
    return conn.reply(m.chat, `
🎮 *¡Jugando con ${mascot.name || 'tu mascota'}!*

Has estado jugando a ${selectedGame} con ${mascot.name || 'tu mascota'}.

*Felicidad:* +30%
*Energía:* -30%
*Amistad:* +2
*EXP:* +15
${bonusText}

${mascot.name || 'Tu mascota'} se divirtió mucho contigo.
`, m)
  }
  
  // Subcomando: entrenar
  if (subcommand === 'entrenar' || subcommand === 'train') {
    // Verificar energía
    if (mascot.energy < 40) {
      return conn.reply(m.chat, `⚡ *${mascot.name || 'Tu mascota'}* está demasiado cansad${mascot.name ? 'a' : 'o'} para entrenar ahora.\n\nDeja que descanse y recupere energía.`, m)
    }
    
    // Entrenar a la mascota
    const trainings = [
      'ejercicios básicos',
      'entrenamiento de obediencia',
      'pruebas de agilidad',
      'entrenamiento de resistencia',
      'ejercicios de fuerza',
      'práctica de trucos',
      'entrenamiento de habilidades',
      'ejercicios de concentración'
    ]
    
    const selectedTraining = trainings[Math.floor(Math.random() * trainings.length)]
    mascot.energy = Math.max(0, mascot.energy - 40)
    mascot.hunger = Math.min(100, mascot.hunger + 25)
    mascot.thirst = Math.min(100, mascot.thirst + 30)
    mascot.lastTrained = Date.now()
    
    // Obtener exp por entrenar (más que por jugar)
    mascot.exp += 25
    mascot.friendship += 1
    checkLevelUp(conn, m, mascot)
    
    // Posibilidad de aprender una nueva habilidad (15% de probabilidad)
    let newSkillText = ''
    if (Math.random() < 0.15) {
      const availableForLevel = availableSkills.filter(skill => 
        skill.minLevel <= mascot.level && 
        !mascot.skills.includes(skill.id)
      )
      
      if (availableForLevel.length > 0) {
        const newSkill = availableForLevel[Math.floor(Math.random() * availableForLevel.length)]
        mascot.skills.push(newSkill.id)
        newSkillText = `\n\n*¡INCREÍBLE!* ${mascot.name || 'Tu mascota'} ha aprendido la habilidad: *${newSkill.name}*`
      }
    }
    
    // Efectos de personalidad
    let bonusText = ''
    if (mascot.personality === 'smart') {
      mascot.exp += 10
      bonusText = '\n\n*¡Bonus!* Por ser inteligente, ganó +10 EXP extra.'
    }
    
    return conn.reply(m.chat, `
💪 *¡Entrenamiento completado!*

Has entrenado ${selectedTraining} con ${mascot.name || 'tu mascota'}.

*Energía:* -40%
*EXP:* +25
*Amistad:* +1
${bonusText}
${newSkillText}

${mascot.name || 'Tu mascota'} se ha esforzado mucho.
`, m)
  }
  
  // Subcomando: aventura
  if (subcommand === 'aventura' || subcommand === 'adventure') {
    // Verificar nivel mínimo
    if (mascot.level < 3) {
      return conn.reply(m.chat, `⚠️ *Nivel insuficiente*\n\n${mascot.name || 'Tu mascota'} necesita ser al menos nivel 3 para ir de aventura.\n\nNivel actual: ${mascot.level}`, m)
    }
    
    // Verificar energía
    if (mascot.energy < 50) {
      return conn.reply(m.chat, `⚡ *${mascot.name || 'Tu mascota'}* está demasiado cansad${mascot.name ? 'a' : 'o'} para ir de aventura.\n\nNecesita al menos 50% de energía.`, m)
    }
    
    // Verificar salud
    if (mascot.health < 50) {
      return conn.reply(m.chat, `❤️ *${mascot.name || 'Tu mascota'}* no tiene suficiente salud para aventurarse.\n\nNecesita al menos 50% de salud.`, m)
    }
    
    // Lugares para aventura
    const adventureLocations = [
      { name: 'Bosque Encantado', difficulty: 1, emoji: '🌲' },
      { name: 'Playa Dorada', difficulty: 1, emoji: '🏖️' },
      { name: 'Montañas Nevadas', difficulty: 2, emoji: '🏔️' },
      { name: 'Cueva Misteriosa', difficulty: 2, emoji: '🕳️' },
      { name: 'Pantano Brumoso', difficulty: 3, emoji: '🌫️' },
      { name: 'Ruinas Antiguas', difficulty: 3, emoji: '🏛️' },
      { name: 'Volcán Ardiente', difficulty: 4, emoji: '🌋' },
      { name: 'Isla Perdida', difficulty: 4, emoji: '🏝️' },
      { name: 'Ciudad Abandonada', difficulty: 3, emoji: '🏚️' },
      { name: 'Dimensión Paralela', difficulty: 5, emoji: '🌌' }
    ]
    
    // Filtrar por nivel (máximo nivel de dificultad = nivel de mascota / 2, redondeado)
    const maxDifficulty = Math.min(5, Math.ceil(mascot.level / 2))
    const availableLocations = adventureLocations.filter(loc => loc.difficulty <= maxDifficulty)
    const selectedLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)]
    
    // Calcular probabilidad de éxito según nivel, habilidades y personalidad
    let successChance = 0.5 + (mascot.level * 0.05)
    
    // Bonus por habilidades específicas
    if (mascot.skills.includes('search')) successChance += 0.1
    if (mascot.skills.includes('brave')) successChance += 0.1
    
    // Efectos de personalidad
    if (mascot.personality === 'brave') successChance += 0.15
    if (mascot.personality === 'curious') successChance += 0.1
    
    // Costos de la aventura
    mascot.energy = Math.max(0, mascot.energy - (30 + selectedLocation.difficulty * 5))
    mascot.hunger = Math.min(100, mascot.hunger + (20 + selectedLocation.difficulty * 3))
    mascot.thirst = Math.min(100, mascot.thirst + (15 + selectedLocation.difficulty * 3))
    
    // Determinar resultado de la aventura
    const adventureRoll = Math.random()
    let adventureResult = ''
    let expGained = 20 + (selectedLocation.difficulty * 10)
    
    // Recompensas posibles
    const rewards = {
      items: ['Cuerda mágica', 'Pluma brillante', 'Cristal energético', 'Roca antigua', 'Fruta exótica', 'Amuleto misterioso', 'Llave oxidada', 'Mapa fragmentado', 'Poción curativa', 'Semilla rara'],
      accessories: accessories.filter(a => !mascot.accessories.includes(a.id)),
      special: ['huevo misterioso', 'fragmento de evolución', 'tinte mágico', 'collar legendario']
    }
    
    if (adventureRoll < 0.1) {
      // Desastre (10% de probabilidad)
      adventureResult = `😟 *¡Oh no!* La aventura no salió bien. ${mascot.name || 'Tu mascota'} tuvo algunos problemas y regresó sin encontrar nada valioso.`
      mascot.health = Math.max(50, mascot.health - 15)
      mascot.happiness = Math.max(50, mascot.happiness - 10)
      expGained = Math.floor(expGained / 2)
    } else if (adventureRoll < (1 - successChance)) {
      // Fracaso (probabilidad basada en cálculos anteriores)
      adventureResult = `😐 *¡Aventura completada!* ${mascot.name || 'Tu mascota'} exploró ${selectedLocation.emoji} ${selectedLocation.name} pero no encontró nada de valor esta vez.`
    } else if (adventureRoll < 0.9) {
      // Éxito normal (la mayoría de los casos)
      const foundItem = rewards.items[Math.floor(Math.random() * rewards.items.length)]
      adventureResult = `🎉 *¡AVENTURA EXITOSA!* ${mascot.name || 'Tu mascota'} exploró ${selectedLocation.emoji} ${selectedLocation.name} y encontró: *${foundItem}*.`
      
      if (!mascot.inventory) mascot.inventory = []
      mascot.inventory.push(foundItem)
      mascot.happiness = Math.min(100, mascot.happiness + 10)
    } else {
      // Gran éxito (10% de probabilidad)
      let specialReward = ''
      const specialRoll = Math.random()
      
      if (specialRoll < 0.7 && rewards.accessories.length > 0) {
        // Encontrar un accesorio (70% del gran éxito)
        const newAccessory = rewards.accessories[Math.floor(Math.random() * rewards.accessories.length)]
        specialReward = `${getAccessoryEmoji(newAccessory.id)} *${getAccessoryName(newAccessory.id)}*`
        mascot.accessories.push(newAccessory.id)
      } else {
        // Encontrar un objeto especial (30% del gran éxito)
        const specialItem = rewards.special[Math.floor(Math.random() * rewards.special.length)]
        specialReward = specialItem
        
        if (specialItem === 'fragmento de evolución') {
          mascot.evolution += 1
        } else if (specialItem === 'tinte mágico') {
          const newColor = specialColors.filter(c => c.id !== 'normal' && c.id !== mascot.color)
          const randomColor = newColor[Math.floor(Math.random() * newColor.length)]
          mascot.color = randomColor.id
          specialReward += ` (${getColorEmoji(mascot.color)} Color ${getColorName(mascot.color)})`
        }
        
        if (!mascot.inventory) mascot.inventory = []
        mascot.inventory.push(specialItem)
      }
      
      adventureResult = `🌟 *¡GRAN DESCUBRIMIENTO!* ${mascot.name || 'Tu mascota'} exploró ${selectedLocation.emoji} ${selectedLocation.name} y encontró un tesoro excepcional: ${specialReward}.`
      expGained *= 2
      mascot.happiness = 100
    }
    
    // Añadir experiencia
    mascot.exp += expGained
    checkLevelUp(conn, m, mascot)
    
    return conn.reply(m.chat, `
🧭 *AVENTURA DE MASCOTA* 🧭

${mascot.name || 'Tu mascota'} se aventuró en ${selectedLocation.emoji} *${selectedLocation.name}*

${adventureResult}

*Energía:* -${30 + selectedLocation.difficulty * 5}%
*EXP ganada:* +${expGained}
*Nivel actual:* ${mascot.level}
`, m)
  }
  
  // Subcomando: habilidades
  if (subcommand === 'habilidades' || subcommand === 'skills') {
    if (!args[1]) {
      // Mostrar lista de habilidades actuales y disponibles
      const currentSkills = mascot.skills.map(skillId => {
        const skill = availableSkills.find(s => s.id === skillId)
        return `• ${skill.name}: ${skill.description}`
      })
      
      const availableForLevel = availableSkills.filter(skill => 
        skill.minLevel <= mascot.level && 
        !mascot.skills.includes(skill.id)
      )
      
      const availableSkillList = availableForLevel.map(skill => 
        `• ${skill.name} (Nivel ${skill.minLevel}): ${skill.description}`
      )
      
      const skillsMessage = `
╭━━━━━━━━━⬣
┃ 🧠 *HABILIDADES DE MASCOTA* 🧠
┃≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
┃
┃ *${mascot.name || 'Tu mascota'}* (Nivel ${mascot.level})
┃
${mascot.skills.length > 0 ? `┃ *Habilidades aprendidas:*
┃ ${currentSkills.join('\n┃ ')}` : '┃ *No tiene habilidades aún*'}
┃
${availableForLevel.length > 0 ? `┃ *Habilidades disponibles:*
┃ ${availableSkillList.join('\n┃ ')}` : '┃ *No hay habilidades disponibles*'}
┃
┃ *Aprende nuevas habilidades entrenando*
┃ *o usa:* ${usedPrefix}mascota habilidades [nombre]
╰━━━━━━━━━━━━━━━━━━⬣
`
      
      return conn.reply(m.chat, skillsMessage, m)
    } else {
      // Intentar aprender una habilidad específica
      const skillName = args.slice(1).join(' ').toLowerCase()
      const skill = availableSkills.find(s => 
        s.name.toLowerCase() === skillName || 
        s.id === skillName
      )
      
      if (!skill) {
        return conn.reply(m.chat, `❌ *Habilidad no encontrada*\n\nPor favor verifica el nombre de la habilidad.`, m)
      }
      
      if (mascot.skills.includes(skill.id)) {
        return conn.reply(m.chat, `⚠️ *${mascot.name || 'Tu mascota'}* ya conoce la habilidad *${skill.name}*.`, m)
      }
      
      if (skill.minLevel > mascot.level) {
        return conn.reply(m.chat, `⚠️ *Nivel insuficiente*\n\n${mascot.name || 'Tu mascota'} necesita ser nivel ${skill.minLevel} para aprender *${skill.name}*.\n\nNivel actual: ${mascot.level}`, m)
      }
      
      // Verificar energía
      if (mascot.energy < 30) {
        return conn.reply(m.chat, `⚡ *${mascot.name || 'Tu mascota'}* está demasiado cansad${mascot.name ? 'a' : 'o'} para aprender ahora.\n\nNecesita al menos 30% de energía.`, m)
      }
      
      // Aprender la habilidad
      mascot.skills.push(skill.id)
      mascot.energy = Math.max(0, mascot.energy - 30)
      mascot.exp += 20
      checkLevelUp(conn, m, mascot)
      
      return conn.reply(m.chat, `
🎓 *¡NUEVA HABILIDAD APRENDIDA!*

*${mascot.name || 'Tu mascota'}* ha aprendido:
*${skill.name}* - ${skill.description}

*Energía:* -30%
*EXP:* +20
`, m)
    }
  }
  
  // Subcomando: accesorios
  if (subcommand === 'accesorios' || subcommand === 'accessories') {
    if (!args[1]) {
      // Mostrar accesorios equipados y disponibles
      const equippedAccessories = mascot.accessories.map(accId => {
        const acc = accessories.find(a => a.id === accId)
        return `• ${acc.emoji} ${acc.name}: ${acc.effect}`
      })
      
      const unequippedAccessories = accessories.filter(a => !mascot.accessories.includes(a.id))
        .map(acc => `• ${acc.emoji} ${acc.name}: ${acc.effect}`)
      
      const accessoriesMessage = `
╭━━━━━━━━━⬣
┃ 🎀 *ACCESORIOS DE MASCOTA* 🎀
┃≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
┃
┃ *${mascot.name || 'Tu mascota'}* (Nivel ${mascot.level})
┃
${mascot.accessories.length > 0 ? `┃ *Accesorios equipados:*
┃ ${equippedAccessories.join('\n┃ ')}` : '┃ *No tiene accesorios equipados*'}
┃
${unequippedAccessories.length > 0 ? `┃ *Accesorios disponibles:*
┃ ${unequippedAccessories.join('\n┃ ')}` : '┃ *No hay accesorios disponibles*'}
┃
┃ *Consigue accesorios en aventuras*
┃ *o usa:* ${usedPrefix}mascota accesorios [nombre]
╰━━━━━━━━━━━━━━━━━━⬣
`
      
      return conn.reply(m.chat, accessoriesMessage, m)
    } else {
      // Equipar un accesorio específico
      const accessoryName = args.slice(1).join(' ').toLowerCase()
      const accessory = accessories.find(a => 
        a.name.toLowerCase() === accessoryName || 
        a.id === accessoryName
      )
      
      if (!accessory) {
        return conn.reply(m.chat, `❌ *Accesorio no encontrado*\n\nPor favor verifica el nombre del accesorio.`, m)
      }
      
      if (mascot.accessories.includes(accessory.id)) {
        // Ya equipado, lo quitamos
        mascot.accessories = mascot.accessories.filter(a => a !== accessory.id)
        return conn.reply(m.chat, `✅ Has quitado el accesorio ${accessory.emoji} *${accessory.name}* a *${mascot.name || 'tu mascota'}*.`, m)
      } else {
        // Equipar nuevo accesorio
        mascot.accessories.push(accessory.id)
        mascot.happiness = Math.min(100, mascot.happiness + 10)
        
        return conn.reply(m.chat, `
🎀 *¡NUEVO ACCESORIO EQUIPADO!*

Has equipado ${accessory.emoji} *${accessory.name}* a *${mascot.name || 'tu mascota'}*.

*Efecto:* ${accessory.effect}
*Felicidad:* +10%
`, m)
      }
    }
  }
  
  // Subcomando: evolucionar
  if (subcommand === 'evolucionar' || subcommand === 'evolve') {
    const evolutionFragmentsNeeded = (mascot.evolution + 1) * 3
    
    if (mascot.level < 5 + mascot.evolution * 5) {
      return conn.reply(m.chat, `⚠️ *Nivel insuficiente*\n\n${mascot.name || 'Tu mascota'} necesita ser nivel ${5 + mascot.evolution * 5} para evolucionar.\n\nNivel actual: ${mascot.level}`, m)
    }
    
    if (mascot.evolution >= 3) {
      return conn.reply(m.chat, `⚠️ *Evolución máxima*\n\n${mascot.name || 'Tu mascota'} ya ha alcanzado su evolución máxima.`, m)
    }
    
    // Contar fragmentos de evolución en inventario
    let evolutionFragments = 0
    if (mascot.inventory) {
      evolutionFragments = mascot.inventory.filter(item => item === 'fragmento de evolución').length
    }
    
    if (evolutionFragments < evolutionFragmentsNeeded) {
      return conn.reply(m.chat, `⚠️ *Fragmentos insuficientes*\n\n${mascot.name || 'Tu mascota'} necesita ${evolutionFragmentsNeeded} fragmentos de evolución.\n\nFragmentos actuales: ${evolutionFragments}\n\nConsigue más fragmentos enviando a tu mascota de aventura.`, m)
    }
    
    // Evolucionar mascota
    mascot.evolution += 1
    
    // Eliminar fragmentos usados
    for (let i = 0; i < evolutionFragmentsNeeded; i++) {
      const index = mascot.inventory.indexOf('fragmento de evolución')
      if (index !== -1) {
        mascot.inventory.splice(index, 1)
      }
    }
    
    // Mejoras por evolución
    mascot.health = 100
    mascot.happiness = 100
    mascot.energy = 100
    mascot.hunger = 0
    mascot.thirst = 0
    mascot.exp += 100
    
    // Nueva habilidad aleatoria por evolución
    const availableForLevel = availableSkills.filter(skill => 
      !mascot.skills.includes(skill.id)
    )
    
    let newSkillText = ''
    if (availableForLevel.length > 0) {
      const newSkill = availableForLevel[Math.floor(Math.random() * availableForLevel.length)]
      mascot.skills.push(newSkill.id)
      newSkillText = `\n\n*¡Nueva habilidad!* ${mascot.name || 'Tu mascota'} ha aprendido: *${newSkill.name}*`
    }
    
    checkLevelUp(conn, m, mascot)
    
    return conn.reply(m.chat, `
✨ *¡EVOLUCIÓN COMPLETADA!* ✨

*${mascot.name || 'Tu mascota'}* ha evolucionado a su forma ${getEvolutionStage(mascot.evolution)}.

*Fragmentos usados:* ${evolutionFragmentsNeeded}
*Nueva etapa:* ${getEvolutionStage(mascot.evolution)}
*Estadísticas:* Restauradas al máximo
*EXP:* +100
${newSkillText}

*¡Tu mascota se ve mucho más poderosa!*
`, m)
  }
  
  // Subcomando: color
  if (subcommand === 'color' || subcommand === 'colour') {
    if (!args[1]) {
      // Mostrar colores disponibles
      const colorsList = specialColors.map(color => 
        `• ${color.emoji} ${color.name}${mascot.color === color.id ? ' (Actual)' : ''}`
      )
      
      const colorsMessage = `
╭━━━━━━━━━⬣
┃ 🎨 *COLORES DE MASCOTA* 🎨
┃≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
┃
┃ *${mascot.name || 'Tu mascota'}*
┃ *Color actual:* ${getColorEmoji(mascot.color)} ${getColorName(mascot.color)}
┃
┃ *Colores disponibles:*
┃ ${colorsList.join('\n┃ ')}
┃
┃ *Nota:* Necesitas encontrar un tinte 
┃ mágico en aventuras para cambiar el color
┃ o usa: ${usedPrefix}mascota color [nombre]
╰━━━━━━━━━━━━━━━━━━⬣
`
      
      return conn.reply(m.chat, colorsMessage, m)
    } else {
      // Cambiar a un color específico
      const colorName = args.slice(1).join(' ').toLowerCase()
      const color = specialColors.find(c => 
        c.name.toLowerCase() === colorName || 
        c.id === colorName
      )
      
      if (!color) {
        return conn.reply(m.chat, `❌ *Color no encontrado*\n\nPor favor verifica el nombre del color.`, m)
      }
      
      if (mascot.color === color.id) {
        return conn.reply(m.chat, `⚠️ *${mascot.name || 'Tu mascota'}* ya tiene el color ${color.emoji} *${color.name}*.`, m)
      }
      
      // Verificar si tiene tinte mágico
      let hasDye = false
      if (mascot.inventory) {
        const dyeIndex = mascot.inventory.findIndex(item => item === 'tinte mágico')
        if (dyeIndex !== -1) {
          mascot.inventory.splice(dyeIndex, 1)
          hasDye = true
        }
      }
      
      if (!hasDye) {
        return conn.reply(m.chat, `⚠️ *Necesitas un tinte mágico*\n\n${mascot.name || 'Tu mascota'} necesita un tinte mágico para cambiar de color.\n\nConsigue uno enviando a tu mascota de aventura.`, m)
      }
      
      // Cambiar color
      const oldColor = mascot.color
      mascot.color = color.id
      mascot.happiness = Math.min(100, mascot.happiness + 20)
      
      return conn.reply(m.chat, `
🎨 *¡COLOR CAMBIADO!*

*${mascot.name || 'Tu mascota'}* ha cambiado su color:
${getColorEmoji(oldColor)} ${getColorName(oldColor)} → ${getColorEmoji(color.id)} ${getColorName(color.id)}

*Tinte mágico:* Usado
*Felicidad:* +20%
`, m)
    }
  }
  
  // Subcomando: logros
  if (subcommand === 'logros' || subcommand === 'achievements') {
    // Lista de logros posibles
    const possibleAchievements = [
      { id: 'level10', name: 'Crecimiento', description: 'Alcanzar nivel 10', condition: () => mascot.level >= 10 },
      { id: 'level20', name: 'Desarrollo Avanzado', description: 'Alcanzar nivel 20', condition: () => mascot.level >= 20 },
      { id: 'level30', name: 'Maestría', description: 'Alcanzar nivel 30', condition: () => mascot.level >= 30 },
      { id: 'evolution1', name: 'Primera Evolución', description: 'Evolucionar por primera vez', condition: () => mascot.evolution >= 1 },
      { id: 'evolution2', name: 'Segunda Evolución', description: 'Alcanzar la segunda evolución', condition: () => mascot.evolution >= 2 },
      { id: 'evolution3', name: 'Evolución Final', description: 'Alcanzar la evolución máxima', condition: () => mascot.evolution >= 3 },
      { id: 'skills5', name: 'Aprendiz', description: 'Aprender 5 habilidades', condition: () => mascot.skills.length >= 5 },
      { id: 'skills10', name: 'Virtuoso', description: 'Aprender 10 habilidades', condition: () => mascot.skills.length >= 10 },
      { id: 'accessories3', name: 'A la Moda', description: 'Tener 3 accesorios', condition: () => mascot.accessories.length >= 3 },
      { id: 'accessories5', name: 'Coleccionista', description: 'Tener 5 accesorios', condition: () => mascot.accessories.length >= 5 },
      { id: 'color', name: 'Transformación Mágica', description: 'Cambiar de color', condition: () => mascot.color !== 'normal' },
      { id: 'friendship50', name: 'Amistad Fuerte', description: 'Alcanzar 50 de amistad', condition: () => mascot.friendship >= 50 },
      { id: 'friendship100', name: 'Lazo Inquebrantable', description: 'Alcanzar 100 de amistad', condition: () => mascot.friendship >= 100 }
    ]
    
    // Verificar y añadir nuevos logros
    if (!mascot.achievements) mascot.achievements = []
    
    possibleAchievements.forEach(achievement => {
      if (!mascot.achievements.includes(achievement.id) && achievement.condition()) {
        mascot.achievements.push(achievement.id)
      }
    })
    
    // Preparar lista de logros conseguidos y pendientes
    const achievedList = possibleAchievements
      .filter(a => mascot.achievements.includes(a.id))
      .map(a => `• ✅ ${a.name}: ${a.description}`)
    
    const pendingList = possibleAchievements
      .filter(a => !mascot.achievements.includes(a.id))
      .map(a => `• ⭐ ${a.name}: ${a.description}`)
    
    const achievementsMessage = `
╭━━━━━━━━━⬣
┃ 🏆 *LOGROS DE MASCOTA* 🏆
┃≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
┃
┃ *${mascot.name || 'Tu mascota'}*
┃ *Logros conseguidos:* ${mascot.achievements.length}/${possibleAchievements.length}
┃
${achievedList.length > 0 ? `┃ *Logros desbloqueados:*
┃ ${achievedList.join('\n┃ ')}` : '┃ *No hay logros desbloqueados aún*'}
┃
${pendingList.length > 0 ? `┃ *Logros pendientes:*
┃ ${pendingList.join('\n┃ ')}` : '┃ *¡Todos los logros completados!*'}
╰━━━━━━━━━━━━━━━━━━⬣
`
    
    return conn.reply(m.chat, achievementsMessage, m)
  }
  
  // Subcomando: personalidad
  if (subcommand === 'personalidad' || subcommand === 'personality') {
    if (!args[1]) {
      // Mostrar personalidad actual y disponibles
      const personalityInfo = personalities.find(p => p.id === mascot.personality)
      const personalitiesList = personalities.map(p => 
        `• ${p.name}: ${p.effect}${mascot.personality === p.id ? ' (Actual)' : ''}`
      )
      
      const personalityMessage = `
╭━━━━━━━━━⬣
┃ 😊 *PERSONALIDAD DE MASCOTA* 😊
┃≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
┃
┃ *${mascot.name || 'Tu mascota'}*
┃ *Personalidad actual:* ${personalityInfo.name}
┃ *Efecto:* ${personalityInfo.effect}
┃
┃ *Personalidades disponibles:*
┃ ${personalitiesList.join('\n┃ ')}
┃
┃ *Para cambiar:* ${usedPrefix}mascota personalidad [nombre]
┃ *Nota:* Cambiar personalidad tiene un costo en nivel
╰━━━━━━━━━━━━━━━━━━⬣
`
      
      return conn.reply(m.chat, personalityMessage, m)
    } else {
      // Cambiar personalidad
      const personalityName = args.slice(1).join(' ').toLowerCase()
      const personality = personalities.find(p => 
        p.name.toLowerCase() === personalityName || 
        p.id === personalityName
      )
      
      if (!personality) {
        return conn.reply(m.chat, `❌ *Personalidad no encontrada*\n\nPor favor verifica el nombre de la personalidad.`, m)
      }
      
      if (mascot.personality === personality.id) {
        return conn.reply(m.chat, `⚠️ *${mascot.name || 'Tu mascota'}* ya tiene la personalidad *${personality.name}*.`, m)
      }
      
      // Verificar nivel mínimo
      if (mascot.level < 10) {
        return conn.reply(m.chat, `⚠️ *Nivel insuficiente*\n\n${mascot.name || 'Tu mascota'} necesita ser al menos nivel 10 para cambiar de personalidad.\n\nNivel actual: ${mascot.level}`, m)
      }
      
      // Cambiar personalidad con costo
      const oldPersonality = personalities.find(p => p.id === mascot.personality)
      mascot.personality = personality.id
      
      // Costo: perder un nivel
      mascot.level = Math.max(1, mascot.level - 1)
      mascot.exp = 0
      
      return conn.reply(m.chat, `
🧠 *¡PERSONALIDAD CAMBIADA!*

*${mascot.name || 'Tu mascota'}* ha cambiado su personalidad:
*${oldPersonality.name}* → *${personality.name}*

*Nuevo efecto:* ${personality.effect}
*Costo:* -1 nivel (Nivel actual: ${mascot.level})
`, m)
    }
  }
  
  // Subcomando: interactuar
  if (subcommand === 'interactuar' || subcommand === 'interact') {
    // Interacciones posibles según tipo de mascota
    const interactions = {
      dog: ['ladrar alegremente', 'mover la cola', 'dar la pata', 'rodar por el suelo', 'perseguir su cola'],
      cat: ['maullar suavemente', 'ronronear', 'frotarse contra ti', 'estirarse perezosamente', 'acicalarse'],
      fox: ['hacer sonidos agudos', 'saltar juguetonamente', 'esconder algo', 'olfatear curioso', 'correr en círculos'],
      rabbit: ['mover las orejas', 'dar saltitos cortos', 'olfatear el aire', 'acicalarse', 'esconderse un momento'],
      parrot: ['imitar tu voz', 'cantar alegremente', 'mover sus alas', 'silbar una melodía', 'decir palabras'],
      dragon: ['lanzar pequeñas llamas', 'agitar sus alas', 'gruñir suavemente', 'volar brevemente', 'brillar intensamente'],
      hamster: ['correr en su rueda', 'guardar comida en sus mejillas', 'construir un nido', 'lavarse la carita', 'mordisquear algo'],
      panda: ['masticar bambú', 'rodar por el suelo', 'bostezar adorablemente', 'rascarse la espalda', 'abrazarse a sí mismo'],
      wolf: ['aullar a la luna', 'mostrar lealtad', 'olfatear el territorio', 'acechar sigilosamente', 'mostrar sus colmillos'],
      penguin: ['deslizarse sobre su panza', 'nadar elegantemente', 'arreglarse las plumas', 'caminar graciosamente', 'mover sus aletas']
    }
    
    const defaultInteractions = ['mirar fijamente', 'acercarse curioso', 'hacer sonidos adorables', 'mostrar afecto', 'jugar contigo']
    
    // Obtener interacciones específicas o usar las predeterminadas
    const mascotInteractions = interactions[mascot.type] || defaultInteractions
    
    // Seleccionar interacción aleatoria
    const selectedInteraction = mascotInteractions[Math.floor(Math.random() * mascotInteractions.length)]
    
    // Efectos de la interacción
    mascot.happiness = Math.min(100, mascot.happiness + 10)
    mascot.friendship += 1
    
    // Mensajes especiales según personalidad
    let personalityMessage = ''
    if (mascot.personality === 'playful') {
      personalityMessage = '\n\nPor su personalidad juguetona, ¡parece querer seguir interactuando!'
    } else if (mascot.personality === 'shy') {
      personalityMessage = '\n\nPor su personalidad tímida, se muestra un poco nervioso pero feliz con la atención.'
    } else if (mascot.personality === 'curious') {
      personalityMessage = '\n\nPor su personalidad curiosa, examina todo a su alrededor después de interactuar contigo.'
    }
    
    // Mensaje con emoji específico según tipo de mascota
    const typeEmojis = {
      dog: '🐶',
      cat: '🐱',
      fox: '🦊',
      rabbit: '🐰',
      parrot: '🦜',
      dragon: '🐉',
      hamster: '🐹',
      panda: '🐼',
      wolf: '🐺',
      penguin: '🐧'
    }
    
    const emoji = typeEmojis[mascot.type] || '🐾'
    
    return conn.reply(m.chat, `
${emoji} *¡INTERACCIÓN CON MASCOTA!* ${emoji}

*${mascot.name || 'Tu mascota'}* comienza a *${selectedInteraction}*.

Te mira con alegría y parece estar muy feliz de pasar tiempo contigo.${personalityMessage}

*Felicidad:* +10%
*Amistad:* +1
`, m)
  }
  
  // Si llegamos aquí, es un subcomando no reconocido
  return conn.reply(m.chat, `⚠️ *Comando de mascota no reconocido*\n\nUsa *${usedPrefix}mascota* para ver la lista de comandos disponibles.`, m)
}

// Funciones auxiliares
function updateMascotStatus(mascot) {
  const now = Date.now()
  const hoursSinceLastFed = (now - mascot.lastFed) / (1000 * 60 * 60)
  const hoursSinceLastPlayed = (now - mascot.lastPlayed) / (1000 * 60 * 60)
  
  // Aumentar hambre y sed con el tiempo (máximo 100%)
  mascot.hunger = Math.min(100, mascot.hunger + Math.floor(hoursSinceLastFed * 5))
  mascot.thirst = Math.min(100, mascot.thirst + Math.floor(hoursSinceLastFed * 7))
  
  // Disminuir felicidad si no se juega (mínimo 20%)
  mascot.happiness = Math.max(20, mascot.happiness - Math.floor(hoursSinceLastPlayed * 3))
  
  // Recuperar energía con el tiempo
  mascot.energy = Math.min(100, mascot.energy + Math.floor(hoursSinceLastPlayed * 10))
  
  // Reducir salud si hambre o sed son muy altos
  if (mascot.hunger > 80 || mascot.thirst > 80) {
    mascot.health = Math.max(20, mascot.health - 10)
  }
}

function checkLevelUp(conn, m, mascot) {
  const expNextLevel = mascot.level * 100
  if (mascot.exp >= expNextLevel) {
    mascot.level += 1
    mascot.exp -= expNextLevel
    
    // Recuperar estadísticas al subir de nivel
    mascot.health = 100
    mascot.energy = 100
    
    conn.reply(m.chat, `
🎉 *¡${mascot.name || 'Tu mascota'} SUBIÓ DE NIVEL!* 🎉

*Nivel:* ${mascot.level - 1} → ${mascot.level}
*Salud y Energía:* Restauradas al 100%

${mascot.name || 'Tu mascota'} se ve más fuerte y feliz.
`, m)
    
    return true
  }
  return false
}

function createProgressBar(current, max, length) {
  const percentage = current / max
  const filledLength = Math.round(length * percentage)
  const emptyLength = length - filledLength
  
  return '┃ [' + '█'.repeat(filledLength) + '░'.repeat(emptyLength) + '] ' + Math.round(percentage * 100) + '%'
}

function getTimeAgo(timestamp) {
  const now = Date.now()
  const seconds = Math.floor((now - timestamp) / 1000)
  
  if (seconds < 60) return 'hace unos segundos'
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} hora${hours !== 1 ? 's' : ''}`
  
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days !== 1 ? 's' : ''}`
}

function getStatusEmoji(value) {
  if (value >= 80) return '🟢'
  if (value >= 50) return '🟡'
  if (value >= 30) return '🟠'
  return '🔴'
}

function getMascotTypeEmoji(typeId) {
  const emojiMap = {
    dog: '🐶',
    cat: '🐱',
    fox: '🦊',
    rabbit: '🐰',
    parrot: '🦜',
    dragon: '🐉',
    hamster: '🐹',
    panda: '🐼',
    wolf: '🐺',
    penguin: '🐧'
  }
  
  return emojiMap[typeId] || '🐾'
}

function getMascotTypeName(typeId) {
  const nameMap = {
    dog: 'Perro',
    cat: 'Gato',
    fox: 'Zorro',
    rabbit: 'Conejo',
    parrot: 'Loro',
    dragon: 'Dragón',
    hamster: 'Hámster',
    panda: 'Panda',
    wolf: 'Lobo',
    penguin: 'Pingüino'
  }
  
  return nameMap[typeId] || 'Mascota'
}

function getColorEmoji(colorId) {
  const emojiMap = {
    normal: '⚪',
    golden: '🟡',
    cosmic: '🔮',
    shadow: '⚫',
    crystal: '💎',
    fire: '🔥',
    water: '💧',
    nature: '🍃'
  }
  
  return emojiMap[colorId] || '⚪'
}

function getColorName(colorId) {
  const nameMap = {
    normal: 'Normal',
    golden: 'Dorado',
    cosmic: 'Cósmico',
    shadow: 'Sombra',
    crystal: 'Cristal',
    fire: 'Fuego',
    water: 'Agua',
    nature: 'Naturaleza'
  }
  
  return nameMap[colorId] || 'Normal'
}

function getPersonalityName(personalityId) {
  const nameMap = {
    playful: 'Juguetón',
    brave: 'Valiente',
    shy: 'Tímido',
    smart: 'Inteligente',
    loyal: 'Leal',
    curious: 'Curioso',
    lazy: 'Perezoso',
    energetic: 'Enérgico'
  }
  
  return nameMap[personalityId] || 'Normal'
}

function getEvolutionStage(evolution) {
  switch (evolution) {
    case 0: return 'Inicial'
    case 1: return 'Intermedia'
    case 2: return 'Avanzada'
    case 3: return 'Final'
    default: return 'Desconocida'
  }
}

function getSkillName(skillId) {
  const nameMap = {
    fetch: 'Buscar',
    guard: 'Guardia',
    trick: 'Truco',
    heal: 'Curación',
    hunt: 'Cazar',
    search: 'Rastrear',
    swim: 'Nadar',
    dig: 'Excavar',
    fly: 'Volar',
    mimic: 'Imitar'
  }
  
  return nameMap[skillId] || skillId
}

function getAccessoryName(accessoryId) {
  const nameMap = {
    collar: 'Collar',
    hat: 'Sombrero',
    boots: 'Botas',
    backpack: 'Mochila',
    glasses: 'Gafas',
    armor: 'Armadura',
    scarf: 'Bufanda',
    gloves: 'Guantes'
  }
  
  return nameMap[accessoryId] || accessoryId
}

function getAccessoryEmoji(accessoryId) {
  const emojiMap = {
    collar: '🔷',
    hat: '🎩',
    boots: '👢',
    backpack: '🎒',
    glasses: '👓',
    armor: '🛡️',
    scarf: '🧣',
    gloves: '🧤'
  }
  
  return emojiMap[accessoryId] || '🎀'
}

handler.help = ['mascota', 'mascota <opción>']
handler.tags = ['juegos', 'entretenimiento', 'rpg']
handler.command = /^(mascota|pet|mascot)$/i

export default handler