# 🚀 HTMX GitHub Visualizer

[![HTMX](https://htmx.org/img/badges/htmx.org.svg)](https://htmx.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-blue.svg)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![GitHub API](https://img.shields.io/badge/GitHub-API-v3-yellow.svg)](https://docs.github.com/en/rest)

## 📖 Descrição

**HTMX GitHub Visualizer** é uma aplicação web moderna e responsiva para explorar repositórios GitHub de forma visual e interativa. Carregue qualquer repo público e navegue arquivos com:

- **Explorador de arquivos** (sidebar com pastas expansíveis via HTMX).
- **Modos de visualização**: Preview (iframe sandbox), Código (Prism highlight), Split (dois painéis redimensionáveis).
- **Recursos premium**: Fullscreen, resize vertical/horizontal, scroll fluido, mobile-first.

Zero dependências frontend pesadas: puro **HTMX + Split.js + Prism.js**.

> **Demo ao vivo**: [https://htmx-github-visualizer.vercel.app](https://htmx-github-visualizer.vercel.app) (ou clone e rode local).

## ✨ Funcionalidades

- ✅ **Carregamento lazy de dirs/arquivos** via GitHub API (recursivo).
- ✅ **Preview seguro**: Iframe com `sandbox="allow-scripts allow-same-origin"` (sanitiza scripts/links externos).
- ✅ **Split View**: Split.js com gutters redimensionáveis (desktop/mobile).
- ✅ **Modos toggle**: Preview / Código / Split (botões com hx-push-url).
- ✅ **Fullscreen Preview**: Botão dedicado (entra/sai).
- ✅ **Syntax Highlight**: Prism.js (suporte JS/CSS/HTML/MD/JSON/etc.).
- ✅ **Responsive**: Mobile stack, sidebar full-width.
- ✅ **Rate Limit friendly**: Suporte opcional a `GITHUB_TOKEN` (5k req/h vs 60/h anônimo).
- ✅ **Sem backend pesado**: Express + EJS views modulares.

## 🛠️ Estrutura do Projeto

```
├── index.html          # Frontend principal (HTMX + CSS/JS externos)
├── public/
│   ├── css/style.css   # Estilos custom (extraídos do inline)
│   └── js/app.js       # Lógica client (fullscreen, split, Prism)
├── server/
│   ├── server.js       # Express rotas + EJS
│   └── github.js       # Helpers GitHub API (fetch + sanitize)
└── views/              # EJS templates (sidebar, preview, code, split)
    ├── sidebar.html
    ├── preview.html
    ├── code.html
    └── split.html
```

## 🚀 Quick Start (Local)

1. **Clone o repo**:
   ```
   git clone https://github.com/michelbr84/HTMX.git
   cd HTMX  # Pasta do app
   ```

2. **Instale dependências**:
   ```
   npm init -y
   npm install express ejs
   ```

3. **Crie GitHub PAT** (opcional, mas recomendado):
   - [github.com/settings/tokens](https://github.com/settings/tokens) > Fine-grained > **Contents: Read**.
   - Copie `ghp_XXX...`.

4. **Rode o servidor**:
   ```
   GITHUB_TOKEN=ghp_seu_token node server.js
   ```
   - Sem token: Funciona (60 req/h), mas pode dar 403 em uso intenso.

5. **Acesse**: [http://localhost:3000](http://localhost:3000)
   - Digite repo: `https://github.com/michelbr84/HTMX`
   - Clique "Carregar Repo" → Explore! 🎉

## 🔧 Desenvolvimento

- **Rate Limit**: Monitore em `curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit`.
- **EJS**: Views server-side para HTMX swaps.
- **Sanitização**: Remove `<script src="http...">` e `<link rel="stylesheet" href="http...">`.
- **Mobile**: Stack vertical + hide gutters.

## 📱 Capturas

![Sidebar + Split](https://via.placeholder.com/800x400/11998e/ffffff?text=Sidebar+%2B+Split+View)
![Preview Fullscreen](https://via.placeholder.com/800x400/38e7fd/ffffff?text=Preview+Fullscreen)
![Mobile](https://via.placeholder.com/800x400/4facfe/ffffff?text=Mobile+Responsive)

## 🤝 Contribuições

1. Fork → Clone → Branch.
2. `npm i && node server.js`.
3. Commit → PR.

## 📄 Licença

MIT License. Veja [LICENSE](LICENSE).

## 🙌 Créditos

- **HTMX**: Interatividade sem JS.
- **Split.js**: Painéis redimensionáveis.
- **Prism.js**: Syntax highlight.
- **Express + EJS**: Backend leve.
- Desenvolvido com ❤️ por [Michel](https://github.com/michelbr84).

⭐ **Star se gostou!** Issues/PRs bem-vindos.
