const express = require('express');
const router = express.Router();
const { actualizarDatos, obtenerRango } = require('../data/dataStoreHistorics');
const ExcelJS = require('exceljs');

// /api/historics/actualizar
router.get('/actualizar', (req, res) => {
  const instrumentModel = req.query.instrumentModel || 'default';
  actualizarDatos(instrumentModel);
  res.json({ mensaje: 'Datos actualizados' });
});

// /api/historics/rango
router.get('/rango', (req, res) => {
  const { desde, hasta } = req.query;
  if (!desde || !hasta) {
    return res.status(400).json({ error: 'Parámetros "desde" y "hasta" requeridos' });
  }
  const datos = obtenerRango(desde, hasta);
  res.json(datos);
});

// /api/historics/descargar
router.get('/descargar', async (req, res) => {
  const { desde, hasta, formato = 'excel' } = req.query;
  if (!desde || !hasta) {
    return res.status(400).send('Faltan parámetros "desde" y "hasta".');
  }

  const datos = obtenerRango(desde, hasta);

  if (formato === 'csv') {
    // Crear CSV con los campos correctos
    const encabezados = 'Equipo,Posición,Velocidad Viento (km/h),Fecha y Hora';
    const filas = datos.map(d => {
      return `"${d.instrumentModel || ''}","${d.position || ''}",${d.velocidad ?? ''},"${d.hora ? new Date(d.hora).toLocaleString() : ''}"`;
    });

    const csv = [encabezados, ...filas].join('\n');
    const desdeSafe = desde.replace(/[:T]/g, '-');
    const hastaSafe = hasta.replace(/[:T]/g, '-');
    const nombre = `datos_${desdeSafe}_a_${hastaSafe}.csv`;

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="${nombre}"`);
    res.send(csv);
  } else {
    // Crear Excel con los campos correctos
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Datos Meteorológicos');

      worksheet.columns = [
        { header: 'Equipo', key: 'instrumentModel', width: 20 },
        { header: 'Posición', key: 'position', width: 20 },
        { header: 'Velocidad Viento (km/h)', key: 'velocidad', width: 25 },
        { header: 'Fecha y Hora', key: 'hora', width: 25 }
      ];

      // Estilo del encabezado
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' }
        };
        cell.alignment = { horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Agregar datos
      datos.forEach(d => {
        worksheet.addRow({
          instrumentModel: d.instrumentModel || '',
          position: d.position || '',
          velocidad: d.velocidad ?? '',
          hora: d.hora ? new Date(d.hora).toLocaleString() : ''
        });
      });

      // Aplicar bordes y formato a todas las celdas con datos
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'center' };
          });
        }
      });

      // Agregar información adicional
      const infoRow = worksheet.rowCount + 2;
      worksheet.getCell(`A${infoRow}`).value = 'Rango de datos:';
      worksheet.getCell(`A${infoRow}`).font = { bold: true };
      worksheet.getCell(`B${infoRow}`).value = `${new Date(desde).toLocaleString()} - ${new Date(hasta).toLocaleString()}`;

      worksheet.getCell(`A${infoRow + 1}`).value = 'Total de registros:';
      worksheet.getCell(`A${infoRow + 1}`).font = { bold: true };
      worksheet.getCell(`B${infoRow + 1}`).value = datos.length;

      worksheet.getCell(`A${infoRow + 2}`).value = 'Generado el:';
      worksheet.getCell(`A${infoRow + 2}`).font = { bold: true };
      worksheet.getCell(`B${infoRow + 2}`).value = new Date().toLocaleString();

      // Configurar respuesta
      const desdeSafe = desde.replace(/[:T]/g, '-');
      const hastaSafe = hasta.replace(/[:T]/g, '-');
      const nombre = `datos_${desdeSafe}_a_${hastaSafe}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Error generando Excel:', error);
      res.status(500).json({ error: 'Error al generar archivo Excel' });
    }
  }
});

module.exports = router;