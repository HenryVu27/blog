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
 *  1. Injects the title bar (header + chevron) from data attributes.
 *  2. Wraps the <pre> in a .code-body div.
 *  3. Adds language class for Prism and triggers highlighting.
 *  4. Wires up click-to-collapse on the title bar.
 */

(function () {
  "use strict";

  var CHEVRON_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<polyline points="6 9 12 15 18 9"></polyline></svg>';

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

      // Add line-numbers class for the plugin
      pre.classList.add("line-numbers");

      // Build header
      var header = document.createElement("div");
      header.className = "code-header";
      header.setAttribute("role", "button");
      header.setAttribute("aria-expanded", "true");
      header.setAttribute("tabindex", "0");

      var filenameSpan = document.createElement("span");
      filenameSpan.className = "code-filename";
      filenameSpan.textContent = filename;

      var toggleBtn = document.createElement("button");
      toggleBtn.className = "code-toggle";
      toggleBtn.setAttribute("aria-label", "Toggle code block");
      toggleBtn.setAttribute("tabindex", "-1");
      toggleBtn.innerHTML = CHEVRON_SVG;

      header.appendChild(filenameSpan);
      header.appendChild(toggleBtn);

      // Wrap pre in .code-body
      var body = document.createElement("div");
      body.className = "code-body";
      block.insertBefore(body, pre);
      body.appendChild(pre);

      // Insert header at top
      block.insertBefore(header, body);

      // Collapse / expand handler
      function toggle() {
        var collapsed = block.classList.toggle("collapsed");
        header.setAttribute("aria-expanded", collapsed ? "false" : "true");
      }

      header.addEventListener("click", toggle);
      header.addEventListener("keydown", function (e) {
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
