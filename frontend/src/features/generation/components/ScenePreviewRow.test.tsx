import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScenePreviewRow } from './ScenePreviewRow';

it('renders N skeletons when imageUrls is empty', () => {
  render(<ScenePreviewRow sceneCount={5} imageUrls={[]} />);
  expect(screen.getAllByTestId('scene-skeleton')).toHaveLength(5);
});

it('renders images when imageUrls are provided', () => {
  const urls = ['http://a.com/1.png', 'http://a.com/2.png'];
  render(<ScenePreviewRow sceneCount={2} imageUrls={urls} />);
  const imgs = screen.getAllByRole('img');
  expect(imgs).toHaveLength(2);
  expect(imgs[0]).toHaveAttribute('src', urls[0]);
});
