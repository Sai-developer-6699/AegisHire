import React from 'react';
import { X } from 'lucide-react';

/**
 * SkillPill displays a technical or soft skill tag.
 * Supports an optional onRemove callback for dynamic tag creation.
 */
export function SkillPill({ name, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-[#11243b] text-gray-200 border border-[#1a2e46] select-none hover:border-gray-400 transition-all duration-200">
      <span>{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-400 transition-colors focus:outline-none"
          aria-label={`Remove skill ${name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
export default SkillPill;
