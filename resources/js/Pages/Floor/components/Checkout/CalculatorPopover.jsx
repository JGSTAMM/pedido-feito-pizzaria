import React, { useState, useEffect } from 'react';
import useI18n from '@/hooks/useI18n';

export default function CalculatorPopover() {
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');
    const [lastOp, setLastOp] = useState('');

    const handleNum = (num) => {
        if (display === '0' || lastOp === '=') {
            setDisplay(num);
            if (lastOp === '=') setEquation('');
        } else {
            setDisplay(display + num);
        }
        setLastOp('');
    };

    const handleOp = (op) => {
        if (lastOp !== '' && lastOp !== '=') {
            setEquation(equation.slice(0, -1) + op);
        } else {
            setEquation(equation + display + op);
            setDisplay('0');
        }
        setLastOp(op);
    };

    const handleCalc = () => {
        try {
            // eslint-disable-next-line
            const result = eval(equation + display);
            setDisplay(String(result));
            setEquation('');
            setLastOp('=');
        } catch (e) {
            setDisplay('Error');
        }
    };

    const handleClear = () => {
        setDisplay('0');
        setEquation('');
        setLastOp('');
    };

    const toggle = () => setIsOpen(!isOpen);

    return (
        <div className="relative">
            <button
                onClick={toggle}
                className="size-9 sm:size-10 flex items-center justify-center rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all border border-blue-500/20 active:scale-95"
            >
                <span className="material-symbols-outlined text-[20px]">calculate</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[10001]" onClick={toggle} />
                    <div className="absolute bottom-full right-0 mb-4 z-[10002] bg-[#1A1A24] border border-white/10 rounded-3xl shadow-2xl p-4 w-64 animate-scale-in origin-bottom-right">
                        
                        <div className="bg-black/40 rounded-xl p-3 mb-4 text-right overflow-hidden border border-white/5">
                            <div className="text-[10px] text-text-muted font-mono h-4 tracking-wider">{equation}</div>
                            <div className="text-2xl font-black text-white font-mono truncate">{display}</div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {['7','8','9','/'].map(btn => (
                                <button key={btn} onClick={() => btn === '/' ? handleOp('/') : handleNum(btn)} className="py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition-colors active:scale-95">{btn}</button>
                            ))}
                            {['4','5','6','*'].map(btn => (
                                <button key={btn} onClick={() => btn === '*' ? handleOp('*') : handleNum(btn)} className="py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition-colors active:scale-95">{btn === '*' ? '×' : btn}</button>
                            ))}
                            {['1','2','3','-'].map(btn => (
                                <button key={btn} onClick={() => btn === '-' ? handleOp('-') : handleNum(btn)} className="py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition-colors active:scale-95">{btn}</button>
                            ))}
                            <button onClick={handleClear} className="py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-bold transition-colors active:scale-95">C</button>
                            {['0','.'].map(btn => (
                                <button key={btn} onClick={() => handleNum(btn)} className="py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition-colors active:scale-95">{btn}</button>
                            ))}
                            <button onClick={() => handleOp('+')} className="py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition-colors active:scale-95">+</button>
                            
                            <button onClick={handleCalc} className="col-span-4 py-3 bg-blue-500 hover:bg-blue-400 text-black rounded-lg font-black transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-95 mt-1">=</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
