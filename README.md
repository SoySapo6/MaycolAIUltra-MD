# Goku Black Bot MD - WhatsApp Bot

Este proyecto configura y ejecuta Goku Black Bot MD, un bot avanzado para WhatsApp.

## Características

- Comandos multimedia
- Stickers, descargas de videos, música
- Juegos y funciones interactivas
- Administración de grupos
- Y mucho más

## Requisitos

- Node.js (instalado en este entorno Replit)
- Conexión a Internet
- Número de WhatsApp para el bot

## Instalación

El proyecto incluye scripts para facilitar la instalación:

1. **Configuración inicial:**
   ```
   node setup.js
   ```
   Este comando clona el repositorio y configura todo.

2. **Iniciar el bot:**
   ```
   node start.js
   ```
   O usa el script facilitado:
   ```
   ./run-bot.sh
   ```

## Configuración

Edita el archivo `Goku-Black-Bot-MD/config.js` antes de iniciar:

```javascript
// Configura tu número como propietario del bot
global.owner = ['TUNUMERO'] // Ejemplo: ['123456789012']

// Configura nombre del bot y mensajes
global.namebot = 'Goku Black Bot MD'
global.packname = 'Goku-Black-Bot'
global.author = 'WhatsApp Bot'
```

## Primer inicio

Al iniciar el bot por primera vez:

1. Se generará un código QR en la consola
2. Escanea el código con WhatsApp (WhatsApp → Dispositivos vinculados → Vincular un dispositivo)
3. El bot se conectará a tu WhatsApp

## Comandos principales

- `.menu` - Muestra el menú de comandos disponibles
- `.help` - Muestra información de ayuda
- `.info` - Información del bot
- `.owner` - Información del propietario

## Solución de problemas

- **El código QR no aparece:** Asegúrate de haber ejecutado correctamente `node setup.js`
- **El bot se desconecta:** Verifica tu conexión a internet
- **Comandos no funcionan:** Asegúrate de haber configurado correctamente el config.js

## Repositorio original

Este proyecto configura [Goku-Black-Bot-MD](https://github.com/Eliasivan/Goku-Black-Bot-MD).