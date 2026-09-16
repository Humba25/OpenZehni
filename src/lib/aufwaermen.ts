/**
 * Das Aufwärmen (SPEC.md 6.5, Schritt 1).
 *
 * Zwanzig Sekunden Drill **ohne Bewertung**, bevor der Hauptteil beginnt.
 * Geübt werden die Problemzeichen aus der adaptiven Wiederholung (6.4); liegen
 * noch keine vor, nimmt das Aufwärmen die Zeichen, die diese Lektion neu
 * einführt.
 *
 * **Ohne Bewertung heißt ohne Bewertung:** Dieses Modul liefert einen Text,
 * sonst nichts. Es gibt hier keine Sterne, keine Fehlerquote und keinen Eintrag
 * in `lesson_progress` — und keine Funktion, die so etwas erzeugen könnte.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import { generateDrill } from './drill';
import { getLesson, newCharsOf } from './curriculum';

/** Die Vorgabe aus SPEC.md 6.5: zwanzig Sekunden. */
export const AUFWAERM_SEKUNDEN = 20;

/**
 * Wie lang der Aufwärmtext wird.
 *
 * Zwanzig Sekunden bei rund 100 Anschlägen je Minute sind etwa 33 Anschläge.
 * Etwas mehr ist besser als etwas weniger: Das Aufwärmen endet, wenn die Zeit
 * um ist, nicht wenn der Text alle ist — ein zu kurzer Text würde die Übung
 * vorzeitig beenden und den Rhythmus abschneiden.
 */
const MIN_LAENGE = 45;
const MAX_LAENGE = 70;

/**
 * Der Aufwärmtext für eine Lektion.
 *
 * `emphasize` sind die Problemzeichen aus `char_stats` (höchstens drei,
 * SPEC.md 6.4). Zeichen, die diese Lektion noch gar nicht kennt, fallen
 * stillschweigend weg — die harte Regel „kein ungelerntes Zeichen" gilt auch
 * im Aufwärmen.
 */
export function aufwaermtext(
  lessonId: string,
  problemzeichen: readonly string[] = [],
  saat = '',
): string {
  const lesson = getLesson(lessonId);
  if (!lesson) throw new Error(`aufwaermen.aufwaermtext: Lektion '${lessonId}' gibt es nicht.`);

  const gelernt = new Set([...lesson.chars]);
  const schwerpunkt = problemzeichen.filter((z) => gelernt.has(z)).slice(0, 3);

  // Ohne bekannte Schwaechen sind die neuen Zeichen der Lektion der beste
  // Schwerpunkt: Genau sie sind gleich im Hauptteil dran.
  const betont = schwerpunkt.length > 0 ? schwerpunkt : newCharsOf(lessonId);

  return generateDrill({
    chars: lesson.chars,
    newChars: betont,
    emphasize: betont,
    minLength: MIN_LAENGE,
    maxLength: MAX_LAENGE,
    seed: `aufwaermen#${lessonId}#${betont.join('')}#${saat}`,
  });
}
