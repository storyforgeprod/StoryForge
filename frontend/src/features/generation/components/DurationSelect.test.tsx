import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DurationSelect } from './DurationSelect';

describe('DurationSelect', () => {
    it('renders the current value as selected', () => {
        render(<DurationSelect value={60} onChange={vi.fn()} />);
        expect(screen.getByRole('combobox')).toHaveTextContent('60 segundos');
    });

    it('calls onChange with a numeric value when an option is selected', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<DurationSelect value={60} onChange={onChange} />);

        await user.click(screen.getByRole('combobox'));
        await user.click(screen.getByRole('option', { name: '30 segundos' }));

        expect(onChange).toHaveBeenCalledWith(30);
    });

    it('renders all 5 duration options', async () => {
        const user = userEvent.setup();
        render(<DurationSelect value={60} onChange={vi.fn()} />);

        await user.click(screen.getByRole('combobox'));

        expect(screen.getByRole('option', { name: '30 segundos' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '45 segundos' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '60 segundos' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '90 segundos' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '120 segundos' })).toBeInTheDocument();
    });
});
