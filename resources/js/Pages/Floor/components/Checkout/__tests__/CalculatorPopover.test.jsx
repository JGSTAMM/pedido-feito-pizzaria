import { fireEvent, render, screen } from '@testing-library/react';
import CalculatorPopover, { evaluateExpression } from '../CalculatorPopover';

vi.mock('@/hooks/useI18n', () => ({
    default: () => ({
        t: (key) => key,
    }),
}));

describe('CalculatorPopover', () => {
    it('evaluates arithmetic expressions safely with operator precedence', () => {
        expect(evaluateExpression('2+3*4')).toBe(14);
        expect(evaluateExpression('0.1+0.2')).toBe(0.3);
        expect(evaluateExpression('150/3')).toBe(50);
        expect(evaluateExpression('10/0')).toBeNull();
    });

    it('renders calculator dialog into document.body portal outside overflow-hidden containers', () => {
        render(
            <div data-testid="clipped-parent" className="overflow-hidden">
                <CalculatorPopover />
            </div>
        );

        const trigger = screen.getByRole('button', { name: 'floor.drawer.checkout.calculator_open' });
        fireEvent.click(trigger);

        const dialog = screen.getByRole('dialog', { name: 'floor.drawer.checkout.calculator_title' });
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveClass('fixed');
        expect(screen.getByTestId('clipped-parent')).not.toContainElement(dialog);
        expect(document.body).toContainElement(dialog);
    });

    it('performs calculations, backspace, clear, and closes on backdrop or Escape', () => {
        render(<CalculatorPopover />);

        fireEvent.click(screen.getByRole('button', { name: 'floor.drawer.checkout.calculator_open' }));

        fireEvent.click(screen.getByRole('button', { name: '1' }));
        fireEvent.click(screen.getByRole('button', { name: '5' }));
        fireEvent.click(screen.getByRole('button', { name: '0' }));
        fireEvent.click(screen.getByRole('button', { name: '÷' }));
        fireEvent.click(screen.getByRole('button', { name: '3' }));
        fireEvent.click(screen.getByRole('button', { name: '=' }));

        expect(screen.getByTestId('calculator-display')).toHaveTextContent('50');

        fireEvent.click(screen.getByRole('button', { name: 'Backspace' }));
        expect(screen.getByTestId('calculator-display')).toHaveTextContent('0');

        // Division by zero shows Error
        fireEvent.click(screen.getByRole('button', { name: '8' }));
        fireEvent.click(screen.getByRole('button', { name: '÷' }));
        fireEvent.click(screen.getByRole('button', { name: '0' }));
        fireEvent.click(screen.getByRole('button', { name: '=' }));
        expect(screen.getByTestId('calculator-display')).toHaveTextContent('Error');

        fireEvent.click(screen.getByRole('button', { name: 'C' }));
        expect(screen.getByTestId('calculator-display')).toHaveTextContent('0');

        // Closes on Escape
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        // Reopens and closes on backdrop click
        fireEvent.click(screen.getByRole('button', { name: 'floor.drawer.checkout.calculator_open' }));
        fireEvent.click(screen.getByTestId('calculator-backdrop'));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
