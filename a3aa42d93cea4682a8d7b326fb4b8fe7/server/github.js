const encodeURIComponentComponent = (str) => encodeURIComponent(str);

// Extract user/repo from GitHub URL
function extrairUserRepo(repoUrl) {
  const match = repoUrl.match(/github\.com[\/:]?([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error('Invalid repo URL');
  return [match[1], match[2]];
}

// Fetch root files
async function fetchRootFiles(user, repo) {
  const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents`;
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'HTMX-GitHub-Visualizer/1.0',
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return await response.json();
}

// Fetch dir files
async function fetchDirFiles(user, repo, path = '') {
  const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'HTMX-GitHub-Visualizer/1.0',
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return await response.json();
}

// Fetch file content
async function fetchFileContent(user, repo, path) {
  const contentsUrl = `https://api.github.com/repos/${user}/${repo}/contents/${encodeURIComponentComponent(path)}`;
  const fileInfoRes = await fetch(contentsUrl, {
    headers: {
      'User-Agent': 'HTMX-GitHub-Visualizer/1.0',
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!fileInfoRes.ok) throw new Error(`API Error: ${fileInfoRes.status}`);
  const fileInfo = await fileInfoRes.json();
  if (fileInfo.type !== 'file') throw new Error('Not a file');

  const contentRes = await fetch(fileInfo.download_url, {
    headers: {
      'User-Agent': 'HTMX-GitHub-Visualizer/1.0',
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!contentRes.ok) throw new Error(`Download Error: ${contentRes.status}`);
  return await contentRes.text();
}

// Sanitize HTML: remove external script/link
function sanitizeHtml(html) {
  // Remove <script src="http..."></script>
  html = html.replace(/<script\b[^<]*(src\s*=\s*["'][^"']*https?:\/\/[^"']*["'][^>]*)[^<]*<\/script>/gi, '');
  // Remove <link rel="stylesheet" href="http...">
  html = html.replace(/<link\b[^<]*(rel\s*=\s*"stylesheet"\s+[^>]*(href\s*=\s*["'][^"']*https?:\/\/[^"']*["'][^>]*)[^<]*\/?>/gi, '');
  return html;
}

// Check if HTML file
function isHtmlFile(ext) {
  return ['html', 'htm'].includes(ext);
}

module.exports = {
  extrairUserRepo,
  fetchRootFiles,
  fetchDirFiles,
  fetchFileContent,
  sanitizeHtml,
  isHtmlFile
};