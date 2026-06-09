import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScenesSelect } from './ScenesSelect';

describe('ScenesSelect', () => {
    it('renders the current value as selected', () => {
        render(<ScenesSelect value={5} onChange={vi.fn()} />);
        expect(screen.getByRole('combobox')).toHaveTextContent('5 escenas');
    });

    it('calls onChange with a numeric value when an option is selected', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<ScenesSelect value={5} onChange={onChange} />);

        await user.click(screen.getByRole('combobox'));
        await user.click(screen.getByRole('option', { name: '3 escenas' }));

        expect(onChange).toHaveBeenCalledWith(3);
    });

    it('renders all 5 scenes options', async () => {
        const user = userEvent.setup();
        render(<ScenesSelect value={5} onChange={vi.fn()} />);

        await user.click(screen.getByRole('combobox'));

        expect(screen.getByRole('option', { name: '3 escenas' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '5 escenas' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '7 escenas' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '10 escenas' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '12 escenas' })).toBeInTheDocument();
    });
});
