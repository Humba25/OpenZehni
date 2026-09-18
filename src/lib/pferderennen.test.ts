import { describe, it, expect } from 'vitest';
import {
  STRECKE,
  RENNSTUFEN,
  rennzeichen,
  huerdenPositionen,
  offeneHuerde,
  huerdeGerissen,
  gegnerAnteil,
  ausgang,
} from './pferderennen';
import { allLessons } from './curriculum';

describe('Pferderennen — SPEC.md 8.10.1', () => {
  it('wird von gemütlich nach rasant in jeder Hinsicht schwerer', () => {
    for (let i = 1; i < RENNSTUFEN.length; i++) {
      const vorher = RENNSTUFEN[i - 1]!;
      const jetzt = RENNSTUFEN[i]!;
      expect(jetzt.gegnerProMin, 'schnellerer Gegner').toBeGreaterThan(vorher.gegnerProMin);
      expect(jetzt.huerden, 'mehr Hürden').toBeGreaterThan(vorher.huerden);
      expect(jetzt.sprungfenster, 'engeres Sprungfenster').toBeLessThan(vorher.sprungfenster);
    }
  });
});

describe('Renn-Zeichen', () => {
  /** Die harte Regel aus 6.2, geprüft für jede Lektion — auch `L01`. */
  it('nimmt nur gelernte Zeichen, in jeder Lektion', () => {
    for (const lesson of allLessons()) {
      const erlaubt = new Set([...lesson.chars]);
      for (const c of rennzeichen(lesson.id, 'saat')) {
        expect(erlaubt.has(c), `${lesson.id}: '${c}' ist nicht gelernt`).toBe(true);
      }
    }
  });

  it('reicht über die Ziellinie hinaus', () => {
    expect(rennzeichen('L09', 'saat').length).toBeGreaterThan(STRECKE);
  });

  it('enthält kein Leerzeichen — die Leertaste ist zum Springen da', () => {
    expect(rennzeichen('L20', 'saat').includes(' ')).toBe(false);
  });

  it('bleibt reproduzierbar', () => {
    expect(rennzeichen('L09', 'a')).toEqual(rennzeichen('L09', 'a'));
    expect(rennzeichen('L09', 'a')).not.toEqual(rennzeichen('L09', 'b'));
  });

  it('gibt für eine unbekannte Lektion nichts', () => {
    expect(rennzeichen('L99', 'saat')).toEqual([]);
  });
});

describe('Hürden', () => {
  it('legt so viele Hürden wie die Stufe verlangt', () => {
    for (const stufe of RENNSTUFEN) {
      expect(huerdenPositionen(stufe, 'saat'), stufe.id).toHaveLength(stufe.huerden);
    }
  });

  /**
   * Keine Hürde im ersten Moment — die wäre nicht zu schaffen — und keine auf
   * der Ziellinie.
   */
  it('lässt vorn und hinten Platz', () => {
    for (const stufe of RENNSTUFEN) {
      for (const h of huerdenPositionen(stufe, 'saat')) {
        expect(h, stufe.id).toBeGreaterThan(stufe.sprungfenster);
        expect(h, stufe.id).toBeLessThan(STRECKE);
      }
    }
  });

  /**
   * Überschneiden sich zwei Sprungfenster, wäre nicht mehr zu erkennen, für
   * welche Hürde gerade gesprungen wird.
   */
  it('lässt die Sprungfenster nie überlappen', () => {
    for (const stufe of RENNSTUFEN) {
      for (const saat of ['a', 'b', 'c', 'd', 'e']) {
        const h = [...huerdenPositionen(stufe, saat)].sort((a, b) => a - b);
        for (let i = 1; i < h.length; i++) {
          expect(h[i]! - h[i - 1]!, `${stufe.id}/${saat}`).toBeGreaterThan(stufe.sprungfenster);
        }
      }
    }
  });
});

describe('Springen', () => {
  const stufe = RENNSTUFEN[1]!;
  const huerden = [30, 60, 90];

  it('öffnet das Fenster erst kurz vor der Hürde', () => {
    expect(offeneHuerde(30 - stufe.sprungfenster - 1, huerden, stufe, new Set())).toBeUndefined();
    expect(offeneHuerde(30 - stufe.sprungfenster, huerden, stufe, new Set())).toBe(30);
    expect(offeneHuerde(30, huerden, stufe, new Set())).toBe(30);
  });

  it('schließt das Fenster hinter der Hürde', () => {
    expect(offeneHuerde(31, huerden, stufe, new Set())).toBeUndefined();
  });

  it('bietet eine geschaffte Hürde nicht noch einmal an', () => {
    expect(offeneHuerde(30, huerden, stufe, new Set([30]))).toBeUndefined();
  });

  it('meldet den Zusammenstoß genau an der Hürde', () => {
    expect(huerdeGerissen(29, huerden, new Set())).toBeUndefined();
    expect(huerdeGerissen(30, huerden, new Set())).toBe(30);
    expect(huerdeGerissen(30, huerden, new Set([30])), 'gesprungen').toBeUndefined();
  });
});

describe('Gegner', () => {
  const stufe = RENNSTUFEN[1]!;

  it('startet bei null und kommt nie über eins', () => {
    expect(gegnerAnteil(0, stufe)).toBe(0);
    expect(gegnerAnteil(99_999_999, stufe)).toBe(1);
  });

  it('läuft gleichmäßig', () => {
    const a = gegnerAnteil(10_000, stufe);
    const b = gegnerAnteil(20_000, stufe);
    expect(b).toBeCloseTo(a * 2, 5);
  });

  it('ist auf der schwereren Stufe schneller', () => {
    expect(gegnerAnteil(10_000, RENNSTUFEN[2]!)).toBeGreaterThan(
      gegnerAnteil(10_000, RENNSTUFEN[0]!),
    );
  });

  /**
   * Der Gegner braucht auf jeder Stufe länger als eine Sekunde und weniger als
   * zwei Minuten — sonst wäre das Rennen entweder sofort vorbei oder zäh.
   */
  it('braucht eine sinnvolle Zeit für die Strecke', () => {
    for (const s of RENNSTUFEN) {
      const sekunden = (STRECKE / s.gegnerProMin) * 60;
      expect(sekunden, s.id).toBeGreaterThan(30);
      expect(sekunden, s.id).toBeLessThan(120);
    }
  });
});

describe('Ausgang', () => {
  it('ist gewonnen, wenn das Ziel vor dem Gegner erreicht ist', () => {
    expect(ausgang(STRECKE, 0.9)).toBe('gewonnen');
  });

  it('ist verloren, wenn der Gegner vorher da war', () => {
    expect(ausgang(STRECKE, 1)).toBe('verloren');
  });

  it('ist verloren, solange das Ziel nicht erreicht ist', () => {
    expect(ausgang(STRECKE - 1, 0.5)).toBe('verloren');
  });
});
