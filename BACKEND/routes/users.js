const express = require('express');
const routerUsers = express.Router();
const usersController = require('../controllers/users_api_controller');

// Rutas
routerUsers.get('/', usersController.getUsers);
routerUsers.post('/login', usersController.loginUser); 
routerUsers.get('/:id', usersController.getUserById);
routerUsers.post('/', usersController.registerUser);
routerUsers.patch('/:id', usersController.updateUser);
routerUsers.delete('/:id', usersController.deleteUser);

//Exportar
module.exports = routerUsers;