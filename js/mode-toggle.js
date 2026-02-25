// TLDR / Deep Dive mode toggle
(function() {
  var STORAGE_KEY = 'blog-reading-mode';

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

    try { localStorage.setItem(STORAGE_KEY, mode); } catch(e) {}
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    var saved = 'deep-dive';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'deep-dive'; } catch(e) {}
    // Migrate legacy 'builder' preference
    if (saved === 'builder') saved = 'deep-dive';
    setMode(saved);

    document.querySelectorAll('.mode-toggle button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (btn.dataset.mode !== saved) {
          try { localStorage.setItem(STORAGE_KEY, btn.dataset.mode); } catch(e) {}
          location.reload();
        }
      });
    });
  });
})();
