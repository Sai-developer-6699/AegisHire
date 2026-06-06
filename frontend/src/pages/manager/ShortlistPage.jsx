import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { managerService } from '@/services/manager.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, FileText, Check, X, Search, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CandidateDrawer } from '@/components/shared/CandidateDrawer';
import { Skeleton } from '@/components/ui/skeleton';

export function ShortlistPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRequirementId = searchParams.get('requirementId') || '';

  const [positions, setPositions] = useState([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState(initialRequirementId);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer states
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load positions on mount
  useEffect(() => {
    async function loadPositions() {
      setLoadingPositions(true);
      try {
        const data = await managerService.getPositionsWithShortlisted();
        setPositions(data || []);
        
        // If there's an initial requirement ID in query params, use it.
        // Otherwise default to the first position with shortlisted candidates.
        if (!initialRequirementId && data && data.length > 0) {
          setSelectedRequirementId(String(data[0].requirementId));
          setSearchParams({ requirementId: String(data[0].requirementId) });
        }
      } catch (error) {
        console.error('Failed to load positions:', error);
        toast.error('Failed to load job positions.');
      } finally {
        setLoadingPositions(false);
      }
    }
    loadPositions();
  }, []);

  const loadCandidates = async () => {
    if (!selectedRequirementId) return;
    setLoadingCandidates(true);
    setSelectedCandidateIds([]);
    try {
      const data = await managerService.getShortlistedCandidates(selectedRequirementId);
      setCandidates(data || []);
    } catch (error) {
      console.error('Failed to load candidates:', error);
      toast.error('Failed to load shortlisted candidates.');
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Load candidates when requirement selection changes
  useEffect(() => {
    loadCandidates();
  }, [selectedRequirementId]);

  // Handle position select change
  const handlePositionChange = (val) => {
    setSelectedRequirementId(val);
    setSearchParams({ requirementId: val });
  };

  // Toggle single candidate selection
  const handleSelectCandidate = (candidateId, checked) => {
    if (checked) {
      setSelectedCandidateIds((prev) => [...prev, candidateId]);
    } else {
      setSelectedCandidateIds((prev) => prev.filter((id) => id !== candidateId));
    }
  };

  // Toggle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      const filtered = candidates.filter((c) => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSelectedCandidateIds(filtered.map((c) => c.resumeId));
    } else {
      setSelectedCandidateIds([]);
    }
  };

  // Handle forward to HR
  const handleForwardToHR = async () => {
    if (selectedCandidateIds.length === 0) {
      toast.error('Please select at least one candidate.');
      return;
    }
    if (!selectedRequirementId) {
      toast.error('Please select a valid job requirement.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await managerService.approveShortlist(selectedCandidateIds, selectedRequirementId);
      toast.success(response?.message || 'Candidates successfully approved.');
      
      // Reload candidates
      const updatedCandidates = await managerService.getShortlistedCandidates(selectedRequirementId);
      setCandidates(updatedCandidates || []);
      setSelectedCandidateIds([]);

      // Reload positions to update counts
      const updatedPositions = await managerService.getPositionsWithShortlisted();
      setPositions(updatedPositions || []);
    } catch (error) {
      console.error('Error forwarding shortlist:', error);
      toast.error(error?.error || 'Failed to approve candidates.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter candidates by search query
  const filteredCandidates = candidates.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePosition = positions.find((p) => String(p.requirementId) === selectedRequirementId);

  const handleOpenAiReport = (cand) => {
    setActiveCandidate({
      id: cand.resumeId,
      name: cand.name,
      email: cand.email,
      score: cand.aiScore,
      resumeUrl: cand.resumeUrl ? `/media/${cand.resumeUrl}` : null,
      status: 'shortlisted'
    });
    setIsDrawerOpen(true);
  };


  return (
    <PageWrapper className="space-y-6 text-white select-none">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#3B82F6]">Shortlist Approval</h1>
        <p className="text-gray-400 mt-1">Review candidates pre-evaluated by AI and approve them for interview scheduling.</p>
      </div>

      {/* Selector & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d1e33] border border-[#1a2e46] p-4 rounded-xl">
        <div className="flex-1 max-w-sm">
          <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Job Position</label>
          <Select
            value={selectedRequirementId}
            onValueChange={handlePositionChange}
            disabled={loadingPositions}
          >
            <SelectTrigger className="bg-[#11243b] border-[#1a2e46] text-white">
              <SelectValue placeholder={loadingPositions ? "Loading openings..." : "Select job opening"} />
            </SelectTrigger>
            <SelectContent className="bg-[#11243b] border-[#1a2e46] text-white">
              {positions.map((pos) => (
                <SelectItem key={pos.requirementId} value={String(pos.requirementId)}>
                  {pos.positionName} ({pos.shortlistedCount} shortlisted)
                </SelectItem>
              ))}
              {positions.length === 0 && !loadingPositions && (
                <SelectItem value="none" disabled>No active shortlist needs review</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs relative self-end">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search candidate name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#11243b] border-[#1a2e46] placeholder-gray-500"
          />
        </div>
      </div>

      {/* Main Table Grid */}
      <Card className="bg-[#0d1e33] border-[#1a2e46] text-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#1a2e46]/60 pb-4">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <span>Shortlisted Profiles</span>
            {activePosition && (
              <Badge className="bg-[#3B82F6]/15 text-[#3B82F6] border-none font-semibold">
                #REQ-{activePosition.requirementId}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(true)}
              className="bg-transparent border-[#1a2e46] text-gray-300 hover:bg-[#11243b] hover:text-white text-xs"
              disabled={filteredCandidates.length === 0}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(false)}
              className="bg-transparent border-[#1a2e46] text-gray-300 hover:bg-[#11243b] hover:text-white text-xs"
              disabled={selectedCandidateIds.length === 0}
            >
              Clear Selection
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingCandidates ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b border-[#1a2e46]/60 pb-4 last:border-0 last:pb-0 animate-pulse">
                  <div className="flex items-center gap-6 w-1/3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-3.5 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-20 text-xs text-gray-500">
              <FileText className="h-10 w-10 text-gray-600 mx-auto mb-2" />
              No candidates currently shortlisted for this requirement.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#11243b]/40 border-b border-[#1a2e46]">
                <TableRow className="hover:bg-transparent border-b border-[#1a2e46]">
                  <TableHead className="w-12 text-center pl-6">
                    <Checkbox
                      checked={
                        filteredCandidates.length > 0 &&
                        filteredCandidates.every((c) => selectedCandidateIds.includes(c.resumeId))
                      }
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      className="border-gray-500 data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                    />
                  </TableHead>
                  <TableHead className="text-gray-400 font-semibold">Name</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Email</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Resume Reference</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right pr-6">AI Match Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredCandidates.map((cand) => {
                    const isSelected = selectedCandidateIds.includes(cand.resumeId);
                    return (
                      <TableRow
                        key={cand.resumeId}
                        className={`border-b border-[#1a2e46]/60 transition-colors ${
                          isSelected ? 'bg-[#3B82F6]/5 hover:bg-[#3B82F6]/8' : 'hover:bg-[#11243b]/20'
                        }`}
                      >
                        <TableCell className="text-center pl-6">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectCandidate(cand.resumeId, !!checked)}
                            className="border-gray-500 data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          <div className="flex items-center gap-2">
                            <span>{cand.name}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAiReport(cand);
                              }}
                              className="h-6 w-6 text-[#3B82F6] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 border border-[#3B82F6]/25 rounded"
                              title="AI Match Insights"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-gray-400">{cand.email}</TableCell>
                        <TableCell>
                          <a
                            href={cand.resumeUrl ? `/media/${cand.resumeUrl}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-[#3B82F6] hover:text-[#20bd5c] hover:underline gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Resume</span>
                          </a>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-24 bg-[#11243b] rounded-full h-2 overflow-hidden border border-[#1a2e46]">
                              <div
                                className="bg-[#3B82F6] h-full rounded-full"
                                style={{ width: `${cand.aiScore ?? 0}%` }}
                              />
                            </div>
                            <span className="font-bold text-xs text-[#3B82F6] w-8">{cand.aiScore ?? 0}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Bar */}
      {selectedCandidateIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-20 flex items-center gap-3 bg-[#0d1e33] border border-[#1a2e46] px-6 py-4 rounded-xl shadow-glow"
        >
          <div className="text-sm font-semibold text-gray-300">
            Selected <span className="text-[#3B82F6] font-bold">{selectedCandidateIds.length}</span> candidates
          </div>
          <Button
            onClick={handleForwardToHR}
            disabled={submitting}
            className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Approving...</span>
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                <span>Forward to HR</span>
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Slide-over Candidate Explainable AI details */}
      <CandidateDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        candidate={activeCandidate}
        requirementId={selectedRequirementId}
        onStatusUpdated={loadCandidates}
      />
    </PageWrapper>
  );
}

export default ShortlistPage;
