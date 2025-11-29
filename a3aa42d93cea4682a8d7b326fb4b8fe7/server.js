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
    'העולם שלום!',
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

// 🆕 ETAPA 1: Rota para carregar repositório GitHub e listar arquivos na sidebar
app.post('/load-repo', async (req, res) => {
  const { githubUrl } = req.body;
  
  if (!githubUrl) {
    return res.status(400).send('<p style="color:red;">❌ URL do GitHub é obrigatória!</p>');
  }

  // Extrair user/repo da URL: https://github.com/user/repo → user/repo
  const match = githubUrl.match(/github\.com[\/]+([^\/]+)\/([^\/\?]+)/);
  if (!match) {
    return res.status(400).send('<p style="color:red;">❌ URL inválida! Use: https://github.com/USER/REPO</p>');
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

    // Gerar HTML para sidebar com lista clicável
    let html = '<h3>📂 ' + repo + '</h3><ul>';
    files.forEach(file => {
      const icon = file.type === 'dir' ? '📁' : '📄';
      html += `<li><a href="#" hx-get="/load-file?path=${encodeURIComponent(file.path)}&repo=${repo}&user=${user}" hx-target="#main-content" hx-push-url="true">${icon} ${file.name}</a></li>`;
    });
    html += '</ul>';

    res.send(html);
  } catch (error) {
    console.error('Erro ao carregar repo:', error);
    res.status(500).send(`<p style="color:red;">❌ Erro ao carregar ${user}/${repo}: ${error.message}</p>`);
  }
});

// Placeholder para /load-file (Etapas futuras)
app.get('/load-file', (req, res) => {
  res.send('<div class="content-container"><h1>🛠️ Em construção</h1><p>Preview/código deste arquivo em breve!</p></div>');
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});