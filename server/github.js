const fetch = require("node-fetch");

// Extrai user e repo de uma URL GitHub
function extractUserRepo(repoUrl) {
  const regex = /github\.com[\/:]([^\/]+)\/([^\/]+)/;
  const match = repoUrl.match(regex);
  if (!match) return null;

  return {
    user: match[1],
    repo: match[2].replace(/\.git$/, "")
  };
}

// Lista arquivos do diretório raiz
async function fetchRootFiles(user, repo) {
  const url = `https://api.github.com/repos/${user}/${repo}/contents`;
  const res = await fetch(url, {
    headers: { "User-Agent": "HTMX-Visualizer" }
  });
  return await res.json();
}

// Lista arquivos de um diretório específico
async function fetchDirFiles(user, repo, path) {
  const url = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "HTMX-Visualizer" }
  });
  return await res.json();
}

// Baixa conteúdo bruto de um arquivo
async function fetchFileContent(user, repo, path) {
  const url = `https://raw.githubusercontent.com/${user}/${repo}/main/${path}`;
  const res = await fetch(url);
  return await res.text();
}

// Remove scripts externos
function sanitizeHtml(html) {
  return html
    .replace(/<script[^>]*src=["'][^"']+["'][^>]*><\/script>/gi, "")
    .replace(/<link[^>]*href=["'][^"']+["'][^>]*>/gi, "");
}

// Verifica se é arquivo HTML
function isHtmlFile(filename) {
  return filename.endsWith(".html") || filename.endsWith(".htm");
}

module.exports = {
  extractUserRepo,
  fetchRootFiles,
  fetchDirFiles,
  fetchFileContent,
  sanitizeHtml,
  isHtmlFile
};
