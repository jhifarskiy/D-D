const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require("socket.io");
const { DiceRoll } = require('rpg-dice-roller');
require('dotenv').config();

const Character = require('./models/Character');
const MapData = require('./models/MapData');
const Combat = require('./models/Combat');
const User = require('./models/User');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Middleware для проверки "пропуска"-токена
const authMiddleware = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }
    try {
        const token = req.headers.authorization.split(' ')[1]; // "Bearer TOKEN"
        if (!token) {
            return res.status(401).json({ message: "Нет авторизации" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Добавляем { userId: '...' } в объект запроса
        next();
    } catch (e) {
        return res.status(401).json({ message: "Нет авторизации" });
    }
};

// API для аутентификации
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Необходимо указать имя пользователя и пароль." });
        }
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "Пользователь с таким именем уже существует." });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ username: username.toLowerCase(), password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "Пользователь успешно зарегистрирован." });
    } catch (error) {
        res.status(500).json({ message: "Что-то пошло не так, попробуйте снова." });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Необходимо указать имя пользователя и пароль." });
        }
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: "Пользователь не найден." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Неверный пароль." });
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, userId: user.id, username: user.username });
    } catch (error) {
        res.status(500).json({ message: "Что-то пошло не так, попробуйте снова." });
    }
});

// API для Карты (остается публичным)
const FIXED_MAP_ID = "main_map";
app.get('/api/map', async (req, res) => {
    try {
        let map = await MapData.findById(FIXED_MAP_ID);
        if (!map) { map = new MapData({ _id: FIXED_MAP_ID }); await map.save(); }
        res.json(map);
    } catch (error) { res.status(500).json({ message: "Error fetching map data" }); }
});
app.post('/api/map', async (req, res) => {
    try {
        await MapData.findByIdAndUpdate(FIXED_MAP_ID, req.body, { new: true, upsert: true });
        res.status(200).json({ message: "Map saved successfully!" });
    } catch (error) { res.status(500).json({ message: "Error saving map data" }); }
});

// API для Персонажей (теперь защищены и привязаны к пользователю)
app.get('/api/characters', authMiddleware, async (req, res) => {
    try {
        const characters = await Character.find({ owner: req.user.userId }, '_id name');
        res.json(characters);
    } catch (error) { res.status(500).json({ message: "Error fetching character list" }); }
});
app.post('/api/characters', authMiddleware, async (req, res) => {
    try {
        const newCharacter = new Character({ owner: req.user.userId });
        await newCharacter.save();
        res.status(201).json(newCharacter);
    } catch (error) { res.status(500).json({ message: "Error creating character" }); }
});
app.get('/api/characters/:id', authMiddleware, async (req, res) => {
    try {
        const character = await Character.findOne({ _id: req.params.id, owner: req.user.userId });
        if (!character) { return res.status(404).json({ message: "Character not found or access denied" }); }
        res.json(character);
    } catch (error) { res.status(500).json({ message: "Error fetching character" }); }
});
app.put('/api/characters/:id', authMiddleware, async (req, res) => {
    try {
        delete req.body.owner;
        const character = await Character.findOneAndUpdate({ _id: req.params.id, owner: req.user.userId }, req.body, { new: true });
        if (!character) { return res.status(404).json({ message: "Character not found or access denied" }); }
        
        const charIndex = activeCharacters.findIndex(c => c._id.toString() === character._id.toString());
        if (charIndex !== -1) { activeCharacters[charIndex].name = character.name; io.emit('map:update', activeCharacters); }
        res.json(character);
    } catch (error) { res.status(500).json({ message: "Error updating character" }); }
});
app.delete('/api/characters/:id', authMiddleware, async (req, res) => {
    try {
        const character = await Character.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
        if (!character) { return res.status(404).json({ message: "Character not found or access denied" }); }
        
        activeCharacters = activeCharacters.filter(c => c._id.toString() !== req.params.id);
        io.emit('map:update', activeCharacters);
        res.json({ message: "Character deleted successfully" });
    } catch (error) { res.status(500).json({ message: "Error deleting character" }); }
});

