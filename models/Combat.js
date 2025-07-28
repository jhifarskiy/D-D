const mongoose = require('mongoose');

// Эта схема описывает одного участника боя
const CombatantSchema = new mongoose.Schema({
    // ID будет только у персонажей игроков
    characterId: { type: String, required: false }, 
    name: { type: String, required: true },
    initiative: { type: Number, default: null },
    // Добавляем флаг, чтобы отличать игрока от NPC
    isPlayer: { type: Boolean, default: false } 
}, { _id: true }); // Включаем _id, чтобы у каждого участника был свой уникальный ID для удаления

// Эта схема описывает состояние боя в целом
const CombatSchema = new mongoose.Schema({
    _id: { type: String, default: 'main_combat' }, // У нас будет только один активный бой за раз
    isActive: { type: Boolean, default: false }, // Идет ли бой сейчас?
    round: { type: Number, default: 1 }, // Номер раунда
    turn: { type: Number, default: 0 }, // Индекс того, чей ход, в массиве combatants
    combatants: [CombatantSchema] // Список участников
});

const Combat = mongoose.model('Combat', CombatSchema);
module.exports = Combat;