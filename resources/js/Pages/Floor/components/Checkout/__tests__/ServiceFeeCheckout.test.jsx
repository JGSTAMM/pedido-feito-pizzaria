import { fireEvent, render, screen } from '@testing-library/react';
import ServiceFeeToggle from '../ServiceFeeToggle';
import { useCheckoutMath } from '../../../hooks/useCheckoutMath';

vi.mock('@/hooks/useI18n', () => ({
    default: () => ({
        t: (key) => key,
        formatCurrency: (val) => `R$ ${Number(val || 0).toFixed(2)}`,
    }),
}));

function ServiceFeeHarness({ total = 100 }) {
    const {
        serviceFeeEnabled,
        setServiceFeeEnabled,
        serviceFeeMode,
        serviceFeeValue,
        setServiceFeeValue,
        changeServiceFeeMode,
        selectServiceFeePreset,
        serviceFeeAmount,
        grandTotal,
    } = useCheckoutMath({ activeOrders: [{ total }] });

    return (
        <div>
            <span data-testid="fee-amount">{serviceFeeAmount.toFixed(2)}</span>
            <span data-testid="grand-total">{grandTotal.toFixed(2)}</span>
            <ServiceFeeToggle
                serviceFeeEnabled={serviceFeeEnabled}
                setServiceFeeEnabled={setServiceFeeEnabled}
                serviceFeeMode={serviceFeeMode}
                serviceFeeValue={serviceFeeValue}
                setServiceFeeValue={setServiceFeeValue}
                changeServiceFeeMode={changeServiceFeeMode}
                selectServiceFeePreset={selectServiceFeePreset}
                serviceFeeAmount={serviceFeeAmount}
                formatCurrency={(v) => `R$ ${Number(v || 0).toFixed(2)}`}
            />
        </div>
    );
}

describe('Customizable Service Fee Checkout', () => {
    it('defaults to 10% and allows presets above 10%', () => {
        render(<ServiceFeeHarness total={100} />);

        expect(screen.getByTestId('fee-amount')).toHaveTextContent('10.00');
        expect(screen.getByTestId('grand-total')).toHaveTextContent('110.00');

        fireEvent.click(screen.getByRole('button', { name: '15%' }));

        expect(screen.getByTestId('fee-amount')).toHaveTextContent('15.00');
        expect(screen.getByTestId('grand-total')).toHaveTextContent('115.00');
    });

    it('supports custom percentage and fixed BRL (R$) service fee amounts', () => {
        render(<ServiceFeeHarness total={100} />);

        const percentInput = screen.getByLabelText('floor.drawer.checkout.service_fee_percent_label');
        fireEvent.change(percentInput, { target: { value: '20' } });

        expect(screen.getByTestId('fee-amount')).toHaveTextContent('20.00');
        expect(screen.getByTestId('grand-total')).toHaveTextContent('120.00');

        // Switching to R$ preserves the current BRL equivalent (20.00) and allows custom BRL values
        fireEvent.click(screen.getByRole('button', { name: 'R$' }));

        const brlInput = screen.getByLabelText('floor.drawer.checkout.service_fee_amount_label');
        expect(brlInput).toHaveValue(20);

        fireEvent.change(brlInput, { target: { value: '35.5' } });
        expect(screen.getByTestId('fee-amount')).toHaveTextContent('35.50');
        expect(screen.getByTestId('grand-total')).toHaveTextContent('135.50');
    });

    it('toggles service fee off to 0 and restores customized value when turned back on', () => {
        render(<ServiceFeeHarness total={100} />);

        fireEvent.click(screen.getByRole('button', { name: '12%' }));
        expect(screen.getByTestId('fee-amount')).toHaveTextContent('12.00');

        const switchBtn = screen.getByRole('button', { name: 'floor.drawer.checkout.service_fee' });
        fireEvent.click(switchBtn);

        expect(screen.getByTestId('fee-amount')).toHaveTextContent('0.00');
        expect(screen.getByTestId('grand-total')).toHaveTextContent('100.00');
        expect(screen.getByText('floor.drawer.checkout.removed')).toBeInTheDocument();

        fireEvent.click(switchBtn);
        expect(screen.getByTestId('fee-amount')).toHaveTextContent('12.00');
        expect(screen.getByTestId('grand-total')).toHaveTextContent('112.00');
    });
});
