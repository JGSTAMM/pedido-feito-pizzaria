import React from 'react';
import { createPortal } from 'react-dom';
import { usePage } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';

/**
 * Pizza Symbol SVG Component
 */
const PizzaSymbol = ({ type, size = 16 }) => {
    const strokeWidth = 2;
    const color = 'black';
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="inline-block align-middle mr-1" style={{ flexShrink: 0 }}>
            {type !== 4 && <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth={strokeWidth} />}
            {type === 1 && <circle cx="12" cy="12" r="2" fill={color} />}
            {type === 2 && <line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth={strokeWidth} />}
            {type === 3 && (
                <>
                    <line x1="12" y1="12" x2="12" y2="2" stroke={color} strokeWidth={strokeWidth} />
                    <line x1="12" y1="12" x2="20.66" y2="17" stroke={color} strokeWidth={strokeWidth} />
                    <line x1="12" y1="12" x2="3.34" y2="17" stroke={color} strokeWidth={strokeWidth} />
                </>
            )}
            {type === 4 && <path d="M2,12 A10,10 0 0,1 22,12 Z" fill="none" stroke={color} strokeWidth={strokeWidth} />}
        </svg>
    );
};

export default function ReceiptPrint({ order, paperWidth: propPaperWidth }) {
    const { storeSetting } = usePage().props;
    const { formatCurrency, locale } = useI18n();
    if (!order) return null;

    const resolvedPaperWidth = propPaperWidth || (
        typeof window !== 'undefined'
            ? window.localStorage.getItem('thermal_paper_width') || '58mm'
            : '58mm'
    );
    const is58mm = resolvedPaperWidth === '58mm';
    const pageWidth = is58mm ? '58mm' : '80mm';
    const contentWidth = is58mm ? '48mm' : '72mm';

    const header1 = storeSetting?.receipt_header_1 || storeSetting?.store_name || 'PEDIDO FEITO';
    const header2 = storeSetting?.receipt_header_2 || '';
    const footerMsg = storeSetting?.receipt_footer || '';

    const datePart = new Intl.DateTimeFormat(locale).format(new Date());
    const timePart = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date());

    const rawTableName = order.table_name ? String(order.table_name).trim() : '';
    const tableHeading = rawTableName
        ? (/^mesa\b/i.test(rawTableName) ? rawTableName.toUpperCase() : `MESA: ${rawTableName.toUpperCase()}`)
        : 'PEDIDO BALCÃO';

    const content = (
        <div
            className={`print-receipt-portal hidden print:block font-mono bg-white text-black m-0 box-border leading-tight ${
                is58mm ? 'text-[10px]' : 'text-[11px]'
            }`}
            style={{ width: contentWidth, maxWidth: contentWidth, padding: is58mm ? '0 1mm' : '0 2mm' }}
        >
            {/* Header */}
            <div className="text-center border-b border-black border-dashed pb-2 mb-2">
                <h2 className={`font-black uppercase mb-0.5 ${is58mm ? 'text-base' : 'text-lg'}`}>{header1}</h2>
                {header2 && <p className="text-[9px] uppercase font-bold">{header2}</p>}
                {storeSetting?.receipt_show_cnpj && storeSetting?.cnpj && (
                    <p className="text-[9px] uppercase font-bold">CNPJ: {storeSetting.cnpj}</p>
                )}
                <p className="text-[9px] mt-1">{datePart} {timePart}</p>
            </div>

            {/* Order Ident */}
            <div className="text-center mb-2">
                <h3 className={`font-black ${is58mm ? 'text-sm' : 'text-base'}`}>
                    {tableHeading}
                </h3>
                <p className="border border-black inline-block px-3 py-0.5 font-black text-sm mt-1">
                    #{order.short_code || String(order.id).substring(0, 5).toUpperCase()}
                </p>
                {order.customer_name && (
                    <p className="mt-1 font-bold text-[10px] uppercase break-words">{order.customer_name}</p>
                )}
            </div>

            <div className="border-b border-black border-dashed mb-2"></div>

            {/* Items */}
            <table className={`w-full text-left mb-2 table-fixed ${is58mm ? 'text-[9px]' : 'text-[10px]'}`}>
                <thead>
                    <tr className="border-b border-black pb-1">
                        <th className="font-black w-7">QTD</th>
                        <th className="font-black">ITEM</th>
                        <th className="font-black text-right w-16">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items?.map((item, index) => {
                        const isPizza = Boolean(item.is_pizza);
                        const flavorNames = Array.isArray(item.flavor_names) ? item.flavor_names.filter(Boolean) : [];
                        const flavorsCount = flavorNames.length;
                        let symbolType = null;
                        if (isPizza) {
                            const sizeHint = `${item.size_name || ''} ${item.name || ''}`.toLowerCase();
                            if (sizeHint.includes('broto')) symbolType = 4;
                            else if (flavorsCount === 3) symbolType = 3;
                            else if (flavorsCount === 2) symbolType = 2;
                            else symbolType = 1;
                        }

                        let displayTitle = item.name;
                        if (isPizza && flavorsCount > 0) {
                            const rawSize = String(item.size_name || String(item.name || '').split('—')[0] || 'GRANDE')
                                .replace(/^pizza\s+/i, '')
                                .trim()
                                .toUpperCase() || 'GRANDE';

                            if (flavorsCount === 1) {
                                displayTitle = `PIZZA ${rawSize}`;
                            } else if (flavorsCount === 2) {
                                displayTitle = `PIZZA ${rawSize} - MEIA`;
                            } else {
                                displayTitle = `PIZZA ${rawSize} - ${flavorsCount} SABORES`;
                            }
                        }

                        return (
                            <tr key={index} className="align-top border-b border-black/10">
                                <td className="py-1 font-black">{item.quantity}</td>
                                <td className="py-1 pr-1 break-words" style={{ overflowWrap: 'anywhere' }}>
                                    <div className="flex items-center flex-wrap">
                                        {symbolType && <PizzaSymbol type={symbolType} size={12} />}
                                        <span className="font-bold uppercase leading-tight">{displayTitle}</span>
                                    </div>
                                    {isPizza && flavorsCount > 0 && (
                                        <div className="text-[9px] font-bold mt-0.5 pl-1 leading-tight uppercase">
                                            {flavorNames.map((f, i) => (
                                                <div key={i}>
                                                    {flavorsCount > 1 ? `• 1/${flavorsCount} ${f}` : `• ${f}`}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {item.notes && (
                                        <div className="text-[10px] mt-1 pl-1.5 border-l-2 border-black font-black text-black leading-snug uppercase break-words">
                                            {item.notes.split('|').map((note, idx) => {
                                                const cleanNote = String(note || '')
                                                    .replace(/^[⚠️❌]\s*/u, '')
                                                    .replace(/^obs:\s*/i, '')
                                                    .trim();
                                                return cleanNote ? (
                                                    <div key={idx}>&gt;&gt; {cleanNote}</div>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </td>
                                <td className="py-1 text-right font-bold whitespace-nowrap">
                                    {formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="border-b border-black border-dashed mb-2"></div>

            {/* Totals */}
            <div className="space-y-1 mb-3">
                <div className="flex justify-between font-black text-xs uppercase">
                    <span>TOTAL</span>
                    <span>{formatCurrency(order.total)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[9px] mt-3 border-t border-black border-dashed pt-2 pb-1 space-y-1">
                <p className="font-bold uppercase tracking-wider italic">Conferência de Mesa</p>
                <p className="font-bold text-black italic">*** NÃO É DOCUMENTO FISCAL ***</p>
                {footerMsg && <p className="mt-2 whitespace-pre-wrap leading-tight">{footerMsg}</p>}
            </div>

            <style>
                {`
                    @media print {
                        @page {
                            margin: 0;
                            size: ${pageWidth} auto;
                        }
                        html, body {
                            background: #ffffff !important;
                            background-color: #ffffff !important;
                            color: #000000 !important;
                            height: auto !important;
                            min-height: 0 !important;
                            width: ${pageWidth} !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            overflow: visible !important;
                        }
                        body > *:not(.print-receipt-portal) {
                            display: none !important;
                        }
                        .print-receipt-portal {
                            display: block !important;
                            position: static !important;
                            width: ${contentWidth} !important;
                            max-width: ${contentWidth} !important;
                            background: #ffffff !important;
                            color: #000000 !important;
                            margin: 0 !important;
                            padding: 0 ${is58mm ? '1mm' : '2mm'} !important;
                            box-sizing: border-box !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .print-receipt-portal * {
                            color: #000000 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                `}
            </style>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}
