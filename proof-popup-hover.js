// Safari-compatible hover-based proof popup implementation
// This replaces the click-based system with a more reliable hover approach

document.addEventListener("DOMContentLoaded", function() {
  // Render KaTeX first
  renderMathInElement(document.body, {
    delimiters: [
      {left: "$$", right: "$$", display: true},
      {left: "$", right: "$", display: false}
    ],
    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
  });

  // Hover-based proof popover controller
  const popover = document.getElementById('proof-popover');
  const contentEl = document.getElementById('proof-popover-content');
  let activeTimer = null;
  let isPopoverHovered = false;

  function clearTimer() {
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
  }

  function showPopover(trigger) {
    clearTimer();

    const proofId = trigger.getAttribute('data-proof-id');
    const hiddenContent = document.getElementById(proofId);
    if (!hiddenContent) return;

    // Set content
    contentEl.innerHTML = hiddenContent.innerHTML;

    // Render KaTeX in popup content
    try {
      renderMathInElement(contentEl, {
        delimiters: [
          {left: "$$", right: "$$", display: true},
          {left: "$", right: "$", display: false}
        ],
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
      });
    } catch(e) {
      console.warn('KaTeX render failed in popup:', e);
    }

    // Show popup (visibility method for Safari compatibility)
    popover.style.display = 'block';
    popover.style.visibility = 'hidden'; // Measure while hidden

    // Position popup
    positionPopover(trigger);

    // Make visible
    popover.style.visibility = 'visible';
    popover.classList.add('visible');
    popover.setAttribute('aria-hidden', 'false');
  }

  function hidePopover() {
    popover.classList.remove('visible');
    popover.style.display = 'none';
    popover.setAttribute('aria-hidden', 'true');
  }

  function scheduleHide(delay = 300) {
    clearTimer();
    activeTimer = setTimeout(() => {
      if (!isPopoverHovered) {
        hidePopover();
      }
    }, delay);
  }

  function positionPopover(trigger) {
    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const spacing = 8;

    // Horizontal positioning
    let left = Math.max(12, Math.min(
      triggerRect.left,
      window.innerWidth - popoverRect.width - 12
    ));

    // Vertical positioning (prefer below, fallback to above)
    let top = triggerRect.bottom + spacing;
    if (top + popoverRect.height > window.innerHeight - 12) {
      top = triggerRect.top - popoverRect.height - spacing;
    }
    top = Math.max(12, top);

    popover.style.left = left + 'px';
    popover.style.top = top + 'px';
  }

  // Setup hover events on triggers
  const triggers = document.querySelectorAll('.proof-popover-trigger');

  triggers.forEach(trigger => {
    // Mouse enter: show popup immediately
    trigger.addEventListener('mouseenter', () => {
      showPopover(trigger);
    });

    // Mouse leave: schedule hide with delay
    trigger.addEventListener('mouseleave', () => {
      scheduleHide(300);
    });
  });

  // Popup hover persistence
  popover.addEventListener('mouseenter', () => {
    isPopoverHovered = true;
    clearTimer();
  });

  popover.addEventListener('mouseleave', () => {
    isPopoverHovered = false;
    scheduleHide(100); // Shorter delay when leaving popup
  });

  // Optional: Still allow click to toggle (for touch devices)
  triggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      if (popover.classList.contains('visible')) {
        hidePopover();
      } else {
        showPopover(trigger);
      }
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hidePopover();
    }
  });

  // Reposition on window resize
  window.addEventListener('resize', () => {
    if (popover.classList.contains('visible')) {
      // Find the currently associated trigger (if any) and reposition
      // For simplicity, just hide on resize
      hidePopover();
    }
  });

  // Safari-specific: Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hidePopover();
    }
  });
});