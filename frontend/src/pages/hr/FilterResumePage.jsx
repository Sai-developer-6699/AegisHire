import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { jobsService } from '@/services/jobs.service';
import { resumesService } from '@/services/resumes.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { ResumeCard } from '@/components/shared/ResumeCard';
import { CandidateDrawer } from '@/components/shared/CandidateDrawer';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, CheckSquare, Loader2, FileText, AlertCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { StandardDialog } from '@/components/shared/StandardDialog';
import { Skeleton } from '@/components/ui/skeleton';

import { CandidateComparison } from '@/components/shared/CandidateComparison';

export function FilterResumePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryReqId = searchParams.get('requirementId') || '';
  const [selectedRequirementId, setSelectedRequirementId] = useState(queryReqId);
  const [selectedResumes, setSelectedResumes] = useState([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isShortlisting, setIsShortlisting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [comparingCandidates, setComparingCandidates] = useState(null);
  
  // Explainability drawer states
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Load active job positions
  const { data: jobsData, loading: loadingJobs } = useApi(jobsService.getAll);
  const jobs = jobsData || [];

  // Load evaluated resumes for the selected position requirement
  const {
    data: resumesData,
    loading: loadingResumes,
    execute: fetchResumes,
    setData: setResumes,
  } = useApi(resumesService.getEvaluated, false); // Do not run automatically on mount
  const resumes = resumesData || [];

  const filteredResumes = resumes.filter(res => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = res.name?.toLowerCase().includes(q);
    const emailMatch = res.email?.toLowerCase().includes(q);
    const skillsMatch = res.matched_skills?.some(s => s.toLowerCase().includes(q)) || res.missing_skills?.some(s => s.toLowerCase().includes(q));
    return nameMatch || emailMatch || skillsMatch;
  });

  // Trigger loading when position selection changes
  useEffect(() => {
    if (selectedRequirementId) {
      fetchResumes(selectedRequirementId);
      setSelectedResumes([]); // Clear selection
    } else {
      setResumes([]);
    }
  }, [selectedRequirementId, fetchResumes, setResumes]);


  // Run AI matching evaluation pipeline
  async function handleAIEvaluate() {
    if (!selectedRequirementId) return;
    setIsEvaluating(true);
    try {
      const response = await resumesService.evaluate(selectedRequirementId);
      if (response && response.evaluated_count > 0) {
        toast.success(`AI match completed! Evaluated ${response.evaluated_count} new resumes.`);
      } else {
        toast.info(response?.message || 'No pending candidate resumes found for this position.');
      }
      fetchResumes(selectedRequirementId); // Refresh list
    } catch (err) {
      toast.error(err.message || 'AI Matching evaluation failed.');
    } finally {
      setIsEvaluating(false);
    }
  }

  // Handle toggling check states of individual cards
  function handleSelectCard(resumeId, isChecked) {
    if (isChecked) {
      setSelectedResumes((prev) => [...prev, resumeId]);
    } else {
      setSelectedResumes((prev) => prev.filter((id) => id !== resumeId));
    }
  }

  // Submit selections to the shortlist API after user confirmation
  async function executeShortlistSubmit() {
    setIsConfirmOpen(false);
    setIsShortlisting(true);
    try {
      const payload = selectedResumes.map((resumeId) => ({
        resume_id: resumeId,
        requirement_id: parseInt(selectedRequirementId),
      }));

      await resumesService.shortlist(payload);
      toast.success(`Successfully shortlisted and passed ${selectedResumes.length} candidates to Manager!`);
      navigate('/hr/interviews');
    } catch (err) {
      toast.error(err.message || 'Failed to submit shortlist approvals.');
    } finally {
      setIsShortlisting(false);
    }
  }

  function handleShortlistSubmit() {
    if (selectedResumes.length === 0 || !selectedRequirementId) return;
    setIsConfirmOpen(true);
  }

  if (!loadingJobs && jobs.length === 0) {
    return (
      <PageWrapper className="space-y-6 text-white select-none">
        <div className="flex flex-col items-center justify-center py-28 gap-4 bg-[#0d1e33] border border-[#1a2e46] rounded-xl text-center px-6">
          <div className="bg-[#11243b] p-4 rounded-full border border-[#1a2e46] text-gray-400">
            <Sparkles className="h-10 w-10 text-gray-500" />
          </div>
          <div>
            <h3 className="text-md font-bold text-white">No Assigned Positions</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mb-4">
              You currently do not have any job requirements assigned to you. Claim an active requirement from the dashboard to start evaluating candidate resumes.
            </p>
            <Button
              onClick={() => navigate('/hr')}
              className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs"
            >
              Go to Recruiter Dashboard
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 text-white select-none">
      
      {/* Title */}
      <div className="pb-4 border-b border-[#1a2e46] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-white">AI Candidate Matching</h2>
          <p className="text-xs text-gray-400 mt-1">Select a job opening, run the matching evaluation, and approve shortlisted profiles.</p>
        </div>

        {/* Position Select dropdown */}
        <div className="w-full md:max-w-xs">
          {loadingJobs ? (
            <div className="h-9 w-full bg-[#11243b] rounded-md animate-pulse border border-[#1a2e46]" />
          ) : (
            <Select value={selectedRequirementId} onValueChange={setSelectedRequirementId}>
              <SelectTrigger className="bg-[#11243b] border-[#1a2e46] text-white focus:ring-0 focus:border-[#3B82F6] w-full">
                <SelectValue placeholder="Select Job Position" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a1727] border-[#1a2e46] text-white">
                {jobs.map((job) => (
                  <SelectItem key={job.requirementId} value={job.requirementId.toString()}>
                    {job.position} (REQ-{job.requirementId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {!selectedRequirementId ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-28 gap-4 bg-[#0d1e33] border border-[#1a2e46] rounded-xl text-center px-6">
          <div className="bg-[#11243b] p-4 rounded-full border border-[#1a2e46] text-gray-400">
            <Sparkles className="h-10 w-10 text-gray-500" />
          </div>
          <div>
            <h3 className="text-md font-bold text-white">No Position Selected</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              Please choose a job posting from the dropdown header to load and evaluate candidate matching records.
            </p>
          </div>
        </div>
      ) : (
        /* Sourced Pool Details & Toolbar */
        <div className="space-y-6">
          
          {/* Job Description Summary Banner */}
          {jobs.find((j) => j.requirementId.toString() === selectedRequirementId) && (
            <div className="bg-gradient-to-r from-[#11243b]/40 to-[#0d1e33]/40 border border-[#1a2e46] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hiring Details</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-xs text-gray-400">
                  <p>
                    <span className="font-semibold text-gray-300">Position Profile:</span>{" "}
                    {jobs.find((j) => j.requirementId.toString() === selectedRequirementId)?.position}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-300">Required Experience:</span>{" "}
                    <span className="capitalize">{jobs.find((j) => j.requirementId.toString() === selectedRequirementId)?.experience}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-300">Hiring Manager:</span>{" "}
                    <span className="text-[#3B82F6]">@{jobs.find((j) => j.requirementId.toString() === selectedRequirementId)?.createdBy}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-300">Claimed Recruiter:</span>{" "}
                    <span>
                      {jobs.find((j) => j.requirementId.toString() === selectedRequirementId)?.assignedUsername
                        ? `@${jobs.find((j) => j.requirementId.toString() === selectedRequirementId)?.assignedUsername}`
                        : "Unassigned"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 italic bg-[#11243b]/20 px-3 py-2 rounded-lg border border-[#1a2e46]/60">
                Candidates shortlisted here will be automatically routed to Hiring Manager @{jobs.find((j) => j.requirementId.toString() === selectedRequirementId)?.createdBy} for technical assessment.
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0c1a2d] p-4 rounded-xl border border-[#1a2e46] w-full">
            
            {/* Left: Stats & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Candidate Pool:</span>
                <span className="bg-[#11243b] text-white text-xs px-2.5 py-1 rounded-md border border-[#1a2e46] font-bold">
                  {resumes.length} total
                </span>
                <span className="bg-[#3B82F6]/15 text-[#3B82F6] text-xs px-2.5 py-1 rounded-md border border-[#3B82F6]/20 font-bold">
                  {selectedResumes.length} selected
                </span>
              </div>
              <input
                type="text"
                placeholder="Search name or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#11243b] border border-[#1a2e46] rounded-md px-3 py-1.5 text-xs text-white placeholder-gray-500 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>

            {/* Right: Triggers */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
              {/* Compare Selected */}
              {selectedResumes.length === 2 && (
                <Button
                  type="button"
                  onClick={() => {
                    const candA = resumes.find(r => r.id === selectedResumes[0]);
                    const candB = resumes.find(r => r.id === selectedResumes[1]);
                    setComparingCandidates({ candidateA: candA, candidateB: candB });
                  }}
                  className="bg-secondary hover:bg-secondary/80 border border-border text-slate-200 text-xs font-semibold px-4 h-9 gap-1.5"
                >
                  Compare Selected
                </Button>
              )}
              
              {/* Trigger AI Evaluation */}
              <Button
                type="button"
                onClick={handleAIEvaluate}
                disabled={isEvaluating || loadingResumes}
                className="bg-[#11243b] hover:bg-[#1a2e46] text-[#3B82F6] border border-[#3B82F6]/20 hover:border-[#3B82F6]/40 text-xs font-semibold px-4 h-9 gap-1.5"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#3B82F6]" />
                    <span>Scoring...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-[#3B82F6]" />
                    <span>Run AI Evaluation</span>
                  </>
                )}
              </Button>

              {/* Submit Shortlist */}
              <Button
                type="button"
                onClick={handleShortlistSubmit}
                disabled={selectedResumes.length === 0 || isShortlisting || loadingResumes}
                className="bg-[#3B82F6] hover:bg-accent/90 text-white font-bold text-xs px-5 h-9 gap-1.5"
              >
                {isShortlisting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Shortlisting...</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 text-white" />
                    <span>Shortlist Selected</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Evaluations Grid */}
          {loadingResumes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#0d1e33] border border-[#1a2e46] rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-3.5 w-48" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-1/4" />
                    <div className="flex flex-wrap gap-1">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-14" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-6 w-16 rounded" />
                    <Skeleton className="h-8 w-24 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : resumes.length === 0 ? (
            /* Warning / Setup Notice */
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[#0d1e33] border border-[#1a2e46] rounded-xl text-center px-6">
              <AlertCircle className="h-10 w-10 text-yellow-500" />
              <div>
                <h3 className="text-md font-bold text-white">No Matching Records</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  There are no candidates currently evaluated for this requirement. Click **"Run AI Evaluation"** above to evaluate pending resumes.
                </p>
              </div>
            </div>
          ) : filteredResumes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[#0d1e33]/50 border border-[#1a2e46] rounded-xl text-center px-6">
              <AlertCircle className="h-10 w-10 text-slate-400" />
              <div>
                <h3 className="text-md font-bold text-white">No Search Results</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  We couldn't find any candidate matching "<strong>{searchQuery}</strong>". Try another keyword.
                </p>
              </div>
            </div>
          ) : (
            /* Resumes Grid list */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResumes.map((res) => (
                <ResumeCard
                  key={res.id}
                  resume={res}
                  isSelected={selectedResumes.includes(res.id)}
                  onSelect={(val) => handleSelectCard(res.id, val)}
                  showCheckbox={res.status === 'evaluated' || res.status === 'unknown'}
                  onViewDetails={() => {
                    setActiveCandidate(res);
                    setIsDrawerOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Slide-over Explainable AI detail drawer */}
      <CandidateDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        candidate={activeCandidate}
        requirementId={selectedRequirementId}
        onStatusUpdated={() => fetchResumes(selectedRequirementId)}
      />

      {/* Shortlist Submission Confirmation Dialog */}
      <StandardDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        type="confirmation"
        title="Confirm Shortlist Transfer"
        description={`Are you sure you want to pass these ${selectedResumes.length} candidate(s) to hiring manager @${
          jobs.find((j) => j.requirementId.toString() === selectedRequirementId)?.createdBy || 'Manager'
        } for the "${
          jobs.find((j) => j.requirementId.toString() === selectedRequirementId)?.position || 'Position'
        }" job opening? They will be routed for technical exams and evaluations.`}
        confirmText="Pass to Manager"
        cancelText="Cancel"
        onConfirm={executeShortlistSubmit}
      />

      {comparingCandidates && (
        <CandidateComparison
          candidateA={comparingCandidates.candidateA}
          candidateB={comparingCandidates.candidateB}
          onClose={() => setComparingCandidates(null)}
        />
      )}
    </PageWrapper>
  );
}
export default FilterResumePage;
