/**
 * Der freie Modulbereich (SPEC.md 10).
 *
 * Hier liegen die Einheiten, die **nicht** als Zwischenstück im Lernpfad
 * stehen: jederzeit spielbar, in beliebiger Reihenfolge, ohne Freischaltung.
 * Aufbau jeder Einheit wie in SPEC.md 10 vorgegeben — kurze Erklärung,
 * interaktive Aufgabe, Auswertung.
 *
 * **Warum es zwei Inhaltsdateien gibt:** `content/interludes.json` enthält die
 * acht Einheiten, die im Lernpfad liegen (6.6), `content/modules/*.json` die
 * übrigen. Das ist keine doppelte Wahrheit, sondern eine Aufteilung nach dem
 * einzigen Unterschied, den es gibt: ob eine Einheit an einer Lektion hängt.
 * Beide schreiben in dieselbe Tabelle `module_progress`, und der Modulbereich
 * zeigt beide — die Zwischenstücke als das, was sie sind: schon unterwegs
 * gesehen.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import medien from '../../content/modules/medien.json';
import lernen from '../../content/modules/lernen.json';
import text from '../../content/modules/text.json';
import { allInterludes, type Interlude } from './interludes';

// ------------------------------------------------------------- Aufgaben

/** Einfachauswahl mit Erklärung — dieselbe Form wie in den Zwischenstücken. */
export interface AufgabeQuiz {
  readonly art: 'quiz';
  readonly text: string;
  readonly optionen: readonly string[];
  readonly richtig: number;
  readonly erklaerung: string;
}

/**
 * Karten in Fächer einsortieren.
 *
 * Deckt fast alle Aufgaben aus SPEC.md 10.1 ab: Passwörter nach Stärke,
 * „gehört ins Internet" gegen „gehört nicht", echt gegen erfunden, Werbung
 * gegen Inhalt, Dateien in Ordner. Eine Form für fünf Aufgaben ist besser als
 * fünf Formen — jede zusätzliche will erklärt und bedient werden.
 */
export interface AufgabeZuordnen {
  readonly art: 'zuordnen';
  readonly text: string;
  readonly faecher: readonly { readonly id: string; readonly label: string }[];
  readonly karten: readonly { readonly text: string; readonly fach: string }[];
  readonly erklaerung: string;
}

/**
 * Sätze in eigenen Worten umschreiben, getippt (MODUL-LERNEN.md E4).
 *
 * Geprüft wird nur, ob die entscheidende Wendung vorkommt — **nicht**, ob der
 * Satz „richtig" ist. Es gibt hier keine richtigen Antworten (MODUL-LERNEN.md 5).
 */
export interface AufgabeUmschreiben {
  readonly art: 'umschreiben';
  readonly text: string;
  readonly saetze: readonly {
    readonly vorgabe: string;
    readonly mussEnthalten: readonly string[];
    readonly beispiel: string;
  }[];
  readonly erklaerung: string;
}

/** Tastenkürzel-Trainer (SPEC.md 10.1, Einheit 7). */
export interface AufgabeTastenkuerzel {
  readonly art: 'tastenkuerzel';
  readonly text: string;
  readonly kuerzel: readonly {
    readonly label: string;
    /** `KeyC`, `KeyV` … — der physische Code, nicht das Zeichen. */
    readonly code: string;
    readonly ctrl: boolean;
    readonly shift: boolean;
  }[];
  readonly erklaerung: string;
}

/**
 * Die Waage aus MODUL-LERNEN.md E3: zwei Sätze gegeneinander, die Nutzerin
 * schiebt den Zeiger und sieht, welcher in einem Jahr besser dasteht.
 */
export interface AufgabeWaage {
  readonly art: 'waage';
  readonly text: string;
  readonly links: string;
  readonly rechts: string;
  readonly erklaerung: string;
}

/**
 * Ein Text, der gegen DIN 5008 verstößt und zu berichtigen ist
 * (SPEC.md 10.2). Geprüft wird mit `checkDin5008()` — derselben Funktion, an
 * die sich Zehni selbst hält.
 */
export interface AufgabeTextprobe {
  readonly art: 'textprobe';
  readonly text: string;
  readonly vorgabe: string;
  readonly loesung: string;
  readonly erklaerung: string;
}

export type Aufgabe =
  | AufgabeQuiz
  | AufgabeZuordnen
  | AufgabeUmschreiben
  | AufgabeTastenkuerzel
  | AufgabeWaage
  | AufgabeTextprobe;

// -------------------------------------------------------------- Einheiten

