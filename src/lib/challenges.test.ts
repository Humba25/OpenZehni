import { describe, it, expect } from 'vitest';
import {
  allChallenges,
  getChallenge,
  erfuellbareAufgaben,
  tagesaufgabeFuer,
  fortschrittNach,
  istErfuellt,
  balkenAnteil,
  laengsteFehlerfreieStrecke,
  unbekannteLektionen,
  type Challenge,
  type Ereignis,
} from './challenges';
import { allLessons } from './curriculum';
import type { CharState } from './typing-engine';

const alleLektionen = new Set(allLessons().map((l) => l.id));

const runde = (e: Partial<Extract<Ereignis, { art: 'runde' }>> = {}): Ereignis => ({
  art: 'runde',
  bestanden: false,
  sterne: 0,
  dauerMs: 0,
  blind: false,
  strecke: 0,
  ...e,
});

describe('Katalog — SPEC.md 8.6', () => {
  it('ist nicht leer und vergibt jede ID nur einmal', () => {
    const ids = allChallenges().map((a) => a.id);
    expect(ids.length).toBeGreaterThan(5);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /** Ein Tippfehler in abLektion würde die Aufgabe still unsichtbar machen. */
  it('verweist nur auf Lektionen, die es gibt', () => {
    expect(unbekannteLektionen()).toEqual([]);
  });

  it('gibt jeder Aufgabe ein sinnvolles Ziel', () => {
    for (const a of allChallenges()) {
      expect(a.ziel, a.id).toBeGreaterThan(0);
      expect(a.text.length, a.id).toBeGreaterThan(5);
    }
  });

  it('findet eine Aufgabe über ihre ID', () => {
    expect(getChallenge(allChallenges()[0]!.id)).toBeTruthy();
    expect(getChallenge('gibtesnicht')).toBeUndefined();
  });
});

describe('Erfüllbarkeit', () => {
  /**
   * Die harte Regel aus SPEC.md 8.6: Eine Aufgabe, die eine noch gesperrte
   * Lektion voraussetzt, ist nicht schwer, sondern unmöglich.
   */
  it('zieht nur Aufgaben, deren Lektion freigeschaltet ist', () => {
    const nurL01 = new Set(['L01']);
    for (const a of erfuellbareAufgaben(nurL01)) {
      expect(a.abLektion, a.id).toBe('L01');
    }
  });

  it('gibt es für den allerersten Tag schon eine Aufgabe', () => {
    expect(erfuellbareAufgaben(new Set(['L01'])).length).toBeGreaterThan(0);
    expect(tagesaufgabeFuer('2026-09-14', 1, new Set(['L01']))).toBeTruthy();
  });

  it('meldet ohne freigeschaltete Lektion nichts', () => {
    expect(tagesaufgabeFuer('2026-09-14', 1, new Set())).toBeUndefined();
  });
});

describe('Ziehung', () => {
  /** Dieselbe Aufgabe bleibt den Tag über stehen, auch nach Neustart. */
  it('ist für denselben Tag und dasselbe Profil gleich', () => {
    const a = tagesaufgabeFuer('2026-09-14', 1, alleLektionen);
    const b = tagesaufgabeFuer('2026-09-14', 1, alleLektionen);
    expect(a?.id).toBe(b?.id);
  });

  it('wechselt über die Tage', () => {
    const gezogen = new Set<string>();
    for (let t = 1; t <= 28; t++) {
      const tag = `2026-09-${String(t).padStart(2, '0')}`;
      gezogen.add(tagesaufgabeFuer(tag, 1, alleLektionen)!.id);
    }
    // Kein Beweis für Gleichverteilung, aber ein Wächter gegen eine Ziehung,
    // die immer dieselbe Aufgabe liefert.
    expect(gezogen.size).toBeGreaterThan(3);
  });

  it('verträgt einen vollen Zeitstempel statt eines Datums', () => {
    const a = tagesaufgabeFuer('2026-09-14', 1, alleLektionen);
    const b = tagesaufgabeFuer('2026-09-14T21:13:00.000Z', 1, alleLektionen);
    expect(a?.id).toBe(b?.id);
  });
});

describe('Fortschritt', () => {
  const summe: Challenge = {
    id: 't-summe',
    text: 'Test',
    kind: 'runden',
    ziel: 3,
    messung: 'summe',
    abLektion: 'L01',
  };
  const bestwert: Challenge = {
    id: 't-best',
    text: 'Test',
    kind: 'anschlaege-ohne-fehler',
    ziel: 200,
    messung: 'bestwert',
    abLektion: 'L01',
  };

  it('zählt Summen auf', () => {
    let stand = 0;
    stand = fortschrittNach(summe, stand, runde());
    stand = fortschrittNach(summe, stand, runde());
    expect(stand).toBe(2);
    expect(istErfuellt(summe, stand)).toBe(false);
  });

  /** 200 Anschläge in einer Runde, nicht über den Tag zusammengestückelt. */
  it('stückelt Bestwerte nicht zusammen', () => {
    let stand = 0;
    stand = fortschrittNach(bestwert, stand, runde({ strecke: 150 }));
    stand = fortschrittNach(bestwert, stand, runde({ strecke: 120 }));
    expect(stand).toBe(150);
    stand = fortschrittNach(bestwert, stand, runde({ strecke: 210 }));
    expect(stand).toBe(200); // gedeckelt beim Ziel
    expect(istErfuellt(bestwert, stand)).toBe(true);
  });

  it('läuft nie über das Ziel hinaus', () => {
    let stand = 0;
    for (let i = 0; i < 10; i++) stand = fortschrittNach(summe, stand, runde());
    expect(stand).toBe(3);
    expect(balkenAnteil(summe, stand)).toBe(1);
  });

  it('zählt nur, was zur Art der Aufgabe passt', () => {
    const blind: Challenge = { ...summe, kind: 'blindrunden', ziel: 2 };
    expect(fortschrittNach(blind, 0, runde({ blind: false }))).toBe(0);
    expect(fortschrittNach(blind, 0, runde({ blind: true }))).toBe(1);

    const jagd: Challenge = { ...summe, kind: 'tastenjagd', ziel: 1 };
    expect(fortschrittNach(jagd, 0, runde())).toBe(0);
    expect(fortschrittNach(jagd, 0, { art: 'tastenjagd' })).toBe(1);

    const zwischen: Challenge = { ...summe, kind: 'zwischenstueck', ziel: 1 };
    expect(fortschrittNach(zwischen, 0, { art: 'zwischenstueck' })).toBe(1);
  });

  it('rechnet Minuten am Stück aus der Rundendauer', () => {
    const minuten: Challenge = { ...bestwert, kind: 'minuten-am-stueck', ziel: 2 };
    expect(fortschrittNach(minuten, 0, runde({ dauerMs: 119_000 }))).toBe(1);
    expect(fortschrittNach(minuten, 0, runde({ dauerMs: 125_000 }))).toBe(2);
  });
});

describe('Fehlerfreie Strecke — NORMEN.md 4.1', () => {
  const states = (muster: string): readonly CharState[] =>
    [...muster].map((z) =>
      z === 'c' ? 'correct' : z === 'k' ? 'corrected' : z === 'f' ? 'wrong' : 'pending',
    );

  it('zählt die längste ununterbrochene Strecke', () => {
    // "abcde": erste zwei richtig, dann ein Fehler, dann zwei richtig.
    expect(laengsteFehlerfreieStrecke('abcde', states('ccfcc'))).toBe(2);
  });

  /** Ein korrigiertes Zeichen unterbricht die Strecke (NORMEN.md 4.4.1). */
  it('lässt korrigierte Zeichen die Strecke abbrechen', () => {
    expect(laengsteFehlerfreieStrecke('abcd', states('cckc'))).toBe(2);
  });

  /** Ein Grossbuchstabe ist zwei Anschlaege (NORMEN.md 4.1). */
  it('zählt die Umschalttaste mit', () => {
    expect(laengsteFehlerfreieStrecke('Ab', states('cc'))).toBe(3);
  });

  it('meldet null, wenn nichts saß', () => {
    expect(laengsteFehlerfreieStrecke('abc', states('fff'))).toBe(0);
    expect(laengsteFehlerfreieStrecke('', [])).toBe(0);
  });
});
