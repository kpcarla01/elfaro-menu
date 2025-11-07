const fs = require('fs');
const path = require('path');

function utf8ToBase64(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  let binary = '';
  data.forEach(byte => binary += String.fromCharCode(byte));
  return Buffer.from(binary, 'binary').toString('base64');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { data, level } = JSON.parse(event.body);
    const token = process.env.GITHUB_TOKEN;
    const repo = 'kpcarla01/elfaro-menu';
    const pathFile = 'menu.json';

    // Leer archivo actual de GitHub
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
      console.log('No existing file, starting new');
    }

    // Actualizar según nivel
    if (level === 'precio') {
      data.forEach((row, i) => {
        if (current[i]) current[i].Precio = row.Precio;
      });
    } else {
      current = data;
    }

    // Preparar contenido para GitHub (base64 UTF-8)
    const content = utf8ToBase64(JSON.stringify(current, null, 2));

    // Obtener SHA actual
    let sha = null;
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/${pathFile}`, {
        headers: { Authorization: `token ${token}`, 'User-Agent': 'netlify' }
      });
      const file = await res.json();
      sha = file.sha;
    } catch (e) {}

    // Commit a GitHub
    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${pathFile}`, {
      method: 'PUT',
      headers: { Authorization: `token ${token}`, 'User-Agent': 'netlify', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Actualizar menú desde admin', content, sha })
    });

    if (response.ok) {
      return { statusCode: 200, body: 'exito: Menú actualizado y guardado en GitHub' };
    } else {
      const err = await response.json();
      return { statusCode: 500, body: `Error GitHub: ${err.message}` };
    }
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
};
