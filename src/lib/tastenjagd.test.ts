import { describe, it, expect } from 'vitest';
import { jagdAngebot, jagdSequenzen, jagdbilanz, JAGD_RUNDEN, JAGD_SEKUNDEN } from './tastenjagd';
import { MIN_SAMPLES_FOR_WEAKNESS, type CharStat } from './typing-engine';
import { allLessons, getLesson } from './curriculum';

function stat(hits: number, misses: number, latenzMs = 400): CharStat {
  const samples = hits + misses;
  return { hits, misses, totalLatencyMs: latenzMs * samples, samples };
}

describe('Angebot — SPEC.md 8.9', () => {
  /**
   * Die harte Regel: Unter zwölf Anschlägen sagt die App über ein Zeichen
   * nichts. Eine Jagd auf zwei Fehlgriffe wäre eine erfundene Schwäche.
   */
  it('schweigt unter zwölf Anschlägen', () => {
    for (let n = 1; n < MIN_SAMPLES_FOR_WEAKNESS; n++) {
      const stats = new Map([['d', stat(0, n)]]);
      expect(jagdAngebot(stats, 'L05'), `${n} Anschläge`).toBeUndefined();
    }
  });

  it('bietet ab belastbarer Datenlage eine Jagd an', () => {
    const stats = new Map([['d', stat(4, 12)]]);
    expect(jagdAngebot(stats, 'L05')?.zeichen).toBe('d');
  });

  it('meldet ohne jede Statistik nichts', () => {
    expect(jagdAngebot(new Map(), 'L05')).toBeUndefined();
  });

  /**
   * Ein Zeichen kann aus einer früheren Lektion in char_stats stehen und im
   * Vorrat der aktuellen fehlen — daraus liesse sich kein zulässiger Text
   * bauen.
   */
  it('überspringt Zeichen, die nicht zum Vorrat der Lektion gehören', () => {
    const stats = new Map([
      ['q', stat(2, 30, 900)], // in L01 nicht vorhanden
      ['f', stat(4, 14)],
    ]);
    expect(jagdAngebot(stats, 'L01')?.zeichen).toBe('f');
  });

  it('kennt eine unbekannte Lektion nicht', () => {
    expect(jagdAngebot(new Map([['d', stat(4, 12)]]), 'L99')).toBeUndefined();
  });
});

describe('Sequenzen', () => {
  const angebot = { zeichen: 'd', lessonId: 'L05' as const };

  it('liefert die angekündigte Zahl an Runden', () => {
    expect(jagdSequenzen(angebot)).toHaveLength(JAGD_RUNDEN);
    expect(jagdSequenzen(angebot, 3)).toHaveLength(3);
  });

  it('hält die Sequenzen kurz', () => {
    for (const s of jagdSequenzen(angebot)) {
      expect(s.length).toBeGreaterThan(0);
      expect(s.length).toBeLessThanOrEqual(28);
    }
  });

  it('wechselt die Umgebung von Runde zu Runde', () => {
    const s = jagdSequenzen(angebot);
    expect(new Set(s).size).toBeGreaterThan(1);
  });

  it('ist bei gleicher Saat reproduzierbar', () => {
    expect(jagdSequenzen(angebot, 3, 'x')).toEqual(jagdSequenzen(angebot, 3, 'x'));
  });

  /** Die harte Regel aus SPEC.md 6.2: kein ungelerntes Zeichen. */
  it('verwendet ausschließlich gelernte Zeichen', () => {
    for (const lesson of allLessons()) {
      const stats = new Map([[lesson.chars[0]!, stat(4, 14)]]);
      const a = jagdAngebot(stats, lesson.id);
      if (!a) continue;
      const erlaubt = new Set([...getLesson(lesson.id)!.chars]);
      for (const seq of jagdSequenzen(a, 3)) {
        for (const z of seq) {
          expect(erlaubt.has(z), `${lesson.id}: '${z}' in '${seq}'`).toBe(true);
        }
      }
    }
  });

  it('bringt das Problemzeichen auch wirklich vor', () => {
    const alle = jagdSequenzen(angebot, 8).join(' ');
    expect(alle).toContain('d');
  });

  it('wirft bei unbekannter Lektion', () => {
    expect(() => jagdSequenzen({ zeichen: 'd', lessonId: 'L99' })).toThrow();
  });
});

describe('Rahmen', () => {
  it('bleibt in der Zeitvorgabe aus SPEC.md 8.9', () => {
    expect(JAGD_SEKUNDEN).toBeLessThanOrEqual(45);
    expect(JAGD_RUNDEN).toBe(5);
  });
});

describe('Jagdbilanz — SPEC.md 8.9', () => {
  const karte = (eintraege: readonly [string, number, number][]): Map<string, CharStat> =>
    new Map(
      eintraege.map(([z, hits, misses]) => [
        z,
        { hits, misses, totalLatencyMs: 0, samples: hits + misses },
      ]),
    );

  it('zählt Treffer und Fehlgriffe des gejagten Zeichens über alle Zeilen', () => {
    const b = jagdbilanz('j', [
      karte([
        ['j', 4, 2],
        ['f', 6, 0],
      ]),
      karte([['j', 5, 1]]),
    ]);
    expect(b.zeichen).toBe('j');
    expect(b.treffer).toBe(9);
    expect(b.daneben).toBe(3);
  });

  it('zählt alle Anschläge, nicht nur die des gejagten Zeichens', () => {
    const b = jagdbilanz('j', [
      karte([
        ['j', 4, 2],
        ['f', 6, 1],
      ]),
    ]);
    expect(b.anschlaege).toBe(13);
  });

  it('kommt mit einem Zeichen zurecht, das gar nicht vorkam', () => {
    const b = jagdbilanz('z', [karte([['j', 4, 0]])]);
    expect(b.treffer).toBe(0);
    expect(b.daneben).toBe(0);
    expect(b.anschlaege).toBe(4);
  });

  it('kommt mit einer leeren Jagd zurecht', () => {
    const b = jagdbilanz('j', []);
    expect(b).toEqual({ zeichen: 'j', treffer: 0, daneben: 0, anschlaege: 0 });
  });
});
