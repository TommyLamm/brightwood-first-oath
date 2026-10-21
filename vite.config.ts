import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Phaser is ~1.2 MB on its own; keeping it in a separate chunk lets browsers cache it
        // across game updates and keeps the game chunk small.
        manualChunks(id: string) {
          return id.includes('node_modules/phaser') ? 'phaser' : undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1300,
  },
});
