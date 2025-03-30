# Guía de Configuración para Goku Black Bot MD

Este documento te guía para personalizar el bot antes de iniciarlo.

## Cambios Principales

Edita el archivo `Goku-Black-Bot-MD/config.js` para personalizar estos valores importantes:

### 1. Configura tu número

```javascript
// Líneas 13-18
global.owner = [
  ['TUNUMERO', 'TU NOMBRE', true], // Reemplaza con tu número completo con código país
  // Puedes eliminar los otros números o dejarlos si quieres moderadores adicionales
];

// Línea 22 (moderadores)
global.mods = ['TUNUMERO']
```

### 2. Personaliza el bot

```javascript
// Líneas 28-30 (marcas de agua para stickers)
global.packsticker = 'TU NOMBRE'
global.packname = 'TU NOMBRE'
global.author = 'TU NOMBRE'

// Línea 35 (nombre del bot)
global.botname = 'TU NOMBRE BOT'
```

### 3. Redes Sociales (opcional)

```javascript
// Líneas 100-107 (enlaces)
global.gp1 = 'https://chat.whatsapp.com/TUENLACE' // Grupo
global.yt = 'https://youtube.com/@TUCANAL' // Canal
global.correo = 'tuemail@gmail.com' // Correo
```

## Configuración Avanzada

Si necesitas configuración adicional, revisa estas secciones:

### API Keys (opcional)

Si quieres usar funciones que requieren APIs:

```javascript
// Líneas 152-195
// Aquí puedes agregar tus propias API keys si tienes
global.openai_key = 'tu-api-key'
```

### Estilos y Personalización Visual

```javascript
// Líneas 44-72
// Imágenes personalizadas (menús, logos, etc.)
// Solo modifica si quieres cambiar las imágenes predeterminadas
```

## Notas Importantes

1. **Formato de Número:** Usa el formato internacional sin '+' ni espacios (ej: 521234567890)
2. **No modifiques:** Variables como `global.fs`, `global.cheerio`, etc.
3. **Reinicio:** Luego de editar, reinicia el bot con `node start.js`

---
Si tienes problemas, consulta el README.md o los canales oficiales.