const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require("socket.io");
require('dotenv').config();

const Character = require('./models/Character');
const MapData = require('./models/MapData');
const Combat = require('./models/Combat');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// API для Карты
const FIXED_MAP_ID = "main_map";
app.get('/api/map', async (req, res) => {
    try {
        let map = await MapData.findById(FIXED_MAP_ID);
        if (!map) { map = new MapData({ _id: FIXED_MAP_ID }); await map.save(); }
        res.json(map);
    } catch (error) {
        res.status(500).json({ message: "Error fetching map data" });
    }
});
app.post('/api/map', async (req, res) => {
    try {
        await MapData.findByIdAndUpdate(FIXED_MAP_ID, req.body, { new: true, upsert: true });
        res.status(200).json({ message: "Map saved successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error saving map data" });
    }
});

// API для Персонажей
app.get('/api/characters', async (req, res) => {
    try {
        const characters = await Character.find({}, '_id name');
        res.json(characters);
    } catch (error) {
        res.status(500).json({ message: "Error fetching character list" });
    }
});
app.post('/api/characters', async (req, res) => {
    try {
        const newCharacter = new Character();
        await newCharacter.save();
        res.status(201).json(newCharacter);
    } catch (error) {
        res.status(500).json({ message: "Error creating character" });
    }
});
app.get('/api/characters/:id', async (req, res) => {
    try {
        const character = await Character.findById(req.params.id);
        if (!character) { return res.status(404).json({ message: "Character not found" }); }
        res.json(character);
    } catch (error) {
        res.status(500).json({ message: "Error fetching character" });
    }
});
app.put('/api/characters/:id', async (req, res) => {
    try {
        const updatedCharacter = await Character.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedCharacter) { return res.status(404).json({ message: "Character not found" }); }
        const charIndex = activeCharacters.findIndex(c => c._id.toString() === updatedCharacter._id.toString());
        if (charIndex !== -1) {
            activeCharacters[charIndex].name = updatedCharacter.name;
            io.emit('map:update', activeCharacters);
        }
        res.json(updatedCharacter);
    } catch (error) {
        res.status(500).json({ message: "Error updating character" });
    }
});
app.delete('/api/characters/:id', async (req, res) => {
    try {
        const deletedCharacter = await Character.findByIdAndDelete(req.params.id);
        if (!deletedCharacter) { return res.status(404).json({ message: "Character not found" }); }
        activeCharacters = activeCharacters.filter(c => c._id.toString() !== req.params.id);
        io.emit('map:update', activeCharacters);
        res.json({ message: "Character deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting character" });
    }
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
            if (moveData.name) {
                activeCharacters[charIndex].name = moveData.name;
            }
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
        io.emit('log:new_message', messageData);
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
            if (combatState.turn >= combatState.combatants.length) {
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