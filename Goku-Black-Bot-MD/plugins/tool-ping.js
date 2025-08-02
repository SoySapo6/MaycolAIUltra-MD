let handler = async (m, { conn }) => {
  const old = m.messageTimestamp ? m.messageTimestamp.low : performance.now()
  const now = performance.now()
  const latency = (now - old).toFixed(4)
  m.reply(`Pong! Latency: ${latency}ms`)
}
handler.help = ['ping']
handler.tags = ['tools']
handler.command = /^(ping)$/i
export default handler;
