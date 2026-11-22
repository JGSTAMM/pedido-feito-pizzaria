import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

import path from 'path';
import os from 'os';

function getLocalIp() {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
        if (/vEthernet|Virtual|Loopback/i.test(name)) continue;
        for (const iface of ifaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const localIp = getLocalIp();

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, 'resources/js'),
        },
    },
    build: {
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: 'vendor-react-core',
                            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                            priority: 40,
                        },
                        {
                            name: 'vendor-inertia',
                            test: /[\\/]node_modules[\\/]@inertiajs[\\/]/,
                            priority: 30,
                        },
                        {
                            name: 'vendor-three',
                            test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
                            priority: 20,
                        },
                        {
                            name: 'vendor-misc',
                            test: /[\\/]node_modules[\\/]/,
                            priority: 10,
                        },
                        {
                            name: 'customer-menu',
                            test: /[\\/]resources[\\/]js[\\/]Pages[\\/]CustomerMenu[\\/]/,
                            priority: 5,
                        },
                    ],
                },
            },
        },
    },
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx',
            ],
            refresh: true,
        }),
        tailwindcss(),
        react(),
    ],
    server: {
        host: '0.0.0.0',
        origin: `http://${localIp}:5173`,
        cors: true,
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
        hmr: {
            host: localIp,
        },
    },
});