app.use(express.static('frontend'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let activeCharacters = [];
let combatState = null;

async function loadInitialState() {
    try {
        combatState = await Combat.findById('main_combat');
        if (!combatState) {
            console.log("No active combat found in DB, creating a new default one.");
            combatState = new Combat({ _id: 'main_combat' });
            await combatState.save();
        }
    } catch (e) {
        console.error("Failed to load combat state from DB", e);
        process.exit(1);
    }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
      console.log("Successfully connected to MongoDB!");
      loadInitialState().then(() => {
          server.listen(port, () => {
              console.log(`Node.js backend listening on http://localhost:${port}`);
          });
      });
  })
  .catch(err => console.error("Failed to connect to MongoDB...", err));

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.characterId = null;
    socket.emit('map:update', activeCharacters);
    socket.emit('combat:update', combatState);

    socket.on('character:join', (charData) => {
        socket.characterId = charData._id.toString();
        const existingCharIndex = activeCharacters.findIndex(c => c._id.toString() === charData._id.toString());
        if (existingCharIndex === -1) {
            activeCharacters.push(charData);
        } else {
            activeCharacters[existingCharIndex] = charData;
        }
        io.emit('map:update', activeCharacters);
    });

    socket.on('character:move', async (moveData) => {
        const charIndex = activeCharacters.findIndex(c => c._id.toString() === moveData._id.toString());
        if (charIndex !== -1) {
            activeCharacters[charIndex].mapX = moveData.mapX;
            activeCharacters[charIndex].mapY = moveData.mapY;
            if(moveData.name) activeCharacters[charIndex].name = moveData.name;
            try {
                await Character.findByIdAndUpdate(moveData._id, { mapX: moveData.mapX, mapY: moveData.mapY, name: moveData.name });
            } catch (e) {
                console.error("Failed to save character data to DB");
            }
            io.emit('map:update', activeCharacters);
        }
    });

    socket.on('map:get', () => socket.emit('map:update', activeCharacters));

    socket.on('disconnect', () => {
        if (socket.characterId) {
            activeCharacters = activeCharacters.filter(c => c._id.toString() !== socket.characterId);
            io.emit('map:update', activeCharacters);
        }
    });

    socket.on('log:send', (messageData) => {
        const commandMatch = messageData.text.match(/^\/(r|roll)\s+(.*)/);
        if (commandMatch) {
            const notation = commandMatch[2];
            try {
                const roll = new DiceRoll(notation);
                messageData.text = `бросает ${roll.notation}: ${roll.output}`;
                io.emit('log:new_message', messageData);
            } catch (e) {
                messageData.text = `не смог бросить "${notation}" (ошибка в формуле)`;
                io.emit('log:new_message', messageData);
            }
        } else {
            io.emit('log:new_message', messageData);
        }
    });

    socket.on('combat:start', async () => {
        if (!combatState.isActive && activeCharacters.length > 0) {
            combatState.isActive = true;
            combatState.round = 1;
            combatState.turn = 0;
            combatState.combatants = activeCharacters.map(char => ({
                characterId: char._id,
                name: char.name,
                initiative: null,
                isPlayer: true
            }));
            await combatState.save();
            io.emit('combat:update', combatState);
        }
    });

    socket.on('combat:end', async () => {
        if (combatState.isActive) {
            combatState.isActive = false;
            combatState.combatants = [];
            combatState.round = 1;
            combatState.turn = 0;
            await combatState.save();
            io.emit('combat:update', combatState);
        }
    });

    socket.on('combat:set_initiative', async ({ combatantId, initiative }) => {
        if (combatState.isActive) {
            const combatant = combatState.combatants.find(c => c._id.toString() === combatantId);
            if (combatant) {
                combatant.initiative = initiative;
                combatState.combatants.sort((a, b) => (b.initiative || -1) - (a.initiative || -1));
                await combatState.save();
                io.emit('combat:update', combatState);
            }
        }
    });

    socket.on('combat:next_turn', async () => {
        if (combatState.isActive && combatState.combatants.length > 0) {
            combatState.turn++;
            if (combatState.turn >= combatState.combatants.length) {
                combatState.turn = 0;
                combatState.round++;
            }
            await combatState.save();
            io.emit('combat:update', combatState);
        }
    });

    socket.on('combat:add_npc', async ({ name, initiative }) => {
        if (combatState.isActive) {
            combatState.combatants.push({ name, initiative, isPlayer: false });
            combatState.combatants.sort((a, b) => (b.initiative || -1) - (a.initiative || -1));
            await combatState.save();
            io.emit('combat:update', combatState);
        }
    });

    socket.on('combat:remove_combatant', async (combatantId) => {
        if (combatState.isActive) {
            combatState.combatants = combatState.combatants.filter(c => c._id.toString() !== combatantId);
            if (combatState.turn >= combatState.combatants.length && combatState.combatants.length > 0) {
                combatState.turn = 0;
            }
            await combatState.save();
            io.emit('combat:update', combatState);
        }
    });

    socket.on('combat:get', () => {
        socket.emit('combat:update', combatState);
    });
});