const express = require('express');
const routerBets = express.Router();
const betsController = require('../controllers/bets_api_controller');

//Rutas
routerBets.get('/', betsController.getBets);
routerBets.get('/:id', betsController.getBetById);
routerBets.post('/', betsController.createBet);
routerBets.delete('/:id', betsController.deleteBet);
routerBets.get('/user/:userId', betsController.getBetsByUser);


//Export
module.exports = routerBets;