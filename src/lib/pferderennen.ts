/**
 * Minispiel „Pferderennen" (SPEC.md 8.10.1).
 *
 * Idee des Nutzers vom 2026-09-18. Der Ablauf:
 *
 *   - **Tippen treibt an.** Jedes richtig getroffene Zeichen bringt das Pferd
 *     ein Stück voran. Wer schneller tippt, läuft schneller — mehr Mechanik
 *     braucht es nicht.
 *   - **Die Leertaste springt.** Vor jeder Hürde öffnet sich ein Fenster; wer
 *     darin die Leertaste schlägt, setzt sauber darüber.
 *   - **Ein Gegner läuft mit**, in gleichmäßigem Tempo. Er ist das Ziel, an dem
 *     sich das eigene Tempo messen lässt.
 *
 * **Warum die Leertaste ein Gewinn ist.** Sie wird mit dem Daumen geschlagen
 * und kommt sonst nur nebenbei vor — in keiner Lektion steht sie im
 * Mittelpunkt. Hier schon.
 *
 * **Ein verpasster Sprung kostet Zeit, nicht Fortschritt.** Das Pferd stolpert
 * und läuft weiter. Erspieltes wieder wegzunehmen wäre eine Bestrafungsmechanik
 * (SPEC.md 8.11); ein kurzer Halt ist die Folge eines Fehlers, keine Strafe.
 *
 * Die Schranken aus 8.10 gelten unverändert:
 *
 * - **Nur bereits gelernte Zeichen** (harte Regel aus 6.2).
 * - **Unbewertet.** Dieses Modul rechnet ein Rennen aus, sonst nichts — kein
 *   Eintrag in `sessions`, `lesson_progress` oder `char_stats`.
 * - **Kein Zustand, der den Zugang begrenzt.** Ein verlorenes Rennen ist ein
 *   verlorenes Rennen; das nächste beginnt sofort.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import { getLesson } from './curriculum';
import { createRandom } from './minispiele';

/**
 * Wie viele Zeichen bis ins Ziel.
 *
 * Bei 180 Anschlägen je Minute sind das gut vierzig Sekunden — lang genug für
 * ein Rennen, kurz genug, um es noch einmal zu machen.
 */
export const STRECKE = 120;

/** Wie lange ein Stolperer aufhält. */
export const STOLPER_MS = 900;

/** Eine Schwierigkeitsstufe. */
export interface Rennstufe {
  readonly id: 'gemuetlich' | 'flott' | 'rasant';
  /** Tempo des Gegners in Zeichen je Minute. */
  readonly gegnerProMin: number;
  /** Wie viele Hürden auf der Strecke liegen. */
  readonly huerden: number;
  /**
   * Wie viele Zeichen vor einer Hürde das Sprungfenster aufgeht. Je enger,
   * desto genauer muss der Daumen sitzen.
   */
  readonly sprungfenster: number;
}

export const RENNSTUFEN: readonly Rennstufe[] = [
  { id: 'gemuetlich', gegnerProMin: 90, huerden: 3, sprungfenster: 8 },
  { id: 'flott', gegnerProMin: 140, huerden: 5, sprungfenster: 6 },
  { id: 'rasant', gegnerProMin: 190, huerden: 7, sprungfenster: 4 },
];

/**
 * Die Zeichenfolge, die das Pferd antreibt.
 *
 * Reichlich bemessen: Sie soll auch sehr schnellen Fingern nicht ausgehen,
 * bevor das Ziel erreicht ist.
 */
export function rennzeichen(lessonId: string, saat: string): readonly string[] {
  const lesson = getLesson(lessonId);
  if (!lesson) return [];

  const vorrat = [...new Set([...lesson.chars])].filter((c) => c !== ' ' && c !== '\n');
  if (vorrat.length === 0) return [];

  const rnd = createRandom(`rennen#${lessonId}#${saat}`);
  return Array.from({ length: STRECKE + 40 }, () => vorrat[Math.floor(rnd() * vorrat.length)]!);
}

/**
 * Wo die Hürden stehen, als Position in Zeichen.
 *
 * **Nicht am Anfang und nicht auf der Ziellinie.** Eine Hürde im ersten Moment
 * wäre nicht zu schaffen, eine im letzten nur ärgerlich. Zwischen zwei Hürden
 * bleibt genug Platz, damit sich ihre Sprungfenster nie überschneiden.
 */
export function huerdenPositionen(stufe: Rennstufe, saat: string): readonly number[] {
  if (stufe.huerden <= 0) return [];

  const ersteMoeglich = Math.max(stufe.sprungfenster + 4, 12);
  const letzteMoeglich = STRECKE - 8;
  const spanne = letzteMoeglich - ersteMoeglich;
  if (spanne <= 0) return [];

  const rnd = createRandom(`huerden#${stufe.id}#${saat}`);
  const abstand = spanne / stufe.huerden;

  return Array.from({ length: stufe.huerden }, (_, i) => {
    // Gleichmaessig verteilt, mit etwas Streuung -- sonst laeuft es sich
    // mechanisch ab und der Daumen zaehlt nur noch mit.
    const mitte = ersteMoeglich + abstand * (i + 0.5);
    const streuung = (rnd() - 0.5) * abstand * 0.5;
    return Math.round(Math.min(letzteMoeglich, Math.max(ersteMoeglich, mitte + streuung)));
  });
}

/**
 * Die Hürde, für die gerade gesprungen werden darf — oder `undefined`.
 *
 * Das Fenster reicht von `sprungfenster` Zeichen vor der Hürde bis zur Hürde
 * selbst. Wer früher springt, springt ins Leere; wer später kommt, ist schon
 * dagegengelaufen.
 */
export function offeneHuerde(
  position: number,
  huerden: readonly number[],
  stufe: Rennstufe,
  geschafft: ReadonlySet<number>,
): number | undefined {
  return huerden.find(
    (h) => !geschafft.has(h) && position >= h - stufe.sprungfenster && position <= h,
  );
}

/**
 * Ist das Pferd gerade in eine Hürde gelaufen?
 *
 * Genau an der Stelle der Hürde, und nur wenn dort nicht gesprungen wurde.
 */
export function huerdeGerissen(
  position: number,
  huerden: readonly number[],
  geschafft: ReadonlySet<number>,
): number | undefined {
  return huerden.find((h) => !geschafft.has(h) && position === h);
}

/**
 * Wie weit der Gegner nach dieser Zeit ist, zwischen 0 und 1.
 *
 * Gleichmäßiges Tempo, ohne Zufall: Ein Gegner, der mal schneller und mal
 * langsamer läuft, macht das eigene Ergebnis unlesbar.
 */
export function gegnerAnteil(vergangenMs: number, stufe: Rennstufe): number {
  const zeichen = (vergangenMs / 60_000) * stufe.gegnerProMin;
  return Math.max(0, Math.min(1, zeichen / STRECKE));
}

/** Wie das Rennen ausgegangen ist. */
export type Ausgang = 'gewonnen' | 'verloren';

export function ausgang(eigenePosition: number, gegnerAnteilJetzt: number): Ausgang {
  return eigenePosition >= STRECKE && gegnerAnteilJetzt < 1 ? 'gewonnen' : 'verloren';
}
