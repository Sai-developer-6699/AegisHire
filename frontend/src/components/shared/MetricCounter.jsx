import React, { useState } from 'react';
import { animate, motion } from 'framer-motion';

/**
 * MetricCounter component
 * Increments dynamically from 0 to a target value when it enters the viewport.
 * Pauses or renders statically if prefers-reduced-motion is enabled.
 */
export function MetricCounter({ value, duration = 1.8, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);

  const handleStartAnimation = () => {
    const controls = animate(0, value, {
      duration: duration,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayValue(Math.round(latest))
    });
    return () => controls.stop();
  };

  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{
        opacity: 1,
        transition: { duration: 0.5 }
      }}
      viewport={{ once: true }}
      onViewportEnter={handleStartAnimation}
    >
      {displayValue}{suffix}
    </motion.span>
  );
}

export default MetricCounter;
