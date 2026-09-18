/**
 * Wacht darüber, dass die Modultexte für **Kinder** lesbar sind.
 *
 * **Woher der Test kommt.** Der Nutzer hat am 2026-09-18 darauf hingewiesen,
 * dass die Einheiten aus „Medienkompetenz" und „Lernen lernen" in einfacher
 * Sprache sein müssen, sobald eine Altersstufe unter vierzehn gewählt ist.
 *
 * Nachgemessen gab ihm das recht: zehn bis zwölf Wörter je Satz im Schnitt,
 * einzelne Sätze mit einundzwanzig, im Textmodul einer mit **achtunddreißig**.
 * `SPEC.md` 9.8 erlaubt für `A1` sechs bis zwölf.
 *
 * **Warum ein Test und nicht Sorgfalt.** „Einfache Sprache" ist sonst eine
 * Geschmacksfrage, über die man beim Schreiben jedes Mal neu entscheidet — und
 * beim dritten Text nachlässig wird. Satzlänge ist messbar. Sie ist nicht
 * alles, aber sie ist das, was sich prüfen lässt.
 */

import { describe, it, expect } from 'vitest';
import { alleModule, bloeckeFuer, saetze, woerter, MAX_WOERTER_JE_SATZ } from './module';

const alleEinheiten = alleModule().flatMap((m) => m.units.map((u) => ({ modul: m.id, u })));

describe('Modultexte in einfacher Sprache — SPEC.md 9.8', () => {
  it('kennt alle siebzehn Einheiten', () => {
    expect(alleEinheiten.length).toBeGreaterThanOrEqual(17);
  });

  /**
   * Der eigentliche Wächter. Für `A1` und `A2` darf kein Satz länger sein als
   * die Stufe erlaubt — geprüft an **jeder** Einheit, nicht an einer Auswahl.
   */
  for (const stufe of ['A1', 'A2'] as const) {
    it(`hält für ${stufe} die Satzlänge aus SPEC.md 9.8 ein`, () => {
      const zuLang: string[] = [];

      for (const { modul, u } of alleEinheiten) {
        for (const block of bloeckeFuer(u, stufe)) {
          for (const satz of saetze(block)) {
            const n = woerter(satz).length;
            if (n > MAX_WOERTER_JE_SATZ[stufe]!) {
              zuLang.push(`${modul}/${u.id}: ${n} Wörter — „${satz.slice(0, 70)}…"`);
            }
          }
        }
      }

      expect(
        zuLang,
        `Für ${stufe} sind höchstens ${MAX_WOERTER_JE_SATZ[stufe]} Wörter je Satz erlaubt:\n` +
          zuLang.join('\n'),
      ).toEqual([]);
    });
  }

  /**
   * `A3` bekommt die ursprüngliche Fassung. Auch die hat eine Grenze — ein
   * Satz mit achtunddreißig Wörtern ist für niemanden gut.
   */
  it('hält auch für A3 eine Obergrenze ein', () => {
    const zuLang: string[] = [];
    for (const { modul, u } of alleEinheiten) {
      for (const block of bloeckeFuer(u, 'A3')) {
        for (const satz of saetze(block)) {
          const n = woerter(satz).length;
          if (n > MAX_WOERTER_JE_SATZ.A3!) {
            zuLang.push(`${modul}/${u.id}: ${n} Wörter — „${satz.slice(0, 70)}…"`);
          }
        }
      }
    }
    expect(zuLang, zuLang.join('\n')).toEqual([]);
  });

  /**
   * Eine fehlende einfache Fassung darf nie einen leeren Bildschirm erzeugen.
   * Dann steht eben die ursprüngliche da — schlechter als eine Übersetzung,
   * aber besser als nichts.
   */
  it('gibt für jede Altersstufe und jede Einheit Text aus', () => {
    for (const stufe of ['A1', 'A2', 'A3'] as const) {
      for (const { modul, u } of alleEinheiten) {
        const bloecke = bloeckeFuer(u, stufe);
        expect(bloecke.length, `${modul}/${u.id}/${stufe}`).toBeGreaterThan(0);
        for (const b of bloecke) expect(b.trim().length, `${modul}/${u.id}`).toBeGreaterThan(0);
      }
    }
  });

  /** `A3` bekommt immer die ursprüngliche Fassung, auch wenn es eine einfache gibt. */
  it('gibt A3 die ausführliche Fassung', () => {
    for (const { u } of alleEinheiten) {
      expect(bloeckeFuer(u, 'A3')).toEqual(u.bloecke);
    }
  });
});
