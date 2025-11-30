const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));  // Serve static files if any

// Serve index.html on main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint for personalized greeting
app.get('/greeting', (req, res) => {
  const greetings = [
    'Olá, mundo! ',
    'Bonjour, le monde! ',
    'Hola, mundo! ',
    'Hello, Welt! ',
    'Ciao, mondo! ',
    'Привет, мир! ',
    'שלום עולם! ',
    'مرحبا بالعالم! ',
  ];

  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

  res.send(`
    <div class="greeting">
      <p>${randomGreeting}</p>
      <p>😊 Saudação especial pra você! </p>
    </div>
  `);
});

// 🚀 ETAPA 1-4: Load repo + recursive dir listing
async function loadRepoHandler(req, res) {
  console.log('=== LOAD REPO ===', { method: req.method, body: req.body, query: req.query });
  const repoUrl = req.body?.repoUrl || req.query.repoUrl;

  if (!repoUrl) {
    console.log('Missing repoUrl');
    return res.status(400).send('<p style="color:red;">😊 URL do GitHub obrigatória!</p>');
  }

  // Extract user/repo from URL: https://github.com/user/repo
  const match = repoUrl.match(/github\.com[\/:]?([^\\/]+)\/([^\\/]+)/);
  console.log('Regex match:', match);
  if (!match) {
    console.log('Invalid repo URL');
    return res.status(400).send('<p style="color:red;">😊 URL GitHub inválida! Use: https://github.com/USERNAME/REPO</p>');
  }

  const [, user, repo] = match;
  console.log('Parsed:', { user, repo });

  try {
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents`;

    const fetchResponse = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'HTMX-GitHub-Visualizer/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    console.log('GitHub API status:', fetchResponse.status, apiUrl);

    if (!fetchResponse.ok) {
      throw new Error(`API Error: ${fetchResponse.status}`);
    }

    const files = await fetchResponse.json();

    // Generate HTML for #repo-list with expandable folders
    let html = `<h4 style="margin-bottom:1rem;color:#333;font-size:1.1rem;">😊 ${repo}</h4>`;
    html += '<ul>';

    files.forEach(file => {
      const icon = file.type === 'dir' ? '📁 ' : '📄 ';
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
    console.error('Load repo error:', error);
    res.status(500).send(`<p style="color:red;">😊 Erro ao carregar ${user}/${repo}: ${error.message}</p>`);
  }
}

// Dual support: POST (body) + GET (query) to avoid 404 issues
app.post('/load-repo', loadRepoHandler);
app.get('/load-repo', loadRepoHandler);

// 🚀 ETAPA 4: Recursive route for subdirectories
app.get('/list-dir', async (req, res) => {
  const { user, repo, path = '' } = req.query;

  if (!user || !repo) {
    return res.status(400).send('<ul><li style="color:red;">😊 Parâmetros inválidos</li></ul>');
  }

  try {
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;

    const fetchResponse = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'HTMX-GitHub-Visualizer/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!fetchResponse.ok) {
      throw new Error(`API Error: ${fetchResponse.status}`);
    }

    const items = await fetchResponse.json();

    let html = '<ul>';
    items.forEach(item => {
      const icon = item.type === 'dir' ? '📁 ' : '📄 ';
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
    console.error('Erro ao listar diretórios:', error);
    res.status(500).send('<ul><li style="color:red;">😊 Erro ao carregar pasta</li></ul>');
  }
});

// 🚀 ETAPA 5-6: Load file content w/ preview/code split view (always both, no mode toggle)
app.get('/load-file', async (req, res) => {
  const { path: filePath, user, repo } = req.query;

  if (!filePath || !user || !repo) {
    return res.status(400).send('<div style="color:red; text-align:center; padding:2rem;">😊 Parâmetros inválidos!</div>');
  }

  try {
    const contentsUrl = `https://api.github.com/repos/${user}/${repo}/contents/${encodeURIComponent(filePath)}`;
    const fileInfoRes = await fetch(contentsUrl, {
      headers: {
        'User-Agent': 'HTMX-GitHub-Visualizer/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!fileInfoRes.ok) {
      throw new Error(`API Error: ${fileInfoRes.status}`);
    }

    const fileInfo = await fileInfoRes.json();

    if (fileInfo.type !== 'file') {
      return res.status(400).send('<div style="color:red; text-align:center; padding:2rem;">😊 É um arquivo!</div>');
    }

    const contentRes = await fetch(fileInfo.download_url, {
      headers: {
        'User-Agent': 'HTMX-GitHub-Visualizer/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!contentRes.ok) {
      throw new Error(`Download Error: ${contentRes.status}`);
    }

    let content = await contentRes.text();

    const ext = filePath.split('.').pop()?.toLowerCase();
    const isHTML = ['html', 'htm'].includes(ext);

    // Escaping
    let escaped;
    if (isHTML) {
      // Minimal escape for srcdoc iframe
      escaped = content.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\\/g, '&amp;');
    } else {
      // Full HTML escape for code view
      escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Language map for Prism
    const langMap = {
      js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
      css: 'css', scss: 'scss', less: 'less',
      json: 'json',
      md: 'markdown', mdx: 'markdown',
      py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
      sh: 'bash', yaml: 'yaml', yml: 'yaml',
      txt: 'text', log: 'text'
    };
    const lang = langMap[ext] || 'text';

    let previewHTML, codeHTML, extra = '';
    if (isHTML) {
      previewHTML = `
        <div class="preview-container">
          <iframe srcdoc="${escaped}" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" frameborder="0"></iframe>
        </div>
        `;
    } else {
      previewHTML = '<div class="no-preview">Preview disponível apenas para arquivos HTML 😊</div>';
      extra = '<p style="color: #11998e; text-align:center; font-style:italic; margin:1rem 0;">Preview disponível apenas para arquivos .html/.htm</p>';
    }

    codeHTML = `
      <div class="code-view">
        <pre><code class="language-${lang}">${escaped}</code></pre>
        ${extra}
      </div>
      `;

    // Full template: title + split panels
    const title = `<h2 class="file-title">${filePath}</h2>`;
    const template = `
      ${title}
      <div class="split-main">
        <div id="preview-panel">
          ${previewHTML}
        </div>
        <div id="code-panel">
          ${codeHTML}
        </div>
      </div>
    `;

    res.send(template);
  } catch (error) {
    console.error('Erro ao carregar arquivo:', error);
    res.status(500).send(`<div style="color:red; text-align:center; padding:2rem;">😊 Erro ao carregar ${filePath}: ${error.message}</div>`);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});