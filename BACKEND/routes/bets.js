const express = require('express');
const routerBets = express.Router();
const betsController = require('../controllers/bets_api_controller');

// Rutas existentes...
routerBets.get('/', betsController.getBets);
routerBets.get('/:id', betsController.getBetById);
routerBets.post('/', betsController.createBet);
routerBets.delete('/:id', betsController.deleteBet);

// NUEVA RUTA → Obtener apuestas de un usuario
routerBets.get('/user/:userId', betsController.getBetsByUser);

module.exports = routerBets;