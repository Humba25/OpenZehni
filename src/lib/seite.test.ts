/**
 * Wacht über die Downloadseite (`site/index.html`, SPEC.md 11.5).
 *
 * **Warum eine Seite überhaupt geprüft wird.** Sie ist das Erste, was jemand
 * von Zehni sieht, und das Einzige, was auch Leute öffnen, die den Quelltext
 * nie ansehen. Zugleich wird sie selten angefasst — genau die Art Datei, in der
 * ein Fehler jahrelang stehen bleibt.
 *
 * Zwei Dinge sind hier wirklich wichtig:
 *
 * 1. **Die feste Downloadadresse.** Nur sie sorgt dafür, dass die Seite nie
 *    angefasst werden muss. Ein Link auf eine versionierte Datei wäre mit dem
 *    nächsten Release tot, und niemand würde es merken — der Knopf sähe weiter
 *    aus wie immer.
 * 2. **Keine fremden Adressen.** Eine Seite, die für Medienkompetenz wirbt und
 *    nebenbei einem Schriftanbieter oder einem Zählpixel mitteilt, wer sie
 *    aufgerufen hat, wäre ihr eigener Gegenbeweis.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SEITE = readFileSync(join(WURZEL, 'site', 'index.html'), 'utf8');

const FESTE_ADRESSE =
  'https://github.com/Humba25/OpenZehni/releases/latest/download/Zehni-Setup.exe';

describe('Downloadseite — SPEC.md 11.5', () => {
  it('führt auf die Adresse, die sich nie ändert', () => {
    expect(SEITE).toContain(FESTE_ADRESSE);
  });

  /**
   * Eine Versionsnummer im Quelltext wäre genau das, was diese Seite vermeiden
   * soll: etwas, das bei jedem Release nachgezogen werden muss. Die Nummer
   * holt sich die Seite zur Laufzeit.
   */
  it('trägt keine eingebaute Versionsnummer', () => {
    const ohneSkript = SEITE.replace(/<script[\s\S]*?<\/script>/g, '');
    const treffer = ohneSkript.match(/\b\d+\.\d+\.\d+\b/g);
    expect(treffer, `Fest eingetragen: ${treffer?.join(', ')}`).toBeNull();
  });

  /**
   * Erlaubt sind nur Adressen bei GitHub. Alles andere — Schriften, Skripte,
   * Zählpixel — hat hier nichts zu suchen.
   */
  it('lädt nichts von fremden Servern', () => {
    const adressen = [...SEITE.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]);
    expect(adressen.length, 'Gar keine Adresse gefunden — Test greift ins Leere').toBeGreaterThan(
      0,
    );

    for (const a of adressen) {
      const wirt = new URL(a).hostname;
      expect(
        wirt === 'github.com' || wirt === 'api.github.com',
        `Fremde Adresse auf der Seite: ${a}`,
      ).toBe(true);
    }
  });

  /** Kein eingebundenes Skript und kein Bild von außen. */
  it('bindet keine fremden Dateien ein', () => {
    expect(SEITE, 'externes Skript').not.toMatch(/<script[^>]+src=/i);
    expect(SEITE, 'Stylesheet von auswaerts').not.toMatch(/<link[^>]+rel=["']stylesheet/i);
    expect(SEITE, 'Bild von auswaerts').not.toMatch(/<img[^>]+src=["']https?:/i);
  });

  /**
   * Der Knopf muss auch dann etwas taugen, wenn das Skript nicht läuft — bei
   * gesperrtem JavaScript, ohne Netz oder wenn GitHub die Abfrage abweist.
   * Deshalb steht im Text von Anfang an etwas Sinnvolles.
   */
  it('sagt auch ohne Skript, wofür der Knopf gut ist', () => {
    const ohneSkript = SEITE.replace(/<script[\s\S]*?<\/script>/g, '');
    expect(ohneSkript).toContain('Zehni herunterladen');
    expect(ohneSkript).toContain('Für Windows');
  });

  /** Die Zusagen aus der Spec stehen dort, wo Eltern sie lesen. */
  it('nennt die Warnung von Windows, statt sie zu verschweigen', () => {
    expect(SEITE).toContain('Zertifikat');
    expect(SEITE.toLowerCase()).toContain('windows');
  });

  it('ist auf Deutsch ausgezeichnet', () => {
    expect(SEITE).toMatch(/<html lang="de"/);
  });
});
