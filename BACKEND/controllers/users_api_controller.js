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

// Obtener usuario por ID (requiere autenticación)
exports.getUserById = async (req, res) => {
    const auth = req.headers['x-auth'];

    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).send("User not found");

        if (user.password !== auth) {
            return res.status(401).send("Invalid x-auth password");
        }

        res.json(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Registrar nuevo usuario (no requiere autenticación)
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).send("Email already exists");

        const user = new User({
            name,
            email,
            password,
            balance: 0
        });
        await user.save();
        res.status(201).json(user.toObject());
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Actualizar usuario (requiere autenticación)
exports.updateUser = async (req, res) => {
    const auth = req.headers['x-auth'];

    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send("User not found");

        if (user.password !== auth) {
            return res.status(401).send("Invalid x-auth password");
        }

        const updates = req.body;

        if (updates.email) {
            const exists = await User.findOne({ email: updates.email });
            if (exists && exists.id !== user.id) return res.status(400).send("Email already in use");
        }

        if (updates.balance !== undefined && updates.balance < 0) {
            return res.status(400).send("Balance cannot be negative");
        }

        Object.assign(user, updates);
        await user.save();
        res.json(user.toObject());
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Eliminar usuario (requiere autenticación)
exports.deleteUser = async (req, res) => {
    const auth = req.headers['x-auth'];

    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send("User not found");

        if (user.password !== auth) {
            return res.status(401).send("Invalid x-auth password");
        }

        await user.deleteOne();

        res.json({ message: "User deleted", user });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Login simple (sin autenticación previa)
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).send("Invalid credentials");

        const userObj = user.toObject();
        //userObj.id = user._id;
        //delete userObj._id;
        //delete userObj.password;

        res.json(userObj);
    } catch (err) {
        res.status(500).send(err.message);
    }
};