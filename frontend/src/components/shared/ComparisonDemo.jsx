import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Check, X, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

export function ComparisonDemo({ autoAnimate = true }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null); // 'A' | 'B' | null
  const [loading, setLoading] = useState(false);

  const candidateA = {
    name: 'Marcus Chen',
    role: 'Staff Python Backend',
    score: 82,
    matched: ['Django', 'Python', 'MySQL'],
    missing: ['Celery', 'Redis', 'AWS']
  };

  const candidateB = {
    name: 'Sarah Jenkins',
    role: 'Staff Python Backend',
    score: 91,
    matched: ['Django', 'Python', 'MySQL', 'Celery', 'Redis'],
    missing: ['AWS']
  };

  useEffect(() => {
    if (!autoAnimate) {
      setSelectedCandidate('B');
      return;
    }

    const runSequence = () => {
      setSelectedCandidate(null);
      setLoading(true);

      // Simulate AI cross-evaluating
      const timer1 = setTimeout(() => {
        setLoading(false);
        setSelectedCandidate('B');
      }, 2000);

      return () => clearTimeout(timer1);
    };

    runSequence();
    const interval = setInterval(runSequence, 8000);

    return () => {
      clearInterval(interval);
    };
  }, [autoAnimate]);

  return (
    <div className="w-full max-w-[550px] bg-[#0c1829]/65 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-[0_30px_60px_rgba(0,0,0,0.6)] font-sans text-slate-300 select-none">
      
      {/* Title */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#3B82F6] animate-pulse" />
          <span className="text-xs uppercase font-bold text-white tracking-wider">AI Comparison Engine</span>
        </div>
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-[10px] text-accent font-bold"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Cross-analyzing skills</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Side-by-Side Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Candidate A */}
        <motion.div 
          animate={{ 
            opacity: selectedCandidate === 'A' ? 1 : selectedCandidate === 'B' ? 0.6 : 0.85,
            borderColor: selectedCandidate === 'A' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.05)'
          }}
          className="bg-[#0e1a2b] border rounded-xl p-4 space-y-4 relative transition-colors duration-300"
        >
          <div className="flex justify-between items-start">
            <div>
              <h5 className="text-xs font-bold text-white">{candidateA.name}</h5>
              <p className="text-[10px] text-gray-400 mt-0.5">{candidateA.role}</p>
            </div>
            <span className="text-xs font-mono font-extrabold text-amber-400 border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 rounded">
              {candidateA.score}%
            </span>
          </div>

          <div className="space-y-2 text-[10px]">
            <div>
              <span className="text-gray-500 font-semibold uppercase tracking-wider block text-[8px] mb-1">Matched</span>
              <div className="flex flex-wrap gap-1">
                {candidateA.matched.map(s => (
                  <span key={s} className="px-1.5 py-0.5 bg-accent/5 border border-accent/25 rounded text-accent">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-gray-500 font-semibold uppercase tracking-wider block text-[8px] mb-1">Gaps</span>
              <div className="flex flex-wrap gap-1">
                {candidateA.missing.map(s => (
                  <span key={s} className="px-1.5 py-0.5 bg-red-500/5 border border-red-500/15 rounded text-red-400">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Candidate B */}
        <motion.div 
          animate={{ 
            opacity: selectedCandidate === 'B' ? 1 : selectedCandidate === 'A' ? 0.6 : 0.85,
            borderColor: selectedCandidate === 'B' ? 'rgba(79, 70, 229, 0.5)' : 'rgba(255, 255, 255, 0.05)'
          }}
          className="bg-[#0e1a2b] border rounded-xl p-4 space-y-4 relative transition-colors duration-300"
        >
          {selectedCandidate === 'B' && (
            <div className="absolute -top-2 -right-2 bg-accent text-[#0a1727] p-1.5 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Trophy className="h-3.5 w-3.5 fill-current" />
            </div>
          )}

          <div className="flex justify-between items-start">
            <div>
              <h5 className="text-xs font-bold text-white">{candidateB.name}</h5>
              <p className="text-[10px] text-gray-400 mt-0.5">{candidateB.role}</p>
            </div>
            <span className="text-xs font-mono font-extrabold text-accent border border-accent/25 bg-accent/5 px-2 py-0.5 rounded">
              {candidateB.score}%
            </span>
          </div>

          <div className="space-y-2 text-[10px]">
            <div>
              <span className="text-gray-500 font-semibold uppercase tracking-wider block text-[8px] mb-1">Matched</span>
              <div className="flex flex-wrap gap-1">
                {candidateB.matched.map(s => (
                  <span key={s} className="px-1.5 py-0.5 bg-accent/5 border border-accent/25 rounded text-accent">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-gray-500 font-semibold uppercase tracking-wider block text-[8px] mb-1">Gaps</span>
              <div className="flex flex-wrap gap-1">
                {candidateB.missing.map(s => (
                  <span key={s} className="px-1.5 py-0.5 bg-red-500/5 border border-red-500/15 rounded text-red-400">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* AI Comparison Report Panel */}
      <AnimatePresence mode="wait">
        {selectedCandidate === 'B' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 180, damping: 15 }}
            className="mt-4 pt-4 border-t border-white/5 space-y-2.5"
          >
            <div className="flex items-center gap-1.5 text-[10px] text-accent font-bold uppercase tracking-wider">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>AI Recommendation Engine Recommendation</span>
            </div>
            <div className="bg-accent/5 border border-accent/15 rounded-xl p-3 text-xs leading-relaxed text-slate-300">
              AegisHire automatically recommends <strong className="text-white">Sarah Jenkins</strong>. While both candidates share similar background levels, Sarah possesses critical production experience in <strong className="text-white">Celery</strong> and <strong className="text-white">Redis</strong>, reducing required onboarding ramp by an estimated 4 weeks.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default ComparisonDemo;
