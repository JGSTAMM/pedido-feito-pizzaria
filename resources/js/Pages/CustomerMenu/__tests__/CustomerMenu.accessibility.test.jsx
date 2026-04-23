import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CustomerMenu from '../Index';

const mockUsePage = vi.hoisted(() => vi.fn());

vi.mock('@inertiajs/react', () => ({
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
    usePage: () => mockUsePage(),
}));

vi.mock('@/hooks/useI18n', () => ({
    default: () => ({
        t: (key) => key,
        formatCurrency: (value) => `R$ ${Number(value || 0).toFixed(2)}`,
        translateDynamic: (value) => value,
    }),
}));

vi.mock('../hooks/useDigitalMenuQuery', () => ({
    useDigitalMenuQuery: () => ({
        data: {
            products: [
                { id: 'prod-1', name: 'Calabresa', category: 'Tradicional', price: 40, description: 'Pizza tradicional' },
            ],
            pizza_sizes: [{ id: 'size-1', name: 'Grande', max_flavors: 3, is_special_broto_rule: false }],
            pizza_flavors: [{ id: 'flavor-1', name: 'Calabresa', base_price: 45, ingredients: 'Queijo, Calabresa' }],
        },
        error: null,
        isLoading: false,
        refetch: vi.fn(),
    }),
}));

vi.mock('../hooks/useCart', () => ({
    useCart: () => ({
        items: [],
        addItem: vi.fn(),
        removeItem: vi.fn(),
        updateQuantity: vi.fn(),
        cartTotal: 0,
        cartItemCount: 0,
    }),
}));

describe('CustomerMenu keyboard and focus behavior', () => {
    beforeEach(() => {
        mockUsePage.mockReturnValue({
            url: '/menu',
            props: {
                catalogEndpoint: '/api/menu/catalog',
                storeSetting: {
                    store_name: 'Pizzaria',
                    is_open: true,
                    opening_hours: {
                        sunday: { closed: true },
                        monday: { open: '18:00', close: '23:00', closed: false },
                        tuesday: { open: '18:00', close: '23:00', closed: false },
                        wednesday: { open: '18:00', close: '23:00', closed: false },
                        thursday: { open: '18:00', close: '23:00', closed: false },
                        friday: { open: '18:00', close: '23:00', closed: false },
                        saturday: { open: '18:00', close: '23:00', closed: false },
                    },
                },
            },
        });
    });

    it('opens pizza dialog, focuses close button and restores focus on escape', async () => {
        render(<CustomerMenu />);

        const openButtons = screen.getAllByRole('button', { name: /digital_menu\.home\.pizza_custom_btn/i });
        const openPizzaBuilderButton = openButtons[0];
        openPizzaBuilderButton.focus();

        fireEvent.click(openPizzaBuilderButton);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();

        // The close button name might include the icon text 'close' if it's inside
        const closeDialogButton = screen.getByRole('button', { name: /digital_menu\.cart\.close_cart/i });

        await waitFor(() => {
            expect(closeDialogButton).toHaveFocus();
        });

        fireEvent.keyDown(window, { key: 'Escape' });

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        await waitFor(() => {
            expect(openPizzaBuilderButton).toHaveFocus();
        });
    });

    it('keeps keyboard focus inside dialog when tabbing', async () => {
        render(<CustomerMenu />);

        fireEvent.click(screen.getAllByRole('button', { name: /digital_menu\.home\.pizza_custom_btn/i })[0]);

        const dialog = screen.getByRole('dialog');
        const closeDialogButton = screen.getByRole('button', { name: /digital_menu\.cart\.close_cart/i });

        await waitFor(() => {
            expect(closeDialogButton).toHaveFocus();
        });

        fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
        expect(dialog.contains(document.activeElement)).toBe(true);

        fireEvent.keyDown(window, { key: 'Tab' });
        expect(dialog.contains(document.activeElement)).toBe(true);
    });
});
