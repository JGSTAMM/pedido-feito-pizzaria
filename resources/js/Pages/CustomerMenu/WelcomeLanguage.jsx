import { Head, usePage } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';
import { luccheseMenuTheme } from './theme/luccheseMenuTheme';

export default function WelcomeLanguage({ availableLocales = [], menuUrl = '/menu' }) {
    const { t } = useI18n();
    const { storeSetting } = usePage().props;

    const localeMap = {
        'pt-BR': { label: 'Português', img: 'https://flagcdn.com/w40/br.png' },
        'es-ES': { label: 'Español', img: 'https://flagcdn.com/w40/es.png' },
        'en-US': { label: 'English', img: 'https://flagcdn.com/w40/us.png' },
    };

    const bgImage = storeSetting?.cover_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop';
    const logoImage = storeSetting?.logo_url;
    const storeName = storeSetting?.store_name || 'Pedido Feito';

    return (
        <>
            <Head title={t('digital_menu.welcome.title')} />

            <main
                className="min-h-screen bg-[#0D0D12] text-white relative flex flex-col justify-end md:justify-center pb-16 md:pb-0 px-6"
                style={{
                    backgroundImage: `linear-gradient(to top, rgba(13, 13, 18, 1) 0%, rgba(13, 13, 18, 0.6) 50%, rgba(13, 13, 18, 0.1) 100%), url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>

                <div className="relative z-10 animate-in fade-in zoom-in-95 duration-1000 w-full max-w-sm mx-auto">
                    <div className="flex flex-col items-center text-center mb-12">
                        {logoImage ? (
                            <img src={logoImage} alt={storeName} className="h-32 w-32 rounded-full border-[3px] border-white/20 shadow-2xl mb-6 object-cover transition-transform hover:scale-105 duration-500" />
                        ) : (
                            <div className="h-32 w-32 rounded-full bg-primary/20 border-[3px] border-primary/30 flex items-center justify-center mb-6 backdrop-blur-md">
                                <span className="material-symbols-outlined text-6xl text-primary">restaurant</span>
                            </div>
                        )}
                        <h1 className="text-4xl md:text-5xl font-black italic tracking-tight drop-shadow-xl text-white text-balance leading-none">{storeName}</h1>
                        <p className="mt-3 text-sm font-bold text-white/80 drop-shadow-md">
                            {t('digital_menu.welcome.subtitle')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {availableLocales.map((localeOption, idx) => (
                            <a
                                key={localeOption.code}
                                href={`${menuUrl}?lang=${encodeURIComponent(localeOption.code)}`}
                                className={`${luccheseMenuTheme.glass} group flex items-center justify-between rounded-[2rem] p-5 hover:border-primary/50 hover:bg-white/10 transition-all transform hover:-translate-y-1 active:scale-95 shadow-lg relative overflow-hidden`}
                                style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                                <div className="flex items-center gap-4 relative z-10">
                                    <img src={localeMap[localeOption.code]?.img} alt={localeOption.code} className="w-8 h-6 object-cover rounded-sm shadow-sm" />
                                    <span className="font-black tracking-widest uppercase text-xs text-white">{localeMap[localeOption.code]?.label || localeOption.code}</span>
                                </div>
                                <span className="material-symbols-outlined text-white/30 group-hover:text-primary transition-colors relative z-10">east</span>
                            </a>
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}
