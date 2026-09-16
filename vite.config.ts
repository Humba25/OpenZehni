import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Tauri stellt den Dev-Server auf einem festen Port bereit und erwartet ihn dort.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@content': fileURLToPath(new URL('./content', import.meta.url)),
    },
  },
  // Tauri gibt eigene Fehlermeldungen aus; Vite soll nicht dazwischenfunken.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    watch: {
      // src-tauri/target wird gigantisch. Wer das beobachtet, legt den Rechner lahm.
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    // Zielhardware sind alte Laptops mit der in Windows mitgelieferten WebView2.
    // Chromium 110 ist die untere Grenze laut SPEC.md 3.1.
    target: 'chrome110',
    minify: 'esbuild',
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    // Vitests Standardgrenze liegt bei 5 Sekunden. Die Golden Tests pruefen
    // alle 25 Lektionen gegen hunderte erzeugter Texte und brauchen normal
    // rund 2,5 Sekunden -- unter Last (etwa waehrend parallel ein Rust-Build
    // laeuft) aber ein Vielfaches davon. Am 2026-09-14 sind sie deshalb
    // zweimal grundlos rot geworden.
    //
    // Ein Test, der je nach Rechnerauslastung faellt, ist schlimmer als ein
    // langsamer: Er verleitet dazu, ihn beim naechsten Mal zu ignorieren.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
