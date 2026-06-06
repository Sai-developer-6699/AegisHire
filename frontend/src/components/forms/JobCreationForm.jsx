import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { SkillPill } from '../shared/SkillPill';
import { Plus, Loader2 } from 'lucide-react';

const jobSchema = z.object({
  position: z.string().min(1, 'Please select a job position'),
  experience: z.string().min(1, 'Please specify the experience range'),
  technical_skills: z.array(z.string()).min(1, 'At least one technical skill is required'),
  soft_skills: z.array(z.string()),
  education: z.array(z.string()).min(1, 'At least one educational qualification is required'),
});

export function JobCreationForm({
  onSubmit,
  isLoading,
  positionsList = [],
  skillsList = [],
  softSkillsList = [],
  educationList = [],
  onChangePosition,
}) {
  const [techInput, setTechInput] = useState('');
  const [softInput, setSoftInput] = useState('');

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      position: '',
      experience: '',
      technical_skills: [],
      soft_skills: [],
      education: [],
    },
  });

  const technicalSkills = watch('technical_skills');
  const softSkills = watch('soft_skills');
  const selectedEducation = watch('education');

  // Dynamically update form tags when recommendations list changes in parent
  useEffect(() => {
    if (skillsList && skillsList.length > 0) {
      setValue('technical_skills', skillsList, { shouldValidate: true });
    }
  }, [skillsList, setValue]);

  useEffect(() => {
    if (softSkillsList && softSkillsList.length > 0) {
      setValue('soft_skills', softSkillsList, { shouldValidate: true });
    }
  }, [softSkillsList, setValue]);

  // Handle adding a technical skill tag
  function addTechSkill() {
    const trimmed = techInput.trim();
    if (trimmed && !technicalSkills.includes(trimmed)) {
      const updated = [...technicalSkills, trimmed];
      setValue('technical_skills', updated, { shouldValidate: true });
    }
    setTechInput('');
  }

  // Handle removing a technical skill tag
  function removeTechSkill(skill) {
    const updated = technicalSkills.filter((s) => s !== skill);
    setValue('technical_skills', updated, { shouldValidate: true });
  }

  // Handle adding a soft skill tag
  function addSoftSkill() {
    const trimmed = softInput.trim();
    if (trimmed && !softSkills.includes(trimmed)) {
      const updated = [...softSkills, trimmed];
      setValue('soft_skills', updated, { shouldValidate: true });
    }
    setSoftInput('');
  }

  // Handle removing a soft skill tag
  function removeSoftSkill(skill) {
    const updated = softSkills.filter((s) => s !== skill);
    setValue('soft_skills', updated, { shouldValidate: true });
  }

  // Handle toggling education checkbox
  function toggleEducation(eduName) {
    const updated = selectedEducation.includes(eduName)
      ? selectedEducation.filter((e) => e !== eduName)
      : [...selectedEducation, eduName];
    setValue('education', updated, { shouldValidate: true });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left text-white max-w-2xl bg-[#0d1e33] p-6 rounded-xl border border-[#1a2e46] select-none">
      
      {/* Position Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Position Profile</label>
        <Controller
          name="position"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={(val) => {
                field.onChange(val);
                if (onChangePosition) onChangePosition(val);
              }}
              value={field.value}
            >
              <SelectTrigger className="bg-[#11243b] border-[#1a2e46] text-white focus:ring-0 focus:border-[#3B82F6]">
                <SelectValue placeholder="Select a job position" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a1727] border-[#1a2e46] text-white">
                {positionsList.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.position && <p className="text-red-400 text-xs font-medium pl-1">{errors.position.message}</p>}
      </div>

      {/* Experience Range Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Required Experience</label>
        <Controller
          name="experience"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="bg-[#11243b] border-[#1a2e46] text-white focus:ring-0 focus:border-[#3B82F6]">
                <SelectValue placeholder="Select experience requirement" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a1727] border-[#1a2e46] text-white">
                <SelectItem value="fresher">Fresher (0-1 years)</SelectItem>
                <SelectItem value="1-3">Junior (1-3 years)</SelectItem>
                <SelectItem value="3+">Senior (3+ years)</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.experience && <p className="text-red-400 text-xs font-medium pl-1">{errors.experience.message}</p>}
      </div>

      {/* Technical Skills Inputs */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Technical Skills</label>
        <div className="flex gap-2">
          <Input
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTechSkill();
              }
            }}
            placeholder="Type skill (e.g. Python) and press Enter"
            className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0"
          />
          <Button
            type="button"
            onClick={addTechSkill}
            className="bg-[#11243b] border-[#1a2e46] text-[#3B82F6] hover:bg-[#3B82F6]/10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Render pills */}
        <div className="flex flex-wrap gap-2 pt-1.5">
          {technicalSkills.map((skill) => (
            <SkillPill key={skill} name={skill} onRemove={() => removeTechSkill(skill)} />
          ))}
        </div>
        {errors.technical_skills && <p className="text-red-400 text-xs font-medium pl-1">{errors.technical_skills.message}</p>}
      </div>

      {/* Soft Skills Inputs */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Soft Skills</label>
        <div className="flex gap-2">
          <Input
            value={softInput}
            onChange={(e) => setSoftInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSoftSkill();
              }
            }}
            placeholder="Type soft skill (e.g. Leadership) and press Enter"
            className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0"
          />
          <Button
            type="button"
            onClick={addSoftSkill}
            className="bg-[#11243b] border-[#1a2e46] text-[#3B82F6] hover:bg-[#3B82F6]/10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Render pills */}
        <div className="flex flex-wrap gap-2 pt-1.5">
          {softSkills.map((skill) => (
            <SkillPill key={skill} name={skill} onRemove={() => removeSoftSkill(skill)} />
          ))}
        </div>
      </div>

      {/* Education Requirement Checklist */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Education Level</label>
        <div className="grid grid-cols-2 gap-3 p-3 bg-[#11243b]/40 rounded-lg border border-[#1a2e46]">
          {educationList.map((edu) => {
            const isChecked = selectedEducation.includes(edu);
            return (
              <label
                key={edu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                  isChecked
                    ? 'border-[#3B82F6]/40 bg-[#3B82F6]/5 text-white'
                    : 'border-[#1a2e46] text-gray-300 hover:bg-[#11243b]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleEducation(edu)}
                  className="rounded border-[#1a2e46] bg-[#0c1a2d] text-[#3B82F6] focus:ring-0"
                />
                <span className="text-sm font-medium">{edu}</span>
              </label>
            );
          })}
        </div>
        {errors.education && <p className="text-red-400 text-xs font-medium pl-1">{errors.education.message}</p>}
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
              <span>Submitting Post...</span>
            </>
          ) : (
            <span>Submit Requirement</span>
          )}
        </Button>
      </div>
    </form>
  );
}
export default JobCreationForm;
