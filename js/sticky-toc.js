/* JS-based sticky TOC — replaces CSS position:sticky which breaks
   in certain grid/zoom/overflow combinations across browsers. */

(function() {
  var toc = document.querySelector('.toc');
  if (!toc || window.innerWidth <= 768) return;

  var layout = toc.closest('.layout');
  if (!layout) return;

  var tocWidth;
  var tocLeft;
  var layoutTop;
  var layoutBottom;

  function measure() {
    // Temporarily remove sticky classes to get natural position
    toc.classList.remove('is-sticky', 'is-bottom');
    toc.style.width = '';
    toc.style.left = '';

    var tocRect = toc.getBoundingClientRect();
    var layoutRect = layout.getBoundingClientRect();

    tocWidth = tocRect.width;
    tocLeft = tocRect.left;
    layoutTop = layoutRect.top + window.scrollY;
    layoutBottom = layoutRect.bottom + window.scrollY;
  }

  function onScroll() {
    var scrollY = window.scrollY;
    var tocHeight = toc.offsetHeight;
    var stickyTop = 32;

    // Where TOC would naturally sit (top of layout)
    var startStick = layoutTop;
    // Where TOC must stop (bottom of layout minus TOC height)
    var stopStick = layoutBottom - tocHeight - stickyTop;

    if (scrollY + stickyTop < startStick) {
      // Above the layout — TOC in natural position
      toc.classList.remove('is-sticky', 'is-bottom');
      toc.style.width = '';
      toc.style.left = '';
    } else if (scrollY + stickyTop < stopStick) {
      // In the sticky zone
      toc.classList.add('is-sticky');
      toc.classList.remove('is-bottom');
      toc.style.width = tocWidth + 'px';
      toc.style.left = tocLeft + 'px';
    } else {
      // Past the layout — pin to bottom
      toc.classList.remove('is-sticky');
      toc.classList.add('is-bottom');
      toc.style.width = tocWidth + 'px';
      toc.style.left = '';
    }
  }

  measure();
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function() {
    measure();
    onScroll();
  });
})();
