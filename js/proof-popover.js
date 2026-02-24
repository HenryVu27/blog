/* Hover-based proof popover controller */
/* Requires: proof-popover.css, a #proof-popover container in the HTML,
   and hidden divs whose IDs match data-proof-id attributes on triggers.
   If KaTeX is loaded, math inside popovers is rendered automatically. */

document.addEventListener("DOMContentLoaded", function() {
  var popover = document.getElementById('proof-popover');
  var contentEl = document.getElementById('proof-popover-content');
  if (!popover || !contentEl) return;

  var activeTrigger = null;
  var hideTimer = null;
  var isPopoverHovered = false;

  function clearHideTimer() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function scheduleHide(delay) {
    clearHideTimer();
    hideTimer = setTimeout(function() {
      if (!isPopoverHovered) {
        hidePopover();
      }
    }, delay || 300);
  }

  function showPopoverFor(trigger) {
    clearHideTimer();
    activeTrigger = trigger;
    var proofId = trigger.getAttribute('data-proof-id');
    var hidden = document.getElementById(proofId);
    if (!hidden) return;

    contentEl.innerHTML = hidden.innerHTML;

    // Render KaTeX inside popover if available
    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(contentEl, {
          delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false}
          ],
          ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
        });
      } catch(e) { /* KaTeX render failed, show raw content */ }
    }

    popover.classList.add('visible');
    popover.style.visibility = 'hidden';
    popover.offsetHeight; // force reflow for Safari
    positionPopover(trigger);
    popover.style.visibility = '';
    popover.setAttribute('aria-hidden', 'false');
  }

  function positionPopover(trigger) {
    var triggerRect = trigger.getBoundingClientRect();
    var popoverRect = popover.getBoundingClientRect();
    var spacing = 8;

    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    var left, top;

    if (isSafari) {
      var scrollX = window.pageXOffset || document.documentElement.scrollLeft || 0;
      var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

      popover.style.position = 'absolute';

      left = triggerRect.left + scrollX;
      top = triggerRect.bottom + scrollY + spacing;

      if (left + popoverRect.width > window.innerWidth + scrollX - 12) {
        left = window.innerWidth + scrollX - popoverRect.width - 12;
      }
      left = Math.max(12 + scrollX, left);

      if (top + popoverRect.height > window.innerHeight + scrollY - 12) {
        top = triggerRect.top + scrollY - popoverRect.height - spacing;
      }
      top = Math.max(12 + scrollY, top);
    } else {
      popover.style.position = 'fixed';

      left = triggerRect.left;
      top = triggerRect.bottom + spacing;

      if (left + popoverRect.width > window.innerWidth - 12) {
        left = window.innerWidth - popoverRect.width - 12;
      }
      left = Math.max(12, left);

      if (top + popoverRect.height > window.innerHeight - 12) {
        top = triggerRect.top - popoverRect.height - spacing;
      }
      top = Math.max(12, top);
    }

    popover.style.left = left + 'px';
    popover.style.top = top + 'px';
    popover.style.transform = 'none';
  }

  function hidePopover() {
    popover.classList.remove('visible');
    popover.setAttribute('aria-hidden', 'true');
    activeTrigger = null;
  }

  // Setup hover triggers
  var triggers = document.querySelectorAll('.proof-popover-trigger');

  triggers.forEach(function(trigger) {
    trigger.addEventListener('mouseenter', function() {
      showPopoverFor(trigger);
    });
    trigger.addEventListener('mouseleave', function() {
      scheduleHide(300);
    });
    // Click for touch devices
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      if (popover.classList.contains('visible') && activeTrigger === trigger) {
        hidePopover();
      } else {
        showPopoverFor(trigger);
      }
    });
  });

  // Keep popover open while hovered
  popover.addEventListener('mouseenter', function() {
    isPopoverHovered = true;
    clearHideTimer();
  });
  popover.addEventListener('mouseleave', function() {
    isPopoverHovered = false;
    scheduleHide(100);
  });

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') hidePopover();
  });

  // Reposition on resize
  window.addEventListener('resize', function() {
    if (activeTrigger && popover.classList.contains('visible')) {
      positionPopover(activeTrigger);
    }
  });

  // Hide on page visibility change (Safari)
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) hidePopover();
  });
});
