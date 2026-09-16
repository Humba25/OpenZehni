/**
 * Die Tipp-Engine: der Kern der App und der am besten getestete Teil
 * (SPEC.md 7).
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1). Die Zeit kommt von außen herein, damit sich
 * alles ohne Warten testen lässt.
 *
 * **Die wichtigste Regel dieser Datei** (NORMEN.md 4.2, 4.4): Es gibt zwei
 * streng getrennte Zahlen.
 *
 *   - Der **Ergebnistext** (`resultText`) ist das, was am Ende dasteht. Nur er
 *     geht in die amtliche Fehlerquote ein. Korrigierte Fehler sind darin nicht
 *     mehr zu sehen und zählen deshalb nicht.
 *   - Der **Tippweg** (`firstTryHits`, `charStats`) ist das, was unterwegs
 *     passiert ist. Er ergibt die Kennzahl „Sicherheit" und das Fehlerprofil je
 *     Taste. Er fließt nie in etwas ein, das wie eine Note aussieht.
 *
 * Wer diese beiden zusammenführt, hebt NORMEN.md 4.4 auf.
 */

import type { LessonMode } from './curriculum';

/** Zustand eines einzelnen Zeichens der Vorlage (SPEC.md 7.1). */
export type CharState = 'pending' | 'correct' | 'wrong' | 'corrected';

/** Ein Tastendruck, wie ihn die Oberfläche aus `keydown` weiterreicht. */
export interface KeyInput {
  /** `KeyboardEvent.key` — das erzeugte Zeichen (für den Textvergleich). */
  readonly key: string;
  /** `KeyboardEvent.code` — die physische Taste (für die Grafik, SPEC.md 7.4). */
  readonly code?: string;
  /** Zeitstempel in Millisekunden. */
  readonly at: number;
}

export interface SessionOptions {
  readonly text: string;
  readonly mode: LessonMode;
  /**
   * Läuft die Uhr durch? Im Abschlusstest `L25` ja, sonst werden Pausen über
   * drei Sekunden herausgerechnet (SPEC.md 7.1, NORMEN.md 4.5).
   */
  readonly clockRunsThrough?: boolean;
}

/** Pausen ab dieser Länge gelten nicht als Tippzeit (SPEC.md 7.1). */
export const DEAD_TIME_THRESHOLD_MS = 3000;

export interface CharStat {
  hits: number;
  misses: number;
  totalLatencyMs: number;
  samples: number;
}

/**
 * Eine Verwechslung: erwartet wurde `expected`, getippt wurde `typed`.
 *
 * Bewusst eine Struktur und **kein** zusammengesetzter Zeichenschlüssel: Jedes
 * denkbare Trennzeichen kann selbst als erwartetes oder getipptes Zeichen
 * auftreten. Entspricht eins zu eins der Tabelle `confusions` (SPEC.md 5).
 */
export interface Confusion {
  readonly expected: string;
  readonly typed: string;
  readonly count: number;
}

export interface SessionSnapshot {
  readonly text: string;
  readonly cursor: number;
  readonly states: readonly CharState[];
  /** Was tatsächlich dasteht. Grundlage der amtlichen Fehlerzählung. */
  readonly resultText: string;
  readonly finished: boolean;
  readonly paused: boolean;
  /** Aktive Zeit in Millisekunden, tote Zeit bereits abgezogen. */
  readonly activeMs: number;
  /** Zeichen, die beim **ersten** Anschlag saßen. Grundlage der „Sicherheit". */
  readonly firstTryHits: number;
  readonly charStats: ReadonlyMap<string, CharStat>;
  /** Verwechslungen erwartet → getippt (SPEC.md 5, Tabelle `confusions`). */
  readonly confusions: readonly Confusion[];
}

/** Was ein Tastendruck bewirkt hat — die Oberfläche braucht das für die Rückmeldung. */
export type KeyOutcome =
  | { kind: 'correct' }
  | { kind: 'wrong'; expected: string; typed: string }
  | { kind: 'corrected' }
  | { kind: 'ignored'; reason: 'paused' | 'finished' | 'noNewline' | 'notPrintable' }
  | { kind: 'finished' };

export interface TypingSession {
  handleKey(input: KeyInput): KeyOutcome;
  pause(at: number): void;
  resume(at: number): void;
  snapshot(): SessionSnapshot;
}

