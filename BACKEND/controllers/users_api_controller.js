const User = require('../models/User');

// Obtener todos los usuarios (admin)
exports.getUsers = async (req, res) => {
    const token = req.headers['x-auth'];

    if (token !== 'admin_auth') {
        return res.status(401).send("Unauthorized");
    }

    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).send("User not found");

        res.json(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Registrar nuevo usuario
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).send("Email already exists");

        const user = new User({ name, email, password });
        await user.save();

        const { password: _, ...safeUser } = user.toObject();
        res.status(201).json(safeUser);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
    try {
        const updates = req.body;
        if (updates.email) {
            const exists = await User.findOne({ email: updates.email });
            if (exists) return res.status(400).send("Email already in use");
        }

        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!user) return res.status(404).send("User not found");

        res.json(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Eliminar usuario
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).send("User not found");

        res.json({ message: "User deleted", user });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Login simple
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).send("Invalid credentials");

        res.json(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
};