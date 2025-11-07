const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000; // Render asigna el puerto

// Middlewares
app.use(express.static(__dirname)); // Servir archivos estáticos como index.html, admin.html
app.use(express.json()); // Para parsear el body de las peticiones POST

/**
 * API ENDPOINT SEGURO PARA GUARDAR
 * admin.html llamará a esta URL.
 * El GITHUB_TOKEN solo existe aquí, en el servidor.
 */
app.post('/api/save', async (req, res) => {
  try {
    const { data, level } = req.body;
    const token = process.env.GITHUB_TOKEN;
    const repo = 'kpcarla01/elfaro-menu';
    const pathFile = 'menu.json';

    if (!token) {
      return res.status(500).send('Error: GITHUB_TOKEN no está configurado en el servidor de Render.');
    }

    // LIMPIAR PRECIOS (Lógica movida de save.js)
    data.forEach(row => {
      if (row.Precio) {
        row.Precio = String(row.Precio).replace(/[",.]/g, '').trim();
      }
    });

    // LEER ARCHIVO ACTUAL (Lógica movida de save.js)
    let current = [];
    let sha = null;
    try {
      const fileRes = await fetch(`https://api.github.com/repos/${repo}/contents/${pathFile}`, {
        headers: { Authorization: `token ${token}`, 'User-Agent': 'render' }
      });
      const file = await fileRes.json();
      if (file.content) {
        current = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
        sha = file.sha;
      }
    } catch (e) {
      console.log('Archivo no existe, se creará');
    }

    // ACTUALIZAR DATOS (Lógica movida de save.js)
    let updatedData = current;
    if (level === 'precio') {
      // Fusionar solo los precios
      data.forEach((row, i) => {
        if (updatedData[i]) updatedData[i].Precio = row.Precio;
      });
    } else {
      // Reemplazar todo
      updatedData = data;
    }

    // BASE64 UTF-8 (Lógica movida de save.js)
    const content = Buffer.from(JSON.stringify(updatedData, null, 2), 'utf-8').toString('base64');

    // GUARDAR EN GITHUB (Lógica movida de save.js)
    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${pathFile}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'render',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: level === 'precio' ? 'Actualizar precios' : 'Actualizar menú desde CSV',
        content,
        sha // SIEMPRE INCLUIR SHA
      })
    });

    if (response.ok) {
      res.status(200).send('exito: Menú actualizado correctamente');
    } else {
      const err = await response.json();
      res.status(500).send(`Error GitHub: ${err.message}`);
    }

  } catch (error) {
    console.error('Error en /api/save:', error);
    res.status(500).send(`Error interno: ${error.message}`);
  }
});

// Ruta para cualquier archivo no encontrado (opcional, pero bueno para SPA)
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    // Si no es un archivo, servir index.html (o un 404)
    res.status(404).send('Not Found');
  }
});

// ESCUCHAR EN EL PUERTO QUE RENDER ASIGNA
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
