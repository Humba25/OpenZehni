/**
 * Leistungsmessung nach amtlicher Zählweise.
 *
 * **Vor jeder Änderung `NORMEN.md` 4 lesen.** Die Definitionen hier sind kein
 * Entwurf und keine Näherung, sondern übernommene Regelwerke. Wer eine
 * Rechnung hier für einen Fehler hält, hat mit hoher Wahrscheinlichkeit die
 * Norm nicht gelesen - die Fundstelle steht jeweils daneben.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import { strokeFor } from './charset';

/**
 * Ein Zeichen, das T1 nicht erzeugen kann, ist in einem Übungstext ein Fehler
 * im Programm, nicht in der Eingabe: Jeder Text wird vorher gegen den
 * Zeichenvorrat seiner Lektion geprüft (SPEC.md 9.4). Deshalb wird hier
 * geworfen statt geschätzt - eine geratene Anschlagzahl wäre schlimmer als
 * ein Absturz im Test.
 */
export class UntypableCharacterError extends Error {
  constructor(
    readonly char: string,
    readonly index: number,
  ) {
    super(
      `metrics.countStrokes: Zeichen '${char}' (U+${char
        .codePointAt(0)!
        .toString(16)
        .toUpperCase()
        .padStart(4, '0')}) an Position ${index} ist auf T1 nicht erzeugbar. ` +
        'Der Text haette den Zeichensatzcheck nicht bestehen duerfen (SPEC.md 9.4).',
    );
    this.name = 'UntypableCharacterError';
  }
}

/**
 * Anschläge nach `NORMEN.md` 4.1.
 *
 * > Ein Anschlag ist jeder Tastendruck. Für jeden Großbuchstaben und für die
 * > meisten Sonderzeichen zählen zwei Anschläge, weil Umschalt- bzw.
 * > AltGr-Taste mitgeschlagen werden.
 *
 * Ein Text mit 100 Zeichen, davon 8 Großbuchstaben, hat **108** Anschläge.
 *
 * Tote Tasten kosten einen Anschlag extra: `^` entsteht aus der toten Taste
 * und der Leertaste. `` ` `` kostet sogar drei, weil die tote Taste selbst
 * schon Umschalt braucht.
 *
 * **Dies ist die einzige Stelle im Code, an der Anschläge gezählt werden.**
 * Überall sonst wird diese Funktion aufgerufen (NORMEN.md 4.1, ARCHITEKTUR.md).
 */
export function countStrokes(text: string): number {
  let strokes = 0;

  // Über Codepunkte laufen, nicht über UTF-16-Einheiten: Ein Emoji wuerde
  // sonst als zwei Zeichen gezaehlt. In gueltigen Uebungstexten kommt so
  // etwas nicht vor, aber die Zaehlung darf davon nicht abhaengen.
  let index = 0;
  for (const char of text) {
    // Wagenruecklauf ist keine eigene Taste; \r\n ist eine Zeilenschaltung.
    if (char === '\r') {
      index += char.length;
      continue;
    }

    const stroke = strokeFor(char);
    if (!stroke) throw new UntypableCharacterError(char, index);

    // Die Taste selbst.
    strokes += 1;
    // Umschalt oder AltGr zaehlen mit (NORMEN.md 4.1).
    if (stroke.modifier !== 'none') strokes += 1;
    // Tote Taste braucht die Leertaste hinterher.
    if (stroke.needsSpaceAfterDead) strokes += 1;

    index += char.length;
  }

  return strokes;
}

