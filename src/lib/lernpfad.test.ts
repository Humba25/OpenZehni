import { describe, it, expect } from 'vitest';
import { lernpfad, geplanteStationen, stationOffen, type Station } from './lernpfad';
import { allLessons, getLesson } from './curriculum';
import { allInterludes } from './interludes';
import { alleEinheiten, getEinheit } from './module';
import { wortsalatSpielbar } from './minispiele';

const pfad = lernpfad();

describe('Lernweg — SPEC.md 6.7', () => {
  it('enthält jede Lektion genau einmal und in der richtigen Reihenfolge', () => {
    const lektionen = pfad.filter((s) => s.art === 'lektion').map((s) => s.lessonId);
    expect(lektionen).toEqual(allLessons().map((l) => l.id));
  });

  it('enthält jedes Zwischenstück genau einmal', () => {
    const zwischen = pfad.filter((s) => s.art === 'zwischenstueck').map((s) => s.unitId);
    expect(new Set(zwischen).size).toBe(zwischen.length);
    expect(zwischen).toHaveLength(allInterludes().length);
  });

  /**
   * Der eigentliche Zweck dieser Datei: Alles, was die App zu bieten hat, liegt
   * sichtbar auf dem Weg. Bleibt eine Einheit nur im Modulmenü, sieht sie
   * niemand, der nicht von selbst dort hineinklickt.
   */
  it('bringt jede freie Modul-Einheit auf den Weg, jede genau einmal', () => {
    const module = pfad.filter((s) => s.art === 'modul').map((s) => s.einheitId);
    expect(new Set(module).size).toBe(module.length);
    expect([...module].sort()).toEqual(
      alleEinheiten()
        .map((u) => u.id)
        .sort(),
    );
  });

  it('verweist nur auf Dinge, die es gibt', () => {
    for (const s of pfad) {
      if (s.art === 'lektion') expect(getLesson(s.lessonId), s.lessonId).toBeTruthy();
      if (s.art === 'modul') expect(getEinheit(s.einheitId), s.einheitId).toBeTruthy();
      if (s.art !== 'lektion') expect(getLesson(s.nachLektion), s.nachLektion).toBeTruthy();
    }
  });

  it('bringt beide Minispiele unter', () => {
    const spiele = new Set(pfad.filter((s) => s.art === 'spiel').map((s) => s.spiel));
    expect(spiele).toEqual(new Set(['buchstabenregen', 'wortsalat']));
  });

  it('beginnt mit einer Lektion', () => {
    expect(pfad[0]?.art).toBe('lektion');
  });
});

describe('Wo die Stationen liegen', () => {
  const zwischenstueckNach = new Set(allInterludes().map((u) => u.afterLesson));

  /** Zwei Unterbrechungen hintereinander wären eine zu viel. */
  it('legt keine geplante Station auf eine Lektion mit Zwischenstück', () => {
    for (const e of geplanteStationen()) {
      expect(zwischenstueckNach.has(e.nachLektion), e.nachLektion).toBe(false);
    }
  });

  /** Vorher gibt der Zeichenvorrat keine Wörter her (`minispiele.ts`). */
  it('bietet Wortsalat erst an, wenn er spielbar ist', () => {
    for (const s of pfad) {
      if (s.art !== 'spiel' || s.spiel !== 'wortsalat') continue;
      expect(wortsalatSpielbar(s.nachLektion), s.nachLektion).toBe(true);
    }
  });

  /**
   * Eine Textprobe wird **getippt**. Sie darf deshalb nur dort auf dem Weg
   * liegen, wo alle nötigen Zeichen gelernt sind — dieselbe harte Regel wie
   * für Übungstexte (SPEC.md 6.2).
   */
  it('verlangt in keiner Textprobe ein ungelerntes Zeichen', () => {
    for (const s of pfad) {
      if (s.art !== 'modul') continue;
      const einheit = getEinheit(s.einheitId);
      if (einheit?.aufgabe.art !== 'textprobe') continue;

      const erlaubt = new Set([...getLesson(s.nachLektion)!.chars]);
      for (const c of einheit.aufgabe.loesung) {
        expect(erlaubt.has(c), `${s.einheitId} nach ${s.nachLektion}: '${c}'`).toBe(true);
      }
    }
  });

  it('verteilt die Stationen über den ganzen Weg', () => {
    const stellen = geplanteStationen().map((e) => getLesson(e.nachLektion)!.order);
    expect(Math.min(...stellen)).toBeLessThanOrEqual(2);
    expect(Math.max(...stellen)).toBeGreaterThanOrEqual(23);
  });

  /** Keine Durststrecke: nie mehr als vier Lektionen ohne irgendeine Station. */
  it('lässt nie zu viele Lektionen ohne Abwechslung', () => {
    let seitLetzter = 0;
    let groesste = 0;
    for (const s of pfad) {
      if (s.art === 'lektion') seitLetzter++;
      else {
        groesste = Math.max(groesste, seitLetzter);
        seitLetzter = 0;
      }
    }
    expect(groesste).toBeLessThanOrEqual(4);
  });
});

describe('Erreichbarkeit', () => {
  const offen = new Set(['L01', 'L02']);

  it('öffnet eine Station mit der Lektion davor, nicht erst nach dem Bestehen', () => {
    const station: Station = { art: 'modul', einheitId: 'medien-daten', nachLektion: 'L01' };
    expect(stationOffen(station, offen)).toBe(true);
  });

  it('lässt eine Station hinter einer gesperrten Lektion zu', () => {
    const station: Station = { art: 'spiel', spiel: 'wortsalat', nachLektion: 'L19' };
    expect(stationOffen(station, offen)).toBe(false);
  });

  it('behandelt Lektionen wie bisher', () => {
    expect(stationOffen({ art: 'lektion', lessonId: 'L01' }, offen)).toBe(true);
    expect(stationOffen({ art: 'lektion', lessonId: 'L09' }, offen)).toBe(false);
  });
});
