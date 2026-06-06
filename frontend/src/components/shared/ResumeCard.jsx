import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScoreBadge } from './ScoreBadge';
import { FileText, Mail, Phone, Calendar, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Animated ResumeCard to display evaluated resumes in a grid.
 * Excludes heavy effects to ensure smooth scrolling and low bundle size.
 */
export function ResumeCard({ resume, isSelected, onSelect, showCheckbox = true, onViewDetails }) {
  const { name, email, phone, score, resumeUrl, uploadedAt } = resume;

  const formattedDate = uploadedAt
    ? new Date(uploadedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown date';

  // Toggle selection handler
  function handleCardClick() {
    if (showCheckbox && onSelect) {
      onSelect(!isSelected);
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.015, y: -2 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={handleCardClick}
      className="cursor-pointer"
    >
      <Card
        className={`bg-[#0d1e33] border transition-all duration-300 relative select-none ${
          isSelected
            ? 'border-[#3B82F6] shadow-[0_0_15px_rgba(46,213,115,0.15)] bg-[#0d2238]'
            : 'border-[#1a2e46] hover:border-gray-500 bg-[#0d1e33]'
        }`}
      >
        {/* Selection Checkbox */}
        {showCheckbox && (
          <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={(val) => onSelect?.(!!val)}
              className="border-[#1a2e46] data-[state=checked]:bg-[#3B82F6] data-[state=checked]:text-[#0a1727]"
            />
          </div>
        )}

        <CardHeader className={`flex flex-row items-start justify-between gap-4 pt-6 ${showCheckbox ? 'pl-12' : 'pl-6'}`}>
          <div className="min-w-0 flex-1">
            <h3 className="text-md font-bold text-white truncate">{name}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              <span>Uploaded {formattedDate}</span>
            </div>
            {onViewDetails && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                className="mt-2 h-7 px-2 text-[#3B82F6] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[10px] font-bold gap-1 rounded"
              >
                <Sparkles className="h-3 w-3" />
                <span>AI Insights</span>
              </Button>
            )}
          </div>
          <div className="flex-shrink-0">
            <ScoreBadge score={score} />
          </div>
        </CardHeader>

        <CardContent className="space-y-2 pb-4 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#3B82F6]" />
            <span className="truncate">{email || 'No email specified'}</span>
          </div>
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#3B82F6]" />
              <span>{phone}</span>
            </div>
          )}
        </CardContent>

        {resumeUrl && (
          <CardFooter className="pt-2 border-t border-[#1a2e46] flex justify-end">
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} // Prevent card toggle click
              className="inline-flex items-center gap-1.5 text-xs text-[#3B82F6] hover:text-[#3B82F6]/80 font-medium py-1 px-2 rounded hover:bg-[#3B82F6]/10 transition-all duration-200"
            >
              <Download className="h-3.5 w-3.5" />
              <span>View Resume</span>
            </a>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}
export default ResumeCard;
