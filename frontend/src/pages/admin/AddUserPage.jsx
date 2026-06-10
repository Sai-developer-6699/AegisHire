import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usersService } from '@/services/users.service';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { RegisterUserForm } from '@/components/forms/RegisterUserForm';
import { toast } from 'sonner';

export function AddUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const emailParam = searchParams.get('email') || '';
  const roleParam = searchParams.get('role') || 'candidate';

  async function handleRegister(userData) {
    setIsLoading(true);
    try {
      const response = await usersService.register(userData);
      toast.success(response.message || 'User account registered successfully!');
      if (response.warning) {
        toast.warning(response.warning, { duration: 8000 });
      }
      navigate('/admin/users');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageWrapper className="space-y-6 text-white select-none">
      {/* Page Header */}
      <div className="pb-4 border-b border-[#1a2e46]">
        <h2 className="text-xl font-bold tracking-wide text-white">Create New Account</h2>
        <p className="text-xs text-gray-400 mt-1">Register a new administrator, hiring manager, HR recruiter, or candidate.</p>
      </div>

      {/* Form Area */}
      <div className="flex justify-start">
        <RegisterUserForm 
          onSubmit={handleRegister} 
          isLoading={isLoading} 
          defaultEmail={emailParam}
          defaultRole={roleParam}
        />
      </div>
    </PageWrapper>
  );
}
export default AddUserPage;
