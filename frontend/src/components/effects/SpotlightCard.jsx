import React, { useState } from 'react';

/**
 * Premium Spotlight Card that tracks cursor hover coordinates
 * and displays a soft moving radial spotlight glow.
 */
export function SpotlightCard({ children, className = '', allowGlow = false, ...props }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e) {
    if (!allowGlow) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  const borderClass = allowGlow 
    ? 'hover:border-accent/30' 
    : 'hover:border-border/60';

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 ${borderClass} ${className}`}
      {...props}
    >
      {/* Moving Spotlight Gradient */}
      {allowGlow && isHovered && (
        <div
          className="absolute pointer-events-none rounded-full blur-[60px] transition-opacity duration-300"
          style={{
            width: '300px',
            height: '300px',
            left: `${coords.x - 150}px`,
            top: `${coords.y - 150}px`,
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
export default SpotlightCard;
