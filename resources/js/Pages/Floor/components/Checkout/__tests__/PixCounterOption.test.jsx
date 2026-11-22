import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import CheckoutModal from '../CheckoutModal';
import PaymentModal from '../../../../POS/PaymentModal';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn(),
    },
}));

vi.mock('@/hooks/useI18n', () => ({
    default: () => ({
        t: (key) => key,
        formatCurrency: (val) => `R$ ${Number(val || 0).toFixed(2)}`,
    }),
}));

vi.mock('@/Components/CustomNumberInput', () => ({
    default: ({ value, onChange, placeholder, onKeyDown }) => (
        <input
            data-testid="custom-number-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
        />
    ),
}));

vi.mock('../BillConference', () => ({ default: () => <div data-testid="bill-conference" /> }));
vi.mock('../ServiceFeeToggle', () => ({ default: () => <div data-testid="service-fee-toggle" /> }));
vi.mock('../DiscountSection', () => ({ default: () => <div data-testid="discount-section" /> }));
vi.mock('../CalculatorPopover', () => ({ default: () => <div data-testid="calculator-popover" /> }));

describe('PIX Counter (Fixed QR) vs PIX Online (Mercado Pago)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Table CheckoutModal registers pix_balcao immediately without generating Mercado Pago QR, while pix calls generatePixPayment', () => {
        const setCheckoutPaymentMethod = vi.fn();
        const setPayments = vi.fn();
        const generatePixPayment = vi.fn();

        const baseProps = {
            activeOrders: [{ id: 10, total: 80 }],
            payments: [],
            setPayments,
            checkoutPaymentMethod: 'pix_balcao',
            setCheckoutPaymentMethod,
            paymentInputValue: '80.00',
            setPaymentInputValue: vi.fn(),
            handleCheckout: vi.fn(),
            checkingOut: false,
            onClose: vi.fn(),
            generatePixPayment,
            formatCurrency: (v) => `R$ ${Number(v || 0).toFixed(2)}`,
            t: (key) => key,
            onPrintBill: vi.fn(),
            isPrintingBill: false,
            generatingPix: false,
            pixQrCode: null,
            pixQrCodeBase64: null,
            pixAmount: 0,
            pixCountdown: 0,
            pixApproved: false,
            pixError: null,
            setIsQrFullscreen: vi.fn(),
            handleCopyCode: vi.fn(),
            copied: false,
            stopPixTracking: vi.fn(),
            formatCountdown: (s) => `${s}s`,
        };

        const { rerender } = render(<CheckoutModal {...baseProps} />);

        // Both PIX methods are rendered
        expect(screen.getByRole('button', { name: /floor\.drawer\.methods\.pix_manual/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /floor\.drawer\.methods\.pix_online/i })).toBeInTheDocument();

        // Adding pix_balcao records payment locally without calling Mercado Pago API
        const addBtn = screen.getByRole('button', { name: 'add' });
        fireEvent.click(addBtn);

        expect(generatePixPayment).not.toHaveBeenCalled();
        expect(setPayments).toHaveBeenCalledTimes(1);

        // Switching to online pix triggers generatePixPayment instead of adding immediately
        rerender(<CheckoutModal {...baseProps} checkoutPaymentMethod="pix_online" />);
        fireEvent.click(screen.getByRole('button', { name: 'add' }));

        expect(generatePixPayment).toHaveBeenCalledWith(80);
    });

    it('POS PaymentModal adds pix_balcao immediately without API call, and calls /pos/generate-pix for online pix', async () => {
        const onConfirm = vi.fn();
        axios.post.mockResolvedValueOnce({
            data: {
                success: true,
                gateway_payment_id: 'mp_pos_777',
                qr_code: '00020126580014BR.GOV.BCB.PIX',
                qr_code_base64: 'iVBORw0KGgoAAAANSUhEUg==',
                expires_at: new Date(Date.now() + 900000).toISOString(),
            },
        });

        render(
            <PaymentModal
                isOpen={true}
                onClose={vi.fn()}
                onConfirm={onConfirm}
                total={60}
            />
        );

        // Fill customer name
        const nameInput = screen.getByPlaceholderText('pos.payment.customer_name_placeholder');
        fireEvent.change(nameInput, { target: { value: 'Carlos Silva' } });

        // Click Quick PIX Balcão -> immediate payment, no axios call
        fireEvent.click(screen.getByTestId('pos-quick-pix_balcao'));

        expect(axios.post).not.toHaveBeenCalled();
        expect(screen.getByText('pos.payment.methods.pix_balcao')).toBeInTheDocument();

        // Confirm sale with pix_balcao
        fireEvent.click(screen.getByRole('button', { name: /pos\.payment\.finalize_sale/i }));
        expect(onConfirm).toHaveBeenCalledWith(
            [{ method: 'pix_balcao', amount: 60 }],
            'Carlos Silva',
            null
        );

        // Now click Quick Online PIX -> triggers POST /pos/generate-pix and displays QR code view
        fireEvent.click(screen.getByTestId('pos-quick-pix'));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('/pos/generate-pix', {
                amount: 60,
                customer_name: 'Carlos Silva',
            });
            expect(screen.getByTestId('pos-pix-qr-view')).toBeInTheDocument();
        });
    });
});
