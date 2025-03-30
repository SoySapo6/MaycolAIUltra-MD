let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        await conn.sendMessage(m.chat, { text: "❌ Por favor, ingresa el texto que deseas convertir a diferentes fuentes." });
        return;
    }

    // Función para convertir el texto a diferentes fuentes
    const convertTextToFonts = (str) => {
        // Fuentes personalizadas más simples
        const fonts = {
            bold: str.replace(/([a-zA-Z])/g, (match) => match.toUpperCase()), // Convertir a mayúsculas
            italic: str.split('').map(char => char === ' ' ? ' ' : `${char}`).join(''), // Mantenemos las letras como están
            bubble: str.replace(/([a-zA-Z])/g, (match) => `⚪${match}⚪`), // Burbuja con un símbolo
            script: str.split('').map(char => `${char}`).join(''), // Simplemente mostramos el texto tal cual
            bolditalic: str.replace(/([a-zA-Z])/g, (match) => `*${match}*`), // Bold + Italic con asterisco
            inverted: str.split('').reverse().join(''), // Invertir el texto
            underline: `__${str}__`, // Subrayado
        };

        return fonts;
    };

    // Convertimos el texto en diferentes fuentes
    const fonts = convertTextToFonts(text);

    // Preparamos la respuesta
    let responseText = "💃 *Texto Generado* 💃\n\n";
    responseText += `**Texto:** ${text}\n\n`;
    responseText += `**Texto con Fuente Estilo Negrita:** ${fonts.bold}\n`;
    responseText += `**Texto con Fuente Estilo Cursiva:** ${fonts.italic}\n`;
    responseText += `**Texto con Fuente Estilo Burbuja:** ${fonts.bubble}\n`;
    responseText += `**Texto con Fuente Estilo Script:** ${fonts.script}\n`;
    responseText += `**Texto con Fuente Estilo Negrita + Cursiva:** ${fonts.bolditalic}\n`;
    responseText += `**Texto Invertido:** ${fonts.inverted}\n`;
    responseText += `**Texto Subrayado:** ${fonts.underline}\n\n`;
    responseText += `**Desarrollador:** SoyMaycol <3\n`;
    responseText += `**Persona:** ${m.sender}\n`;

    // Enviamos el resultado
    await conn.sendMessage(m.chat, { text: responseText });
};

handler.help = ['font']
handler.tags = ['tools']
handler.command = ['font', 'fuentes']
handler.estrellas = 20
handler.register = true
handler.group = true

export default handler;