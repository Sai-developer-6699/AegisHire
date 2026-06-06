import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().min(5, 'Phone number is too short'),
  department: z.string().min(1, 'Department is required'),
  role: z.enum(['admin', 'manager', 'hr', 'candidate'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
  status: z.enum(['active', 'inactive']),
});

export function RegisterUserForm({ onSubmit, isLoading }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      password: '',
      email: '',
      phone_number: '',
      department: '',
      role: 'candidate',
      status: 'active',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left text-white max-w-xl bg-[#0d1e33] p-6 rounded-xl border border-[#1a2e46] select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">First Name</label>
          <Input
            placeholder="Enter first name"
            {...register('first_name')}
            className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0"
          />
          {errors.first_name && <p className="text-red-400 text-xs font-medium pl-1">{errors.first_name.message}</p>}
        </div>

        {/* Last Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Last Name</label>
          <Input
            placeholder="Enter last name"
            {...register('last_name')}
            className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0"
          />
          {errors.last_name && <p className="text-red-400 text-xs font-medium pl-1">{errors.last_name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Username</label>
          <Input
            placeholder="Enter username"
            {...register('username')}
            className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0"
          />
          {errors.username && <p className="text-red-400 text-xs font-medium pl-1">{errors.username.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Password</label>
          <Input
            type="password"
            placeholder="Enter password"
            {...register('password')}
            className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0"
          />
          {errors.password && <p className="text-red-400 text-xs font-medium pl-1">{errors.password.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email Address</label>
          <Input
            type="email"
            placeholder="example@aegishire.com"
            {...register('email')}
            className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0"
          />
          {errors.email && <p className="text-red-400 text-xs font-medium pl-1">{errors.email.message}</p>}
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Phone Number</label>
          <Input
            placeholder="Enter phone number"
            {...register('phone_number')}
            className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0"
          />
          {errors.phone_number && <p className="text-red-400 text-xs font-medium pl-1">{errors.phone_number.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Department */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Department</label>
          <Input
            placeholder="e.g. Engineering, Sales"
            {...register('department')}
            className="bg-[#11243b] border-[#1a2e46] text-white focus:border-[#3B82F6] focus:ring-0 focus-visible:ring-0"
          />
          {errors.department && <p className="text-red-400 text-xs font-medium pl-1">{errors.department.message}</p>}
        </div>

        {/* Role Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">System Role</label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="bg-[#11243b] border-[#1a2e46] text-white focus:ring-0 focus:ring-offset-0 focus:border-[#3B82F6]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1727] border-[#1a2e46] text-white">
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Hiring Manager</SelectItem>
                  <SelectItem value="hr">HR Manager</SelectItem>
                  <SelectItem value="candidate">Candidate</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.role && <p className="text-red-400 text-xs font-medium pl-1">{errors.role.message}</p>}
        </div>
      </div>

      {/* Status Controller (Hidden / Optional) */}
      <Controller
        name="status"
        control={control}
        render={({ field }) => <input type="hidden" {...field} />}
      />

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
              <span>Registering User...</span>
            </>
          ) : (
            <span>Register User</span>
          )}
        </Button>
      </div>
    </form>
  );
}
export default RegisterUserForm;
