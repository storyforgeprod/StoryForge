import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceSelector } from './VoiceSelector';

describe('VoiceSelector', () => {
    it('renders at least 2 voice options', () => {
        render(<VoiceSelector value={null} onChange={vi.fn()} />);

        const radios = screen.getAllByRole('radio');
        expect(radios.length).toBeGreaterThanOrEqual(2);
        expect(screen.getByRole('radio', { name: /sarah/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /liam/i })).toBeInTheDocument();
    });

    it('calls onChange with the correct voiceId when a card is clicked', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();

        render(<VoiceSelector value={null} onChange={onChange} />);

        await user.click(screen.getByRole('radio', { name: /sarah/i }));
        expect(onChange).toHaveBeenCalledWith('EXAVITQu4vr4xnSDxMaL');
    });

    it('marks the selected option with aria-checked="true"', () => {
        render(<VoiceSelector value="TX3LPaxmHKxFdv7VOQHJ" onChange={vi.fn()} />);

        expect(screen.getByRole('radio', { name: /liam/i })).toHaveAttribute(
            'aria-checked',
            'true',
        );
        expect(screen.getByRole('radio', { name: /sarah/i })).toHaveAttribute(
            'aria-checked',
            'false',
        );
    });

    it('has a play button for each voice card', () => {
        render(<VoiceSelector value={null} onChange={vi.fn()} />);

        const playButtons = screen.getAllByRole('button', { name: /reproducir/i });
        expect(playButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('shows an inline error when audio onError fires', () => {
        const { container } = render(<VoiceSelector value={null} onChange={vi.fn()} />);

        const audioEls = container.querySelectorAll('audio');
        expect(audioEls.length).toBeGreaterThanOrEqual(1);

        fireEvent.error(audioEls[0]);

        expect(screen.getByText(/no se pudo cargar el audio/i)).toBeInTheDocument();
    });

    it('selects a voice with Enter key', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();

        render(<VoiceSelector value={null} onChange={onChange} />);

        const sarahCard = screen.getByRole('radio', { name: /sarah/i });
        sarahCard.focus();
        await user.keyboard(' ');

        expect(onChange).toHaveBeenCalledWith('EXAVITQu4vr4xnSDxMaL');
    });

    it('does not call onChange when disabled', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();

        render(<VoiceSelector value={null} onChange={onChange} disabled />);

        await user.click(screen.getByRole('radio', { name: /sarah/i }));

        expect(onChange).not.toHaveBeenCalled();
    });

    it('has proper radiogroup role', () => {
        render(<VoiceSelector value={null} onChange={vi.fn()} />);

        expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });
});
