const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;  // Render obliga puerto 10000

app.use(express.static(path.join(__dirname, '.')));

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

app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
