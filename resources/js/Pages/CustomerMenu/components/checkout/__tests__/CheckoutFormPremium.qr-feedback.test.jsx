import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CheckoutFormPremium from '../CheckoutFormPremium';

vi.mock('@/hooks/useI18n', () => ({
    default: () => ({
        t: (key) => key,
    }),
}));

describe('CheckoutFormPremium QR feedback', () => {
    const baseProps = {
        formValues: {
            fulfillmentType: 'dine_in',
            customerName: '',
            customerPhone: '',
            payerEmail: '',
            neighborhoodId: '',
            deliveryAddress: '',
            deliveryComplement: '',
            tableCode: '',
            tableId: '',
            paymentMethod: 'pix',
        },
        fieldErrors: {},
        submitError: '',
        isCatalogLoading: false,
        catalogLoadFailed: false,
        retryLoadCatalog: vi.fn(),
        updateField: vi.fn(),
        setFulfillmentType: vi.fn(),
        neighborhoods: [],
        tables: [{ id: 'table-1', name: 'mesa-01', status: 'available' }],
        handleSubmit: (event) => event.preventDefault(),
    };

    beforeEach(() => {
        const fakeTrack = { stop: vi.fn() };
        const fakeStream = { getTracks: () => [fakeTrack] };

        Object.defineProperty(window.navigator, 'mediaDevices', {
            value: {
                getUserMedia: vi.fn().mockResolvedValue(fakeStream),
            },
            configurable: true,
        });

        vi.stubGlobal('BarcodeDetector', class {
            async detect() {
                return [{ rawValue: 'https://example.com/menu/checkout?table=mesa-01' }];
            }
        });

        HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('shows success feedback and fills table fields after QR detection', async () => {
        const updateField = vi.fn();

        render(<CheckoutFormPremium {...baseProps} updateField={updateField} />);

        fireEvent.click(screen.getByRole('button', { name: 'digital_menu.checkout.table_qr.scan_button' }));

        await waitFor(() => {
            expect(updateField).toHaveBeenCalledWith('tableCode', 'mesa-01');
            expect(updateField).toHaveBeenCalledWith('tableId', 'table-1');
        });

        expect(screen.getByText('digital_menu.checkout.table_qr.scan_success')).toBeInTheDocument();
    });

    it('shows error feedback when browser does not support barcode detector', async () => {
        delete window.BarcodeDetector;

        render(<CheckoutFormPremium {...baseProps} />);

        fireEvent.click(screen.getByRole('button', { name: 'digital_menu.checkout.table_qr.scan_button' }));

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('digital_menu.checkout.table_qr.scanner_unavailable');
        });
    });
});
