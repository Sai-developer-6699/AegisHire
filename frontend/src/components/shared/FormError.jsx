import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Renders inline form validation warning messages.
 * Triggers a subtle, premium shake animation when error status transitions.
 */
export function FormError({ message, className }) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (message) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 400); // matches animation duration
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-1.5 text-xs text-error font-medium pl-1 select-none",
        shouldAnimate && "animate-shake",
        className
      )}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <span className="leading-snug">{message}</span>
    </div>
  );
}

export default FormError;
