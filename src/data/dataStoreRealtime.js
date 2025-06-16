const fetchData = require('../api/fetchData');

// Variables de estado
let datos = [];
let intervaloActualizacion;
let currentInstrumentModel = 'default';

/**
 * Actualiza los datos del instrumento especificado
 * @param {string} instrumentModel - Modelo del instrumento a monitorear
 * @returns {Promise<void>}
 */
async function actualizarDatos(instrumentModel) {
  try {
    // Validación y asignación del modelo
    currentInstrumentModel = typeof instrumentModel === 'string' && instrumentModel.trim() !== '' 
      ? instrumentModel.trim() 
      : 'default';

    // Obtener datos más recientes
    const nuevosDatos = await fetchData('latest', currentInstrumentModel);
    
    if (Array.isArray(nuevosDatos)) {
      datos = nuevosDatos;
      
      // Log informativo
      if (datos.length > 0) {
        console.log(`[${new Date().toISOString()}] Datos actualizados para ${currentInstrumentModel}. Registros: ${datos.length}`);
        console.log("Último registro:", datos[datos.length - 1]);
      } else {
        console.log("Actualización recibida pero sin datos nuevos");
      }
    } else {
      console.warn("La API no devolvió un array válido");
    }
  } catch (err) {
    console.error("Error en actualización:", err.message);
    throw err; // Propagar el error para manejo en el router
  }
}

/**
 * Inicia la actualización automática periódica
 * @param {string} instrumentModel - Modelo del instrumento
 * @param {number} segundos - Intervalo en segundos (default: 5)
 */
function iniciarActualizacionAutomatica(instrumentModel, segundos = 5) {
  // Validar parámetros
  if (typeof segundos !== 'number' || segundos <= 0) {
    segundos = 5;
    console.warn("Intervalo no válido. Usando 5 segundos por defecto");
  }

  // Detener cualquier intervalo previo
  if (intervaloActualizacion) {
    clearInterval(intervaloActualizacion);
  }

  // Primera actualización inmediata
  actualizarDatos(instrumentModel).catch(err => 
    console.error("Error en actualización inicial:", err.message)
  );

  // Configurar actualización periódica
  intervaloActualizacion = setInterval(() => {
    actualizarDatos(instrumentModel).catch(err => 
      console.error("Error en actualización periódica:", err.message)
    );
  }, segundos * 1000);

  console.log(`Iniciando monitoreo para ${instrumentModel} (actualización cada ${segundos}s)`);
}

/**
 * Obtiene los registros de los últimos N segundos
 * @param {string} instrumentModel - Modelo del instrumento a filtrar
 * @param {number} segundos - Segundos a retroceder (default: 5)
 * @returns {Array} Datos filtrados
 */
function obtenerUltimosSegundos(instrumentModel, segundos = 5) {
  // Validación de parámetros
  if (typeof segundos !== 'number' || segundos <= 0) {
    segundos = 5;
    console.warn("Valor de segundos no válido. Usando 5s por defecto");
  }

  if (datos.length === 0 || currentInstrumentModel !== instrumentModel) {
    console.warn(`No hay datos disponibles para ${instrumentModel} o modelo no coincide`);
    return [];
  }

  const limite = new Date(Date.now() - segundos * 1000);
  
  try {
    const datosFiltrados = datos.filter(item => {
      try {
        const fechaItem = new Date(item.hora);
        return !isNaN(fechaItem.getTime()) && fechaItem >= limite;
      } catch {
        return false;
      }
    });

    console.log(`Registros de los últimos ${segundos} segundos para ${instrumentModel}:`, datosFiltrados.length);
    return datosFiltrados;
  } catch (err) {
    console.error("Error al filtrar datos:", err.message);
    return [];
  }
}

/**
 * Calcula el promedio de los datos en el rango especificado
 * @param {string} instrumentModel - Modelo del instrumento
 * @param {Array} datosFiltrados - Datos a promediar (opcional)
 * @returns {Object} Objeto con estadísticas
 */
function calcularPromedio(instrumentModel, datosFiltrados = []) {
  const datosAUsar = datosFiltrados.length > 0 ? datosFiltrados : obtenerUltimosSegundos(instrumentModel, 5);

  if (datosAUsar.length === 0) {
    console.warn(`No hay datos para calcular promedio para ${instrumentModel}`);
    return crearObjetoPromedioVacio(instrumentModel);
  }

  // Calcular estadísticas
  const suma = datosAUsar.reduce((acc, d) => acc + (parseFloat(d.velocidad) || 0), 0);
  const promedio = suma / datosAUsar.length;

  return {
    instrumentModel: instrumentModel,
    velocidadPromedio: parseFloat(promedio.toFixed(2)),
    position: datosAUsar[0].position || 'N/A',
    rangoTemporal: {
      inicio: datosAUsar[datosAUsar.length - 1].hora, // Más antiguo
      fin: datosAUsar[0].hora // Más reciente
    },
    muestras: datosAUsar.length,
    ultimaActualizacion: new Date().toISOString()
  };
}

/**
 * Crea un objeto de promedio vacío
 * @param {string} instrumentModel - Modelo del instrumento
 * @returns {Object} Objeto con valores por defecto
 */
function crearObjetoPromedioVacio(instrumentModel) {
  const ahora = new Date().toISOString();
  return {
    instrumentModel: instrumentModel,
    velocidadPromedio: 0,
    position: 'N/A',
    rangoTemporal: {
      inicio: ahora,
      fin: ahora
    },
    muestras: 0,
    ultimaActualizacion: ahora
  };
}

/**
 * Detiene la actualización automática
 */
function detenerActualizacionAutomatica() {
  if (intervaloActualizacion) {
    clearInterval(intervaloActualizacion);
    intervaloActualizacion = null;
    console.log("Monitoreo automático detenido");
  }
}

module.exports = {
  actualizarDatos,
  iniciarActualizacionAutomatica,
  detenerActualizacionAutomatica,
  obtenerUltimosSegundos,
  calcularPromedio,
  getCurrentInstrumentModel: () => currentInstrumentModel
};