const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const bot = require('./bot');

app.use(express.json());

app.post(`/${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.send('Tu bot de Sala Cine está activo.');
});

app.listen(port, () => {
    console.log(`Servidor de bot escuchando en el puerto ${port}`);
<<<<<<< HEAD
});
=======
});
>>>>>>> 6332ac9a037090e96a54681fb8d9b8ff747a0229
