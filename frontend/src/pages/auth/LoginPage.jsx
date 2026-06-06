import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import { LoginForm } from '@/components/forms/LoginForm';
import { GradientMesh } from '@/components/effects/GradientMesh';
import { Shield, Loader2, Check, X, Sparkles, Clock, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_HOME_MAP = {
  1: '/admin',
  2: '/manager',
  3: '/hr',
  4: '/candidate',
};

const MOTION_TOKENS = {
  fast: 0.15,
  interactive: 0.25,
  section: 0.45,
  hero: 0.7,
  floating: 8,
  orbital: 12
};

export function LoginPage() {
  const { userid, roleid, status, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Spotlight coordinates state
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  
  // AI Command Center Preview cycle stage (0: Ingesting, 1: Skills, 2: Questions, 3: Recommendation)
  const [previewStage, setPreviewStage] = useState(0);

  // Redirect if authenticated
  useEffect(() => {
    if (status === 'authenticated' && userid && roleid) {
      navigate(ROLE_HOME_MAP[roleid] ?? '/', { replace: true });
    }
  }, [status, userid, roleid, navigate]);

  // Cycle preview dashboard stages
  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewStage((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpotlightPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  async function handleLogin(credentials) {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials.username, credentials.password);
      if (response && response.userid) {
        login({
          userid: response.userid,
          roleid: response.roleid,
          username: credentials.username,
        });
        toast.success('Successfully logged in!');
        return true;
      } else {
        toast.error(response?.message || 'Login failed. Please check credentials.');
        return false;
      }
    } catch (err) {
      toast.error(err.message || err.error || 'Server error occurred during login.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a1220] text-white select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide text-gray-400">Checking credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-screen flex overflow-hidden select-none bg-[#0a1220] font-sans relative"
      onMouseMove={handleMouseMove}
    >
      {/* Left Screen (Showcase) - Hidden on Mobile */}
      <div className="hidden md:flex md:w-[55%] relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        
        {/* Shifting Gradient Mesh Background */}
        <GradientMesh />

        {/* Spotlight Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 350px at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(59, 130, 246, 0.08), transparent 80%)`
          }}
        />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="bg-[#3B82F6]/15 p-2 rounded-xl text-[#3B82F6] border border-[#3B82F6]/25 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-heading font-extrabold text-base tracking-wide text-white">AegisHire AI</span>
        </div>

        {/* Showcase Center Widget (AI Command Center Preview) */}
        <div className="relative z-10 space-y-8 max-w-md my-auto">
          <div className="space-y-2.5">
            <h3 className="text-3xl font-heading font-extrabold text-white leading-tight">
              AI-Powered Candidate Intelligence
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Verify credentials, review auto-extracted skills matrices, and evaluate candidate match metrics instantly.
            </p>
          </div>

          {/* Dynamic Candidate State Mockup Card */}
          <div className="relative">
            {/* Background glowing rings */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-accent to-[#14B8A6] opacity-15 blur-lg pointer-events-none" />

            <motion.div 
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: MOTION_TOKENS.floating, repeat: Infinity, ease: 'easeInOut' }}
              className="relative bg-[#0d1e33]/90 border border-white/10 rounded-2xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.55)] space-y-5 overflow-hidden"
            >
              
              {/* Top Meta info */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/15 text-accent border border-accent/25 flex items-center justify-center font-bold text-xs">JD</div>
                  <div>
                    <h4 className="text-xs font-bold text-white">John Doe</h4>
                    <p className="text-[10px] text-gray-400 font-medium">Senior Python Developer</p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {previewStage >= 3 ? (
                    <motion.div
                      key="score"
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.7, opacity: 0 }}
                      transition={{ duration: MOTION_TOKENS.interactive }}
                      className="w-10 h-10 rounded-xl border border-accent/25 bg-accent/5 flex flex-col items-center justify-center font-mono text-accent"
                    >
                      <span className="text-sm font-extrabold leading-none">88</span>
                      <span className="text-[6px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">Score</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-accent"
                    >
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Analyzing</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* State display boxes */}
              <div className="min-h-[140px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {previewStage === 0 && (
                    <motion.div
                      key="ingest"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4 py-2 text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto text-accent">
                        <Clock className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-white block">Parsing Resume PDF CV</span>
                        <span className="text-[9px] text-gray-500 block mt-0.5">Extracting structural work credentials</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 3.8, ease: 'linear' }}
                          className="h-full bg-accent" 
                        />
                      </div>
                    </motion.div>
                  )}

                  {previewStage === 1 && (
                    <motion.div
                      key="skills"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold block">Skills Matrix Mapping</span>
                      <div className="space-y-2">
                        <div>
                          <span className="text-[8px] text-gray-400 block mb-1">Matched Stack</span>
                          <div className="flex flex-wrap gap-1">
                            {['Python', 'FastAPI', 'MySQL'].map(s => (
                              <span key={s} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent/5 border border-accent/20 text-[9px] text-accent font-medium">
                                <Check className="h-2 w-2 text-emerald-400" />
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-[8px] text-gray-400 block mb-1">Identified Gaps</span>
                          <div className="flex flex-wrap gap-1">
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-500/5 border border-red-500/15 text-[9px] text-red-400 font-medium">
                              <X className="h-2 w-2 text-red-500" />
                              Docker
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {previewStage === 2 && (
                    <motion.div
                      key="questions"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold block">Assessment Blueprints</span>
                      <div className="bg-accent/5 border border-accent/15 rounded-xl p-3 space-y-1.5 text-left">
                        <div className="flex items-center gap-1.5 text-[9px] text-accent font-bold">
                          <HelpCircle className="h-3 w-3" />
                          <span>Generated Target Exam Blueprints</span>
                        </div>
                        <p className="text-[10px] text-gray-300 italic leading-relaxed">
                          "Explain how you would write a script in Python to benchmark concurrent queries on MySQL without locking tables."
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {previewStage === 3 && (
                    <motion.div
                      key="decision"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold block">AI Recommendation</span>
                      <div className="bg-[#11243b]/50 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="text-[9px] text-gray-400 font-bold uppercase block">Decision Output</span>
                          <span className="text-xs font-bold text-white">Strong Hire</span>
                        </div>
                        <span className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#14B8A6]/10 border border-[#14B8A6]/20 text-[#14B8A6] font-bold">
                          Confidence: 95%
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-normal">
                        Candidate has strong fundamentals. Skill matrix matches 88% of core criteria. Target Docker queries generated for final panels.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status bar */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                <span>Phase Progress</span>
                <span className="text-accent">
                  {previewStage === 0 && 'Ingesting'}
                  {previewStage === 1 && 'Analyzing Matrix'}
                  {previewStage === 2 && 'Generating Blueprints'}
                  {previewStage === 3 && 'Finalized Review'}
                </span>
              </div>

            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[10px] text-gray-500 font-medium tracking-wide">
          © 2026 AegisHire. All rights reserved.
        </div>
      </div>

      {/* Right Screen (Login Panel) */}
      <div className="w-full md:w-[45%] flex flex-col justify-center items-center p-6 relative bg-[#0a1220] z-20">
        
        {/* Render a mesh overlay on mobile only */}
        <div className="md:hidden">
          <GradientMesh />
        </div>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-[380px] bg-[#0d1e33]/55 border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8">
          <div className="flex flex-col items-center mb-6 text-center">
            <h2 className="text-xl font-heading font-extrabold text-white tracking-wide">Welcome Back</h2>
            <p className="text-xs text-gray-400 mt-1.5">Sign in to access your recruitment dashboards.</p>
          </div>

          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-gray-400 hover:text-white font-medium transition-colors"
            >
              &larr; Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