export function createSession(options: SessionOptions): TypingSession {
  const { text, mode } = options;
  const clockRunsThrough = options.clockRunsThrough ?? false;
  const chars = [...text];
  const hasNewline = chars.includes('\n');

  const states: CharState[] = chars.map(() => 'pending');
  /** Wurde an dieser Stelle schon einmal danebengegriffen? */
  const missedHere: boolean[] = chars.map(() => false);
  const typed: string[] = [];

  const charStats = new Map<string, CharStat>();
  /** erwartetes Zeichen → getipptes Zeichen → Anzahl. */
  const confusions = new Map<string, Map<string, number>>();

  const recordConfusion = (expected: string, typed: string): void => {
    let byTyped = confusions.get(expected);
    if (!byTyped) {
      byTyped = new Map<string, number>();
      confusions.set(expected, byTyped);
    }
    byTyped.set(typed, (byTyped.get(typed) ?? 0) + 1);
  };

  let cursor = 0;
  let paused = false;
  let finished = false;
  let activeMs = 0;
  let lastKeyAt: number | null = null;
  /** Während einer Pause vergangene Zeit zählt gar nicht erst. */
  let pausedAt: number | null = null;

  const statFor = (char: string): CharStat => {
    let s = charStats.get(char);
    if (!s) {
      s = { hits: 0, misses: 0, totalLatencyMs: 0, samples: 0 };
      charStats.set(char, s);
    }
    return s;
  };

  /**
   * Rechnet die Zeit seit dem letzten Anschlag an.
   *
   * Pausen über {@link DEAD_TIME_THRESHOLD_MS} werden **vollständig**
   * herausgerechnet, nicht nur der überschießende Teil: Eine Unterbrechung von
   * halbe Minute ist keine langsame Tippzeit, sie ist gar keine Tippzeit
   * (SPEC.md 7.1). Im Abschlusstest läuft die Uhr wettbewerbsgetreu durch
   * (NORMEN.md 4.5).
   *
   * Liefert die Latenz dieses Anschlags zurück, oder `null` beim ersten.
   */
  const accountTime = (at: number): number | null => {
    if (lastKeyAt === null) {
      lastKeyAt = at;
      return null;
    }
    const gap = Math.max(0, at - lastKeyAt);
    lastKeyAt = at;
    if (!clockRunsThrough && gap > DEAD_TIME_THRESHOLD_MS) {
      return null; // tote Zeit: weder Dauer noch Latenz
    }
    activeMs += gap;
    return gap;
  };

  const finishIfDone = (): boolean => {
    if (cursor >= chars.length) {
      finished = true;
      return true;
    }
    return false;
  };

  const handleBackspace = (at: number): KeyOutcome => {
    // Im blockierenden Modus steht nie ein falsches Zeichen im Text; die
    // Ruecktaste nimmt dort das letzte richtige zurueck.
    if (cursor === 0) return { kind: 'ignored', reason: 'notPrintable' };
    accountTime(at);
    cursor -= 1;
    typed.pop();
    // Die Stelle ist wieder offen, aber der Fehlgriff bleibt vermerkt:
    // Ein einmal korrigiertes Zeichen war nie ein Treffer beim ersten Anschlag.
    states[cursor] = missedHere[cursor] ? 'corrected' : 'pending';
    return { kind: 'corrected' };
  };

  const handleKey = (input: KeyInput): KeyOutcome => {
    if (finished) return { kind: 'ignored', reason: 'finished' };
    if (paused) return { kind: 'ignored', reason: 'paused' };

    const { key, at } = input;

    if (key === 'Backspace') return handleBackspace(at);
    if (key === 'Escape') {
      pause(at);
      return { kind: 'ignored', reason: 'paused' };
    }

    // Zeilenschaltung nur, wenn die Vorlage ueberhaupt Zeilen hat (SPEC.md 7.1).
    if (key === 'Enter' && !hasNewline) {
      return { kind: 'ignored', reason: 'noNewline' };
    }

    const produced = key === 'Enter' ? '\n' : key;
    // Steuertasten (Shift, Alt, Pfeile) erzeugen kein Zeichen und werden
    // stillschweigend verworfen. Sie sind zwar Anschlaege im Sinne von
    // NORMEN.md 4.1, aber dort werden sie ueber countStrokes() am Text
    // gezaehlt - nicht hier am Tippweg.
    if ([...produced].length !== 1) {
      return { kind: 'ignored', reason: 'notPrintable' };
    }

    const expected = chars[cursor]!;
    const latency = accountTime(at);
    const stat = statFor(expected);

    if (produced === expected) {
      if (!missedHere[cursor]) {
        stat.hits += 1;
        if (latency !== null) {
          stat.totalLatencyMs += latency;
          stat.samples += 1;
        }
      }
      states[cursor] = missedHere[cursor] ? 'corrected' : 'correct';
      typed.push(produced);
      cursor += 1;
      if (finishIfDone()) return { kind: 'finished' };
      return { kind: 'correct' };
    }

    // Fehlgriff.
    stat.misses += 1;
    missedHere[cursor] = true;
    recordConfusion(expected, produced);

    if (mode === 'blockierend') {
      // Der Cursor rueckt nicht weiter. Die Hand fuehrt die falsche Bewegung
      // nicht zu Ende aus, und der Ergebnistext bleibt sauber (SPEC.md 7.1).
      states[cursor] = 'wrong';
      return { kind: 'wrong', expected, typed: produced };
    }

    // Fliessender Modus: das falsche Zeichen landet im Text, der Cursor laeuft
    // weiter. Korrigieren ist Sache der Nutzerin.
    states[cursor] = 'wrong';
    typed.push(produced);
    cursor += 1;
    if (finishIfDone()) return { kind: 'finished' };
    return { kind: 'wrong', expected, typed: produced };
  };

  const pause = (at: number): void => {
    if (paused || finished) return;
    paused = true;
    pausedAt = at;
  };

  const resume = (at: number): void => {
    if (!paused) return;
    paused = false;
    // Die Pause zaehlt nicht. Der naechste Anschlag misst ab jetzt.
    if (pausedAt !== null && lastKeyAt !== null) lastKeyAt = at;
    pausedAt = null;
  };

  const snapshot = (): SessionSnapshot => ({
    text,
    cursor,
    states: [...states],
    resultText: typed.join(''),
    finished,
    paused,
    activeMs,
    // Ein Zeichen zaehlt als Treffer beim ersten Anschlag, wenn dort nie
    // danebengegriffen wurde - unabhaengig davon, ob spaeter korrigiert wurde.
    firstTryHits: missedHere.slice(0, cursor).filter((m) => !m).length,
    charStats: new Map([...charStats].map(([k, v]) => [k, { ...v }])),
    confusions: [...confusions].flatMap(([expected, byTyped]) =>
      [...byTyped].map(([typed, count]) => ({ expected, typed, count })),
    ),
  });

  return { handleKey, pause, resume, snapshot };
}

