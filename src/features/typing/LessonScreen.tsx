/**
 * Der Übungsbildschirm: Vorlage, Tastatur, laufende Rückmeldung.
 *
 * **Enthält keine Lernlogik** (ARCHITEKTUR.md, Architekturregel 1). Gerechnet wird
 * in `lib/typing-engine.ts` und `lib/metrics.ts`; diese Komponente reicht
 * Tastendrücke hinein und zeichnet, was zurückkommt.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSession, type CharState, type SessionSnapshot } from '../../lib/typing-engine';
import {
  countStrokes,
  countErrors,
  errorRate,
  strokesPerMinute,
  firstTryRate,
} from '../../lib/metrics';
import { starsFor, isPassed, type Lesson } from '../../lib/curriculum';
import { erzeugeGeist } from '../../lib/geist';
import { Keyboard } from './Keyboard';
import { Hands } from './Hands';
import { de } from '../../i18n/de';

/** Takt der Geisteruhr in Millisekunden (SPEC.md 8.7). */
const GEIST_TAKT_MS = 100;

export interface LessonRunResult {
  readonly strokesTotal: number;
  readonly errors: number;
  readonly errorRate: number;
  readonly strokesMin: number;
  readonly firstTryPct: number;
  readonly durationMs: number;
  readonly stars: number;
  readonly passed: boolean;
  /** Im Blindmodus getippt (SPEC.md 8.1). */
  readonly blind: boolean;
  /** Tempo des Geisterschreibers, falls einer mitlief (SPEC.md 8.7). */
  readonly geistStrokesMin: number | null;
  readonly snapshot: SessionSnapshot;
}

export interface LessonScreenProps {
  readonly lesson: Lesson;
  readonly text: string;
  /** Tastatur und Hände ausblenden (SPEC.md 8.1, Blindmodus). */
  readonly blind: boolean;
  readonly onBlindUmschalten: (an: boolean) => void;
  /**
   * Tempo des Geisterschreibers in Anschlägen pro Minute, oder `null`, wenn
   * keiner mitläuft. Ob einer mitläuft, entscheidet `lib/geist.ts` —
   * diese Komponente fragt nicht nach, sie zeichnet nur.
   */
  readonly geistStrokesMin: number | null;
  readonly onFinished: (result: LessonRunResult) => void;
  readonly onAbort: () => void;
}

