import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '@/pages/auth/LoginPage';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));

// Mock Sonner toasts
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Canvas inside ParticleBackground (since jsdom canvas context is limited)
vi.mock('@/components/effects/ParticleBackground', () => ({
  ParticleBackground: () => <div data-testid="particles" />,
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading overlay when auth state is loading', () => {
    useAuth.mockReturnValue({
      userid: null,
      roleid: null,
      status: 'loading',
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Checking credentials...')).toBeInTheDocument();
  });

  it('should render login card when unauthenticated', () => {
    useAuth.mockReturnValue({
      userid: null,
      roleid: null,
      status: 'unauthenticated',
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByTestId('particles')).toBeInTheDocument();
  });
});
