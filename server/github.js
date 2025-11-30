// github.js

// Extrai usuário e repositório da URL do GitHub
function extrairUserRepo(repoUrl) {
  const regex = /github\.com[\/:]([^\/]+)\/([^\/]+)(?:\/)?/;
  const match = repoUrl.match(regex);

  if (!match) return null;

  return {
    user: match[1],
    repo: match[2].replace(/\.git$/, "")
  };
}

// Lista conteúdo de diretório (raiz ou subpasta)
async function listarConteudo(user, repo, path = "") {
  const url = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "HTMX-Visualizer",
      "Accept": "application/vnd.github.v3+json",
      "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
    }
  });

  if (!res.ok) {
    throw new Error(`Erro ao acessar API do GitHub: ${res.status}`);
  }

  return await res.json();
}

// Alias (server.js usa este nome)
async function listarPasta(user, repo, path = "") {
  return listarConteudo(user, repo, path);
}

// Carrega arquivo bruto a partir de download_url
async function carregarArquivo(user, repo, path) {
  const metaUrl = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;

  const metaRes = await fetch(metaUrl, {
    headers: {
      "User-Agent": "HTMX-Visualizer",
      "Accept": "application/vnd.github.v3+json",
      "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
    }
  });

  if (!metaRes.ok) {
    throw new Error(`Erro ao obter metadados: ${metaRes.status}`);
  }

  const meta = await metaRes.json();

  if (!meta.download_url) {
    throw new Error("Arquivo não possui download_url.");
  }

  const rawRes = await fetch(meta.download_url);

  if (!rawRes.ok) {
    throw new Error(`Erro ao baixar arquivo RAW: ${rawRes.status}`);
  }

  return await rawRes.text();
}

// Sanitização para evitar scripts remotos
function sanitizeHtml(html) {
  return html
    .replace(/<script[^>]*src=["'][^"']*["'][^>]*><\/script>/gi, "")
    .replace(/<link[^>]*href=["'][^"']*["'][^>]*>/gi, "");
}

// Verifica se é HTML
function isHtmlFile(filename) {
  return filename.endsWith(".html") || filename.endsWith(".htm");
}

module.exports = {
  extrairUserRepo,
  listarConteudo,
  listarPasta,
  carregarArquivo,
  sanitizeHtml,
  isHtmlFile
};
