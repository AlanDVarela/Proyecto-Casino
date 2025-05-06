const express = require('express');
const path = require('path');
const routerApi = express.Router();



routerApi.get('/', (req, res) => 
{ 
    
    res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/home.html"))
});
    
//Home
routerApi.get('/home.html', (req, res) => 
    res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/home.html"))
);


//Blackjack
routerApi.get('/blackjack.html', (req, res) => 
    res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/blackjack.html"))
);

//Ruleta
routerApi.get('/ruleta.html', (req, res) => 
    res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/ruleta.html"))
);

//Jackpot
routerApi.get('/jackpot.html', (req, res) => 
    res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/jackpot.html"))
);


//Rutas Users
const userRoutes = require('./users');
routerApi.use('/users', userRoutes);

//Rutas bets
const betRoutes = require('./bets');
routerApi.use('/bets', betRoutes);



//Export
module.exports = routerApi;