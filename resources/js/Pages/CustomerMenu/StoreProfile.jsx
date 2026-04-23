import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { useDigitalMenuQuery } from './hooks/useDigitalMenuQuery';
import useI18n from '@/hooks/useI18n';
import BottomNav from './components/navigation/BottomNav';
import ProfileModal from './components/identity/ProfileModal';
import { luccheseMenuTheme } from './theme/luccheseMenuTheme';

export default function StoreProfile() {
    const { data: catalogData, isLoading } = useDigitalMenuQuery();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const { t } = useI18n();

    const store = catalogData?.storeSetting || {};
    const name = store.store_name || t('digital_menu.store.default_name');
    const address = store.full_address || t('digital_menu.store.address_not_found');
    const phone = store.phone || '';
    const openingHours = store.opening_hours || {};
    const paymentMethods = store.payment_methods || [];
    const customInfo = store.custom_info || '';
    const logoUrl = store.logo_url;
    const coverUrl = store.cover_url;
    const mapEmbedUrl = store.google_maps_embed_url;

    const formatPhoneForUrl = (p) => p.replace(/\D/g, '');

    const daysMap = {
        monday: t('digital_menu.days.monday'),
        tuesday: t('digital_menu.days.tuesday'),
        wednesday: t('digital_menu.days.wednesday'),
        thursday: t('digital_menu.days.thursday'),
        friday: t('digital_menu.days.friday'),
        saturday: t('digital_menu.days.saturday'),
        sunday: t('digital_menu.days.sunday')
    };

    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <main className="min-h-screen bg-[#0D0D12] text-white pb-32 relative">
            <header className={`${luccheseMenuTheme.glass} sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/5`}>
                <div className="flex items-center gap-4">
                    <Link href="/menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </Link>
                    <h1 className="text-xl font-black italic tracking-tight">{t('digital_menu.store.profile')}</h1>
                </div>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-20 relative z-10">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            ) : (
                <>
                    {/* Background Image with Gradient - Only if cover exists */}
                    {coverUrl && (
                        <div
                            className="absolute top-0 left-0 w-full h-[300px] pointer-events-none z-0"
                            style={{
                                backgroundImage: `linear-gradient(to bottom, rgba(13, 13, 18, 0.4) 0%, rgba(13, 13, 18, 1) 100%), url(${coverUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
                    )}

                    <div className="mx-auto max-w-lg px-4 py-8 space-y-6 relative z-10">
                        {/* Store Hero */}
                        <div className={`${luccheseMenuTheme.glass} rounded-3xl p-6 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                            <div className="h-24 w-24 rounded-full bg-background-dark flex items-center justify-center mb-4 ring-4 ring-primary/10 overflow-hidden shadow-2xl">
                                {logoUrl ? (
                                    <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-4xl text-primary">storefront</span>
                                )}
                            </div>
                            <h2 className="text-2xl font-black italic tracking-tight uppercase">{name}</h2>
                            <p className="text-sm font-semibold text-text-muted mt-2 max-w-[280px]">{address}</p>

                            <div className="flex gap-4 mt-6 w-full">
                                {phone && (
                                    <a
                                        href={`https://wa.me/55${formatPhoneForUrl(phone)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 py-3.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-lg"
                                    >
                                        {t('common.whatsapp')}
                                    </a>
                                )}
                                <a
                                    href={store.google_maps_place_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 py-3.5 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500/20 transition-all shadow-lg"
                                >
                                    {t('digital_menu.store.view_on_map')}
                                </a>
                            </div>
                        </div>

                        {/* Sobre Nós */}
                        {customInfo && (
                            <div className={`${luccheseMenuTheme.glass} rounded-3xl p-6 animate-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both`}>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary italic mb-4">{t('digital_menu.store.about_us')}</h3>
                                <p className="text-sm font-bold text-white/80 leading-relaxed whitespace-pre-wrap">
                                    {customInfo}
                                </p>
                            </div>
                        )}

                        {/* Schedule */}
                        <div className={`${luccheseMenuTheme.glass} rounded-3xl p-6 animate-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both`}>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary italic mb-6">{t('digital_menu.store.working_hours')}</h3>

                            <div className="space-y-4">
                                {daysOrder.map((day) => {
                                    const h = openingHours[day] || { closed: true };
                                    return (
                                        <div key={day} className="flex items-center justify-between text-sm font-bold border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                            <span className="text-white/80">{daysMap[day]}</span>
                                            {!h.closed ? (
                                                <span className="text-white font-mono">{h.open} – {h.close}</span>
                                            ) : (
                                                <span className="text-red-400/80 uppercase text-[10px] tracking-widest">{t('digital_menu.status.closed')}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className={`${luccheseMenuTheme.glass} rounded-3xl p-6 animate-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both`}>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary italic mb-6">{t('digital_menu.store.payment_methods')}</h3>

                            <div className="grid grid-cols-2 gap-3">
                                {paymentMethods.includes('pix') && (
                                    <div className="flex flex-col gap-1 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                                        <div className="flex items-center gap-2 uppercase tracking-tighter">
                                            <span className="material-symbols-outlined text-emerald-400 text-xl">qr_code_2</span>
                                            <span className="text-xs font-black text-white">PIX</span>
                                        </div>
                                        <span className="text-[9px] text-text-muted font-bold ml-7">{t('digital_menu.store.payment_online')}</span>
                                    </div>
                                )}
                                {paymentMethods.includes('credit_card') && (
                                    <div className="flex flex-col gap-1 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                                        <div className="flex items-center gap-2 uppercase tracking-tighter">
                                            <span className="material-symbols-outlined text-blue-400 text-xl">credit_card</span>
                                            <span className="text-xs font-black text-white">{t('digital_menu.checkout.payment_options.credit_card')}</span>
                                        </div>
                                        <span className="text-[9px] text-text-muted font-bold ml-7">{t('digital_menu.store.payment_online')}</span>
                                    </div>
                                )}
                                {paymentMethods.includes('debit_card') && (
                                    <div className="flex flex-col gap-1 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                                        <div className="flex items-center gap-2 uppercase tracking-tighter">
                                            <span className="material-symbols-outlined text-blue-400 text-xl">price_change</span>
                                            <span className="text-xs font-black text-white">{t('digital_menu.checkout.payment_options.debit_card')}</span>
                                        </div>
                                        <span className="text-[9px] text-text-muted font-bold ml-7">{t('digital_menu.store.payment_online')}</span>
                                    </div>
                                )}
                                {paymentMethods.includes('cash') && (
                                    <div className="flex flex-col gap-1 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                                        <div className="flex items-center gap-2 uppercase tracking-tighter">
                                            <span className="material-symbols-outlined text-yellow-400 text-xl">payments</span>
                                            <span className="text-xs font-black text-white">{t('digital_menu.checkout.payment_options.cash')}</span>
                                        </div>
                                        <span className="text-[9px] text-text-muted font-bold ml-7">{t('digital_menu.store.payment_delivery')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Google Maps Preview */}
                        {mapEmbedUrl && (
                            <div className={`${luccheseMenuTheme.glass} rounded-3xl p-6 animate-in slide-in-from-bottom-4 duration-500 delay-250 fill-mode-both`}>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary italic mb-6">{t('digital_menu.store.location')}</h3>
                                <div className="rounded-2xl overflow-hidden h-64 border border-white/5 shadow-2xl">
                                    <iframe
                                        src={mapEmbedUrl}
                                        className="w-full h-full border-0"
                                        allowFullScreen=""
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    ></iframe>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <BottomNav onOpenProfile={() => setIsProfileModalOpen(true)} />

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSuccess={() => setIsProfileModalOpen(false)}
            />
        </main>
    );
}
