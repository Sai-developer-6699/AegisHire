import React from 'react';
import { AmbientBackground } from '@/components/effects/AmbientBackground';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Trophy, CheckCircle, ShieldAlert } from 'lucide-react';

function CandidateColumn({ candidate, side, isWinner }) {
  if (!candidate) {
    return (
      <div className={`p-8 flex items-center justify-center flex-1 min-h-[350px] ${side === 'left' ? 'border-r border-white/5' : ''}`}>
        <div className="text-center text-gray-500 space-y-2">
          <div className="text-4xl">+</div>
          <div className="text-xs font-semibold uppercase tracking-wider">Select candidate for comparison</div>
        </div>
      </div>
    );
  }

  const score = candidate.score ?? candidate.ai_score ?? candidate.aiScore ?? 0;
  const matched = candidate.matched_skills || [];
  const missing = candidate.missing_skills || [];

  return (
    <div className={`p-8 space-y-6 flex-1 ${side === 'left' ? 'border-r border-white/5' : ''}`}>
      {/* Score and Winner Status */}
      <div className="text-center space-y-3">
        <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center mx-auto border-2 transition-all duration-300 ${
          score >= 85 
            ? 'border-accent bg-accent/5 text-accent shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
            : score >= 70 
              ? 'border-amber-400 bg-amber-400/5 text-amber-400' 
              : 'border-red-400 bg-red-400/5 text-red-400'
        }`}>
          <span className="text-2xl font-extrabold leading-none">{Math.round(score)}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">Score</span>
        </div>

        <div>
          {isWinner && (
            <Badge className="bg-accent/15 border border-accent/30 text-accent text-[10px] font-bold py-1 px-2.5 rounded gap-1 tracking-wide uppercase select-none">
              <Trophy className="h-3 w-3" />
              <span>Stronger Match</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Identity */}
      <div className="text-center space-y-1">
        <h4 className="text-base font-bold text-white tracking-wide">{candidate.name || candidate.resume_name}</h4>
        <p className="text-xs text-gray-400 font-medium">{candidate.email || 'No email provided'}</p>
      </div>

      {/* Profile Metrics */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Background</span>
        <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
          <span className="text-gray-400 font-medium">Experience</span>
          <span className="text-slate-200 font-semibold">{candidate.experience_years ? `${candidate.experience_years} yrs` : '—'}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
          <span className="text-gray-400 font-medium">Education</span>
          <span className="text-slate-200 font-semibold truncate max-w-[200px]">{candidate.education_detected || '—'}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
          <span className="text-gray-400 font-medium">Status</span>
          <span className="text-slate-200 font-semibold capitalize">{candidate.status || '—'}</span>
        </div>
      </div>

      {/* Matched Skills */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">✓ Matched Skills</span>
        <div className="flex flex-wrap gap-1.5">
          {matched.length > 0 ? (
            matched.map((s) => (
              <span key={s} className="px-2 py-0.5 bg-accent/10 border border-accent/25 rounded text-[10px] font-semibold text-accent select-none">
                {s}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500 italic">No skills matched</span>
          )}
        </div>
      </div>

      {/* Missing Skills */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">✗ Missing Skills</span>
        <div className="flex flex-wrap gap-1.5">
          {missing.length > 0 ? (
            missing.map((s) => (
              <span key={s} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] font-semibold text-red-400 select-none">
                {s}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500 italic">No missing skills</span>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {candidate.ai_summary && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">AI Summary</span>
          <p className="text-xs text-gray-400 leading-relaxed max-h-[120px] overflow-y-auto whitespace-pre-line bg-secondary/15 p-3 rounded-lg border border-border/40">
            {candidate.ai_summary}
          </p>
        </div>
      )}
    </div>
  );
}

export function CandidateComparison({ candidateA, candidateB, onClose }) {
  const scoreA = candidateA?.score ?? candidateA?.ai_score ?? candidateA?.aiScore ?? 0;
  const scoreB = candidateB?.score ?? candidateB?.ai_score ?? candidateB?.aiScore ?? 0;
  const aWins = scoreA > scoreB;
  const bWins = scoreB > scoreA;

  // Escape key handler to close comparison modal
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <AmbientBackground 
        className="w-full max-w-[950px] max-h-[90vh] rounded-2xl border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0d1726]/80 backdrop-blur-md z-10">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Candidate Comparison</h3>
            <p className="text-xs text-gray-400 mt-0.5">Side-by-side core score and skill matrix evaluation</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-border text-gray-400 hover:text-white hover:bg-secondary/60 text-xs font-semibold h-8"
          >
            <X className="h-4 w-4 mr-1.5" />
            <span>Close</span>
          </Button>
        </div>

        {/* Comparison Grid */}
        <div className="flex divide-x divide-white/5 overflow-y-auto flex-1 bg-card/35 backdrop-blur-lg z-10 min-h-0">
          <CandidateColumn candidate={candidateA} side="left" isWinner={aWins} />
          <CandidateColumn candidate={candidateB} side="right" isWinner={bWins} />
        </div>
      </AmbientBackground>
    </div>
  );
}

export default CandidateComparison;