export interface ModulEinheit {
  readonly id: string;
  readonly title: string;
  /** Metadaten für die Elternansicht, nie in der Kinderoberfläche (NORMEN.md 6). */
  readonly kmk?: number;
  readonly digcomp?: string;
  readonly bloecke: readonly string[];
  readonly aufgabe: Aufgabe;
  /** Schlusssatz nach der Aufgabe. */
  readonly abschluss: string;
}

export interface Modul {
  readonly id: string;
  readonly title: string;
  readonly beschreibung: string;
  readonly units: readonly ModulEinheit[];
}

const MODULE: readonly Modul[] = [medien, lernen, text] as readonly Modul[];

export function alleModule(): readonly Modul[] {
  return MODULE;
}

export function getModul(id: string): Modul | undefined {
  return MODULE.find((m) => m.id === id);
}

export function alleEinheiten(): readonly ModulEinheit[] {
  return MODULE.flatMap((m) => m.units);
}

export function getEinheit(id: string): ModulEinheit | undefined {
  return alleEinheiten().find((u) => u.id === id);
}

// ------------------------------------------- Anzeige im Modulbereich

/** Ein Eintrag in der Übersicht — freie Einheit oder Zwischenstück. */
export interface Uebersichtseintrag {
  readonly id: string;
  readonly title: string;
  /** Liegt im Lernpfad und wird dort angeboten (SPEC.md 6.6). */
  readonly imLernpfad: boolean;
  /** Nur bei Zwischenstücken belegt. */
  readonly afterLesson?: string;
}

/**
 * Die Einheiten eines Moduls für die Übersicht — freie **und** die im Lernpfad
 * liegenden, damit das Modul vollständig aussieht.
 *
 * Die Zuordnung eines Zwischenstücks zu seinem Modul steckt in seiner ID
 * (`medien-…`, `lernen-…`). Das ist knapp, aber eindeutig; ein Test hält es
 * fest, damit eine umbenannte ID nicht stillschweigend aus der Übersicht fällt.
 */
export function uebersicht(modulId: string): readonly Uebersichtseintrag[] {
  const modul = getModul(modulId);
  if (!modul) return [];

  const praefix = modulId.replace(/^modul-/, '');
  const ausDemPfad: Uebersichtseintrag[] = allInterludes()
    .filter((u: Interlude) => u.id.startsWith(`${praefix}-`))
    .map((u) => ({
      id: u.id,
      title: u.title,
      imLernpfad: true,
      afterLesson: u.afterLesson,
    }));

  const frei: Uebersichtseintrag[] = modul.units.map((u) => ({
    id: u.id,
    title: u.title,
    imLernpfad: false,
  }));

  return [...ausDemPfad, ...frei];
}

/** Wie viele Einheiten dieses Modul insgesamt hat, Zwischenstücke eingerechnet. */
export function einheitenGesamt(modulId: string): number {
  return uebersicht(modulId).length;
}

// --------------------------------------------------------- Auswertung

/**
 * Ob eine Zuordnung stimmt.
 *
 * `undefined` als Fach heißt „noch nicht einsortiert" und gilt als falsch —
 * aber die Aufgabe ist damit nicht verloren: Die Oberfläche lässt beliebig oft
 * umsortieren, bevor ausgewertet wird.
 */
export function zuordnungKorrekt(
  aufgabe: AufgabeZuordnen,
  gewaehlt: ReadonlyMap<number, string>,
): boolean {
  return aufgabe.karten.every((k, i) => gewaehlt.get(i) === k.fach);
}

/** Wie viele Karten richtig liegen. */
export function zuordnungTreffer(
  aufgabe: AufgabeZuordnen,
  gewaehlt: ReadonlyMap<number, string>,
): number {
  return aufgabe.karten.filter((k, i) => gewaehlt.get(i) === k.fach).length;
}

/**
 * Ob eine Umschreibung die entscheidende Wendung enthält.
 *
 * Großschreibung und Randleerzeichen werden ignoriert: Es geht um den Gedanken,
 * nicht um Rechtschreibung. Eine leere Eingabe zählt nie.
 */
export function umschreibungPasst(eingabe: string, mussEnthalten: readonly string[]): boolean {
  const norm = eingabe.trim().toLowerCase();
  if (norm.length === 0) return false;
  return mussEnthalten.every((teil) => norm.includes(teil.toLowerCase()));
}

/** Ob ein gedrücktes Tastenkürzel dem gesuchten entspricht. */
export function kuerzelPasst(
  gesucht: AufgabeTastenkuerzel['kuerzel'][number],
  gedrueckt: { code: string; ctrl: boolean; shift: boolean },
): boolean {
  return (
    gedrueckt.code === gesucht.code &&
    gedrueckt.ctrl === gesucht.ctrl &&
    gedrueckt.shift === gesucht.shift
  );
}
