/**
 * Minispiel „Elfmeterschießen" (SPEC.md 8.10, 8.10.1).
 *
 * Idee des Nutzers vom 2026-09-18. Der Ablauf einer Runde:
 *
 *   1. **Ecke wählen** — neun Felder, in jedem steht ein kurzes Wort. Wer es
 *      tippt, schießt dorthin.
 *   2. **Schuss aufladen** — für ein paar Sekunden laufen Zeichen durch; jedes
 *      getroffene lädt den Schuss weiter auf.
 *   3. **Der Torwart springt.** Rät er richtig, hält er — es sei denn, der
 *      Schuss ist hart genug.
 *
 * **Warum die Ecke getippt und nicht geklickt wird.** Ein Mausklick ist der
 * einzige Schritt ohne Übung. Steht in jedem Feld ein Wort, ist auch die
 * Zielwahl Tipparbeit — und die Entscheidung bleibt trotzdem beim Kind.
 *
 * Die Schranken aus 8.10 gelten unverändert:
 *
 * - **Nur bereits gelernte Zeichen** (harte Regel aus 6.2). Sowohl die Wörter
 *   in den Feldern als auch die Zeichen beim Aufladen kommen aus dem Vorrat
 *   der Lektion.
 * - **Unbewertet.** Dieses Modul rechnet Treffer aus, sonst nichts. Es gibt
 *   hier keine Funktion, die ein Ergebnis nach `sessions`, `lesson_progress`
 *   oder `char_stats` tragen könnte.
 * - **Kein Verlieren-Zustand, der den Zugang begrenzt.** Ein gehaltener Schuss
 *   ist ein gehaltener Schuss; die nächste Runde beginnt sofort.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import { getLesson } from './curriculum';
import { createRandom } from './minispiele';
import { drillWoerter } from './drill';

/** Die neun Ecken des Tores, von oben links nach unten rechts. */
export const ECKEN = [
  'oben-links',
  'oben-mitte',
  'oben-rechts',
  'mitte-links',
  'mitte-mitte',
  'mitte-rechts',
  'unten-links',
  'unten-mitte',
  'unten-rechts',
] as const;

export type Ecke = (typeof ECKEN)[number];

/** Wie viele Schüsse eine Runde hat. Wie beim echten Elfmeterschießen. */
export const SCHUESSE_PRO_RUNDE = 5;

/**
 * Eine Schwierigkeitsstufe.
 *
 * Drei Stellschrauben, alle mit derselben Richtung: Je schwerer, desto weniger
 * Zeit zum Aufladen, desto öfter rät der Torwart richtig, und desto härter muss
 * der Schuss sein, um trotzdem hineinzugehen.
 */
export interface Stufe {
  readonly id: 'leicht' | 'mittel' | 'schwer';
  /** Wie lange das Aufladen dauert. */
  readonly ladezeitMs: number;
  /** Wie oft der Torwart die richtige Ecke errät, zwischen 0 und 1. */
  readonly trefferquote: number;
  /**
   * Ab welcher Kraft ein Schuss auch dann hineingeht, wenn der Torwart richtig
   * geraten hat. 1 hieße: nie.
   */
  readonly durchschuss: number;
}

export const STUFEN: readonly Stufe[] = [
  { id: 'leicht', ladezeitMs: 5000, trefferquote: 0.2, durchschuss: 0.6 },
  { id: 'mittel', ladezeitMs: 4000, trefferquote: 0.35, durchschuss: 0.75 },
  { id: 'schwer', ladezeitMs: 3000, trefferquote: 0.5, durchschuss: 0.9 },
];

/**
 * Die neun Wörter für die Felder.
 *
 * Stehen genug echte Wörter zur Verfügung, werden die kürzesten genommen — ein
 * langes Wort zum Zielen wäre eine Geduldsprobe, keine Zielwahl. Sonst entstehen
 * kurze Zeichenfolgen aus dem Vorrat der Lektion; in `L01` gibt es nur `f` und
 * `j`, und auch damit muss es gehen.
 *
 * **Alle neun sind verschieden.** Zwei gleiche Felder wären nicht auflösbar.
 */
