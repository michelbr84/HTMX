let splitInstance = null;

function initSplit() {
  // Destroy existing split if any
  if (splitInstance) {
    splitInstance.forEach(instance => instance.destroy());
    splitInstance = null;
  }

  // Only init if desktop and panels exist
  if (window.innerWidth >= 768) {
    const previewPanel = document.getElementById('preview-panel');
    const codePanel = document.getElementById('code-panel');
    if (previewPanel && codePanel) {
      splitInstance = Split(['#preview-panel', '#code-panel'], {
        sizes: [50, 50],
        minSize: 200,
        gutterSize: 8,
        cursor: 'col-resize',
        animation: true,
        liveGutterResize: true
      });
      // Add fullscreen btn after split
      const previewContainer = document.querySelector('#preview-panel .preview-code-container');
      if (previewContainer) addFullscreenBtn(previewContainer);
    }
  }
}

// Re-init on resize
window.addEventListener('resize', () => {
  initSplit();
});

// Prism highlight after swaps
document.body.addEventListener('htmx:afterSwap', (e) => {
  if (typeof Prism !== 'undefined') {
    Prism.highlightAll();
  }
  // Add fullscreen btn after swap
  const previewContainer = document.querySelector('#preview-panel .preview-code-container');
  if (previewContainer) addFullscreenBtn(previewContainer);
});

// Fullscreen functions
function addFullscreenBtn(container) {
  if (container.querySelector('iframe') && !container.querySelector('.fullscreen-btn, .exit-fullscreen')) {
    const btn = document.createElement('button');
    btn.className = 'fullscreen-btn';
    btn.innerHTML = '⛶';
    btn.onclick = () => enterFullscreen(container);
    container.style.position = 'relative';
    container.appendChild(btn);
  }
}

function enterFullscreen(el) {
  el.dataset.savedRect = JSON.stringify(el.getBoundingClientRect());
  el.dataset.savedStyle = el.style.cssText;
  el.classList.add('fullscreen');
  const exitBtn = document.createElement('button');
  exitBtn.className = 'exit-fullscreen';
  exitBtn.innerHTML = '❌';
  exitBtn.onclick = () => exitFullscreen(el);
  el.appendChild(exitBtn);
}

function exitFullscreen(el) {
  el.classList.remove('fullscreen');
  const savedRect = JSON.parse(el.dataset.savedRect);
  el.style.width = savedRect.width + 'px';
  el.style.height = savedRect.height + 'px';
  el.style.cssText = el.dataset.savedStyle;
  const exit = el.querySelector('.exit-fullscreen');
  if (exit) exit.remove();
  addFullscreenBtn(el);
}