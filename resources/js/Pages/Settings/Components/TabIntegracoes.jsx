import React from 'react';
import { Card } from './Shared';

export default function TabIntegracoes() {
    const integrations = [
        { name: 'iFood', desc: 'Receba pedidos do iFood diretamente no PDV.', icon: '🍔', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
        { name: 'WhatsApp', desc: 'Envie notificações de status do pedido ao cliente.', icon: '💬', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
        { name: 'Mercado Pago', desc: 'Aceite pagamentos via Pix e cartão de crédito.', icon: '💳', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
        { name: 'Google Maps', desc: 'Calcule taxas de entrega por distância automaticamente.', icon: '📍', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    ];

    return (
        <Card>
            <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Integrações</h3>
                <p className="text-sm text-text-muted">Conecte serviços externos ao seu sistema.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {integrations.map(i => (
                    <div key={i.name} className="relative group p-5 rounded-xl border border-border-subtle bg-background-dark hover:border-border-subtle-hover transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{i.icon}</span>
                            <h4 className="text-white font-bold text-sm">{i.name}</h4>
                        </div>
                        <p className="text-xs text-text-muted mb-4">{i.desc}</p>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-surface text-text-muted border border-border-subtle">
                            <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
                            Em breve
                        </span>
                        <div className="absolute inset-0 rounded-xl bg-background-dark/30 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-sm font-bold text-text-muted">Em breve</span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