export function LessonScreen({
  lesson,
  text,
  blind,
  onBlindUmschalten,
  geistStrokesMin,
  onFinished,
  onAbort,
}: LessonScreenProps) {
  const session = useMemo(
    () =>
      createSession({
        text,
        mode: lesson.mode,
        // Nur der Abschlusstest laeuft wettbewerbsgetreu ohne
        // Pausenherausrechnung (NORMEN.md 4.5).
        clockRunsThrough: lesson.id === 'L25',
      }),
    [text, lesson.mode, lesson.id],
  );

  const [snap, setSnap] = useState<SessionSnapshot>(() => session.snapshot());
  const [letzterFehler, setLetzterFehler] = useState(false);
  const fertigGemeldet = useRef(false);

  /**
   * Wurde die **ganze** Runde blind getippt?
   *
   * Nur dann gibt es den Bonus von 20 % (SPEC.md 8.1). Wer mitten in der Runde
   * die Tastatur einblendet, verliert ihn; wer sie mitten in der Runde
   * ausblendet, bekommt ihn nicht — der Bonus gilt der Leistung, nicht dem
   * Schalterstand am Ende.
   */
  const durchgehendBlind = useRef(blind);
  useEffect(() => {
    if (!blind) durchgehendBlind.current = false;
  }, [blind]);

  const zeichen = useMemo(() => [...text], [text]);
  const naechstesZeichen = zeichen[snap.cursor];

  const beenden = useCallback(
    (s: SessionSnapshot) => {
      if (fertigGemeldet.current) return;
      fertigGemeldet.current = true;

      // Bezugsgroesse ist die Vorlage, nicht das Getippte: Wer die Haelfte
      // auslaesst, soll nicht durch eine kleinere Bezugsgroesse belohnt werden
      // (NORMEN.md 4.3).
      const strokesTotal = countStrokes(text);
      const errors = countErrors(text, s.resultText);
      const quote = errorRate(errors, strokesTotal);
      const tempo = strokesPerMinute(strokesTotal, s.activeMs);
      const sicherheit = firstTryRate(s.firstTryHits, zeichen.length);

      const bewertung = { errorRate: quote, safety: sicherheit, strokesMin: tempo };

      onFinished({
        strokesTotal,
        errors,
        errorRate: quote,
        strokesMin: tempo,
        firstTryPct: sicherheit,
        durationMs: s.activeMs,
        stars: starsFor(lesson.id, bewertung),
        passed: isPassed(lesson.id, bewertung),
        blind: durchgehendBlind.current,
        geistStrokesMin,
        snapshot: s,
      });
    },
    [text, zeichen.length, lesson.id, geistStrokesMin, onFinished],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      // Tastenkuerzel des Systems nicht abfangen.
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      if (event.key === 'Escape' && snap.paused) {
        onAbort();
        return;
      }

      // Leertaste und Rücktaste würden sonst die Seite scrollen bzw.
      // zurücknavigieren.
      if ([' ', 'Backspace', 'Tab', 'Enter'].includes(event.key)) event.preventDefault();

      if (snap.paused) {
        session.resume(event.timeStamp);
        setSnap(session.snapshot());
        return;
      }

      const ergebnis = session.handleKey({
        key: event.key,
        code: event.code,
        at: event.timeStamp,
      });

      setLetzterFehler(ergebnis.kind === 'wrong');
      const neu = session.snapshot();
      setSnap(neu);
      if (neu.finished) beenden(neu);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session, snap.paused, beenden, onAbort]);

  // ------------------------------------------- Geisterschreiber (SPEC.md 8.7)

  const geist = useMemo(
    () => (geistStrokesMin !== null ? erzeugeGeist(text, geistStrokesMin) : null),
    [text, geistStrokesMin],
  );

  /**
   * Die Uhr des Geistes.
   *
   * Sie läuft ab dem ersten Anschlag, steht in der Pause still und hört am Ende
   * auf. Bewusst grob getaktet: Der Geist ist Motivation, keine Messung, und
   * zehn Bildaufbauten je Sekunde reichen dafür auf einem alten Laptop
   * (Performance-Budget 12.1).
   */
  const [geistMs, setGeistMs] = useState(0);
  useEffect(() => {
    if (!geist || snap.cursor === 0 || snap.finished || snap.paused) return;
    const id = window.setInterval(() => setGeistMs((ms) => ms + GEIST_TAKT_MS), GEIST_TAKT_MS);
    return () => window.clearInterval(id);
  }, [geist, snap.cursor, snap.finished, snap.paused]);

  const geistIndex = geist && !snap.finished ? geist.indexBei(geistMs) : -1;

  const fortschritt = zeichen.length > 0 ? (snap.cursor / zeichen.length) * 100 : 0;

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-gedaempft">
            {de.lernpfad.lektion} {lesson.order}
          </p>
          <h1 className="text-xl font-semibold">{lesson.title}</h1>
        </div>
        <button
          type="button"
          onClick={onAbort}
          className="rounded-lg border border-rand px-3 py-1.5 text-sm text-gedaempft hover:text-text"
        >
          {de.uebung.abbrechen}
        </button>
      </header>

      <div className="h-2 w-full overflow-hidden rounded-full bg-rand/50">
        <div
          className="h-full rounded-full bg-akzent transition-[width] duration-150"
          style={{ width: `${fortschritt}%` }}
          role="progressbar"
          aria-valuenow={Math.round(fortschritt)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={de.uebung.fortschritt}
        />
      </div>

      <section className="flex-1 rounded-2xl border border-rand bg-flaeche p-6">
        <p className="font-tippen text-[26px] leading-[1.9] tracking-wide">
          {zeichen.map((char, i) => (
            <Zeichen
              key={i}
              char={char}
              state={snap.states[i] ?? 'pending'}
              aktuell={i === snap.cursor}
              geist={i === geistIndex}
            />
          ))}
        </p>

        {snap.paused ? (
          <p className="mt-6 text-center text-gedaempft">{de.uebung.pausiertErklaerung}</p>
        ) : snap.cursor === 0 ? (
          <p className="mt-6 text-center text-gedaempft">{de.uebung.tippeLos}</p>
        ) : null}
      </section>

      {blind ? (
        // Blindmodus: Tastatur und Haende weg. Der Weg zurueck steht daneben --
        // niemand soll in einer Einstellung festsitzen (ARCHITEKTUR.md, keine
        // Sackgasse).
        <section className="flex items-center justify-between rounded-2xl border border-dashed border-rand bg-flaeche p-4 text-sm text-gedaempft">
          <span>{de.blindmodus.hinweis}</span>
          <button
            type="button"
            onClick={() => onBlindUmschalten(false)}
            className="rounded-lg border border-rand px-3 py-1.5 hover:text-text"
          >
            {de.blindmodus.einblenden}
          </button>
        </section>
      ) : (
        <section className="flex items-start gap-4 rounded-2xl border border-rand bg-flaeche p-4">
          <div className="min-w-0 flex-1">
            <Keyboard
              nextChar={naechstesZeichen}
              showHint={letzterFehler || lesson.mode === 'blockierend'}
            />
            {letzterFehler && lesson.mode === 'blockierend' && (
              <p className="mt-2 text-center text-sm text-gedaempft">
                {de.uebung.blockiertHinweis}
              </p>
            )}
          </div>

          {/* Welcher Finger ist dran? Ohne diese Angabe zeigt die App zwar die
              richtige Taste, laesst aber offen, womit man sie nehmen soll -- und
              genau das ist der Kern des Zehnfingersystems (SPEC.md 7.3). */}
          <div className="w-64 shrink-0 border-l border-rand pl-4">
            <p className="text-center text-xs uppercase tracking-wide text-gedaempft">
              {de.uebung.naechsterFinger}
            </p>
            <Hands nextChar={naechstesZeichen} />
          </div>
        </section>
      )}

      <p className="text-center text-xs text-gedaempft">{de.uebung.pausieren}</p>
    </div>
  );
}

