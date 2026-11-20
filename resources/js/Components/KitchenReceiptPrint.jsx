import React from 'react';
import { createPortal } from 'react-dom';
import useI18n from '@/hooks/useI18n';

/**
 * Pizza Symbol SVG Component
 * Renders high-contrast B&W symbols for pizza configurations
 */
const PizzaSymbol = ({ type, size = 24 }) => {
    // type: 1 (inteira), 2 (meia), 3 (3-sabores), 4 (broto)
    const strokeWidth = 2;
    const color = 'black';

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="inline-block align-middle mr-1" style={{ flexShrink: 0 }}>
            {/* Base Circle */}
            {type !== 4 && <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth={strokeWidth} />}

            {/* Inteira (1 sabor) - Full circle with center dot */}
            {type === 1 && <circle cx="12" cy="12" r="2" fill={color} />}

            {/* Meio a Meio (2 sabores) - Vertical line */}
            {type === 2 && <line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth={strokeWidth} />}

            {/* 3 Sabores (Mercedes) */}
            {type === 3 && (
                <>
                    <line x1="12" y1="12" x2="12" y2="2" stroke={color} strokeWidth={strokeWidth} />
                    <line x1="12" y1="12" x2="20.66" y2="17" stroke={color} strokeWidth={strokeWidth} />
                    <line x1="12" y1="12" x2="3.34" y2="17" stroke={color} strokeWidth={strokeWidth} />
                </>
            )}

            {/* Broto (Semicircle) */}
            {type === 4 && <path d="M2,12 A10,10 0 0,1 22,12 Z" fill="none" stroke={color} strokeWidth={strokeWidth} />}
        </svg>
    );
};

export default function KitchenReceiptPrint({ order, paperWidth: propPaperWidth }) {
    const { locale } = useI18n();
    if (!order) return null;

    const resolvedPaperWidth = propPaperWidth || (
        typeof window !== 'undefined'
            ? window.localStorage.getItem('thermal_paper_width') || '58mm'
            : '58mm'
    );
    const is58mm = resolvedPaperWidth === '58mm';
    const pageWidth = is58mm ? '58mm' : '80mm';
    const contentWidth = is58mm ? '48mm' : '72mm';

    // Filter kitchen items: comanda de cozinha never prints beverages
    const kitchenItems = (order.items || []).filter((item) => !item.is_beverage);

    // If order has no kitchen items (e.g. order with only drinks), skip printing comanda entirely
    if (kitchenItems.length === 0) return null;

    const productionTime = new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date());

    const rawTableName = order.table_name ? String(order.table_name).trim() : '';
    const tableLabel = rawTableName
        ? (/^mesa\b/i.test(rawTableName) ? rawTableName.toUpperCase() : `MESA ${rawTableName.toUpperCase()}`)
        : 'BALCÃO';

    const content = (
        <div
            className={`print-receipt-portal hidden print:block font-mono bg-white text-black m-0 box-border leading-tight ${
                is58mm ? 'text-[11px]' : 'text-[12px]'
            }`}
            style={{ width: contentWidth, maxWidth: contentWidth, padding: is58mm ? '0 1mm' : '0 2mm' }}
        >
            {/* Header: Order Info */}
            <div className="text-center border-b-2 border-black pb-1.5 mb-2">
                <h1 className={`font-black uppercase mb-1 ${is58mm ? 'text-lg' : 'text-2xl'}`}>COZINHA</h1>
                <div className={`flex justify-between items-baseline gap-1 font-bold ${is58mm ? 'text-sm' : 'text-lg px-1'}`}>
                    <span>#{order.short_code || String(order.id).substring(0, 5).toUpperCase()}</span>
                    <span className="text-right break-words">{tableLabel}</span>
                </div>
                <p className="text-[10px] mt-1 font-bold">{productionTime}</p>
            </div>

            {/* Customer/Delivery Context */}
            {order.customer_name && (
                <div className="border-b border-black border-dashed pb-1 mb-2">
                    <p className="font-bold uppercase text-[10px]">CLIENTE:</p>
                    <p className={`font-black uppercase break-words ${is58mm ? 'text-xs' : 'text-sm'}`}>
                        {order.customer_name}
                    </p>
                </div>
            )}

            {/* Items Section */}
            <div className="mb-2">
                {kitchenItems.map((item, index) => {
                    const isPizza = Boolean(item.is_pizza);
                    const flavorNames = Array.isArray(item.flavor_names) ? item.flavor_names.filter(Boolean) : [];
                    const flavorsCount = flavorNames.length;

                    // Logic for symbol:
                    // 1. Broto name -> 4
                    // 2. Else by flavor count
                    let symbolType = null;
                    if (isPizza) {
                        const sizeHint = `${item.size_name || ''} ${item.name || ''}`.toLowerCase();
                        if (sizeHint.includes('broto')) symbolType = 4;
                        else if (flavorsCount === 3) symbolType = 3;
                        else if (flavorsCount === 2) symbolType = 2;
                        else symbolType = 1;
                    }

                    // Clean pizza title: show size + division once, flavors listed once below
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
                        <div key={index} className="border-b border-black border-dashed py-2">
                            <div className="flex items-start">
                                <span className={`font-black mr-1.5 leading-none shrink-0 ${is58mm ? 'text-lg' : 'text-2xl'}`}>
                                    {item.quantity}x
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap">
                                        {symbolType && <PizzaSymbol type={symbolType} size={is58mm ? 16 : 18} />}
                                        <span className={`font-black uppercase leading-tight break-words ${is58mm ? 'text-sm' : 'text-lg'}`}>
                                            {displayTitle}
                                        </span>
                                    </div>

                                    {isPizza && flavorsCount > 0 && (
                                        <div className={`mt-1 font-bold uppercase leading-snug ${is58mm ? 'text-xs' : 'text-sm'}`}>
                                            {flavorNames.map((f, i) => (
                                                <div key={i} className="break-words">
                                                    {flavorsCount > 1 ? `• 1/${flavorsCount} ${f}` : `• ${f}`}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {item.notes && (
                                <div
                                    className={`mt-1.5 w-full box-border bg-white text-black border-2 border-black p-1.5 font-black uppercase leading-snug ${
                                        is58mm ? 'text-xs' : 'text-sm'
                                    }`}
                                    style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                                >
                                    {item.notes.split('|').map((note, idx) => {
                                        const cleanNote = String(note || '')
                                            .replace(/^[⚠️❌]\s*/u, '')
                                            .replace(/^obs:\s*/i, '')
                                            .trim();
                                        if (!cleanNote) return null;
                                        const lower = cleanNote.toLowerCase();
                                        const isExclusion = lower.startsWith('sem ') ||
                                            lower.startsWith('retirar ') ||
                                            lower.startsWith('no ') ||
                                            lower.includes(': sem ') ||
                                            lower.includes(': retirar ') ||
                                            lower.includes(': no ');
                                        return (
                                            <div key={idx} className="text-black font-black py-0.5 break-words">
                                                {isExclusion ? '>> [RETIRAR] ' : '>> OBS: '}{cleanNote}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="text-center mt-2 border-t-2 border-black pt-1.5 pb-1">
                <p className="font-bold uppercase tracking-widest text-[10px]">Fim do Pedido</p>
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
