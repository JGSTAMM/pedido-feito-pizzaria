import preset from '../../../../vendor/filament/filament/tailwind.config.preset'

export default {
    presets: [preset],
    content: [
        './app/Filament/**/*.php',
        './resources/views/filament/**/*.blade.php',
        './vendor/filament/**/*.blade.php',
    ],
    theme: {
        extend: {
            colors: {
                "background-dark": "#0A0A0B",
                "surface": "rgba(255,255,255,0.05)",
                "surface-hover": "rgba(255,255,255,0.08)",
                "border-subtle": "rgba(255,255,255,0.08)",
                "emerald-soft": "#10B981",
                "text-muted": "rgba(255,255,255,0.6)",
            },
            fontFamily: {
                "display": ["Work Sans", "sans-serif"],
                "sans": ["Work Sans", "sans-serif"],
            },
        },
    },
}
