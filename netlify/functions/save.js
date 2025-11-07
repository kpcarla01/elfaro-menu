exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { data, level } = JSON.parse(event.body);
    const token = process.env.GITHUB_TOKEN;
    const repo = 'kpcarla01/elfaro-menu';
    const pathFile = 'menu.json';

    // === LIMPIAR PRECIOS (quita puntos, comas, comillas) ===
    data.forEach(row => {
      if (row.Precio) {
        row.Precio = row.Precio
          .replace(/[",.]/g, '')  // Quita comillas, comas y puntos
          .trim();
      }
    });

    // === LEER ARCHIVO ACTUAL DE GITHUB ===
    let current = [];
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/${pathFile}`, {
        headers: { Authorization: `token ${token}`, 'User-Agent': 'netlify' }
      });
      const file = await res.json();
      if (file.content) {
        const content = file.content.replace(/\n/g, '');
        current = JSON.parse(Buffer.from(content, 'base64').toString('utf-8'));
      }
    } catch (e) {
      console.log('No existe menu.json, se creará uno nuevo');
    }

    // === ACTUALIZAR SEGÚN NIVEL ===
    if (level === 'precio') {
      data.forEach((row, i) => {
        if (current[i]) current[i].Precio = row.Precio;
      });
    } else {
      current = data;
    }

    // === CONVERTIR A BASE64 (UTF-8 seguro) ===
    function utf8ToBase64(str) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      let binary = '';
      data.forEach(byte => binary += String.fromCharCode(byte));
      return Buffer.from(binary, 'binary').toString('base64');
    }

    const content = utf8ToBase64(JSON.stringify(current, null, 2));

    // === OBTENER SHA ACTUAL (para actualizar) ===
    let sha = null;
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/${pathFile}`, {
        headers: { Authorization: `token ${token}`, 'User-Agent': 'netlify' }
      });
      const file = await res.json();
      sha = file.sha;
    } catch (e) {}

    // === GUARDAR EN GITHUB ===
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
        sha
      })
    });

    if (response.ok) {
      return { statusCode: 200, body: 'exito: Menú actualizado correctamente' };
    } else {
      const err = await response.json();
      return { statusCode: 500, body: `Error GitHub: ${err.message}` };
    }

  } catch (error) {
    console.error('Error en save.js:', error);
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
};
