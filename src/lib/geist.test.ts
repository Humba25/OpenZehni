import { describe, it, expect } from 'vitest';
import {
  geistLaeuft,
  erzeugeGeist,
  vergleich,
  GEIST_AB_VERSUCH,
  GEIST_VERBOTEN_IN,
  GLEICHAUF_SPANNE,
  type GeistBedingungen,
} from './geist';

const bedingungen = (b: Partial<GeistBedingungen> = {}): GeistBedingungen => ({
  versuche: 3,
  bestStrokesMin: 120,
  lessonId: 'L10',
  eingeschaltet: true,
  ...b,
});

describe('Wann der Geist läuft — SPEC.md 8.7', () => {
  it('läuft ab dem zweiten Versuch', () => {
    expect(geistLaeuft(bedingungen({ versuche: 0 }))).toBe(false);
    expect(geistLaeuft(bedingungen({ versuche: GEIST_AB_VERSUCH - 1 }))).toBe(true);
  });

  it('läuft nicht ohne Bestleistung', () => {
    expect(geistLaeuft(bedingungen({ bestStrokesMin: null }))).toBe(false);
    expect(geistLaeuft(bedingungen({ bestStrokesMin: 0 }))).toBe(false);
  });

  it('lässt sich abschalten', () => {
    expect(geistLaeuft(bedingungen({ eingeschaltet: false }))).toBe(false);
  });

  /**
   * Im Abschlusstest gelten Wettbewerbsbedingungen (NORMEN.md 4.7). Die
   * Einstellung der Nutzerin ändert daran nichts.
   */
  it('ist im Abschlusstest immer aus', () => {
    expect(geistLaeuft(bedingungen({ lessonId: GEIST_VERBOTEN_IN }))).toBe(false);
    expect(
      geistLaeuft(bedingungen({ lessonId: GEIST_VERBOTEN_IN, eingeschaltet: true, versuche: 99 })),
    ).toBe(false);
  });
});

describe('Lauf des Geistes', () => {
  it('beginnt bei null', () => {
    const g = erzeugeGeist('abcdef', 120);
    expect(g.indexBei(0)).toBe(0);
    expect(g.indexBei(-50)).toBe(0);
  });

  it('läuft gleichmäßig', () => {
    // 120 A/min = 2 Anschläge je Sekunde. „abcdef“ sind 6 Anschläge.
    const g = erzeugeGeist('abcdef', 120);
    expect(g.indexBei(1000)).toBe(2);
    expect(g.indexBei(2000)).toBe(4);
    expect(g.indexBei(3000)).toBe(6);
    expect(g.gesamtMs).toBeCloseTo(3000);
  });

  it('läuft nie über das Textende hinaus', () => {
    const g = erzeugeGeist('abc', 120);
    expect(g.indexBei(999_999)).toBe(3);
  });

  /** Ein Großbuchstabe kostet zwei Anschläge (NORMEN.md 4.1). */
  it('rechnet in Anschlägen, nicht in Zeichen', () => {
    const g = erzeugeGeist('Ab', 120); // 2 + 1 = 3 Anschläge
    // Das A allein kostet zwei Anschläge, also eine ganze Sekunde.
    expect(g.indexBei(999)).toBe(0);
    expect(g.indexBei(1000)).toBe(1);
    expect(g.indexBei(1500)).toBe(2);
    expect(g.gesamtMs).toBeCloseTo(1500);
  });

  it('bleibt bei einem Tempo von null stehen', () => {
    const g = erzeugeGeist('abc', 0);
    expect(g.indexBei(100_000)).toBe(0);
    expect(g.gesamtMs).toBe(Infinity);
  });

  it('verträgt einen leeren Text', () => {
    const g = erzeugeGeist('', 120);
    expect(g.indexBei(1000)).toBe(0);
    expect(g.gesamtMs).toBe(0);
  });
});

describe('Vergleich in der Auswertung', () => {
  it('nennt einen knappen Abstand gleichauf', () => {
    expect(vergleich(100, 100)).toBe('gleichauf');
    expect(vergleich(100 + GLEICHAUF_SPANNE, 100)).toBe('gleichauf');
    expect(vergleich(100 - GLEICHAUF_SPANNE, 100)).toBe('gleichauf');
  });

  it('nennt einen deutlichen Abstand beim Namen', () => {
    expect(vergleich(130, 100)).toBe('schneller');
    expect(vergleich(80, 100)).toBe('langsamer');
  });
});
