exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { data, level } = JSON.parse(event.body);
    const token = process.env.GITHUB_TOKEN;
    const repo = 'kpcarla01/elfaro-menu';
    const pathFile = 'menu.json';

    // LIMPIAR PRECIOS
    data.forEach(row => {
      if (row.Precio) {
        row.Precio = row.Precio.replace(/[",.]/g, '').trim();
      }
    });

    // LEER ARCHIVO ACTUAL
    let current = [];
    let sha = null;
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/${pathFile}`, {
        headers: { Authorization: `token ${token}`, 'User-Agent': 'netlify' }
      });
      const file = await res.json();
      if (file.content) {
        current = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
        sha = file.sha;
      }
    } catch (e) {
      console.log('Archivo no existe, se creará');
    }

    // ACTUALIZAR DATOS
    if (level === 'precio') {
      data.forEach((row, i) => {
        if (current[i]) current[i].Precio = row.Precio;
      });
    } else {
      current = data;
    }

    // BASE64 UTF-8
    const content = Buffer.from(JSON.stringify(current, null, 2)).toString('base64');

    // GUARDAR EN GITHUB (SIEMPRE CON SHA ACTUAL)
    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${pathFile}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'netlify',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: level === 'precio' ? 'Actualizar precios' : 'Actualizar menú desde CSV',
        content,
        sha // SIEMPRE INCLUIR SHA
      })
    });

    if (response.ok) {
      return { statusCode: 200, body: 'exito: Menú actualizado correctamente' };
    } else {
      const err = await response.json();
      return { statusCode: 500, body: `Error GitHub: ${err.message}` };
    }

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
};
