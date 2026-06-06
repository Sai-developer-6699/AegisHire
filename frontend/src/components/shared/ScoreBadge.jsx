import React from 'react';

/**
 * ScoreBadge renders float values (0-100) using color-coded metrics.
 * - Green: Score >= 80 (High Match)
 * - Yellow: 60 <= Score < 80 (Moderate Match)
 * - Red: Score < 60 (Low Match)
 */
export function ScoreBadge({ score }) {
  const numericScore = parseFloat(score);

  if (isNaN(numericScore)) {
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded bg-gray-500/10 text-gray-400 border border-gray-500/20">
        N/A
      </span>
    );
  }

  let colorClasses = '';
  if (numericScore >= 80) {
    colorClasses = 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20';
  } else if (numericScore >= 60) {
    colorClasses = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  } else {
    colorClasses = 'bg-red-500/10 text-red-400 border-red-500/20';
  }

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-md border ${colorClasses}`}>
      {numericScore.toFixed(1)}%
    </span>
  );
}
export default ScoreBadge;
