import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NeighborhoodSearchSelect } from '../NeighborhoodSearchSelect';

const tMock = (key) => {
    const translations = {
        'digital_menu.checkout.select_neighborhood': 'Selecionar bairro',
        'digital_menu.checkout.search_neighborhood': 'Buscar bairro...',
        'digital_menu.checkout.neighborhood_placeholder': 'Digite seu bairro',
        'digital_menu.checkout.neighborhood_label': 'Bairro',
        'digital_menu.checkout.type_manually': 'Digitar manualmente',
        'digital_menu.checkout.back_to_list': 'Voltar para a lista',
        'digital_menu.checkout.no_neighborhood_found': 'Nenhum bairro encontrado',
    };
    return translations[key] ?? key;
};

const mockNeighborhoods = [
    { id: 1, name: 'Centro' },
    { id: 2, name: 'Vila Nova' },
    { id: 3, name: 'Jardim América' },
];

function renderComponent(props = {}) {
    const defaults = {
        neighborhoods: mockNeighborhoods,
        value: '',
        onChange: vi.fn(),
        t: tMock,
    };
    return render(<NeighborhoodSearchSelect {...defaults} {...props} />);
}

describe('NeighborhoodSearchSelect', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the trigger button with placeholder text', () => {
        renderComponent();
        expect(screen.getByRole('button', { name: /selecionar bairro/i })).toBeInTheDocument();
    });

    it('opens the dropdown when trigger is clicked', () => {
        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /selecionar bairro/i }));
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(screen.getByText('Centro')).toBeInTheDocument();
        expect(screen.getByText('Vila Nova')).toBeInTheDocument();
    });

    it('filters neighborhoods by search query', () => {
        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /selecionar bairro/i }));

        const searchInput = screen.getByPlaceholderText('Buscar bairro...');
        fireEvent.change(searchInput, { target: { value: 'centro' } });

        expect(screen.getByText('Centro')).toBeInTheDocument();
        expect(screen.queryByText('Vila Nova')).not.toBeInTheDocument();
    });

    it('calls onChange with neighborhood name when an option is selected', () => {
        const onChange = vi.fn();
        renderComponent({ onChange });

        fireEvent.click(screen.getByRole('button', { name: /selecionar bairro/i }));
        fireEvent.click(screen.getByRole('option', { name: 'Centro' }));

        expect(onChange).toHaveBeenCalledWith('Centro');
    });

    it('switches to manual input when "Digitar manualmente" is clicked', () => {
        const onChange = vi.fn();
        renderComponent({ onChange });

        fireEvent.click(screen.getByRole('button', { name: /selecionar bairro/i }));
        fireEvent.click(screen.getByText('Digitar manualmente'));

        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(onChange).toHaveBeenCalledWith('');
    });

    it('allows typing in manual input mode', () => {
        const onChange = vi.fn();
        renderComponent({ onChange });

        fireEvent.click(screen.getByRole('button', { name: /selecionar bairro/i }));
        fireEvent.click(screen.getByText('Digitar manualmente'));

        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'Meu Bairro Especial' } });

        expect(onChange).toHaveBeenCalledWith('Meu Bairro Especial');
    });

    it('shows "no neighborhood found" when search returns no results', () => {
        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /selecionar bairro/i }));

        const searchInput = screen.getByPlaceholderText('Buscar bairro...');
        fireEvent.change(searchInput, { target: { value: 'bairro que nao existe xyz' } });

        expect(screen.getByText('Nenhum bairro encontrado')).toBeInTheDocument();
    });
});
