import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Required: expose Pusher globally before Echo instantiates
window.Pusher = Pusher;

/**
 * Laravel Echo — WebSocket client using the Reverb broadcaster.
 * This file is imported once in app.jsx so Echo is globally available
 * on window.Echo throughout the entire React frontend.
 */
window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});
