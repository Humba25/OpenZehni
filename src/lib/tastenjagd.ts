/**
 * Die Tastenjagd (SPEC.md 8.9).
 *
 * Macht die adaptive Wiederholung (6.4) sichtbar: Die App weiß aus
 * `char_stats`, welche Taste ständig danebengeht, und bietet nach der
 * Auswertung eine kurze Jagd darauf an — „Dein z macht dir Ärger.
 * Fünf Runden Jagd?"
 *
 * Drei Regeln aus der Spec stecken hier im Code:
 *
 * - **Nur bereits gelernte Zeichen.** Die Sequenzen entstehen aus dem
 *   Zeichenvorrat der zuletzt gespielten Lektion, nie aus dem vollen Alphabet.
 * - **Unbewertet.** Dieses Modul liefert Text, sonst nichts: keine Sterne,
 *   keine Fehlerquote, kein Eintrag in `lesson_progress`. Es gibt deshalb hier
 *   auch keine Funktion, die ein Ergebnis bewerten könnte.
 * - **Erst ab belastbarer Datenlage.** Ein Zeichen wird erst ab zwölf
 *   Anschlägen benannt (`typing-engine.ts`, `MIN_SAMPLES_FOR_WEAKNESS`). Eine
 *   Jagd auf ein Zeichen, das zweimal danebenging, wäre eine erfundene Schwäche
 *   — dieselbe Regel wie in `MODUL-LERNEN.md` 1.1.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import { generateDrill } from './drill';
import { getLesson } from './curriculum';
import { weakestChars, type CharStat } from './typing-engine';

/** Fünf Runden, wie sie das Angebot in SPEC.md 8.9 ankündigt. */
export const JAGD_RUNDEN = 5;

/** Obergrenze der Dauer in Sekunden (SPEC.md 8.9: 30 bis 45 Sekunden). */
export const JAGD_SEKUNDEN = 45;

export interface Jagdangebot {
  /** Das Problemzeichen. */
  readonly zeichen: string;
  /** Die Lektion, aus deren Zeichenvorrat die Sequenzen gebaut werden. */
  readonly lessonId: string;
}

/**
 * Gibt es etwas zu jagen?
 *
 * `undefined` ist der Normalfall am Anfang und **kein Fehler**: Solange die
 * Datenlage nichts hergibt, sagt die App über das Zeichen nichts und bietet
 * keine Jagd an.
 */
export function jagdAngebot(
  stats: ReadonlyMap<string, CharStat>,
  lessonId: string,
): Jagdangebot | undefined {
  const lesson = getLesson(lessonId);
  if (!lesson) return undefined;

  for (const zeichen of weakestChars(stats)) {
    // Ein Zeichen aus einer frueheren Lektion kann in char_stats stehen, ohne
    // im Vorrat dieser Lektion zu sein -- dann liesse sich daraus kein
    // zulaessiger Text bauen.
    if (lesson.chars.includes(zeichen)) return { zeichen, lessonId };
  }
  return undefined;
}

/**
 * Die Sequenzen der Jagd: kurze Gruppen mit dem Problemzeichen in wechselnder
 * Umgebung.
 *
 * Gebaut wird mit demselben Generator wie die Übungstexte (`drill.ts`) — damit
 * gelten hier automatisch dieselben Regeln, die dort mühsam erarbeitet wurden:
 * kein `ß` am Wortanfang, der Bindestrich nur verbindend, keine führende Null.
 * Ein zweiter Generator würde diese Regeln früher oder später verlieren.
 *
 * Das Problemzeichen steht sowohl in `newChars` als auch in `emphasize`, also
 * doppelt gewichtet — es ist der Gegenstand der Übung.
 */
export function jagdSequenzen(
  angebot: Jagdangebot,
  runden = JAGD_RUNDEN,
  saat = '',
): readonly string[] {
  const lesson = getLesson(angebot.lessonId);
  if (!lesson) {
    throw new Error(`tastenjagd.jagdSequenzen: Lektion '${angebot.lessonId}' gibt es nicht.`);
  }

  const sequenzen: string[] = [];
  for (let i = 0; i < runden; i++) {
    sequenzen.push(
      generateDrill({
        chars: lesson.chars,
        newChars: [angebot.zeichen],
        emphasize: [angebot.zeichen],
        minLength: 18,
        maxLength: 28,
        seed: `jagd#${angebot.lessonId}#${angebot.zeichen}#${saat}#${i}`,
      }),
    );
  }
  return sequenzen;
}

/**
 * Was am Ende einer Jagd dasteht.
 *
 * **Bewusst ohne Urteil.** Die Jagd ist unbewertet (`SPEC.md` 8.9): keine
 * Sterne, keine Fehlerquote, keine Note. Diese Zahlen sind die reine
 * Beschreibung dessen, was passiert ist — mehr darf eine Jagd nicht behaupten.
 *
 * Insbesondere steht hier **kein Vergleich „du bist besser geworden"**. Fünf
 * Runden sind dafür zu wenig; eine solche Aussage wäre eine erfundene
 * Fortschrittszahl und verstieße gegen dieselbe Regel, die auch für das Modul
 * „Lernen lernen" gilt (`MODUL-LERNEN.md` 1.1).
 */
export interface Jagdbilanz {
  /** Das gejagte Zeichen. */
  readonly zeichen: string;
  /** Wie oft es beim ersten Anschlag saß. */
  readonly treffer: number;
  /** Wie oft daneben gegriffen wurde. */
  readonly daneben: number;
  /** Wie viele Zeichen insgesamt getippt wurden — alle, nicht nur das gejagte. */
  readonly anschlaege: number;
}

/**
 * Rechnet die Bilanz aus den gesammelten Zeichenstatistiken einer Jagd.
 *
 * Die Statistiken kommen zeilenweise herein, weil je Zeile eine eigene Sitzung
 * läuft. Hier werden sie zusammengezählt.
 */
export function jagdbilanz(
  zeichen: string,
  statistiken: readonly ReadonlyMap<string, CharStat>[],
): Jagdbilanz {
  let treffer = 0;
  let daneben = 0;
  let anschlaege = 0;

  for (const karte of statistiken) {
    for (const [z, stat] of karte) {
      anschlaege += stat.hits + stat.misses;
      if (z !== zeichen) continue;
      treffer += stat.hits;
      daneben += stat.misses;
    }
  }

  return { zeichen, treffer, daneben, anschlaege };
}
