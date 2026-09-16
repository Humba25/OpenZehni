/**
 * Lernpfad: Lektionsdaten, Freischaltung und Sternvergabe.
 *
 * Die Lektionen selbst sind Daten (`content/lessons.json`, ARCHITEKTUR.md
 * Architekturregel 4). Diese Datei liest sie typisiert ein und enthält die
 * Bewertungsregeln.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import lessonsData from '../../content/lessons.json';

export type LessonMode = 'blockierend' | 'fliessend';
export type CharsetStage = 'S1' | 'S2' | 'S3' | 'S4' | 'S5';
export type AgeBand = 'A1' | 'A2' | 'A3';
export type TextSource = 'drill' | 'topic';

export interface Lesson {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly newChars: readonly string[];
  /** Vollständiger, kumulativer Zeichenvorrat dieser Lektion. */
  readonly chars: string;
  readonly stage: CharsetStage;
  readonly mode: LessonMode;
  readonly textSource: TextSource;
  readonly review: boolean;
  readonly focus: string;
}

const LESSONS: readonly Lesson[] = lessonsData.lessons as readonly Lesson[];

export function allLessons(): readonly Lesson[] {
  return LESSONS;
}

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** Die Lektion nach dieser. `undefined` beim Abschlusstest. */
export function nextLesson(id: string): Lesson | undefined {
  const current = getLesson(id);
  if (!current) return undefined;
  return LESSONS.find((l) => l.order === current.order + 1);
}

/**
 * Die Zeichen, die diese Lektion tatsächlich neu bringt — berechnet als
 * Differenz zur Vorlektion, nicht aus dem Feld `newChars` gelesen.
 *
 * Grund: In `L20` steht dort „Umschalt links/rechts", also kein Zeichen. Neu
 * verfügbar sind aber sämtliche Großbuchstaben. Wer für die Gewichtung im
 * Drill das Feld nähme, bekäme für `L20` eine leere Liste und würde ausgerechnet
 * die Umschalttaste nicht üben.
 */
export function newCharsOf(lessonId: string): readonly string[] {
  const lesson = getLesson(lessonId);
  if (!lesson) return [];
  const previous = LESSONS.find((l) => l.order === lesson.order - 1);
  if (!previous) return [...lesson.chars];
  const before = new Set([...previous.chars]);
  return [...lesson.chars].filter((c) => !before.has(c));
}

/**
 * Bewertungsschwellen einer Lektion.
 *
 * **Hier und nirgends sonst stehen diese Zahlen** (NORMEN.md 4.8). Wer sie
 * nachjustiert, ändert genau diese Tabelle.
 *
 * Die Trennung in zwei Kennzahlen ist keine Bequemlichkeit, sondern notwendig:
 * Im blockierenden Modus kommt eine falsche Taste gar nicht in den Text, der
 * Ergebnistext ist also immer fehlerfrei und die amtliche Fehlerquote
 * strukturell 0,00 %. Sie kann dort nichts unterscheiden (NORMEN.md 4.4.1,
 * DIDAKTIK.md 4.3).
 */
export type ThresholdKind = 'safety' | 'errorRate';

export interface LessonThresholds {
  /** Wonach bewertet wird: Sicherheit (blockierend) oder Fehlerquote (fließend). */
  readonly kind: ThresholdKind;
  /** Schwelle für einen Stern. Bei `safety` ein Mindestwert, bei `errorRate` ein Höchstwert. */
  readonly oneStar: number;
  readonly twoStars: number;
  readonly threeStars: number;
  /** Zusätzlich für den dritten Stern nötig, in Anschlägen pro Minute. */
  readonly targetStrokesMin: number;
}

/**
 * Erfahrungswerte ohne Datengrundlage für die Sicherheitsschwellen
 * (`L01`-`L13`). Bewusst milder als eine Eins-zu-eins-Übertragung der alten
 * Fehlerquoten, weil Sicherheit die strengere Kennzahl ist: In sie geht jeder
 * Vertipper ein, auch der sofort verbesserte (DIDAKTIK.md 5.2).
 *
 * Nachjustieren, sobald echte Sitzungen vorliegen (SPEC.md 15.11).
 */
