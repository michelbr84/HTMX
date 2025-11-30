const express = require('express');
const path = require('path');
const github = require('./github');
const ejs = require('ejs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));  // Serve static from root/public

// EJS setup
app.set('views', path.join(__dirname, '../views'));
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');

// Serve index.html on main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
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
      <p>🔐 Saudão especial pra você! </p>
    </div>
  `);
});

// 🔐 ETAPA 1-4: Load repo + recursive dir listing
async function loadRepoHandler(req, res) {
  console.log('=== LOAD REPO ===', { method: req.method, body: req.body, query: req.query });
  const repoUrl = req.body?.repoUrl || req.query.repoUrl;

  if (!repoUrl) {
    console.log('Missing repoUrl');
    return res.status(400).send('<p style="color:red;">🔐 URL do GitHub obrigatória!</p>');
  }

  // Extract user/repo from URL: https://github.com/user/repo
  const [user, repo] = github.extrairUserRepo(repoUrl);
  console.log('Parsed:', { user, repo });

  try {
    const files = await github.fetchRootFiles(user, repo);

    // Render sidebar view
    res.render('sidebar', { files, user, repo, root: true });
  } catch (error) {
    console.error('Load repo error:', error);
    res.status(500).send(`<p style="color:red;">🔐 Erro ao carregar ${user}/${repo}: ${error.message}</p>`);
  }
}

// Dual support: POST (body) + GET (query) to avoid 404 issues
app.post('/load-repo', loadRepoHandler);
app.get('/load-repo', loadRepoHandler);

// 🔐 ETAPA 4: Recursive route for subdirectories
app.get('/list-dir', async (req, res) => {
  const { user, repo, path = '' } = req.query;

  if (!user || !repo) {
    return res.status(400).send('<ul><li style="color:red;">🔐 Parâmetros inválidos</li></ul>');
  }

  try {
    const files = await github.fetchDirFiles(user, repo, path);

    res.render('sidebar', { files, user, repo, root: false });
  } catch (error) {
    console.error('Error ao listar diretórios:', error);
    res.status(500).send('<ul><li style="color:red;">🔐 Erro ao carregar pasta</li></ul>');
  }
});

// 🔐 ETAPA 5-6: Load file content w/ preview/code split view (always both, no mode toggle)
app.get('/load-file', async (req, res) => {
  const { path: filePath, user, repo, mode = 'split' } = req.query;

  if (!filePath || !user || !repo) {
    return res.status(400).send('<div style="color:red; text-align:center; padding:2rem;">🔐 Parâmetros inválidos!</div>');
  }

  try {
    const content = await github.fetchFileContent(user, repo, filePath);

    const ext = filePath.split('.').pop()?.toLowerCase();
    const isHTML = github.isHtmlFile(ext);

    // Sanitize
    let safeContent = content;
    if (isHTML) {
      safeContent = github.sanitizeHtml(content);
    }

    // Escaping
    let escaped;
    if (isHTML) {
      // Minimal escape for srcdoc iframe
      escaped = safeContent.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\\/g, '&amp;');
    } else {
      // Full HTML escape for code view
      escaped = safeContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
    const language = langMap[ext] || 'text';

    let previewHTML, codeHTML, extra = '';
    if (isHTML) {
      previewHTML = `
        <div class="preview-container">
          <iframe class="preview-iframe" srcdoc="${escaped}" sandbox="allow-scripts allow-same-origin" frameborder="0"></iframe>
        </div>`;
    } else {
      previewHTML = '<div class="no-preview">Preview disponível apenas para arquivos .html/.htm 🔐</div>';
      extra = '<p style="color: #11998e; text-align:center; font-style:italic; margin:1rem 0;">Preview disponível apenas para arquivos .html/.htm</p>';
    }

    codeHTML = `
      <div class="code-view">
        <pre><code class="language-${language}">${escaped}</code></pre>
        ${extra}
      </div>`;

    // Full template: title + mode toggle + conditional content
    const filename = filePath.split('/').pop();
    if (mode === 'preview') {
      const previewContent = `
        <div class="preview-code-container">
          ${previewHTML}
        </div>`;
      res.render('preview', { filename, path: filePath, user, repo, mode, content: previewContent });
    } else if (mode === 'code') {
      const codeContent = `
        <div class="preview-code-container">
          ${codeHTML}
        </div>`;
      res.render('code', { filename, path: filePath, user, repo, mode, code: codeHTML, language, extra });
    } else { // split (default)
      res.render('split', { filename, path: filePath, user, repo, mode, previewContent: previewHTML, codeContent: codeHTML });
    }
  } catch (error) {
    console.error('Erro ao carregar arquivo:', error);
    res.status(500).send(`<div style="color:red; text-align:center; padding:2rem;">🔐 Erro ao carregar ${filePath}: ${error.message}</div>`);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});