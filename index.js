// Este código es para una MiniApp muy simple
// que envía una señal al bot.
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const bot = require('./bot'); // Importa tu bot.js

app.get('/', (req, res) => {
  res.send('Tu bot de Sala Cine está activo.');
  // Puedes agregar aquí una acción del bot si lo deseas.
  // Por ejemplo, bot.sendMessage('TU_ID_DE_CHAT', 'El bot ha sido activado!');
});

app.listen(port, () => {
  console.log(`MiniApp de ping escuchando en el puerto ${port}`);
});
