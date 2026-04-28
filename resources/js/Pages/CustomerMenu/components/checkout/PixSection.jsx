import React, { useState, useRef, useEffect } from 'react';

export default function PixSection({ pixQrCode, pixQrCodeBase64 }) {
    const [copied, setCopied] = useState(false);
    const copyTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        };
    }, []);

    const handleCopy = async () => {
        if (!pixQrCode) return;
        try {
            await navigator.clipboard.writeText(pixQrCode);
            setCopied(true);
            
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
            copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
        } catch { /* noop */ }
    };

    return (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 mt-4">
            <h2 className="font-bold text-white text-center">Escaneie o QR Code PIX</h2>
            {pixQrCodeBase64 && (
                <div className="bg-white p-4 rounded-2xl inline-flex flex-col items-center mx-auto w-full max-w-[220px]">
                    <img src={`data:image/png;base64,${pixQrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48" />
                </div>
            )}
            {pixQrCode && (
                <div className="space-y-2">
                    <p className="text-xs text-white/40 text-center">Ou copie o código (Pix Copia e Cola):</p>
                    <p className="break-all text-xs text-white/60 bg-black/40 rounded-xl p-3 font-mono">{pixQrCode}</p>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide transition-colors"
                    >
                        {copied ? '✓ Copiado!' : 'Copiar Código PIX'}
                    </button>
                </div>
            )}
        </div>
    );
}
