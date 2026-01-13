import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        host: '0.0.0.0', // Allow connections from any network interface
        proxy: {
            '/api': {
                target: 'http://localhost:5000', // Proxy runs locally
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://localhost:5000', // Proxy runs locally
                changeOrigin: true,
                ws: true,
            },
        },
    },
});
