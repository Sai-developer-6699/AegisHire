import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { jobsService } from '@/services/jobs.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { JobCreationForm } from '@/components/forms/JobCreationForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { StandardDialog } from '@/components/shared/StandardDialog';

const DEFAULT_EDUCATION_LIST = ['B.Tech', 'M.Tech', 'MBA', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'PhD'];

export function JobCreationPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendations, setRecommendations] = useState({
    technical_skills: [],
    soft_skills: [],
    education: [],
  });
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [createdJobInfo, setCreatedJobInfo] = useState(null);

  // Load available positions
  const { data: positionsData, loading: loadingPositions } = useApi(jobsService.getPositions);
  const positions = positionsData || [];

  // Handle position change to fetch recommended requirements
  async function handlePositionChange(positionName) {
    if (!positionName) return;
    setLoadingRecs(true);
    try {
      const data = await jobsService.getRecommendations(positionName);
      if (data) {
        setRecommendations({
          technical_skills: data.technical_skills ?? [],
          soft_skills: data.soft_skills ?? [],
          education: data.education ?? [],
        });
        toast.info(`Loaded recommended skills for ${positionName}`);
      }
    } catch (err) {
      console.error('Failed to load position recommendations', err);
    } finally {
      setLoadingRecs(false);
    }
  }

  // Execute the actual API submission
  async function executeJobSubmit(formData) {
    setIsSubmitting(true);
    try {
      await jobsService.submitJob({
        position: formData.position,
        experience: formData.experience,
        technical_skills: formData.technical_skills,
        soft_skills: formData.soft_skills,
        education: formData.education,
      });

      // Save last created job details in localStorage for duplicate detection
      localStorage.setItem('last_created_job', JSON.stringify({
        position: formData.position,
        experience: formData.experience,
        technical_skills: formData.technical_skills || [],
        soft_skills: formData.soft_skills || [],
        education: formData.education || [],
        timestamp: Date.now()
      }));

      setCreatedJobInfo({
        position: formData.position,
        experience: formData.experience
      });
      setIsSuccessOpen(true);
    } catch (err) {
      toast.error(err.message || 'Failed to submit job posting.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle job submission (pre-submission checks)
  async function handleJobSubmit(formData) {
    // Check if it is a consecutive duplicate
    const lastJobJson = localStorage.getItem('last_created_job');
    let isDuplicate = false;
    if (lastJobJson) {
      try {
        const lastJob = JSON.parse(lastJobJson);
        const timeDiff = Date.now() - lastJob.timestamp;
        const isSamePosition = lastJob.position === formData.position;
        const isSameExperience = lastJob.experience === formData.experience;
        const isSameTech = JSON.stringify(lastJob.technical_skills.sort()) === JSON.stringify(formData.technical_skills.sort());
        const isSameSoft = JSON.stringify(lastJob.soft_skills.sort()) === JSON.stringify(formData.soft_skills.sort());
        const isSameEdu = JSON.stringify(lastJob.education.sort()) === JSON.stringify(formData.education.sort());

        if (isSamePosition && isSameExperience && isSameTech && isSameSoft && isSameEdu && timeDiff < 180000) {
          isDuplicate = true;
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (isDuplicate) {
      setPendingData(formData);
      setIsWarningOpen(true);
    } else {
      await executeJobSubmit(formData);
    }
  }

  return (
    <PageWrapper className="space-y-6 text-white select-none">
      
      {/* Title */}
      <div className="pb-4 border-b border-[#1a2e46]">
        <h2 className="text-xl font-bold tracking-wide text-white">Create Job Posting</h2>
        <p className="text-xs text-gray-400 mt-1">Configure position parameters, experience thresholds, and skill tags for AI sourcing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Form Container (Takes 2 columns on large screens) */}
        <div className="lg:col-span-2">
          {loadingPositions ? (
            <div className="flex flex-col items-center justify-center p-20 gap-3 bg-[#0d1e33] border border-[#1a2e46] rounded-xl">
              <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
              <p className="text-xs text-gray-400">Loading position profiles...</p>
            </div>
          ) : (
            <JobCreationForm
              positionsList={positions}
              educationList={DEFAULT_EDUCATION_LIST}
              onSubmit={handleJobSubmit}
              isLoading={isSubmitting || loadingRecs}
              skillsList={recommendations.technical_skills}
              softSkillsList={recommendations.soft_skills}
              onChangePosition={handlePositionChange}
            />
          )}
        </div>

        {/* Informative Side Card */}
        <Card className="bg-[#0d1e33] border-[#1a2e46] text-white">
          <CardHeader className="flex flex-row items-center gap-2.5 pb-2">
            <Info className="h-5 w-5 text-[#3B82F6]" />
            <CardTitle className="text-sm font-bold">AI Auto-Population</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-400 leading-relaxed space-y-3">
            <p>
              Selecting a **Position Profile** automatically queries the database matching rules to fetch suggested requirements.
            </p>
            <p>
              These suggestions help maintain consistency in candidate evaluations across departments. You can dynamically add or remove any skills.
            </p>
            {loadingRecs && (
              <div className="flex items-center gap-2 text-[#3B82F6] pt-2 font-semibold animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Fetching recommended skills...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Success Confirmation Dialog */}
      <StandardDialog
        isOpen={isSuccessOpen}
        onClose={() => {
          setIsSuccessOpen(false);
          window.location.reload(); // Reload to clear the form for another job
        }}
        type="success"
        title="Job Created Successfully!"
        description={`The job requirement for "${createdJobInfo?.position}" (${createdJobInfo?.experience}) has been successfully published and is now active.`}
        confirmText="Dashboard"
        cancelText="Create Another"
        onConfirm={() => navigate('/manager')}
      />

      {/* Duplicate Warning Dialog */}
      <StandardDialog
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        type="warning"
        title="Duplicate Job Warning"
        description="An identical job posting with the exact same position, experience, and skills was created less than 3 minutes ago. Are you sure you want to post this consecutive duplicate?"
        confirmText="Confirm Post"
        cancelText="Cancel"
        onConfirm={async () => {
          setIsWarningOpen(false);
          if (pendingData) {
            await executeJobSubmit(pendingData);
          }
        }}
      />
    </PageWrapper>
  );
}
export default JobCreationPage;
