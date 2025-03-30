const handler = async (m, {conn}) => {
  m.reply(global.verreg);
};
handler.command = ['verreg']
export default handler;

global.verreg = `*Mira aquí tu reg 👇*
https://whatsapp.com/channel/0029VasrQq2Gk1G1THOKwS2L
No olvides de seguir el canal 💞`;