export function zielwoerter(lessonId: string, saat: string): readonly string[] {
  const lesson = getLesson(lessonId);
  if (!lesson) return [];

  const rnd = createRandom(`elfmeter#${lessonId}#${saat}`);
  const echte = drillWoerter(lesson.chars)
    .filter((w) => w.length <= 6)
    .sort((a, b) => a.length - b.length);

  const gewaehlt: string[] = [];
  const gesehen = new Set<string>();

  for (const wort of mischen(echte.slice(0, 40), rnd)) {
    if (gewaehlt.length >= ECKEN.length) break;
    if (gesehen.has(wort)) continue;
    gesehen.add(wort);
    gewaehlt.push(wort);
  }

  // Auffüllen mit kurzen Zeichenfolgen, solange neun nicht voll sind.
  const vorrat = [...new Set([...lesson.chars])].filter((c) => c !== ' ' && c !== '\n');
  let notbremse = 0;
  while (gewaehlt.length < ECKEN.length && vorrat.length > 0 && notbremse++ < 500) {
    const laenge = 2 + Math.floor(rnd() * 2);
    let wort = '';
    for (let i = 0; i < laenge; i++) wort += vorrat[Math.floor(rnd() * vorrat.length)];
    if (gesehen.has(wort)) continue;
    gesehen.add(wort);
    gewaehlt.push(wort);
  }

  return gewaehlt;
}

/**
 * Die Zeichen, die beim Aufladen durchlaufen.
 *
 * Bewusst eine lange Folge: Sie soll nie ausgehen, auch wenn jemand sehr
 * schnell ist. Wer sie nicht schafft, hat einen schwächeren Schuss — das ist
 * die Rückmeldung, mehr passiert nicht.
 */
export function ladezeichen(lessonId: string, saat: string, anzahl = 60): readonly string[] {
  const lesson = getLesson(lessonId);
  if (!lesson) return [];

  const vorrat = [...new Set([...lesson.chars])].filter((c) => c !== ' ' && c !== '\n');
  if (vorrat.length === 0) return [];

  const rnd = createRandom(`laden#${lessonId}#${saat}`);
  return Array.from({ length: anzahl }, () => vorrat[Math.floor(rnd() * vorrat.length)]!);
}

/**
 * Wie hart der Schuss geworden ist, zwischen 0 und 1.
 *
 * Bezugsgröße ist eine Zahl von Anschlägen, die in der Ladezeit **erreichbar**
 * ist, nicht die Länge der Zeichenfolge: Sonst hinge die Kraft daran, wie lang
 * diese Folge zufällig ist.
 */
export function kraft(getippt: number, ladezeitMs: number, zielAnschlaegeProMin = 180): number {
  const erreichbar = (ladezeitMs / 60_000) * zielAnschlaegeProMin;
  if (erreichbar <= 0) return 0;
  return Math.max(0, Math.min(1, getippt / erreichbar));
}

/**
 * Wohin der Torwart springt.
 *
 * Mit der Trefferquote der Stufe rät er richtig, sonst greift er irgendwohin
 * anders. **Nicht einfach zufällig aus allen neun**: Dann läge die Trefferquote
 * bei gut elf Prozent und die Stufe hätte keine Wirkung.
 */
export function torwartEcke(gewaehlt: Ecke, stufe: Stufe, rnd: () => number): Ecke {
  if (rnd() < stufe.trefferquote) return gewaehlt;
  const andere = ECKEN.filter((e) => e !== gewaehlt);
  return andere[Math.floor(rnd() * andere.length)]!;
}

/**
 * Ist der Schuss drin?
 *
 * Springt der Torwart woanders hin, immer. Springt er richtig, nur wenn der
 * Schuss hart genug war — dafür lohnt sich das Aufladen.
 */
export function istTor(gewaehlt: Ecke, torwart: Ecke, schusskraft: number, stufe: Stufe): boolean {
  if (gewaehlt !== torwart) return true;
  return schusskraft >= stufe.durchschuss;
}

function mischen<T>(liste: readonly T[], rnd: () => number): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j]!, kopie[i]!];
  }
  return kopie;
}
