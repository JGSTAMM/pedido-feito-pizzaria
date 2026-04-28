import React from 'react';
import { getSteps } from '../../utils/orderStatusHelpers';

export default function OrderStepper({ activeStep, t }) {
    const steps = getSteps(t);
    return (
        <div className="w-full my-6" role="img" aria-label={`Status do pedido: ${steps[activeStep]?.label}`}>
            <div className="flex items-center justify-between relative">
                {/* progress line */}
                <div className="absolute left-0 right-0 top-5 h-0.5 bg-white/10" />
                <div
                    className="absolute left-0 top-5 h-0.5 bg-emerald-500 transition-all duration-700"
                    style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                />
                {steps.map((step, i) => {
                    const done = i < activeStep;
                    const active = i === activeStep;
                    return (
                        <div 
                            key={step.key} 
                            className="flex flex-col items-center gap-2 z-10"
                            aria-current={active ? 'step' : undefined}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-500 ${done ? 'bg-emerald-500 border-emerald-500 text-white' :
                                    active ? 'bg-white/10 border-emerald-400 text-white shadow-[0_0_16px_rgba(52,211,153,0.4)]' :
                                        'bg-[#0D0D12] border-white/10 text-white/20'
                                 }`}>
                                {done ? '✓' : step.icon}
                            </div>
                            <p className={`text-[9px] font-black uppercase tracking-widest text-center max-w-[60px] leading-tight ${active ? 'text-emerald-400' : done ? 'text-white/60' : 'text-white/20'
                                }`}>{step.label}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
