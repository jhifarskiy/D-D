const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Имя пользователя должно быть уникальным
        trim: true,   // Убираем лишние пробелы
        lowercase: true // Храним в нижнем регистре для простоты
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;