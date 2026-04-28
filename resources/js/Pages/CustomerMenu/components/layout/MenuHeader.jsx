import React from 'react';
import { Link } from '@inertiajs/react';
import LanguageSwitcher from '../shared/LanguageSwitcher';

export default function MenuHeader({ storeSetting, t, todayHours, dynamicHoursSummary, scrolled }) {
    return (
        <>
            {/* Expanded Header - Scrolls with content */}
            <header className="relative h-auto bg-[#0D0D12] px-6 pt-12 pb-8 flex flex-col items-center text-center gap-6 border-b border-white/5">
                <div className="flex flex-col items-center gap-6 w-full">
                    {/* Logo Section */}
                    <div className="relative rounded-[1.2rem] border-2 border-white/10 bg-white shadow-2xl overflow-hidden shrink-0 w-24 h-24">
                        {storeSetting?.logo_url ? (
                            <img src={storeSetting.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-4xl">restaurant</span>
                            </div>
                        )}
                    </div>

                    {/* Title & Status */}
                    <div className="w-full">
                        <h1 className="font-black text-white uppercase tracking-tight italic text-[1.75rem] leading-tight mb-2">
                            {storeSetting?.store_name || t('digital_menu.store.default_name')}
                        </h1>
                        <div className="flex items-center justify-center text-slate-400 text-sm">
                            <div className="flex items-center gap-2">
                                {storeSetting?.is_open ? (
                                    <div className="flex items-center gap-2 rounded-full font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 text-[10px]">
                                        <span className="rounded-full bg-emerald-400 animate-pulse h-1.5 w-1.5"></span>
                                        {t('digital_menu.status.open')}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 rounded-full font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 text-[10px]">
                                        <span className="rounded-full bg-red-500 animate-pulse h-1.5 w-1.5"></span>
                                        {t('digital_menu.status.closed')}
                                    </div>
                                )}
                                <span className="opacity-30">•</span>
                                <span className="font-bold text-white/60">
                                    {dynamicHoursSummary || t('digital_menu.home.hours_not_available')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 w-full pt-2">
                        <p className="text-sm font-bold text-white/40 max-w-[240px] mx-auto leading-relaxed">
                            {t('digital_menu.header.subtitle')}
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <Link
                                href="/menu/store-profile"
                                className="flex items-center justify-center transition-all group active:scale-95 shadow-xl px-8 py-3.5 rounded-full bg-white/[0.03] border border-white/10 text-white"
                            >
                                <span className="material-symbols-outlined text-primary text-lg">info</span>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] ml-3">{t('digital_menu.store.profile')}</span>
                            </Link>
                            <LanguageSwitcher scrolled={false} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Compact Header - Pops in on scroll */}
            <div
                className={`fixed top-0 left-0 right-0 z-[100] h-[72px] bg-[#0D0D12]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl flex items-center px-4 transition-all duration-300 transform 
                ${scrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
            >
                <div className="flex items-center w-full">
                    <div className="relative rounded-xl border border-white/10 bg-white overflow-hidden shrink-0 w-10 h-10">
                        {storeSetting?.logo_url ? (
                            <img src={storeSetting.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-lg">restaurant</span>
                            </div>
                        )}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                        <h1 className="font-black text-white uppercase tracking-tight italic text-sm truncate">
                            {storeSetting?.store_name}
                        </h1>
                        <div className="flex items-center gap-2 text-[8px] font-black uppercase">
                            {storeSetting?.is_open ? (
                                <div className="flex items-center gap-1 text-emerald-400">
                                    <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse"></span>
                                    {t('digital_menu.status.open')}
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-red-500">
                                    <span className="h-1 w-1 rounded-full bg-red-500 animate-pulse"></span>
                                    {t('digital_menu.status.closed')}
                                </div>
                            )}
                            <span className="opacity-30 text-white">•</span>
                            <span className="text-white/50">{todayHours}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/menu/store-profile"
                            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-primary text-xl">info</span>
                        </Link>
                        <LanguageSwitcher scrolled={true} />
                    </div>
                </div>
            </div>
        </>
    );
}
