import React, { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Loader2, Copy, BookOpen, BrainCircuit, CheckCircle, Edit3, Eye, Save, X, Plus, HelpCircle } from 'lucide-react';
import { jobsService } from '@/services/jobs.service';
import { hrService } from '@/services/hr.service';

export function GenerateQuestionsPage() {
  const [requirements, setRequirements] = useState([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState('');
  
  // Customizable Blueprint counts
  const [technicalCount, setTechnicalCount] = useState(6);
  const [problemSolvingCount, setProblemSolvingCount] = useState(2);
  const [behavioralCount, setBehavioralCount] = useState(2);
  const [difficulty, setDifficulty] = useState('medium');
  
  const [generating, setGenerating] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);
  
  // Editing state
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editForm, setEditForm] = useState({
    text: '',
    type: 'open_ended',
    options: ['', '', '', ''],
    correctAnswer: '',
    skill: '',
    category: 'Technical'
  });
  
  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Load requirements on mount
  useEffect(() => {
    async function loadRequirements() {
      try {
        const list = await jobsService.getAll();
        setRequirements(list || []);
        if (list.length > 0) {
          // Select first claimed/assigned job by default if available
          setSelectedRequirementId(String(list[0].requirementId));
        }
      } catch (error) {
        console.error('Failed to load requirements:', error);
        toast.error('Failed to load job requirements.');
      }
    }
    loadRequirements();
  }, []);

  // Load question bank when selected requirement changes
  useEffect(() => {
    if (!selectedRequirementId) {
      setQuestions([]);
      return;
    }
    fetchQuestionBank();
  }, [selectedRequirementId]);

  const fetchQuestionBank = async () => {
    setLoadingQuestions(true);
    try {
      const data = await hrService.getQuestionBank(selectedRequirementId);
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to fetch question bank:', error);
      toast.error('Failed to load question bank.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedRequirementId) {
      toast.error('Please select a target job position.');
      return;
    }

    setGenerating(true);
    try {
      await hrService.generateExamQuestions(
        selectedRequirementId,
        technicalCount,
        problemSolvingCount,
        behavioralCount,
        difficulty
      );
      toast.success('AI successfully generated custom questions and saved them to drafts!');
      fetchQuestionBank();
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error?.error || 'AI synthesis failed. Verify GEMINI_API_KEY in backend settings.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Question copied to clipboard!');
  };

  const startEditing = (q) => {
    setEditingQuestionId(q.question_id);
    setEditForm({
      text: q.text,
      type: q.type,
      options: q.options || ['', '', '', ''],
      correctAnswer: q.correct_answer || '',
      skill: q.skill || '',
      category: q.category || 'Technical',
      difficulty: q.difficulty || 'medium'
    });
  };

  const cancelEditing = () => {
    setEditingQuestionId(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await hrService.updateQuestion(editingQuestionId, editForm);
      if (res.cloned) {
        toast.success('Question was approved/published; cloned to a new draft version!');
      } else {
        toast.success('Question updated successfully!');
      }
      setEditingQuestionId(null);
      fetchQuestionBank();
    } catch (error) {
      console.error('Failed to update question:', error);
      toast.error('Failed to update question.');
    }
  };

  const handleApprove = async (qId) => {
    try {
      await hrService.approveQuestion(qId);
      toast.success('Question approved successfully!');
      fetchQuestionBank();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve question.');
    }
  };

  const handlePublish = async () => {
    const approvedOrPublished = questions.filter(q => q.status === 'approved' || q.status === 'published');
    if (approvedOrPublished.length === 0) {
      toast.error('No approved questions found. Approve at least one question first.');
      return;
    }

    try {
      await hrService.publishExam(selectedRequirementId, approvedOrPublished.map(q => q.question_id));
      toast.success('Exam successfully published and locked for candidates!');
      fetchQuestionBank();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish exam.');
    }
  };

  const currentJob = requirements.find(r => String(r.requirementId) === selectedRequirementId);
  const approvedCount = questions.filter(q => q.status === 'approved').length;
  const publishedCount = questions.filter(q => q.status === 'published').length;
  const draftCount = questions.filter(q => q.status === 'draft').length;

  return (
    <PageWrapper className="space-y-6 text-white select-none relative">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#3B82F6]">AI Question Generator & Governance</h1>
        <p className="text-gray-400 mt-1">Review, edit, and publish exam questions. Questions are frozen upon publishing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Input Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-[#0d1e33] border-[#1a2e46] text-white">
            <CardHeader className="pb-3 border-b border-[#1a2e46]/60">
              <CardTitle className="text-md font-bold flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-[#3B82F6]" />
                <span>Blueprint Blueprint Configuration</span>
              </CardTitle>
              <CardDescription className="text-gray-400 text-xs">Configure job blueprint details to guide the question modeling pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1.5">Target Job Requirement</label>
                  <Select value={selectedRequirementId} onValueChange={setSelectedRequirementId}>
                    <SelectTrigger className="bg-[#11243b] border-[#1a2e46] text-white">
                      <SelectValue placeholder="Select a job" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#11243b] border-[#1a2e46] text-white">
                      {requirements.map((req) => (
                        <SelectItem key={req.requirementId} value={String(req.requirementId)}>
                          #{req.requirementId} - {req.position} ({req.experience})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1.5">Target Difficulty</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="bg-[#11243b] border-[#1a2e46] text-white">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#11243b] border-[#1a2e46] text-white">
                      <SelectItem value="easy">Easy (Foundational)</SelectItem>
                      <SelectItem value="medium">Medium (Standard)</SelectItem>
                      <SelectItem value="hard">Hard (Advanced/Architect)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Question Blueprint Splits</span>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Technical Questions</span>
                      <span className="text-[#3B82F6] font-bold">{technicalCount}</span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={15}
                      value={technicalCount}
                      onChange={(e) => setTechnicalCount(Number(e.target.value))}
                      className="bg-[#11243b] border-[#1a2e46]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Problem Solving Questions</span>
                      <span className="text-[#3B82F6] font-bold">{problemSolvingCount}</span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={problemSolvingCount}
                      onChange={(e) => setProblemSolvingCount(Number(e.target.value))}
                      className="bg-[#11243b] border-[#1a2e46]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Behavioral Questions</span>
                      <span className="text-[#3B82F6] font-bold">{behavioralCount}</span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={behavioralCount}
                      onChange={(e) => setBehavioralCount(Number(e.target.value))}
                      className="bg-[#11243b] border-[#1a2e46]"
                    />
                  </div>

                  <div className="text-xs text-gray-500 font-semibold pt-1">
                    Total Question Count: <span className="text-white font-bold">{technicalCount + problemSolvingCount + behavioralCount}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={generating || !selectedRequirementId}
                  className="w-full bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs gap-2 mt-4"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Synthesizing Drafts...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate AI Questions</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Stats card */}
          {selectedRequirementId && (
            <Card className="bg-[#0d1e33] border-[#1a2e46] text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-300">Exam Governance Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Drafts:</span>
                  <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">{draftCount}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Approved:</span>
                  <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">{approvedCount}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Published (Active):</span>
                  <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">{publishedCount}</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Generated Questions display */}
        <div className="lg:col-span-2">
          <Card className="bg-[#0d1e33] border-[#1a2e46] text-white h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-[#1a2e46]/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-md font-bold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#3B82F6]" />
                  <span>Question Bank Governance</span>
                </CardTitle>
                <CardDescription className="text-gray-400 text-xs">
                  Generate, edit, approve and publish technical exam questions for `{currentJob?.position || 'Selected Job'}`.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {questions.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPreviewOpen(true)}
                      className="border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6]/10 text-xs font-bold gap-1.5"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Preview Exam</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={handlePublish}
                      disabled={approvedCount + publishedCount === 0}
                      className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] text-xs font-bold gap-1.5"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Publish Exam</span>
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1 overflow-y-auto max-h-[68vh] custom-scrollbar space-y-4">
              {loadingQuestions ? (
                <div className="flex flex-col items-center justify-center py-32 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
                  <p className="text-xs text-gray-400">Loading requirement question bank...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-32 text-xs text-gray-500 flex flex-col items-center justify-center gap-2 border border-dashed border-[#1a2e46] rounded-xl">
                  <Sparkles className="h-8 w-8 text-gray-600 animate-pulse" />
                  <span>No questions generated yet. Use the configuration blueprint to generate AI questions.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const isEditing = editingQuestionId === q.question_id;
                    const statusColors = 
                      q.status === 'published' ? 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/20' :
                      q.status === 'approved' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' :
                      'bg-amber-500/15 text-amber-400 border-amber-500/20';

                    return (
                      <div
                        key={q.question_id}
                        className="p-4 bg-[#11243b] border border-[#1a2e46]/60 rounded-xl space-y-3 relative group hover:border-[#3B82F6]/30 transition-all"
                      >
                        {isEditing ? (
                          /* Inline Editor */
                          <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                            <div className="flex justify-between items-center pb-2 border-b border-[#1a2e46]/50">
                              <span className="font-bold text-[#3B82F6]">Edit Question Mode</span>
                              <div className="flex gap-1.5">
                                <Button type="submit" size="icon" className="h-7 w-7 bg-blue-500 hover:bg-blue-600 text-white rounded">
                                  <Save className="h-3.5 w-3.5" />
                                </Button>
                                <Button type="button" size="icon" onClick={cancelEditing} className="h-7 w-7 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded">
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-gray-400 font-semibold">Question Wording</label>
                              <textarea
                                rows={3}
                                value={editForm.text}
                                onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                                className="w-full bg-[#0d1e33] border border-[#1a2e46] rounded p-2 text-white text-xs"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-gray-400 font-semibold">Question Type</label>
                                <Select value={editForm.type} onValueChange={(val) => setEditForm({ ...editForm, type: val })}>
                                  <SelectTrigger className="bg-[#0d1e33] border-[#1a2e46] text-white h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#0d1e33] border-[#1a2e46] text-white text-xs">
                                    <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                                    <SelectItem value="open_ended">Open Ended</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-gray-400 font-semibold">Category</label>
                                <Select value={editForm.category} onValueChange={(val) => setEditForm({ ...editForm, category: val })}>
                                  <SelectTrigger className="bg-[#0d1e33] border-[#1a2e46] text-white h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#0d1e33] border-[#1a2e46] text-white text-xs">
                                    <SelectItem value="Technical">Technical</SelectItem>
                                    <SelectItem value="Problem Solving">Problem Solving</SelectItem>
                                    <SelectItem value="Behavioral">Behavioral</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {editForm.type === 'mcq' && (
                              <div className="space-y-2 p-3 bg-[#0d1e33]/50 border border-[#1a2e46]/30 rounded-lg">
                                <span className="text-gray-400 font-semibold block mb-1">MCQ Options</span>
                                {editForm.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex gap-2 items-center">
                                    <Badge className="bg-[#1a2e46] text-gray-400 font-semibold text-[10px] w-5 h-5 rounded-full p-0 flex items-center justify-center">
                                      {String.fromCharCode(65 + oIdx)}
                                    </Badge>
                                    <Input
                                      value={opt}
                                      onChange={(e) => {
                                        const newOpts = [...editForm.options];
                                        newOpts[oIdx] = e.target.value;
                                        setEditForm({ ...editForm, options: newOpts });
                                      }}
                                      className="bg-[#0d1e33] border-[#1a2e46] h-7 text-xs flex-1"
                                      placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                      required
                                    />
                                  </div>
                                ))}
                                <div className="space-y-1 pt-1.5">
                                  <label className="text-gray-400 font-semibold">Correct Option Wording</label>
                                  <Input
                                    value={editForm.correctAnswer}
                                    onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                                    className="bg-[#0d1e33] border-[#1a2e46] h-7 text-xs"
                                    placeholder="e.g. Option A value"
                                    required
                                  />
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-gray-400 font-semibold">Target Skill</label>
                                <Input
                                  value={editForm.skill}
                                  onChange={(e) => setEditForm({ ...editForm, skill: e.target.value })}
                                  className="bg-[#0d1e33] border-[#1a2e46] h-8 text-xs"
                                  placeholder="e.g. React hooks"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-gray-400 font-semibold">Difficulty</label>
                                <Select value={editForm.difficulty} onValueChange={(val) => setEditForm({ ...editForm, difficulty: val })}>
                                  <SelectTrigger className="bg-[#0d1e33] border-[#1a2e46] text-white h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#0d1e33] border-[#1a2e46] text-white text-xs">
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </form>
                        ) : (
                          /* Standard Question Deck Item */
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-[#3B82F6]/15 text-[#3B82F6] border-none font-bold">Q{idx + 1}</Badge>
                                <Badge variant="outline" className={`font-semibold text-[10px] uppercase ${statusColors}`}>
                                  {q.status}
                                </Badge>
                                <Badge variant="outline" className="text-gray-400 border-[#1a2e46] font-semibold text-[10px] uppercase">
                                  {q.category}
                                </Badge>
                              </div>
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopy(q.text)}
                                  className="h-7 w-7 text-gray-400 hover:text-white hover:bg-[#1a2e46]/80 rounded"
                                  title="Copy text"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEditing(q)}
                                  className="h-7 w-7 text-gray-400 hover:text-white hover:bg-[#1a2e46]/80 rounded"
                                  title="Edit question"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                {q.status === 'draft' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleApprove(q.question_id)}
                                    className="h-7 w-7 text-[#3B82F6] hover:bg-[#3B82F6]/15 rounded"
                                    title="Approve question"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-gray-100 font-medium leading-relaxed">{q.text}</p>
                            
                            {q.type === 'mcq' && q.options && (
                              <div className="pl-4 space-y-1 pt-1">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="text-xs flex items-center gap-2 text-gray-300">
                                    <span className="font-mono text-gray-500 font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                                    <span>{opt}</span>
                                    {q.correct_answer === opt && (
                                      <Badge className="bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-[9px] py-0 px-1 font-bold">Correct</Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="pt-2 border-t border-[#1a2e46]/30 text-[10px] text-gray-400 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-300">Target Competency:</span>
                                <span>{q.skill || 'General'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-300">Difficulty:</span>
                                <span className="uppercase text-amber-400">{q.difficulty}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Exam Preview Modal Overlay */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 select-none">
          <div className="w-full max-w-2xl bg-[#0a1727] border border-[#1f354e] rounded-xl flex flex-col max-h-[85vh] text-slate-200 overflow-hidden font-sans">
            {/* Header */}
            <div className="p-5 border-b border-[#1f354e] flex items-center justify-between bg-[#0e1c2c]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 flex items-center justify-center border border-[#3B82F6]/20">
                  <Eye className="h-4.5 w-4.5 text-[#3B82F6]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">Candidate Exam Deck Preview</h3>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    {currentJob?.position} - {questions.filter(q => q.status === 'approved' || q.status === 'published').length} Active Questions
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPreviewOpen(false)}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1f354e]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content viewport */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {questions.filter(q => q.status === 'approved' || q.status === 'published').map((q, idx) => (
                <div key={q.question_id} className="p-4 bg-[#11243b]/50 border border-[#1f354e]/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-[#3B82F6]/15 text-[#3B82F6] border-none font-bold">Question {idx + 1}</Badge>
                    <Badge variant="outline" className="text-gray-400 border-[#1f354e] font-semibold text-[10px] uppercase">
                      {q.type === 'mcq' ? 'Multiple Choice' : 'Open Ended Response'}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-white leading-relaxed">{q.text}</h4>
                  
                  {q.type === 'mcq' && q.options && (
                    <div className="space-y-1.5 pl-4">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="text-xs flex items-center gap-2 text-gray-300">
                          <span className="font-mono text-gray-500 font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-[#1f354e] bg-[#0e1c2c] flex justify-end">
              <Button
                onClick={() => setIsPreviewOpen(false)}
                className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs px-5"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export default GenerateQuestionsPage;
