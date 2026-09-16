/**
 * Wacht darüber, dass eine **ausgelieferte Migration nie verändert wird**
 * (`ARCHITEKTUR.md`, Architekturregel 3).
 *
 * **Warum es diesen Test gibt.** Am 2026-09-16 hat ein Skript, das im ganzen
 * Projekt einen Dateinamen in Kommentaren austauschte, dabei auch die
 * Kommentare in allen fünf Migrationen angefasst. Am SQL änderte sich nichts —
 * an der Prüfsumme schon.
 *
 * SQLite merkt sich über `sqlx` zu jeder angewandten Migration eine Prüfsumme.
 * Weicht der Text später ab, verweigert der Migrator **den ganzen Satz**: Keine
 * neue Migration läuft mehr, und die App kann nichts mehr speichern — bei
 * jedem, der die alte Fassung schon einmal ausgeführt hatte. Genau so ist es
 * gekommen, und es war in einer ausgelieferten Version.
 *
 * Auffällig war daran nichts: Die App startete, kein Test schlug an, kein
 * Protokolleintrag. Sichtbar wurde es erst daran, dass eine neue Migration
 * wortlos nicht ankam.
 *
 * Deshalb steht die Prüfsumme jeder Migration in
 * `src-tauri/migrations/PRUEFSUMMEN.txt` und wird hier verglichen.
 */

import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const MIGRATIONEN = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'src-tauri',
  'migrations',
);

/** Die hinterlegten Prüfsummen: Dateiname → SHA-256. */
function hinterlegt(): Map<string, string> {
  const inhalt = readFileSync(join(MIGRATIONEN, 'PRUEFSUMMEN.txt'), 'utf8');
  const eintraege = new Map<string, string>();
  for (const zeile of inhalt.split('\n')) {
    const sauber = zeile.trim();
    if (sauber.length === 0 || sauber.startsWith('#')) continue;
    const [datei, summe] = sauber.split(/\s+/);
    if (datei && summe) eintraege.set(datei, summe);
  }
  return eintraege;
}

function pruefsumme(datei: string): string {
  return createHash('sha256')
    .update(readFileSync(join(MIGRATIONEN, datei)))
    .digest('hex');
}

const dateien = readdirSync(MIGRATIONEN)
  .filter((f) => f.endsWith('.sql'))
  .sort();

describe('Ausgelieferte Migrationen — ARCHITEKTUR.md, Architekturregel 3', () => {
  it('findet überhaupt Migrationen', () => {
    expect(dateien.length).toBeGreaterThan(0);
  });

  /**
   * Der eigentliche Wächter. Schlägt er an, ist die Frage **nicht**, ob die
   * Änderung harmlos aussieht — ein Kommentar zählt genauso wie eine Spalte.
   * Die Änderung gehört rückgängig gemacht und in eine **neue** Migration.
   */
  it('hat keine bestehende Migration verändert', () => {
    const soll = hinterlegt();
    for (const datei of dateien) {
      const erwartet = soll.get(datei);
      if (erwartet === undefined) continue; // neue Migration, siehe naechster Test
      expect(
        pruefsumme(datei),
        `${datei} wurde geändert. Eine ausgelieferte Migration wird nie angefasst — ` +
          `auch nicht im Kommentar. Änderung zurücknehmen und eine neue Migration anlegen.`,
      ).toBe(erwartet);
    }
  });

  /**
   * Eine neue Migration ohne Eintrag wäre ungeschützt: Sie ließe sich später
   * unbemerkt ändern. Der Eintrag ist eine bewusste Handlung — genau wie das
   * Ausliefern.
   */
  it('hat für jede Migration eine hinterlegte Prüfsumme', () => {
    const soll = hinterlegt();
    for (const datei of dateien) {
      expect(
        soll.has(datei),
        `Für ${datei} fehlt die Prüfsumme in PRUEFSUMMEN.txt. ` +
          `Zeile ergänzen: ${datei}  ${pruefsumme(datei)}`,
      ).toBe(true);
    }
  });

  /** Eine hinterlegte Migration darf nicht verschwinden. */
  it('hat keine Migration entfernt', () => {
    const vorhanden = new Set(dateien);
    for (const datei of hinterlegt().keys()) {
      expect(vorhanden.has(datei), `${datei} fehlt, ist aber ausgeliefert worden.`).toBe(true);
    }
  });

  /**
   * Jede Migration muss in `lib.rs` registriert sein, sonst läuft sie nie.
   * Das ist der zweite Weg, auf dem eine Migration lautlos ausfällt.
   */
  it('registriert jede Migration auf der Rust-Seite', () => {
    const libRs = readFileSync(join(MIGRATIONEN, '..', 'src', 'lib.rs'), 'utf8');
    for (const datei of dateien) {
      expect(libRs, `${datei} ist in lib.rs nicht registriert.`).toContain(datei);
    }
  });
});
