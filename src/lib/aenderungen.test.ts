/**
 * Wacht über das Änderungsprotokoll (SPEC.md 11.4).
 *
 * Zwei Dinge, die sonst niemandem auffallen:
 *
 * 1. **Versionen sind keine Zeichenketten.** `0.1.10` ist größer als `0.1.9`,
 *    alphabetisch aber kleiner. Beim ersten zweistelligen Teil würde eine
 *    naive Sortierung die Liste verdrehen — und niemand käme auf die Idee,
 *    danach zu suchen.
 * 2. **Kein Eintrag darf vor seiner Zeit sichtbar sein.** Die Texte entstehen,
 *    während gebaut wird. Jemandem zu erzählen, was in einer Version steckt,
 *    die er nicht hat, wäre die verwirrendste Art, diese Liste zu füllen.
 */

import { describe, it, expect } from 'vitest';
import {
  alleAenderungen,
  aenderungenBis,
  eintragFuer,
  datumLesbar,
  versionKleinerGleich,
} from './aenderungen';

describe('versionKleinerGleich', () => {
  it('vergleicht zahlenweise, nicht alphabetisch', () => {
    expect(versionKleinerGleich('0.1.9', '0.1.10')).toBe(true);
    expect(versionKleinerGleich('0.1.10', '0.1.9')).toBe(false);
  });

  it('hält dieselbe Version für kleinergleich', () => {
    expect(versionKleinerGleich('0.2.0', '0.2.0')).toBe(true);
  });

  it('achtet auf die vorderen Stellen zuerst', () => {
    expect(versionKleinerGleich('0.9.9', '1.0.0')).toBe(true);
    expect(versionKleinerGleich('1.0.0', '0.9.9')).toBe(false);
  });

  it('kommt mit fehlenden Stellen zurecht', () => {
    expect(versionKleinerGleich('1.0', '1.0.0')).toBe(true);
    expect(versionKleinerGleich('1.0.1', '1.0')).toBe(false);
  });
});

describe('aenderungenBis', () => {
  it('lässt weg, was es noch nicht gibt', () => {
    const sichtbar = aenderungenBis('0.1.9');
    expect(sichtbar.some((a) => a.version === '0.1.9')).toBe(true);
    expect(sichtbar.some((a) => a.version === '0.2.0')).toBe(false);
  });

  it('zeigt alles, wenn die Version unbekannt ist', () => {
    expect(aenderungenBis(null)).toEqual(alleAenderungen());
  });
});

describe('eintragFuer', () => {
  it('findet den Eintrag zur laufenden Version', () => {
    expect(eintragFuer('0.1.9')?.version).toBe('0.1.9');
  });

  /**
   * Eine Version ohne eigenen Eintrag darf nicht auf einen leeren Bildschirm
   * führen. Gezeigt wird dann der neueste, den es zu dieser Version schon gibt
   * — nie ein späterer.
   */
  it('fällt auf den neuesten zurück, der schon ausgeliefert ist', () => {
    const treffer = eintragFuer('0.1.9.1');
    expect(treffer).toBeDefined();
    expect(versionKleinerGleich(treffer!.version, '0.1.9.1')).toBe(true);
  });
});

describe('Die Datei selbst', () => {
  it('führt die Versionen von neu nach alt', () => {
    const alle = alleAenderungen();
    for (let i = 1; i < alle.length; i++) {
      const neuer = alle[i - 1]!.version;
      const aelter = alle[i]!.version;
      expect(versionKleinerGleich(neuer, aelter), `${neuer} steht vor ${aelter}`).toBe(false);
    }
  });

  it('nennt keine Version zweimal', () => {
    const versionen = alleAenderungen().map((a) => a.version);
    expect(new Set(versionen).size).toBe(versionen.length);
  });

  it('gibt jeder Version ein Datum und mindestens einen Punkt', () => {
    for (const a of alleAenderungen()) {
      expect(a.datum, a.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.punkte.length, a.version).toBeGreaterThan(0);
      for (const p of a.punkte) expect(p.trim().length).toBeGreaterThan(0);
    }
  });

  /**
   * Die Liste ist für Kinder und Eltern, nicht für Entwickler. Ein Punkt, der
   * nach Quelltext klingt, gehört nicht hinein — er sagt dem Leser nichts und
   * macht die übrigen unglaubwürdig.
   */
  it('kommt ohne Entwicklerwörter aus', () => {
    const verboten = /\b(refactor|commit|merge|bugfix|API|Migration|Repository|TypeScript)\b/i;
    for (const a of alleAenderungen()) {
      for (const p of a.punkte) {
        expect(verboten.test(p), `${a.version}: „${p}"`).toBe(false);
      }
    }
  });
});

describe('datumLesbar', () => {
  it('schreibt das Datum, wie man es in Deutschland schreibt', () => {
    expect(datumLesbar('2026-09-18')).toBe('18.09.2026');
    expect(datumLesbar('2026-01-05')).toBe('05.01.2026');
  });

  it('lässt Unbekanntes stehen, statt etwas zu erfinden', () => {
    expect(datumLesbar('demnächst')).toBe('demnächst');
  });
});
