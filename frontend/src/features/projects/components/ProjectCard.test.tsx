import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from './ProjectCard';
import type { Project } from '../types';

vi.mock('@/features/generation', () => ({
  StyleThumb: ({ style }: { style: string }) => <div data-testid="style-thumb">{style}</div>,
}));

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: '1',
  title: 'My Story',
  style: 'anime',
  duration: 60,
  status: 'completed',
  createdAt: '2026-01-01',
  output: {
    videoUrl: 'https://example.com/video.mp4',
    audioUrl: null,
    images: [],
    script: null,
    duration: 55,
  },
  ...overrides,
});

describe('ProjectCard', () => {
  it('renders the project title and style', () => {
    render(
      <ProjectCard project={makeProject()} isExpanded={false} onToggle={vi.fn()} />,
    );
    expect(screen.getByText('My Story')).toBeInTheDocument();
    expect(screen.getAllByText('anime').length).toBeGreaterThan(0);
  });

  it('shows "Completed" badge for completed projects', () => {
    render(
      <ProjectCard project={makeProject()} isExpanded={false} onToggle={vi.fn()} />,
    );
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows "Processing…" badge for processing projects', () => {
    render(
      <ProjectCard
        project={makeProject({ status: 'processing', output: null })}
        isExpanded={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('Processing…')).toBeInTheDocument();
  });

  it('shows "Failed" badge for failed projects', () => {
    render(
      <ProjectCard
        project={makeProject({ status: 'failed', output: null })}
        isExpanded={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('calls onToggle when a completed card is clicked', async () => {
    const onToggle = vi.fn();
    render(
      <ProjectCard project={makeProject()} isExpanded={false} onToggle={onToggle} />,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does not call onToggle when a non-completed card is clicked', async () => {
    const onToggle = vi.fn();
    render(
      <ProjectCard
        project={makeProject({ status: 'processing', output: null })}
        isExpanded={false}
        onToggle={onToggle}
      />,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows video player and download link when expanded', () => {
    render(
      <ProjectCard project={makeProject()} isExpanded={true} onToggle={vi.fn()} />,
    );
    expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument();
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video?.src).toContain('video.mp4');
  });

  it('hides video panel when not expanded', () => {
    render(
      <ProjectCard project={makeProject()} isExpanded={false} onToggle={vi.fn()} />,
    );
    expect(document.querySelector('video')).not.toBeInTheDocument();
  });
});
