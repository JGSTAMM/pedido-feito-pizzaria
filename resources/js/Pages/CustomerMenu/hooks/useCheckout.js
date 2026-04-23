import { router } from '@inertiajs/react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { submitOrder } from '../services/customerMenuApi';

const INITIAL_FORM_VALUES = {
    customerName: '',
    customerPhone: '',
    payerEmail: '',
    deliveryAddress: '',
    deliveryComplement: '',
    neighborhoodId: '',
    customNeighborhood: '',
    tableId: '',
    tableCode: '',
    paymentMethod: 'pix',
    fulfillmentType: 'pickup',
    cardToken: null,
    installments: 1,
};

function mapCartItemsToPayload(items) {
    return items.map((item) => {
        const isPizza = item.type === 'pizza';

        let flavorIds = [];
        if (isPizza) {
            if (Array.isArray(item.flavor_instances) && item.flavor_instances.length > 0) {
                flavorIds = item.flavor_instances.map((inst) => inst.flavorId).filter(Boolean);
            } else if (Array.isArray(item.flavorIds)) {
                flavorIds = item.flavorIds;
            } else if (Array.isArray(item.flavor_ids)) {
                flavorIds = item.flavor_ids;
            }
        }

        return {
            type: isPizza ? 'pizza' : 'product',
            product_id: isPizza ? undefined : item.id,
            pizza_size_id: isPizza ? (item.pizza_size_id ?? item.pizzaSizeId ?? null) : undefined,
            flavor_ids: isPizza ? flavorIds : undefined,
            quantity: item.quantity,
            notes: item.notes || undefined,
            description: item.description || undefined,
        };
    });
}

function getInitialFormValues(initialValues) {
    const vals = { ...INITIAL_FORM_VALUES };
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('customerIdentity');
        if (stored) {
            try {
                const identity = JSON.parse(stored);
                if (identity.name) vals.customerName = identity.name;
                if (identity.phone) vals.customerPhone = identity.phone;
            } catch (e) {
                console.error('Error parsing customer identity', e);
            }
        }
    }
    return { ...vals, ...initialValues };
}

