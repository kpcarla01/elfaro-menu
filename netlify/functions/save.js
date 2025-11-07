const fs = require('fs');
const path = require('path');
const { writeFile } = require('fs').promises;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { data, level } = JSON.parse(event.body);
    const filePath = path.resolve(__dirname, '../../menu.json');
    
    // Leer archivo actual
    let current = [];
    if (fs.existsSync(filePath)) {
      current = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    // Actualizar según nivel
    if (level === 'precio') {
      data.forEach((row, i) => {
        if (current[i]) current[i].Precio = row.Precio;
      });
    } else {
      current = data;
    }

    // Guardar con formato bonito
    await writeFile(filePath, JSON.stringify(current, null, 2), 'utf-8');
    
    return {
      statusCode: 200,
      body: 'exito: Menú actualizado correctamente'
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: `Error: ${error.message}`
    };
  }
};
