const express = require('express');
const path = require('path');
const historicsRouter = require('./src/routes/historics.js');
const realtimeRoutes = require('./src/routes/realtime');

// const realtimeRouter = require('./routes/realtime'); // Cuando esté listo

const app = express();
app.use(express.json());

// Archivos estáticos (CSS, JS frontend si hay)
app.use('/statics', express.static(path.join(__dirname, 'static')));
app.use('/assets', express.static(path.join(__dirname, 'src/assets')));


// HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/pages/home.html'));
});

app.get('/historics', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/pages/historics.html'));
});

app.get('/realtime', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/pages/realtime.html'));
});

// Rutas funcionales API
app.use('/api/historics', historicsRouter);
app.use('/api/realtime', realtimeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
