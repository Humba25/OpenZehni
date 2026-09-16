/**
 * Der Geisterschreiber (SPEC.md 8.7).
 *
 * Ein zweiter, blasser Cursor läuft durch denselben Text — im Tempo des eigenen
 * besten früheren Durchgangs derselben Lektion. Kein Gegner von außen, nur der
 * eigene Rekord.
 *
 * **Er ist ein Schrittmacher, kein Countdown.** Er bricht nie etwas ab, nimmt
 * nichts weg und gewinnt nie lautstark (SPEC.md 8.11). Dieses Modul liefert
 * deshalb nur eine Position und einen sachlichen Vergleichssatz; eine Funktion,
 * die eine Übung beenden könnte, gibt es hier nicht.
 *
 * **Gleichmäßiges Tempo, bewusst.** Einzelne Anschlagzeiten aufzuzeichnen
 * kostet Speicher und Rechenzeit, und der Nutzen wäre gering
 * (Performance-Budget 12.1). Datengrundlage ist allein
 * `lesson_progress.best_strokes_min`.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import { countStrokes } from './metrics';

/**
 * Ab wann der Geist erscheint: **zweiter** Versuch. Vorher gibt es nichts zu
 * schlagen, und ein Geist, der aus dem Nichts kommt, wäre keine Bestleistung,
 * sondern eine Behauptung.
 */
export const GEIST_AB_VERSUCH = 2;

/** Im Abschlusstest ist der Geist immer aus (NORMEN.md 4.7). */
export const GEIST_VERBOTEN_IN = 'L25';

export interface GeistBedingungen {
  /** Bisherige Versuche dieser Lektion. */
  readonly versuche: number;
  /** Bestes Tempo dieser Lektion in Anschlägen pro Minute. */
  readonly bestStrokesMin: number | null;
  readonly lessonId: string;
  /** Der Schalter aus den Einstellungen (SPEC.md 8.7). */
  readonly eingeschaltet: boolean;
}

/**
 * Läuft in dieser Runde ein Geist mit?
 *
 * Die Prüfung auf den Abschlusstest steht **vor** allem anderen: Dort gelten
 * Wettbewerbsbedingungen, und die Einstellung der Nutzerin darf daran nichts
 * ändern (`NORMEN.md` 4.7).
 */
export function geistLaeuft(b: GeistBedingungen): boolean {
  if (b.lessonId === GEIST_VERBOTEN_IN) return false;
  if (!b.eingeschaltet) return false;
  if (b.versuche < GEIST_AB_VERSUCH - 1) return false;
  return b.bestStrokesMin !== null && b.bestStrokesMin > 0;
}

export interface Geist {
  /** Anschläge pro Minute, die der Geist läuft. */
  readonly strokesMin: number;
  /** Wie lange der Geist für den ganzen Text braucht, in Millisekunden. */
  readonly gesamtMs: number;
  /** Wie viele Zeichen der Geist nach dieser Zeit geschrieben hat. */
  indexBei(verstricheneMs: number): number;
}

/**
 * Baut den Geist für einen Text.
 *
 * Die Anschläge je Zeichen werden **einmal** aufsummiert und nicht bei jedem
 * Bildaufbau neu — der Cursor wird oft neu gezeichnet, der Text ändert sich nie
 * (Performance-Budget 12.1).
 *
 * Gerechnet wird in Anschlägen nach `NORMEN.md` 4.1, nicht in Zeichen: Ein
 * Großbuchstabe kostet zwei Anschläge und damit auch den Geist doppelt Zeit.
 * Sonst liefe er durch einen Text voller Großschreibung scheinbar schneller.
 */
export function erzeugeGeist(text: string, strokesMin: number): Geist {
  const zeichen = [...text];

  // Kumulierte Anschläge: summe[i] = Anschläge bis einschließlich Zeichen i.
  const summe = new Float64Array(zeichen.length);
  let gesamt = 0;
  for (let i = 0; i < zeichen.length; i++) {
    gesamt += countStrokes(zeichen[i]!);
    summe[i] = gesamt;
  }

  const proMs = strokesMin > 0 ? strokesMin / 60_000 : 0;

  return {
    strokesMin,
    gesamtMs: proMs > 0 ? gesamt / proMs : Infinity,
    indexBei(verstricheneMs: number): number {
      if (proMs <= 0 || verstricheneMs <= 0) return 0;
      const geschafft = verstricheneMs * proMs;
      // Binäre Suche: die erste Stelle, deren Summe über dem Geschafften liegt.
      let lo = 0;
      let hi = zeichen.length;
      while (lo < hi) {
        const mitte = (lo + hi) >> 1;
        if (summe[mitte]! <= geschafft) lo = mitte + 1;
        else hi = mitte;
      }
      return lo;
    },
  };
}

/**
 * Wie knapp war es? Für die Auswertung (SPEC.md 8.7).
 *
 * `gleichauf` hat absichtlich eine Spanne: Ein Unterschied von einem Anschlag
 * pro Minute ist Messrauschen, kein Sieg.
 */
export const GLEICHAUF_SPANNE = 2;

export type Ausgang = 'schneller' | 'gleichauf' | 'langsamer';

export function vergleich(eigenStrokesMin: number, geistStrokesMin: number): Ausgang {
  const abstand = eigenStrokesMin - geistStrokesMin;
  if (Math.abs(abstand) <= GLEICHAUF_SPANNE) return 'gleichauf';
  return abstand > 0 ? 'schneller' : 'langsamer';
}
