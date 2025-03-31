const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const axios = require('axios');

// Cargar variables de entorno
dotenv.config();

// Configuración del servidor
const app = express();
const PORT = 5000; // Puerto principal
const REPLIT_URL = process.env.REPLIT_URL || `https://workspace-tasef31147.workspace.repl.co`;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Configurar sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'maycolaiultra-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Almacenamiento en memoria
const userStore = {};
const aiModels = {
  'zeta-ai': {
    name: 'Zeta AI',
    endpoint: 'https://api.kyuurzy.site/api/ai/aizeta',
    description: 'Un modelo de IA avanzado con capacidades de razonamiento excepcionales.'
  }
};
const commandUsageStore = {
  total: 0,
  lastUsed: Date.now(),
  commands: {}
};
const linkedSubBotsStore = {};
const redemptionCodesStore = [];

// Base de datos simulada de cuentas
const accounts = [
  // Cuenta de propietario
  {
    username: '51921826291',
    passwordHash: crypto.createHash('sha256').update('MaycolAIUltra2025').digest('hex'),
    token: 'admin-token-maycol-default',
    isOwner: true,
    createdAt: Date.now(),
    createdBy: 'system'
  }
];

// Middleware de autenticación
const requireAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  res.redirect('/login');
};

// Generar datos de usuario
const createUserData = (phoneNumber) => {
  if (userStore[phoneNumber]) {
    return userStore[phoneNumber];
  }

  // Crear datos de usuario simulados para pruebas
  const userData = {
    name: `Usuario ${phoneNumber.substring(0, 6)}`,
    level: Math.floor(Math.random() * 10) + 1,
    exp: Math.floor(Math.random() * 10000),
    coins: Math.floor(Math.random() * 5000),
    limit: Math.floor(Math.random() * 100),
    role: "Usuario",
    activities: []
  };

  userStore[phoneNumber] = userData;
  return userData;
};

// Rutas del servidor
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { error: req.query.error || null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validar las credenciales
  const account = accounts.find(acc => 
    acc.username === username && 
    acc.passwordHash === crypto.createHash('sha256').update(password).digest('hex')
  );

  if (account) {
    req.session.isAuthenticated = true;
    req.session.username = username;
    req.session.isOwner = account.isOwner || false;
    return res.redirect('/dashboard');
  }

  res.redirect('/login?error=Credenciales incorrectas');
});

app.get('/dashboard', requireAuth, (req, res) => {
  const userData = createUserData(req.session.username);
  res.render('dashboard', { 
    username: req.session.username,
    userData
  });
});

app.get('/profile', requireAuth, (req, res) => {
  const userData = createUserData(req.session.username);
  res.render('dashboard', { 
    activePage: 'profile',
    username: req.session.username,
    userData
  });
});

app.get('/stats', requireAuth, (req, res) => {
  const userData = createUserData(req.session.username);
  res.render('dashboard', { 
    activePage: 'stats',
    username: req.session.username,
    userData
  });
});

app.get('/command-stats', requireAuth, (req, res) => {
  const userData = createUserData(req.session.username);
  res.render('dashboard', { 
    activePage: 'command-stats',
    username: req.session.username,
    userData,
    commandStats: commandUsageStore
  });
});

app.get('/subbots', requireAuth, (req, res) => {
  const userData = createUserData(req.session.username);
  const subbotInfo = linkedSubBotsStore[req.session.username] || { 
    isConnected: false,
    connectedAt: null,
    deviceName: null
  };
  
  res.render('dashboard', { 
    activePage: 'subbots',
    username: req.session.username,
    userData,
    subbotInfo
  });
});

app.get('/ai-chat', requireAuth, (req, res) => {
  const userData = createUserData(req.session.username);
  const chatHistory = [];
  
  res.render('dashboard', { 
    activePage: 'ai-chat',
    username: req.session.username,
    userData,
    chatHistory,
    aiModels: Object.values(aiModels)
  });
});

app.get('/commands', requireAuth, (req, res) => {
  const userData = createUserData(req.session.username);
  res.render('dashboard', { 
    activePage: 'commands',
    username: req.session.username,
    userData
  });
});

app.get('/redeem', requireAuth, (req, res) => {
  const userData = createUserData(req.session.username);
  res.render('dashboard', { 
    activePage: 'redeem',
    username: req.session.username,
    userData,
    redemptionMessage: req.query.message || null,
    redemptionStatus: req.query.status || null
  });
});

