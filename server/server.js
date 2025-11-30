const express = require('express');
const path = require('path');
const github = require('./github');
const ejs = require('ejs');

const app = express();

// ========================
// CONFIGURAÇÕES BÁSICAS
// ========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// ENGINE EJS
app.set('views', path.join(__dirname, '../views'));
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');

// ========================
// ROTA PRINCIPAL (index.html)
// ========================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ========================
// ROTA DE SAUDAÇÃO
// ========================
app.get('/greeting', (req, res) => {
  const greetings = [
    'Olá, mundo!',
    'Bonjour, le monde!',
    'Hola, mundo!',
    'Hello, Welt!',
    'Ciao, mondo!',
    'Привет, мир!',
    'שלום עולם!',
    'مرحبا بالعالم!'
  ];

  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

  res.send(`
    <div class="greeting">
      <p>${randomGreeting}</p>
      <p>🔐 Saudação especial pra você!</p>
    </div>
  `);
});

// ========================
// 🔐 ETAPA 1–4 — LOAD REPO
// ========================
async function loadRepoHandler(req, res) {
  console.log('=== LOAD REPO ===', {
    method: req.method,
    body: req.body,
    query: req.query
  });

  const repoUrl = req.body?.repoUrl || req.query.repoUrl;

  if (!repoUrl) {
    return res.status(400).send('<p style="color:red;">🔐 URL do GitHub obrigatória!</p>');
  }

  // Extrair user/repo corretamente
  const parsed = github.extrairUserRepo(repoUrl);

  if (!parsed) {
    return res.status(400).send('<p style="color:red;">🔐 URL inválida do GitHub!</p>');
  }

  const { user, repo } = parsed;

  try {
    const files = await github.listarConteudo(user, repo);

    res.render('sidebar', {
      files,
      user,
      repo,
      root: true
    });
  } catch (error) {
    console.error('Load repo error:', error);
    res.status(500).send(`
      <p style="color:red;">
        🔐 Erro ao carregar ${user}/${repo}: ${error.message}
      </p>
    `);
  }
}

app.post('/load-repo', loadRepoHandler);
app.get('/load-repo', loadRepoHandler);

// ========================
// 🔐 ETAPA 4 — LISTAR PASTAS
// ========================
app.get('/list-dir', async (req, res) => {
  const { user, repo, path: folder = '' } = req.query;

  if (!user || !repo) {
    return res.status(400).send('<ul><li style="color:red;">🔐 Parâmetros inválidos</li></ul>');
  }

  try {
    const files = await github.listarPasta(user, repo, folder);

    res.render('sidebar', {
      files,
      user,
      repo,
      root: false
    });
  } catch (error) {
    console.error('Erro ao listar diretório:', error);
    res.status(500).send(`
      <ul><li style="color:red;">🔐 Erro ao carregar pasta</li></ul>
    `);
  }
});

// ========================
// 🔐 ETAPA 5–6 — CARREGAR ARQUIVO: PREVIEW + CÓDIGO
// ========================
app.get('/load-file', async (req, res) => {
  const { path: filePath, user, repo, mode = 'split' } = req.query;

  if (!filePath || !user || !repo) {
    return res.status(400).send(`
      <div style="color:red; text-align:center; padding:2rem;">
        🔐 Parâmetros inválidos!
      </div>
    `);
  }

  try {
    const rawContent = await github.carregarArquivo(user, repo, filePath);

    const ext = filePath.split('.').pop().toLowerCase();
    const isHTML = github.isHtmlFile(filePath);

    let safeContent = rawContent;
    if (isHTML) {
      safeContent = github.sanitizeHtml(rawContent);
    }

    // Escape seguro
    let escaped;
    if (isHTML) {
      escaped = safeContent
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\\/g, '\\\\');
    } else {
      escaped = safeContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    // Linguagens Prism
    const langMap = {
      js: 'javascript', ts: 'typescript', jsx: 'jsx', tsx: 'tsx',
      css: 'css', scss: 'scss', less: 'less',
      json: 'json', md: 'markdown', mdx: 'markdown',
      py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
      sh: 'bash', yaml: 'yaml', yml: 'yaml',
      txt: 'text', log: 'text'
    };
    const language = langMap[ext] || 'text';

    // PREVIEW
    let previewHTML;
    if (isHTML) {
      previewHTML = `
        <div class="preview-container">
          <iframe
            class="preview-iframe"
            srcdoc="${escaped}"
            sandbox="allow-scripts allow-same-origin"
            frameborder="0"
          ></iframe>
        </div>
      `;
    } else {
      previewHTML = `
        <div class="no-preview">
          Preview disponível apenas para arquivos HTML 🔐
        </div>
      `;
    }

    // CÓDIGO
    const codeHTML = `
      <div class="code-view">
        <pre><code class="language-${language}">${escaped}</code></pre>
      </div>
    `;

    const filename = filePath.split('/').pop();

    if (mode === 'preview') {
      res.render('preview', {
        filename,
        path: filePath,
        user,
        repo,
        mode,
        content: previewHTML
      });
    } else if (mode === 'code') {
      res.render('code', {
        filename,
        path: filePath,
        user,
        repo,
        mode,
        code: codeHTML,
        language
      });
    } else {
      res.render('split', {
        filename,
        path: filePath,
        user,
        repo,
        mode,
        previewContent: previewHTML,
        codeContent: codeHTML
      });
    }
  } catch (error) {
    console.error('Erro ao carregar arquivo:', error);
    res.status(500).send(`
      <div style="color:red; text-align:center; padding:2rem;">
        🔐 Erro ao carregar ${filePath}: ${error.message}
      </div>
    `);
  }
});

// ========================
// INICIAR SERVIDOR
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
