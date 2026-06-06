import { motion } from 'framer-motion';

/**
 * Shared animated container that wraps pages to create smooth entry and exit transitions.
 */
export function PageWrapper({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex-1 w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
export default PageWrapper;
