/**
 * Prüft die Handgrafik, indem sie wirklich gezeichnet wird.
 *
 * Gerendert wird mit `renderToStaticMarkup` — das läuft ohne Browser und ohne
 * jsdom. Geprüft wird nicht das Aussehen (das kann kein Test), sondern die
 * Aussage: **Leuchtet für ein gegebenes Zeichen der richtige Finger?**
 *
 * Das ist die Frage, die nach der ersten Fassung offen war: Die App zeigte die
 * richtige Taste, sagte aber nicht, mit welchem Finger.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Hands } from './Hands';
import { FINGER_COLOR, FINGER_COLOR_IDLE } from './fingerColors';
import { fingerFor, allTypableChars, type Finger } from '../../lib/charset';
import { allLessons } from '../../lib/curriculum';
import { de } from '../../i18n/de';

const zeichne = (nextChar?: string): string =>
  renderToStaticMarkup(<Hands {...(nextChar !== undefined ? { nextChar } : {})} />);

/** Zählt, wie oft eine Farbe als Füllung vorkommt. */
const fuellungen = (markup: string, farbe: string): number =>
  markup.split(`fill="${farbe}"`).length - 1;

describe('Handgrafik — SPEC.md 7.3', () => {
  it('zeichnet zehn Finger', () => {
    const markup = zeichne();
    // Jeder Finger ist ein abgerundetes Rechteck mit Fuellung; dazu kommen
    // zwei Handflaechen.
    const rechtecke = markup.split('<rect').length - 1;
    expect(rechtecke).toBe(12);
  });

  it('lässt ohne Zeichen alle Finger grau', () => {
    const markup = zeichne();
    expect(fuellungen(markup, FINGER_COLOR_IDLE)).toBe(10);
  });

  it('hebt für f den linken Zeigefinger hervor', () => {
    const markup = zeichne('f');
    expect(markup).toContain(`fill="${FINGER_COLOR.leftIndex}"`);
    expect(markup).toContain(de.tastatur.finger.leftIndex);
  });

  it('hebt für j den rechten Zeigefinger hervor', () => {
    const markup = zeichne('j');
    expect(markup).toContain(`fill="${FINGER_COLOR.rightIndex}"`);
    expect(markup).toContain(de.tastatur.finger.rightIndex);
  });

  it('hebt für die Leertaste den Daumen hervor', () => {
    const markup = zeichne(' ');
    expect(markup).toContain(`fill="${FINGER_COLOR.thumb}"`);
    expect(markup).toContain(de.tastatur.finger.thumb);
  });

  /**
   * Der häufigste Anfängerfehler: beide Tasten mit einer Hand greifen
   * (DIDAKTIK.md 2.3). Die Grafik muss deshalb **zwei** Finger zeigen — den
   * für den Buchstaben und den kleinen Finger der anderen Hand für Umschalt.
   */
  it('zeigt bei einem Großbuchstaben auch den gegengleichen kleinen Finger', () => {
    // A liegt links, die Umschalttaste gehoert also nach rechts.
    const markup = zeichne('A');
    expect(markup).toContain(`fill="${FINGER_COLOR.leftPinky}"`); // das A selbst
    expect(markup).toContain(`fill="${FINGER_COLOR.rightPinky}"`); // Umschalt rechts
  });

  it('zeigt bei einem rechts getippten Großbuchstaben die linke Umschalttaste', () => {
    const markup = zeichne('L');
    expect(markup).toContain(`fill="${FINGER_COLOR.rightRing}"`); // das L selbst
    expect(markup).toContain(`fill="${FINGER_COLOR.leftPinky}"`); // Umschalt links
  });

  it('zeigt beim at-Zeichen den Daumen für AltGr mit', () => {
    const markup = zeichne('@');
    expect(markup).toContain(`fill="${FINGER_COLOR.leftPinky}"`); // q
    expect(markup).toContain(`fill="${FINGER_COLOR.thumb}"`); // AltGr
  });

  it('nennt den Finger im Klartext, nicht nur als Farbe', () => {
    // Farbe allein traegt die Information nicht (SPEC.md 12.2).
    for (const [char, finger] of [
      ['a', 'leftPinky'],
      ['ö', 'rightPinky'],
      ['e', 'leftMiddle'],
    ] as [string, Finger][]) {
      expect(zeichne(char)).toContain(de.tastatur.finger[finger]);
    }
  });

  /**
   * Der entscheidende Test: Für **jedes** Zeichen, das im Lernpfad vorkommt,
   * muss die Grafik einen Finger hervorheben. Bliebe sie grau, stünde das Kind
   * wieder ohne Antwort da.
   */
  it('hebt für jedes Zeichen jeder Lektion einen Finger hervor', () => {
    for (const lesson of allLessons()) {
      for (const char of lesson.chars) {
        const finger = fingerFor(char)!;
        const markup = zeichne(char);
        expect(
          markup.includes(`fill="${FINGER_COLOR[finger]}"`),
          `${lesson.id}: '${char}' hebt keinen Finger hervor`,
        ).toBe(true);
      }
    }
  });

  it('kommt mit jedem Zeichen zurecht, das T1 erzeugen kann', () => {
    for (const char of allTypableChars()) {
      expect(() => zeichne(char), `'${char}'`).not.toThrow();
    }
  });
});
