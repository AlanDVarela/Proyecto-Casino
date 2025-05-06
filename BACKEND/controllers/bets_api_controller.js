const Bet = require('../models/Bet');
const User = require('../models/User');

// Get all bets (admin only)
exports.getBets = async (req, res) => {
    const token = req.headers['x-auth'];

    if (token !== 'admin_auth') {
        return res.status(401).send("Unauthorized (admin only)");
    }

    try {
        const bets = await Bet.find().populate('userId', 'name email');
        res.json(bets);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Get bet by ID (owner or admin)
exports.getBetById = async (req, res) => {
    const token = req.headers['x-auth'];

    try {
        const bet = await Bet.findById(req.params.id).populate('userId', 'name email');
        if (!bet) return res.status(404).send("Bet not found");

        if (token !== 'admin_auth' && bet.userId.password !== token) {
            return res.status(401).send("Unauthorized");
        }

        res.json(bet);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Create new bet (user only)
exports.createBet = async (req, res) => {
    const token = req.headers['x-auth'];

    try {
        const user = await User.findById(req.body.userId);
        if (!user) return res.status(404).send("User not found");

        if (user.password !== token) {
            return res.status(401).send("Unauthorized");
        }

        const bet = new Bet(req.body);
        await bet.save();

        res.status(201).json(bet);
    } catch (err) {
        res.status(400).send(err.message);
    }
};

// Delete bet (admin only)
exports.deleteBet = async (req, res) => {
    const token = req.headers['x-auth'];

    if (token !== 'admin_auth') {
        return res.status(401).send("Unauthorized (admin only)");
    }

    try {
        const bet = await Bet.findByIdAndDelete(req.params.id);
        if (!bet) return res.status(404).send("Bet not found");

        res.json({ message: "Bet deleted", bet });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Obtener apuestas por usuario (owner only)
exports.getBetsByUser = async (req, res) => {
    const token = req.headers['x-auth'];

    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).send("User not found");

        if (user.password !== token && token !== 'admin_auth') {
            return res.status(401).send("Unauthorized");
        }

        const bets = await Bet.find({ userId: user._id }).sort({ date: -1 });
        res.json(bets);
    } catch (err) {
        res.status(500).send(err.message);
    }
};