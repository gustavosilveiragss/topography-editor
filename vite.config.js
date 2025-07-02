import { defineConfig } from 'vite';

export default defineConfig({
    base: '/topography-editor/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: './index.html',
            },
        },
    },
    server: {
        open: true,
    },
    publicDir: 'public',
});
