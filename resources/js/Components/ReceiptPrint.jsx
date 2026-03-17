import React from 'react';

import { usePage } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';

// Estilos de impressão injetados globalmente ou via classe isolada para afetar apenas este componente
export default function ReceiptPrint({ order }) {
    const { storeSetting } = usePage().props;
    const { t, formatCurrency, locale } = useI18n();
    if (!order) return null;

    const header1 =
        storeSetting?.receipt_header_1 ||
        storeSetting?.store_name ||
        t('receipt.customer.headerLine1Fallback');
    const header2 = storeSetting?.receipt_header_2 || t('receipt.customer.headerLine2Fallback');
    const footerMsg = storeSetting?.receipt_footer || t('receipt.customer.footerMessageFallback');
    const showCnpj = storeSetting?.receipt_show_cnpj ?? true;
    const isNamedCustomer =
        order.customer_name && order.customer_name !== t('receipt.fallback.defaultCustomerName');
    const datePart = new Intl.DateTimeFormat(locale).format(new Date());
    const timePart = new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date());

    return (
        <div className="hidden print:block font-mono bg-white text-black p-0 m-0 w-[80mm] leading-snug">
            {/* Cabecalho */}
            <div className="text-center mb-4 border-b border-black pb-2 border-dashed">
                <h2 className="text-xl font-bold uppercase tracking-widest mb-1">{header1}</h2>
                <p className="text-[10px] uppercase font-bold">{header2}</p>
                {showCnpj && storeSetting?.cnpj && (
                    <p className="text-[10px] uppercase font-bold mt-0.5">
                        {t('receipt.shared.cnpjLabel')}: {storeSetting.cnpj}
                    </p>
                )}
                <p className="text-[10px] mt-1">
                    {datePart} {timePart}
                </p>
            </div>

            {/* Identificacao do Pedido */}
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold mb-1">
                    {order.table_name
                        ? t('receipt.shared.tableLabelWithValue', { table: order.table_name })
                        : t('receipt.customer.counterOrderTitle')}
                </h3>
                <p className="border border-black inline-block px-3 py-1 font-bold text-sm tracking-widest">
                    #{order.short_code || String(order.id).substring(0, 5).toUpperCase()}
                </p>
                {isNamedCustomer && (
                    <p className="mt-2 font-bold text-sm uppercase">
                        {t('receipt.customer.customerLineWithName', { name: order.customer_name })}
                    </p>
                )}
            </div>

            <div className="border-b border-black border-dashed mb-2"></div>

            {/* Itens */}
            <table className="w-full text-left mb-2 text-[11px]">
                <thead>
                    <tr className="border-b border-black border-dashed">
                        <th className="py-1 w-8 font-bold">{t('receipt.shared.quantityShort')}</th>
                        <th className="py-1 font-bold">{t('receipt.shared.itemLabel')}</th>
                        <th className="py-1 text-right font-bold w-12">{t('receipt.shared.totalLabel')}</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items?.map((item, index) => (
                        <tr key={index}>
                            <td className="py-1 align-top pt-1 text-center font-bold">{item.quantity}</td>
                            <td className="py-1 align-top pt-1">
                                <span className="font-bold">{item.name}</span>
                                {item.is_pizza && item.flavor_names?.length > 0 && (
                                    <div className="text-[9px] mt-0.5 leading-tight pl-1">
                                        {t('receipt.shared.flavorsLabel')}: {item.flavor_names.join(', ')}
                                    </div>
                                )}
                                {item.notes && (
                                    <div className="text-[9px] mt-0.5 leading-tight pl-1 font-bold uppercase">
                                        {t('receipt.shared.notesLabel')}: {item.notes}
                                    </div>
                                )}
                            </td>
                            <td className="py-1 align-top pt-1 text-right">
                                {formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-b border-black border-dashed mb-2"></div>

            {/* Totalizadores */}
            <div className="flex justify-between items-center text-sm font-black uppercase mb-4">
                <span>{t('receipt.customer.totalToPay')}</span>
                <span className="text-base">{formatCurrency(order.total)}</span>
            </div>

            {/* Rodapé */}
            <div className="text-center text-[10px] mt-6 pt-4 border-t border-black border-dashed space-y-1">
                <p className="font-bold uppercase tracking-widest">{t('receipt.customer.tableConferenceTitle')}</p>
                <p>{t('receipt.shared.notFiscalDocument')}</p>
                {footerMsg && <p className="mt-2 text-[10px] !mt-4 whitespace-pre-wrap leading-tight">{footerMsg}</p>}
            </div>

            {/* Estilo Global exclusivo para Impressão */}
            <style>
                {`
                    @media print {
                        @page {
                            margin: 0;
                            size: 80mm auto;
                        }
                        body * {
                            visibility: hidden;
                        }
                        .print\\:block, .print\\:block * {
                            visibility: visible;
                        }
                        .print\\:block {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 80mm !important;
                            margin: 0;
                            padding: 0;
                            font-size: 11px;
                        }
                    }
                `}
            </style>
        </div>
    );
}
