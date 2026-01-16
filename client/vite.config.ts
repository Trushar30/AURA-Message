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
                target: 'http://10.166.206.112:5000', // Backend server IP
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://10.166.206.112:5000', // Backend server IP
                changeOrigin: true,
                ws: true,
            },
        },
    },
});
