import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NeighborhoodSearchSelect } from '../NeighborhoodSearchSelect';

const tMock = (key) => {
    const translations = {
        'digital_menu.checkout.placeholders.neighborhood': 'Selecionar bairro',
        'digital_menu.checkout.search_neighborhood': 'Buscar bairro...',
        'digital_menu.checkout.type_custom_neighborhood': 'Digite o nome do seu bairro...',
        'digital_menu.checkout.back_to_list': 'Voltar para a lista',
        'digital_menu.checkout.no_neighborhood_found': 'Nenhum bairro encontrado',
        'digital_menu.checkout.type_manually': 'Digitar manualmente',
    };
    return translations[key] ?? key;
};

const mockNeighborhoods = [
    { id: 1, name: 'Centro', delivery_fee: 5.00 },
    { id: 2, name: 'Vila Nova', delivery_fee: 7.00 },
    { id: 3, name: 'Jardim América', delivery_fee: 10.00 },
];

function renderComponent(props = {}) {
    const defaults = {
        neighborhoods: mockNeighborhoods,
        selectedId: '',
        onChangeSelectedId: vi.fn(),
        customName: '',
        onChangeCustomName: vi.fn(),
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

    it('calls onChangeSelectedId with neighborhood id when an option is selected', () => {
        const onChangeSelectedId = vi.fn();
        renderComponent({ onChangeSelectedId });

        fireEvent.click(screen.getByRole('button', { name: /selecionar bairro/i }));
        
        // Find the button inside the listbox for "Centro"
        const option = screen.getByRole('option', { name: /centro/i });
        fireEvent.click(option);

        expect(onChangeSelectedId).toHaveBeenCalledWith(1);
    });

    it('switches to manual input when "Digitar manualmente" is clicked', () => {
        const onChangeSelectedId = vi.fn();
        renderComponent({ onChangeSelectedId });

        fireEvent.click(screen.getByRole('button', { name: /selecionar bairro/i }));
        fireEvent.click(screen.getByText(/digitar manualmente/i));

        expect(onChangeSelectedId).toHaveBeenCalledWith('custom');
    });

    it('allows typing in manual input mode', () => {
        const onChangeCustomName = vi.fn();
        renderComponent({ selectedId: 'custom', onChangeCustomName });

        const input = screen.getByPlaceholderText(/digite o nome do seu bairro/i);
        fireEvent.change(input, { target: { value: 'Meu Bairro Especial' } });

        expect(onChangeCustomName).toHaveBeenCalledWith('Meu Bairro Especial');
    });

    it('shows "no neighborhood found" when search returns no results', () => {
        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /selecionar bairro/i }));

        const searchInput = screen.getByPlaceholderText('Buscar bairro...');
        fireEvent.change(searchInput, { target: { value: 'bairro que nao existe xyz' } });

        expect(screen.getByText('Nenhum bairro encontrado')).toBeInTheDocument();
    });
});
