import React from 'react';
import { usePage } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';

/**
 * Pizza Symbol SVG Component
 */
const PizzaSymbol = ({ type, size = 16 }) => {
    const strokeWidth = 2;
    const color = "black";
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

export default function ReceiptPrint({ order }) {
    const { storeSetting } = usePage().props;
    const { t, formatCurrency, locale } = useI18n();
    if (!order) return null;

    const header1 = storeSetting?.receipt_header_1 || storeSetting?.store_name || "PEDIDO FEITO";
    const header2 = storeSetting?.receipt_header_2 || "";
    const footerMsg = storeSetting?.receipt_footer || "";
    
    const datePart = new Intl.DateTimeFormat(locale).format(new Date());
    const timePart = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date());

    return (
        <div className="hidden print:block font-mono bg-white text-black p-0 m-0 w-[80mm] leading-tight text-[11px]">
            {/* Header */}
            <div className="text-center border-b border-black border-dashed pb-2 mb-2">
                <h2 className="text-lg font-black uppercase mb-0.5">{header1}</h2>
                {header2 && <p className="text-[9px] uppercase font-bold">{header2}</p>}
                {storeSetting?.receipt_show_cnpj && storeSetting?.cnpj && (
                    <p className="text-[9px] uppercase font-bold">CNPJ: {storeSetting.cnpj}</p>
                )}
                <p className="text-[9px] mt-1">{datePart} {timePart}</p>
            </div>

            {/* Order Ident */}
            <div className="text-center mb-2">
                <h3 className="text-base font-black">
                    {order.table_name ? `MESA: ${order.table_name}` : 'PEDIDO BALCÃO'}
                </h3>
                <p className="border border-black inline-block px-3 py-0.5 font-black text-sm mt-1">
                    #{order.short_code || String(order.id).substring(0, 5).toUpperCase()}
                </p>
                {order.customer_name && (
                    <p className="mt-1 font-bold text-[10px] uppercase">{order.customer_name}</p>
                )}
            </div>

            <div className="border-b border-black border-dashed mb-2"></div>

            {/* Items */}
            <table className="w-full text-left mb-2 text-[10px]">
                <thead>
                    <tr className="border-b border-black pb-1">
                        <th className="font-black w-6">QTD</th>
                        <th className="font-black">ITEM</th>
                        <th className="font-black text-right">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items?.map((item, index) => {
                        const isPizza = item.is_pizza;
                        const flavorsCount = item.flavor_names?.length || 0;
                        let symbolType = null;
                        if (isPizza) {
                            if (item.name?.toLowerCase().includes('broto')) symbolType = 4;
                            else if (flavorsCount === 3) symbolType = 3;
                            else if (flavorsCount === 2) symbolType = 2;
                            else symbolType = 1;
                        }

                        return (
                            <tr key={index} className="align-top border-b border-black/10">
                                <td className="py-1 font-black">{item.quantity}</td>
                                <td className="py-1">
                                    <div className="flex items-center flex-wrap">
                                        {symbolType && <PizzaSymbol type={symbolType} size={12} />}
                                        <span className="font-bold uppercase leading-tight">{item.name}</span>
                                    </div>
                                    {isPizza && item.flavor_names?.length > 0 && (
                                        <div className="text-[9px] italic mt-0.5 pl-1 leading-tight">
                                            {item.flavor_names.join(' / ')}
                                        </div>
                                    )}
                                    {item.notes && (
                                        <div className="text-[8px] mt-0.5 pl-1 font-bold leading-tight uppercase">
                                            {item.notes.split('|').map((note, idx) => (
                                                <div key={idx}>• {note.trim()}</div>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="py-1 text-right font-bold">
                                    {formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="border-b border-black border-dashed mb-2"></div>

            {/* Totals */}
            <div className="space-y-1 mb-4">
                <div className="flex justify-between font-black text-xs uppercase">
                    <span>TOTAL</span>
                    <span>{formatCurrency(order.total)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[9px] mt-4 border-t border-black border-dashed pt-2 space-y-1">
                <p className="font-bold uppercase tracking-wider italic">Conferência de Mesa</p>
                <p className="opacity-70 italic">*** NÃO É DOCUMENTO FISCAL ***</p>
                {footerMsg && <p className="mt-2 whitespace-pre-wrap leading-tight">{footerMsg}</p>}
            </div>

            <style>
                {`
                    @media print {
                        @page { margin: 0; size: 80mm auto; }
                        body * { visibility: hidden; }
                        .print\\:block, .print\\:block * { visibility: visible; }
                        .print\\:block { 
                            position: absolute; left: 0; top: 0; width: 80mm !important; 
                            background: white !important; color: black !important;
                            padding: 0; margin: 0;
                        }
                    }
                `}
            </style>
        </div>
    );
}
