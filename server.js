const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Inyectar variables en HTML (GITHUB_TOKEN)
const injectVariables = (html, variables) => {
  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`;
    html = html.replace(new RegExp(placeholder, 'g'), variables[key]);
  });
  return html;
};

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '.')));

// Ruta para admin.html (inyecta token)
app.get('/admin.html', (req, res) => {
  const htmlPath = path.join(__dirname, 'admin.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const variables = { GITHUB_TOKEN: process.env.GITHUB_TOKEN || '' };
  html = injectVariables(html, variables);
  res.send(html);
});

// Ruta para cualquier otro archivo
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Not Found');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