app.get('/roulette', requireAuth, (req, res) => {
  const userData = createUserData(req.session.username);
  res.render('dashboard', { 
    activePage: 'roulette',
    username: req.session.username,
    userData,
    rouletteMessage: req.query.message || null,
    rouletteStatus: req.query.status || null
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// API Endpoints
app.post('/api/register-command', (req, res) => {
  const { command, user } = req.body;
  
  if (!command) {
    return res.status(400).json({ success: false, message: 'Comando no especificado' });
  }
  
  // Incrementar contadores
  commandUsageStore.total += 1;
  commandUsageStore.lastUsed = Date.now();
  
  if (!commandUsageStore.commands[command]) {
    commandUsageStore.commands[command] = 0;
  }
  
  commandUsageStore.commands[command] += 1;
  
  return res.json({ success: true, message: 'Comando registrado' });
});

app.post('/api/register-subbot', (req, res) => {
  const { phoneNumber, deviceName } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Número de teléfono no especificado' });
  }
  
  // Registrar sub-bot
  linkedSubBotsStore[phoneNumber] = {
    isConnected: true,
    connectedAt: Date.now(),
    deviceName: deviceName || 'Dispositivo desconocido'
  };
  
  return res.json({ success: true, message: 'Sub-bot registrado' });
});

app.post('/api/unregister-subbot', (req, res) => {
  const { phoneNumber } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Número de teléfono no especificado' });
  }
  
  // Desregistrar sub-bot
  if (linkedSubBotsStore[phoneNumber]) {
    linkedSubBotsStore[phoneNumber].isConnected = false;
  }
  
  return res.json({ success: true, message: 'Sub-bot desregistrado' });
});

app.post('/api/register-ai', (req, res) => {
  const { type, endpoint } = req.body;
  
  if (!type || !endpoint) {
    return res.status(400).json({ success: false, message: 'Tipo o endpoint no especificado' });
  }
  
  // Registrar modelo de IA
  if (!aiModels[type]) {
    aiModels[type] = {
      name: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
      endpoint,
      description: 'Modelo de IA personalizado'
    };
  } else {
    aiModels[type].endpoint = endpoint;
  }
  
  return res.json({ success: true, message: 'Modelo de IA registrado' });
});

app.post('/api/chat-ai', async (req, res) => {
  const { message, model } = req.body;
  
  if (!message || !model) {
    return res.status(400).json({ success: false, message: 'Mensaje o modelo no especificado' });
  }
  
  if (!aiModels[model]) {
    return res.status(400).json({ success: false, message: 'Modelo de IA no disponible' });
  }
  
  try {
    const aiModel = aiModels[model];
    
    // Llamar al API de IA
    const response = await axios.get(`${aiModel.endpoint}?query=${encodeURIComponent(message)}`);
    const data = response.data;
    
    if (data.result && data.result.answer) {
      return res.json({ success: true, response: data.result.answer });
    } else if (data.gpt) {
      return res.json({ success: true, response: data.gpt });
    } else if (data.data) {
      return res.json({ success: true, response: data.data });
    }
    
    return res.status(500).json({ success: false, message: 'Respuesta de IA inválida' });
  } catch (error) {
    console.error('Error al procesar mensaje de IA:', error);
    return res.status(500).json({ success: false, message: `Error: ${error.message}` });
  }
});

app.post('/api/redeem-code', (req, res) => {
  const { code, username } = req.body;
  
  if (!code || !username) {
    return res.status(400).json({ success: false, message: 'Código o usuario no especificado' });
  }
  
  // Buscar código
  const codeIndex = redemptionCodesStore.findIndex(c => 
    c.code === code && !c.redeemed && (c.expiresAt === 0 || c.expiresAt > Date.now())
  );
  
  if (codeIndex === -1) {
    return res.status(400).json({ success: false, message: 'Código inválido o ya utilizado' });
  }
  
  // Marcar código como canjeado
  const codeData = redemptionCodesStore[codeIndex];
  redemptionCodesStore[codeIndex].redeemed = true;
  redemptionCodesStore[codeIndex].redeemedBy = username;
  redemptionCodesStore[codeIndex].redeemedAt = Date.now();
  
  // Aplicar recompensas
  const userData = createUserData(username);
  
  if (codeData.rewards.coins) {
    userData.coins += codeData.rewards.coins;
  }
  
  if (codeData.rewards.exp) {
    userData.exp += codeData.rewards.exp;
  }
  
  if (codeData.rewards.limit) {
    userData.limit += codeData.rewards.limit;
  }
  
  return res.json({ 
    success: true, 
    message: 'Código canjeado con éxito',
    rewards: codeData.rewards
  });
});

app.post('/api/register-code', (req, res) => {
  const { code, rewards, expiresAt, createdBy } = req.body;
  
  if (!code || !rewards) {
    return res.status(400).json({ success: false, message: 'Código o recompensas no especificados' });
  }
  
  // Verificar si el código ya existe
  if (redemptionCodesStore.some(c => c.code === code)) {
    return res.status(400).json({ success: false, message: 'El código ya existe' });
  }
  
  // Registrar código
  redemptionCodesStore.push({
    code,
    rewards,
    expiresAt: expiresAt || 0,
    createdBy,
    createdAt: Date.now(),
    redeemed: false,
    redeemedBy: null,
    redeemedAt: null
  });
  
  return res.json({ success: true, message: 'Código registrado con éxito' });
});

app.post('/api/register-account', (req, res) => {
  const { username, password, token, isOwner, registeredBy } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Usuario o contraseña no especificados' });
  }
  
  // Verificar si la cuenta ya existe
  if (accounts.some(acc => acc.username === username)) {
    return res.status(400).json({ success: false, message: 'La cuenta ya existe' });
  }
  
  // Registrar cuenta
  accounts.push({
    username,
    passwordHash: password,
    token,
    isOwner: isOwner || false,
    createdAt: Date.now(),
    createdBy: registeredBy || 'system'
  });
  
  return res.json({ success: true, message: 'Cuenta registrada con éxito' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Servidor del dashboard web iniciado en el puerto ${PORT}`);
  console.log(`📊 Accede al dashboard en ${REPLIT_URL}/login`);
});

module.exports = app;