import React from 'react';
import useI18n from '@/hooks/useI18n';

/**
 * Pizza Symbol SVG Component
 * Renders high-contrast B&W symbols for pizza configurations
 */
const PizzaSymbol = ({ type, size = 24 }) => {
    // type: 1 (inteira), 2 (meia), 3 (3-sabores), 4 (broto)
    const strokeWidth = 2;
    const color = "black";

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

export default function KitchenReceiptPrint({ order }) {
    const { t, locale } = useI18n();
    if (!order) return null;

    const items = order.items || [];
    const productionTime = new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date());

    return (
        <div className="hidden print:block font-mono bg-white text-black p-0 m-0 w-[80mm] leading-tight text-[12px]">
            {/* Header: Order Info */}
            <div className="text-center border-b-2 border-black pb-2 mb-2">
                <h1 className="text-2xl font-black uppercase mb-1">COZINHA</h1>
                <div className="flex justify-between px-2 font-bold text-lg">
                    <span>#{order.short_code || String(order.id).substring(0, 5).toUpperCase()}</span>
                    <span>{order.table_name || 'BALCÃO'}</span>
                </div>
                <p className="text-[10px] mt-1 font-bold">{productionTime}</p>
            </div>

            {/* Customer/Delivery Context */}
            {order.customer_name && (
                <div className="border-b border-black border-dashed pb-1 mb-2 px-1">
                    <p className="font-bold uppercase text-[10px]">CLIENTE:</p>
                    <p className="font-black text-sm uppercase">{order.customer_name}</p>
                </div>
            )}

            {/* Items Section */}
            <div className="mb-4">
                {items.map((item, index) => {
                    const isPizza = item.is_pizza;
                    const flavorsCount = item.flavor_names?.length || 0;
                    
                    // Logic for symbol: 
                    // 1. Broto name -> 4
                    // 2. Else by flavor count
                    let symbolType = null;
                    if (isPizza) {
                        if (item.name?.toLowerCase().includes('broto')) symbolType = 4;
                        else if (flavorsCount === 3) symbolType = 3;
                        else if (flavorsCount === 2) symbolType = 2;
                        else symbolType = 1;
                    }

                    return (
                        <div key={index} className="border-b border-black border-dashed py-2 px-1">
                            <div className="flex items-start">
                                <span className="text-2xl font-black mr-2 leading-none">{item.quantity}x</span>
                                <div className="flex-1">
                                    <div className="flex items-center flex-wrap">
                                        {symbolType && <PizzaSymbol type={symbolType} size={18} />}
                                        <span className="text-lg font-black uppercase leading-tight">{item.name}</span>
                                    </div>
                                    
                                    {isPizza && item.flavor_names?.length > 0 && (
                                        <div className="mt-1 ml-1 font-bold italic uppercase text-[11px] leading-tight">
                                            {item.flavor_names.map((f, i) => (
                                                <div key={i}>• {f}</div>
                                            ))}
                                        </div>
                                    )}

                                    {item.notes && (
                                        <div className="mt-2 ml-1 bg-black text-white p-1 font-black uppercase text-[10px] leading-tight">
                                            {item.notes.split('|').map((note, idx) => {
                                                const trimmed = note.trim();
                                                const isExclusion = trimmed.toLowerCase().startsWith('sem ') || 
                                                                  trimmed.toLowerCase().startsWith('retirar ') ||
                                                                  trimmed.toLowerCase().startsWith('no ');
                                                return (
                                                    <div key={idx} className={isExclusion ? "underline decoration-1" : ""}>
                                                        {isExclusion ? "❌ " : "⚠️ "}{trimmed}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="text-center mt-4 border-t-2 border-black pt-2">
                <p className="font-bold uppercase tracking-widest text-[10px]">Fim do Pedido</p>
                <div className="mt-2 border-t border-black border-dashed pt-4 h-8"></div>
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
