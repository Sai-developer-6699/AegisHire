import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/shared/FormError';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(3, 'Password must be at least 3 characters'),
});

/**
 * Modernised Login form using design tokens and local input shake validation feedback.
 */
export function LoginForm({ onSubmit, isLoading }) {
  const [showPassword, setShowPassword] = useState(false);
  const [shakeFields, setShakeFields] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Shake inputs slightly when validation errors occur
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setShakeFields(true);
      const timer = setTimeout(() => setShakeFields(false), 400);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const handleFormSubmit = async (data) => {
    const success = await onSubmit(data);
    if (success === false) {
      setShakeFields(true);
      setTimeout(() => setShakeFields(false), 400);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 text-left select-none">
      {/* Username Field */}
      <div className="space-y-1.5">
        <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Username
        </label>
        <Input
          id="username"
          type="text"
          placeholder="Enter username"
          {...register('username')}
          aria-invalid={!!errors.username}
          className={cn(
            "bg-card border-border placeholder:text-muted-foreground/60 text-foreground focus-visible:border-primary focus-visible:ring-primary/20",
            shakeFields && "animate-shake border-error ring-error/25"
          )}
        />
        <FormError message={errors.username?.message} />
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password"
            {...register('password')}
            aria-invalid={!!errors.password}
            className={cn(
              "bg-card border-border placeholder:text-muted-foreground/60 text-foreground pr-10 focus-visible:border-primary focus-visible:ring-primary/20",
              shakeFields && "animate-shake border-error ring-error/25"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <FormError message={errors.password?.message} />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm h-11 transition-all duration-200 mt-2 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
            <span>Verifying Credentials...</span>
          </>
        ) : (
          <span>Log In</span>
        )}
      </Button>
    </form>
  );
}

export default LoginForm;
