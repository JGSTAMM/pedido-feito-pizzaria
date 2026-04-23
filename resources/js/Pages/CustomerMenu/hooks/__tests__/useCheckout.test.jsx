import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCheckout } from '../useCheckout';

// Mock @inertiajs/react router
vi.mock('@inertiajs/react', () => ({
    router: { visit: vi.fn() },
}));

// Mock the submitOrder API
vi.mock('../../services/customerMenuApi', () => ({
    submitOrder: vi.fn(),
}));

import { submitOrder } from '../../services/customerMenuApi';
import { router } from '@inertiajs/react';

const tMock = (key) => key;
const clearCartMock = vi.fn();
const defaultItems = [{ id: 1, name: 'Pizza', price: 50, quantity: 2 }];

function renderCheckout(items = defaultItems) {
    return renderHook(() =>
        useCheckout({ items, clearCart: clearCartMock, t: tMock })
    );
}

describe('useCheckout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with empty form values', () => {
        const { result } = renderCheckout();
        expect(result.current.formValues.customerName).toBe('');
        expect(result.current.formValues.paymentMethod).toBe('pix');
        expect(result.current.isSubmitting).toBe(false);
        expect(result.current.fieldErrors).toEqual({});
    });

    it('updates a field value and clears its error', () => {
        const { result } = renderCheckout();

        act(() => {
            result.current.updateField('customerName', 'João');
        });

        expect(result.current.formValues.customerName).toBe('João');
    });

    it('isCartEmpty is true when no items', () => {
        const { result } = renderCheckout([]);
        expect(result.current.isCartEmpty).toBe(true);
    });

    it('isCartEmpty is false with items', () => {
        const { result } = renderCheckout(defaultItems);
        expect(result.current.isCartEmpty).toBe(false);
    });

    it('shows validation errors when submitting with empty required fields', async () => {
        const { result } = renderCheckout();
        const fakeEvent = { preventDefault: vi.fn() };

        act(() => {
            result.current.updateField('fulfillmentType', 'delivery');
        });

        await act(async () => {
            await result.current.handleSubmit(fakeEvent);
        });

        expect(result.current.fieldErrors.customerName).toBeTruthy();
        expect(result.current.fieldErrors.customerPhone).toBeTruthy();
        expect(result.current.fieldErrors.deliveryAddress).toBeTruthy();
        expect(submitOrder).not.toHaveBeenCalled();
    });

    it('submits order successfully and redirects', async () => {
        submitOrder.mockResolvedValueOnce({ success: true, order_id: 42 });

        const { result } = renderCheckout();
        const fakeEvent = { preventDefault: vi.fn() };

        act(() => {
            result.current.updateField('customerName', 'João Silva');
            result.current.updateField('customerPhone', '11999999999');
            result.current.updateField('payerEmail', 'joao@email.com');
            result.current.updateField('paymentMethod', 'pix');
            result.current.updateField('fulfillmentType', 'pickup');
        });

        await act(async () => {
            await result.current.handleSubmit(fakeEvent);
        });

        expect(submitOrder).toHaveBeenCalledWith(
            expect.objectContaining({
                customer_name: 'João Silva',
                customer_phone: '11999999999',
                payment_method: 'pix',
                type: 'pickup',
            })
        );
        expect(clearCartMock).toHaveBeenCalled();
        expect(router.visit).toHaveBeenCalledWith('/menu/order/42/status');
    });

    it('shows error message on API failure', async () => {
        submitOrder.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderCheckout();
        const fakeEvent = { preventDefault: vi.fn() };

        act(() => {
            result.current.updateField('customerName', 'João Silva');
            result.current.updateField('customerPhone', '11999999999');
            result.current.updateField('payerEmail', 'joao@email.com');
            result.current.updateField('paymentMethod', 'pix');
        });

        await act(async () => {
            await result.current.handleSubmit(fakeEvent);
        });

        expect(result.current.submitError).toBeTruthy();
        expect(result.current.isSubmitting).toBe(false);
    });
});
