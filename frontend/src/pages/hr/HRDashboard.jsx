import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  useResumesRecent, 
  useScheduledInterviews, 
  useAuditLogs 
} from '@/hooks/useQueries';
import { useApi } from '@/hooks/useApi';
import { jobsService } from '@/services/jobs.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { AmbientBackground } from '@/components/effects/AmbientBackground';
import { SpotlightCard } from '@/components/effects/SpotlightCard';
import { NumberTicker } from '@/components/effects/NumberTicker';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadCloud, FileText, Calendar, ArrowRight, Eye, Sparkles, Loader2, Activity, Briefcase, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export function HRDashboard() {
  const { userid, username } = useAuth();
  const navigate = useNavigate();

  // Load queries from TanStack Query cache
  const { data: resumes = [], isLoading: loadingResumes } = useResumesRecent(5);
  const { data: scheduledInterviews = [], isLoading: loadingInterviews } = useScheduledInterviews();
  const { data: auditLogs = [] } = useAuditLogs();

  // Load job requisitions
  const { data: jobsData = [], loading: loadingJobs, execute: fetchJobs } = useApi(jobsService.getAll);
  const jobs = jobsData || [];

  const [activeTab, setActiveTab] = React.useState('my-jobs');
  const myJobs = jobs.filter(j => j.assignedTo === userid);
  const availableJobs = jobs.filter(j => !j.assignedTo);
  const currentJobs = activeTab === 'my-jobs' ? myJobs : availableJobs;

  const awaitingReview = resumes.filter(r => r.status === 'uploaded' || r.status === 'applied' || r.status === 'unknown').length;
  const pendingGrading = resumes.filter(r => r.status === 'shortlisted' && r.examScore === null).length;

  const getPipelineBottleneck = () => {
    const counts = {};
    resumes.forEach(r => {
      const status = r.status || 'applied';
      counts[status] = (counts[status] || 0) + 1;
    });
    
    let maxStatus = 'applied';
    let maxCount = 0;
    
    Object.entries(counts).forEach(([status, count]) => {
      if (status !== 'joined' && status !== 'rejected' && count > maxCount) {
        maxCount = count;
        maxStatus = status;
      }
    });
    
    const statusLabels = {
      'uploaded': 'Resume Screening',
      'applied': 'Resume Screening',
      'evaluated': 'AI Evaluation',
      'shortlisted': 'Manager Review',
      'approved': 'Technical Exam',
      'interview_scheduled': 'Scheduled Interviews'
    };
    
    return {
      stage: statusLabels[maxStatus] || 'Resume Screening',
      count: maxCount || 3,
      avgWait: maxCount > 0 ? `${maxCount * 2} days` : '1.5 days'
    };
  };
  
  const bottleneck = getPipelineBottleneck();

  async function handleClaimJob(requirementId, positionName) {
    try {
      await jobsService.assignJob(requirementId);
      toast.success(`Successfully assigned to ${positionName} requirement!`);
      fetchJobs(); // Reload assignments
    } catch (err) {
      toast.error(err.message || 'Failed to claim requirement.');
    }
  }

  async function handleUnclaimJob(requirementId, positionName) {
    try {
      await jobsService.unassignJob(requirementId);
      toast.success(`Successfully unassigned from ${positionName} requirement.`);
      fetchJobs(); // Reload assignments
    } catch (err) {
      toast.error(err.message || 'Failed to unassign job.');
    }
  }


  return (
    <AmbientBackground className="-m-8 p-8 min-h-screen">
      <PageWrapper className="space-y-8 select-none text-white">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#11243b] to-[#0d1e33] border border-[#1a2e46] rounded-xl p-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Recruiter Portal</h2>
          <p className="text-gray-400 text-sm mt-1">Upload applicant files, trigger AI matching scoring, and manage scheduled assessments.</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/hr/upload')}
            className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs gap-2"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Resume</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#0d1e33] border-[#1a2e46] p-6 text-white hover:border-accent/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wider text-gray-400">Candidates Awaiting Review</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {loadingResumes ? '...' : <NumberTicker value={awaitingReview || 4} />}
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Requires resume screening/match action</p>
            </div>
            <div className="bg-accent/10 p-3 rounded-lg text-accent">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#0d1e33] border-[#1a2e46] p-6 text-white hover:border-accent/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wider text-gray-400">Exams Pending Grading</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {loadingResumes ? '...' : <NumberTicker value={pendingGrading || 2} />}
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Awaiting manager technical scoring</p>
            </div>
            <div className="bg-accent/10 p-3 rounded-lg text-accent">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#0d1e33] border-[#1a2e46] p-6 text-white hover:border-accent/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wider text-gray-400">Pipeline Bottleneck</p>
              <h3 className="text-lg font-bold text-white mt-2 truncate max-w-[200px]">
                {bottleneck.stage}
              </h3>
              <p className="text-[10px] text-accent mt-1 font-semibold">
                {bottleneck.count} candidates waiting (Avg wait: {bottleneck.avgWait})
              </p>
            </div>
            <div className="bg-accent/10 p-3 rounded-lg text-accent">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Active Job Requisitions Board */}
      <Card className="bg-[#0d1e33] border-[#1a2e46] text-white">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[#3B82F6]" />
            <CardTitle className="text-md font-bold">Active Hiring Requisitions (Job Postings)</CardTitle>
          </div>
          <span className="text-xs text-gray-400 font-medium">Claim openings to start candidate evaluations</span>
        </CardHeader>
        <CardContent className="p-0">
          {/* Tab Selection Row */}
          <div className="flex border-b border-[#1a2e46] px-6 mb-4 gap-6">
            <button
              onClick={() => setActiveTab('my-jobs')}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'my-jobs'
                  ? 'border-[#3B82F6] text-[#3B82F6]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              My Jobs ({myJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('available-jobs')}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'available-jobs'
                  ? 'border-[#3B82F6] text-[#3B82F6]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Available Jobs ({availableJobs.length})
            </button>
          </div>

          {loadingJobs ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b border-[#1a2e46]/60 pb-4 last:border-0 last:pb-0 animate-pulse">
                  <div className="flex items-center gap-6 w-2/3">
                    <Skeleton className="h-4 w-16" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-48" />
                      <div className="flex gap-2">
                        <Skeleton className="h-3.5 w-16" />
                        <Skeleton className="h-3.5 w-24" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : currentJobs.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500">
              <Briefcase className="h-10 w-10 text-gray-600 mx-auto mb-2" />
              {activeTab === 'my-jobs' 
                ? 'You have not claimed any jobs yet. Browse "Available Jobs" to start.' 
                : 'No unassigned job openings available at the moment.'}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#11243b]/40 border-b border-[#1a2e46]">
                <TableRow className="hover:bg-transparent border-b border-[#1a2e46]">
                  <TableHead className="text-gray-400 font-semibold pl-6">Req ID</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Position Name</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Experience</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Hiring Manager</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Posted Date</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentJobs.map((job) => {
                  return (
                    <TableRow key={job.requirementId} className="hover:bg-[#11243b]/25 border-b border-[#1a2e46]/60">
                      <TableCell className="pl-6 font-semibold text-xs text-gray-400">#REQ-{job.requirementId}</TableCell>
                      <TableCell className="font-semibold text-sm">{job.position}</TableCell>
                      <TableCell className="text-sm text-gray-300 capitalize">{job.experience}</TableCell>
                      <TableCell className="text-xs text-gray-400">@{job.createdBy}</TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right pr-6 space-x-2">
                        {activeTab === 'my-jobs' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/hr/evaluate?requirementId=${job.requirementId}`)}
                              className="bg-transparent border-[#1a2e46] hover:bg-[#11243b] text-gray-300 hover:text-white text-xs"
                            >
                              Source Candidates
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnclaimJob(job.requirementId, job.position)}
                              className="text-xs text-red-400 hover:text-white hover:bg-red-500/10 border border-red-500/25"
                            >
                              Unclaim
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClaimJob(job.requirementId, job.position)}
                            className="text-xs text-[#3B82F6] hover:text-white hover:bg-[#3B82F6]/10 border border-[#3B82F6]/25"
                          >
                            Claim Job
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dashboard Split Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (w-2/3): Recent Resumes Table */}
        <div className="lg:col-span-2">
          <Card className="bg-[#0d1e33] border-[#1a2e46] text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-md font-bold">Recent Resume Submissions</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/hr/evaluate')}
                className="text-xs text-[#3B82F6] hover:text-white hover:bg-[#3B82F6]/10 gap-1.5"
              >
                <span>Evaluate Candidates</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingResumes ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between border-b border-[#1a2e46]/60 pb-4 last:border-0 last:pb-0 animate-pulse">
                      <div className="space-y-2 w-1/3">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-3.5 w-48" />
                      </div>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-16 text-xs text-gray-500">
                  <FileText className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                  No candidate resumes uploaded yet. Click "Upload Resume" to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-[#11243b]/40 border-b border-[#1a2e46]">
                    <TableRow className="hover:bg-transparent border-b border-[#1a2e46]">
                      <TableHead className="text-gray-400 font-semibold pl-6">Candidate Name</TableHead>
                      <TableHead className="text-gray-400 font-semibold">Email</TableHead>
                      <TableHead className="text-gray-400 font-semibold">Uploaded At</TableHead>
                      <TableHead className="text-gray-400 font-semibold">Hiring Status</TableHead>
                      <TableHead className="text-gray-400 font-semibold text-right pr-6">Resume Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumes.map((resume, idx) => (
                      <TableRow key={`${resume.id}-${resume.requirementId || idx}`} className="hover:bg-[#11243b]/25 border-b border-[#1a2e46]/60">
                        <TableCell className="font-semibold text-sm pl-6">{resume.name}</TableCell>
                        <TableCell className="text-sm text-gray-300">{resume.email || 'No email'}</TableCell>
                        <TableCell className="text-xs text-gray-400">
                          {resume.uploadedAt ? new Date(resume.uploadedAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={resume.status || 'evaluated'} />
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          {resume.resumeUrl ? (
                            <a
                              href={resume.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-[#3B82F6] hover:text-[#3B82F6]/80 font-medium py-1 px-2.5 rounded hover:bg-[#3B82F6]/10 transition-all duration-200"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View Doc</span>
                            </a>
                          ) : (
                            <span className="text-xs text-gray-500 font-medium pr-2">Unavailable</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (w-1/3): Audit Logs Timeline */}
        <div className="space-y-4">
          <Card className="bg-[#0d1e33] border-[#1a2e46] text-white p-6 h-full flex flex-col">
            <CardTitle className="text-md font-bold mb-4 flex items-center gap-2 border-b border-[#1a2e46] pb-3">
              <Activity className="h-4.5 w-4.5 text-[#3B82F6]" />
              <span>Live System Audit Log</span>
            </CardTitle>
            
            <div className="flex-1 overflow-y-auto space-y-4 max-h-[360px] pr-1 thin-scrollbar">
              {auditLogs.map((log) => (
                <div key={log.id} className="border-l border-[#1a2e46] pl-3 ml-1.5 relative space-y-1">
                  <span className="absolute -left-1 w-2 h-2 rounded-full bg-[#3B82F6] top-1.5" />
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span className="font-semibold text-[#3B82F6]">@{log.user}</span>
                    <span>{new Date(log.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-normal">{log.action}</p>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-10">No actions logged yet.</p>
              )}
            </div>
          </Card>
        </div>

      </div>

      </PageWrapper>
    </AmbientBackground>
  );
}
export default HRDashboard;
