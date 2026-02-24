// Builder / Deep Dive mode toggle
(function() {
  var STORAGE_KEY = 'blog-reading-mode';

  function rerenderKatex() {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(document.body, {
        delimiters: [
          {left: "$$", right: "$$", display: true},
          {left: "$", right: "$", display: false}
        ],
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
      });
    }
  }

  function setMode(mode) {
    if (mode === 'deep-dive') {
      document.body.classList.add('deep-dive-mode');
    } else {
      document.body.classList.remove('deep-dive-mode');
    }

    // Update button states
    var buttons = document.querySelectorAll('.mode-toggle button');
    buttons.forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Re-render KaTeX for newly visible content
    rerenderKatex();

    try { localStorage.setItem(STORAGE_KEY, mode); } catch(e) {}
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    var saved = 'builder';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'builder'; } catch(e) {}
    setMode(saved);

    document.querySelectorAll('.mode-toggle button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        setMode(btn.dataset.mode);
      });
    });
  });
})();
