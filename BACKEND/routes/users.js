const express = require('express');
const routerUsers = express.Router();
const usersController = require('../controllers/users_api_controller');

// Rutas
routerUsers.get('/', usersController.getUsers);
routerUsers.get('/:id', usersController.getUserById);
routerUsers.post('/', usersController.registerUser);
routerUsers.patch('/:id', usersController.updateUser);
routerUsers.delete('/:id', usersController.deleteUser);
routerUsers.post('/login', usersController.loginUser);

//Exportar
module.exports = routerUsers;