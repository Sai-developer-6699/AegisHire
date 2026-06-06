import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CandidateDrawer } from '@/components/shared/CandidateDrawer';
import { resumesService } from '@/services/resumes.service';
import { useApi } from '@/hooks/useApi';
import { Loader2, Kanban, Sparkles, User, Mail, Calendar, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const PIPELINE_COLUMNS = [
  { id: 'applied', label: 'Applied', color: 'border-blue-500/20 text-blue-400 bg-blue-500/5' },
  { id: 'evaluated', label: 'AI Evaluated', color: 'border-purple-500/20 text-purple-400 bg-purple-500/5' },
  { id: 'shortlisted', label: 'Shortlisted', color: 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5' },
  { id: 'interviewing', label: 'Interviewing', color: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5' },
  { id: 'exam', label: 'Exam Session', color: 'border-pink-500/20 text-pink-400 bg-pink-500/5' },
  { id: 'selected', label: 'Hired/Selected', color: 'border-accent/20 text-[#3B82F6] bg-accent/5' }
];

export function PipelineBoard() {
  const navigate = useNavigate();
  const [pipelineData, setPipelineData] = useState({});
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load all candidates from backend
  async function loadPipeline() {
    setLoading(true);
    try {
      // In this workspace, getRecent returns baseline candidates
      const candidates = await resumesService.getRecent(100);
      
      // Distribute candidates into columns based on status mapping
      const columns = {
        applied: [],
        evaluated: [],
        shortlisted: [],
        interviewing: [],
        exam: [],
        selected: []
      };

      candidates.forEach(cand => {
        const status = (cand.status || 'applied').toLowerCase();
        if (status === 'applied') {
          columns.applied.push(cand);
        } else if (status === 'evaluated' || status === 'unknown') {
          columns.evaluated.push(cand);
        } else if (status === 'shortlisted') {
          columns.shortlisted.push(cand);
        } else if (status === 'approved' || status === 'interview_scheduled' || status.includes('interview')) {
          columns.interviewing.push(cand);
        } else if (status.includes('exam') || status.includes('score')) {
          columns.exam.push(cand);
        } else if (status === 'finalised' || status === 'joined' || status.includes('selected') || status.includes('hired')) {
          columns.selected.push(cand);
        } else {
          columns.applied.push(cand); // Fallback
        }
      });

      setPipelineData(columns);
    } catch (err) {
      console.error('Failed to load pipeline:', err);
      toast.error('Failed to fetch pipeline tracking records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPipeline();
  }, []);

  // Simulating dragging or moving candidate along stages
  const moveCandidate = (cand, fromCol, toCol) => {
    // Update local state to reflect movement
    setPipelineData(prev => {
      const sourceList = prev[fromCol].filter(c => c.id !== cand.id);
      const updatedCand = { ...cand, status: toCol };
      const targetList = [...prev[toCol], updatedCand];
      
      return {
        ...prev,
        [fromCol]: sourceList,
        [toCol]: targetList
      };
    });
    
    toast.success(`Moved ${cand.name} to ${PIPELINE_COLUMNS.find(c => c.id === toCol)?.label}`);
  };

  return (
    <PageWrapper className="space-y-6 text-white select-none flex flex-col h-full overflow-hidden">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-white flex items-center gap-2">
            <Kanban className="h-5 w-5 text-[#3B82F6]" />
            <span>Recruitment Pipeline Board</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">Track candidates progress through hiring workflows. Select cards for AI insights.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search candidate or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#11243b] border border-border rounded-md px-3 py-1.5 text-xs text-white placeholder-gray-500 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
          />
          <Button
            onClick={loadPipeline}
            variant="outline"
            size="sm"
            className="text-xs bg-secondary border-border text-gray-300 hover:text-white shrink-0"
          >
            Refresh Board
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 overflow-x-auto pb-4 flex gap-4 items-start animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-72 flex-shrink-0 bg-[#0e1a29]/40 border border-border/40 rounded-xl p-3.5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/40">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-6 rounded-full" />
              </div>
              <div className="space-y-3">
                {[1, 2].map((j) => (
                  <div key={j} className="bg-[#11243b] border border-border/60 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : Object.values(pipelineData).reduce((acc, list) => acc + list.length, 0) === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-28 gap-4 bg-[#0d1e33] border border-[#1a2e46] rounded-xl text-center px-6">
          <div className="bg-[#11243b] p-4 rounded-full border border-[#1a2e46] text-gray-400">
            <Kanban className="h-10 w-10 text-gray-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-md font-bold text-white">No Candidates in Pipeline</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mb-4">
              You do not have any candidate records currently active in your assigned job pipelines. Claim an active requirement and evaluate resumes to populate the board.
            </p>
            <Button
              onClick={() => navigate('/hr')}
              className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs"
            >
              Go to Recruiter Dashboard
            </Button>
          </div>
        </div>
      ) : (
        /* Columns Grid Container */
        <div className="flex-1 overflow-x-auto pb-4 flex gap-4 items-start thin-scrollbar">
          {PIPELINE_COLUMNS.map((col) => {
            const colCandidates = pipelineData[col.id] || [];
            const filteredCandidates = colCandidates.filter(cand => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return cand.name?.toLowerCase().includes(q) ||
                     (cand.email && cand.email.toLowerCase().includes(q)) ||
                     (cand.matched_skills && cand.matched_skills.some(s => s.toLowerCase().includes(q)));
            });
            
            return (
              <div 
                key={col.id} 
                className="w-72 flex-shrink-0 bg-[#0e1a29]/60 border border-border rounded-xl p-3.5 flex flex-col max-h-[70vh] overflow-hidden"
              >
                {/* Column Header */}
                <div className={`p-2 border rounded-lg flex items-center justify-between mb-4 font-bold tracking-wide ${col.color}`}>
                  <span className="text-xs uppercase">{col.label}</span>
                  <Badge className="bg-slate-900 border-border text-white text-[10px] py-0.5 px-2">
                    {filteredCandidates.length}
                  </Badge>
                </div>

                {/* Candidate list container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 thin-scrollbar">
                  {filteredCandidates.map((cand) => (
                    <div
                      key={cand.mapId || cand.id}
                      onClick={() => {
                        setActiveCandidate(cand);
                        setIsDrawerOpen(true);
                      }}
                      className="bg-[#11243b] hover:bg-[#152e4b] border border-border/80 hover:border-gray-500 rounded-lg p-3 cursor-pointer transition-all duration-200 space-y-2 relative group"
                    >
                      {/* Name & Score */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white leading-tight group-hover:text-[#3B82F6] truncate flex-1">
                          {cand.name}
                        </span>
                        {cand.score && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none ${
                            cand.score >= 85 ? 'text-[#3B82F6] border-[#3B82F6]/20 bg-[#3B82F6]/5' : 
                            cand.score >= 70 ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' : 
                            'text-gray-400 border-border bg-slate-900'
                          }`}>
                            {cand.score}%
                          </span>
                        )}
                      </div>

                      {/* Details row */}
                      <div className="space-y-1 text-[10px] text-gray-400">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span>{cand.email || 'No email'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          <span>{cand.uploadedAt ? new Date(cand.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}</span>
                        </div>
                      </div>

                      {/* Quick stage transition button */}
                      <div className="flex justify-between items-center pt-2 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] text-[#3B82F6] font-bold flex items-center gap-0.5">
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>AI Report</span>
                        </span>
                        
                        {col.id !== 'selected' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextCols = PIPELINE_COLUMNS.map(c => c.id);
                              const currentIdx = nextCols.indexOf(col.id);
                              const nextColId = nextCols[currentIdx + 1];
                              moveCandidate(cand, col.id, nextColId);
                            }}
                            className="h-5 w-5 bg-secondary border border-border text-gray-400 hover:text-white rounded"
                            title="Move to next stage"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {colCandidates.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-border rounded-lg text-[10px] text-gray-600">
                      Empty column
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Explainable AI profile detail drawer */}
      <CandidateDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        candidate={activeCandidate}
        requirementId={activeCandidate?.requirementId || activeCandidate?.requirement_id}
        onStatusUpdated={loadPipeline}
      />
      
    </PageWrapper>
  );
}

export default PipelineBoard;
