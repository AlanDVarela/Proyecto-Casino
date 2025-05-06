const Bet = require('../models/Bet');

// Get all bets
exports.getBets = async (req, res) => {
    try {
        const bets = await Bet.find().populate('userId', 'name email');
        res.json(bets);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Get bet by ID
exports.getBetById = async (req, res) => {
    try {
        const bet = await Bet.findById(req.params.id).populate('userId', 'name email');
        if (!bet) return res.status(404).send("Bet not found");

        res.json(bet);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Create new bet
exports.createBet = async (req, res) => {
    try {
        const bet = new Bet(req.body);
        await bet.save();

        res.status(201).json(bet);
    } catch (err) {
        res.status(400).send(err.message);
    }
};

// Delete bet
exports.deleteBet = async (req, res) => {
    try {
        const bet = await Bet.findByIdAndDelete(req.params.id);
        if (!bet) return res.status(404).send("Bet not found");

        res.json({ message: "Bet deleted", bet });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Obtener apuestas por usuario
exports.getBetsByUser = async (req, res) => {
    const userId = req.params.userId;

    try {
        const bets = await Bet.find({ userId }).sort({ date: -1 }); // opcionalmente ordenado por fecha
        res.json(bets);
    } catch (err) {
        res.status(500).send(err.message);
    }
};