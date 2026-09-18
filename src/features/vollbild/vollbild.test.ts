/**
 * Wacht über das Vollbild (SPEC.md 12.2).
 *
 * Zwei Dinge lassen sich hier prüfen, und beide fallen sonst erst dem Kind auf:
 *
 * 1. **Die Berechtigungen.** Der Knopf ruft `setFullscreen` und `isFullscreen`
 *    am Fenster auf. Stehen die passenden Einträge nicht in
 *    `capabilities/default.json`, lehnt Tauri den Aufruf zur Laufzeit ab — kein
 *    Typfehler, kein Bundlerfehler, nur ein toter Knopf. Genau diese Art Fehler
 *    hat am 2026-09-15 schon einmal Zeit gekostet.
 *
 * 2. **Der Weg hinaus.** Während einer Übung gibt es keine Kopfzeile. Wird der
 *    Notausgang aus `App.tsx` entfernt, sitzt man im Vollbild fest. Deshalb
 *    liest dieser Test die Quelle und besteht darauf, dass er dort steht.
 *
 * Der Haken am zweiten Test: Er prüft Text, nicht Verhalten. Er merkt, wenn
 * jemand den Knopf herausnimmt, aber nicht, ob er sichtbar ist. Das bleibt eine
 * Sache fürs Ausprobieren — er ist eine Erinnerung, kein Beweis.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..', '..', '..');

describe('Vollbild — SPEC.md 12.2', () => {
  it('hat die Fensterrechte, die der Knopf braucht', () => {
    const roh = readFileSync(join(WURZEL, 'src-tauri', 'capabilities', 'default.json'), 'utf8');
    const rechte = (JSON.parse(roh) as { permissions: string[] }).permissions;

    expect(rechte).toContain('core:window:allow-set-fullscreen');
    expect(rechte).toContain('core:window:allow-is-fullscreen');
  });

  it('nimmt sich nicht mehr Rechte am Fenster als diese beiden', () => {
    const roh = readFileSync(join(WURZEL, 'src-tauri', 'capabilities', 'default.json'), 'utf8');
    const rechte = (JSON.parse(roh) as { permissions: string[] }).permissions;

    const amFenster = rechte.filter((r) => r.startsWith('core:window:'));
    expect(amFenster.sort()).toEqual([
      'core:window:allow-is-fullscreen',
      'core:window:allow-set-fullscreen',
    ]);
  });

  it('zeigt den Ausstieg genau dann, wenn keine Kopfzeile da ist', () => {
    const app = readFileSync(join(WURZEL, 'src', 'app', 'App.tsx'), 'utf8');
    expect(app).toContain('vollbild.an && !zeigtKopfzeile');
    expect(app).toContain('<VollbildAusstieg');
  });

  it('belegt Escape nicht — die Taste bedeutet in den Übungen etwas anderes', () => {
    const haken = readFileSync(join(HIER, 'useVollbild.ts'), 'utf8');
    expect(haken).toContain("'F11'");
    expect(haken).not.toContain("'Escape'");
  });

  /**
   * Der Grund steht ausführlich im Haken: Acht Bildschirme hören ebenfalls am
   * `window` mit, und mehrere reagieren auf *jede* Taste. Ohne Capture-Phase
   * und `stopPropagation` setzt `F11` nebenbei die pausierte Lektion fort.
   */
  it('fängt F11 ab, bevor die Bildschirme sie sehen', () => {
    const haken = readFileSync(join(HIER, 'useVollbild.ts'), 'utf8');
    expect(haken).toContain("window.addEventListener('keydown', onKeyDown, true)");
    expect(haken).toContain('stopPropagation');
  });
});
