import { describe, it, expect } from 'vitest';
import {
  ECKEN,
  STUFEN,
  SCHUESSE_PRO_RUNDE,
  zielwoerter,
  ladezeichen,
  kraft,
  torwartEcke,
  istTor,
  type Ecke,
} from './elfmeter';
import { createRandom } from './minispiele';
import { allLessons, getLesson } from './curriculum';

describe('Elfmeterschießen — SPEC.md 8.10.1', () => {
  it('kennt neun Ecken und fünf Schüsse', () => {
    expect(ECKEN).toHaveLength(9);
    expect(new Set(ECKEN).size).toBe(9);
    expect(SCHUESSE_PRO_RUNDE).toBe(5);
  });

  it('wird von leicht nach schwer in jeder Hinsicht schwerer', () => {
    for (let i = 1; i < STUFEN.length; i++) {
      const vorher = STUFEN[i - 1]!;
      const jetzt = STUFEN[i]!;
      expect(jetzt.ladezeitMs, 'weniger Zeit').toBeLessThan(vorher.ladezeitMs);
      expect(jetzt.trefferquote, 'Torwart rät öfter richtig').toBeGreaterThan(vorher.trefferquote);
      expect(jetzt.durchschuss, 'härter durchzuschießen').toBeGreaterThan(vorher.durchschuss);
    }
  });
});

describe('Zielwörter', () => {
  /**
   * Die harte Regel aus 6.2: **kein ungelerntes Zeichen.** Geprüft für jede
   * Lektion, nicht für eine Auswahl — auch `L01`, wo nur `f` und `j` gelernt
   * sind.
   */
  it('nimmt nur gelernte Zeichen, in jeder Lektion', () => {
    for (const lesson of allLessons()) {
      const erlaubt = new Set([...lesson.chars]);
      for (const wort of zielwoerter(lesson.id, 'saat')) {
        for (const c of wort) {
          expect(erlaubt.has(c), `${lesson.id}: '${c}' in '${wort}' ist nicht gelernt`).toBe(true);
        }
      }
    }
  });

  it('füllt alle neun Felder, auch in der ersten Lektion', () => {
    for (const id of ['L01', 'L05', 'L13', 'L25']) {
      expect(zielwoerter(id, 'saat'), id).toHaveLength(9);
    }
  });

  /** Zwei gleiche Felder wären nicht auflösbar. */
  it('gibt neun verschiedene Wörter', () => {
    for (const id of ['L01', 'L09', 'L20']) {
      const w = zielwoerter(id, 'saat');
      expect(new Set(w).size, id).toBe(w.length);
    }
  });

  it('bleibt reproduzierbar', () => {
    expect(zielwoerter('L09', 'a')).toEqual(zielwoerter('L09', 'a'));
    expect(zielwoerter('L09', 'a')).not.toEqual(zielwoerter('L09', 'b'));
  });

  it('gibt für eine unbekannte Lektion nichts', () => {
    expect(zielwoerter('L99', 'saat')).toEqual([]);
  });
});

describe('Ladezeichen', () => {
  it('nimmt nur gelernte Zeichen, in jeder Lektion', () => {
    for (const lesson of allLessons()) {
      const erlaubt = new Set([...lesson.chars]);
      for (const c of ladezeichen(lesson.id, 'saat')) {
        expect(erlaubt.has(c), `${lesson.id}: '${c}' ist nicht gelernt`).toBe(true);
      }
    }
  });

  it('geht auch sehr schnellen Fingern nicht aus', () => {
    // 60 Zeichen in 3 Sekunden waeren 1200 Anschlaege je Minute.
    expect(ladezeichen('L09', 'saat')).toHaveLength(60);
  });

  it('enthält kein Leerzeichen', () => {
    expect(ladezeichen('L20', 'saat').includes(' ')).toBe(false);
  });
});

describe('Schusskraft', () => {
  const stufe = STUFEN[1]!;

  it('ist null ohne einen einzigen Anschlag', () => {
    expect(kraft(0, stufe.ladezeitMs)).toBe(0);
  });

  it('steigt mit den Anschlägen und bleibt bei eins stehen', () => {
    expect(kraft(5, stufe.ladezeitMs)).toBeLessThan(kraft(10, stufe.ladezeitMs));
    expect(kraft(9999, stufe.ladezeitMs)).toBe(1);
  });

  /**
   * Bezugsgröße ist das in der Ladezeit Erreichbare. Wer in der kürzeren Zeit
   * der schweren Stufe dieselbe Zahl schafft, hat den härteren Schuss.
   */
  it('rechnet gegen die Ladezeit, nicht gegen die Zeichenzahl', () => {
    const leicht = kraft(8, STUFEN[0]!.ladezeitMs);
    const schwer = kraft(8, STUFEN[2]!.ladezeitMs);
    expect(schwer).toBeGreaterThan(leicht);
  });
});

describe('Torwart und Tor', () => {
  it('springt immer in eine der neun Ecken', () => {
    const rnd = createRandom('torwart');
    for (let i = 0; i < 200; i++) {
      expect(ECKEN).toContain(torwartEcke('oben-links', STUFEN[1]!, rnd));
    }
  });

  /**
   * Die Stufe muss wirken. Würfelte der Torwart einfach aus allen neun, läge
   * die Trefferquote bei elf Prozent und „schwer" wäre nur ein Wort.
   */
  it('trifft auf der schweren Stufe deutlich öfter als auf der leichten', () => {
    const quote = (stufe: (typeof STUFEN)[number]): number => {
      const rnd = createRandom(`quote#${stufe.id}`);
      let richtig = 0;
      for (let i = 0; i < 2000; i++) {
        if (torwartEcke('mitte-mitte', stufe, rnd) === 'mitte-mitte') richtig++;
      }
      return richtig / 2000;
    };
    expect(quote(STUFEN[2]!)).toBeGreaterThan(quote(STUFEN[0]!) + 0.15);
  });

  it('zählt ein Tor, wenn der Torwart woanders hinspringt', () => {
    expect(istTor('oben-links', 'unten-rechts', 0, STUFEN[2]!)).toBe(true);
  });

  it('lässt einen harten Schuss auch bei richtig geratener Ecke durch', () => {
    const stufe = STUFEN[1]!;
    expect(istTor('oben-links', 'oben-links', stufe.durchschuss, stufe)).toBe(true);
    expect(istTor('oben-links', 'oben-links', stufe.durchschuss - 0.01, stufe)).toBe(false);
  });

  /** Ohne Aufladen hält der Torwart jede richtig geratene Ecke. */
  it('hält einen schwachen Schuss in der geratenen Ecke', () => {
    for (const stufe of STUFEN) {
      expect(istTor('mitte-mitte', 'mitte-mitte', 0, stufe), stufe.id).toBe(false);
    }
  });

  it('kennt nur Ecken aus der Liste', () => {
    const alle: readonly Ecke[] = ECKEN;
    expect(alle.every((e) => typeof e === 'string')).toBe(true);
    expect(getLesson('L01')).toBeDefined();
  });
});
