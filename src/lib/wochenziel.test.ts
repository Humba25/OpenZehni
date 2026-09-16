import { describe, it, expect } from 'vitest';
import {
  isoWoche,
  montagDerWoche,
  gleicheWoche,
  zielFuerWoche,
  zielErreicht,
  balkenAnteil,
  belohnungFaellig,
  MIN_ZIEL,
  MAX_ZIEL,
} from './wochenziel';

describe('ISO-Woche — SPEC.md 8.8, NORMEN.md 5', () => {
  it('beginnt am Montag', () => {
    // 2026-09-14 ist ein Montag.
    expect(montagDerWoche('2026-09-14')).toBe('2026-09-14');
    expect(montagDerWoche('2026-09-20')).toBe('2026-09-14'); // Sonntag
  });

  it('hält Montag bis Sonntag zusammen', () => {
    for (const tag of ['2026-09-14', '2026-09-17', '2026-09-20']) {
      expect(gleicheWoche('2026-09-14', tag), tag).toBe(true);
    }
    expect(gleicheWoche('2026-09-20', '2026-09-21')).toBe(false);
  });

  /**
   * Der Jahreswechsel ist die einzige Stelle, an der eine naive Rechnung
   * daneben liegt: Der 1. Januar 2027 ist ein Freitag und gehört noch zur
   * letzten Woche des Vorjahres.
   */
  it('rechnet über den Jahreswechsel richtig', () => {
    expect(isoWoche('2027-01-01')).toBe('2026-W53');
    expect(isoWoche('2027-01-04')).toBe('2027-W01');
    expect(isoWoche('2026-01-01')).toBe('2026-W01');
  });

  it('liefert ein zweistelliges Wochenformat', () => {
    expect(isoWoche('2026-02-03')).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe('Zielhöhe', () => {
  it('startet in der ersten Woche beim Mindestziel', () => {
    expect(zielFuerWoche(0, null)).toBe(MIN_ZIEL);
    expect(zielFuerWoche(99, null)).toBe(MIN_ZIEL);
  });

  /** Die Kernzusage aus SPEC.md 8.8: nie mehr als eine Einheit Anstieg. */
  it('steigt nie um mehr als eine Einheit', () => {
    let ziel = MIN_ZIEL;
    for (let woche = 0; woche < 20; woche++) {
      const naechstes = zielFuerWoche(99, ziel); // jede Woche weit übertroffen
      expect(naechstes - ziel).toBeLessThanOrEqual(1);
      ziel = naechstes;
    }
    expect(ziel).toBe(MAX_ZIEL);
  });

  it('fällt ohne Bremse auf eine schwache Woche zurück', () => {
    expect(zielFuerWoche(0, MAX_ZIEL)).toBe(MIN_ZIEL);
    expect(zielFuerWoche(4, 9)).toBe(4);
  });

  it('geht nie unter das Mindest- und nie über das Höchstziel', () => {
    for (const geschafft of [0, 1, 50]) {
      for (const vorher of [MIN_ZIEL, 5, MAX_ZIEL]) {
        const z = zielFuerWoche(geschafft, vorher);
        expect(z).toBeGreaterThanOrEqual(MIN_ZIEL);
        expect(z).toBeLessThanOrEqual(MAX_ZIEL);
      }
    }
  });
});

describe('Balken und Belohnung', () => {
  const stand = (progress: number, target = 5, rewardGiven = false) => ({
    week: '2026-W38',
    target,
    progress,
    rewardGiven,
  });

  it('meldet das Ziel als erreicht', () => {
    expect(zielErreicht(stand(4))).toBe(false);
    expect(zielErreicht(stand(5))).toBe(true);
    expect(zielErreicht(stand(9))).toBe(true);
  });

  it('lässt den Balken nicht über sein Ende hinauslaufen', () => {
    expect(balkenAnteil(stand(0))).toBe(0);
    expect(balkenAnteil(stand(2))).toBeCloseTo(0.4);
    expect(balkenAnteil(stand(12))).toBe(1);
  });

  it('gibt die Belohnung genau einmal', () => {
    expect(belohnungFaellig(stand(5))).toBe(true);
    expect(belohnungFaellig(stand(5, 5, true))).toBe(false);
    expect(belohnungFaellig(stand(4))).toBe(false);
  });
});
