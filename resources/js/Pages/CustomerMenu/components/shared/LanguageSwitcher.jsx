import { usePage, Link } from '@inertiajs/react';
import { useState } from 'react';
import { luccheseMenuTheme } from '../../theme/luccheseMenuTheme';

export default function LanguageSwitcher({ scrolled }) {
    const { props } = usePage();
    const rawLocale = props.locale || 'pt-BR';
    const currentLocale = rawLocale.replace('_', '-');
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'pt-BR', label: 'PT', flag: 'https://flagcdn.com/w40/br.png' },
        { code: 'en-US', label: 'EN', flag: 'https://flagcdn.com/w40/us.png' },
        { code: 'es-ES', label: 'ES', flag: 'https://flagcdn.com/w40/es.png' },
    ];

    const currentLang = languages.find(l => l.code === currentLocale) || languages[0];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 rounded-full transition-all border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 ${scrolled ? 'px-2 py-1.5' : 'px-3 py-2'
                    }`}
            >
                <img src={currentLang.flag} alt={currentLang.label} className="w-5 h-3.5 object-cover rounded-[2px]" />
                {!scrolled && <span className="text-[10px] font-black text-white uppercase tracking-widest">{currentLang.label}</span>}
                <span className={`material-symbols-outlined text-sm text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className={`${luccheseMenuTheme.glass} absolute right-0 mt-3 w-32 overflow-hidden rounded-2xl border border-white/10 p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200`}>
                        {languages.map((lang) => (
                            <Link
                                key={lang.code}
                                href={`/menu?locale=${lang.code}`}
                                preserveScroll
                                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 ${currentLocale === lang.code ? 'bg-primary/10 text-primary' : 'text-white/70'
                                    }`}
                            >
                                <img src={lang.flag} alt={lang.label} className="w-5 h-3.5 object-cover rounded-[2px]" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{lang.label}</span>
                                {currentLocale === lang.code && (
                                    <span className="material-symbols-outlined text-sm ml-auto">check</span>
                                )}
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
