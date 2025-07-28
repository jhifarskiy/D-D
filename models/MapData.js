const mongoose = require('mongoose');

const MapDataSchema = new mongoose.Schema({
    _id: String,
    gridSize: { type: Number, default: 50 },
    backgroundUrl: { type: String, default: '' },
});

const MapData = mongoose.model('MapData', MapDataSchema);
module.exports = MapData;