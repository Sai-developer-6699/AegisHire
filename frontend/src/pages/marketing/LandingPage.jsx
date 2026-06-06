import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion, useMotionValueEvent } from 'framer-motion';
import { 
  Shield, 
  ArrowRight, 
  UploadCloud, 
  Check, 
  X, 
  Sparkles, 
  Trophy, 
  Users, 
  CheckCircle2, 
  Zap, 
  ChevronRight, 
  Search, 
  Lock, 
  BarChart3, 
  Clock, 
  Laptop,
  FileText,
  AlertCircle,
  Terminal,
  Activity,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { GradientMesh } from '@/components/effects/GradientMesh';
import { RequestDemoModal } from '@/components/shared/RequestDemoModal';
import { MetricCounter } from '@/components/shared/MetricCounter';
import { Button } from '@/components/ui/button';

// Motion token system
const MOTION_TOKENS = {
  fast: 0.15,
  interactive: 0.25,
  section: 0.45,
  hero: 0.7,
  floating: 8,
  orbital: 12,
  shimmer: 4
};

const TIMELINE_STEPS = [
  {
    title: "Ingesting Resume CV",
    subtitle: "T=0s Ingestion In Progress",
    description: "AegisHire instantly processes incoming PDF resumes, parsing text, structures, and metadata while scanning for file signatures to prevent document spoofing.",
    highlights: ["98% parsing accuracy", "Zero-latency intake queue", "Automated metadata validation"]
  },
  {
    title: "Semantic Skills Scan",
    subtitle: "AI Tech Mapping Matrix",
    description: "Our semantic engine maps extracted skills against the target role requirements, instantly displaying matched credentials and pinpointing critical technical gaps.",
    highlights: ["Deterministic skill mapping", "Dynamic gap highlighting", "Custom template alignment"]
  },
  {
    title: "Assessment Blueprint Setup",
    subtitle: "Custom MCQ Assessment Generation",
    description: "AegisHire automatically configures secure, customized question blueprints to target candidate-specific skills gaps, ensuring a highly relevant testing experience.",
    highlights: ["Targeted question generation", "Custom weight distribution", "Multi-stage test design"]
  },
  {
    title: "Focus Session Logs",
    subtitle: "Cheat-Resistant Monitoring",
    description: "During the assessment, our secure environment monitors and logs tab blurs, copy-paste actions, and unauthorized browser activities to ensure assessment security.",
    highlights: ["Tab focus tracking", "Real-time security warnings", "Automated behavior logs"]
  }
];

export function LandingPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  
  // Hero reveal stages (0: drop, 1: scan, 2: tags, 3: score, 4: recommendation/active orbitals)
  const [revealStage, setRevealStage] = useState(0);
  
  // Interactive Product Simulator step state
  const [activeStoryStep, setActiveStoryStep] = useState(0); 
  const [autoPlayStory, setAutoPlayStory] = useState(true);

  // Mouse spotlight glow coordinates
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });

  // 3D card tilt angles
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  // Refs for scroll elements
  const stickyTimelineRef = useRef(null);

  // Scroll Progress Hooks
  const { scrollYProgress } = useScroll({
    target: stickyTimelineRef,
    offset: ["start start", "end end"]
  });

  // Map scroll progress to sticky timeline stages using recommended v12 event listener
  const [scrollStage, setScrollStage] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.165) setScrollStage(0);
    else if (latest < 0.495) setScrollStage(1);
    else if (latest < 0.83) setScrollStage(2);
    else setScrollStage(3);
  });

  // Parallax transformations driven by scroll
  const { scrollY } = useScroll();
  const heroCardY = useTransform(scrollY, [0, 800], [0, 80]);
  const heroOrbitY = useTransform(scrollY, [0, 800], [0, 120]);
  const heroParticleY = useTransform(scrollY, [0, 800], [0, 40]);

  // Ball position on curved track
  const ballX = useTransform(scrollYProgress, [0, 0.33, 0.66, 1], [50, 10, 90, 50]);
  const ballY = useTransform(scrollYProgress, [0, 1], [50, 500]);

  // AI Candidate Reveal Loop (12 seconds cycle)
  useEffect(() => {
    let timers = [];
    const runSequence = () => {
      setRevealStage(0);
      timers.push(setTimeout(() => setRevealStage(1), 800));
      timers.push(setTimeout(() => setRevealStage(2), 1600));
      timers.push(setTimeout(() => setRevealStage(3), 2400));
      timers.push(setTimeout(() => setRevealStage(4), 3200));
    };

    runSequence();
    const interval = setInterval(runSequence, 12000);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  // Auto-play the simulator stepper
  useEffect(() => {
    if (!autoPlayStory) return;
    const timer = setInterval(() => {
      setActiveStoryStep((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, [autoPlayStory]);

  const handleStepClick = (stepIndex) => {
    setActiveStoryStep(stepIndex);
    setAutoPlayStory(false);
  };

  const handleGlobalMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpotlightPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Interactive Bento Grid Animate States
  // 1. Search card typing loop
  const [searchText, setSearchText] = useState('');
  useEffect(() => {
    const queryText = 'Django dev with Celery';
    let charIdx = 0;
    let typingTimer;

    const runTypingLoop = () => {
      setSearchText('');
      charIdx = 0;
      
      const typeChar = () => {
        if (charIdx < queryText.length) {
          setSearchText((prev) => prev + queryText[charIdx]);
          charIdx++;
          typingTimer = setTimeout(typeChar, 120);
        } else {
          // Pause at complete text, then restart
          typingTimer = setTimeout(runTypingLoop, 3000);
        }
      };

      typeChar();
    };

    runTypingLoop();
    return () => clearTimeout(typingTimer);
  }, []);

  // 3D Card mouse tilt
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    setRotateX(-y / 14);
    setRotateY(x / 14);
  };

  const handleCardMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  // Stagger reveal container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 120, damping: 15 },
    },
  };

  return (
    <div 
      className="min-h-screen bg-[#0a1220] font-sans text-slate-200 overflow-x-hidden select-none relative"
      onMouseMove={handleGlobalMouseMove}
    >
      {/* Sticky Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a1220]/75 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-[#3B82F6]/15 p-2 rounded-xl text-[#3B82F6] border border-[#3B82F6]/25 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-heading font-extrabold text-base tracking-wide text-white">AegisHire AI</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-gray-400">
            <a href="#simulator" className="hover:text-white transition-colors">Simulator</a>
            <a href="#timeline" className="hover:text-white transition-colors">Timeline</a>
             <a href="#transformation" className="hover:text-white transition-colors">ATS ➔ AegisHire</a>
            <a href="#bento" className="hover:text-white transition-colors">Bento Features</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-gray-300 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <Button
              onClick={() => setIsDemoModalOpen(true)}
              className="bg-accent hover:bg-accent/90 text-white font-bold text-xs h-9 px-4 shadow-[0_0_20px_rgba(59,130,246,0.25)] border border-accent/20 relative overflow-hidden group"
            >
              {/* Shimmer sweep */}
              <div className="absolute inset-0 w-1/2 bg-white/20 skew-x-12 translate-x-[-150%] group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
              <span>Request Demo</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center py-16 px-6 overflow-hidden">
        {/* Shifting Gradient Backdrop */}
        <GradientMesh />

        {/* Spotlight Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 450px at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(59, 130, 246, 0.08), transparent 80%)`
          }}
        />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Column: Copywriting */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 space-y-8 text-left"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-[11px] font-bold text-accent uppercase tracking-wider">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>Next-Gen Enterprise Recruitment</span>
            </motion.div>

            <div className="space-y-4">
              <motion.h1 
                variants={itemVariants}
                className="text-4xl md:text-6xl font-heading font-extrabold text-white leading-[1.1] tracking-tight"
              >
                AI-Powered Candidate <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-indigo-400 to-[#14B8A6] drop-shadow-sm">
                  Intelligence System
                </span>
              </motion.h1>
              <motion.p 
                variants={itemVariants}
                className="text-sm md:text-base text-gray-400 leading-relaxed max-w-xl"
              >
                Verify credentials, map deterministic skills matrices, configure secure examination blueprints, and prepare interviewers with AI-grounded guides. Built for recruitment security and integrity.
              </motion.p>
            </div>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 pt-2">
              <Button
                onClick={() => setIsDemoModalOpen(true)}
                className="bg-accent hover:bg-accent/90 text-white font-bold text-xs h-11 px-6 gap-2 shadow-[0_10px_25px_rgba(59,130,246,0.3)] border border-accent/25 relative overflow-hidden group"
              >
                <div className="absolute inset-0 w-1/2 bg-white/20 skew-x-12 translate-x-[-150%] group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                <span>Request Sandbox Demo</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a 
                href="#simulator"
                className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-6 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all h-11"
              >
                Explore Workspace
              </a>
            </motion.div>
          </motion.div>

          {/* Right Column: Living Hero Workspace with Layered Depth & reveal sequence */}
          <motion.div 
            style={{ y: heroCardY }}
            className="lg:col-span-5 flex justify-center lg:justify-end relative"
          >
            {/* Layer 5: Glassmorphic geometric drifting particles */}
            <motion.div 
              style={{ y: heroParticleY }}
              animate={{ y: [-15, 15, -15], rotate: [0, 360] }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-12 -left-12 w-8 h-8 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm pointer-events-none opacity-40 z-0"
            />
            <motion.div 
              style={{ y: heroParticleY }}
              animate={{ y: [15, -15, 15], rotate: [360, 0] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-16 -right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm pointer-events-none opacity-30 z-0"
            />

            {/* Central 3D Workspace Card */}
            <div className="relative w-full max-w-[380px] z-10">
              {/* Backglow */}
              <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-accent to-[#14B8A6] opacity-20 blur-xl pointer-events-none" />

              <motion.div
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: MOTION_TOKENS.floating, repeat: Infinity, ease: 'easeInOut' }}
                style={{ 
                  transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.15s ease-out'
                }}
                className="w-full bg-[#0d1e33]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_30px_60px_rgba(0,0,0,0.6)] font-sans text-slate-200 select-none overflow-hidden relative"
              >
                {/* Layer 2: Connection network SVG */}
                <div className="absolute inset-0 pointer-events-none opacity-10">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <line x1="20%" y1="10%" x2="50%" y2="40%" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="50%" y1="40%" x2="80%" y2="20%" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="50%" y1="40%" x2="30%" y2="80%" stroke="#14B8A6" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="50%" cy="40%" r="4" fill="#3B82F6" />
                  </svg>
                </div>

                {/* Scan Beam Effect (Triggered on Reveal Stage 1) */}
                {revealStage === 1 && (
                  <motion.div
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_10px_var(--accent)] z-20 pointer-events-none"
                  />
                )}

                {/* Header Info */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-accent text-sm">
                      SJ
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-none">Sarah Jenkins</h4>
                      <p className="text-[11px] text-gray-400 mt-1 font-medium font-sans">Lead Frontend Engineer</p>
                    </div>
                  </div>
                  
                  {/* Score block */}
                  <AnimatePresence mode="wait">
                    {revealStage >= 3 ? (
                      <motion.div
                        key="score"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-11 h-11 rounded-xl border border-accent/30 bg-accent/5 flex flex-col items-center justify-center font-mono text-accent"
                      >
                        <span className="text-base font-extrabold leading-none">88</span>
                        <span className="text-[7px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">Score</span>
                      </motion.div>
                    ) : (
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
                    )}
                  </AnimatePresence>
                </div>

                {/* Interactive Matrix */}
                <div className="py-4 space-y-3 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Skill Mapping</span>
                    {revealStage >= 2 && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[9px] text-[#14B8A6] font-semibold"
                      >
                        88% Match
                      </motion.span>
                    )}
                  </div>

                  <div className="min-h-[92px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                      {revealStage < 2 ? (
                        <motion.div 
                          key="ingest-state"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center justify-center py-4 text-center space-y-2.5"
                        >
                          <FileText className="h-6 w-6 text-gray-500 animate-pulse" />
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                            {revealStage === 0 ? 'Loading CV File...' : 'Scanning Tech Credentials...'}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="skills-matrix"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-3 text-left"
                        >
                          <div>
                            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Matched</div>
                            <div className="flex flex-wrap gap-1.5">
                              {['React', 'TypeScript', 'TailwindCSS', 'FastAPI'].map((s) => (
                                <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/5 border border-accent/20 text-[10px] font-medium text-accent">
                                  <Check className="h-2.5 w-2.5 text-[#14B8A6]" />
                                  <span>{s}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Gaps</div>
                            <div className="flex flex-wrap gap-1.5">
                              {['Docker', 'Kubernetes'].map((s) => (
                                <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/5 border border-red-500/15 text-[10px] font-medium text-red-400">
                                  <X className="h-2.5 w-2.5 text-red-500" />
                                  <span>{s}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* AI Recommendation panel */}
                <div className="min-h-[64px] flex flex-col justify-end pt-3 border-t border-white/5 relative z-10">
                  <AnimatePresence>
                    {revealStage >= 4 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
                        className="space-y-1.5 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">AI Hiring Decision</span>
                          <span className="text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                            Strong Hire
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-normal">
                          Strong fundamentals. Container gaps can be tested during live exam blueprinting.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </motion.div>

              {/* Layer 4: Orbital Info Cards (Render when stage matches recommendation) */}
              <AnimatePresence>
                {revealStage >= 4 && (
                  <>
                    {/* Orb 1: upper left */}
                    <motion.div
                      style={{ y: heroOrbitY }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, y: [-4, 4, -4], x: [-3, 3, -3] }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-6 -left-12 z-20 bg-[#0d1e33]/90 border border-emerald-500/30 backdrop-blur-md rounded-xl p-2.5 shadow-lg text-emerald-400 text-[10px] font-bold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#14B8A6]" />
                      <span>+88% Skills Match</span>
                    </motion.div>

                    {/* Orb 2: upper right */}
                    <motion.div
                      style={{ y: heroOrbitY }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, y: [4, -4, 4], x: [3, -3, 3] }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute top-1/3 -right-16 z-20 bg-[#0d1e33]/90 border border-red-500/25 backdrop-blur-md rounded-xl p-2.5 shadow-lg text-red-400 text-[10px] font-bold flex items-center gap-1.5"
                    >
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                      <span>Docker Gap Flagged</span>
                    </motion.div>

                    {/* Orb 3: lower center */}
                    <motion.div
                      style={{ y: heroOrbitY }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, y: [-5, 5, -5], x: [2, -2, 2] }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -bottom-8 -left-4 z-20 bg-[#0d1e33]/90 border border-accent/30 backdrop-blur-md rounded-xl p-2.5 shadow-lg text-accent text-[10px] font-bold flex items-center gap-1.5"
                    >
                      <Terminal className="h-3.5 w-3.5 text-accent" />
                      <span>3 Question Blueprints</span>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

            </div>
          </motion.div>

        </div>
      </section>

      {/* Trust Band directly under Hero */}
      <section className="border-y border-white/5 bg-[#080f1a]/85 py-8 px-6 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">
            Platform Impact Summary
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 w-full sm:w-auto">
            <div className="text-center sm:text-left">
              <span className="text-2xl md:text-3xl font-heading font-extrabold text-white block">
                <MetricCounter value={10} suffix="k+" />
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Processed</span>
            </div>
            <div className="text-center sm:text-left">
              <span className="text-2xl md:text-3xl font-heading font-extrabold text-white block">
                <MetricCounter value={98} suffix="%" />
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Parsing Accuracy</span>
            </div>
            <div className="text-center sm:text-left">
              <span className="text-2xl md:text-3xl font-heading font-extrabold text-white block">
                <MetricCounter value={14} suffix=" Days" />
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Avg. Saved</span>
            </div>
            <div className="text-center sm:text-left">
              <span className="text-2xl md:text-3xl font-heading font-extrabold text-white block">
                <MetricCounter value={0} suffix="%" />
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Cheat Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Product Story Simulator */}
      <section id="simulator" className="py-24 px-6 max-w-7xl mx-auto relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-accent tracking-widest block">Interactive Sandbox</span>
              <h2 className="text-3xl font-heading font-extrabold text-white leading-tight">
                Simulate Ingestion & Evaluation
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Click the steps to preview how AegisHire parses resume stacks, maps gaps, and formats exam Blueprints immediately.
              </p>
            </div>

            {/* Stepper Buttons */}
            <div className="space-y-3 pt-2">
              {[
                { label: 'Step 1: Resume Uploaded', desc: 'PDF file ingestion & structure reading' },
                { label: 'Step 2: AI Tech Mapping', desc: 'Core skills and gap parsing' },
                { label: 'Step 3: Recommendation & MCQ Generation', desc: 'Blueprints setup and scoring analysis' }
              ].map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStepClick(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex gap-4 ${
                    activeStoryStep === idx
                      ? 'bg-[#0d1e33] border-accent/40 shadow-[0_4px_20px_rgba(59,130,246,0.15)]'
                      : 'bg-transparent border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    activeStoryStep === idx ? 'bg-accent text-white' : 'bg-white/10 text-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold transition-colors ${activeStoryStep === idx ? 'text-white' : 'text-gray-300'}`}>
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">{step.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 px-1">
              <div className={`w-2 h-2 rounded-full ${autoPlayStory ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                {autoPlayStory ? 'Autoplay Active' : 'Autoplay paused. Click a step to review'}
              </span>
              {!autoPlayStory && (
                <button 
                  onClick={() => setAutoPlayStory(true)}
                  className="text-[10px] text-accent font-bold hover:underline ml-2"
                >
                  Resume Loop
                </button>
              )}
            </div>
          </div>

          {/* Right side: Mock Simulator Container */}
          <div className="lg:col-span-7 flex items-center justify-center bg-[#080f1a]/85 border border-white/5 rounded-2xl p-8 min-h-[420px] relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            
            <AnimatePresence mode="wait">
              {activeStoryStep === 0 && (
                <motion.div
                  key="step-upload"
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.35 }}
                  className="w-full max-w-[360px] bg-[#0c1829] border border-white/10 rounded-2xl p-6 text-center space-y-6"
                >
                  <div className="w-16 h-16 rounded-full bg-accent/5 border border-accent/15 flex items-center justify-center mx-auto text-accent">
                    <UploadCloud className="h-8 w-8 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Ingesting Candidate Resume</h3>
                    <p className="text-[11px] text-gray-400 font-sans">PDF format parsed deterministically</p>
                  </div>

                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.8, ease: 'easeInOut' }}
                      className="h-full bg-accent" 
                    />
                  </div>

                  <div className="flex items-center justify-between border border-white/5 bg-[#0f213a]/50 rounded-xl p-3 text-left">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-accent" />
                      <div>
                        <span className="text-[10px] font-bold text-white block font-sans">Marcus_Chen_CV.pdf</span>
                        <span className="text-[9px] text-gray-500 font-sans">980 KB • Ready for Screening</span>
                      </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                </motion.div>
              )}

              {activeStoryStep === 1 && (
                <motion.div
                  key="step-parse"
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.35 }}
                  className="w-full max-w-[360px] bg-[#0c1829] border border-white/10 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-[11px]">MC</div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Marcus Chen</h4>
                        <p className="text-[9px] text-gray-500 font-sans">Staff Python Backend</p>
                      </div>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-accent font-bold animate-pulse">Analyzing...</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Matched Core Stack</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Django', 'Python', 'MySQL'].map(s => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/5 border border-accent/20 text-[10px] font-medium text-accent">
                          <Check className="h-2.5 w-2.5 text-emerald-400" />
                          <span>{s}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Identified Gaps</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Celery', 'Redis', 'AWS'].map(s => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/5 border border-red-500/15 text-[10px] font-medium text-red-400">
                          <X className="h-2.5 w-2.5 text-red-500" />
                          <span>{s}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStoryStep === 2 && (
                <motion.div
                  key="step-recommendation"
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.35 }}
                  className="w-full max-w-[360px] bg-[#0c1829] border border-white/10 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-accent text-xs">MC</div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Marcus Chen</h4>
                        <p className="text-[9px] text-gray-400 font-sans">Staff Python Backend</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl border border-accent/25 bg-accent/5 flex flex-col items-center justify-center font-mono text-accent">
                      <span className="text-sm font-extrabold leading-none">82</span>
                      <span className="text-[6px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">Score</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">AI Hiring Decision</span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-amber-400 font-sans">
                      Hire
                    </span>
                  </div>

                  <div className="bg-[#11243b]/50 border border-white/5 rounded-xl p-3 text-[10px] leading-normal text-slate-300 font-sans">
                    Candidate satisfies 82% of core criteria. Container gaps (Celery/Redis) generated for target follow-ups.
                  </div>

                  <div className="border border-white/5 bg-[#0f213a]/30 rounded-xl p-2.5 space-y-1.5 text-left">
                    <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold block">Generated blueprint questions</span>
                    <p className="text-[9px] text-gray-300 font-medium italic leading-relaxed">
                      "Describe a real-world scenario where you had to debug a database deadlock during concurrent worker writes."
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      </section>

      {/* Sticky Scroll Story Timeline Section */}
      <section id="timeline" ref={stickyTimelineRef} className="min-h-[160vh] relative z-20 px-6 py-20">
        {/* Section Title */}
        <div className="max-w-7xl mx-auto text-center mb-12">
          <span className="text-[10px] uppercase font-bold text-accent tracking-widest block mb-2">Recruitment Journey</span>
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white leading-tight">
            Walkthrough the Ingestion Pipeline
          </h2>
          <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-sans max-w-xl mx-auto">
            Scroll down to track how candidate profiles progress through checks, validations, and custom exam configurations in real-time.
          </p>
        </div>

        {/* Sticky 3-Column Grid Container */}
        <div className="sticky top-20 h-[calc(100vh-80px)] flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12 max-w-7xl mx-auto py-8">
          
          {/* Left Column: Visual State Previews (Concurrently fading cards, zero unmount flicker) */}
          <div className="w-full md:w-[42%] flex items-center justify-center min-h-[320px] md:min-h-[380px] bg-[#0c1829]/60 border border-white/5 rounded-2xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
            
            {/* Card 0: Ingestion */}
            <motion.div
              initial={false}
              animate={{
                opacity: scrollStage === 0 ? 1 : 0,
                x: scrollStage === 0 ? 0 : scrollStage > 0 ? -30 : 30,
                scale: scrollStage === 0 ? 1 : 0.95,
                pointerEvents: scrollStage === 0 ? 'auto' : 'none'
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4 w-full text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/5 border border-accent/20 flex items-center justify-center mx-auto text-accent shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{TIMELINE_STEPS[0].subtitle}</h4>
                <p className="text-[11px] text-gray-500 mt-1 font-sans">Uploading CV profile, analyzing raw structure.</p>
              </div>
              <div className="border border-white/5 bg-[#0f213a]/30 rounded-xl p-3 flex justify-between items-center text-left w-full max-w-sm mx-auto">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  <div>
                    <span className="text-[10px] font-bold text-white block">Sarah_Jenkins_CV.pdf</span>
                    <span className="text-[9px] text-gray-500">1.2 MB</span>
                  </div>
                </div>
                <span className="text-[9px] text-accent font-bold uppercase tracking-wider">Queued</span>
              </div>
            </motion.div>

            {/* Card 1: Skills Matrix */}
            <motion.div
              initial={false}
              animate={{
                opacity: scrollStage === 1 ? 1 : 0,
                x: scrollStage === 1 ? 0 : scrollStage > 1 ? -30 : 30,
                scale: scrollStage === 1 ? 1 : 0.95,
                pointerEvents: scrollStage === 1 ? 'auto' : 'none'
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4 w-full max-w-sm mx-auto"
            >
              <div className="w-full flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{TIMELINE_STEPS[1].subtitle}</span>
                <span className="text-[9px] text-emerald-400 font-bold uppercase">88% Match</span>
              </div>
              <div className="space-y-2 text-left w-full">
                <div>
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Extracted Core Stack</span>
                  <div className="flex flex-wrap gap-1">
                    {['React', 'TypeScript', 'TailwindCSS', 'FastAPI'].map(s => (
                      <span key={s} className="px-2 py-0.5 bg-accent/5 border border-accent/20 rounded text-[9px] text-accent font-medium">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Gaps Found</span>
                  <div className="flex flex-wrap gap-1">
                    {['Docker', 'Kubernetes'].map(s => (
                      <span key={s} className="px-2 py-0.5 bg-red-500/5 border border-red-500/15 rounded text-[9px] text-red-400 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: MCQ Blueprints */}
            <motion.div
              initial={false}
              animate={{
                opacity: scrollStage === 2 ? 1 : 0,
                x: scrollStage === 2 ? 0 : scrollStage > 2 ? -30 : 30,
                scale: scrollStage === 2 ? 1 : 0.95,
                pointerEvents: scrollStage === 2 ? 'auto' : 'none'
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4 w-full max-w-sm mx-auto text-left"
            >
              <div className="w-full flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{TIMELINE_STEPS[2].subtitle}</span>
                <span className="text-[9px] text-purple-400 font-bold uppercase">Ready</span>
              </div>
              <div className="space-y-2 w-full">
                <div className="bg-[#11243b]/40 border border-white/5 rounded-xl p-3 space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-gray-500 font-bold block font-sans">Generated Question 1 (Technical)</span>
                  <p className="text-[10px] text-gray-300 italic font-sans">"How do you structure a multi-stage Dockerfile to minify React build sizes?"</p>
                </div>
                <div className="bg-[#11243b]/40 border border-white/5 rounded-xl p-3 space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-gray-500 font-bold block font-sans">Generated Question 2 (MCQ)</span>
                  <p className="text-[10px] text-gray-300 italic font-sans">"Which of the following docker-compose fields controls network links?"</p>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Security Logs */}
            <motion.div
              initial={false}
              animate={{
                opacity: scrollStage === 3 ? 1 : 0,
                x: scrollStage === 3 ? 0 : scrollStage > 3 ? -30 : 30,
                scale: scrollStage === 3 ? 1 : 0.95,
                pointerEvents: scrollStage === 3 ? 'auto' : 'none'
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4 w-full max-w-sm mx-auto text-left font-sans"
            >
              <div className="w-full flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{TIMELINE_STEPS[3].subtitle}</span>
                <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-bold uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  Live session
                </span>
              </div>
              <div className="w-full border border-white/5 bg-black/30 rounded-xl p-3.5 space-y-1.5 font-mono text-[9px] text-gray-400">
                <div>11:41:02 - [AUTH] Candidate logged in successfully.</div>
                <div className="text-emerald-400">11:42:15 - [LOG] Focused tab verified.</div>
                <div className="text-amber-400">11:45:30 - [WARN] Browser window focus lost.</div>
                <div className="text-emerald-400">11:45:38 - [LOG] Focused tab restored.</div>
              </div>
            </motion.div>
          </div>

          {/* Center Column: Curved SVG Track with Scrolling glowing Ball */}
          <div className="hidden md:flex w-[16%] h-[550px] items-center justify-center relative">
            <svg viewBox="0 0 100 550" className="w-full h-full overflow-visible">
              <defs>
                <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-active" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="10" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* The S-Curve Background Path */}
              <path 
                d="M 50,50 C 50,100 10,150 10,200 C 10,250 90,300 90,350 C 90,400 50,450 50,500" 
                fill="none" 
                stroke="rgba(255, 255, 255, 0.05)" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />

              {/* Nodes (Milestones) */}
              {[
                { x: 50, y: 50, idx: 0 },
                { x: 10, y: 200, idx: 1 },
                { x: 90, y: 350, idx: 2 },
                { x: 50, y: 500, idx: 3 }
              ].map((node) => {
                const isActive = scrollStage >= node.idx;
                return (
                  <g key={node.idx}>
                    {/* Ring glow */}
                    {isActive && (
                      <circle 
                        cx={node.x} 
                        cy={node.y} 
                        r="12" 
                        fill="none" 
                        stroke="#3B82F6" 
                        strokeWidth="1.5" 
                        className="animate-pulse opacity-40"
                        style={{ filter: "url(#glow-blue)" }}
                      />
                    )}
                    {/* Main node dot */}
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r="6" 
                      className={`transition-all duration-500 cursor-pointer ${
                        isActive 
                          ? 'fill-[#3B82F6] stroke-[#3B82F6] shadow-[0_0_15px_#3B82F6]' 
                          : 'fill-[#0a1220] stroke-white/20'
                      } stroke-[3]`}
                      style={isActive ? { filter: "url(#glow-blue)" } : {}}
                    />
                  </g>
                );
              })}

              {/* The traveling glowing bead */}
              <motion.circle 
                cx={ballX} 
                cy={ballY} 
                r="8" 
                fill="#60A5FA" 
                className="stroke-white stroke-[2]"
                style={{ filter: "url(#glow-active)" }}
              />
            </svg>
          </div>

          {/* Right Column: Detailed Text Descriptions (Fading and sliding in place) */}
          <div className="w-full md:w-[42%] flex items-center justify-center min-h-[320px] md:min-h-[380px] bg-[#0c1829]/60 border border-white/5 rounded-2xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
            {TIMELINE_STEPS.map((step, idx) => (
              <motion.div
                key={idx}
                initial={false}
                animate={{
                  opacity: scrollStage === idx ? 1 : 0,
                  y: scrollStage === idx ? 0 : scrollStage > idx ? -20 : 20,
                  scale: scrollStage === idx ? 1 : 0.98,
                  pointerEvents: scrollStage === idx ? 'auto' : 'none'
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 flex flex-col justify-center p-6 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-accent tracking-widest font-sans px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                    Stage 0{idx + 1}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-heading font-extrabold text-white leading-tight">
                  {step.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-sans">
                  {step.description}
                </p>
                <div className="space-y-2 pt-2 text-left">
                  {step.highlights.map((highlight, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                      <span className="text-xs text-gray-300 font-sans">{highlight}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ATS ➔ AegisHire Chaos to Intelligence Transformation Flow */}
      <section id="transformation" className="py-24 px-6 bg-[#080f1a]/50 border-t border-white/5 relative z-20">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-[10px] uppercase font-bold text-accent tracking-widest block font-sans">The Upgrade Paradigm</span>
            <h2 className="text-3xl font-heading font-extrabold text-white">Chaos ➔ Intelligence</h2>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed font-sans">
              Visualize how AegisHire transforms traditional ATS manual filtering clutter into clean, structured hiring decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Traditional ATS Chaos */}
            <div className="lg:col-span-5 bg-red-950/20 border border-red-500/10 rounded-2xl p-6 min-h-[280px] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-red-500/5 rounded-full blur-xl" />
              <div>
                <span className="text-[9px] uppercase font-bold text-red-400 tracking-wider">Traditional ATS Clutter</span>
                <h3 className="text-sm font-bold text-white mt-1">Manual Screening Guesswork</h3>
              </div>

              {/* Floating chaos alerts */}
              <div className="space-y-2 py-4 relative z-10">
                <motion.div 
                  animate={{ x: [-4, 4, -4], y: [-2, 2, -2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="bg-red-500/5 border border-red-500/15 p-2 rounded-lg text-[10px] text-red-400 font-medium inline-block mr-2"
                >
                  ⚠️ 1200+ Resumes Unread
                </motion.div>
                <motion.div 
                  animate={{ x: [3, -3, 3], y: [-3, 3, -3] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="bg-red-500/5 border border-red-500/15 p-2 rounded-lg text-[10px] text-red-400 font-medium inline-block"
                >
                  ⚠️ Keyword Matches Missing Gaps
                </motion.div>
                <motion.div 
                  animate={{ x: [-3, 3, -3], y: [2, -2, 2] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="bg-red-500/5 border border-red-500/15 p-2 rounded-lg text-[10px] text-red-400 font-medium inline-block"
                >
                  ⚠️ Candidate Bias Risk High
                </motion.div>
              </div>

              <div className="text-[10px] text-red-400/60 font-semibold uppercase tracking-wider">
                Recruiters spend 23+ hours screening
              </div>
            </div>

            {/* Center Column: Swirling Intelligence Core */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full border border-dashed border-accent/40 flex items-center justify-center text-accent relative shadow-[0_0_20px_rgba(59,130,246,0.1)]"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-accent animate-pulse" />
                </div>
              </motion.div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Evaluation Core</span>
            </div>

            {/* Right Column: AegisHire Structured shortlist */}
            <div className="lg:col-span-5 bg-emerald-950/15 border border-emerald-500/10 rounded-2xl p-6 min-h-[280px] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
              <div>
                <span className="text-[9px] uppercase font-bold text-[#14B8A6] tracking-wider">AegisHire Output</span>
                <h3 className="text-sm font-bold text-white mt-1">Structured Candidates Shortlist</h3>
              </div>

              <div className="space-y-2 py-4 relative z-10">
                <div className="bg-[#14B8A6]/5 border border-[#14B8A6]/15 p-2.5 rounded-lg text-[10px] text-[#14B8A6] font-semibold flex items-center justify-between">
                  <span>Top 50 candidates parsed & evaluated</span>
                  <Check className="h-3.5 w-3.5 text-emerald-400 font-extrabold" />
                </div>
                <div className="bg-[#14B8A6]/5 border border-[#14B8A6]/15 p-2.5 rounded-lg text-[10px] text-[#14B8A6] font-semibold flex items-center justify-between">
                  <span>Nice-to-have skill match maps</span>
                  <Check className="h-3.5 w-3.5 text-emerald-400 font-extrabold" />
                </div>
              </div>

              <div className="text-[10px] text-[#14B8A6]/70 font-semibold uppercase tracking-wider font-sans">
                Candidates screened in 2 minutes
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Bento Grid Features Layout Section */}
      <section id="bento" className="py-24 px-6 max-w-7xl mx-auto space-y-16 relative z-20">
        
        <div className="text-center space-y-3">
          <span className="text-[10px] uppercase font-bold text-accent tracking-widest block">Product Modules</span>
          <h2 className="text-3xl font-heading font-extrabold text-white">Interactive Feature Matrix</h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
            Ditch generic listings. Explore how AegisHire's components operate in mock real-time cycles.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Semantic search simulator (Large: spans 2 columns on medium/large screen) */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="md:col-span-2 bg-[#0c1829]/55 border border-white/5 rounded-2xl p-6 flex flex-col justify-between min-h-[300px] shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
          >
            <div className="space-y-2 text-left">
              <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Search className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-sm font-bold text-white">Semantic Candidates Search</h4>
              <p className="text-xs text-gray-400 leading-relaxed max-w-md font-sans">
                Type queries to scan natural background details instead of configuring complex query match fields.
              </p>
            </div>

            {/* Mock query bar visual simulator */}
            <div className="border border-white/5 bg-black/40 rounded-xl p-4.5 space-y-3 mt-4 text-left font-mono">
              <div className="flex items-center gap-2 border border-white/10 bg-[#11243b]/40 rounded-lg px-3 py-2 text-xs text-white">
                <span className="text-accent text-sm font-bold">&gt;</span>
                <span>{searchText}</span>
                <span className="w-1.5 h-4 bg-accent animate-pulse" />
              </div>
              <div className="space-y-1.5 text-[9px] text-gray-400 pl-1">
                {searchText.length >= 10 ? (
                  <>
                    <div className="text-emerald-400">✓ Matches found (2)</div>
                    <div>• Sarah Jenkins (91%) - Python, Django, MySQL, Redis</div>
                    <div>• Marcus Chen (82%) - Python, Django, MySQL</div>
                  </>
                ) : (
                  <div>Typing query parameters...</div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Card 2: MCQ Blueprinter (Medium, 1 col) */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-[#0c1829]/55 border border-white/5 rounded-2xl p-6 flex flex-col justify-between shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
          >
            <div className="space-y-2 text-left">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-sm font-bold text-white">AI MCQ Exam Generation</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Generate questions matching targeted candidate skills gaps.
              </p>
            </div>

            <div className="border border-white/5 bg-[#121c2c]/40 rounded-xl p-3 space-y-1.5 mt-4 text-[9px] text-left">
              <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Target Code Blueprint</div>
              <pre className="bg-black/30 p-2 rounded text-amber-400 leading-tight">
                {`def optimize_db(cursor):
    # MySQL concurrent lock check
    cursor.execute("SELECT ... FOR UPDATE")`}
              </pre>
            </div>
          </motion.div>

          {/* Card 3: Security Logs (Medium, 1 col) */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-[#0c1829]/55 border border-white/5 rounded-2xl p-6 flex flex-col justify-between shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
          >
            <div className="space-y-2 text-left">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <Activity className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-sm font-bold text-white">Session Security Monitoring</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Log copy-paste, tab blur, and focus actions during exam sessions.
              </p>
            </div>

            <div className="border border-white/5 bg-black/40 rounded-xl p-3 font-mono text-[9px] text-red-400 text-left space-y-1 mt-4">
              <div>11:45:30 - Warn: Tab focus lost</div>
              <div className="text-gray-500">11:45:38 - Log: Focus restored</div>
            </div>
          </motion.div>

          {/* Card 4: Ingestion (Small, 1 col) */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-[#0c1829]/55 border border-white/5 rounded-2xl p-6 flex flex-col justify-between shadow-[0_15px_30px_rgba(0,0,0,0.3)] text-left"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <UploadCloud className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-sm font-bold text-white">PDF CV Ingestion</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Convert raw resumes into parsed JSON variables instantly.
              </p>
            </div>
          </motion.div>

          {/* Card 5: Skill Matrix (Small, 1 col) */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-[#0c1829]/55 border border-white/5 rounded-2xl p-6 flex flex-col justify-between shadow-[0_15px_30px_rgba(0,0,0,0.3)] text-left"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6]">
                <Check className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-sm font-bold text-white">Core Skill Matrix</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Map matching requirements with detailed alignment tags.
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Metrics Section */}
      <section id="metrics" className="py-24 border-y border-white/5 bg-[#080f1a]/60 px-6 relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          <div className="space-y-2">
            <h4 className="text-4xl md:text-5xl font-heading font-extrabold text-white">
              <MetricCounter value={98} suffix="%" />
            </h4>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold font-sans">Parsing Accuracy</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-4xl md:text-5xl font-heading font-extrabold text-white">
              <MetricCounter value={14} suffix=" Days" />
            </h4>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold font-sans">Hiring Saved</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-4xl md:text-5xl font-heading font-extrabold text-white">
              <MetricCounter value={0} suffix="%" />
            </h4>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold font-sans">Exam Cheat Rate</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-4xl md:text-5xl font-heading font-extrabold text-white">
              <MetricCounter value={10} suffix="k+" />
            </h4>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold font-sans">Scored Profiles</p>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner Section */}
      <section className="relative py-28 px-6 text-center overflow-hidden z-20">
        <div className="absolute inset-0 bg-[#0B1220] opacity-[0.98] z-0" />
        <div className="absolute inset-0 opacity-20 filter blur-3xl z-0" style={{
          backgroundImage: 'radial-gradient(circle, #4F46E5 0%, transparent 60%)'
        }} />

        <div className="max-w-2xl mx-auto relative z-10 space-y-8">
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white leading-tight">
            Ready to Harder Your Recruitment Pipeline?
          </h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed font-sans">
            Verify credentials, parse skills matrices, and configure cheat-resistant MCQ exams instantly.
          </p>
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => setIsDemoModalOpen(true)}
              className="bg-accent hover:bg-accent/90 text-white font-bold text-xs h-12 px-8 gap-2 shadow-[0_10px_30px_rgba(59,130,246,0.35)] border border-accent/25 relative overflow-hidden group"
            >
              <div className="absolute inset-0 w-1/2 bg-white/20 skew-x-12 translate-x-[-150%] group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
              <span>Request Sandbox Access</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="py-8 border-t border-white/5 text-center text-xs text-gray-600 font-medium relative z-20">
        © 2026 AegisHire AI Recruitment Platform. All rights reserved.
      </footer>

      {/* Request Demo Popup Modal */}
      <RequestDemoModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />

    </div>
  );
}

export default LandingPage;
