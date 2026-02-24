/* KaTeX auto-render initialization */
/* Requires: KaTeX JS + auto-render contrib loaded via CDN before this script */

document.addEventListener("DOMContentLoaded", function() {
  renderMathInElement(document.body, {
    delimiters: [
      {left: "$$", right: "$$", display: true},
      {left: "$", right: "$", display: false}
    ],
    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
  });
});
