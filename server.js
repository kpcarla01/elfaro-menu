const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT;  // ¡SOLO ESTO! Render asigna el puerto

// Servir archivos estáticos
app.use(express.static(__dirname));

// Inyectar token en admin.html
app.get('/admin.html', (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
  html = html.replace('{{GITHUB_TOKEN}}', process.env.GITHUB_TOKEN || '');
  res.send(html);
});

// Ruta para cualquier archivo
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Not Found');
  }
});

// ESCUCHAR EN EL PUERTO QUE RENDER ASIGNA
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
