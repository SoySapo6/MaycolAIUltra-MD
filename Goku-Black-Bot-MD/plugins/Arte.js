import { search, download } from 'aptoide-scraper'
  
 var handler = async (m, {conn, usedPrefix, command, text}) => { 
  
 if (!text) return conn.reply(m.chat, '> Ingrese el nombre de la apk que estas buscando', m, rcanal, fake,) 
    m.react('🕓');  
 try { 
  
 let searchA = await search(text) 
 let data5 = await download(searchA[0].id) 
 let response = `☄ *Nombre:* ${data5.name}\n *Paquete:* ${data5.package}\n🚀 *Actualización:* ${data5.lastup}\n🗻 *Tamaño:* ${data5.size}` 
 await conn.sendMessage(m.chat, { text: response, contextInfo: { externalAdReply: { title: data5.name, body: packname, sourceUrl: md, rcanal, thumbnailUrl: data5.icon, mediaType: 1, showAdAttribution: true, renderLargerThumbnail: true }}} , { quoted: m })    
      m.react('✅');
  if (data5.size.includes('GB') || data5.size.replace(' MB', '') > 999) { 
 return await conn.reply(m.chat, '🛑 *El archivo es demaciado pesado*', m, rcanal, fake,) 
 } 
 await conn.sendMessage(m.chat, {document: {url: data5.dllink}, mimetype: 'application/vnd.android.package-archive', fileName: data5.name + '.apk', caption: null}, {quoted: m}) 
 } catch { 
 return conn.reply(m.chat, '🛑 *Ocurrió un fallo*', m, rcanal, fake, ) 
 }     
 } 
  
 handler.tags = ['descargas'] 
 handler.help = ['apkmod'] 
 handler.command = ['apk', 'modapk', 'aptoide']

 export default handler