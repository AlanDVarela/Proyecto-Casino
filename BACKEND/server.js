const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const router = require('./routes/api.js');
const app = express();
const port = 3000;


//Mongo
let mongoConnection = "mongodb+srv://admin:Yosoypro1@myapp.ezop7xc.mongodb.net/Casino";
let db = mongoose.connection;

mongoose.set('strictQuery', true); 
db.on('connecting', () => {
  console.log('Conectando...');
  console.log(mongoose.connection.readyState); // Estado 2: Connecting
});

db.on('connected', () => {
  console.log('¡Conectado exitosamente!');
  console.log(mongoose.connection.readyState); // Estado 1: Connected
});

mongoose.connect(mongoConnection);




//Server
app.use(express.json());
app.use(cors());

//Router principal
app.use(router);

//Archivos estaticos
app.use(express.static('FRONTEND'));
app.use('/controllers', express.static('../FRONTEND/controllers'));
app.use('/views', express.static('../FRONTEND/views'));
app.use('/assets', express.static('../FRONTEND/assets'));
app.use('/styles', express.static('../FRONTEND/styles'));

app.listen(port, ()=>
{
    console.log(`Casino corriendo en el puerto ${port}!`);
});
