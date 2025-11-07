exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const { data, level } = JSON.parse(event.body);
  const token = process.env.GITHUB_TOKEN;
  const repo = 'kpcarla01/elfaro-menu';
  const path = 'menu.json';

  let current = [];
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: { Authorization: `token ${token}`, 'User-Agent': 'netlify' }
    });
    const file = await res.json();
    current = JSON.parse(atob(file.content));
  } catch (e) {}

  if (level === 'precio') {
    data.forEach((row, i) => {
      if (current[i]) current[i].Precio = row.Precio;
    });
  } else {
    current = data;
  }

  const content = btoa(JSON.stringify(current, null, 2));
  const sha = (await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: { Authorization: `token ${token}`, 'User-Agent': 'netlify' }
  }).then(r => r.json())).sha;

  await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, 'User-Agent': 'netlify' },
    body: JSON.stringify({ message: 'Actualizar menú', content, sha })
  });

  return { statusCode: 200, body: 'exito: Menú actualizado' };
};
