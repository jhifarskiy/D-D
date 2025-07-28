const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    description: { type: String, default: '' }
}, { _id: false });

const SpellSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    level: { type: String, default: 'Заговор' },
    description: { type: String, default: '' }
}, { _id: false });

// Основная схема персонажа
const CharacterSchema = new mongoose.Schema({
    // Мы удалили строку _id: String, чтобы MongoDB генерировала его автоматически
    name: { type: String, default: 'Новый персонаж' }, // Изменили имя по умолчанию
    
    strength: { type: Number, default: 10 },
    dexterity: { type: Number, default: 10 },
    constitution: { type: Number, default: 10 },
    intell: { type: Number, default: 10 },
    wisdom: { type: Number, default: 10 },
    charisma: { type: Number, default: 10 },

    proficiencyBonus: { type: Number, default: 2 },
    strengthSaveProficient: { type: Boolean, default: false },
    dexteritySaveProficient: { type: Boolean, default: false },
    constitutionSaveProficient: { type: Boolean, default: false },
    intellSaveProficient: { type: Boolean, default: false },
    wisdomSaveProficient: { type: Boolean, default: false },
    charismaSaveProficient: { type: Boolean, default: false },

    acrobaticsProficient: { type: Boolean, default: false },
    animalHandlingProficient: { type: Boolean,default: false },
    arcanaProficient: { type: Boolean, default: false },
    athleticsProficient: { type: Boolean, default: false },
    deceptionProficient: { type: Boolean, default: false },
    historyProficient: { type: Boolean, default: false },
    insightProficient: { type: Boolean, default: false },
    intimidationProficient: { type: Boolean, default: false },
    investigationProficient: { type: Boolean, default: false },
    medicineProficient: { type: Boolean, default: false },
    natureProficient: { type: Boolean, default: false },
    perceptionProficient: { type: Boolean, default: false },
    performanceProficient: { type: Boolean, default: false },
    persuasionProficient: { type: Boolean, default: false },
    religionProficient: { type: Boolean, default: false },
    sleightOfHandProficient: { type: Boolean, default: false },
    stealthProficient: { type: Boolean, default: false },
    survivalProficient: { type: Boolean, default: false },

    equipment: [EquipmentSchema],
    spells: [SpellSchema],

    mapX: { type: Number, default: 400 },
    mapY: { type: Number, default: 300 }
});

const Character = mongoose.model('Character', CharacterSchema);
module.exports = Character;