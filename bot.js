const TelegramBot = require('node-telegram-bot-api');
const firebaseAdmin = require('firebase-admin');

// Reemplaza con tus tokens
const TELEGRAM_BOT_TOKEN = '7480652505:AAGQHRJ3q8W8sua8MUXvg6HHRKekxpqAkeM';
const FIREBASE_ADMIN_CONFIG = require('./firebase-admin-config.json');

// Reemplaza con tu API de TMDb
const TMDB_API_KEY = '5eb8461b85d0d88c46d77cfe5436291f';
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(FIREBASE_ADMIN_CONFIG),
});
const db = firebaseAdmin.firestore();

// Comando para buscar una película
bot.onText(/\/buscar (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const movieName = match[1];

  const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieName)}&language=es-ES`;
  const response = await fetch(tmdbUrl);
  const data = await response.json();

  if (data.results && data.results.length > 0) {
    const movie = data.results[0];
    const message = `**Película encontrada:**\n\n- Título: ${movie.title}\n- Año: ${movie.release_date.substring(0, 4)}\n- Descripción: ${movie.overview}\n\nResponde a este mensaje con el enlace del video para agregarlo.`;
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true,
        input_field_placeholder: 'Pegar enlace de video'
      }
    });
  } else {
    bot.sendMessage(chatId, 'Lo siento, no pude encontrar esa película.');
  }
});

// Manejar la respuesta del usuario con el enlace
bot.on('message', async (msg) => {
  if (msg.reply_to_message && msg.reply_to_message.text.includes('Responde a este mensaje con el enlace')) {
    const videoLink = msg.text;
    const originalMessageText = msg.reply_to_message.text;
    const movieTitle = originalMessageText.match(/- Título: (.+)/)[1].trim();

    const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieTitle)}&language=es-ES`;
    const response = await fetch(tmdbUrl);
    const data = await response.json();
    const movieData = data.results[0];

    const movieToAdd = {
      title: movieData.title,
      description: movieData.overview,
      poster: `https://image.tmdb.org/t/p/w500${movieData.poster_path}`,
      tmdbId: movieData.id,
      videoLink: videoLink,
      isPremium: false, // Por defecto, es gratis
      trailerLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(movieData.title)} trailer`
    };

    try {
      await db.collection('movies').add(movieToAdd);
      bot.sendMessage(msg.chat.id, `¡Listo! "${movieTitle}" ha sido agregada a tu MiniApp.`);
    } catch (error) {
      bot.sendMessage(msg.chat.id, `Hubo un error al agregar la película.`);
    }
  }
});
