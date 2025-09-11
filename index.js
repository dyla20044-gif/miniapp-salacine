const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const bot = require('./bot'); // Importa tu bot.js

// Middleware para leer el cuerpo de la solicitud JSON
app.use(express.json());

// Escucha en la ruta del webhook
app.post(`/${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Ruta simple para saber que el bot está activo
app.get('/', (req, res) => {
    res.send('Tu bot de Sala Cine está activo.');
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor de bot escuchando en el puerto ${port}`);
});
