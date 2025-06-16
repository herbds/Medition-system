const fetchData = require('../api/fetchData');

let datos = [];

async function actualizarDatos(instrumentModel) {
  try {
    // Validación básica del input
    if (typeof instrumentModel !== 'string' || instrumentModel.trim() === '') {
      console.warn('Modelo de instrumento no válido. Se usará "default"');
      instrumentModel = 'default';
    }

    // Obtener datos reales de la API
    const nuevosDatos = await fetchData('historical', instrumentModel);
    
    // Validar estructura antes de asignar
    if (Array.isArray(nuevosDatos)) {
      datos = nuevosDatos;
      
      // Log para verificación (solo si hay datos)
      if (datos.length > 0) {
        console.log("Datos actualizados desde API. Registros:", datos.length);
        console.log("Primer registro:", datos[0]);
        console.log("Último registro:", datos[datos.length - 1]);
      } else {
        console.log("Se actualizaron los datos pero el array está vacío");
      }
    } else {
      console.warn("La API no devolvió un array válido. Datos no actualizados");
    }
  } catch (err) {
    console.error("Error al actualizar datos:", err.message); // Mostrar solo el mensaje
    // En caso de error, mantener los datos existentes (o array vacío)
  }
}

function obtenerRango(desde, hasta) {
  // Validación básica de parámetros
  if (!desde || !hasta) {
    console.warn("Fechas desde/hasta no proporcionadas");
    return [];
  }

  console.log("Filtrando datos entre:", desde, "y", hasta);
  
  try {
    const d = new Date(desde);
    const h = new Date(hasta);
    
    // Validar fechas
    if (isNaN(d.getTime()) || isNaN(h.getTime())) {
      console.warn("Una o ambas fechas no son válidas");
      return [];
    }

    const datosFiltrados = datos.filter(item => {
      try {
        const fechaItem = new Date(item.hora);
        return !isNaN(fechaItem.getTime()) && fechaItem >= d && fechaItem <= h;
      } catch {
        return false; // Si falla al parsear fecha, descartar el item
      }
    });
    
    console.log("Registros encontrados:", datosFiltrados.length);
    return datosFiltrados;
  } catch (err) {
    console.error("Error al filtrar datos:", err.message);
    return [];
  }
}

function obtenerUltimos(n) {
  // Validación básica del parámetro
  const cantidad = typeof n === 'number' && n > 0 ? Math.min(n, datos.length) : 10;
  
  if (n !== cantidad) {
    console.warn(`Ajustando cantidad solicitada (${n}) a ${cantidad}`);
  }
  
  return datos.slice(-cantidad);
}

module.exports = {
  actualizarDatos,
  obtenerRango,
  obtenerUltimos
};