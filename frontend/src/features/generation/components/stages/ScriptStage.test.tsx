import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScriptStage } from './ScriptStage';
import { StoryStyle } from '../../types';

const baseProps = {
    isPresetMode: false,
    isDeveloper: false,
    imagesIdle: true,
    scriptJobId: 'job_1',
    style: StoryStyle.ANIME,
    onGenerateImages: vi.fn(),
    onRetry: vi.fn(),
    onOpenImagesPreset: vi.fn(),
};

describe('ScriptStage', () => {
    it('renders nothing in preset mode', () => {
        const { container } = render(
            <ScriptStage {...baseProps} isPresetMode={true} state={{ phase: 'idle' }} />,
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing while idle', () => {
        const { container } = render(<ScriptStage {...baseProps} state={{ phase: 'idle' }} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('shows the loading state while submitting', () => {
        render(<ScriptStage {...baseProps} state={{ phase: 'submitting' }} />);
        expect(screen.getByText('Analizando tu historia…')).toBeInTheDocument();
    });

    it('shows the loading state while polling', () => {
        render(
            <ScriptStage
                {...baseProps}
                state={{ phase: 'polling', jobId: 'job_1', attempts: 1 }}
            />,
        );
        expect(screen.getByText('Analizando tu historia…')).toBeInTheDocument();
    });

    it('shows the script and triggers generate-images when completed', async () => {
        const user = userEvent.setup();
        const onGenerateImages = vi.fn();
        render(
            <ScriptStage
                {...baseProps}
                onGenerateImages={onGenerateImages}
                state={{ phase: 'completed', script: 'Once upon a time…' }}
            />,
        );

        expect(screen.getByText('Guión generado')).toBeInTheDocument();
        expect(screen.getByText('Once upon a time…')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /generar imágenes/i }));
        expect(onGenerateImages).toHaveBeenCalledTimes(1);
    });

    it('disables the generate-images button when scriptJobId is missing', () => {
        render(
            <ScriptStage
                {...baseProps}
                scriptJobId={null}
                state={{ phase: 'completed', script: 's' }}
            />,
        );
        expect(screen.getByRole('button', { name: /generar imágenes/i })).toBeDisabled();
    });

    it('disables the generate-images button when style is missing', () => {
        render(
            <ScriptStage
                {...baseProps}
                style={null}
                state={{ phase: 'completed', script: 's' }}
            />,
        );
        expect(screen.getByRole('button', { name: /generar imágenes/i })).toBeDisabled();
    });

    it('shows the preset button only when isDeveloper is true', () => {
        const { rerender } = render(
            <ScriptStage {...baseProps} state={{ phase: 'completed', script: 's' }} />,
        );
        expect(screen.queryByRole('button', { name: /usar preset/i })).not.toBeInTheDocument();

        rerender(
            <ScriptStage
                {...baseProps}
                isDeveloper={true}
                state={{ phase: 'completed', script: 's' }}
            />,
        );
        expect(screen.getByRole('button', { name: /usar preset/i })).toBeInTheDocument();
    });

    it('renders the error state with a retry button', async () => {
        const user = userEvent.setup();
        const onRetry = vi.fn();
        render(
            <ScriptStage
                {...baseProps}
                onRetry={onRetry}
                state={{ phase: 'error', message: 'Something failed' }}
            />,
        );

        expect(screen.getByText('Something failed')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /reintentar/i }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('hides completed and error views when imagesIdle is false', () => {
        const { container, rerender } = render(
            <ScriptStage
                {...baseProps}
                imagesIdle={false}
                state={{ phase: 'completed', script: 's' }}
            />,
        );
        expect(container).toBeEmptyDOMElement();

        rerender(
            <ScriptStage
                {...baseProps}
                imagesIdle={false}
                state={{ phase: 'error', message: 'x' }}
            />,
        );
        expect(container).toBeEmptyDOMElement();
    });
});
