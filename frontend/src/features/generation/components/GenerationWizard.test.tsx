import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GenerationWizard } from './GenerationWizard';
import { StoryStyle } from '../types';

const validStory = 'a'.repeat(60);

function makeProps(overrides: Partial<React.ComponentProps<typeof GenerationWizard>> = {}) {
    return {
        story: '',
        onStoryChange: vi.fn(),
        style: null,
        onStyleChange: vi.fn(),
        voiceId: null,
        onVoiceChange: vi.fn(),
        isDeveloper: false,
        genState: { phase: 'idle' as const },
        onGenerateScript: vi.fn(),
        onRetryScript: vi.fn(),
        onStartPipeline: vi.fn(),
        onOpenScriptPreset: vi.fn(),
        ...overrides,
    };
}

describe('GenerationWizard', () => {
    it('starts on the story step', () => {
        render(<GenerationWizard {...makeProps()} />);
        expect(screen.getByText('Tu historia')).toBeInTheDocument();
    });

    it('shows Duración and Escenas selects on the story step', () => {
        render(<GenerationWizard {...makeProps()} />);
        expect(screen.getByText('Duración')).toBeInTheDocument();
        expect(screen.getByText('Escenas')).toBeInTheDocument();
    });

    it('disables "Generar guión" when the story is invalid', () => {
        render(<GenerationWizard {...makeProps({ story: 'too short' })} />);
        expect(screen.getByRole('button', { name: /generar guión/i })).toBeDisabled();
    });

    it('fires onGenerateScript with duration and scenes, then shows script step', async () => {
        const user = userEvent.setup();
        const onGenerateScript = vi.fn();
        render(<GenerationWizard {...makeProps({ story: validStory, onGenerateScript })} />);

        await user.click(screen.getByRole('button', { name: /generar guión/i }));

        expect(onGenerateScript).toHaveBeenCalledTimes(1);
        expect(onGenerateScript).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
        expect(screen.getByText('Tu guión')).toBeInTheDocument();
    });

    it('disables continue on script step while genState is not completed', async () => {
        const user = userEvent.setup();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    genState: { phase: 'polling', jobId: 'job1', attempts: 1 },
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));

        expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
    });

    it('enables continue on script step when genState is completed', async () => {
        const user = userEvent.setup();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    genState: {
                        phase: 'completed',
                        script: 'Scene 1: Intro (5s)\n[Sound: Hello]',
                    },
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));

        expect(screen.getByRole('button', { name: /continuar/i })).not.toBeDisabled();
    });

    it('advances script → style → voice when each step is valid', async () => {
        const user = userEvent.setup();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    style: StoryStyle.ANIME,
                    voiceId: 'voice1',
                    genState: {
                        phase: 'completed',
                        script: 'Scene 1: Intro (5s)\n[Sound: Hello]',
                    },
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        expect(screen.getByText('Tu guión')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /continuar/i }));
        expect(screen.getByText('Estilo visual')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /continuar/i }));
        expect(screen.getByText('Voz y narrador')).toBeInTheDocument();
    });

    it('disables style-step continue when no style is selected', async () => {
        const user = userEvent.setup();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    style: null,
                    genState: {
                        phase: 'completed',
                        script: 'Scene 1: Intro (5s)\n[Sound: Hello]',
                    },
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));

        expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
    });

    it('fires onStartPipeline when "Generar video" is clicked with voice selected', async () => {
        const user = userEvent.setup();
        const onStartPipeline = vi.fn();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    style: StoryStyle.ANIME,
                    voiceId: 'voice1',
                    genState: {
                        phase: 'completed',
                        script: 'Scene 1: Intro (5s)\n[Sound: Hello]',
                    },
                    onStartPipeline,
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));
        await user.click(screen.getByRole('button', { name: /generar video/i }));

        expect(onStartPipeline).toHaveBeenCalledTimes(1);
    });

    it('disables "Generar video" when no voice is selected', async () => {
        const user = userEvent.setup();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    style: StoryStyle.ANIME,
                    voiceId: null,
                    genState: {
                        phase: 'completed',
                        script: 'Scene 1: Intro (5s)\n[Sound: Hello]',
                    },
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));

        expect(screen.getByRole('button', { name: /generar video/i })).toBeDisabled();
    });

    it('calls onRetryScript and returns to story step when back is pressed on script step', async () => {
        const user = userEvent.setup();
        const onRetryScript = vi.fn();
        render(<GenerationWizard {...makeProps({ story: validStory, onRetryScript })} />);

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        expect(screen.getByText('Tu guión')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /atrás/i }));

        expect(onRetryScript).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Tu historia')).toBeInTheDocument();
    });

    it('walks back through all steps', async () => {
        const user = userEvent.setup();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    style: StoryStyle.ANIME,
                    genState: {
                        phase: 'completed',
                        script: 'Scene 1: Intro (5s)\n[Sound: Hello]',
                    },
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));
        expect(screen.getByText('Voz y narrador')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /atrás/i }));
        expect(screen.getByText('Estilo visual')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /atrás/i }));
        expect(screen.getByText('Tu guión')).toBeInTheDocument();
    });

    it('shows preset button on script step only when developer', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <GenerationWizard {...makeProps({ story: validStory, isDeveloper: false })} />,
        );

        await user.click(screen.getByRole('button', { name: /generar guión/i }));
        expect(screen.queryByRole('button', { name: /usar preset/i })).not.toBeInTheDocument();

        rerender(<GenerationWizard {...makeProps({ story: validStory, isDeveloper: true })} />);
        expect(screen.getByRole('button', { name: /usar preset/i })).toBeInTheDocument();
    });
});
