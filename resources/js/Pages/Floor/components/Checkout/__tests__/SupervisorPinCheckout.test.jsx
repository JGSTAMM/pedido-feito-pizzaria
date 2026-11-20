import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import SupervisorPinModal from '../SupervisorPinModal';
import DiscountSection from '../DiscountSection';
import { useCheckoutMath } from '../../../hooks/useCheckoutMath';
import TabSeguranca from '../../../../Settings/Components/TabSeguranca';

const mockPost = vi.fn();
const mockDelete = vi.fn();
const mockSetData = vi.fn();
const mockReset = vi.fn();
const mockClearErrors = vi.fn();

let formState = {
    user_id: 'sup-1',
    pin: '',
    pin_confirmation: '',
};

vi.mock('axios');

vi.mock('@inertiajs/react', () => ({
    router: {
        delete: (...args) => mockDelete(...args),
    },
    useForm: () => ({
        get data() {
            return formState;
        },
        setData: (key, val) => {
            if (typeof key === 'string') {
                formState = { ...formState, [key]: val };
            }
            mockSetData(key, val);
        },
        post: (...args) => mockPost(...args),
        processing: false,
        errors: {},
        reset: (...args) => mockReset(...args),
        clearErrors: (...args) => mockClearErrors(...args),
    }),
}));

vi.mock('@/hooks/useI18n', () => ({
    default: () => ({
        t: (key) => key,
        formatCurrency: (val) => `R$ ${Number(val || 0).toFixed(2)}`,
    }),
}));

describe('Supervisor PIN Checkout & Settings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        formState = {
            user_id: 'sup-1',
            pin: '',
            pin_confirmation: '',
        };
    });

    it('sanitizes SupervisorPinModal input to 4 digits and handles error reasons', async () => {
        const onUnlock = vi.fn();
        const onClose = vi.fn();

        axios.post.mockRejectedValueOnce({
            response: { status: 401, data: { reason: 'not_configured' } },
        });

        render(<SupervisorPinModal isOpen onClose={onClose} onUnlock={onUnlock} />);

        const input = screen.getByPlaceholderText('****');
        const unlockBtn = screen.getByRole('button', { name: /floor\.drawer\.checkout\.unlock/i });

        expect(unlockBtn).toBeDisabled();

        fireEvent.change(input, { target: { value: '12ab3456' } });
        expect(input.value).toBe('1234');
        expect(unlockBtn).toBeEnabled();

        fireEvent.click(unlockBtn);

        await waitFor(() => {
            expect(screen.getByText('floor.drawer.checkout.pin_not_configured')).toBeInTheDocument();
        });

        axios.post.mockRejectedValueOnce({
            response: { status: 429, data: {} },
        });

        fireEvent.click(unlockBtn);

        await waitFor(() => {
            expect(screen.getByText('floor.drawer.checkout.too_many_attempts')).toBeInTheDocument();
        });

        axios.post.mockResolvedValueOnce({
            data: { valid: true, supervisor_name: 'Admin', supervisor_id: 'sup-1' },
        });

        fireEvent.click(unlockBtn);

        await waitFor(() => {
            expect(onUnlock).toHaveBeenCalledWith('Admin', 'sup-1');
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('preserves supervisorId when applying a discount after unlocking', async () => {
        axios.post.mockResolvedValueOnce({
            data: { valid: true, supervisor_name: 'Gerente', supervisor_id: 'sup-99' },
        });

        function Harness() {
            const {
                discountUnlocked,
                discountAmount,
                discountValue,
                discountMode,
                supervisorName,
                supervisorId,
                applyDiscount,
                resetDiscount,
            } = useCheckoutMath({ activeOrders: [{ total: 100 }] });

            return (
                <div>
                    <span data-testid="supervisor-id">{supervisorId || 'none'}</span>
                    <DiscountSection
                        discountUnlocked={discountUnlocked}
                        discountAmount={discountAmount}
                        discountValue={discountValue}
                        discountMode={discountMode}
                        supervisorName={supervisorName}
                        supervisorId={supervisorId}
                        applyDiscount={applyDiscount}
                        resetDiscount={resetDiscount}
                        formatCurrency={(v) => `R$ ${Number(v).toFixed(2)}`}
                    />
                </div>
            );
        }

        render(<Harness />);

        fireEvent.click(screen.getByRole('button', { name: /floor\.drawer\.checkout\.unlock_discount/i }));

        const pinInput = screen.getByPlaceholderText('****');
        fireEvent.change(pinInput, { target: { value: '1234' } });
        fireEvent.click(screen.getByRole('button', { name: /floor\.drawer\.checkout\.unlock$/i }));

        await waitFor(() => {
            expect(screen.getByTestId('supervisor-id')).toHaveTextContent('sup-99');
        });

        const amountInput = screen.getByPlaceholderText('0');
        fireEvent.change(amountInput, { target: { value: '15' } });
        fireEvent.click(screen.getByRole('button', { name: 'floor.drawer.checkout.apply' }));

        expect(screen.getByTestId('supervisor-id')).toHaveTextContent('sup-99');
    });

    it('renders TabSeguranca and submits 4-digit PIN to /settings/supervisor-pin', () => {
        const { rerender } = render(
            <TabSeguranca
                supervisorSecurity={{
                    can_manage: true,
                    current_user_id: 'sup-1',
                    supervisors: [
                        { id: 'sup-1', name: 'Admin', email: 'admin@pedidofeito.com', role: 'admin', has_pin: false },
                    ],
                }}
            />
        );

        const pinInputs = screen.getAllByPlaceholderText('settings.security.pin_placeholder');
        fireEvent.change(pinInputs[0], { target: { value: '04ab299' } });
        fireEvent.change(pinInputs[1], { target: { value: '0429' } });

        rerender(
            <TabSeguranca
                supervisorSecurity={{
                    can_manage: true,
                    current_user_id: 'sup-1',
                    supervisors: [
                        { id: 'sup-1', name: 'Admin', email: 'admin@pedidofeito.com', role: 'admin', has_pin: false },
                    ],
                }}
            />
        );

        expect(mockSetData).toHaveBeenCalledWith('pin', '0429');
        expect(mockSetData).toHaveBeenCalledWith('pin_confirmation', '0429');

        const saveBtn = screen.getByRole('button', { name: /settings\.security\.save_pin/i });
        expect(saveBtn).toBeEnabled();
        fireEvent.click(saveBtn);

        expect(mockPost).toHaveBeenCalledWith('/settings/supervisor-pin', expect.objectContaining({
            preserveScroll: true,
        }));
    });
});
