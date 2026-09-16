/**
 * Die Tagesaufgabe (SPEC.md 8.6).
 *
 * Eine kleine zusätzliche Aufgabe pro Tag, **freiwillig**, mit Extra-XP. Sie
 * steht als Karte auf dem Lernweg und lässt sich wegklicken.
 *
 * **Nicht geschafft heißt gar nichts.** Um Mitternacht verschwindet die Karte
 * stillschweigend. Es gibt keine Meldung über eine verpasste Aufgabe, keinen
 * Zähler verpasster Tage, keinen Verlust — dieses Modul kennt deshalb keine
 * Funktion, die eine verpasste Aufgabe überhaupt benennen könnte.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import katalog from '../../content/challenges.json';
import { countStrokes } from './metrics';
import { getLesson } from './curriculum';
import type { CharState } from './typing-engine';

/** Woran eine Tagesaufgabe gemessen wird. */
export type ChallengeKind =
  | 'runden'
  | 'minuten-am-stueck'
  | 'anschlaege-ohne-fehler'
  | 'sterne'
  | 'blindrunden'
  | 'tastenjagd'
  | 'lektion-bestanden'
  | 'zwischenstueck';

/**
 * Wie sich der Fortschritt bildet.
 *
 * `summe` zählt über den Tag auf („drei Runden"), `bestwert` behält den besten
 * Einzelwert („200 Anschläge ohne Vertipper" — in **einer** Runde, nicht über
 * den Tag zusammengestückelt).
 */
export type Messung = 'summe' | 'bestwert';

export interface Challenge {
  readonly id: string;
  readonly text: string;
  readonly kind: ChallengeKind;
  readonly ziel: number;
  readonly messung: Messung;
  /** Diese Lektion muss freigeschaltet sein, sonst ist die Aufgabe nicht erfüllbar. */
  readonly abLektion: string;
}

const AUFGABEN: readonly Challenge[] = katalog.aufgaben as readonly Challenge[];

export function allChallenges(): readonly Challenge[] {
  return AUFGABEN;
}

export function getChallenge(id: string): Challenge | undefined {
  return AUFGABEN.find((a) => a.id === id);
}

/**
 * Die Aufgaben, die mit dem aktuellen Stand überhaupt erfüllbar sind
 * (SPEC.md 8.6). Eine Aufgabe, die `L18` voraussetzt, darf in `L03` nicht
 * erscheinen — sie wäre nicht schwer, sondern unmöglich.
 */
export function erfuellbareAufgaben(freigeschaltet: ReadonlySet<string>): readonly Challenge[] {
  return AUFGABEN.filter((a) => freigeschaltet.has(a.abLektion));
}

/**
 * Kleiner Streuwert (FNV-1a) für die Ziehung.
 *
 * Absichtlich **kein** `Math.random()`: Dieselbe Aufgabe soll den Tag über
 * stehen bleiben, auch nach einem Neustart (SPEC.md 8.6).
 */
