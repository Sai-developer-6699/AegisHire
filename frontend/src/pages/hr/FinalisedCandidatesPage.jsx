import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrService } from '@/services/hr.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, CheckCircle2, XCircle, Loader2, Award, ClipboardCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FinalisedCandidatesPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [selectedMapIds, setSelectedMapIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Load finalised candidates
  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    setLoading(true);
    setSelectedMapIds([]);
    try {
      const data = await hrService.getFinalisedCandidates();
      setCandidates(data || []);
    } catch (error) {
      console.error('Failed to load finalised candidates:', error);
      toast.error('Failed to load finalised candidate records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (mapId, checked) => {
    if (checked) {
      setSelectedMapIds((prev) => [...prev, mapId]);
    } else {
      setSelectedMapIds((prev) => prev.filter((id) => id !== mapId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedMapIds(candidates.map((c) => c.mapId));
    } else {
      setSelectedMapIds([]);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (selectedMapIds.length === 0) {
      toast.error('Please select at least one candidate first.');
      return;
    }

    setUpdating(true);
    try {
      const payload = selectedMapIds.map((mapId) => ({
        mapId,
        newStatus
      }));
      
      const response = await hrService.updateFinalisedStatus(payload);
      toast.success(response?.message || `Candidates marked as ${newStatus} successfully!`);
      
      // Reload candidates
      await loadCandidates();
    } catch (error) {
      console.error('Failed to update candidate status:', error);
      toast.error(error?.error || 'Failed to update finalised candidates status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <PageWrapper className="space-y-6 text-white select-none">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#3B82F6]">Finalised Candidates</h1>
        <p className="text-gray-400 mt-1">Review candidates who successfully completed all evaluation phases, and record hiring outcomes.</p>
      </div>

      {/* Main Table Grid */}
      <Card className="bg-[#0d1e33] border-[#1a2e46] text-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#1a2e46]/60 pb-4">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[#3B82F6]" />
            <span>Candidate Hiring Records</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(true)}
              className="bg-transparent border-[#1a2e46] text-gray-300 hover:bg-[#11243b] hover:text-white text-xs"
              disabled={candidates.length === 0}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(false)}
              className="bg-transparent border-[#1a2e46] text-gray-300 hover:bg-[#11243b] hover:text-white text-xs"
              disabled={selectedMapIds.length === 0}
            >
              Clear Selection
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
              <p className="text-xs text-gray-400">Loading finalised list...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-20 px-4 text-xs text-gray-500">
              <Award className="h-10 w-10 text-gray-600 mx-auto mb-2 animate-pulse" />
              <p className="mb-3">No finalised candidate records currently pending recruitment.</p>
              <Button
                onClick={() => navigate('/hr')}
                className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#11243b]/40 border-b border-[#1a2e46]">
                <TableRow className="hover:bg-transparent border-b border-[#1a2e46]">
                  <TableHead className="w-12 text-center pl-6">
                    <Checkbox
                      checked={
                        candidates.length > 0 &&
                        candidates.every((c) => selectedMapIds.includes(c.mapId))
                      }
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      className="border-gray-500 data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                    />
                  </TableHead>
                  <TableHead className="text-gray-400 font-semibold">Name</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Email</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Current State</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right pr-6">Passed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((cand) => {
                  const isSelected = selectedMapIds.includes(cand.mapId);
                  return (
                    <TableRow
                      key={cand.mapId}
                      className={`border-b border-[#1a2e46]/60 hover:bg-[#11243b]/20 transition-colors ${
                        isSelected ? 'bg-[#3B82F6]/5' : ''
                      }`}
                    >
                      <TableCell className="text-center pl-6">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectCandidate(cand.mapId, !!checked)}
                          className="border-gray-500 data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-sm">{cand.name}</TableCell>
                      <TableCell className="text-xs text-gray-400">{cand.email}</TableCell>
                      <TableCell>
                        <Badge className="bg-[#3B82F6]/15 text-[#3B82F6] border-none font-semibold capitalize">
                          {cand.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-400 pr-6">
                        {cand.finalisedAt ? new Date(cand.finalisedAt).toLocaleString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bulk Status Update Controls */}
      <AnimatePresence>
        {selectedMapIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-20 flex items-center gap-4 bg-[#0d1e33] border border-[#1a2e46] px-6 py-4 rounded-xl shadow-glow"
          >
            <div className="text-sm font-semibold text-gray-300">
              Selected <span className="text-[#3B82F6] font-bold">{selectedMapIds.length}</span> candidates
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleStatusUpdate('joined')}
                disabled={updating}
                className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs gap-1.5"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>Mark Joined</span>
              </Button>
              <Button
                onClick={() => handleStatusUpdate('rejected')}
                disabled={updating}
                variant="outline"
                className="border-red-500/30 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 text-xs gap-1.5 font-bold"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>Mark Rejected</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

export default FinalisedCandidatesPage;
