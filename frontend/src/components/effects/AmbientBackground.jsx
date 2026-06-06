import React from 'react';

/**
 * AmbientBackground component
 * Renders a premium, dark slate backdrop with slow-moving Indigo/Cobalt glows.
 * Animations automatically halt under prefers-reduced-motion via index.css classes.
 */
export function AmbientBackground({ children, className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-background ${className}`}>
      {/* Soft Blurred Ambient Orbs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Orb 1: Indigo */}
        <div 
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[140px] mix-blend-screen animate-ambient-slow-1"
        />
        {/* Orb 2: Cobalt */}
        <div 
          className="absolute -bottom-[20%] -right-[10%] w-[65%] h-[65%] rounded-full bg-accent/10 blur-[140px] mix-blend-screen animate-ambient-slow-2"
        />
      </div>
      
      {/* Content wrapper */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}

export default AmbientBackground;
