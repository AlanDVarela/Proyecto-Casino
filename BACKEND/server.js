// BACKEND/server.js

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const router = require('./routes/api.js');
const app    = express();
const port   = process.env.PORT || 3000;

// ——— Conexión a MongoDB Atlas ———
// Sustituye admin:Passw00rd por tu usuario y contraseña reales
const mongoConnection =
  'mongodb+srv://admin:Passw00rd@cluster0.rv2qjhf.mongodb.net/Casino?retryWrites=true&w=majority';

mongoose.set('strictQuery', true);
mongoose.connect(mongoConnection);

mongoose.connection
  .on('connecting', ()  => console.log('Conectando a MongoDB…', mongoose.connection.readyState))
  .on('connected', ()   => console.log('¡Conectado exitosamente a Atlas!', mongoose.connection.readyState))
  .on('error', err      => console.error('Error de conexión a MongoDB:', err));

// ——— Middlewares ———
app.use(cors());
app.use(express.json());

// ——— Archivos estáticos ———
// 1) Páginas HTML
app.use('/',            express.static(path.join(__dirname, '../FRONTEND/views')));
// 2) Controladores JS
app.use('/controllers', express.static(path.join(__dirname, '../FRONTEND/controllers')));
// 3) Estilos CSS
app.use('/styles',      express.static(path.join(__dirname, '../FRONTEND/styles')));
// 4) Imágenes y demás assets
app.use('/assets',      express.static(path.join(__dirname, '../FRONTEND/assets')));

// ——— Rutas de API ———
app.use(router);

// ——— Arranque del servidor ———
app.listen(port, () => {
  console.log(`Casino corriendo en el puerto ${port}!`);
});