function streuwert(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Zieht die Aufgabe des Tages — deterministisch aus Datum und Profil-ID.
 *
 * **Gezogen wird nur einmal je Tag.** Die Datenbank hält die gezogene Aufgabe
 * in `daily_challenge` fest; diese Funktion läuft nur, wenn für den Tag noch
 * nichts dasteht. Sonst könnte eine mitten am Tag freigeschaltete Lektion die
 * Auswahlmenge vergrößern und die Karte unter der Hand austauschen.
 */
export function tagesaufgabeFuer(
  tag: string,
  profilId: number,
  freigeschaltet: ReadonlySet<string>,
): Challenge | undefined {
  const moeglich = erfuellbareAufgaben(freigeschaltet);
  if (moeglich.length === 0) return undefined;
  return moeglich[streuwert(`${tag.slice(0, 10)}#${profilId}`) % moeglich.length];
}

// ----------------------------------------------------------- Fortschritt

/** Was im Lauf eines Tages passieren kann und für eine Aufgabe zählt. */
export type Ereignis =
  | {
      readonly art: 'runde';
      readonly bestanden: boolean;
      readonly sterne: number;
      readonly dauerMs: number;
      readonly blind: boolean;
      /** Längste Strecke ohne Vertipper in dieser Runde, in Anschlägen. */
      readonly strecke: number;
    }
  | { readonly art: 'tastenjagd' }
  | { readonly art: 'zwischenstueck' };

/** Was ein einzelnes Ereignis zu einer Aufgabe beiträgt. */
function beitrag(aufgabe: Challenge, e: Ereignis): number {
  switch (aufgabe.kind) {
    case 'runden':
      return e.art === 'runde' ? 1 : 0;
    case 'blindrunden':
      return e.art === 'runde' && e.blind ? 1 : 0;
    case 'lektion-bestanden':
      return e.art === 'runde' && e.bestanden ? 1 : 0;
    case 'minuten-am-stueck':
      return e.art === 'runde' ? Math.floor(e.dauerMs / 60_000) : 0;
    case 'anschlaege-ohne-fehler':
      return e.art === 'runde' ? e.strecke : 0;
    case 'sterne':
      return e.art === 'runde' ? e.sterne : 0;
    case 'tastenjagd':
      return e.art === 'tastenjagd' ? 1 : 0;
    case 'zwischenstueck':
      return e.art === 'zwischenstueck' ? 1 : 0;
  }
}

/**
 * Der neue Fortschrittswert nach einem Ereignis.
 *
 * Gedeckelt beim Ziel: Ein Fortschritt von 812 bei Ziel 200 sagt nichts mehr
 * aus und macht den Balken kaputt.
 */
export function fortschrittNach(aufgabe: Challenge, stand: number, e: Ereignis): number {
  const b = beitrag(aufgabe, e);
  const roh = aufgabe.messung === 'summe' ? stand + b : Math.max(stand, b);
  return Math.min(roh, aufgabe.ziel);
}

export function istErfuellt(aufgabe: Challenge, stand: number): boolean {
  return stand >= aufgabe.ziel;
}

/** Anteil des Balkens, zwischen 0 und 1. */
export function balkenAnteil(aufgabe: Challenge, stand: number): number {
  if (aufgabe.ziel <= 0) return 1;
  return Math.min(1, Math.max(0, stand / aufgabe.ziel));
}

// ------------------------------------------------- Fehlerfreie Strecke

/**
 * Die längste Strecke ohne Vertipper in einer Runde, gemessen in **Anschlägen**
 * nach `NORMEN.md` 4.1.
 *
 * Gezählt wird nur, was beim ersten Anschlag saß: Ein korrigiertes Zeichen
 * (`corrected`) unterbricht die Strecke, obwohl am Ende das Richtige dasteht.
 * Für die amtliche Fehlerzählung wäre das falsch (dort zählt der Ergebnistext,
 * `NORMEN.md` 4.2) — die Tagesaufgabe ist aber keine Bewertung, sondern eine
 * Trainingsrückmeldung und darf deshalb an der Sicherheit hängen
 * (`NORMEN.md` 4.4.1).
 */
export function laengsteFehlerfreieStrecke(text: string, states: readonly CharState[]): number {
  const zeichen = [...text];
  let beste = 0;
  let laufend = 0;

  for (let i = 0; i < zeichen.length; i++) {
    if (states[i] === 'correct') {
      laufend += countStrokes(zeichen[i]!);
      if (laufend > beste) beste = laufend;
    } else {
      laufend = 0;
    }
  }

  return beste;
}

/**
 * Prüft beim Programmstart, dass jede Aufgabe auf eine Lektion verweist, die es
 * gibt. Ein Tippfehler in `abLektion` würde die Aufgabe sonst still für immer
 * unsichtbar machen.
 */
export function unbekannteLektionen(): readonly string[] {
  return AUFGABEN.filter((a) => getLesson(a.abLektion) === undefined).map((a) => a.abLektion);
}
