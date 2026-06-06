import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { examService } from '@/services/exam.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShieldAlert, Clock, CheckCircle2, Award, Clipboard, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function CandidateDashboard() {
  const { username, userid, logout } = useAuth();
  
  // Dashboard view state: 'instructions' | 'active_exam' | 'completed'
  const [viewState, setViewState] = useState('instructions');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Active exam state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [answers, setAnswers] = useState({});
  const [examQuestions, setExamQuestions] = useState([]);

  // Timer countdown hook
  useEffect(() => {
    if (viewState !== 'active_exam') return;

    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [viewState, timeLeft]);

  const handleStartExam = async () => {
    setLoading(true);
    try {
      // Use standard/mock candidate IDs for linking the resume-job mapping.
      // In a real database pipeline, candidate user ID will link to a resume map.
      // We default to resume_id=1 and requirement_id=1 for demonstration.
      const resumeId = 1;
      const requirementId = 1;

      const session = await examService.startExamSession(resumeId, requirementId);
      
      // Fetch dynamic questions
      const list = await examService.getExamQuestions(session.sessionId);
      if (!list || list.length === 0) {
        toast.error('No exam questions have been published for this position yet. Please contact your recruiter.');
        return;
      }
      
      const mappedList = list.map(q => ({
        questionId: q.question_id || q.questionId,
        text: q.text,
        type: q.type,
        options: q.options
      }));

      setExamQuestions(mappedList);
      
      // Initialize answers state
      const initialAnswers = {};
      mappedList.forEach(q => {
        initialAnswers[q.questionId] = '';
      });
      setAnswers(initialAnswers);

      setSessionId(session.sessionId);
      setViewState('active_exam');
      toast.success('Exam session initialized. Good luck!');
    } catch (error) {
      console.error('Failed to start exam session:', error);
      toast.error('Failed to start exam. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (text) => {
    const activeQ = examQuestions[currentQuestionIndex];
    setAnswers((prev) => ({
      ...prev,
      [activeQ.questionId]: text
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleAutoSubmit = async () => {
    toast.warning('Time limit reached! Submitting answers automatically.');
    await submitExam();
  };

  const handleManualSubmit = async () => {
    // Check if any answers are empty
    const totalAnswered = Object.values(answers).filter(Boolean).length;
    if (totalAnswered < examQuestions.length) {
      const confirmSubmit = window.confirm(`You have answered ${totalAnswered}/${examQuestions.length} questions. Are you sure you want to submit?`);
      if (!confirmSubmit) return;
    }
    await submitExam();
  };

  const submitExam = async () => {
    setLoading(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, text]) => ({
        question_id: Number(qId),
        answer_text: text
      }));

      await examService.submitExamAnswers(sessionId, formattedAnswers);
      toast.success('Your exam has been submitted successfully!');
      setViewState('completed');
    } catch (error) {
      console.error('Failed to submit exam:', error);
      toast.error('Failed to submit answers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activeQuestion = examQuestions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / examQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-[#0a1727] text-white select-none flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#1a2e46] px-8 py-4 bg-[#0d1e33] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#3B82F6]/15 flex items-center justify-center border border-[#3B82F6]/20">
            <ShieldAlert className="h-5 w-5 text-[#3B82F6]" />
          </div>
          <div>
            <h2 className="text-md font-bold tracking-tight text-white">AegisHire Exam Center</h2>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Secure Assessment Session</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {viewState === 'active_exam' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
              <span className="font-mono text-sm font-bold text-amber-400">{formatTime(timeLeft)}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-semibold">@{username}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-gray-400 hover:text-red-400 hover:bg-[#1a2e46]/60 h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <PageWrapper className="w-full max-w-2xl">
          
          {/* Instructions View */}
          {viewState === 'instructions' && (
            <Card className="bg-[#0d1e33] border-[#1a2e46] text-white">
              <CardHeader className="text-center pb-6 border-b border-[#1a2e46]/60">
                <div className="w-12 h-12 bg-[#3B82F6]/15 text-[#3B82F6] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#3B82F6]/20">
                  <Clipboard className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold">Candidate Assessment Instructions</CardTitle>
                <CardDescription className="text-gray-400 text-xs">Please read the following guidelines before beginning the session.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-[30px_1fr] gap-2 items-start">
                  <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border-none font-bold justify-center w-6 h-6 p-0 rounded-full">1</Badge>
                  <div>
                    <p className="text-sm font-bold text-white">Time Constraints</p>
                    <p className="text-xs text-gray-400 mt-0.5">You have exactly 15 minutes to complete the assessment. The session will automatically submit when time expires.</p>
                  </div>
                </div>
                <div className="grid grid-cols-[30px_1fr] gap-2 items-start">
                  <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border-none font-bold justify-center w-6 h-6 p-0 rounded-full">2</Badge>
                  <div>
                    <p className="text-sm font-bold text-white">Academic Integrity</p>
                    <p className="text-xs text-gray-400 mt-0.5">This session is monitored. Do not close or refresh the tab during the exam. Any suspicious behavior will invalidate your attempt.</p>
                  </div>
                </div>
                <div className="grid grid-cols-[30px_1fr] gap-2 items-start">
                  <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border-none font-bold justify-center w-6 h-6 p-0 rounded-full">3</Badge>
                  <div>
                    <p className="text-sm font-bold text-white">Submit Protocol</p>
                    <p className="text-xs text-gray-400 mt-0.5">You can navigate back and forth between questions. Ensure you write clean and detailed responses before finalizing.</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-[#1a2e46]/60 pt-4 flex justify-end">
                <Button
                  onClick={handleStartExam}
                  disabled={loading}
                  className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-sm gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Initializing...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Assessment</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Active Exam View */}
          {viewState === 'active_exam' && activeQuestion && (
            <Card className="bg-[#0d1e33] border-[#1a2e46] text-white">
              <CardHeader className="space-y-4 pb-4 border-b border-[#1a2e46]/60">
                <div className="flex items-center justify-between">
                  <Badge className="bg-[#3B82F6]/15 text-[#3B82F6] border-none font-bold">
                    Question {currentQuestionIndex + 1} of {examQuestions.length}
                  </Badge>
                  <Badge variant="outline" className="text-gray-400 border-[#1a2e46] font-semibold text-[10px] uppercase">
                    {activeQuestion.type}
                  </Badge>
                </div>
                <Progress value={progressPercent} className="h-1.5 bg-[#11243b]" />
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-base leading-relaxed text-gray-100">{activeQuestion.text}</h3>
                
                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-2 block">Your Answer</label>
                  <textarea
                    rows={8}
                    value={answers[activeQuestion.questionId] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="w-full bg-[#11243b] border border-[#1a2e46] rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#3B82F6] resize-none"
                    placeholder="Type your response here..."
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-[#1a2e46]/60 pt-4 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className="bg-transparent border-[#1a2e46] text-gray-300 hover:bg-[#11243b] hover:text-white"
                >
                  Previous
                </Button>

                {currentQuestionIndex < examQuestions.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs"
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    onClick={handleManualSubmit}
                    disabled={loading}
                    className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Submit Exam</span>
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}

          {/* Completed View */}
          {viewState === 'completed' && (
            <Card className="bg-[#0d1e33] border-[#1a2e46] text-white text-center p-8">
              <CardContent className="space-y-6">
                <div className="w-16 h-16 bg-[#3B82F6]/15 text-[#3B82F6] rounded-full flex items-center justify-center mx-auto border border-[#3B82F6]/20 animate-bounce">
                  <Award className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Assessment Completed!</h2>
                  <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto">
                    Your answers have been securely logged in the AegisHire hiring system. The recruitment manager will review and score your submissions.
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={logout}
                    variant="outline"
                    className="bg-transparent border-[#1a2e46] text-gray-300 hover:bg-[#11243b] hover:text-white"
                  >
                    Exit Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </PageWrapper>
      </main>
    </div>
  );
}

export default CandidateDashboard;
