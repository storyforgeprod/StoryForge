import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DownloadCard } from './DownloadCard';

const defaultProps = {
    videoUrl: 'https://example.com/video.mp4',
    durationSeconds: 45,
    fileSizeBytes: 1048576, // exactly 1.0 MB
};

describe('DownloadCard', () => {
    it('renders formatted file size correctly (1048576 bytes → "1.0 MB")', () => {
        render(<DownloadCard {...defaultProps} />);
        expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    });

    it('renders duration formatted (45 → "45 segundos")', () => {
        render(<DownloadCard {...defaultProps} />);
        expect(screen.getByText('45 segundos')).toBeInTheDocument();
    });

    it('shows expiry notice', () => {
        render(<DownloadCard {...defaultProps} />);
        expect(screen.getByText('El enlace de descarga expira en 24 horas.')).toBeInTheDocument();
    });

    it('anchor href equals videoUrl', () => {
        render(<DownloadCard {...defaultProps} />);
        const link = screen.getByRole('link', { name: /Descargar MP4/i });
        expect(link).toHaveAttribute('href', defaultProps.videoUrl);
    });

    it('anchor has download attribute set to storyforge-video.mp4', () => {
        render(<DownloadCard {...defaultProps} />);
        const link = screen.getByRole('link', { name: /Descargar MP4/i });
        expect(link).toHaveAttribute('download', 'storyforge-video.mp4');
    });

    it('renders file size in KB for values under 1 MB', () => {
        render(<DownloadCard {...defaultProps} fileSizeBytes={512000} />);
        expect(screen.getByText('500.0 KB')).toBeInTheDocument();
    });

    it('rounds duration seconds', () => {
        render(<DownloadCard {...defaultProps} durationSeconds={45.7} />);
        expect(screen.getByText('46 segundos')).toBeInTheDocument();
    });
});
