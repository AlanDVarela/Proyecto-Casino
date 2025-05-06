const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gameType: {
        type: String,
        enum: ['roulette', 'blackjack', 'slots'],
        required: true
    },
    betAmount: {
        type: Number,
        required: true,
        min: 0
    },
    result: {
        type: String,
        enum: ['win', 'loss'],
        required: true
    },
    payout: {
        type: Number,
        required: true,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    },

    // ----- OPCIONALES según el juego -----

    // Ruleta
    rouletteNumber: {
        type: Number,
        min: 0,
        max: 36,
        required: function() { return this.gameType === 'roulette'; }
    },

    //Blackjack
    blackjackHand: {
        type: [String],
        required: function() { return this.gameType === 'blackjack'; }
    },
    
    //Slot
    slotSymbols: {
        type: [String],
        required: function() { return this.gameType === 'slots'; }
    },
    
}, { versionKey: false });

//Modelo
const Bet = mongoose.model('Bet', betSchema);

module.exports = Bet;