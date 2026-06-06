import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleGuard } from '@/components/shared/RoleGuard';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('RoleGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state when session is restoring', () => {
    useAuth.mockReturnValue({
      userid: null,
      roleid: null,
      status: 'loading',
    });

    render(
      <MemoryRouter>
        <RoleGuard requiredPermission="canApproveShortlist" />
      </MemoryRouter>
    );

    expect(screen.getByText('Validating session...')).toBeInTheDocument();
  });

  it('should redirect unauthenticated users to login path "/"', () => {
    useAuth.mockReturnValue({
      userid: null,
      roleid: null,
      status: 'unauthenticated',
    });

    render(
      <MemoryRouter initialEntries={['/manager']}>
        <Routes>
          <Route path="/" element={<span>Login Screen</span>} />
          <Route element={<RoleGuard requiredPermission="canApproveShortlist" />}>
            <Route path="/manager" element={<span>Manager Screen</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Manager Screen')).not.toBeInTheDocument();
    expect(screen.getByText('Login Screen')).toBeInTheDocument();
  });

  it('should redirect authorized user with wrong role to their fallback home path', () => {
    useAuth.mockReturnValue({
      userid: 10,
      roleid: 3, // HR Role (does not have canApproveShortlist)
      status: 'authenticated',
    });

    render(
      <MemoryRouter initialEntries={['/manager']}>
        <Routes>
          <Route path="/hr" element={<span>HR Dashboard</span>} />
          <Route element={<RoleGuard requiredPermission="canApproveShortlist" />}>
            <Route path="/manager" element={<span>Manager Screen</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Manager Screen')).not.toBeInTheDocument();
    expect(screen.getByText('HR Dashboard')).toBeInTheDocument();
  });

  it('should render children when authenticated with the matching role', () => {
    useAuth.mockReturnValue({
      userid: 10,
      roleid: 2, // Manager Role (has canApproveShortlist)
      status: 'authenticated',
    });

    render(
      <MemoryRouter initialEntries={['/manager']}>
        <Routes>
          <Route element={<RoleGuard requiredPermission="canApproveShortlist" />}>
            <Route path="/manager" element={<span>Manager Screen</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Manager Screen')).toBeInTheDocument();
  });
});

