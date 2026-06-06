import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar } from 'lucide-react';

const scheduleSchema = z.object({
  interview_datetime: z.string().min(1, 'Please select a date and time'),
  interviewer: z.string().min(1, 'Interviewer name is required'),
});

export function InterviewScheduleForm({ candidateName, mapId, onSubmit, isLoading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      interview_datetime: '',
      interviewer: '',
    },
  });

  function onFormSubmit(data) {
    // Convert local datetime input (YYYY-MM-DDTHH:MM) to standard ISO string format
    const isoString = new Date(data.interview_datetime).toISOString();
    onSubmit({
      map_id: mapId,
      interview_datetime: isoString,
      interviewer: data.interviewer,
    });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5 text-left text-white select-none">
      {/* Candidate Name (Read Only) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Candidate Name</label>
        <Input
          value={candidateName || ''}
          disabled
          className="bg-[#11243b] border-[#1a2e46] text-gray-400 cursor-not-allowed opacity-80"
        />
      </div>

      {/* Interview Date & Time */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Interview Date & Time</label>
        <div className="relative">
          <Input
            type="datetime-local"
            {...register('interview_datetime')}
            className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0 w-full"
          />
        </div>
        {errors.interview_datetime && (
          <p className="text-red-400 text-xs font-medium pl-1">{errors.interview_datetime.message}</p>
        )}
      </div>

      {/* Interviewer */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Interviewer Name</label>
        <Input
          placeholder="e.g. Sarah Jenkins"
          {...register('interviewer')}
          className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0"
        />
        {errors.interviewer && (
          <p className="text-red-400 text-xs font-medium pl-1">{errors.interviewer.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[#1a2e46] mt-6">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs px-6 py-2.5 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#0a1727]" />
              <span>Scheduling...</span>
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 text-[#0a1727]" />
              <span>Schedule Interview</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
export default InterviewScheduleForm;
