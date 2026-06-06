import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService } from '@/services/interview.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, User, Check, Loader2, ListOrdered, Calendar } from 'lucide-react';


export function InterviewSchedulingPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // Scheduling Form State
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('10:00');
  const [interviewerName, setInterviewerName] = useState('');

  // Load both candidates and scheduled list
  useEffect(() => {
    loadCandidates();
    loadScheduledInterviews();
  }, []);

  const loadCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const data = await interviewService.getCandidatesForInterview();
      setCandidates(data || []);
    } catch (error) {
      console.error('Failed to load interview candidates:', error);
      toast.error('Failed to load eligible candidates.');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const loadScheduledInterviews = async () => {
    setLoadingScheduled(true);
    try {
      const data = await interviewService.getScheduledInterviews();
      setScheduledInterviews(data || []);
    } catch (error) {
      console.error('Failed to load scheduled interviews:', error);
      toast.error('Failed to load scheduled interviews.');
    } finally {
      setLoadingScheduled(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) {
      toast.error('Please select a candidate first.');
      return;
    }
    if (!interviewDate) {
      toast.error('Please select a date.');
      return;
    }
    if (!interviewTime) {
      toast.error('Please select a time.');
      return;
    }

    setScheduling(true);
    try {
      // Combine date and time to ISO format (e.g. YYYY-MM-DDTHH:MM:SS)
      const datetimeString = `${interviewDate}T${interviewTime}:00`;
      
      await interviewService.scheduleInterview(
        selectedCandidate.mapId,
        datetimeString,
        interviewerName || 'Not Assigned'
      );

      toast.success(`Interview scheduled successfully for ${selectedCandidate.name}!`);
      
      // Reset form
      setSelectedCandidate(null);
      setInterviewDate('');
      setInterviewTime('10:00');
      setInterviewerName('');

      // Reload
      await loadCandidates();
      await loadScheduledInterviews();
    } catch (error) {
      console.error('Scheduling failed:', error);
      toast.error(error?.error || 'Failed to schedule interview.');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <PageWrapper className="space-y-6 text-white select-none">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#3B82F6]">Interview Scheduling</h1>
        <p className="text-gray-400 mt-1">Coordinate time slots and assign interviewers for approved candidates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Eligible Candidates List */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-[#0d1e33] border-[#1a2e46] text-white">
            <CardHeader className="pb-3 border-b border-[#1a2e46]/60">
              <CardTitle className="text-md font-bold">Eligible Candidates</CardTitle>
              <CardDescription className="text-gray-400 text-xs">Candidates approved by manager or graded from exams.</CardDescription>
            </CardHeader>
            <CardContent className="p-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loadingCandidates ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-[#3B82F6]" />
                  <p className="text-xs text-gray-400">Loading list...</p>
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center py-10 px-4 text-xs text-gray-500 border border-dashed border-[#1a2e46] rounded-lg">
                  <User className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="mb-3">No candidates ready to schedule.</p>
                  <Button
                    onClick={() => navigate('/hr')}
                    className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-[10px] h-7 px-3"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {candidates.map((cand) => {
                    const isSel = selectedCandidate?.mapId === cand.mapId;
                    return (
                      <div
                        key={cand.mapId}
                        onClick={() => setSelectedCandidate(cand)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          isSel
                            ? 'bg-[#3B82F6]/15 border-[#3B82F6] shadow-glow'
                            : 'bg-[#11243b] border-[#1a2e46]/60 hover:bg-[#11243b]/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{cand.name}</h4>
                          {cand.examScore != null && (
                            <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border-none text-[10px] font-bold px-1.5 py-0.5">
                              {cand.examScore} pts
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{cand.email}</p>
                        <div className="flex justify-between items-center mt-2 pt-1 border-t border-[#1a2e46]/40">
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                            Status: {cand.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle: Schedule Form */}
        <div className="lg:col-span-1">
          <Card className="bg-[#0d1e33] border-[#1a2e46] text-white h-full">
            <CardHeader className="pb-3 border-b border-[#1a2e46]/60">
              <CardTitle className="text-md font-bold">Coordination Details</CardTitle>
              <CardDescription className="text-gray-400 text-xs">Set date, time slot, and assign an interviewer.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {selectedCandidate ? (
                <form onSubmit={handleScheduleSubmit} className="space-y-4">
                  <div className="p-3 bg-[#11243b] rounded-lg border border-[#1a2e46] mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Scheduling For</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{selectedCandidate.name}</p>
                    <p className="text-xs text-[#3B82F6]">{selectedCandidate.email}</p>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 font-semibold block mb-1.5">Interview Date</label>
                    <Input
                      type="date"
                      required
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="bg-[#11243b] border-[#1a2e46] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 font-semibold block mb-1.5">Interview Time</label>
                    <Input
                      type="time"
                      required
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="bg-[#11243b] border-[#1a2e46] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 font-semibold block mb-1.5">Assigned Interviewer</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Interviewer Full Name..."
                        value={interviewerName}
                        onChange={(e) => setInterviewerName(e.target.value)}
                        className="pl-9 bg-[#11243b] border-[#1a2e46] placeholder-gray-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={scheduling}
                    className="w-full bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs gap-2 mt-4"
                  >
                    {scheduling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Scheduling...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Confirm Schedule</span>
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-20 text-xs text-gray-500 flex flex-col items-center justify-center gap-2 border border-dashed border-[#1a2e46] rounded-lg">
                  <Calendar className="h-8 w-8 text-gray-600 animate-pulse" />
                  <span>Select a candidate from the left list to begin scheduling.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Scheduled Interviews List */}
        <div className="lg:col-span-1">
          <Card className="bg-[#0d1e33] border-[#1a2e46] text-white h-full">
            <CardHeader className="pb-3 border-b border-[#1a2e46]/60">
              <CardTitle className="text-md font-bold">Scheduled Log</CardTitle>
              <CardDescription className="text-gray-400 text-xs">Active scheduled interview sessions.</CardDescription>
            </CardHeader>
            <CardContent className="p-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loadingScheduled ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-[#3B82F6]" />
                  <p className="text-xs text-gray-400">Loading log...</p>
                </div>
              ) : scheduledInterviews.length === 0 ? (
                <p className="text-center py-10 text-xs text-gray-500">No scheduled sessions recorded.</p>
              ) : (
                <div className="space-y-3">
                  {scheduledInterviews.map((intr) => (
                    <div
                      key={intr.scheduleId}
                      className="p-3 bg-[#11243b] border border-[#1a2e46]/60 rounded-lg hover:border-[#3B82F6]/40 transition-all"
                    >
                      <h4 className="font-semibold text-xs text-[#3B82F6]">{intr.candidateName}</h4>
                      <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span>
                          {intr.interviewDatetime
                            ? new Date(intr.interviewDatetime).toLocaleString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })
                            : 'Unknown Time'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                        <User className="h-3 w-3 text-gray-500" />
                        <span>Interviewer: {intr.interviewer}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </PageWrapper>
  );
}

export default InterviewSchedulingPage;
