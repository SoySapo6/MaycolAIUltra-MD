import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
if (!text) return conn.reply(m.chat, ` Ingresa un link de soundcloud`, m)
    
if (!text.includes('soundcloud.com') && !text.includes('m.soundcloud.com')) return conn.reply(m.chat, `Ingresa un link de soundcloud`, m)

    
try {
let api = await fetch(`https://api.siputzx.my.id/api/d/soundcloud?url=${text}`)
let json = await api.json()
let { title, thumbnail, url } = json.data

let aud = { audio: { url: url }, mimetype: 'audio/mp4', fileName: `${title}.mp3`, contextInfo: { externalAdReply: { showAdAttribution: true, mediaType: 2, mediaUrl: url, title: title, sourceUrl: null, thumbnail: await (await conn.getFile(thumbnail)).data }}}

await conn.sendMessage(m.chat, aud, { quoted: m })

} catch (error) {
console.error(error)
}}

handler.command = ['sounddl', 'soundclouddl']
export default handler