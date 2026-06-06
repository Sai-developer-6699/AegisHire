import React from 'react';

/**
 * Premium Shimmer Button to use for primary CTAs.
 * Features an animated glowing gradient border and overlay.
 */
export function ShimmerButton({ children, className = '', ...props }) {
  return (
    <button
      className={`relative group overflow-hidden rounded-lg bg-gradient-to-r from-[#11243b] to-[#0a1727] px-6 py-3 text-sm font-semibold text-white border border-[#1a2e46] transition-all duration-300 hover:border-[#3B82F6]/50 hover:shadow-[0_0_20px_rgba(46,213,115,0.25)] active:scale-[0.98] ${className}`}
      {...props}
    >
      {/* Shimmer Sweep Animation Overlay */}
      <span className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[#3B82F6]/15 to-transparent"></span>
      
      {/* Inner Button Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
export default ShimmerButton;
