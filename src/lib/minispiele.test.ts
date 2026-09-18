import { describe, it, expect } from 'vitest';
import {
  tempo,
  FALLDAUER_MS,
  ABWURF_MS,
  FALLDAUER_MIN_MS,
  ABWURF_MIN_MS,
  alleSpielWoerter,
  regenGruppen,
  regenGruppenBis,
  regenVorrat,
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
import { isSchreibweiseKorrekt } from './schreibweise';

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

describe('Tastengruppen für Buchstabenregen — SPEC.md 8.10', () => {
  const bis = (order: number) => allLessons().filter((l) => l.order <= order);

  it('gibt je Lektion eine Gruppe mit genau deren neuen Tasten', () => {
    const g = regenGruppen(bis(3));
    expect(g.map((x) => x.zeichen.join(''))).toEqual(['fj', 'dk', 'sl']);
  });

  /** L05 bringt keine neuen Tasten — eine leere Gruppe wäre ein toter Knopf. */
  it('lässt Lektionen ohne neue Tasten aus', () => {
    const g = regenGruppen(bis(5));
    expect(g.some((x) => x.id === 'L05')).toBe(false);
    expect(g).toHaveLength(4);
  });

  /**
   * Die harte Regel aus 6.2: **kein ungelerntes Zeichen.** Sie gilt auch im
   * Spiel — ein Kind soll keine Taste jagen, die es nie gezeigt bekommen hat.
   */
  it('bietet nie ein Zeichen an, das noch nicht gelernt ist', () => {
    for (const lesson of allLessons()) {
      const erlaubt = new Set([...lesson.chars]);
      for (const gruppe of regenGruppen(bis(lesson.order))) {
        for (const z of gruppe.zeichen) {
          expect(erlaubt.has(z), `${lesson.id}/${gruppe.id}: '${z}' ist dort nicht gelernt`).toBe(
            true,
          );
        }
      }
    }
  });

  it('kommt ohne freigeschaltete Lektionen zurecht', () => {
    expect(regenGruppen([])).toEqual([]);
    expect(regenGruppenBis('L99')).toEqual([]);
  });
});

describe('Vorrat aus mehreren Gruppen — SPEC.md 8.10', () => {
  const gruppen = regenGruppen(allLessons().filter((l) => l.order <= 4));
  const sortiert = (x: readonly string[]): string[] => [...x].sort();

  /** Der Kern des Wunsches: „vielleicht nur d k, oder vielleicht d f j k." */
  it('legt mehrere gewählte Gruppen zusammen', () => {
    expect(sortiert(regenVorrat('L04', gruppen, new Set(['L02'])))).toEqual(['d', 'k']);
    expect(sortiert(regenVorrat('L04', gruppen, new Set(['L01', 'L02'])))).toEqual([
      'd',
      'f',
      'j',
      'k',
    ]);
  });

  /**
   * Ohne Auswahl der **volle** Vorrat der Lektion, nicht die Summe der
   * Gruppen. Die Großbuchstaben haben keine eigene Gruppe — `L20` führt nur
   * die Umschalttasten ein —, wären über die Gruppen also nicht zu erreichen.
   */
  it('nimmt ohne Auswahl den vollen Vorrat der Lektion', () => {
    expect(sortiert(regenVorrat('L04', gruppen, new Set()))).toEqual([
      'a',
      'd',
      'f',
      'j',
      'k',
      'l',
      's',
      'ö',
    ]);
    expect(regenVorrat('L21', regenGruppen(allLessons()), new Set())).toContain('A');
  });

  it('liefert für eine unbekannte Gruppe nichts', () => {
    expect(regenVorrat('L04', gruppen, new Set(['gibtsnicht']))).toEqual([]);
  });
});

/**
 * Die Wortliste ist seit dem 2026-09-18 nicht mehr nur Spielmaterial: Der Drill
 * streut sie in die Übungen ein (`drill.ts`). Damit gilt für sie dieselbe
 * Regel wie für jeden ausgegebenen Text.
 *
 * **Fünf Wörter standen in Ausweichschreibung darin** — `tuer`, `gemuese`,
 * `kaefer`, `loeffel`, `ruecken`. Im Spiel fiel das nie auf, weil dort nur
 * abgetippt und nichts eingeübt wird. In einer Übung ist es ein eingeübter
 * Rechtschreibfehler, und das darf ein Schreibtrainer nicht (ARCHITEKTUR.md).
 */
describe('Wortliste — Schreibweisen', () => {
  it('enthält kein Wort in Ausweichschreibung', () => {
    for (const wort of alleSpielWoerter()) {
      expect(isSchreibweiseKorrekt(wort), `'${wort}' ist eine Ausweichschreibung`).toBe(true);
    }
  });

  it('enthält nur Kleinbuchstaben ohne Leerzeichen', () => {
    for (const wort of alleSpielWoerter()) {
      expect(wort, wort).toBe(wort.toLowerCase().trim());
      expect(wort.includes(' '), wort).toBe(false);
    }
  });
});

describe('Tempo im Buchstabenregen — SPEC.md 8.10', () => {
  /**
   * Ohne Steigerung hat eine Runde keinen Bogen: Wer die Tasten kann, fängt
   * beliebig lange weiter. Mit Steigerung findet jede Runde ihr Ende.
   */
  it('zieht mit jedem gefangenen Buchstaben an', () => {
    expect(tempo(20).falldauerMs).toBeLessThan(tempo(0).falldauerMs);
    expect(tempo(20).abwurfMs).toBeLessThan(tempo(0).abwurfMs);
  });

  it('beginnt bei den Ausgangswerten', () => {
    expect(tempo(0).falldauerMs).toBe(FALLDAUER_MS);
    expect(tempo(0).abwurfMs).toBe(ABWURF_MS);
  });

  /** Irgendwann muss Schluss sein, sonst wird es unmöglich statt schwer. */
  it('läuft nicht ins Bodenlose', () => {
    expect(tempo(100_000).falldauerMs).toBe(FALLDAUER_MIN_MS);
    expect(tempo(100_000).abwurfMs).toBe(ABWURF_MIN_MS);
  });

  it('bleibt bei negativen Werten unverändert', () => {
    expect(tempo(-5).falldauerMs).toBe(FALLDAUER_MS);
  });
});
