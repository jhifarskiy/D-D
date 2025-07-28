const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require("socket.io");
require('dotenv').config(); // Теперь .env находится в той же папке

// Импортируем модели (путь изменился)
const Character = require('./models/Character');
const MapData = require('./models/MapData');

const app = express();
const port = process.env.PORT || 8080;

// --- Мидлвары ---
app.use(cors());
app.use(express.json());
// Обслуживаем статические файлы из папки 'frontend'
app.use(express.static('frontend'));

// --- Подключение к MongoDB ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Successfully connected to MongoDB!"))
  .catch(err => console.error("Failed to connect to MongoDB...", err));

// --- API Роуты ---
const FIXED_CHARACTER_ID = "60c72b2f9b1e8b0015b6d7a4";
const FIXED_MAP_ID = "main_map";

// API для Персонажа
app.get('/api/character', async (req, res) => {
    try {
        let character = await Character.findById(FIXED_CHARACTER_ID);
        if (!character) {
            character = new Character({ _id: FIXED_CHARACTER_ID });
            await character.save();
        }
        res.json(character);
    } catch (error) {
        res.status(500).json({ message: "Error fetching character data" });
    }
});
app.post('/api/character', async (req, res) => {
    try {
        const updatedCharacter = await Character.findByIdAndUpdate(
            FIXED_CHARACTER_ID,
            req.body,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ message: "Character saved successfully!", character: updatedCharacter });
    } catch (error) {
        res.status(500).json({ message: "Error saving character data" });
    }
});

// API для Карты
app.get('/api/map', async (req, res) => {
    try {
        let map = await MapData.findById(FIXED_MAP_ID);
        if (!map) {
            map = new MapData({ _id: FIXED_MAP_ID });
            await map.save();
        }
        res.json(map);
    } catch (error) {
        res.status(500).json({ message: "Error fetching map data" });
    }
});
app.post('/api/map', async (req, res) => {
    try {
        const updatedMap = await MapData.findByIdAndUpdate(
            FIXED_MAP_ID,
            req.body,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ message: "Map saved successfully!", map: updatedMap });
    } catch (error) {
        res.status(500).json({ message: "Error saving map data" });
    }
});

// Отправка index.html (путь изменился)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// --- Настройка сервера и WebSocket ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let activeCharacters = [];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('character:join', (charData) => {
        console.log('Character joined:', charData.name);
        const existingCharIndex = activeCharacters.findIndex(c => c._id === charData._id);
        if (existingCharIndex === -1) {
            activeCharacters.push(charData);
        } else {
            activeCharacters[existingCharIndex] = charData;
        }
        io.emit('map:update', activeCharacters);
    });

    socket.on('character:move', async (moveData) => {
        const charIndex = activeCharacters.findIndex(c => c._id === moveData._id);
        if (charIndex !== -1) {
            activeCharacters[charIndex].mapX = moveData.mapX;
            activeCharacters[charIndex].mapY = moveData.mapY;
            
            try {
                await Character.findByIdAndUpdate(moveData._id, { mapX: moveData.mapX, mapY: moveData.mapY });
            } catch(e) { console.error("Failed to save character move to DB"); }
            
            io.emit('map:update', activeCharacters);
        }
    });
    
    socket.on('map:get', () => {
        socket.emit('map:update', activeCharacters);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// --- Запуск сервера ---
server.listen(port, () => {
  console.log(`Node.js backend listening on http://localhost:${port}`);
});