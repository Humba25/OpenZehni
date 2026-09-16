/**
 * Die Zwischenstücke im Lernpfad (SPEC.md 6.6).
 *
 * Nach jeder dritten Lektion steht eine Einheit aus Medienkompetenz oder
 * „Lernen lernen". Die Inhalte liegen als Daten in `content/interludes.json`
 * (ARCHITEKTUR.md, Architekturregel 4); hier steht nur, **wann** welche dran ist.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import daten from '../../content/interludes.json';

export type InterludeType =
  | 'wissen'
  | 'lernen'
  | 'lernen-kurve'
  | 'falle-gewinn'
  | 'falle-steckbrief'
  | 'falle-kleingedrucktes';

export interface InterludeFrage {
  readonly text: string;
  readonly optionen: readonly string[];
  readonly richtig: number;
  readonly erklaerung: string;
}

export interface Interlude {
  readonly id: string;
  readonly type: InterludeType;
  /** Nach welcher Lektion dieses Zwischenstück angeboten wird. */
  readonly afterLesson: string;
  readonly title: string;
  /** Metadaten für die Elternansicht, nie in der Kinderoberfläche (NORMEN.md 6). */
  readonly kmk?: number;
  readonly digcomp?: string;
  readonly bloecke?: readonly string[];
  readonly frage?: InterludeFrage;
  readonly neutraleFassung?: string;
  readonly erklaerungNachDaten?: string;
  readonly aufloesung?: Record<string, unknown>;
}

const UNITS: readonly Interlude[] = daten.units as readonly Interlude[];

export function allInterludes(): readonly Interlude[] {
  return UNITS;
}

export function getInterlude(id: string): Interlude | undefined {
  return UNITS.find((u) => u.id === id);
}

/** Das Zwischenstück, das nach dieser Lektion ansteht — falls es eines gibt. */
export function interludeAfter(lessonId: string): Interlude | undefined {
  return UNITS.find((u) => u.afterLesson === lessonId);
}

/**
 * Steht nach dieser Lektion ein Zwischenstück an, das noch nicht erledigt ist?
 *
 * **Ein Zwischenstück hält nie auf** (SPEC.md 6.6). Wer es überspringt,
 * bekommt es beim nächsten Abschluss derselben Lektion erneut angeboten — aber
 * der Lernpfad bleibt offen.
 */
export function faelligesInterlude(
  lessonId: string,
  erledigt: ReadonlySet<string>,
): Interlude | undefined {
  const u = interludeAfter(lessonId);
  if (!u || erledigt.has(u.id)) return undefined;
  return u;
}

/** Ist diese Einheit eine Falle (SPEC.md 6.6.1)? */
export function istFalle(u: Interlude): boolean {
  return u.type.startsWith('falle-');
}

/**
 * Wie viele Sitzungen es mindestens braucht, bevor Zehni etwas über das Lernen
 * der Nutzerin **behauptet** (MODUL-LERNEN.md 1.1, 7).
 *
 * Darunter zeigt die Einheit ihre neutrale Fassung. Es wird **nie** ein
 * Beispielwert als ihr Wert ausgegeben — das ist eine unverhandelbare Regel
 * (ARCHITEKTUR.md).
 */
export const MIN_SITZUNGEN_FUER_AUSSAGE = 5;

export function darfUeberLernenSprechen(sitzungen: number): boolean {
  return sitzungen >= MIN_SITZUNGEN_FUER_AUSSAGE;
}
