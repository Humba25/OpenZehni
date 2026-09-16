/**
 * Wacht über zwei Layoutfehler, die man auf einem großen Bildschirm nie sieht.
 *
 * **Woher der Test kommt.** Am 2026-09-16 lag die Auswertung nach einer Runde
 * über der Kopfzeile, und die Knöpfe „Nochmal" und „Weiter" standen unterhalb
 * des Fensterrands — nicht erreichbar. Zwei Ursachen, beide unsichtbar, solange
 * das Fenster hoch genug ist:
 *
 * 1. Der Inhaltsbereich in `App.tsx` hatte keinen Scrollbereich. Was nicht
 *    hineinpasst, wächst dann aus dem Kasten heraus und malt über alles, was
 *    darüber liegt.
 * 2. `h-full` zusammen mit `justify-center` zentriert in **genau** einer
 *    Fensterhöhe. Ist der Inhalt höher, drückt die Zentrierung ihn nach oben
 *    *und* nach unten hinaus — der obere Teil ist dann nicht einmal
 *    wegscrollbar, weil er über dem Anfang des Scrollbereichs liegt.
 *    `min-h-full` macht dasselbe, wächst aber mit.
 *
 * Zielhardware sind alte Laptops mit kleinen Bildschirmen (ARCHITEKTUR.md,
 * Zielgruppe). Dort ist das der Normalfall, nicht der Sonderfall.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

function* tsxDateien(pfad: string): Generator<string> {
  for (const eintrag of readdirSync(pfad)) {
    const voll = join(pfad, eintrag);
    if (statSync(voll).isDirectory()) yield* tsxDateien(voll);
    else if (voll.endsWith('.tsx')) yield voll;
  }
}

/** Jede `className="…"`-Zeichenkette der Datei. */
function klassenListen(quelle: string): readonly string[] {
  return [...quelle.matchAll(/className="([^"]*)"/g)].map((m) => m[1] ?? '');
}

const hatKlasse = (liste: string, klasse: string): boolean => liste.split(/\s+/).includes(klasse);

describe('Layout — nichts wächst aus dem Fenster heraus', () => {
  it('gibt dem Inhaltsbereich der App einen Scrollbereich', () => {
    const app = readFileSync(join(SRC, 'app', 'App.tsx'), 'utf8');
    const inhalt = klassenListen(app).find(
      (k) => hatKlasse(k, 'flex-1') && hatKlasse(k, 'min-h-0'),
    );
    expect(inhalt, 'Der Inhaltsbereich (min-h-0 flex-1) ist nicht mehr auffindbar.').toBeDefined();
    expect(
      hatKlasse(inhalt ?? '', 'overflow-y-auto'),
      'Der Inhaltsbereich braucht `overflow-y-auto`. Sonst malt ein zu hoher ' +
        'Bildschirm über die Kopfzeile, statt scrollbar zu werden.',
    ).toBe(true);
  });

  it('zentriert nie mit `h-full` statt `min-h-full`', () => {
    const treffer: string[] = [];
    for (const datei of tsxDateien(SRC)) {
      for (const liste of klassenListen(readFileSync(datei, 'utf8'))) {
        if (hatKlasse(liste, 'h-full') && hatKlasse(liste, 'justify-center')) {
          treffer.push(`${relative(SRC, datei)}: "${liste}"`);
        }
      }
    }
    expect(
      treffer,
      'h-full + justify-center drückt zu hohen Inhalt aus dem Fenster, oben wie ' +
        'unten. `min-h-full` zentriert genauso, wächst aber mit:\n' +
        treffer.join('\n'),
    ).toEqual([]);
  });
});
