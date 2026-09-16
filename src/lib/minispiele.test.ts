import { describe, it, expect } from 'vitest';
import {
  createRandom,
  regenZeichen,
  naechstesZeichen,
  wortsalatWoerter,
  wortsalatSpielbar,
  wortsalatAbLektion,
  verwuerfeln,
  salatrunden,
  SPIEL_SEKUNDEN,
  MIN_WOERTER,
} from './minispiele';
import { allLessons, getLesson } from './curriculum';

describe('Buchstabenregen — SPEC.md 8.10', () => {
  /** Die harte Regel aus SPEC.md 6.2 gilt auch im Spiel. */
  it('lässt nur gelernte Zeichen fallen', () => {
    for (const l of allLessons()) {
      const erlaubt = new Set([...l.chars]);
      for (const z of regenZeichen(l.id)) {
        expect(erlaubt.has(z), `${l.id}: '${z}'`).toBe(true);
      }
    }
  });

  it('lässt weder Leerzeichen noch Zeilenschaltung fallen', () => {
    for (const l of allLessons()) {
      expect(regenZeichen(l.id)).not.toContain(' ');
      expect(regenZeichen(l.id)).not.toContain('\n');
    }
  });

  it('hat schon in der ersten Lektion etwas zu fallen', () => {
    expect(regenZeichen('L01').length).toBeGreaterThan(0);
  });

  it('kennt eine unbekannte Lektion nicht', () => {
    expect(regenZeichen('L99')).toEqual([]);
    expect(naechstesZeichen([], createRandom('x'))).toBeUndefined();
  });

  it('zieht Zeichen aus dem Vorrat', () => {
    const vorrat = regenZeichen('L08');
    const rnd = createRandom('saat');
    for (let i = 0; i < 50; i++) {
      expect(vorrat).toContain(naechstesZeichen(vorrat, rnd));
    }
  });
});

describe('Wortsalat', () => {
  it('nimmt nur Wörter, die sich mit dem Vorrat schreiben lassen', () => {
    for (const l of allLessons()) {
      const erlaubt = new Set([...l.chars]);
      for (const w of wortsalatWoerter(l.id)) {
        for (const c of w) {
          expect(erlaubt.has(c), `${l.id}: '${w}'`).toBe(true);
        }
      }
    }
  });

  /**
   * In den ersten Lektionen gibt es zu wenige Wörter. Statt schlechte Runden zu
   * erzeugen, sagt das Spiel, dass es noch nicht so weit ist.
   */
  it('ist am Anfang ehrlich nicht spielbar', () => {
    expect(wortsalatSpielbar('L01')).toBe(false);
  });

  it('ist am Ende des Lernpfads spielbar', () => {
    expect(wortsalatSpielbar('L24')).toBe(true);
    expect(wortsalatWoerter('L24').length).toBeGreaterThanOrEqual(MIN_WOERTER);
  });

  it('nennt die Lektion, ab der es losgeht', () => {
    const ab = wortsalatAbLektion(allLessons());
    expect(ab).toBeTruthy();
    expect(wortsalatSpielbar(ab!)).toBe(true);
    // Die Lektion davor darf es noch nicht können, sonst waere die Angabe falsch.
    const davor = allLessons().find((l) => l.order === getLesson(ab!)!.order - 1);
    if (davor) expect(wortsalatSpielbar(davor.id)).toBe(false);
  });

  it('wächst mit dem Zeichenvorrat', () => {
    expect(wortsalatWoerter('L24').length).toBeGreaterThan(wortsalatWoerter('L10').length);
  });
});

describe('Verwürfeln', () => {
  /** Ein „verdrehtes" Wort, das aussieht wie vorher, ist keine Aufgabe. */
  it('liefert nie das Ausgangswort zurück', () => {
    const rnd = createRandom('saat');
    for (const w of ['katze', 'blume', 'zug', 'uhr', 'haus']) {
      for (let i = 0; i < 20; i++) {
        expect(verwuerfeln(w, rnd)).not.toBe(w);
      }
    }
  });

  it('behält alle Buchstaben', () => {
    const rnd = createRandom('saat');
    const sortiert = (s: string): string => [...s].sort().join('');
    for (const w of wortsalatWoerter('L24').slice(0, 40)) {
      expect(sortiert(verwuerfeln(w, rnd))).toBe(sortiert(w));
    }
  });

  it('gibt ein Wort aus lauter gleichen Buchstaben unverändert zurück', () => {
    expect(verwuerfeln('aaa', createRandom('x'))).toBe('aaa');
    expect(verwuerfeln('a', createRandom('x'))).toBe('a');
  });
});

describe('Runden', () => {
  it('liefert die gewünschte Zahl an Runden', () => {
    expect(salatrunden('L24', 10, 'a')).toHaveLength(10);
  });

  it('ist bei gleicher Saat reproduzierbar', () => {
    expect(salatrunden('L24', 5, 'a')).toEqual(salatrunden('L24', 5, 'a'));
    expect(salatrunden('L24', 5, 'a')).not.toEqual(salatrunden('L24', 5, 'b'));
  });

  it('wiederholt kein Wort, solange der Vorrat reicht', () => {
    const runden = salatrunden('L24', 20, 'a');
    expect(new Set(runden.map((r) => r.wort)).size).toBe(runden.length);
  });

  it('liefert für eine unbekannte Lektion nichts', () => {
    expect(salatrunden('L99', 5, 'a')).toEqual([]);
  });

  it('verdreht in jeder Runde wirklich', () => {
    for (const r of salatrunden('L24', 20, 'a')) {
      expect(r.verdreht).not.toBe(r.wort);
    }
  });
});

describe('Rahmen', () => {
  /** Eine Zeitbegrenzung innerhalb eines Minispiels ist zulässig (SPEC.md 8.10). */
  it('hält die Runde kurz', () => {
    expect(SPIEL_SEKUNDEN).toBeGreaterThanOrEqual(30);
    expect(SPIEL_SEKUNDEN).toBeLessThanOrEqual(120);
  });
});
