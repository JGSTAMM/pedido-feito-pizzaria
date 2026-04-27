import React from 'react';
import { useForm } from '@inertiajs/react';
import { Card, Label } from './Shared';

export default function TabRecibos({ settings }) {
    const { data, setData, post, processing, errors } = useForm({
        receipt_header_1: settings?.receipt_header_1 || '',
        receipt_header_2: settings?.receipt_header_2 || '',
        receipt_footer: settings?.receipt_footer || '',
        receipt_show_cnpj: settings?.receipt_show_cnpj ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/settings/receipt', { preserveScroll: true });
    };

    return (
        <Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Lado Esquerdo: Formulário */}
                <div>
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-1">Impressão e Recibos</h3>
                        <p className="text-sm text-text-muted">Personalize a Via de Conferência do termo de impressão.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label>Cabeçalho Linha 1</Label>
                                <input type="text" value={data.receipt_header_1} onChange={e => setData('receipt_header_1', e.target.value)} placeholder="Ex: LUCCHESE" className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none" />
                                {errors.receipt_header_1 && <p className="text-red-400 text-xs mt-1">{errors.receipt_header_1}</p>}
                            </div>

                            <div>
                                <Label>Cabeçalho Linha 2</Label>
                                <input type="text" value={data.receipt_header_2} onChange={e => setData('receipt_header_2', e.target.value)} placeholder="Ex: Pizzaria Gourmet" className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none" />
                                {errors.receipt_header_2 && <p className="text-red-400 text-xs mt-1">{errors.receipt_header_2}</p>}
                            </div>
                        </div>

                        <div>
                            <Label>Mensagem de Rodapé</Label>
                            <textarea rows="3" value={data.receipt_footer} onChange={e => setData('receipt_footer', e.target.value)} className="w-full bg-background border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none resize-none"></textarea>
                            {errors.receipt_footer && <p className="text-red-400 text-xs mt-1">{errors.receipt_footer}</p>}
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer group w-max">
                            <div className={`relative w-12 h-6 rounded-full transition-colors ${data.receipt_show_cnpj ? 'bg-primary' : 'bg-surface border border-border-subtle'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${data.receipt_show_cnpj ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Exibir o CNPJ da Loja no Recibo</span>
                        </label>

                        <div className="pt-4 border-t border-border-subtle flex justify-start">
                            <button type="submit" disabled={processing} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50">
                                {processing ? 'Salvando...' : 'Salvar Formato'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Lado Direito: Live Preview Bobina */}
                <div className="hidden lg:flex flex-col items-center justify-center bg-background rounded-2xl border border-border-subtle p-6 relative overflow-hidden">
                    <div className="absolute top-0 w-full h-8 bg-gradient-to-b from-background-dark/80 to-transparent z-10"></div>

                    <p className="text-xs uppercase tracking-widest text-text-muted font-bold mb-4">Live Preview (80mm)</p>

                    <div className="bg-[#f0f0f0] text-black font-mono w-[300px] max-w-full shadow-2xl relative" style={{ minHeight: '400px' }}>
                        {/* Serrilhado Topo */}
                        <div className="absolute top-0 left-0 w-full h-[6px]" style={{ backgroundImage: 'radial-gradient(circle, transparent 3px, #f0f0f0 4px)', backgroundSize: '10px 10px', backgroundPosition: '-5px -5px' }}></div>

                        <div className="p-6 pt-8 pb-12 flex flex-col gap-4 text-sm leading-tight h-full">
                            <div className="text-center border-b-[2px] border-dashed border-gray-400 pb-4">
                                <h1 className="text-2xl font-black uppercase text-balance">{data.receipt_header_1 || 'CABEÇALHO 1'}</h1>
                                <h2 className="text-lg font-bold text-balance mt-1">{data.receipt_header_2 || 'Cabeçalho 2'}</h2>
                                {data.receipt_show_cnpj && (
                                    <p className="text-xs mt-2 font-bold">CNPJ: 00.000.000/0001-00</p>
                                )}
                            </div>

                            <div className="text-xs font-bold space-y-1">
                                <p>TICKET: #00123 - {new Date().toLocaleDateString('pt-BR')}</p>
                                <p>CLIENTE: Cliente Exemplo</p>
                            </div>

                            <div className="border-t-[2px] border-b-[2px] border-solid border-black py-2">
                                <div className="flex justify-between font-black mb-2 border-b border-black pb-1">
                                    <span>Qtd</span>
                                    <span className="flex-1 px-2 text-center">Produto</span>
                                    <span>R$ Total</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span>1x</span>
                                    <span className="flex-1 px-2">Pizza Calabresa G</span>
                                    <span>R$ 65,00</span>
                                </div>
                                <div className="flex justify-between mt-1 text-gray-700 text-xs font-bold">
                                    <span></span>
                                    <span className="flex-1 px-2">- Sem cebola</span>
                                    <span></span>
                                </div>
                            </div>

                            <div className="flex justify-between text-lg font-black mt-2">
                                <span>TOTAL</span>
                                <span>R$ 65,00</span>
                            </div>

                            <div className="text-center mt-6 pt-4 text-[11px] font-bold uppercase whitespace-pre-wrap">
                                {data.receipt_footer || 'Mensagem de rodapé aparecerá aqui...'}
                            </div>
                        </div>

                        {/* Serrilhado Bottom */}
                        <div className="absolute bottom-0 left-0 w-full h-[6px]" style={{ backgroundImage: 'radial-gradient(circle, transparent 3px, #f0f0f0 4px)', backgroundSize: '10px 10px', backgroundPosition: '-5px 5px' }}></div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
