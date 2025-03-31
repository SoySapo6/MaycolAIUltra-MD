const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// Definir una clave secreta para la API (debe coincidir con la del plugin)
const API_SECRET = 'maycol-bot-secret'; // Cambiar a una clave segura en producción

// Almacenamiento de credenciales
const credentialsStore = new Map();
// Almacenamiento de datos de usuario
const userDataStore = new Map();

// Configuración de Express
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
 * Crear datos simulados para un usuario
 */
function createUserData(phoneNumber) {
  // Estos datos deberían obtenerse de la base de datos del bot
  const userData = {
    name: `Usuario ${phoneNumber.substring(phoneNumber.length - 4)}`,
    role: 'Usuario',
    level: Math.floor(Math.random() * 50) + 1,
    exp: Math.floor(Math.random() * 10000),
    coins: Math.floor(Math.random() * 5000),
    limit: Math.floor(Math.random() * 100),
    avatarUrl: 'https://i.imgur.com/S1E8OYR.png',
    activities: [
      { type: 'level-up', title: 'Subiste de nivel', time: 'Hace 2 días', icon: 'level-up-alt' },
      { type: 'coins', title: 'Recibiste 100 monedas', time: 'Hace 3 días', icon: 'coins' },
      { type: 'game', title: 'Jugaste una partida RPG', time: 'Hace 4 días', icon: 'gamepad' },
      { type: 'register', title: 'Te registraste en el bot', time: 'Hace 1 semana', icon: 'user-plus' }
    ]
  };
  
  userDataStore.set(phoneNumber, userData);
  return userData;
}

/**
 * Obtener datos de un usuario específico
 */
function getUserData(phoneNumber) {
  if (!userDataStore.has(phoneNumber)) {
    return createUserData(phoneNumber);
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
app.get('/dashboard', requireAuth, (req, res) => {
  const userData = getUserData(req.session.username);
  res.render('dashboard', { 
    username: req.session.username,
    userData
  });
});

// Perfil del usuario
app.get('/profile', requireAuth, (req, res) => {
  const userData = getUserData(req.session.username);
  // Esta vista debe crearse
  res.render('dashboard', { 
    username: req.session.username,
    userData
  });
});

// Estadísticas
app.get('/stats', requireAuth, (req, res) => {
  const userData = getUserData(req.session.username);
  // Esta vista debe crearse
  res.render('dashboard', { 
    username: req.session.username,
    userData
  });
});

// Comandos disponibles
app.get('/commands', requireAuth, (req, res) => {
  const userData = getUserData(req.session.username);
  // Esta vista debe crearse
  res.render('dashboard', { 
    username: req.session.username,
    userData
  });
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Servidor del dashboard web iniciado en http://0.0.0.0:${PORT}`);
  console.log(`📊 Accede al dashboard en http://0.0.0.0:${PORT}/login`);
});