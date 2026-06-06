import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { jobsService } from '@/services/jobs.service';
import { managerService } from '@/services/manager.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { AmbientBackground } from '@/components/effects/AmbientBackground';
import { SpotlightCard } from '@/components/effects/SpotlightCard';
import { NumberTicker } from '@/components/effects/NumberTicker';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Users, PlusCircle, ArrowRight, Eye, ClipboardList, Loader2 } from 'lucide-react';

export function ManagerDashboard() {
  const { username } = useAuth();
  const navigate = useNavigate();

  // Load all job requirements
  const { data: jobsData, loading: loadingJobs } = useApi(jobsService.getAll);
  const jobs = jobsData || [];

  // Load shortlist statistics to aggregate candidate count
  const { data: statsData, loading: loadingStats } = useApi(managerService.getPositionsWithShortlisted);
  const shortlistStats = statsData || [];

  const totalShortlisted = shortlistStats.reduce((acc, curr) => acc + (curr.shortlisted_count ?? 0), 0);

  return (
    <AmbientBackground className="-m-8 p-8 min-h-screen">
      <PageWrapper className="space-y-8 select-none text-white">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-[#11243b] to-[#0d1e33] border border-[#1a2e46] rounded-xl p-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Manager Portal</h2>
          <p className="text-gray-400 text-sm mt-1">Review active requirements, screen candidates, and submit assessments.</p>
        </div>
        <Button
          onClick={() => navigate('/manager/jobs')}
          className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create Posting</span>
        </Button>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#0d1e33] border-[#1a2e46] p-6 text-white hover:border-accent/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wider text-gray-400">Candidates Awaiting Review</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {loadingStats ? '...' : <NumberTicker value={totalShortlisted} />}
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Shortlisted profiles awaiting hiring decision</p>
            </div>
            <div className="bg-accent/10 p-3 rounded-lg text-accent">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#0d1e33] border-[#1a2e46] p-6 text-white hover:border-accent/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wider text-gray-400">Unclaimed Requisitions</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {loadingJobs ? '...' : <NumberTicker value={jobs.filter(j => !j.assignedTo).length} />}
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Openings requiring HR recruiter claiming</p>
            </div>
            <div className="bg-accent/10 p-3 rounded-lg text-accent">
              <Briefcase className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#0d1e33] border-[#1a2e46] p-6 text-white hover:border-accent/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wider text-gray-400">Manager Bottleneck</p>
              <h3 className="text-lg font-bold text-white mt-2">
                Manager Interview
              </h3>
              <p className="text-[10px] text-accent mt-1 font-semibold">
                {totalShortlisted} candidate approvals pending evaluation
              </p>
            </div>
            <div className="bg-accent/10 p-3 rounded-lg text-accent">
              <ClipboardList className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Requirements Table Card */}
      <Card className="bg-[#0d1e33] border-[#1a2e46] text-white">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-md font-bold">Active Job Openings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-xs text-gray-500">
              <Briefcase className="h-10 w-10 text-gray-600 mx-auto mb-2" />
              No active job postings found. Click "Create Posting" to add one.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#11243b]/40 border-b border-[#1a2e46]">
                <TableRow className="hover:bg-transparent border-b border-[#1a2e46]">
                  <TableHead className="text-gray-400 font-semibold pl-6">Req ID</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Position</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Experience</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Created By</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Date Posted</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right pr-6">Screening Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const stat = shortlistStats.find((s) => s.requirement_id === job.requirementId);
                  const shortlistedCount = stat ? stat.shortlisted_count : 0;

                  return (
                    <TableRow key={job.requirementId} className="hover:bg-[#11243b]/25 border-b border-[#1a2e46]/60">
                      <TableCell className="pl-6 font-semibold text-xs text-gray-400">#REQ-{job.requirementId}</TableCell>
                      <TableCell className="font-semibold text-sm">{job.position}</TableCell>
                      <TableCell className="text-sm text-gray-300 capitalize">{job.experience}</TableCell>
                      <TableCell className="text-xs text-gray-400">@{job.createdBy}</TableCell>
                      <TableCell className="text-xs text-gray-400">{job.createdAt}</TableCell>
                      <TableCell className="text-right pr-6 space-x-2">
                        {/* Review Shortlist Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/manager/shortlist?requirementId=${job.requirementId}`)}
                          disabled={shortlistedCount === 0}
                          className={`text-xs gap-1.5 ${
                            shortlistedCount > 0
                              ? 'text-[#3B82F6] hover:text-white hover:bg-[#3B82F6]/10 border border-[#3B82F6]/20'
                              : 'text-gray-500 cursor-not-allowed hover:bg-transparent border border-transparent'
                          }`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Shortlist ({shortlistedCount})</span>
                        </Button>

                        {/* Performance metrics tracking button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/manager/performance?requirementId=${job.requirementId}`)}
                          className="bg-transparent border-[#1a2e46] hover:bg-[#11243b] text-gray-300 hover:text-white text-xs gap-1.5"
                        >
                          <ClipboardList className="h-3.5 w-3.5 text-gray-400 group-hover:text-white" />
                          <span>Performance</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </PageWrapper>
    </AmbientBackground>
  );
}
export default ManagerDashboard;
