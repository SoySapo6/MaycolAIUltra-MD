//𝘗𝘰𝘸𝘦𝘳 𝘣𝘺 𝘪𝘷𝘢𝘯
let handler = async (m, { conn }) => {
    const mascotas = [
        'Perro',
        'Gato',
        'Loro',
        'Tortuga',
        'Conejo',
        'Hámster',
        'Pez',
        'Iguana',
        'Cobaya',
        'Serpiente',
        'Gallo',
        'Erizo',
        'Pájaro',
        'Rana',
        'Chinchilla',
        'Foca',
        'Gato esfinge',
        'Dragón de Komodo',
        'Canguro',
        'Koala',
        'Axolotl',
        'Capibara',
        'Mapache',
        'Zorro',
        'Hurón',
        'Cacatúa',
        'Gecko',
        'Camaleón',
        'Caracol',
        'Cuyo',
        'Jerbo',
        'Ninfa',
        'Canario',
        'Pony',
        'Alpaca',
        'Cerdo vietnamita',
    ];

    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const mascotaAleatoria = getRandom(mascotas);

    conn.reply(m.chat, `¡Tu mascota aleatoria es: ${mascotaAleatoria}!`, m);
}

handler.help = ['mascotaAleatoria'];
handler.tags = ['juegos'];
handler.command = ['mascotaAleatoria', 'mascota'];
handler.register = true;

export default handler;