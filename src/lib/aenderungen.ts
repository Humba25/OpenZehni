/**
 * Was sich je Version geändert hat (SPEC.md 11.4).
 *
 * Wunsch des Nutzers vom 2026-09-18: nachlesen können, was ein Update gebracht
 * hat. Ohne das ist ein Update etwas, das passiert — mit dem Text dahinter ist
 * es etwas, das jemand gemacht hat.
 *
 * **Geschrieben für die, die Zehni benutzen, nicht für Entwickler.** Hier steht,
 * was jemand merkt, wenn er die App öffnet, nicht welche Datei umgebaut wurde.
 * Sie liegt als Daten in `content/aenderungen.json`, nicht im Code
 * (ARCHITEKTUR.md, Architekturregel 4).
 *
 * **Die Liste wird mitgeliefert, nicht geladen.** Zehni spricht mit keinem
 * Server außer dem Updater (Architekturregel 2). Was hier steht, stand schon
 * im Installer — also auch dann lesbar, wenn das Gerät offline ist.
 *
 * Reine Logik: kein React, kein Tauri (Architekturregel 1).
 */

import daten from '../../content/aenderungen.json';

export interface Aenderung {
  readonly version: string;
  /** ISO-Datum. */
  readonly datum: string;
  readonly punkte: readonly string[];
}

const ALLE: readonly Aenderung[] = daten.versionen;

/**
 * Alle Einträge, neueste zuerst — **auch die noch nicht ausgelieferten.**
 *
 * Für die Oberfläche ist `aenderungenBis()` gemeint; diese Funktion gibt es
 * für die Prüfung der Datei selbst.
 */
export function alleAenderungen(): readonly Aenderung[] {
  return ALLE;
}

/**
 * Eine Versionsnummer in ihre Zahlen zerlegen — `0.1.10` ist **größer** als
 * `0.1.9`, obwohl es alphabetisch kleiner ist.
 */
function teile(version: string): readonly number[] {
  return version.split('.').map((t) => Number.parseInt(t, 10) || 0);
}

/** Ist `a` dieselbe oder eine ältere Version als `b`? */
export function versionKleinerGleich(a: string, b: string): boolean {
  const x = teile(a);
  const y = teile(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const links = x[i] ?? 0;
    const rechts = y[i] ?? 0;
    if (links !== rechts) return links < rechts;
  }
  return true;
}

/**
 * Die Einträge, die zu einer laufenden Version gehören — neueste zuerst.
 *
 * **Nur, was schon ausgeliefert ist.** Die Einträge entstehen, während gebaut
 * wird, und stehen damit oft schon in der Datei, bevor die Version heraus ist.
 * Jemandem zu erzählen, was in einer Version steckt, die er nicht hat, wäre
 * die verwirrendste Art, diese Liste zu füllen — er würde die neuen Sachen
 * suchen und nicht finden.
 *
 * Lässt sich die laufende Version nicht lesen, wird alles gezeigt. Das ist der
 * seltene Fall (Entwicklungsbetrieb), und dort ist zu viel besser als nichts.
 */
export function aenderungenBis(version: string | null): readonly Aenderung[] {
  if (!version) return ALLE;
  return ALLE.filter((a) => versionKleinerGleich(a.version, version));
}

/**
 * Der Eintrag zur laufenden Version, oder — wenn es keinen gibt — der neueste,
 * den es schon gibt.
 *
 * **Warum der Rückfall.** Ein Eintrag kann fehlen, etwa wenn jemand aus dem
 * Quelltext baut oder ich beim Release den Eintrag vergesse. „Nichts anzeigen"
 * wäre dann die schlechteste Antwort: Der Nutzer sucht den Fehler bei sich.
 */
export function eintragFuer(version: string | null): Aenderung | undefined {
  const sichtbar = aenderungenBis(version);
  if (version) {
    const treffer = sichtbar.find((a) => a.version === version);
    if (treffer) return treffer;
  }
  return sichtbar[0];
}

/**
 * Das Datum lesbar machen: `2026-09-18` wird zu `18.09.2026`.
 *
 * Tag.Monat.Jahr mit führenden Nullen und Punkten — so schreibt man ein Datum
 * in Deutschland (`NORMEN.md` 5.1, DIN 5008 Ziffernschreibweise). Ein Datum,
 * das nicht wie ein Datum aussieht, liest niemand.
 */
export function datumLesbar(iso: string): string {
  const treffer = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!treffer) return iso;
  const [, jahr, monat, tag] = treffer;
  return `${tag}.${monat}.${jahr}`;
}
