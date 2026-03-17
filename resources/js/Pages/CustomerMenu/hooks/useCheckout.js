import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { submitOrder } from '../services/customerMenuApi';

const INITIAL_FORM_VALUES = {
    customerName: '',
    customerPhone: '',
    payerEmail: '',
    deliveryAddress: '',
    paymentMethod: 'pix',
};

function mapCartItemsToPayload(items) {
    return items.map((item) => ({
        type: 'product',
        product_id: item.id,
        quantity: item.quantity,
    }));
}

export function useCheckout({ items, clearCart, t }) {
    const [formValues, setFormValues] = useState(INITIAL_FORM_VALUES);
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isCartEmpty = useMemo(() => items.length === 0, [items]);

    const updateField = (fieldName, value) => {
        setFormValues((currentState) => ({
            ...currentState,
            [fieldName]: value,
        }));

        setFieldErrors((currentErrors) => {
            if (!currentErrors[fieldName]) {
                return currentErrors;
            }

            const nextErrors = { ...currentErrors };
            delete nextErrors[fieldName];
            return nextErrors;
        });

        if (submitError) {
            setSubmitError('');
        }
    };

    const validate = () => {
        const nextErrors = {};

        if (!formValues.customerName.trim()) {
            nextErrors.customerName = t('digital_menu.checkout.errors.customer_name_required');
        }

        if (!formValues.customerPhone.trim()) {
            nextErrors.customerPhone = t('digital_menu.checkout.errors.customer_phone_required');
        }

        if (!formValues.deliveryAddress.trim()) {
            nextErrors.deliveryAddress = t('digital_menu.checkout.errors.delivery_address_required');
        }

        if (!formValues.paymentMethod.trim()) {
            nextErrors.paymentMethod = t('digital_menu.checkout.errors.payment_method_required');
        }

        if (!formValues.payerEmail.trim()) {
            nextErrors.payerEmail = t('digital_menu.checkout.errors.payer_email_required');
        }

        setFieldErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitError('');

        if (isCartEmpty) {
            setSubmitError(t('digital_menu.checkout.errors.empty_cart'));
            return;
        }

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                customer_name: formValues.customerName.trim(),
                customer_phone: formValues.customerPhone.trim(),
                payer_email: formValues.payerEmail.trim(),
                delivery_address: formValues.deliveryAddress.trim(),
                payment_method: formValues.paymentMethod,
                type: 'pickup',
                items: mapCartItemsToPayload(items),
            };

            const response = await submitOrder(payload);

            if (!response?.success || !response?.order_id) {
                setSubmitError(t('digital_menu.checkout.errors.submit_failed'));
                return;
            }

            clearCart();
            router.visit(`/menu/order/${response.order_id}/status`);
        } catch (error) {
            if (error?.response?.status === 422) {
                setSubmitError(t('digital_menu.checkout.errors.validation_failed'));
            } else {
                setSubmitError(t('digital_menu.checkout.errors.submit_failed'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        formValues,
        fieldErrors,
        submitError,
        isSubmitting,
        isCartEmpty,
        updateField,
        handleSubmit,
    };
}
