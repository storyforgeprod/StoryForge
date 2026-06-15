import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CreateStepsNav } from './CreateStepsNav';

it('marks current step as active', () => {
  render(<CreateStepsNav currentStep="script" />);
  const scriptItem = screen.getByText('Script').closest('[aria-current="step"]');
  expect(scriptItem).toBeInTheDocument();
});

it('renders steps in order: Story, Script, Style, Voice, Video', () => {
  render(<CreateStepsNav currentStep="story" />);
  const items = screen.getAllByRole('listitem');
  expect(items[0]).toHaveTextContent('Story');
  expect(items[1]).toHaveTextContent('Script');
  expect(items[2]).toHaveTextContent('Style');
  expect(items[3]).toHaveTextContent('Voice');
  expect(items[4]).toHaveTextContent('Video');
});