/**
 * Fehler nach `NORMEN.md` 4.2, gezählt **am Ergebnistext**.
 *
 * - jedes falsche Zeichen = 1 Fehler
 * - jedes fehlende Zeichen = 1 Fehler
 * - jedes zusätzliche Zeichen = 1 Fehler
 * - jede falsche oder fehlende Zeilenschaltung, jede überzählige Leerzeile = 1 Fehler
 *
 * **Während des Schreibens korrigierte Fehler zählen nicht.** Wer den Fehler
 * bemerkt und verbessert, hat am Ende einen richtigen Text. Deshalb bekommt
 * diese Funktion nur den fertigen Text, nie den Tippweg - der Tippweg fließt
 * ausschließlich in die Sicherheit (`firstTryRate`).
 *
 * Umgesetzt als Levenshtein-Distanz. Sie liefert genau die Mindestzahl an
 * Ersetzungen, Auslassungen und Einfügungen, die den einen Text in den anderen
 * überführt - also die vier Fehlerarten oben. Zeilenschaltungen sind dabei
 * gewöhnliche Zeichen und damit automatisch mitgezählt.
 */
export function countErrors(expected: string, actual: string): number {
  // Zeilenenden vereinheitlichen: \r\n und \n sind dieselbe Zeilenschaltung.
  const a = [...expected.replace(/\r\n/g, '\n')];
  const b = [...actual.replace(/\r\n/g, '\n')];

  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Nur zwei Zeilen der Matrix behalten. Der Abschlusstest laeuft ueber
  // mehrere tausend Zeichen, und das Performance-Budget ist knapp (SPEC.md 12.1).
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  let current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j]! + 1, // Zeichen fehlt
        current[j - 1]! + 1, // Zeichen zu viel
        previous[j - 1]! + substitutionCost, // Zeichen falsch
      );
    }
    [previous, current] = [current, previous];
  }

  return previous[b.length]!;
}

/**
 * Fehlerquote in Prozent nach `NORMEN.md` 4.3.
 *
 *     Fehlerquote [%] = (Fehler × 100) / Gesamtanschläge
 *
 * Bezugsgröße sind die Anschläge der **Vorlage**, nicht die des getippten
 * Textes: Wer die Hälfte ausläßt, soll nicht durch eine kleinere Bezugsgröße
 * belohnt werden.
 */
export function errorRate(errors: number, totalStrokes: number): number {
  if (totalStrokes <= 0) return 0;
  return (errors * 100) / totalStrokes;
}

/**
 * Anschläge pro Minute nach `NORMEN.md` 4.5.
 *
 * `activeMs` ist die **aktive** Zeit. Pausen über drei Sekunden sind vorher
 * herauszurechnen (SPEC.md 7.1) - das macht die Tipp-Engine, nicht diese
 * Funktion. Ausnahme ist der Abschlusstest `L25`, dort läuft die Uhr
 * wettbewerbsgetreu durch (NORMEN.md 4.5).
 */
export function strokesPerMinute(strokes: number, activeMs: number): number {
  if (activeMs <= 0) return 0;
  return strokes / (activeMs / 60000);
}

/**
 * WPM = A/min ÷ 5.
 *
 * Wird nur klein neben der A/min-Angabe gezeigt, weil Kinder die Zahl aus
 * Online-Tipptests kennen. Bewertet wird sie nie (NORMEN.md 4.5).
 */
export function wordsPerMinute(strokesMin: number): number {
  return strokesMin / 5;
}

/**
 * „Sicherheit": Anteil der Zeichen, die **ohne Korrektur** richtig getroffen
 * wurden (NORMEN.md 4.4).
 *
 * Das ist die zweite Kennzahl von Zehni und **nicht** die amtliche
 * Fehlerquote. Sie ist strenger, weil jeder Vertipper eingeht, auch der sofort
 * verbesserte.
 *
 * Sie vergibt in `L01`-`L13` die Sterne, weil dort der blockierende Modus die
 * amtliche Fehlerquote strukturell auf 0,00 % zwingt (NORMEN.md 4.4.1). In
 * alles, was nach außen wie eine Note aussieht - Diplom, Urkunde, Notenschlüssel,
 * Elternansicht -, fließt sie **nie** ein.
 */
export function firstTryRate(firstTryHits: number, totalChars: number): number {
  if (totalChars <= 0) return 0;
  return (firstTryHits * 100) / totalChars;
}
