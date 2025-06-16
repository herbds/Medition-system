const express = require('express');
const router = express.Router();
const { 
  actualizarDatos, 
  obtenerUltimosSegundos, 
  calcularPromedio,
  getCurrentInstrumentModel
} = require('../data/dataStoreRealtime');

// Endpoint para obtener los últimos datos y su promedio
router.get('/ultimos', async (req, res) => {
  try {
    const instrumentModel = req.query.instrumentModel || getCurrentInstrumentModel();
    
    await actualizarDatos(instrumentModel);
    const ultimosDatos = obtenerUltimosSegundos(instrumentModel, 5); // Últimos 5 segundos
    const promedio = calcularPromedio(instrumentModel, ultimosDatos);
    
    res.json({
      instrumentModel,
      datos: ultimosDatos,
      promedio: promedio
    });
    
  } catch (err) {
    console.error("Error en /ultimos:", err);
    res.status(500).json({ 
      error: "Error al obtener datos",
      detalles: err.message 
    });
  }
});

// Endpoint para forzar una actualización de datos
router.get('/actualizar', async (req, res) => {
  try {
    const instrumentModel = req.query.instrumentModel || 'default';
    await actualizarDatos(instrumentModel);
    res.json({ 
      mensaje: 'Datos actualizados',
      instrumentModel,
      ultimaActualizacion: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error en /actualizar:", err);
    res.status(500).json({ 
      error: "Error al actualizar datos",
      detalles: err.message 
    });
  }
});

module.exports = router;