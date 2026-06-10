import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { usersService } from '@/services/users.service';
import { jobsService } from '@/services/jobs.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { AmbientBackground } from '@/components/effects/AmbientBackground';
import { SpotlightCard } from '@/components/effects/SpotlightCard';
import { NumberTicker } from '@/components/effects/NumberTicker';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ShieldAlert, ArrowRight, UserPlus, Briefcase, Trash2, Eye, EyeOff, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

export function AdminDashboard() {
  const { username } = useAuth();
  const navigate = useNavigate();
  
  const { data: usersData, loading: loadingUsers } = useApi(usersService.getAll);
  const users = usersData || [];

  // Jobs requisitions management state
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const data = await jobsService.getAll(showDeleted);
      setJobs(data || []);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [showDeleted]);

  const handleDeleteJob = async (requirementId) => {
    if (!window.confirm("Are you sure you want to delete this job requirement? This will hide it from normal users but preserve its historical metrics for audits.")) return;
    try {
      await jobsService.updateJobStatus(requirementId, 'DELETED');
      toast.success("Job posting successfully deleted (soft-deleted).");
      fetchJobs();
    } catch (error) {
      toast.error(error.message || 'Failed to delete job posting.');
    }
  };

  const handleReopenJob = async (requirementId) => {
    try {
      await jobsService.updateJobStatus(requirementId, 'ACTIVE');
      toast.success("Job posting successfully restored to active.");
      fetchJobs();
    } catch (error) {
      toast.error(error.message || 'Failed to restore job status.');
    }
  };

  return (
    <AmbientBackground className="-m-8 p-8 min-h-screen">
      <PageWrapper className="space-y-8 select-none text-white">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#11243b] to-[#0d1e33] border border-[#1a2e46] rounded-xl p-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome back, {username}!</h2>
          <p className="text-gray-400 text-sm mt-1">Configure user accounts, access parameters, and security policies.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => navigate('/admin/users/add')}
            className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs gap-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#0d1e33] border-[#1a2e46] p-6 text-white hover:border-accent/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wider text-gray-400">Total Users</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {loadingUsers ? '...' : <NumberTicker value={users.length} />}
              </h3>
            </div>
            <div className="bg-[#3B82F6]/10 p-3 rounded-lg text-[#3B82F6]">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#0d1e33] border-[#1a2e46] p-6 text-white hover:border-accent/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wider text-gray-400">Security Roles</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                <NumberTicker value={4} />
              </h3>
            </div>
            <div className="bg-[#3B82F6]/10 p-3 rounded-lg text-[#3B82F6]">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#0d1e33] border-[#1a2e46] p-6 text-white hover:border-accent/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wider text-gray-400">System Status</p>
              <h3 className="text-md font-bold text-[#3B82F6] mt-3 tracking-wide uppercase flex items-center gap-1.5 font-semibold">
                <span className="h-2 w-2 rounded-full bg-[#3B82F6] animate-ping" />
                Active & Secured
              </h3>
            </div>
            <div className="bg-[#3B82F6]/10 p-3 rounded-lg text-[#3B82F6]">
              <Briefcase className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Shortcuts & Quick Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Navigation Shortcuts */}
        <Card className="bg-[#0d1e33] border-[#1a2e46] text-white">
          <CardHeader>
            <CardTitle className="text-md font-bold">Quick Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              onClick={() => navigate('/admin/users')}
              className="flex items-center justify-between p-4 bg-[#11243b] hover:bg-[#11243b]/80 border border-[#1a2e46] hover:border-[#3B82F6]/30 rounded-lg cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center gap-3 font-semibold">
                <Users className="h-5 w-5 text-[#3B82F6]" />
                <div className="text-left">
                  <p className="text-sm font-semibold">User Directory</p>
                  <p className="text-xs text-gray-400">View and remove registered user accounts.</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>

            <div 
              onClick={() => navigate('/admin/user-groups')}
              className="flex items-center justify-between p-4 bg-[#11243b] hover:bg-[#11243b]/80 border border-[#1a2e46] hover:border-[#3B82F6]/30 rounded-lg cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center gap-3 font-semibold">
                <Briefcase className="h-5 w-5 text-[#3B82F6]" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Access Groups</p>
                  <p className="text-xs text-gray-400">Review users partitioned by system roles.</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Users list */}
        <Card className="bg-[#0d1e33] border-[#1a2e46] text-white">
          <CardHeader>
            <CardTitle className="text-md font-bold">Recent Registered Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingUsers ? (
              <p className="text-xs text-gray-400 text-center py-8">Loading users list...</p>
            ) : users.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No registered users in the database.</p>
            ) : (
              users.slice(0, 4).map((usr) => (
                <div key={usr.id} className="flex items-center justify-between p-3 bg-[#11243b]/40 rounded-lg border border-[#1a2e46]/60">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#11243b] border border-[#1a2e46] text-[#3B82F6] flex items-center justify-center font-bold text-xs">
                      {usr.initials}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{usr.fullName}</p>
                      <p className="text-xs text-gray-400">@{usr.username} • {usr.role}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${
                    usr.status === 'active' 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {usr.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Requisition Postings Management Table */}
      <Card className="bg-[#0d1e33] border-[#1a2e46] text-white mt-8">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-md font-bold">Job Requisitions Governance</CardTitle>
            <p className="text-xs text-gray-400 mt-1">Review active status, audit logs, or archive/delete postings.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleted(!showDeleted)}
            className={`text-xs gap-1.5 border-[#1a2e46] hover:bg-[#11243b] ${showDeleted ? 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/30' : 'text-gray-400'}`}
          >
            {showDeleted ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span>{showDeleted ? 'Hide Deleted' : 'Show Deleted'}</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingJobs ? (
            <p className="text-xs text-gray-400 text-center py-8">Loading requisitions list...</p>
          ) : jobs.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No job requirements match this filter.</p>
          ) : (
            <Table>
              <TableHeader className="bg-[#11243b]/40 border-b border-[#1a2e46]">
                <TableRow className="hover:bg-transparent border-b border-[#1a2e46]">
                  <TableHead className="text-gray-400 pl-6">Req ID</TableHead>
                  <TableHead className="text-gray-400">Position</TableHead>
                  <TableHead className="text-gray-400">Created By</TableHead>
                  <TableHead className="text-gray-400">Date Posted</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400 text-right pr-6">Administrative Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.requirementId} className="hover:bg-[#11243b]/25 border-b border-[#1a2e46]/60">
                    <TableCell className="pl-6 font-semibold text-xs text-gray-400">#REQ-{job.requirementId}</TableCell>
                    <TableCell className="font-semibold text-sm">{job.position}</TableCell>
                    <TableCell className="text-xs text-gray-400">@{job.createdBy}</TableCell>
                    <TableCell className="text-xs text-gray-400">{job.createdAt}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        job.status === 'ACTIVE' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : job.status === 'CLOSED'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {job.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      {job.status === 'DELETED' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReopenJob(job.requirementId)}
                          className="text-xs text-green-400 hover:bg-green-500/10 border border-green-500/20"
                        >
                          Restore
                        </Button>
                      ) : (
                        <>
                          {job.status === 'ACTIVE' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => jobsService.updateJobStatus(job.requirementId, 'CLOSED').then(() => { toast.success('Job Requisition closed.'); fetchJobs(); })}
                              className="text-xs text-amber-400 hover:bg-amber-500/10 border border-amber-500/20"
                            >
                              Close
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteJob(job.requirementId)}
                            className="text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      </PageWrapper>
    </AmbientBackground>
  );
}
export default AdminDashboard;
