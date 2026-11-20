import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useI18n from '@/hooks/useI18n';

/**
 * Safely evaluates a basic arithmetic expression (+, -, *, /) without using eval().
 */
export function evaluateExpression(expression) {
    const tokens = String(expression || '')
        .replace(/\s+/g, '')
        .match(/(\d+(?:\.\d+)?|\.\d+|[+\-*/])/g);

    if (!tokens || tokens.length === 0) {
        return null;
    }

    const values = [];
    let currentSign = 1;
    let expectNumber = true;
    const operators = [];

    for (const token of tokens) {
        if (expectNumber) {
            if (token === '-') {
                currentSign *= -1;
                continue;
            }
            if (token === '+') {
                continue;
            }
            const parsed = Number(token);
            if (!Number.isFinite(parsed)) {
                return null;
            }
            values.push(currentSign * parsed);
            currentSign = 1;
            expectNumber = false;
        } else {
            if (!['+', '-', '*', '/'].includes(token)) {
                return null;
            }
            operators.push(token);
            expectNumber = true;
        }
    }

    if (values.length === 0 || operators.length >= values.length) {
        return null;
    }

    // First pass: multiplication and division
    const addSubValues = [values[0]];
    const addSubOps = [];

    for (let i = 0; i < operators.length; i += 1) {
        const op = operators[i];
        const nextVal = values[i + 1];

        if (op === '*' || op === '/') {
            const prevVal = addSubValues.pop();
            if (op === '/' && nextVal === 0) {
                return null;
            }
            addSubValues.push(op === '*' ? prevVal * nextVal : prevVal / nextVal);
        } else {
            addSubOps.push(op);
            addSubValues.push(nextVal);
        }
    }

    // Second pass: addition and subtraction
    let total = addSubValues[0];
    for (let i = 0; i < addSubOps.length; i += 1) {
        total = addSubOps[i] === '+'
            ? total + addSubValues[i + 1]
            : total - addSubValues[i + 1];
    }

    if (!Number.isFinite(total)) {
        return null;
    }

    return Number(total.toFixed(10));
}

