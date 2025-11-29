const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files if any

// Serve o arquivo index.html na rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para saudação personalizada
app.get('/greeting', (req, res) => {
  const greetings = [
    'Olá, mundo!',
    'Bonjour, le monde!',
    'Hola, mundo!',
    'Hello, Welt!',
    'Ciao, mondo!',
    'Привет, мир!',
    'שלום עולם!',
    'مرحبا بالعالم'
  ];

  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

  res.send(`
    <div class="greeting">
      <p>${randomGreeting}</p>
      <p>😊 Saudação especial para você!</p>
    </div>
  `);
});

// ✅ ETAPA 1-4: Rota para carregar repositório GitHub e listar arquivos na sidebar
app.post('/load-repo', async (req, res) => {
  const { githubUrl } = req.body;

  if (!githubUrl) {
    return res.status(400).send('<p style="color:red;">🔒 URL do GitHub é obrigatória!</p>');
  }

  // Extrair user/repo da URL: https://github.com/user/repo
  const match = githubUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\?]+)/);
  if (!match) {
    return res.status(400).send('<p style="color:red;">🔒 URL GitHub inválida! Use: https://github.com/USUARIO/REPO</p>');
  }

  const [, user, repo] = match;

  try {
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents`;

    const fetchResponse = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'HTMX-GitHub-Visualizer/1.0'
      }
    });

    if (!fetchResponse.ok) {
      throw new Error(`API Error: ${fetchResponse.status}`);
    }

    const files = await fetchResponse.json();

    // Gerar HTML para #repo-list com pastas expansíveis
    let html = `<h4 style="margin-bottom:1rem;color:#333;font-size:1.1rem;">📂 ${repo}</h4>`;
    html += '<ul>';

    files.forEach(file => {
      const icon = file.type === 'dir' ? '📁' : '📄';
      if (file.type === 'dir') {
        html += `
          <details>
            <summary class="folder-toggle">${icon} ${file.name}</summary>
            <div class="children" 
                 hx-get="/list-dir?user=${encodeURIComponent(user)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(file.path)}" 
                 hx-trigger="revealed" 
                 hx-swap="innerHTML"
                 hx-indicator="#sidebar-spinner">
            </div>
          </details>
        `;
      } else {
        html += `
          <li>
            <a class="file-link" 
               hx-get="/load-file?path=${encodeURIComponent(file.path)}&user=${encodeURIComponent(user)}&repo=${encodeURIComponent(repo)}" 
               hx-target="#main-content" 
               hx-swap="innerHTML">
              ${icon} ${file.name}
            </a>
          </li>
        `;
      }
    });
    html += '</ul>';

    res.send(html);
  } catch (error) {
    console.error('Erro ao carregar repo:', error);
    res.status(500).send(`<p style="color:red;">🔒 Erro ao carregar ${user}/${repo}: ${error.message}</p>`);
  }
});

// ✅ ETAPA 4: Rota recursiva para listar subpastas
app.get('/list-dir', async (req, res) => {
  const { user, repo, path = '' } = req.query;

  if (!user || !repo) {
    return res.status(400).send('<ul><li style="color:red;">❌ Parâmetros inválidos</li></ul>');
  }

  try {
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;

    const fetchResponse = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'HTMX-GitHub-Visualizer/1.0'
      }
    });

    if (!fetchResponse.ok) {
      throw new Error(`API Error: ${fetchResponse.status}`);
    }

    const items = await fetchResponse.json();

    let html = '<ul>';

    items.forEach(item => {
      const icon = item.type === 'dir' ? '📁' : '📄';
      if (item.type === 'dir') {
        html += `
          <details>
            <summary class="folder-toggle">${icon} ${item.name}</summary>
            <div class="children" 
                 hx-get="/list-dir?user=${encodeURIComponent(user)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(item.path)}" 
                 hx-trigger="revealed" 
                 hx-swap="innerHTML">
            </div>
          </details>
        `;
      } else {
        html += `
          <li>
            <a class="file-link" 
               hx-get="/load-file?path=${encodeURIComponent(item.path)}&user=${encodeURIComponent(user)}&repo=${encodeURIComponent(repo)}" 
               hx-target="#main-content" 
               hx-swap="innerHTML">
              ${icon} ${item.name}
            </a>
          </li>
        `;
      }
    });
    html += '</ul>';

    res.send(html);
  } catch (error) {
    console.error('Erro ao listar diretório:', error);
    res.status(500).send('<ul><li style="color:red;">❌ Erro ao carregar pasta</li></ul>');
  }
});

// Placeholder para /load-file (Etapas 5-6 futuras)
app.get('/load-file', (req, res) => {
  const { path, user, repo, mode = 'preview' } = req.query;
  res.send(`
    <div class="content-container">
      <h1>🚧 Em construção</h1>
      <p>Preview/Código deste arquivo em breve!<br>
      Path: <strong>${path}</strong> (${user}/${repo}) | Mode: ${mode}</p>
    </div>
  `);
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});