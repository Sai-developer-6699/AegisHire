import React from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * GradientMesh component
 * Renders a slow-moving, premium shifting aurora mesh using GPU-accelerated CSS keyframes.
 * Pause animations dynamically if prefers-reduced-motion is active.
 */
export function GradientMesh({ className = '' }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#0B1220] ${className}`}>
      {/* Shifting radial gradients */}
      <div 
        className="absolute inset-0 opacity-[0.25] mix-blend-screen filter blur-[120px]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 20%, #4F46E5 0%, transparent 45%),
            radial-gradient(circle at 95% 80%, #3B82F6 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #14B8A6 0%, transparent 40%),
            radial-gradient(circle at 85% 15%, #4F46E5 0%, transparent 45%),
            radial-gradient(circle at 15% 85%, #3B82F6 0%, transparent 45%)
          `,
          backgroundSize: '200% 200%',
          animation: shouldReduceMotion ? 'none' : 'gradient-mesh-anim 40s ease infinite alternate',
        }}
      />
      
      {/* Modern thin Grid overlay to add SaaS structural feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.22]" />
    </div>
  );
}

export default GradientMesh;
