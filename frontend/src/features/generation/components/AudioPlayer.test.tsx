import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AudioPlayer } from './AudioPlayer';

describe('AudioPlayer', () => {
    it('renders audio element with correct src', () => {
        const testUrl = 'https://example.com/audio.mp3';
        render(<AudioPlayer src={ testUrl } />);

        const audioElement = screen.getByTestId('audio-element');
        expect(audioElement).toBeInTheDocument();
        expect(audioElement).toHaveAttribute('src', testUrl);
    });

    it('renders audio controls', () => {
        render(<AudioPlayer src="https://example.com/audio.mp3" />);

        const audioElement = screen.getByTestId('audio-element');
        expect(audioElement).toHaveAttribute('controls');
    });

    it('displays duration text when durationSeconds is provided', () => {
        render(
            <AudioPlayer
                src="https://example.com/audio.mp3"
                durationSeconds = { 65}
            />
        );

        expect(screen.getByText('Estimated duration: 1m 5s')).toBeInTheDocument();
    });

    it('formats duration correctly for short clips', () => {
        render(
            <AudioPlayer
                src="https://example.com/audio.mp3"
                durationSeconds = { 45}
            />
        );

        expect(screen.getByText('Estimated duration: 45s')).toBeInTheDocument();
    });

    it('formats duration correctly for long clips', () => {
        render(
            <AudioPlayer
                src="https://example.com/audio.mp3"
                durationSeconds = { 150}
            />
        );

        expect(screen.getByText('Estimated duration: 2m 30s')).toBeInTheDocument();
    });

    it('does not display duration text when durationSeconds is undefined', () => {
        render(<AudioPlayer src="https://example.com/audio.mp3" />);

        expect(screen.queryByText(/Estimated duration:/)).not.toBeInTheDocument();
    });

    it('accepts custom className', () => {
        const { container } = render(
            <AudioPlayer
                src="https://example.com/audio.mp3"
                className = "custom-class"
            />
        );

        const card = container.querySelector('.custom-class');
        expect(card).toBeInTheDocument();
    });
});
