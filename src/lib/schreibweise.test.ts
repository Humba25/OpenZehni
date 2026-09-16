import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkSchreibweise, isSchreibweiseKorrekt } from './schreibweise';
import { allLessons } from './curriculum';
import { de } from '../i18n/de';

const HIER = dirname(fileURLToPath(import.meta.url));

describe('Umschriebene Umlaute erkennen', () => {
  it('findet die Formen, die in diesem Projekt vorkamen', () => {
    for (const [falsch, richtig] of [
      ['Er schlaeft tief.', 'schläft'],
      ['Sie hoert gut.', 'hört'],
      ['Das Tier haelt Winterschlaf.', 'hält'],
      ['Erste echte Woerter', 'Wörter'],
      ['Grossbuchstaben mit Umschalt', 'Großbuchstaben'],
      ['Fliesstext und Tempo', 'Fließtext'],
      ['AltGr fuer das At-Zeichen', 'für'],
      ['Tastgefuehl ueber die Noppen', 'Tastgefühl'],
    ] as [string, string][]) {
      const f = checkSchreibweise(falsch);
      expect(f.length, falsch).toBeGreaterThan(0);
      expect(
        f.map((x) => x.richtig),
        falsch,
      ).toContain(richtig);
    }
  });

  it('nennt die richtige Schreibweise mit', () => {
    const f = checkSchreibweise('Er schlaeft.')[0]!;
    expect(f.richtig).toBe('schläft');
    expect(f.message).toContain('schläft');
  });

  /**
   * Der Grund für die feste Wortliste statt einer allgemeinen Regel: `ae`,
   * `oe`, `ue` und `ss` kommen in einwandfreiem Deutsch ständig vor. Eine Regel,
   * die sie pauschal beanstandet, wird nach der ersten Woche abgeschaltet.
   */
  it('beanstandet einwandfreies Deutsch nicht', () => {
    for (const richtig of [
      'Das neue Abenteuer beginnt.',
      'Das Feuer ist heiß und teuer.',
      'Die Steuer wurde erhöht.',
      'Poesie und Duette mag sie gern.',
      'Die Masse des Körpers ist groß.',
      'Er nimmt den Bus, sie fährt Rad.',
      'Die Straßenbahn ist voll.',
      'Er las ein Buch über Aachen.',
      'Sie aß eine Waffel.',
    ]) {
      expect(checkSchreibweise(richtig), richtig).toEqual([]);
    }
  });

  it('trifft nicht mitten in einem längeren Wort', () => {
    expect(checkSchreibweise('Der Grossist liefert die Ware.')).toEqual([]);
  });

  it('erkennt gebeugte Formen', () => {
    expect(checkSchreibweise('Die grossen Tiere schlafen.').length).toBeGreaterThan(0);
  });

  it('gibt für sauberen Text ein leeres Ergebnis', () => {
    expect(isSchreibweiseKorrekt('Der Luchs jagt nachts im Wald.')).toBe(true);
  });
});

/**
 * **Der eigentliche Schutz.** Die Prüfung nützt nur, wenn sie über den echten
 * Bestand läuft — und zwar bei jedem `npm test`, nicht nur wenn jemand daran
 * denkt, ein Skript aufzurufen.
 *
 * Anlass: Derselbe Fehler ist zweimal passiert. Erst in `topics.seed.json`
 * (`schlaeft`, `hoert`), dann in `lessons.json` (`Woerter`, `Grossbuchstaben`,
 * `Fliesstext`). Beide Male standen die falschen Formen in Texten, die das Kind
 * zu sehen bekommt und abtippt.
 */
describe('Der echte Textbestand ist frei von umschriebenen Umlauten', () => {
  it('gilt für alle Lektionstitel und Schwerpunkte', () => {
    for (const lesson of allLessons()) {
      expect(checkSchreibweise(lesson.title), `${lesson.id} Titel`).toEqual([]);
      expect(checkSchreibweise(lesson.focus), `${lesson.id} Schwerpunkt`).toEqual([]);
    }
  });

  it('gilt für alle Oberflächentexte', () => {
    const pruefe = (wert: unknown, pfad: string): void => {
      if (typeof wert === 'string') {
        expect(checkSchreibweise(wert), pfad).toEqual([]);
        return;
      }
      if (wert && typeof wert === 'object') {
        for (const [k, v] of Object.entries(wert)) pruefe(v, `${pfad}.${k}`);
      }
    };
    pruefe(de, 'de');
  });

  it('gilt für alle Seed-Texte und Wissenshäppchen', () => {
    const seed = JSON.parse(
      readFileSync(join(HIER, '..', '..', 'content', 'topics.seed.json'), 'utf8'),
    ) as { topics: { id: string; texts: { body: string }[]; facts: string[] }[] };

    for (const topic of seed.topics) {
      for (const [i, t] of topic.texts.entries()) {
        expect(checkSchreibweise(t.body), `${topic.id} Text ${i}`).toEqual([]);
      }
      for (const [i, f] of topic.facts.entries()) {
        expect(checkSchreibweise(f), `${topic.id} Fakt ${i}`).toEqual([]);
      }
    }
  });
});
