import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, CheckCircle2 } from 'lucide-react';

const uploadSchema = z.object({
  name: z.string().min(1, 'Candidate name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits (e.g. 9876543210)'),
  resume: z
    .any()
    .refine((file) => file instanceof File, 'Resume PDF file is required')
    .refine((file) => file && file.type === 'application/pdf', 'Only PDF files are supported')
    .refine((file) => file && file.size <= 5 * 1024 * 1024, 'File size must be under 5MB'),
});

export function ResumeUploadForm({ onSubmit, isLoading }) {
  const [dragActive, setDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      resume: null,
    },
  });

  const selectedFile = watch('resume');

  // Handle file selection change
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setValue('resume', file, { shouldValidate: true });
    }
  }

  // Handle drag actions
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  // Handle drop action
  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      setValue('resume', file, { shouldValidate: true });
    }
  }

  // Form submit interceptor to package as FormData
  function onFormSubmit(data) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('resume', data.resume);
    onSubmit(formData, () => reset());
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 text-left text-white max-w-xl bg-[#0d1e33] p-6 rounded-xl border border-[#1a2e46] select-none">
      
      {/* Candidate Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Candidate Name</label>
        <Input
          placeholder="e.g. John Doe"
          {...register('name')}
          className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0"
        />
        {errors.name && <p className="text-red-400 text-xs font-medium pl-1">{errors.name.message}</p>}
      </div>

      {/* Candidate Email */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email Address</label>
        <Input
          type="email"
          placeholder="e.g. john.doe@example.com"
          {...register('email')}
          className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0"
        />
        {errors.email && <p className="text-red-400 text-xs font-medium pl-1">{errors.email.message}</p>}
      </div>

      {/* Candidate Phone */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Phone Number (10 Digits)</label>
        <Input
          placeholder="e.g. 9876543210"
          {...register('phone')}
          className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0"
        />
        {errors.phone && <p className="text-red-400 text-xs font-medium pl-1">{errors.phone.message}</p>}
      </div>

      {/* File Upload Drag/Drop zone */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Resume PDF</label>
        
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-center transition-all duration-200 cursor-pointer ${
            dragActive
              ? 'border-[#3B82F6] bg-[#3B82F6]/5'
              : selectedFile
              ? 'border-[#3B82F6]/50 bg-[#11243b]/40'
              : 'border-[#1a2e46] bg-[#11243b]/20 hover:border-gray-500'
          }`}
          onClick={() => document.getElementById('file-upload-input').click()}
        >
          <input
            id="file-upload-input"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-[#3B82F6]" />
              <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
              <p className="text-[10px] text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-[#3B82F6]/60 group-hover:text-[#3B82F6]" />
              <p className="text-sm font-medium text-white">Drag & drop candidate resume here, or <span className="text-[#3B82F6] underline">browse</span></p>
              <p className="text-[10px] text-gray-400">PDF formats only • Max 5MB</p>
            </div>
          )}
        </div>
        {errors.resume && <p className="text-red-400 text-xs font-medium pl-1">{errors.resume.message}</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[#1a2e46]">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] font-bold text-xs px-6 py-2.5 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              <span>Uploading Resume...</span>
            </>
          ) : (
            <span>Upload Resume</span>
          )}
        </Button>
      </div>
    </form>
  );
}
export default ResumeUploadForm;
