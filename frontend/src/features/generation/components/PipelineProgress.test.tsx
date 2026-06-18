import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PipelineProgress } from './PipelineProgress';
import type { PipelineStageView } from '../types';

describe('PipelineProgress', () => {
    const mockStages: PipelineStageView[] = [
        { id: 'script', label: 'Script', status: 'done' },
        { id: 'images', label: 'Images', status: 'active' },
        { id: 'audio', label: 'Audio', status: 'pending' },
        { id: 'video', label: 'Video', status: 'error' },
    ];

    it('renders 4 stage elements', () => {
        render(<PipelineProgress stages={ mockStages } />);

        const stages = screen.getAllByTestId(/^stage-/);
        expect(stages).toHaveLength(4);
    });

    it('renders correct stage IDs', () => {
        render(<PipelineProgress stages={ mockStages } />);

        expect(screen.getByTestId('stage-script')).toBeInTheDocument();
        expect(screen.getByTestId('stage-images')).toBeInTheDocument();
        expect(screen.getByTestId('stage-audio')).toBeInTheDocument();
        expect(screen.getByTestId('stage-video')).toBeInTheDocument();
    });

    it('displays all stage labels on non-mobile', () => {
        render(<PipelineProgress stages={ mockStages } />);

        expect(screen.getByText('Script')).toBeInTheDocument();
        expect(screen.getByText('Images')).toBeInTheDocument();
        expect(screen.getByText('Audio')).toBeInTheDocument();
        expect(screen.getByText('Video')).toBeInTheDocument();
    });

    it('marks done stage with green background', () => {
        render(<PipelineProgress stages={ mockStages } />);

        const doneStage = screen.getByTestId('stage-script');
        expect(doneStage).toHaveClass('bg-green-500');
    });

    it('marks active stage with blue background', () => {
        render(<PipelineProgress stages={ mockStages } />);

        const activeStage = screen.getByTestId('stage-images');
        expect(activeStage).toHaveClass('bg-blue-500');
    });

    it('marks error stage with destructive background', () => {
        render(<PipelineProgress stages={ mockStages } />);

        const errorStage = screen.getByTestId('stage-video');
        expect(errorStage).toHaveClass('bg-destructive');
    });

    it('marks pending stage with muted background', () => {
        render(<PipelineProgress stages={ mockStages } />);

        const pendingStage = screen.getByTestId('stage-audio');
        expect(pendingStage).toHaveClass('bg-muted');
    });

    it('shows check icon for done stage', () => {
        render(<PipelineProgress stages={ mockStages } />);

        const doneStage = screen.getByTestId('stage-script');
        const checkIcon = doneStage.querySelector('svg');
        expect(checkIcon).toBeInTheDocument();
        // The check icon path is rendered within the svg
        expect(checkIcon?.parentElement?.textContent).not.toContain('Loader2');
    });

    it('shows spinner icon for active stage', () => {
        render(<PipelineProgress stages={ mockStages } />);

        const activeStage = screen.getByTestId('stage-images');
        const spinnerIcon = activeStage.querySelector('svg');
        expect(spinnerIcon).toBeInTheDocument();
        expect(spinnerIcon).toHaveClass('animate-spin');
    });

    it('shows X icon for error stage', () => {
        render(<PipelineProgress stages={ mockStages } />);

        const errorStage = screen.getByTestId('stage-video');
        const errorIcon = errorStage.querySelector('svg');
        expect(errorIcon).toBeInTheDocument();
    });

    it('renders 3 connecting lines between 4 stages', () => {
        render(<PipelineProgress stages={ mockStages } />);

        const connectors = screen.getAllByTestId(/^connector-/);
        expect(connectors).toHaveLength(3);
    });

    it('marks connector green when previous stage is done', () => {
        render(<PipelineProgress stages={ mockStages } />);

        const firstConnector = screen.getByTestId('connector-script');
        expect(firstConnector).toHaveClass('bg-green-500');
    });

    it('marks connector muted when previous stage is not done', () => {
        render(<PipelineProgress stages={ mockStages } />);

        const secondConnector = screen.getByTestId('connector-images');
        expect(secondConnector).toHaveClass('bg-muted');
    });

    it('sets correct aria labels for each stage', () => {
        render(<PipelineProgress stages={ mockStages } />);

        expect(screen.getByTestId('stage-script')).toHaveAttribute(
            'aria-label',
            'Script: done',
        );
        expect(screen.getByTestId('stage-images')).toHaveAttribute(
            'aria-label',
            'Images: active',
        );
        expect(screen.getByTestId('stage-audio')).toHaveAttribute(
            'aria-label',
            'Audio: pending',
        );
        expect(screen.getByTestId('stage-video')).toHaveAttribute(
            'aria-label',
            'Video: error',
        );
    });
});
