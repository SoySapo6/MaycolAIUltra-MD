const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fetch = require('node-fetch');

// Cargar variables de entorno
dotenv.config();

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Definir una clave secreta para la API (debe coincidir con la del plugin)
const API_SECRET = 'maycol-bot-secret'; // Cambiar a una clave segura en producción

// Almacenamiento de credenciales
const credentialsStore = new Map();
// Almacenamiento de datos de usuario
const userDataStore = new Map();
// Almacenamiento para comandos usados
const commandUsageStore = new Map();
// Almacenamiento para subbots vinculados
const linkedSubBotsStore = new Map();
// Historial de chat con IA
const aiChatHistoryStore = new Map();

// Configuración de Express
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(session({
  secret: 'maycol-dashboard-session',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/**
 * Generar credenciales para un número de teléfono específico
 */
function generateCredentials(phoneNumber) {
  const username = phoneNumber;
  const password = crypto.randomBytes(4).toString('hex');
  const token = crypto.createHash('sha256').update(`${phoneNumber}:${password}:${Date.now()}`).digest('hex');
  
  // Almacenar las credenciales
  credentialsStore.set(username, { password, token, createdAt: Date.now() });
  
  // Generar datos de usuario simulados (esto debe reemplazarse con datos reales)
  createUserData(phoneNumber);
  
  return { username, password, token };
}

/**
 * Obtener datos reales de un usuario del sistema del bot
 * Este método solicita la información desde el bot principal
 */
async function fetchUserDataFromBot(phoneNumber) {
  try {
    // Intentamos leer los datos del usuario desde los archivos de bot
    // Estos paths deberían ajustarse según la estructura de tu bot
    const botDataPath = './Goku-Black-Bot-MD/data/database.json';
    
    // Si el archivo existe, leemos los datos
    if (fs.existsSync(botDataPath)) {
      const data = JSON.parse(fs.readFileSync(botDataPath, 'utf8'));
      
      // Verificamos si existen datos del usuario
      if (data.users && data.users[`${phoneNumber}@s.whatsapp.net`]) {
        const userData = data.users[`${phoneNumber}@s.whatsapp.net`];
        return userData;
      }
    }
    
    // Si no encontramos datos, retornamos null
    return null;
  } catch (error) {
    console.error(`Error obteniendo datos para ${phoneNumber}:`, error);
    return null;
  }
}

/**
 * Crear datos para un usuario basados en información real
 */
async function createUserData(phoneNumber) {
  // Intentar obtener datos reales del usuario primero
  const realUserData = await fetchUserDataFromBot(phoneNumber);
  
  // Crear objeto de datos de usuario
  const userData = {
    name: realUserData?.name || `Usuario ${phoneNumber.substring(phoneNumber.length - 4)}`,
    role: realUserData?.role || 'Usuario',
    level: realUserData?.level || 1,
    exp: realUserData?.exp || 0,
    coins: realUserData?.money || realUserData?.coin || 0,
    limit: realUserData?.limit || 10,
    premium: realUserData?.premium || false,
    avatarUrl: 'https://i.imgur.com/S1E8OYR.png',
    lastActive: realUserData?.lastChat || new Date().toISOString(),
    registeredAt: realUserData?.registered ? new Date(realUserData.registered).toISOString() : new Date().toISOString(),
    banned: realUserData?.banned || false,
    activities: []
  };
  
  // Generar actividades basadas en datos reales si es posible
  userData.activities = [
    { 
      type: 'level-up', 
      title: `Alcanzaste el nivel ${userData.level}`, 
      time: 'Recientemente', 
      icon: 'level-up-alt' 
    }
  ];
  
  // Verificar si el usuario tiene un subbot conectado
  checkUserSubBot(phoneNumber);
  
  // Almacenar los datos en el mapa
  userDataStore.set(phoneNumber, userData);
  
  // Si no hay datos de comandos usados, inicializar
  if (!commandUsageStore.has(phoneNumber)) {
    initializeCommandUsage(phoneNumber);
  }
  
  return userData;
}

/**
 * Inicializar el seguimiento de uso de comandos para un usuario
 */
function initializeCommandUsage(phoneNumber) {
  commandUsageStore.set(phoneNumber, {
    total: 0,
    commands: {
      'menu': 0,
      'sticker': 0,
      'play': 0,
      'fb': 0,
      'serbot': 0
    },
    lastUsed: new Date().toISOString()
  });
}

/**
 * Verificar si el usuario tiene un subbot conectado
 */
function checkUserSubBot(phoneNumber) {
  try {
    // Ruta donde se almacenan los datos de subbot
    const subbotPath = `./Goku-Black-Bot-MD/BlackJadiBot/${phoneNumber}`;
    
    // Verificar si existe la carpeta del subbot
    if (fs.existsSync(subbotPath)) {
      linkedSubBotsStore.set(phoneNumber, {
        isConnected: fs.existsSync(`${subbotPath}/creds.json`),
        connectedAt: fs.statSync(subbotPath).mtime,
        deviceName: 'WhatsApp Web'
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error verificando subbot para ${phoneNumber}:`, error);
    return false;
  }
}

/**
 * Obtener datos de un usuario específico
 */
async function getUserData(phoneNumber) {
  if (!userDataStore.has(phoneNumber)) {
    return await createUserData(phoneNumber);
  }
  return userDataStore.get(phoneNumber);
}

/**
 * Middleware para requerir autenticación
 */
function requireAuth(req, res, next) {
  if (req.session.authenticated && req.session.username) {
    return next();
  }
  res.redirect('/login');
}

// Rutas

// Ruta principal - Redirige al login o al dashboard
app.get('/', (req, res) => {
  if (req.session.authenticated) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// Página de login
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Procesamiento de login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Verificar credenciales
  if (credentialsStore.has(username)) {
    const storedCreds = credentialsStore.get(username);
    
    // Verificar contraseña y vigencia de credenciales (24 horas)
    if (storedCreds.password === password && Date.now() - storedCreds.createdAt < 24 * 60 * 60 * 1000) {
      // Autenticar al usuario
      req.session.authenticated = true;
      req.session.username = username;
      req.session.token = storedCreds.token;
      
      // Redirigir al dashboard
      return res.redirect('/dashboard');
    }
  }
  
  // Credenciales inválidas
  res.render('login', { error: 'Credenciales inválidas o expiradas' });
});

// Dashboard principal
app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userData = await getUserData(req.session.username);
    res.render('dashboard', { 
      username: req.session.username,
      userData,
      activePage: 'dashboard'
    });
  } catch (error) {
    console.error('Error cargando dashboard:', error);
    res.status(500).send('Error al cargar el dashboard');
  }
});

// Perfil del usuario
app.get('/profile', requireAuth, async (req, res) => {
  try {
    const userData = await getUserData(req.session.username);
    res.render('dashboard', { 
      username: req.session.username,
      userData,
      activePage: 'profile'
    });
  } catch (error) {
    console.error('Error cargando perfil:', error);
    res.status(500).send('Error al cargar el perfil');
  }
});

// Estadísticas
app.get('/stats', requireAuth, async (req, res) => {
  try {
    const userData = await getUserData(req.session.username);
    res.render('dashboard', { 
      username: req.session.username,
      userData,
      activePage: 'stats'
    });
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    res.status(500).send('Error al cargar las estadísticas');
  }
});

// Comandos disponibles
app.get('/commands', requireAuth, async (req, res) => {
  try {
    const userData = await getUserData(req.session.username);
    res.render('dashboard', { 
      username: req.session.username,
      userData,
      activePage: 'commands'
    });
  } catch (error) {
    console.error('Error cargando comandos:', error);
    res.status(500).send('Error al cargar los comandos');
  }
});

// Nueva ruta para mostrar y gestionar subbots
app.get('/subbots', requireAuth, async (req, res) => {
  try {
    const userData = await getUserData(req.session.username);
    const subbotInfo = linkedSubBotsStore.get(req.session.username) || {
      isConnected: false,
      connectedAt: null,
      deviceName: null
    };
    
    res.render('dashboard', { 
      username: req.session.username,
      userData,
      activePage: 'subbots',
      subbotInfo
    });
  } catch (error) {
    console.error('Error cargando página de subbots:', error);
    res.status(500).send('Error al cargar la información de subbots');
  }
});

// Ruta para los comandos más usados
app.get('/command-stats', requireAuth, async (req, res) => {
  try {
    const userData = await getUserData(req.session.username);
    const commandStats = commandUsageStore.get(req.session.username) || {
      total: 0,
      commands: {},
      lastUsed: new Date().toISOString()
    };
    
    res.render('dashboard', { 
      username: req.session.username,
      userData,
      activePage: 'command-stats',
      commandStats
    });
  } catch (error) {
    console.error('Error cargando estadísticas de comandos:', error);
    res.status(500).send('Error al cargar las estadísticas de comandos');
  }
});

// Nueva ruta para chatear con Gemini AI
app.get('/ai-chat', requireAuth, async (req, res) => {
  try {
    const userData = await getUserData(req.session.username);
    
    // Recuperar historial de chat o inicializar uno nuevo
    if (!aiChatHistoryStore.has(req.session.username)) {
      aiChatHistoryStore.set(req.session.username, []);
    }
    
    const chatHistory = aiChatHistoryStore.get(req.session.username);
    
    res.render('dashboard', { 
      username: req.session.username,
      userData,
      activePage: 'ai-chat',
      chatHistory
    });
  } catch (error) {
    console.error('Error cargando chat con Gemini AI:', error);
    res.status(500).send('Error al cargar el chat con IA');
  }
});

// API para enviar mensajes a Gemini AI
app.post('/api/ai-chat', requireAuth, async (req, res) => {
  const { message } = req.body;
  const phoneNumber = req.session.username;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío' });
  }
  
  try {
    // Recuperar historial de chat o inicializar uno nuevo
    if (!aiChatHistoryStore.has(phoneNumber)) {
      aiChatHistoryStore.set(phoneNumber, []);
    }
    
    const chatHistory = aiChatHistoryStore.get(phoneNumber);
    
    // Añadir mensaje del usuario al historial
    chatHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    
    // Simulamos una respuesta de la IA
    // En producción, aquí es donde conectaríamos con Gemini API
    const aiResponse = await simulateAIResponse(message, chatHistory);
    
    // Añadir respuesta de la IA al historial
    chatHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });
    
    // Limitar el historial a las últimas 20 mensajes para no sobrecargar la memoria
    if (chatHistory.length > 20) {
      const reducedHistory = chatHistory.slice(chatHistory.length - 20);
      aiChatHistoryStore.set(phoneNumber, reducedHistory);
    }
    
    res.json({ 
      success: true, 
      message: 'Mensaje enviado y procesado', 
      response: aiResponse, 
      timestamp: new Date().toISOString() 
    });
    
  } catch (error) {
    console.error('Error procesando mensaje de IA:', error);
    res.status(500).json({ success: false, message: 'Error procesando tu mensaje' });
  }
});

// Función para simular una respuesta de IA (reemplazar con Gemini API en producción)
async function simulateAIResponse(message, chatHistory) {
  // Esta es una simulación simple. En producción, llamaríamos a la API de Gemini
  const responses = [
    "Entiendo tu pregunta, déjame pensar...",
    "Esa es una buena pregunta. Basado en mi conocimiento...",
    "Interesante planteamiento. Consideremos lo siguiente...",
    "Según lo que sé, la respuesta es...",
    "Me encantaría ayudarte con eso. Mi respuesta es..."
  ];
  
  // Simular un tiempo de procesamiento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Analizar el mensaje para responder algo mínimamente contextual
  if (message.toLowerCase().includes('hola') || message.toLowerCase().includes('hi') || message.toLowerCase().includes('hello')) {
    return "¡Hola! ¿En qué puedo ayudarte hoy?";
  } else if (message.toLowerCase().includes('ayuda') || message.toLowerCase().includes('help')) {
    return "Estoy aquí para ayudarte. Puedes preguntarme sobre funciones del bot, comandos o cualquier duda que tengas.";
  } else if (message.toLowerCase().includes('gracias') || message.toLowerCase().includes('thanks')) {
    return "¡De nada! Estoy para servirte. ¿Hay algo más en lo que pueda ayudarte?";
  } else if (message.toLowerCase().includes('bot') || message.toLowerCase().includes('maycolaiultra')) {
    return "MaycolAIUltra-MD es un bot de WhatsApp con múltiples funciones como stickers, descargas, juegos y mucho más. ¿Quieres saber sobre alguna función específica?";
  } else {
    // Respuesta genérica aleatoria
    return responses[Math.floor(Math.random() * responses.length)] + " " + message.substring(0, 15) + "...";
  }
}

// API para registrar el uso de comandos
app.post('/api/register-command', (req, res) => {
  const { phoneNumber, command, secret } = req.body;
  
  // Verificar clave secreta
  if (secret !== API_SECRET) {
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  }
  
  try {
    // Inicializar datos si no existen
    if (!commandUsageStore.has(phoneNumber)) {
      initializeCommandUsage(phoneNumber);
    }
    
    const commandUsage = commandUsageStore.get(phoneNumber);
    
    // Incrementar contador total
    commandUsage.total += 1;
    
    // Incrementar contador del comando específico o añadir uno nuevo
    if (commandUsage.commands[command]) {
      commandUsage.commands[command] += 1;
    } else {
      commandUsage.commands[command] = 1;
    }
    
    // Actualizar fecha del último uso
    commandUsage.lastUsed = new Date().toISOString();
    
    // Guardar datos actualizados
    commandUsageStore.set(phoneNumber, commandUsage);
    
    res.json({ success: true, message: 'Comando registrado correctamente' });
    
  } catch (error) {
    console.error('Error registrando comando:', error);
    res.status(500).json({ success: false, message: 'Error registrando el uso del comando' });
  }
});

// API para registrar un subbot vinculado
app.post('/api/register-subbot', (req, res) => {
  const { phoneNumber, deviceInfo, secret } = req.body;
  
  // Verificar clave secreta
  if (secret !== API_SECRET) {
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  }
  
  try {
    linkedSubBotsStore.set(phoneNumber, {
      isConnected: true,
      connectedAt: new Date().toISOString(),
      deviceName: deviceInfo?.deviceName || 'WhatsApp Web'
    });
    
    res.json({ success: true, message: 'Subbot registrado correctamente' });
    
  } catch (error) {
    console.error('Error registrando subbot:', error);
    res.status(500).json({ success: false, message: 'Error registrando el subbot' });
  }
});

// Cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Ruta de prueba para verificar que el servidor esté funcionando
app.get('/api/check-server', (req, res) => {
  res.json({ success: true, message: 'El servidor está funcionando correctamente', timestamp: new Date().toISOString() });
});

// API para generar credenciales
app.post('/api/generate-credentials', (req, res) => {
  const { phoneNumber, secret } = req.body;
  
  // Verificar clave secreta
  if (secret !== API_SECRET) {
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  }
  
  try {
    const credentials = generateCredentials(phoneNumber);
    res.json({ success: true, credentials });
  } catch (error) {
    console.error('Error al generar credenciales:', error);
    res.status(500).json({ success: false, message: 'Error al generar credenciales' });
  }
});

// Iniciar el servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Servidor del dashboard web iniciado en el puerto ${PORT}`);
  console.log(`📊 Accede al dashboard en https://b0bf2dfb-c00c-474a-8bf7-bf54eeaa25f4-00-3d2kqsun32v2h.kirk.repl.co/login`);
});