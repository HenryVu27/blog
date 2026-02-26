/**
 * IDE-style code blocks: syntax highlighting (Prism.js) + collapse/expand.
 *
 * Enhances <pre><code> blocks that are wrapped in the .code-block structure:
 *
 *   <div class="code-block" data-filename="example.py" data-lang="python">
 *     <pre><code>...</code></pre>
 *   </div>
 *
 * The script:
 *  1. Injects the title bar (filename label, non-interactive).
 *  2. Wraps the <pre> in a .code-body div.
 *  3. Adds a fade overlay with expand/collapse arrow.
 *  4. Adds language class for Prism and triggers highlighting.
 *  5. Animates expand/collapse via measured max-height.
 */

(function () {
  "use strict";

  var ARROW_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<polyline points="6 9 12 15 18 9"></polyline></svg>';

  // Collapsed preview height: ~3 lines of code + padding
  var COLLAPSED_HEIGHT = "calc(3 * 1.55em + 32px)";

  function initCodeBlocks() {
    var blocks = document.querySelectorAll(".code-block");

    blocks.forEach(function (block) {
      // Skip if already initialised
      if (block.querySelector(".code-header")) return;

      var filename = block.getAttribute("data-filename") || "";
      var lang = block.getAttribute("data-lang") || "";
      var pre = block.querySelector("pre");
      var code = block.querySelector("code");

      if (!pre || !code) return;

      // Add Prism language class
      if (lang) {
        code.className = "language-" + lang;
        pre.className = "language-" + lang;
      }

      // Build header (static label, no interaction)
      var header = document.createElement("div");
      header.className = "code-header";

      var filenameSpan = document.createElement("span");
      filenameSpan.className = "code-filename";
      filenameSpan.textContent = filename;

      header.appendChild(filenameSpan);

      // Wrap pre in .code-body
      var body = document.createElement("div");
      body.className = "code-body";
      block.insertBefore(body, pre);
      body.appendChild(pre);

      // Add arrow button after code-body (always visible, interactive)
      var arrow = document.createElement("div");
      arrow.className = "code-arrow";
      arrow.setAttribute("role", "button");
      arrow.setAttribute("tabindex", "0");
      arrow.setAttribute("aria-label", "Expand code block");
      arrow.innerHTML = ARROW_SVG;

      // Insert header at top, then body, then arrow
      block.insertBefore(header, body);
      block.appendChild(arrow);

      // Start collapsed in TLDR mode (no deep-dive-mode class on body/html)
      var isDeepDive = document.body.classList.contains("deep-dive-mode") ||
                       document.documentElement.classList.contains("deep-dive-mode");
      if (!isDeepDive) {
        block.classList.add("collapsed");
        body.style.maxHeight = COLLAPSED_HEIGHT;
      }

      // Collapse / expand handler
      function toggle() {
        var isCollapsed = block.classList.contains("collapsed");

        if (isCollapsed) {
          // Expand: measure full scroll height, animate to it
          var fullHeight = body.scrollHeight + "px";
          body.style.maxHeight = fullHeight;
          block.classList.remove("collapsed");
          arrow.setAttribute("aria-label", "Collapse code block");

          // After transition, remove max-height so content reflows naturally
          body.addEventListener("transitionend", function handler() {
            body.removeEventListener("transitionend", handler);
            if (!block.classList.contains("collapsed")) {
              body.style.maxHeight = "none";
            }
          });
        } else {
          // Collapse: first pin current height so transition has a start value
          body.style.maxHeight = body.scrollHeight + "px";
          // Force reflow so the browser registers the starting value
          body.offsetHeight; // eslint-disable-line no-unused-expressions
          body.style.maxHeight = COLLAPSED_HEIGHT;
          block.classList.add("collapsed");
          arrow.setAttribute("aria-label", "Expand code block");
        }
      }

      arrow.addEventListener("click", toggle);
      arrow.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
    });

    // Trigger Prism highlighting if loaded
    if (typeof Prism !== "undefined") {
      Prism.highlightAll();
    }
  }

  // Run on DOMContentLoaded (or immediately if already loaded)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCodeBlocks);
  } else {
    initCodeBlocks();
  }
})();
