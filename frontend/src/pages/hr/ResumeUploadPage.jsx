import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumesService } from '@/services/resumes.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { ResumeUploadForm } from '@/components/forms/ResumeUploadForm';
import { toast } from 'sonner';

export function ResumeUploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleUpload(formData, resetFormCallback) {
    setIsLoading(true);
    try {
      await resumesService.upload(formData);
      toast.success('Resume PDF uploaded and indexed successfully!');
      if (resetFormCallback) resetFormCallback();
      // Redirect to evaluate view or dashboard
      navigate('/hr');
    } catch (err) {
      toast.error(err.message || 'Upload failed. Ensure PDF is valid.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageWrapper className="space-y-6 text-white select-none">
      {/* Page Header */}
      <div className="pb-4 border-b border-[#1a2e46]">
        <h2 className="text-xl font-bold tracking-wide text-white">Upload Candidates Resumes</h2>
        <p className="text-xs text-gray-400 mt-1">Snoop, parse, and upload PDF resume documents to seed the recruitment database.</p>
      </div>

      {/* Form Section */}
      <div className="flex justify-start">
        <ResumeUploadForm onSubmit={handleUpload} isLoading={isLoading} />
      </div>
    </PageWrapper>
  );
}
export default ResumeUploadPage;
