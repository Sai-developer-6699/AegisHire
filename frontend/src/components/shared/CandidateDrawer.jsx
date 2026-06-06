import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, HelpCircle, Activity, ExternalLink, Calendar, Award, Loader2, ListChecks, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { resumesService } from '@/services/resumes.service';
import { hrService } from '@/services/hr.service';
import { toast } from 'sonner';
import { CandidateComparison } from './CandidateComparison';

export function CandidateDrawer({ isOpen, onClose, candidate, requirementId, onScheduleAction, onStatusUpdated }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [candidateA, setCandidateA] = useState(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Sync comparison state from localStorage
  useEffect(() => {
    if (!isOpen || !candidate) return;

    const handleStorageChange = () => {
      const stored = localStorage.getItem('compare_candidate_a');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const currentId = candidate.id || candidate.resumeId || candidate.resume_id;
          const storedId = parsed.id || parsed.resumeId || parsed.resume_id;
          if (storedId !== currentId) {
            setCandidateA(parsed);
          } else {
            setCandidateA(null);
          }
        } catch (e) {
          setCandidateA(null);
        }
      } else {
        setCandidateA(null);
      }
    };

    handleStorageChange();
    window.addEventListener('compare_state_changed', handleStorageChange);
    return () => window.removeEventListener('compare_state_changed', handleStorageChange);
  }, [isOpen, candidate]);

  // Load details
  useEffect(() => {
    if (!isOpen || !candidate) {
      setDetails(null);
      return;
    }

    async function fetchDetails() {
      setLoading(true);
      try {
        const reqId = requirementId || candidate.requirementId || candidate.requirement_id || 1;
        const candId = candidate.id || candidate.resumeId || candidate.resume_id;
        if (candId) {
          const data = await resumesService.getAiDetails(candId, reqId);
          setDetails(data);
        }
      } catch (error) {
        console.error("Failed to fetch candidate AI details:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [isOpen, candidate, requirementId]);

  // Escape key handler to close drawer
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!candidate) return null;

  const score = candidate.score || (details && details.score) || 70;

  // Color mapping for score badges (enterprise slate/cobalt)
  const scoreColorClass = 
    score >= 85 ? 'text-accent border-accent/30 bg-accent/5' :
    score >= 70 ? 'text-amber-400 border-amber-400/30 bg-amber-400/5' :
    'text-red-400 border-red-400/30 bg-red-400/5';

  const recommendation = details?.hiring_recommendation?.recommendation || 'Hold';
  const confidence = details?.hiring_recommendation?.confidence || 'Medium';
  const factors = details?.hiring_recommendation?.factors || [];

  const recColorClass = 
    recommendation === 'Strong Hire' ? 'text-accent border-accent/30 bg-accent/10' :
    recommendation === 'Hire' ? 'text-indigo-400 border-indigo-400/20 bg-indigo-400/10' :
    recommendation === 'Hold' ? 'text-amber-400 border-amber-400/20 bg-amber-400/10' :
    'text-red-400 border-red-400/20 bg-red-400/10';

  // Status transitions visual mapping
  const getStepIndex = (status) => {
    const s = (status || 'uploaded').toLowerCase();
    if (s === 'uploaded' || s === 'applied' || s === 'unknown') return 0;
    if (s === 'evaluated') return 1;
    if (s === 'shortlisted') return 2;
    if (s.includes('exam') || s.includes('score')) return 3;
    if (s === 'approved' || s === 'interview_scheduled' || s.includes('interview')) return 4;
    if (s === 'joined' || s === 'rejected' || s.includes('finalised') || s.includes('selected') || s.includes('hired')) return 5;
    return 0;
  };

  const currentStep = getStepIndex(details?.status || candidate.status);
  const isRejected = (details?.status || candidate.status || '').toLowerCase() === 'rejected';

  const steps = [
    { label: 'Uploaded' },
    { label: 'Evaluated' },
    { label: 'Shortlisted' },
    { label: 'Exam' },
    { label: 'Interview' },
    { label: isRejected ? 'Rejected' : 'Finalized' }
  ];

  // Quick Action Handlers
  const handleShortlist = async () => {
    try {
      const reqId = requirementId || candidate.requirementId || candidate.requirement_id || 1;
      const resumeId = candidate.id || candidate.resumeId || candidate.resume_id;
      await resumesService.shortlist([{ resume_id: Number(resumeId), requirement_id: Number(reqId) }]);
      toast.success(`${candidate.name} has been shortlisted!`);
      if (onStatusUpdated) onStatusUpdated();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to shortlist candidate.');
    }
  };

  const handleReject = async () => {
    try {
      const mId = candidate.mapId || details?.map_id || details?.mapId;
      if (!mId) {
        toast.error('Candidate mapping identifier not found. Cannot perform action.');
        return;
      }
      await hrService.updateFinalisedStatus([{ mapId: Number(mId), newStatus: 'rejected' }]);
      toast.success(`${candidate.name} has been rejected.`);
      if (onStatusUpdated) onStatusUpdated();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to reject candidate.');
    }
  };

  const handleCompare = () => {
    localStorage.setItem('compare_candidate_a', JSON.stringify({
      ...candidate,
      score: score,
      ai_summary: details?.ai_summary,
      matched_skills: details?.matched_skills || candidate?.matched_skills || [],
      missing_skills: details?.missing_skills || candidate?.missing_skills || [],
      experience_years: details?.experience_years || candidate?.experience_years || null,
      education_detected: details?.education_detected || candidate?.education_detected || '',
      status: details?.status || candidate?.status || 'unknown'
    }));
    window.dispatchEvent(new Event('compare_state_changed'));
    toast.success(`${candidate.name} selected as Candidate A for comparison.`);
  };

  // Drawer loading skeleton
  const DrawerSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="bg-[#0e1c2c] border border-border/40 rounded-xl p-4 space-y-3">
        <div className="h-4 bg-secondary rounded w-1/3" />
        <div className="h-3 bg-secondary rounded w-2/3" />
        <div className="h-3 bg-secondary rounded w-1/2" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-secondary rounded w-1/4" />
        <div className="bg-[#0d1e30]/40 border border-border/40 rounded-xl p-4 h-24" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-secondary rounded w-1/3" />
        <div className="bg-[#0e1c2c]/40 border border-border/40 rounded-xl h-36" />
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Shadow overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Slide-over Content Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[500px] bg-card border-l border-border shadow-2xl z-50 flex flex-col text-slate-200 overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex flex-col gap-4 bg-[#0d1726]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Visual Score Ring */}
                  <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center font-mono ${scoreColorClass}`}>
                    <span className="text-xl font-extrabold">{score}</span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-85">Score</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">{candidate.name}</h3>
                    <p className="text-xs text-gray-400">{candidate.email || 'No email provided'}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Integrated Quick Actions Panel */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40 mt-1">
                {/* Compare Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompare}
                  className="text-xs font-semibold border-border hover:bg-secondary h-8 gap-1 text-slate-300"
                >
                  Compare
                </Button>

                {/* Compare Side-by-Side Launcher */}
                {candidateA && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowComparisonModal(true)}
                    className="text-xs font-semibold bg-accent hover:bg-accent/90 text-white h-8 gap-1"
                  >
                    Compare with {candidateA.name}
                  </Button>
                )}

                {/* Shortlist Action */}
                {((details?.status || candidate.status) === 'evaluated' || (details?.status || candidate.status) === 'uploaded' || (details?.status || candidate.status) === 'unknown') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShortlist}
                    className="text-xs font-semibold border-accent/30 text-accent hover:bg-accent/10 hover:text-white h-8"
                  >
                    Shortlist
                  </Button>
                )}

                {/* Reject Action */}
                {(details?.status || candidate.status) !== 'rejected' && (details?.status || candidate.status) !== 'joined' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReject}
                    className="text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
                  >
                    Reject
                  </Button>
                )}

                {/* Schedule Interview */}
                {(details?.status || candidate.status) === 'shortlisted' && onScheduleAction && (
                  <Button
                    onClick={() => {
                      onScheduleAction(candidate);
                      onClose();
                    }}
                    className="bg-accent hover:bg-accent/90 text-white font-bold text-xs h-8 gap-1.5"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Schedule</span>
                  </Button>
                )}

                {/* View Resume PDF */}
                {(candidate.resumeUrl || candidate.file_location) && (
                  <a
                    href={candidate.resumeUrl || candidate.file_location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-1 bg-secondary hover:bg-secondary/80 border border-border rounded-md text-xs font-semibold text-slate-200 h-8 transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    <span>Resume</span>
                  </a>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border bg-[#0d1726]/40 px-6">
              {[
                { id: 'overview', label: 'Overview & Fit' },
                { id: 'skills', label: 'Skill Matrix' },
                { id: 'questions', label: 'Interviewer Pack' },
                { id: 'history', label: 'Audit Timeline' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 pt-3 px-4 text-xs font-semibold transition-all border-b-2 -mb-[2px] ${
                    activeTab === tab.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Viewport */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
              
              {loading ? (
                <DrawerSkeleton />
              ) : (
                <>
                  {/* TAB 1: OVERVIEW & FIT */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Visual Timeline Progress Tracker */}
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Candidate Progress</span>
                        <div className="bg-secondary/25 border border-border/40 rounded-xl p-5">
                          <div className="flex items-center justify-between relative">
                            {/* Connector Line */}
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/40 -translate-y-1/2 z-0" />
                            <div 
                              className="absolute top-1/2 left-0 h-0.5 bg-accent -translate-y-1/2 z-0 transition-all duration-300"
                              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                            />

                            {steps.map((step, idx) => {
                              const isCompleted = idx < currentStep;
                              const isActive = idx === currentStep;
                              
                              let circleBg = 'bg-[#0f172a] border-border text-gray-500';
                              let textColor = 'text-gray-400';
                              
                              if (isActive) {
                                circleBg = isRejected && idx === 5 
                                  ? 'bg-destructive border-destructive text-white' 
                                  : 'bg-accent border-accent text-white';
                                textColor = 'text-white font-bold';
                              } else if (isCompleted) {
                                circleBg = 'bg-accent border-accent text-white';
                                textColor = 'text-accent';
                              }

                              return (
                                <div key={idx} className="flex flex-col items-center z-10 relative">
                                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${circleBg}`}>
                                    {isCompleted ? '✓' : idx + 1}
                                  </div>
                                  <span className={`text-[9px] mt-2 ${textColor} font-semibold uppercase tracking-wider`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Hiring Recommendation Engine Panel */}
                      <div className="bg-secondary/25 border border-border/60 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Recommendation Insight</span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${recColorClass}`}>
                            {recommendation}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <ShieldAlert className="h-4 w-4 text-accent" />
                          <span>Confidence Level: <strong className="text-white">{confidence}</strong></span>
                        </div>

                        {factors.length > 0 && (
                          <div className="pt-2 border-t border-border/40 space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Decision Factors</span>
                            <ul className="text-xs text-gray-300 list-disc list-inside space-y-1 pl-1">
                              {factors.map((factor, idx) => (
                                <li key={idx} className="leading-relaxed">{factor}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Explainable AI reasoning */}
                      {details?.ai_summary && (
                        <div className="space-y-2">
                          <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400">Match Explainability</h4>
                          <div className="bg-secondary/10 border border-border/40 rounded-xl p-4">
                            <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-line">{details.ai_summary}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: SKILL MATRIX */}
                  {activeTab === 'skills' && details?.skill_matrix && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400">Skill Competency Matrix</h4>
                        <Badge className="bg-accent/10 border border-accent/25 text-accent text-[10px] font-bold">
                          Matched Skills: {details.overall_skill_match}%
                        </Badge>
                      </div>
                      
                      <div className="bg-secondary/15 border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-border bg-[#0d1726]/40 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                              <th className="p-3">Skill</th>
                              <th className="p-3">Required</th>
                              <th className="p-3 text-right">Candidate Level</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {details.skill_matrix.map((item, idx) => {
                              const matchColor = 
                                item.match === 100 ? 'text-accent font-bold' :
                                item.match === 70 ? 'text-amber-400 font-semibold' :
                                'text-red-400';
                              return (
                                <tr key={idx} className="hover:bg-secondary/20">
                                  <td className="p-3 font-medium text-white">{item.name}</td>
                                  <td className="p-3">
                                    <Badge variant="outline" className={item.required ? 'border-amber-500/30 text-amber-500 bg-amber-500/5 text-[9px]' : 'border-gray-500/30 text-gray-500 text-[9px]'}>
                                      {item.required ? 'Yes' : 'No'}
                                    </Badge>
                                  </td>
                                  <td className={`p-3 text-right ${matchColor}`}>{item.match}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: INTERVIEWER QUESTIONS */}
                  {activeTab === 'questions' && details?.suggested_questions && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-accent" />
                        <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400 font-semibold">AI Interviewer Question Pack</h4>
                      </div>
                      <div className="bg-secondary/15 border border-border rounded-xl p-4 space-y-4">
                        <p className="text-[10px] text-gray-400 leading-normal">
                          Recruiter Guide: Use these candidate-specific questions during live screening or interviews to assess critical gaps.
                        </p>
                        {details.suggested_questions.map((question, index) => (
                          <div key={index} className="space-y-1 pl-3 border-l-2 border-accent/40">
                            <span className="text-[9px] uppercase font-bold text-accent">Guide Question {index + 1}</span>
                            <p className="text-xs text-slate-200 leading-relaxed font-medium">{question}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: AUDIT TIMELINE */}
                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-accent" />
                        <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400">Activity Timeline (Audit Trail)</h4>
                      </div>
                      
                      <div className="relative border-l border-border ml-2 pl-4 space-y-5 py-1">
                        <div className="relative">
                          <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-accent" />
                          <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                            <span>Resume Uploaded</span>
                            <span>Jun 2, 18:40</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">Uploaded by recruiter via HR console.</p>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-accent" />
                          <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                            <span>AI Score Evaluated</span>
                            <span>Jun 2, 18:42</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">AI pipeline computed match score: {score}%.</p>
                        </div>
                        {currentStep >= 2 && (
                          <div className="relative">
                            <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-accent" />
                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                              <span>Shortlisted</span>
                              <span>Jun 3, 10:15</span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">Approved and moved to manager shortlist stage.</p>
                          </div>
                        )}
                        {currentStep >= 3 && (
                          <div className="relative">
                            <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-accent" />
                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                              <span>Interview Scheduled</span>
                              <span>Jun 4, 14:00</span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">HR scheduled assessment screening session.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </motion.div>
        </>
      )}

      {/* Global side-by-side comparison modal */}
      {showComparisonModal && (
        <CandidateComparison 
          candidateA={candidateA}
          candidateB={{
            ...candidate,
            score: score,
            ai_summary: details?.ai_summary,
            matched_skills: details?.matched_skills || candidate?.matched_skills || [],
            missing_skills: details?.missing_skills || candidate?.missing_skills || [],
            experience_years: details?.experience_years || candidate?.experience_years || null,
            education_detected: details?.education_detected || candidate?.education_detected || '',
            status: details?.status || candidate?.status || 'unknown'
          }}
          onClose={() => setShowComparisonModal(false)}
        />
      )}
    </AnimatePresence>
  );
}

export default CandidateDrawer;
