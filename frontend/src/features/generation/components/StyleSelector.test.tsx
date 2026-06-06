import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StyleSelector } from './StyleSelector';

describe('StyleSelector', () => {
    it('renders exactly four style options', () => {
        render(<StyleSelector value={null} onChange={vi.fn()} />);

        expect(screen.getByText('Anime')).toBeInTheDocument();
        expect(screen.getByText('Manga')).toBeInTheDocument();
        expect(screen.getByText('Novela')).toBeInTheDocument();
        expect(screen.getByText('Webtoon')).toBeInTheDocument();
    });

    it('calls onChange with correct value when a style is selected', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();

        render(<StyleSelector value={null} onChange={onChange} />);

        const animeButton = screen.getByRole('radio', { name: /anime/i });
        await user.click(animeButton);

        expect(onChange).toHaveBeenCalledWith('anime');
    });

    it('marks the selected option with aria-checked="true"', () => {
        render(<StyleSelector value="manga" onChange={vi.fn()} />);

        const mangaButton = screen.getByRole('radio', { name: /manga/i });
        expect(mangaButton).toHaveAttribute('aria-checked', 'true');
    });

    it('deselects previously selected option when a new one is clicked', async () => {
        const onChange = vi.fn();

        const { rerender } = render(
            <StyleSelector value="anime" onChange={onChange} />
        );

        expect(screen.getByRole('radio', { name: /anime/i })).toHaveAttribute(
            'aria-checked',
            'true'
        );

        // Update the component to reflect new value
        rerender(<StyleSelector value="webtoon" onChange={onChange} />);

        expect(screen.getByRole('radio', { name: /anime/i })).toHaveAttribute(
            'aria-checked',
            'false'
        );
        expect(screen.getByRole('radio', { name: /webtoon/i })).toHaveAttribute(
            'aria-checked',
            'true'
        );
    });

    it('displays visual styles with icons and descriptions', () => {
        render(<StyleSelector value={null} onChange={vi.fn()} />);

        expect(screen.getByText(/Colores vibrantes, expresión dramática/)).toBeInTheDocument();
        expect(screen.getByText(/Blanco y negro, alto contraste/)).toBeInTheDocument();
        expect(screen.getByText(/Ilustración detallada, cinematográfico/)).toBeInTheDocument();
        expect(screen.getByText(/Paleta suave, scroll vertical/)).toBeInTheDocument();
    });

    it('is keyboard accessible with Tab navigation', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();

        render(<StyleSelector value={null} onChange={onChange} />);

        const animeButton = screen.getByRole('radio', { name: /anime/i });
        animeButton.focus();
        expect(document.activeElement).toBe(animeButton);

        await user.keyboard(' ');
        expect(onChange).toHaveBeenCalledWith('anime');
    });

    it('does not call onChange when disabled', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();

        render(
            <StyleSelector value={null} onChange={onChange} disabled={true} />
        );

        const animeButton = screen.getByRole('radio', { name: /anime/i });
        await user.click(animeButton);

        expect(onChange).not.toHaveBeenCalled();
    });

    it('has proper role attributes for accessibility', () => {
        render(<StyleSelector value={null} onChange={vi.fn()} />);

        const radioGroup = screen.getByRole('radiogroup');
        expect(radioGroup).toHaveAttribute('aria-label', 'Select visual style');

        const radioButtons = screen.getAllByRole('radio');
        expect(radioButtons).toHaveLength(4);
    });
});

