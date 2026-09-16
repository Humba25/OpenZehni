import { describe, it, expect } from 'vitest';
import { aufwaermtext, AUFWAERM_SEKUNDEN } from './aufwaermen';
import { allLessons, getLesson } from './curriculum';

describe('Aufwärmen — SPEC.md 6.5', () => {
  it('hält sich an die zwanzig Sekunden aus der Spec', () => {
    expect(AUFWAERM_SEKUNDEN).toBe(20);
  });

  it('liefert für jede Lektion einen Text', () => {
    for (const l of allLessons()) {
      const text = aufwaermtext(l.id);
      expect(text.length, l.id).toBeGreaterThan(20);
    }
  });

  /** Die harte Regel aus SPEC.md 6.2 gilt auch im Aufwärmen. */
  it('verwendet ausschließlich gelernte Zeichen', () => {
    for (const l of allLessons()) {
      const erlaubt = new Set([...l.chars]);
      for (const z of aufwaermtext(l.id, ['q', 'x', 'ß'])) {
        expect(erlaubt.has(z), `${l.id}: '${z}'`).toBe(true);
      }
    }
  });

  it('nimmt die Problemzeichen als Schwerpunkt', () => {
    // 'd' ist ab L02 im Vorrat und sollte bei Betonung deutlich haeufiger
    // vorkommen als ohne.
    const mit = aufwaermtext('L08', ['d'], 'x');
    const ohne = aufwaermtext('L08', [], 'x');
    const zaehle = (s: string, z: string) => [...s].filter((c) => c === z).length;
    expect(zaehle(mit, 'd')).toBeGreaterThan(zaehle(ohne, 'd'));
  });

  /**
   * Ohne bekannte Schwaechen darf das Aufwaermen nicht ausfallen — es ist
   * Schritt 1 jeder Einheit, auch in der allerersten Sitzung.
   */
  it('fällt ohne bekannte Problemzeichen nicht aus', () => {
    expect(aufwaermtext('L01').length).toBeGreaterThan(20);
  });

  it('ignoriert Problemzeichen, die die Lektion noch nicht kennt', () => {
    const nurUnbekannte = aufwaermtext('L01', ['q', 'x'], 'y');
    const erlaubt = new Set([...getLesson('L01')!.chars]);
    for (const z of nurUnbekannte) expect(erlaubt.has(z)).toBe(true);
  });

  it('ist bei gleicher Saat reproduzierbar', () => {
    expect(aufwaermtext('L12', ['a'], 's1')).toBe(aufwaermtext('L12', ['a'], 's1'));
    expect(aufwaermtext('L12', ['a'], 's1')).not.toBe(aufwaermtext('L12', ['a'], 's2'));
  });

  it('wirft bei unbekannter Lektion', () => {
    expect(() => aufwaermtext('L99')).toThrow();
  });
});
