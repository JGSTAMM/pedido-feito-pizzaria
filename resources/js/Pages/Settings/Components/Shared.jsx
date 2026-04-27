import React from 'react';

export function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#18181F] w-full max-w-md rounded-2xl border border-border-subtle shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-border-subtle">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="p-5 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

export function Toast({ message, type = 'success' }) {
    if (!message) return null;
    const bg = type === 'success' ? 'bg-emerald-500/90' : 'bg-red-500/90';
    return (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl text-white text-sm font-bold shadow-lg ${bg} animate-[fadeIn_0.3s_ease-out]`}>
            {message}
        </div>
    );
}

export function Card({ children }) {
    return <div className="bg-surface rounded-2xl border border-border-subtle p-8" style={{ background: 'rgba(255,255,255,0.03)' }}>{children}</div>;
}

export function Label({ children }) {
    return <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">{children}</label>;
}

export function ModalFooter({ onClose, processing, label }) {
    return (
        <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-text-muted hover:text-white transition-colors">Cancelar</button>
            <button type="submit" disabled={processing} className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50">{processing ? 'Salvando...' : label}</button>
        </div>
    );
}
