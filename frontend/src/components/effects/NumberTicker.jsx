import React, { useEffect, useState } from 'react';

/**
 * Animates counting from 0 to a target value using requestAnimationFrame.
 * Integrates an easeOutQuad timing easing.
 */
export function NumberTicker({ value, duration = 1.2 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = parseFloat(value);
    if (isNaN(end)) {
      setCount(value);
      return;
    }

    const start = 0;
    const startTime = performance.now();

    function updateNumber(now) {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      // Quadratic ease out
      const easeOutQuad = progress * (2 - progress);
      const current = start + easeOutQuad * (end - start);
      
      if (Number.isInteger(end)) {
        setCount(Math.floor(current));
      } else {
        setCount(parseFloat(current.toFixed(1)));
      }

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      }
    }

    requestAnimationFrame(updateNumber);
  }, [value, duration]);

  return <span>{count}</span>;
}
export default NumberTicker;
