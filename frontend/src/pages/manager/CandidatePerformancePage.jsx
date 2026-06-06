import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { managerService } from '@/services/manager.service';
import { jobsService } from '@/services/jobs.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ClipboardList, Users, Check, X, FileEdit, Loader2, Award, FileQuestion } from 'lucide-react';

export function CandidatePerformancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRequirementId = searchParams.get('requirementId') || '';

  const [requirements, setRequirements] = useState([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState(initialRequirementId);
  const [candidates, setCandidates] = useState([]);
  
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Modal scoring state
  const [gradingCandidate, setGradingCandidate] = useState(null);
  const [gradingSessionId, setGradingSessionId] = useState(null);
  const [gradingAnswers, setGradingAnswers] = useState([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [isGradingOpen, setIsGradingOpen] = useState(false);

  // Load active requirements
  useEffect(() => {
    async function loadRequirements() {
      setLoadingRequirements(true);
      try {
        const data = await jobsService.getAll();
        setRequirements(data || []);
        
        if (!initialRequirementId && data && data.length > 0) {
          setSelectedRequirementId(String(data[0].requirementId));
          setSearchParams({ requirementId: String(data[0].requirementId) });
        }
      } catch (error) {
        console.error('Failed to load requirements:', error);
        toast.error('Failed to load job requirements.');
      } finally {
        setLoadingRequirements(false);
      }
    }
    loadRequirements();
  }, []);

  // Load candidates whenever requirement changes
  useEffect(() => {
    if (!selectedRequirementId) return;

    async function loadCandidates() {
      setLoadingCandidates(true);
      try {
        const data = await managerService.getCandidatesPerformance(selectedRequirementId);
        setCandidates(data || []);
      } catch (error) {
        console.error('Failed to load candidate performance list:', error);
        toast.error('Failed to load candidates.');
      } finally {
        setLoadingCandidates(false);
      }
    }
    loadCandidates();
  }, [selectedRequirementId]);

  const handleRequirementChange = (val) => {
    setSelectedRequirementId(val);
    setSearchParams({ requirementId: val });
  };

  // Open grading modal and load candidate answers
  const handleOpenGrading = async (candidate) => {
    setGradingCandidate(candidate);
    setIsGradingOpen(true);
    setLoadingAnswers(true);
    try {
      const data = await managerService.getExamAnswers(candidate.mapId);
      setGradingSessionId(data.sessionId);
      setGradingAnswers(
        (data.answers || []).map(ans => ({
          answerId: ans.answerId,
          questionText: ans.questionText,
          questionType: ans.questionType,
          answerText: ans.answerText,
          scoreAwarded: ans.scoreAwarded ?? '',
          isCorrect: !!ans.isCorrect
        }))
      );
    } catch (error) {
      console.error('Failed to load answers:', error);
      toast.error(error?.error || 'No exam session or answers found for candidate.');
      setIsGradingOpen(false);
    } finally {
      setLoadingAnswers(false);
    }
  };

  // Handle score text update
  const handleScoreChange = (answerId, value) => {
    setGradingAnswers((prev) =>
      prev.map((ans) => (ans.answerId === answerId ? { ...ans, scoreAwarded: value } : ans))
    );
  };

  // Handle checkbox correct toggle
  const handleCorrectToggle = (answerId, checked) => {
    setGradingAnswers((prev) =>
      prev.map((ans) => (ans.answerId === answerId ? { ...ans, isCorrect: checked } : ans))
    );
  };

  // Save scores to backend
  const handleSubmitGrading = async (e) => {
    e.preventDefault();
    if (!gradingSessionId) return;

    setSubmittingGrade(true);
    try {
      await managerService.updateExamScores(
        gradingSessionId,
        gradingAnswers.map((ans) => ({
          answerId: ans.answerId,
          scoreAwarded: Number(ans.scoreAwarded) || 0,
          isCorrect: ans.isCorrect
        }))
      );
      toast.success('Exam graded and scores updated successfully!');
      setIsGradingOpen(false);
      
      // Reload candidates to show updated exam score and status
      const data = await managerService.getCandidatesPerformance(selectedRequirementId);
      setCandidates(data || []);
    } catch (error) {
      console.error('Failed to submit grades:', error);
      toast.error(error?.error || 'Failed to submit exam grades.');
    } finally {
      setSubmittingGrade(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'exam_scored':
        return 'bg-emerald-500/15 text-emerald-400 border-none';
      case 'interview_scheduled':
        return 'bg-blue-500/15 text-blue-400 border-none';
      case 'submitted':
        return 'bg-amber-500/15 text-amber-400 border-none';
      case 'finalised':
        return 'bg-purple-500/15 text-purple-400 border-none';
      default:
        return 'bg-gray-500/15 text-gray-400 border-none';
    }
  };

  return (
    <PageWrapper className="space-y-6 text-white select-none">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#3B82F6]">Candidate Performance</h1>
        <p className="text-gray-400 mt-1">Review test submissions, grade answers, and monitor exam completion status.</p>
      </div>

      {/* Requirement Selector */}
      <div className="bg-[#0d1e33] border border-[#1a2e46] p-4 rounded-xl max-w-sm">
        <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Job Requirement</label>
        <Select
          value={selectedRequirementId}
          onValueChange={handleRequirementChange}
          disabled={loadingRequirements}
        >
          <SelectTrigger className="bg-[#11243b] border-[#1a2e46] text-white">
            <SelectValue placeholder={loadingRequirements ? "Loading openings..." : "Select job requirement"} />
          </SelectTrigger>
          <SelectContent className="bg-[#11243b] border-[#1a2e46] text-white">
            {requirements.map((req) => (
              <SelectItem key={req.requirementId} value={String(req.requirementId)}>
                {req.position} (#REQ-{req.requirementId})
              </SelectItem>
            ))}
            {requirements.length === 0 && !loadingRequirements && (
              <SelectItem value="none" disabled>No active job requirements</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Candidates List Card */}
      <Card className="bg-[#0d1e33] border-[#1a2e46] text-white overflow-hidden">
        <CardHeader className="border-b border-[#1a2e46]/60">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-[#3B82F6]" />
            <span>Assigned Candidates</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingCandidates ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
              <p className="text-xs text-gray-400">Loading candidate list...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-20 text-xs text-gray-500">
              <ClipboardList className="h-10 w-10 text-gray-600 mx-auto mb-2" />
              No candidates found under this requirement.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#11243b]/40 border-b border-[#1a2e46]">
                <TableRow className="hover:bg-transparent border-b border-[#1a2e46]">
                  <TableHead className="text-gray-400 font-semibold pl-6">Candidate</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Email</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Workflow Status</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-center">Exam Score</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((cand) => (
                  <TableRow key={cand.mapId} className="border-b border-[#1a2e46]/60 hover:bg-[#11243b]/20">
                    <TableCell className="pl-6 font-semibold text-sm">{cand.name}</TableCell>
                    <TableCell className="text-xs text-gray-400">{cand.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize font-semibold ${getStatusColor(cand.status)}`}>
                        {cand.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold text-sm text-[#3B82F6]">
                      {cand.examScore != null ? `${cand.examScore} pts` : '--'}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        size="sm"
                        onClick={() => handleOpenGrading(cand)}
                        disabled={cand.status !== 'submitted' && cand.status !== 'exam_scored'}
                        className={`text-xs gap-1.5 ${
                          cand.status === 'submitted' || cand.status === 'exam_scored'
                            ? 'bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727]'
                            : 'bg-[#1a2e46] hover:bg-[#1a2e46] text-gray-500 cursor-not-allowed border border-transparent'
                        }`}
                      >
                        <FileEdit className="h-3.5 w-3.5" />
                        <span>{cand.status === 'exam_scored' ? 'Regrade' : 'Grade Exam'}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Grading Modal */}
      <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
        <DialogContent className="bg-[#0a1727] border-[#1a2e46] text-white max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#3B82F6] flex items-center gap-2">
              <Award className="h-6 w-6 text-[#3B82F6]" />
              <span>Score Exam Submissions</span>
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Grade answers submitted by <span className="text-white font-semibold">{gradingCandidate?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          {loadingAnswers ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
              <p className="text-xs text-gray-400">Fetching candidate answers...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitGrading} className="space-y-6 mt-4">
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {gradingAnswers.map((ans, idx) => (
                  <div
                    key={ans.answerId}
                    className="p-4 bg-[#0d1e33] border border-[#1a2e46] rounded-lg space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <Badge className="bg-[#11243b] text-[#3B82F6] border-none font-bold">Q{idx + 1}</Badge>
                      <h4 className="font-semibold text-sm leading-relaxed">{ans.questionText}</h4>
                    </div>

                    <div className="text-xs text-gray-400 bg-[#0a1727]/55 p-3 rounded border border-[#1a2e46]/40 leading-relaxed">
                      <span className="font-bold text-gray-300 block mb-1">Candidate Answer:</span>
                      {ans.answerText || <span className="italic text-gray-600">No response provided</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-1">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-400">Score:</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          required
                          value={ans.scoreAwarded}
                          onChange={(e) => handleScoreChange(ans.answerId, e.target.value)}
                          className="w-24 bg-[#11243b] border-[#1a2e46] h-8 text-xs text-white"
                          placeholder="e.g. 10"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`correct-${ans.answerId}`}
                          checked={ans.isCorrect}
                          onCheckedChange={(checked) => handleCorrectToggle(ans.answerId, !!checked)}
                          className="border-gray-500 data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                        />
                        <label
                          htmlFor={`correct-${ans.answerId}`}
                          className="text-xs font-semibold text-gray-400 cursor-pointer select-none"
                        >
                          Mark as Correct
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                {gradingAnswers.length === 0 && (
                  <div className="text-center py-10 text-xs text-gray-500 flex flex-col items-center justify-center gap-2 border border-dashed border-[#1a2e46] rounded-lg">
                    <FileQuestion className="h-8 w-8 text-gray-600" />
                    <span>No questions were recorded for this session.</span>
                  </div>
                )}
              </div>

              <DialogFooter className="border-t border-[#1a2e46]/60 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsGradingOpen(false)}
                  className="bg-transparent border-[#1a2e46] hover:bg-[#11243b] text-gray-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingGrade || gradingAnswers.length === 0}
                  className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold"
                >
                  {submittingGrade ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Saving Scores...</span>
                    </>
                  ) : (
                    <span>Save Scores</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

export default CandidatePerformancePage;