/**
 * Die drei schwächsten Zeichen für die adaptive Wiederholung (SPEC.md 6.4).
 *
 * Gewichtet nach Fehlerquote **mal** durchschnittlicher Latenz, weil ein
 * Zeichen auf zwei Arten schlecht sitzen kann: Man trifft es falsch, oder man
 * trifft es richtig, aber erst nach Nachdenken. Das zweite ist der Vorbote des
 * ersten (DIDAKTIK.md 6).
 *
 * **Ein Zeichen wird erst ab zwölf Anschlägen benannt.** Darunter sagt die App
 * nichts darüber. Eine Schwäche, die auf zwei Versuchen beruht, ist erfunden —
 * dieselbe Regel, die MODUL-LERNEN.md 1.1 für jede Aussage über die Nutzerin
 * aufstellt (SPEC.md 8.9).
 */
export const MIN_SAMPLES_FOR_WEAKNESS = 12;

export function weakestChars(stats: ReadonlyMap<string, CharStat>, limit = 3): readonly string[] {
  const scored: { char: string; score: number }[] = [];

  for (const [char, s] of stats) {
    const attempts = s.hits + s.misses;
    if (attempts < MIN_SAMPLES_FOR_WEAKNESS) continue;
    const missRate = s.misses / attempts;
    const avgLatency = s.samples > 0 ? s.totalLatencyMs / s.samples : 0;
    // Latenz in Sekunden, damit beide Faktoren in vergleichbarer
    // Groessenordnung liegen. Ein Zeichen ohne Fehlgriffe bekommt eine kleine
    // Grundgewichtung, damit auch reine Zoegerer auffallen koennen.
    const score = (missRate + 0.05) * (avgLatency / 1000);
    if (score <= 0) continue;
    scored.push({ char, score });
  }

  scored.sort((a, b) => b.score - a.score || a.char.localeCompare(b.char));
  return scored.slice(0, limit).map((s) => s.char);
}
