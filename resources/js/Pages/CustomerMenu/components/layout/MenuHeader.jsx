import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from '@inertiajs/react';
import LanguageSwitcher from '../shared/LanguageSwitcher';

/** Duration (ms) each story is displayed before auto-advancing. */
const STORY_DURATION = 8000;

/**
 * Instagram-style progress bars at the top of the header.
 * Each story gets a thin line; the active one animates its fill.
 */
function StoryProgressBars({ stories, activeIndex, progress }) {
    return (
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-30">
            {stories.map((_, i) => (
                <div key={i} className="flex-1 h-[2.5px] rounded-full bg-white/25 overflow-hidden">
                    <div
                        className="h-full bg-white rounded-full transition-[width] duration-100 ease-linear"
                        style={{
                            width: i < activeIndex ? '100%' : i === activeIndex ? `${progress}%` : '0%'
                        }}
                    />
                </div>
            ))}
        </div>
    );
}

/**
 * Renders a single media element (video or image).
 * - `isAmbient=true`  → blurred background fill, desktop-only (YouTube Shorts edge effect).
 * - `isAmbient=false` → primary media: `object-cover` on mobile, `object-contain` on desktop.
 */
function StoryMedia({ url, type, isAmbient, onMediaLoad, isActive = true }) {
    let className = isAmbient
        ? "absolute inset-0 w-full h-full object-cover blur-[120px] opacity-40 scale-125 z-0 hidden md:block"
        : "absolute inset-0 w-full h-full object-cover md:object-contain";

    if (!isAmbient) {
        className += isActive 
            ? " z-[1] opacity-100 transition-opacity duration-500" 
            : " z-0 opacity-0 pointer-events-none";
    }

    const videoRef = useRef(null);

    const handleVideoRef = (el) => {
        videoRef.current = el;
        if (el && el.readyState >= 3 && onMediaLoad) {
            onMediaLoad();
        }
    };

    useEffect(() => {
        if (type === 'video' && videoRef.current) {
            if (isActive) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    }, [isActive, type]);

    if (type === 'video') {
        return (
            <video
                ref={handleVideoRef}
                src={url}
                loop
                muted
                playsInline
                className={className}
                onCanPlay={onMediaLoad}
            />
        );
    }

    return (
        <img 
            src={url} 
            alt="Story" 
            className={className} 
            onLoad={onMediaLoad} 
        />
    );
}

export default function MenuHeader({ storeSetting, t, todayHours, dynamicHoursSummary, scrolled }) {
    // Extract stories from store settings
    const stories = useMemo(() => {
        if (!storeSetting?.story_media || !Array.isArray(storeSetting.story_media)) return [];
        return storeSetting.story_media;
    }, [storeSetting?.story_media]);

    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [loadedStatus, setLoadedStatus] = useState({});
    const hasStories = stories.length > 0;

    const isMediaLoaded = loadedStatus[activeIndex] || false;

    const handleMediaLoad = (index) => {
        setLoadedStatus(prev => ({ ...prev, [index]: true }));
    };

    useEffect(() => {
        if (!hasStories || !isMediaLoaded) return;

        const tick = 100; // ms between updates
        const increment = (tick / STORY_DURATION) * 100;

        const interval = setInterval(() => {
            setProgress(prev => {
                const next = prev + increment;
                if (next >= 100) {
                    // Single story: fill bar and hold. Multiple: cycle.
                    if (stories.length > 1) {
                        setActiveIndex(i => (i + 1) % stories.length);
                        return 0;
                    }
                    return 100;
                }
                return next;
            });
        }, tick);

        return () => clearInterval(interval);
    }, [hasStories, stories.length, isMediaLoaded]);

    const activeStory = stories[activeIndex];

    return (
        <>
            {/* Expanded Header - Scrolls with content */}
            <header className={`relative bg-[#0D0D12] px-6 pt-12 pb-8 flex flex-col items-center text-center gap-6 border-b border-white/5 overflow-hidden ${hasStories ? 'min-h-[300px]' : ''}`}>

                {/* ── Stories Background ────────────────────────── */}
                {hasStories && (
                    <>
                        {/* Ambient Backdrop — blurred fill for desktop vertical video edges */}
                        <StoryMedia key={`ambient-${activeStory.url}`} url={activeStory.url} type={activeStory.type} isAmbient={true} isActive={true} />

                        {/* Primary Story Media — pre-rendered and hidden until active */}
                        {stories.map((story, idx) => (
                            <StoryMedia 
                                key={`primary-${story.url}-${idx}`} 
                                url={story.url} 
                                type={story.type} 
                                isAmbient={false} 
                                isActive={idx === activeIndex}
                                onMediaLoad={() => handleMediaLoad(idx)} 
                            />
                        ))}

                        {/* Loading Spinner */}
                        {!isMediaLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center z-[3]">
                                <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin backdrop-blur-sm" />
                            </div>
                        )}

                        {/* Light gradient — food stays appetizing, text stays readable */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0D0D12] z-[2]" />

                        {/* Story Progress Bars */}
                        <StoryProgressBars stories={stories} activeIndex={activeIndex} progress={progress} />
                    </>
                )}

                {/* ── Header Content ───────────────────────────── */}
                <div className="flex flex-col items-center gap-6 w-full z-20 relative">
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