/**
 * Ein einzelnes Zeichen der Vorlage.
 *
 * Die Zustände sind **nicht allein über die Farbe** unterschieden: Falsche
 * Zeichen bekommen eine Wellenlinie, korrigierte eine gepunktete, das aktuelle
 * einen Rahmen. Rot-Grün-Blindheit ist die häufigste Farbfehlsichtigkeit
 * (SPEC.md 12.2).
 */
function Zeichen({
  char,
  state,
  aktuell,
  geist,
}: {
  char: string;
  state: CharState;
  aktuell: boolean;
  /** Hier steht gerade der Geisterschreiber (SPEC.md 8.7). */
  geist: boolean;
}) {
  const farbe: Record<CharState, string> = {
    pending: 'text-gedaempft',
    correct: 'text-richtig',
    wrong: 'text-falsch underline decoration-wavy decoration-2',
    corrected: 'text-korrigiert underline decoration-dotted decoration-2',
  };

  // Ein Leerzeichen muss sichtbar sein, sonst weiss niemand, wo der Cursor steht.
  const anzeige = char === ' ' ? ' ' : char === '\n' ? '⏎\n' : char;

  return (
    <span
      className={[
        farbe[state],
        aktuell ? 'rounded bg-akzent/15 outline outline-2 outline-akzent' : '',
        // Der Geist ist blass und liegt unter dem Text. Er ueberdeckt nie den
        // eigenen Cursor -- er ist ein Schrittmacher, kein zweiter Fokus.
        geist ? 'border-b-2 border-gedaempft/70' : '',
        char === ' ' ? 'inline-block min-w-[0.6em]' : '',
      ].join(' ')}
    >
      {anzeige}
    </span>
  );
}
