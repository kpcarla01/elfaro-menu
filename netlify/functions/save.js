const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const { data, level } = JSON.parse(event.body);
  const filePath = path.join(__dirname, '../../menu.json');
  let current = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (level === 'precio') {
    data.forEach((row, i) => {
      if (current[i]) current[i].Precio = row.Precio;
    });
  } else {
    current = data;
  }

  fs.writeFileSync(filePath, JSON.stringify(current, null, 2));
  return { statusCode: 200, body: 'exito: Menú actualizado' };
};
