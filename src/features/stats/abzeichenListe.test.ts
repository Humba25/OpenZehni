import { describe, it, expect } from 'vitest';
import { galerieReihenfolge, fehlendeInGalerie } from './abzeichenListe';
import { de } from '../../i18n/de';

describe('Abzeichen-Galerie — SPEC.md 8.2', () => {
  /**
   * Der eigentliche Zweck dieses Tests: Kommt in `gamification.ts` ein
   * Abzeichen dazu, ohne dass es hier auftaucht, fiele das sonst niemandem auf
   * — das Kind bekäme eine Meldung über ein Abzeichen, das es in der Galerie
   * nirgends wiederfindet.
   */
  it('zeigt jedes Abzeichen, das vergeben werden kann', () => {
    expect(fehlendeInGalerie()).toEqual([]);
  });

  it('zeigt die geforderten achtzehn', () => {
    expect(galerieReihenfolge()).toHaveLength(18);
  });

  it('vergibt jede ID nur einmal', () => {
    const ids = galerieReihenfolge();
    expect(new Set(ids).size).toBe(ids.length);
  });

  /** Titel, Beschreibung und Gratulation sind in SPEC.md 8.2 verlangt. */
  it('gibt jedem Abzeichen Titel, Beschreibung und Gratulation', () => {
    for (const id of galerieReihenfolge()) {
      const t = de.abzeichen[id];
      expect(t, id).toBeTruthy();
      expect(t.titel.length, id).toBeGreaterThan(2);
      expect(t.beschreibung.length, id).toBeGreaterThan(10);
      expect(t.gratulation.length, id).toBeGreaterThan(10);
    }
  });

  /**
   * Die Beschreibung sagt, wofür es das Abzeichen gibt — sie darf deshalb
   * nicht dieselbe Zeile sein wie die Gratulation.
   */
  it('unterscheidet Beschreibung und Gratulation', () => {
    for (const id of galerieReihenfolge()) {
      expect(de.abzeichen[id].beschreibung, id).not.toBe(de.abzeichen[id].gratulation);
    }
  });
});
