const axios = require('axios');
require('dotenv').config();

async function fetchData(timeConfig, instrumentModel) {
  try {
    console.log("Obteniendo datos de la API...");
    
    // 1. Configuración robusta de URL
    const baseUrl = timeConfig === 'historical' 
      ? process.env.API_URL_Historical 
      : process.env.API_URL_Lastest;

    if (!baseUrl) {
      console.error('URL base no configurada');
      return [];
    }

    // 2. Petición HTTP con timeout
    const response = await axios.get(baseUrl, { timeout: 5000 });
    
    // 3. Validación estructural de la respuesta
    if (!response?.data?.readings || !Array.isArray(response.data.readings)) {
      console.warn('Estructura de datos inválida');
      return [];
    }

    // 4. Procesar cada lectura
    const processedData = [];
    
    for (const reading of response.data.readings) {
      try {
        // Saltar registros que no son individual_reading
        if (reading.record_type !== 'individual_reading') continue;

        // Parsear el reading_data que está como string JSON
        const parsedReading = JSON.parse(reading.reading_data);
        
        // 5. Validación campo por campo con descarte silencioso
        const validFields = {
          position: parsedReading.position?.toString(),
          wind_speed: parseFloat(parsedReading.wind_speed),
          timestamp: new Date(parsedReading.timestamp || reading.capture_timestamp),
          unit: parsedReading.unit?.toString()
        };

        // Verificación de valores requeridos
        if (
          !validFields.position ||
          isNaN(validFields.wind_speed) ||
          isNaN(validFields.timestamp.getTime()) ||
          !validFields.unit
        ) {
          console.warn('Datos incompletos o inválidos en registro:', reading.id);
          continue;
        }

        // 6. Construcción del objeto final con valores saneados
        processedData.push({
          instrumentModel: instrumentModel || 'Extech 45170', // Usar el valor por defecto de tu API
          position: validFields.position,
          velocidad: validFields.wind_speed,
          hora: validFields.timestamp.toISOString()
        });
      } catch (e) {
        console.warn('Error procesando registro:', reading.id, e.message);
      }
    }

    console.log('Datos procesados correctamente. Registros:', processedData.length);
    return processedData;

  } catch (error) {
    // 7. Manejo centralizado de errores
    switch (true) {
      case error.code === 'ECONNABORTED':
        console.warn('Timeout al conectar con la API');
        break;
      case error.response?.status === 404:
        console.warn('Endpoint no encontrado');
        break;
      case error.response?.status >= 500:
        console.warn('Error del servidor');
        break;
      default:
        console.warn('Error inesperado:', error.message);
    }
    
    return []; // Siempre retorna array (vacío si hay problemas)
  }
}

module.exports = fetchData;