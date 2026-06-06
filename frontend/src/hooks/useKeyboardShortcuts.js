/**
 * hooks/useKeyboardShortcuts.js
 *
 * Global recruiter keyboard shortcuts.
 * Mount once in any list/table view that renders candidates.
 *
 * Default shortcuts:
 *   J          — Select next candidate
 *   K          — Select previous candidate
 *   S          — Shortlist selected candidate
 *   R          — Reject selected candidate
 *   E / Enter  — Open candidate drawer
 *   Esc        — Close drawer / deselect
 *
 * Usage:
 *   const { selectedIdx } = useKeyboardShortcuts({
 *     items: candidates,
 *     onShortlist: (item) => handleShortlist(item),
 *     onReject:    (item) => handleReject(item),
 *     onOpen:      (item) => openDrawer(item),
 *   });
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * @param {object} options
 * @param {Array}    options.items       - Array of candidate objects
 * @param {Function} options.onShortlist - Called with current item when S pressed
 * @param {Function} options.onReject    - Called with current item when R pressed
 * @param {Function} options.onOpen      - Called with current item when E/Enter pressed
 * @param {Function} options.onClose     - Called when Esc pressed
 * @param {boolean}  options.enabled     - Set false to disable shortcuts (e.g. when modal open)
 */
export function useKeyboardShortcuts({
  items = [],
  onShortlist,
  onReject,
  onOpen,
  onClose,
  enabled = true,
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const selectedItem = items[selectedIdx] ?? null;

  const handleKey = useCallback(
    (e) => {
      if (!enabled) return;

      // Don't fire when typing in inputs/textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case 'j':
        case 'J':
          e.preventDefault();
          setSelectedIdx((i) => Math.min(i + 1, items.length - 1));
          break;

        case 'k':
        case 'K':
          e.preventDefault();
          setSelectedIdx((i) => Math.max(i - 1, 0));
          break;

        case 's':
        case 'S':
          e.preventDefault();
          if (selectedItem && onShortlist) onShortlist(selectedItem);
          break;

        case 'r':
        case 'R':
          e.preventDefault();
          if (selectedItem && onReject) onReject(selectedItem);
          break;

        case 'e':
        case 'E':
        case 'Enter':
          e.preventDefault();
          if (selectedItem && onOpen) onOpen(selectedItem);
          break;

        case 'Escape':
          e.preventDefault();
          if (onClose) onClose();
          break;

        default:
          break;
      }
    },
    [enabled, items, selectedIdx, selectedItem, onShortlist, onReject, onOpen, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Reset index when items list changes
  useEffect(() => {
    setSelectedIdx(0);
  }, [items.length]);

  return { selectedIdx, setSelectedIdx, selectedItem };
}

export default useKeyboardShortcuts;
