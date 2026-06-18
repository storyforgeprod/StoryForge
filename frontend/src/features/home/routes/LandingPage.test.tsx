import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { LandingPage } from './LandingPage';

vi.mock('@/features/auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  })),
}));
vi.mock('@/app/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({ theme: 'dark', toggleTheme: vi.fn(), setTheme: vi.fn() })),
}));
vi.mock('@/components/layout/Brand', () => ({
  Brand: () => <span>storyForge</span>,
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );

describe('LandingPage', () => {
  it('renders the hero headline', () => {
    renderPage();
    expect(screen.getByText(/turn any story into a/i)).toBeInTheDocument();
  });

  it('shows "Get started" CTA when unauthenticated', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
  });

  it('shows "Go to app" CTA when authenticated', () => {
    vi.mocked(useAuth).mockReturnValueOnce({
      isAuthenticated: true,
      user: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });
    renderPage();
    expect(screen.getByRole('link', { name: /go to app/i })).toBeInTheDocument();
  });

  it('renders all 4 how-it-works steps', () => {
    renderPage();
    expect(screen.getByText('Paste your story')).toBeInTheDocument();
    expect(screen.getByText('AI writes the script')).toBeInTheDocument();
    expect(screen.getByText('Pick style & voice')).toBeInTheDocument();
    expect(screen.getByText('Download your Short')).toBeInTheDocument();
  });

  it('renders the CTA banner', () => {
    renderPage();
    expect(screen.getByText(/start converting your stories today/i)).toBeInTheDocument();
  });
});
