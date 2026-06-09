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
        onGenerateScript: vi.fn(),
        onOpenScriptPreset: vi.fn(),
        ...overrides,
    };
}

describe('GenerationWizard', () => {
    it('starts on the story step', () => {
        render(<GenerationWizard {...makeProps()} />);
        expect(screen.getByText('Tu historia')).toBeInTheDocument();
    });

    it('disables continue when the story is invalid', () => {
        render(<GenerationWizard {...makeProps({ story: 'too short' })} />);
        expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
    });

    it('advances story → style → voice when each step is valid', async () => {
        const user = userEvent.setup();
        render(<GenerationWizard {...makeProps({ story: validStory, style: StoryStyle.ANIME })} />);

        await user.click(screen.getByRole('button', { name: /continuar/i }));
        expect(screen.getByText('Estilo visual')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /continuar/i }));
        expect(screen.getByText('Voz y narrador')).toBeInTheDocument();
    });

    it('disables the style-step continue when no style is selected', async () => {
        const user = userEvent.setup();
        render(<GenerationWizard {...makeProps({ story: validStory })} />);

        await user.click(screen.getByRole('button', { name: /continuar/i }));
        expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
    });

    it('disables the generate button when no voice is selected', async () => {
        const user = userEvent.setup();
        render(<GenerationWizard {...makeProps({ story: validStory, style: StoryStyle.ANIME })} />);

        await user.click(screen.getByRole('button', { name: /continuar/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));

        expect(screen.getByRole('button', { name: /generar guión/i })).toBeDisabled();
    });

    it('fires onGenerateScript when the voice step submits', async () => {
        const user = userEvent.setup();
        const onGenerateScript = vi.fn();
        render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    style: StoryStyle.ANIME,
                    voiceId: 'EXAVITQu4vr4xnSDxMaL',
                    onGenerateScript,
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /continuar/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));
        await user.click(screen.getByRole('button', { name: /generar guión/i }));

        expect(onGenerateScript).toHaveBeenCalledTimes(1);
    });

    it('shows the preset button on the voice step only when developer', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    style: StoryStyle.ANIME,
                    voiceId: 'EXAVITQu4vr4xnSDxMaL',
                })}
            />,
        );

        await user.click(screen.getByRole('button', { name: /continuar/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));
        expect(screen.queryByRole('button', { name: /usar preset/i })).not.toBeInTheDocument();

        rerender(
            <GenerationWizard
                {...makeProps({
                    story: validStory,
                    style: StoryStyle.ANIME,
                    voiceId: 'EXAVITQu4vr4xnSDxMaL',
                    isDeveloper: true,
                })}
            />,
        );
        expect(screen.getByRole('button', { name: /usar preset/i })).toBeInTheDocument();
    });

    it('walks back through the steps', async () => {
        const user = userEvent.setup();
        render(<GenerationWizard {...makeProps({ story: validStory, style: StoryStyle.ANIME })} />);

        await user.click(screen.getByRole('button', { name: /continuar/i }));
        await user.click(screen.getByRole('button', { name: /continuar/i }));
        expect(screen.getByText('Voz y narrador')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /atrás/i }));
        expect(screen.getByText('Estilo visual')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /atrás/i }));
        expect(screen.getByText('Tu historia')).toBeInTheDocument();
    });
});
