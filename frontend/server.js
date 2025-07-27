const express = require('express');
const path = require('path');
const app = express();
const port = 3000; // Порт для фронтенд-сервера

// Обслуживание статических файлов из папки 'frontend'
app.use(express.static(path.join(__dirname)));

// Отправка index.html при запросе корневого URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Frontend server running at http://localhost:${port}`);
});