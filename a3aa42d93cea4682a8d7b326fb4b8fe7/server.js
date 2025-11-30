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
    'שלום עולם',
    'مرحبا بالعالم'
  ];

  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  res.send(`
    <div class="greeting">
      <p>${randomGreeting}</p>
      <p>🚀 Saudação especial para você!</p>
    </div>
  `);
});

// 🚀 ETAPA 1-4: Rota para carregar repositório GitHub e listar arquivos na sidebar
app.post('/load-repo', async (req, res) => {
  const { githubUrl } = req.body;
  
  if (!githubUrl) {
    return res.status(400).send('<p style="color:red;">🚀 URL do GitHub é obrigatória!</p>');
  }

  // Extrair user/repo da URL: https://github.com/user/repo 
  const match = githubUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\?]+)/);
  if (!match) {
    return res.status(400).send('<p style="color:red;">🚀 URL GitHub inválida! Use: https://github.com/USER/REPO</p>');
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
    let html = `<h4 style="margin-bottom:1rem;color:#333;font-size:1.1rem;">🚀 ${repo}</h4>`;
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
    res.status(500).send(`<p style="color:red;">🚀 Erro ao carregar ${user}/${repo}: ${error.message}</p>`);
  }
});

// 🚀 ETAPA 4: Rota recursiva para listar subpastas
app.get('/list-dir', async (req, res) => {
  const { user, repo, path = '' } = req.query;

  if (!user || !repo) {
    return res.status(400).send('<ul><li style="color:red;">🚀 Parâmetros inválidos</li></ul>');
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
    res.status(500).send('<ul><li style="color:red;">🚀 Erro ao carregar pasta</li></ul>');
  }
});

// 🚀 ETAPA 5-6: Carregar conteúdo do arquivo selecionado
app.get('/load-file', async (req, res) => {
  const { path: filePath, user, repo, mode = 'preview' } = req.query;

  if (!filePath || !user || !repo) {
    return res.status(400).send('<div style="color:red; text-align:center; padding:2rem;">🚀 Parâmetros inválidos!</div>');
  }

  try {
    const contentsUrl = `https://api.github.com/repos/${user}/${repo}/contents/${encodeURIComponent(filePath)}`;
    const fileInfoRes = await fetch(contentsUrl, {
      headers: { 'User-Agent': 'HTMX-GitHub-Visualizer/1.0' }
    });

    if (!fileInfoRes.ok) {
      throw new Error(`API Error: ${fileInfoRes.status}`);
    }

    const fileInfo = await fileInfoRes.json();

    if (fileInfo.type !== 'file') {
      return res.status(400).send('<div style="color:red; text-align:center; padding:2rem;">🚀 Só é um arquivo!</div>');
    }

    const contentRes = await fetch(fileInfo.download_url, {
      headers: { 'User-Agent': 'HTMX-GitHub-Visualizer/1.0' }
    });

    if (!contentRes.ok) {
      throw new Error(`Download Error: ${contentRes.status}`);
    }

    let content = await contentRes.text();

    const ext = filePath.split('.').pop()?.toLowerCase();
    const isHTML = ['html','htm'].includes(ext);

    // Escapings
    let escaped;
    if (isHTML && mode === 'preview') {
      // Minimal escape for srcdoc iframe
      escaped = content.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/`/g, '&#96;');
    } else {
      // Full HTML escape for code view
      escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Toggle buttons
    const previewBtnClass = (mode === 'preview' ? 'active' : '') + (isHTML ? '' : ' disabled');
    const previewDisabled = !isHTML ? 'disabled' : '';
    const previewHref = !isHTML ? '#' : `/load-file?path=${encodeURIComponent(filePath)}&user=${encodeURIComponent(user)}&repo=${encodeURIComponent(repo)}&mode=preview`;

    const codeBtnClass = mode === 'code' ? 'active' : '';

    const toggleHTML = `
      <div class="mode-toggle">
        <button class="btn-mode ${previewBtnClass}" 
                hx-get="${previewHref}" 
                hx-target="#main-content" 
                hx-swap="innerHTML" 
                hx-push-url="true"
                ${previewDisabled}>
          📄 Preview
        </button>
        <button class="btn-mode ${codeBtnClass}" 
                hx-get="/load-file?path=${encodeURIComponent(filePath)}&user=${encodeURIComponent(user)}&repo=${encodeURIComponent(repo)}&mode=code" 
                hx-target="#main-content" 
                hx-swap="innerHTML" 
                hx-push-url="true">
          🧱 Código
        </button>
      </div>
    `;

    // Title
    const title = `<h2 class="file-title">${mode === 'preview' ? '📄 Preview' : '🧱 Código'}: ${filePath}</h2>`;

    let contentHTML;
    if (mode === 'preview' && isHTML) {
      contentHTML = `
        <div class="preview-container">
          <iframe srcdoc="${escaped}" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" frameborder="0"></iframe>
        </div>
      `;
    } else {
      // Code view
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

      let extra = '';
      if (mode === 'preview' && !isHTML) {
        extra = '<p style="color: #11998e; text-align:center; font-style:italic; margin:1rem 0;">🔸 Preview disponível apenas para arquivos .html/.htm</p>';
      }

      contentHTML = `
        <div class="code-view">
          <pre><code class="language-${lang}">${escaped}</code></pre>
        </div>
        ${extra}
      `;
    }

    res.send(title + toggleHTML + contentHTML);
  } catch (error) {
    console.error('Erro ao carregar arquivo:', error);
    res.status(500).send(`<div style="color:red; text-align:center; padding:2rem;">🚀 Erro ao carregar ${filePath}: ${error.message}</div>`);
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
