import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '@/components/shared/StatusBadge';

describe('StatusBadge Component', () => {
  it('should render evaluated status text correctly', () => {
    render(<StatusBadge status="evaluated" />);
    expect(screen.getByText('Evaluated')).toBeInTheDocument();
  });

  it('should render shortlisted status text correctly', () => {
    render(<StatusBadge status="shortlisted" />);
    expect(screen.getByText('Shortlisted')).toBeInTheDocument();
  });

  it('should render finalised status text correctly', () => {
    render(<StatusBadge status="finalised" />);
    expect(screen.getByText('Finalised')).toBeInTheDocument();
  });

  it('should handle uppercase or mixed-case status inputs', () => {
    render(<StatusBadge status="JoInEd" />);
    expect(screen.getByText('Joined')).toBeInTheDocument();
  });

  it('should fall back to raw input label for unknown status', () => {
    render(<StatusBadge status="custom_stage" />);
    expect(screen.getByText('custom_stage')).toBeInTheDocument();
  });
});
