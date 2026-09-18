import { describe, it, expect } from 'vitest';
import {
  alleDekoTeile,
  eingerichteteTeile,
  verdienteTeile,
  neuesTeil,
  raumVoll,
  DEKO_GESAMT,
} from './lernstube';

describe('Katalog — SPEC.md 8.4', () => {
  it('vergibt jede ID nur einmal', () => {
    const ids = alleDekoTeile().map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gibt jedem Teil Name, Form und einen Platz im Raum', () => {
    for (const t of alleDekoTeile()) {
      expect(t.label.length, t.id).toBeGreaterThan(2);
      expect(t.form.length, t.id).toBeGreaterThan(2);
      expect(t.links, t.id).toBeGreaterThanOrEqual(0);
      expect(t.links + t.groesse, t.id).toBeLessThanOrEqual(100);
      expect(t.oben, t.id).toBeGreaterThanOrEqual(0);
      expect(t.oben, t.id).toBeLessThan(100);
    }
  });
});

describe('Einrichtung', () => {
  /** Ein völlig leerer Raum sieht nach Fehler aus, nicht nach Anfang. */
  it('ist auf Level 1 nicht leer', () => {
    const teile = eingerichteteTeile({ level: 1 });
    expect(teile.length).toBeGreaterThan(0);
    expect(teile.every((t) => t.vonAnfangAn === true)).toBe(true);
  });

  it('zählt Level 1 nicht als Leistung', () => {
    expect(verdienteTeile({ level: 1 })).toBe(0);
    expect(verdienteTeile({ level: 4 })).toBe(3);
  });

  /**
   * Seit dem 2026-09-18 kommen die Teile allein aus den Leveln — das
   * Wochenziel ist gestrichen (SPEC.md 8.8). Das reicht: 29 Levelaufstiege
   * stehen 15 erspielbaren Teilen gegenüber.
   */
  it('füllt den Raum allein über die Level', () => {
    expect(verdienteTeile({ level: 1 })).toBe(0);
    expect(verdienteTeile({ level: 16 })).toBeGreaterThanOrEqual(DEKO_GESAMT - 1);
  });

  it('füllt sich in fester Reihenfolge', () => {
    const drei = eingerichteteTeile({ level: 4 });
    const vier = eingerichteteTeile({ level: 5 });
    expect(vier.slice(0, drei.length)).toEqual(drei);
  });

  it('läuft nicht über den Katalog hinaus', () => {
    const teile = eingerichteteTeile({ level: 30 });
    expect(teile).toHaveLength(DEKO_GESAMT);
    expect(raumVoll({ level: 30 })).toBe(true);
  });

  /** Ein einmal erspieltes Teil geht nie wieder verloren. */
  it('nimmt nie ein Teil weg', () => {
    let vorher = 0;
    for (let level = 1; level <= 20; level++) {
      const jetzt = eingerichteteTeile({ level }).length;
      expect(jetzt).toBeGreaterThanOrEqual(vorher);
      vorher = jetzt;
    }
  });
});

describe('Neues Teil', () => {
  it('nennt das Teil, das gerade dazukam', () => {
    const t = neuesTeil({ level: 2 }, { level: 3 });
    expect(t?.id).toBe(alleDekoTeile().filter((x) => x.vonAnfangAn !== true)[1]?.id);
  });

  it('meldet nichts, wenn sich nichts geändert hat', () => {
    expect(neuesTeil({ level: 3 }, { level: 3 })).toBeUndefined();
  });

  it('meldet nichts, wenn der Raum voll ist', () => {
    expect(neuesTeil({ level: 30 }, { level: 30 })).toBeUndefined();
  });
});
