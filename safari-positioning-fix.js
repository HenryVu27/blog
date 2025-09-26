// Safari-compatible positioning function
// Replace the existing positionPopover function with this

function positionPopover(trigger) {
  // Force a reflow to ensure accurate measurements in Safari
  popover.offsetHeight; // Trigger reflow

  const triggerRect = trigger.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();
  const spacing = 8;

  // Debug logging to see what Safari is calculating
  console.log('Safari Debug - Trigger rect:', {
    left: triggerRect.left,
    top: triggerRect.top,
    bottom: triggerRect.bottom,
    right: triggerRect.right,
    width: triggerRect.width,
    height: triggerRect.height
  });

  console.log('Safari Debug - Popover rect:', {
    width: popoverRect.width,
    height: popoverRect.height
  });

  console.log('Safari Debug - Viewport:', {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY
  });

  // Calculate horizontal position
  let left = triggerRect.left;

  // Ensure popup doesn't go off right edge
  if (left + popoverRect.width > window.innerWidth - 12) {
    left = window.innerWidth - popoverRect.width - 12;
  }

  // Ensure popup doesn't go off left edge
  left = Math.max(12, left);

  // Calculate vertical position (prefer below trigger)
  let top = triggerRect.bottom + spacing;

  // If popup would go off bottom, position above
  if (top + popoverRect.height > window.innerHeight - 12) {
    top = triggerRect.top - popoverRect.height - spacing;
  }

  // Ensure popup doesn't go off top
  top = Math.max(12, top);

  console.log('Safari Debug - Final position:', { left, top });

  // Apply position
  popover.style.left = left + 'px';
  popover.style.top = top + 'px';

  // Verify position was applied correctly
  setTimeout(() => {
    const finalRect = popover.getBoundingClientRect();
    console.log('Safari Debug - Actual final position:', {
      left: finalRect.left,
      top: finalRect.top
    });
  }, 0);
}

// Alternative: Absolute positioning relative to document
function positionPopoverAbsolute(trigger) {
  const triggerRect = trigger.getBoundingClientRect();
  const spacing = 8;

  // Use absolute positioning with scroll offset
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;

  // Calculate position relative to document
  let left = triggerRect.left + scrollX;
  let top = triggerRect.bottom + scrollY + spacing;

  console.log('Safari Debug - Absolute positioning:', {
    left: left,
    top: top,
    scrollX: scrollX,
    scrollY: scrollY
  });

  // Change to absolute positioning
  popover.style.position = 'absolute';
  popover.style.left = left + 'px';
  popover.style.top = top + 'px';
}

// Method 3: Use transform instead of left/top
function positionPopoverTransform(trigger) {
  const triggerRect = trigger.getBoundingClientRect();
  const spacing = 8;

  // Position at origin, then transform
  popover.style.left = '0px';
  popover.style.top = '0px';
  popover.style.transform = `translate(${triggerRect.left}px, ${triggerRect.bottom + spacing}px)`;

  console.log('Safari Debug - Transform positioning:', {
    translateX: triggerRect.left,
    translateY: triggerRect.bottom + spacing
  });
}