export default function CalculatorPopover() {
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');
    const [lastOp, setLastOp] = useState('');
    const [coords, setCoords] = useState({ top: 72, right: 16 });
    const triggerRef = useRef(null);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current || typeof window === 'undefined') return;
        const rect = triggerRef.current.getBoundingClientRect();
        const estimatedHeight = 380;
        const maxTop = Math.max(12, window.innerHeight - estimatedHeight - 12);
        const top = Math.max(12, Math.min(rect.bottom + 8, maxTop));
        const right = Math.max(12, window.innerWidth - rect.right);
        setCoords({ top, right });
    }, []);

    useEffect(() => {
        if (!isOpen) return undefined;
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, updatePosition]);

    const handleNum = useCallback((num) => {
        if (num === '.') {
            if (lastOp === '=' || display === 'Error') {
                setDisplay('0.');
                setEquation('');
                setLastOp('');
                return;
            }
            if (display.includes('.')) {
                return;
            }
            setDisplay(display + '.');
            setLastOp('');
            return;
        }

        if (display === '0' || display === 'Error' || lastOp === '=') {
            setDisplay(num);
            if (lastOp === '=') setEquation('');
        } else {
            setDisplay(display + num);
        }
        setLastOp('');
    }, [display, lastOp]);

    const handleOp = useCallback((op) => {
        if (display === 'Error') {
            setDisplay('0');
            setEquation('');
            setLastOp('');
            return;
        }

        if (lastOp !== '' && lastOp !== '=') {
            setEquation(equation.slice(0, -1) + op);
        } else {
            setEquation(equation + display + op);
            setDisplay('0');
        }
        setLastOp(op);
    }, [display, equation, lastOp]);

    const handleCalc = useCallback(() => {
        if (!equation && display === 'Error') return;
        const result = evaluateExpression(equation + display);
        setDisplay(result === null ? 'Error' : String(result));
        setEquation('');
        setLastOp('=');
    }, [equation, display]);

    const handleClear = useCallback(() => {
        setDisplay('0');
        setEquation('');
        setLastOp('');
    }, []);

    const handleBackspace = useCallback(() => {
        if (display === 'Error' || lastOp === '=') {
            setDisplay('0');
            if (lastOp === '=') setEquation('');
            setLastOp('');
            return;
        }
        setDisplay((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
    }, [display, lastOp]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setIsOpen(false);
                return;
            }
            if (/^[0-9]$/.test(e.key)) {
                e.preventDefault();
                handleNum(e.key);
                return;
            }
            if (e.key === '.' || e.key === ',') {
                e.preventDefault();
                handleNum('.');
                return;
            }
            if (['+', '-', '*', '/'].includes(e.key)) {
                e.preventDefault();
                handleOp(e.key);
                return;
            }
            if (e.key === 'Enter' || e.key === '=') {
                e.preventDefault();
                handleCalc();
                return;
            }
            if (e.key === 'Backspace') {
                e.preventDefault();
                handleBackspace();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, handleNum, handleOp, handleCalc, handleBackspace]);

    const toggle = () => {
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen((prev) => !prev);
    };

    const popoverContent = isOpen ? (
        <>
            <div
                data-testid="calculator-backdrop"
                className="fixed inset-0 z-[10040]"
                onClick={() => setIsOpen(false)}
            />
            <div
                role="dialog"
                aria-label={t('floor.drawer.checkout.calculator_title')}
                style={{ top: `${coords.top}px`, right: `${coords.right}px` }}
                className="fixed z-[10050] bg-[#1A1A24] border border-white/15 rounded-3xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] p-4 w-64 max-w-[calc(100vw-24px)] animate-scale-in origin-top-right"
            >
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[11px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">calculate</span>
                        {t('floor.drawer.checkout.calculator_title')}
                    </span>
                    <button
                        type="button"
                        aria-label={t('floor.drawer.checkout.calculator_close')}
                        onClick={() => setIsOpen(false)}
                        className="size-7 rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-white flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>

                <div className="bg-black/40 rounded-xl p-3 mb-4 text-right overflow-hidden border border-white/5">
                    <div className="text-[10px] text-text-muted font-mono h-4 tracking-wider truncate">{equation}</div>
                    <div data-testid="calculator-display" className="text-2xl font-black text-white font-mono truncate">{display}</div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {['7', '8', '9', '/'].map((btn) => (
                        <button
                            key={btn}
                            type="button"
                            onClick={() => (btn === '/' ? handleOp('/') : handleNum(btn))}
                            className="py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition-colors active:scale-95"
                        >
                            {btn === '/' ? '÷' : btn}
                        </button>
                    ))}
                    {['4', '5', '6', '*'].map((btn) => (
                        <button
                            key={btn}
                            type="button"
                            onClick={() => (btn === '*' ? handleOp('*') : handleNum(btn))}
                            className="py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition-colors active:scale-95"
                        >
                            {btn === '*' ? '×' : btn}
                        </button>
                    ))}
                    {['1', '2', '3', '-'].map((btn) => (
                        <button
                            key={btn}
                            type="button"
                            onClick={() => (btn === '-' ? handleOp('-') : handleNum(btn))}
                            className="py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition-colors active:scale-95"
                        >
                            {btn}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={handleClear}
                        className="py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-bold transition-colors active:scale-95"
                    >
                        C
                    </button>
                    {['0', '.'].map((btn) => (
                        <button
                            key={btn}
                            type="button"
                            onClick={() => handleNum(btn)}
                            className="py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition-colors active:scale-95"
                        >
                            {btn}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => handleOp('+')}
                        className="py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition-colors active:scale-95"
                    >
                        +
                    </button>

                    <button
                        type="button"
                        aria-label="Backspace"
                        onClick={handleBackspace}
                        className="py-3 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white rounded-lg font-bold transition-colors active:scale-95 mt-1 flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined text-[18px]">backspace</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleCalc}
                        className="col-span-3 py-3 bg-blue-500 hover:bg-blue-400 text-black rounded-lg font-black transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-95 mt-1"
                    >
                        =
                    </button>
                </div>
            </div>
        </>
    ) : null;

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                type="button"
                aria-label={t('floor.drawer.checkout.calculator_open')}
                aria-expanded={isOpen}
                onClick={toggle}
                className="size-9 sm:size-10 flex items-center justify-center rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all border border-blue-500/20 active:scale-95"
            >
                <span className="material-symbols-outlined text-[20px]">calculate</span>
            </button>

            {typeof document !== 'undefined' && popoverContent
                ? createPortal(popoverContent, document.body)
                : popoverContent}
        </div>
    );
}
