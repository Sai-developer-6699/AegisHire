import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ShieldAlert, Award, Loader2 } from 'lucide-react';

export function ProductPreviewCard({ 
  candidate = {
    name: 'Sarah Jenkins',
    role: 'Lead Frontend Engineer',
    score: 88,
    matchedSkills: ['React', 'TypeScript', 'TailwindCSS', 'FastAPI'],
    missingSkills: ['Docker', 'Kubernetes'],
    recommendation: 'Strong Hire',
    confidence: 'High'
  },
  autoAnimate = true,
  className = ''
}) {
  const [step, setStep] = useState(0); // 0: upload/initial, 1: skills check, 2: recommendation

  useEffect(() => {
    if (!autoAnimate) {
      setStep(2); // Show final state directly
      return;
    }

    // Run timed sequence for marketing showcase
    const timer1 = setTimeout(() => setStep(1), 1600); // Expand skills
    const timer2 = setTimeout(() => setStep(2), 3200); // Show recommendation

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [autoAnimate]);

  const resetAnimation = () => {
    if (autoAnimate) {
      setStep(0);
      setTimeout(() => setStep(1), 1600);
      setTimeout(() => setStep(2), 3200);
    }
  };

  // Color mappings
  const score = candidate.score;
  const scoreColorClass = 
    score >= 85 ? 'text-[#3B82F6] border-[#3B82F6]/30 bg-[#3B82F6]/5' :
    score >= 70 ? 'text-amber-400 border-amber-400/30 bg-amber-400/5' :
    'text-red-400 border-red-400/30 bg-red-400/5';

  const recColorClass = 
    candidate.recommendation === 'Strong Hire' ? 'text-accent border-accent/30 bg-accent/10' :
    candidate.recommendation === 'Hire' ? 'text-indigo-400 border-indigo-400/20 bg-indigo-400/10' :
    'text-amber-400 border-amber-400/20 bg-amber-400/10';

  return (
    <motion.div
      layout
      className={`w-full max-w-[380px] bg-[#0d1e33]/85 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-sans text-slate-200 select-none overflow-hidden ${className}`}
    >
      {/* Header Info */}
      <motion.div layout className="flex items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-accent text-sm">
            {candidate.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-none">{candidate.name}</h4>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">{candidate.role}</p>
          </div>
        </div>
        
        {/* Animated Score Badge */}
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-[10px] text-accent uppercase tracking-wider font-bold"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Analyzing</span>
            </motion.div>
          ) : (
            <motion.div
              key="score"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center font-mono ${scoreColorClass}`}
            >
              <span className="text-base font-extrabold leading-none">{score}</span>
              <span className="text-[7px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">Score</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Interactive Expandable Skills Matrix */}
      <motion.div layout className="py-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Skill Mapping</span>
          {step >= 1 && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[9px] text-[#14B8A6] font-semibold"
            >
              88% Match
            </motion.span>
          )}
        </div>

        <AnimatePresence>
          {step >= 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="overflow-hidden space-y-2.5 pt-1"
            >
              {/* Matched Skills */}
              <div className="space-y-1.5">
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Matched</div>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.matchedSkills.map((skill) => (
                    <span 
                      key={skill} 
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/5 border border-accent/20 text-[10px] font-medium text-accent"
                    >
                      <Check className="h-3 w-3 text-[#14B8A6]" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="space-y-1.5">
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Gaps Identified</div>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.missingSkills.map((skill) => (
                    <span 
                      key={skill} 
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/5 border border-red-500/15 text-[10px] font-medium text-red-400"
                    >
                      <X className="h-3 w-3 text-red-500" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* AI Recommendation Panel */}
      <AnimatePresence>
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
            className="pt-4 border-t border-white/5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">AI Hiring Decision</span>
              
              {/* Bouncing recommendation badge */}
              <motion.span
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded border ${recColorClass}`}
              >
                {candidate.recommendation}
              </motion.span>
            </div>
            
            <div className="bg-[#11243b]/40 border border-white/5 rounded-xl p-3 text-xs leading-relaxed text-slate-300">
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                <ShieldAlert className="h-3 w-3 text-accent" />
                <span>Decision confidence: {candidate.confidence}</span>
              </div>
              Candidate possesses strong fundamentals in frontend architectures with matching requirements. Docker gaps can be assessed during live interview stage.
            </div>

            {/* Replay trigger in sandbox/preview mode */}
            {autoAnimate && (
              <button 
                onClick={resetAnimation}
                className="w-full text-center text-[9px] text-gray-500 hover:text-accent font-semibold transition-colors mt-2"
              >
                Replay Animation
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ProductPreviewCard;
