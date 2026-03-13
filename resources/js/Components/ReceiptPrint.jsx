import React from 'react';

// Estilos de impressão injetados globalmente ou via classe isolada para afetar apenas este componente
export default function ReceiptPrint({ order }) {
    if (!order) return null;

    return (
        <div className="hidden print:block bg-white text-black font-mono w-[80mm] p-2 mx-auto text-xs leading-snug print:m-0 print:p-0">
            {/* Cabecalho */}
            <div className="text-center mb-4 border-b border-black pb-2 border-dashed">
                <h2 className="text-xl font-bold uppercase tracking-widest mb-1">Lucchese</h2>
                <p className="text-[10px] uppercase font-bold">Pizzaria Gourmet</p>
                <p className="text-[10px] mt-1">
                    {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}
                </p>
            </div>

            {/* Identificacao do Pedido */}
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold mb-1">
                    {order.table_name ? `MESA ${order.table_name}` : 'PEDIDO DE BALCÃO'}
                </h3>
                <p className="border border-black inline-block px-3 py-1 font-bold text-sm tracking-widest">
                    #{order.short_code || String(order.id).substring(0, 5).toUpperCase()}
                </p>
                {order.customer_name && order.customer_name !== 'Cliente' && (
                    <p className="mt-2 font-bold text-sm uppercase">Cliente: {order.customer_name}</p>
                )}
            </div>

            <div className="border-b border-black border-dashed mb-2"></div>

            {/* Itens */}
            <table className="w-full text-left mb-2 text-[11px]">
                <thead>
                    <tr className="border-b border-black border-dashed">
                        <th className="py-1 w-8 font-bold">Qtd</th>
                        <th className="py-1 font-bold">Item</th>
                        <th className="py-1 text-right font-bold w-12">Total</th>
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
                                        Sabores: {item.flavor_names.join(', ')}
                                    </div>
                                )}
                                {item.notes && (
                                    <div className="text-[9px] mt-0.5 leading-tight pl-1 font-bold uppercase">
                                        OBS: {item.notes}
                                    </div>
                                )}
                            </td>
                            <td className="py-1 align-top pt-1 text-right">
                                {Number(item.price * item.quantity).toFixed(2).replace('.', ',')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-b border-black border-dashed mb-2"></div>

            {/* Totalizadores */}
            <div className="flex justify-between items-center text-sm font-black uppercase mb-4">
                <span>Total a Pagar</span>
                <span className="text-base">R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
            </div>

            {/* Rodapé */}
            <div className="text-center text-[10px] mt-6 pt-4 border-t border-black border-solid space-y-1">
                <p className="font-bold uppercase tracking-widest">*** CONFERÊNCIA DE MESA ***</p>
                <p>NÃO É DOCUMENTO FISCAL</p>
                <p className="mt-2 text-[9px] !mt-4">Obrigado pela preferência!</p>
            </div>

            {/* Estilo Global exclusivo para Impressão */}
            <style>
                {`
                    @media print {
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
                            width: 100%;
                        }
                        @page {
                            margin: 0;
                        }
                    }
                `}
            </style>
        </div>
    );
}