export function thresholdsFor(lessonId: string): LessonThresholds | undefined {
  const lesson = getLesson(lessonId);
  if (!lesson) return undefined;
  const n = lesson.order;

  // Blockierender Teil: Sterne nach Sicherheit (NORMEN.md 4.4.1, 4.8).
  if (n <= 5) {
    return {
      kind: 'safety',
      oneStar: 90.0,
      twoStars: 95.0,
      threeStars: 98.0,
      targetStrokesMin: 60,
    };
  }
  if (n <= 13) {
    return {
      kind: 'safety',
      oneStar: 93.0,
      twoStars: 96.0,
      threeStars: 98.5,
      targetStrokesMin: 80,
    };
  }

  // Fließender Teil: Sterne nach amtlicher Fehlerquote.
  // Zwei Sterne = die Hälfte der Zielquote, drei Sterne = ein Viertel davon.
  if (n <= 19) {
    return {
      kind: 'errorRate',
      oneStar: 1.5,
      twoStars: 0.75,
      threeStars: 0.375,
      targetStrokesMin: 100,
    };
  }
  if (n <= 23) {
    return {
      kind: 'errorRate',
      oneStar: 1.0,
      twoStars: 0.5,
      threeStars: 0.25,
      targetStrokesMin: 120,
    };
  }
  if (n === 24) {
    return {
      kind: 'errorRate',
      oneStar: 0.5,
      twoStars: 0.25,
      threeStars: 0.125,
      targetStrokesMin: 140,
    };
  }
  // L25 ist der Abschlusstest und wird nach NORMEN.md 4.7 bewertet,
  // nicht über Sterne. Siehe `evaluateFinalTest`.
  return {
    kind: 'errorRate',
    oneStar: 0.5,
    twoStars: 0.25,
    threeStars: 0.125,
    targetStrokesMin: 60,
  };
}

/** Ergebnis einer Übungsrunde, soweit für die Bewertung nötig. */
export interface LessonResult {
  /** Amtliche Fehlerquote in Prozent (NORMEN.md 4.3). */
  readonly errorRate: number;
  /** Sicherheit in Prozent (NORMEN.md 4.4). */
  readonly safety: number;
  readonly strokesMin: number;
}

/**
 * Sterne für eine Lektion, 0 bis 3.
 *
 * Null Sterne heißt nicht bestanden. Ein Stern schaltet die nächste Lektion
 * frei - Perfektion darf den Fortschritt nicht blockieren (SPEC.md 6.3).
 */
export function starsFor(lessonId: string, result: LessonResult): 0 | 1 | 2 | 3 {
  const t = thresholdsFor(lessonId);
  if (!t) return 0;

  const value = t.kind === 'safety' ? result.safety : result.errorRate;
  // Bei Sicherheit ist mehr besser, bei der Fehlerquote weniger.
  const reaches = (schwelle: number): boolean =>
    t.kind === 'safety' ? value >= schwelle : value <= schwelle;

  if (!reaches(t.oneStar)) return 0;
  if (!reaches(t.twoStars)) return 1;
  if (!reaches(t.threeStars)) return 2;
  // Der dritte Stern verlangt zusaetzlich das Tempo.
  return result.strokesMin >= t.targetStrokesMin ? 3 : 2;
}

/** Ein Stern genügt zum Freischalten (SPEC.md 6.3). */
export function isPassed(lessonId: string, result: LessonResult): boolean {
  return starsFor(lessonId, result) >= 1;
}

/**
 * Abschlusstest `L25` nach `NORMEN.md` 4.7: 10-Minuten-Abschrift nach dem
 * Muster des Bundesjugendschreibens.
 *
 * Bestanden: mindestens **600 Gesamtanschläge** bei höchstens **0,5 %**
 * Fehlerquote. Das ist die Mindestleistung des Bundesjugendschreibens.
 *
 * Die Uhr läuft dort durch - Pausen werden **nicht** herausgerechnet
 * (NORMEN.md 4.5). Das stellt die Tipp-Engine sicher, nicht diese Funktion.
 */
export const FINAL_TEST_MIN_STROKES = 600;
export const FINAL_TEST_MAX_ERROR_RATE = 0.5;

export function passesFinalTest(totalStrokes: number, errorRate: number): boolean {
  return totalStrokes >= FINAL_TEST_MIN_STROKES && errorRate <= FINAL_TEST_MAX_ERROR_RATE;
}

/**
 * Lesestufe für den Textrequest (SPEC.md 9.2, 9.8).
 *
 * Bis 2026-09-12 war `level` schlicht die Lektionsnummer. Jetzt fließt die
 * Altersstufe mit ein, damit die Texte zum Alter passen - **ohne** dass ein
 * zusätzliches Merkmal der Nutzerin das Gerät verlässt. Die unverhandelbare
 * Regel „ein KI-Request enthält nur Thema, Zeichensatz, Länge, Level" bleibt
 * damit wörtlich gültig (ARCHITEKTUR.md).
 *
 * Ergebnis liegt zwischen 1 und 25 und bleibt damit im vertraglich zugesagten
 * Bereich.
 */
export function readingLevel(lessonId: string, ageBand: AgeBand): number {
  const lesson = getLesson(lessonId);
  if (!lesson) return 1;

  // A1 liest einfacher, A3 anspruchsvoller als die Kernzielgruppe A2.
  const shift = ageBand === 'A1' ? -3 : ageBand === 'A3' ? +3 : 0;
  return Math.min(25, Math.max(1, lesson.order + shift));
}
