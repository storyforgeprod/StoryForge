import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageGrid } from './ImageGrid';

describe('ImageGrid', () => {
    it('renders the correct number of img elements', () => {
        const urls = [
            'https://example.com/1.jpg',
            'https://example.com/2.jpg',
            'https://example.com/3.jpg',
        ];
        render(<ImageGrid imageUrls={urls} />);
        expect(screen.getAllByRole('img')).toHaveLength(3);
    });

    it('each img has loading="lazy"', () => {
        render(<ImageGrid imageUrls={['https://example.com/1.jpg']} />);
        expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');
    });

    it('empty array renders nothing without crashing', () => {
        const { container } = render(<ImageGrid imageUrls={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('alt text follows "Escena N" pattern', () => {
        const urls = ['https://example.com/1.jpg', 'https://example.com/2.jpg'];
        render(<ImageGrid imageUrls={urls} />);
        expect(screen.getByAltText('Escena 1')).toBeInTheDocument();
        expect(screen.getByAltText('Escena 2')).toBeInTheDocument();
    });
});
