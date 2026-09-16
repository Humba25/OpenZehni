/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Farben laufen ueber CSS-Variablen, damit der Themewechsel
        // (hell/dunkel/kontrastreich) ohne Neuladen funktioniert (SPEC.md 3).
        grund: 'rgb(var(--farbe-grund) / <alpha-value>)',
        flaeche: 'rgb(var(--farbe-flaeche) / <alpha-value>)',
        rand: 'rgb(var(--farbe-rand) / <alpha-value>)',
        text: 'rgb(var(--farbe-text) / <alpha-value>)',
        gedaempft: 'rgb(var(--farbe-gedaempft) / <alpha-value>)',
        akzent: 'rgb(var(--farbe-akzent) / <alpha-value>)',
        richtig: 'rgb(var(--farbe-richtig) / <alpha-value>)',
        falsch: 'rgb(var(--farbe-falsch) / <alpha-value>)',
        korrigiert: 'rgb(var(--farbe-korrigiert) / <alpha-value>)',
      },
      fontFamily: {
        // Keine Web-Fonts, keine CDN-Einbindung (ARCHITEKTUR.md). Bis eigene
        // Schriften mitgeliefert werden, die systemeigenen benutzen.
        lesen: ['Segoe UI', 'system-ui', 'sans-serif'],
        tippen: ['Consolas', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
