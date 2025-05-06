const mongoose = require('mongoose');

// Esquema del usuario
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name cannot be empty"]
    },
    email: {
        type: String,
        required: [true, "Email cannot be empty"],
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "Password cannot be empty"],
        minlength: [8, "Password must be at least 8 characters"]
    },
    joined_at: {
        type: Date,
        default: Date.now,
        immutable: true //
    }
});

// Crear el modelo
const User = mongoose.model('User', userSchema);

// Exportar modelo
module.exports = User;
