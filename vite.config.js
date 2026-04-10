import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        if (id.includes('/resources/js/Pages/CustomerMenu/')) {
                            return 'customer-menu';
                        }

                        return undefined;
                    }

                    if (
                        id.includes('/node_modules/react/')
                        || id.includes('/node_modules/react-dom/')
                        || id.includes('/node_modules/scheduler/')
                    ) {
                        return 'vendor-react-core';
                    }

                    if (id.includes('/node_modules/@inertiajs/')) {
                        return 'vendor-inertia';
                    }

                    if (id.includes('/node_modules/three/') || id.includes('/node_modules/@react-three/')) {
                        return 'vendor-three';
                    }

                    return 'vendor-misc';
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
        host: '127.0.0.1',
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
        hmr: {
            host: '127.0.0.1',
        },
    },
});
