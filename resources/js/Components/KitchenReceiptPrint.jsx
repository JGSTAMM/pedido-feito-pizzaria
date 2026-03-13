import React from 'react';

export default function KitchenReceiptPrint({ order }) {
    if (!order) return null;

    return (
        <div className="hidden print:block bg-white text-black font-mono p-0 m-0 w-[80mm] leading-snug">
            {/* Cabecalho Cozinha */}
            <div className="text-center mb-4 border-b-2 border-black pb-2">
                <h2 className="text-2xl font-black uppercase tracking-widest mb-1">
                    {order.table_name ? `MESA ${order.table_name}` : 'BALCÃO / DELIVERY'}
                </h2>
                <h3 className="text-xl font-bold border border-black inline-block px-4 py-1 mt-1">
                    PEDIDO #{order.short_code || String(order.id).substring(0, 5).toUpperCase()}
                </h3>
                {order.customer_name && order.customer_name !== 'Cliente' && (
                    <p className="mt-2 font-bold text-sm uppercase">Cliente: {order.customer_name}</p>
                )}
                <p className="text-[12px] mt-2 font-bold uppercase">
                    VIA DE PRODUÇÃO - {new Date().toLocaleTimeString('pt-BR')}
                </p>
            </div>

            <div className="border-b-2 border-black border-dashed mb-2"></div>

            {/* Itens */}
            <table className="w-full text-left mb-2 text-sm">
                <thead>
                    <tr className="border-b border-black">
                        <th className="py-2 w-8 font-black text-lg">Qtd</th>
                        <th className="py-2 font-black text-lg">Produto</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items?.map((item, index) => (
                        <tr key={index} className="border-b border-gray-300">
                            <td className="py-3 align-top font-black text-xl text-center">{item.quantity}</td>
                            <td className="py-3 align-top">
                                <span className="font-black text-lg uppercase">{item.name}</span>
                                {item.is_pizza && item.flavor_names?.length > 0 && (
                                    <div className="text-base mt-1 font-bold uppercase">
                                        ► {item.flavor_names.join(', ')}
                                    </div>
                                )}
                                {item.notes && (
                                    <div className="mt-2 p-1 border-2 border-black font-black text-base uppercase">
                                        *** OBS: {item.notes} ***
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Rodapé Cozinha */}
            <div className="text-center text-[12px] mt-6 pt-2 border-t-2 border-black font-black uppercase">
                <p>*** FIM DO PEDIDO ***</p>
            </div>

            {/* Estilo Global exclusivo para Impressão 80mm */}
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
                            font-size: 14px;
                        }
                    }
                `}
            </style>
        </div>
    );
}