export function useCheckout({ items, clearCart, t, initialValues = {} }) {
    const [formValues, setFormValues] = useState(() => getInitialFormValues(initialValues));
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isCartEmpty = useMemo(() => items.length === 0, [items]);

    const updateField = (fieldName, value) => {
        setFormValues((currentState) => {
            const next = { ...currentState, [fieldName]: value };
            // Reset card token when switching away from credit_card
            if (fieldName === 'paymentMethod' && value !== 'credit_card') {
                next.cardToken = null;
            }
            return next;
        });

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

        if (!formValues.customerName?.trim()) {
            nextErrors.customerName = t('digital_menu.checkout.errors.customer_name_required');
        }

        if (!formValues.customerPhone?.trim()) {
            nextErrors.customerPhone = t('digital_menu.checkout.errors.customer_phone_required');
        }

        if (formValues.fulfillmentType === 'delivery') {
            if (!formValues.deliveryAddress?.trim()) {
                nextErrors.deliveryAddress = t('digital_menu.checkout.errors.delivery_address_required');
            }
            if (!formValues.neighborhoodId) {
                nextErrors.neighborhoodId = t('digital_menu.checkout.errors.validation_failed');
            } else if (formValues.neighborhoodId === 'custom' && !formValues.customNeighborhood?.trim()) {
                nextErrors.customNeighborhood = t('digital_menu.checkout.errors.validation_failed');
            }
        }

        if (formValues.fulfillmentType === 'dine_in') {
            if (!formValues.tableId && !formValues.tableCode?.trim()) {
                nextErrors.tableCode = t('digital_menu.checkout.errors.validation_failed');
            }
        }

        if (!formValues.paymentMethod?.trim()) {
            nextErrors.paymentMethod = t('digital_menu.checkout.errors.payment_method_required');
        }

        setFieldErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleCreditCardToken = useCallback((cardData) => {
        setFormValues(prev => ({
            ...prev,
            cardToken: cardData.token,
            installments: cardData.installments
        }));
    }, []);

    const handleCreditCardError = useCallback((err) => {
        setIsSubmitting(false);
        setSubmitError(t('digital_menu.checkout.errors.card_token_error') || 'Verifique os dados do cartão e tente novamente.');
        console.error('Credit card tokenization error:', err);
    }, [t]);

    const performSubmit = async (finalValues) => {
        try {
            const payload = {
                customer_name: finalValues.customerName.trim(),
                customer_phone: finalValues.customerPhone.trim(),
                payer_email: finalValues.payerEmail.trim(),
                payment_method: finalValues.paymentMethod,
                type: finalValues.fulfillmentType || 'pickup',
                items: mapCartItemsToPayload(items),
            };

            // Only include card fields for credit_card
            if (finalValues.paymentMethod === 'credit_card') {
                payload.card_token = finalValues.cardToken;
                payload.installments = 1;
            }

            if (payload.type === 'delivery') {
                payload.delivery_address = finalValues.deliveryAddress.trim();
                payload.delivery_complement = finalValues.deliveryComplement?.trim() || '';

                if (finalValues.neighborhoodId === 'custom') {
                    payload.neighborhood_id = null;
                    payload.custom_neighborhood = finalValues.customNeighborhood?.trim() || '';
                } else {
                    payload.neighborhood_id = finalValues.neighborhoodId;
                    payload.custom_neighborhood = null;
                }
            }

            if (payload.type === 'dine_in') {
                payload.table_id = finalValues.tableId || null;
            }

            const response = await submitOrder(payload);

            if (!response?.success || !response?.order_id) {
                setSubmitError(response?.error || t('digital_menu.checkout.errors.submit_failed'));
                setIsSubmitting(false);
                return;
            }

            clearCart();
            router.visit(`/menu/order/${response.order_id}/status`);
        } catch (error) {
            const serverError = error?.response?.data?.error;
            if (error?.response?.status === 422) {
                setSubmitError(t('digital_menu.checkout.errors.validation_failed'));
            } else if (serverError) {
                setSubmitError(serverError);
            } else {
                setSubmitError(t('digital_menu.checkout.errors.submit_failed'));
            }
            setIsSubmitting(false);
        }
    };

    // Effect to handle submission after tokenization
    useEffect(() => {
        if (formValues.cardToken && formValues.paymentMethod === 'credit_card' && isSubmitting) {
            performSubmit(formValues);
        }
    }, [formValues.cardToken]);

    const handleSubmit = async (event) => {
        if (event) event.preventDefault();
        setSubmitError('');

        if (isCartEmpty) {
            setSubmitError(t('digital_menu.checkout.errors.empty_cart'));
            return;
        }

        if (!validate()) {
            setTimeout(() => {
                const firstError = document.querySelector('[aria-invalid="true"]');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
            }, 100);
            return;
        }

        // If Credit Card and no token yet, trigger SDK tokenization
        if (formValues.paymentMethod === 'credit_card' && !formValues.cardToken) {
            if (window.submitMPCardForm) {
                setIsSubmitting(true);
                window.submitMPCardForm();

                // Timeout de fail-safe caso o SDK fique mudo após o clique
                setTimeout(() => {
                    setIsSubmitting((current) => {
                        if (current) {
                            setSubmitError(t('digital_menu.checkout.errors.token_timeout') || 'O processamento do cartão demorou demais. Verifique os dados e tente novamente.');
                            return false;
                        }
                        return current;
                    });
                }, 15000);
            } else {
                setSubmitError(t('digital_menu.checkout.errors.card_token_required'));
            }
            return;
        }

        setIsSubmitting(true);
        performSubmit(formValues);
    };

    return {
        formValues,
        fieldErrors,
        submitError,
        isSubmitting,
        isCartEmpty,
        updateField,
        handleSubmit,
        handleCreditCardToken,
        handleCreditCardError,
    };
}
