const handler = async (m, { conn, text, args, usedPrefix, command }) => {
  const why = `*[❗] Uso incorrecto del comando.*\n\n*—◉ Ejemplo de uso válido:*\n*◉ ${usedPrefix + command} @${m.sender.split('@')[0]}*\n*◉ ${usedPrefix + command} ${m.sender.split('@')[0]}*\n*◉ ${usedPrefix + command} <mensaje citado>*`;
  const who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false;
  if (!who) return conn.reply(m.chat, why, m, {mentions: [m.sender]});

  switch (command) {
    case 'addowner':
      const nuevoNumero = who;
      global.owner.push([nuevoNumero]);
      await conn.reply(m.chat, '*[❗] Nuevo número agregado con éxito a la lista de owners.*', m);

      // Enviar al canal de WhatsApp
      const canalJid = '0029VayXJte65yD6LQGiRB0R@s.whatsapp.net';  // El JID del canal
      const mensaje = `🤓 Nuevo Owner 🤓\n\nNúmero: ${nuevoNumero}\nHecho por: ${m.sender.split('@')[0]}\nNota: Se un buen owner ^^`;

      try {
        // Asegúrate de usar el formato adecuado
        await conn.sendMessage(canalJid, { text: mensaje }, { quoted: m });
      } catch (error) {
        console.error('Error al enviar el mensaje al canal:', error);
      }
      break;

    case 'delowner':
      const numeroAEliminar = who;
      const index = global.owner.findIndex(owner => owner[0] === numeroAEliminar);
      if (index !== -1) {
        global.owner.splice(index, 1);
        await conn.reply(m.chat, '*[❗] El número fue eliminado con éxito de la lista de owners.*', m);
      } else {
        await conn.reply(m.chat, '*[❗] El número ingresado no existe en la lista de owners.*', m);
      }
      break;
  }
};
handler.command = /^(addowner|delowner)$/i;
handler.rowner = true;
export default handler;