/**
 * Der gemeinsame Bildschirm für **unbewertetes** Tippen: Aufwärmen
 * (SPEC.md 6.5, Schritt 1) und Tastenjagd (SPEC.md 8.9).
 *
 * Was er ausdrücklich **nicht** tut: messen, Sterne vergeben, eine Fehlerquote
 * ausrechnen oder irgendetwas in `sessions`, `lesson_progress` oder
 * `char_stats` schreiben. Er nimmt Tastendrücke entgegen und zeigt, wie weit
 * die Zeile ist.
 *
 * **Zur Uhr:** Sie zeigt an, wie lange die Einheit gedacht ist, und **bricht
 * nichts ab** (SPEC.md 8.11). Läuft sie ab, erscheint der Weiter-Knopf; wer
 * mitten im Wort ist, tippt in Ruhe zu Ende. Es geht nichts verloren, weil es
 * hier nichts zu verlieren gibt.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  createSession,
  type CharState,
  type CharStat,
  type SessionSnapshot,
} from '../../lib/typing-engine';
import { Keyboard } from './Keyboard';
import { Hands } from './Hands';
import { de } from '../../i18n/de';

export interface DrillScreenProps {
  readonly titel: string;
  readonly erklaerung: string;
  /** Die Zeilen, die nacheinander drankommen. */
  readonly texte: readonly string[];
  /** Wie lange die Einheit gedacht ist. Die Uhr bricht nichts ab. */
  readonly sekunden: number;
  /** Beschriftung des Knopfes, wenn die Zeit um oder alles getippt ist. */
  readonly weiterLabel: string;
  /** Text, der erscheint, wenn die Einheit vorbei ist. */
  readonly fertigText: string;
  readonly onFertig: () => void;
  readonly onAbbrechen?: (() => void) | undefined;
  /**
   * Wird gezeigt, sobald die Einheit vorbei ist — an der Stelle, wo sonst die
   * Tastatur steht.
   *
   * Der Bildschirm sammelt dafür die Zeichenstatistik **jeder** Zeile ein, denn
   * je Zeile läuft eine eigene Sitzung. Was daraus gemacht wird, entscheidet
   * der Aufrufer; dieser Bildschirm bewertet weiterhin nichts.
   */
  readonly fertigInhalt?:
    ((statistiken: readonly ReadonlyMap<string, CharStat>[]) => ReactNode) | undefined;
  /** Fortschrittszeile „Runde 2 von 5". Ohne Angabe wird nichts gezeigt. */
  readonly zeigeRunden?: boolean;
  readonly blind?: boolean;
}

export function DrillScreen({
  titel,
  erklaerung,
  texte,
  sekunden,
  weiterLabel,
  fertigText,
  onFertig,
  onAbbrechen,
  fertigInhalt,
  zeigeRunden = false,
  blind = false,
}: DrillScreenProps) {
  const [index, setIndex] = useState(0);
  const [verbleibend, setVerbleibend] = useState(sekunden);

  const text = texte[index] ?? '';
  const session = useMemo(
    // Fliessend, nicht blockierend: Im Aufwaermen soll niemand an einer Taste
    // haengenbleiben -- es geht um Bewegung, nicht um Genauigkeit.
    () => createSession({ text, mode: 'fliessend' }),
    [text],
  );

  const [snap, setSnap] = useState<SessionSnapshot>(() => session.snapshot());
  useEffect(() => setSnap(session.snapshot()), [session]);

  /**
   * Die Zeichenstatistik jeder abgeschlossenen Zeile.
   *
   * Je Zeile entsteht eine eigene Sitzung, deren Statistik mit ihr verschwindet.
   * Wer am Ende etwas ueber die ganze Einheit sagen will, muss sie unterwegs
   * einsammeln -- deshalb dieser Speicher. Ein Ref statt State: Die Anzeige
   * haengt nicht daran, und jede Aenderung wuerde sonst neu zeichnen.
   */
  const statistiken = useRef<ReadonlyMap<string, CharStat>[]>([]);
  const letzteZeile = useRef(-1);

  const zeitUm = verbleibend <= 0;
  const allesGetippt = index >= texte.length - 1 && snap.finished;
  const vorbei = zeitUm || allesGetippt;
  const vorbeiRef = useRef(vorbei);
  vorbeiRef.current = vorbei;

  // Die Uhr. Sie laeuft bis null und bleibt dort stehen.
  useEffect(() => {
    if (verbleibend <= 0) return;
    const id = window.setInterval(() => setVerbleibend((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [verbleibend]);

  const naechsteZeile = useCallback(() => {
    setIndex((i) => Math.min(i + 1, texte.length - 1));
  }, [texte.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        if (vorbeiRef.current) onFertig();
        else onAbbrechen?.();
        return;
      }

      if (vorbeiRef.current && event.key === 'Enter') {
        event.preventDefault();
        onFertig();
        return;
      }

      if ([' ', 'Backspace', 'Tab', 'Enter'].includes(event.key)) event.preventDefault();

      session.handleKey({ key: event.key, code: event.code, at: event.timeStamp });
      const neu = session.snapshot();
      setSnap(neu);

      // Zeile fertig: Statistik sichern, dann die naechste holen.
      if (neu.finished && letzteZeile.current !== index) {
        letzteZeile.current = index;
        statistiken.current = [...statistiken.current, neu.charStats];
      }
      if (neu.finished && index < texte.length - 1) naechsteZeile();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session, index, texte.length, naechsteZeile, onFertig, onAbbrechen]);

  const zeichen = useMemo(() => [...text], [text]);
  const naechstesZeichen = zeichen[snap.cursor];

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 p-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">{titel}</h1>
          <p className="text-sm text-gedaempft">{erklaerung}</p>
        </div>
        <div className="flex items-center gap-4">
          {zeigeRunden && (
            <span className="text-sm text-gedaempft">
              {de.tastenjagd.runde(Math.min(index + 1, texte.length), texte.length)}
            </span>
          )}
          <span className="tabular-nums text-sm text-gedaempft">
            {de.aufwaermen.verbleibend(verbleibend)}
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-rand bg-flaeche p-6">
        <p className="font-tippen text-[26px] leading-[1.9] tracking-wide">
          {zeichen.map((char, i) => (
            <DrillZeichen
              key={i}
              char={char}
              state={snap.states[i] ?? 'pending'}
              aktuell={i === snap.cursor}
            />
          ))}
        </p>
      </section>

      {/*
        Ist die Einheit vorbei, tritt die Rueckmeldung an die Stelle der
        Tastatur. Vorher stand dort weiter die Tastatur und daneben ein
        kleines "Jagd beendet." -- fuer den Nutzer sah das aus, als sei
        nichts passiert.

        Die Statistik der laufenden Zeile kommt dazu: Laeuft die Uhr mitten in
        einer Zeile ab, waere sie sonst nicht mitgezaehlt.
      */}
      {vorbei && fertigInhalt ? (
        <section className="rounded-2xl border border-rand bg-flaeche p-6">
          {fertigInhalt(
            letzteZeile.current === index
              ? statistiken.current
              : [...statistiken.current, snap.charStats],
          )}
        </section>
      ) : (
        !blind && (
          <section className="flex items-start gap-4 rounded-2xl border border-rand bg-flaeche p-4">
            <div className="min-w-0 flex-1">
              <Keyboard nextChar={naechstesZeichen} showHint />
            </div>
            <div className="w-56 shrink-0 border-l border-rand pl-4">
              <p className="text-center text-xs uppercase tracking-wide text-gedaempft">
                {de.uebung.naechsterFinger}
              </p>
              <Hands nextChar={naechstesZeichen} />
            </div>
          </section>
        )
      )}

      <div className="mt-auto flex items-center justify-between">
        {onAbbrechen ? (
          <button
            type="button"
            onClick={onAbbrechen}
            className="rounded-lg border border-rand px-3 py-1.5 text-sm text-gedaempft hover:text-text"
          >
            {de.aufwaermen.ueberspringen}
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-3">
          {vorbei && <span className="text-sm text-gedaempft">{fertigText}</span>}
          <button
            type="button"
            onClick={onFertig}
            className="rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
          >
            {weiterLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Ein Zeichen der Drillzeile.
 *
 * Wie im Übungsbildschirm nicht allein über die Farbe unterschieden: falsch
 * bekommt eine Wellenlinie, korrigiert eine gepunktete (SPEC.md 12.2).
 */
function DrillZeichen({
  char,
  state,
  aktuell,
}: {
  char: string;
  state: CharState;
  aktuell: boolean;
}) {
  const farbe: Record<CharState, string> = {
    pending: 'text-gedaempft',
    correct: 'text-richtig',
    wrong: 'text-falsch underline decoration-wavy decoration-2',
    corrected: 'text-korrigiert underline decoration-dotted decoration-2',
  };

  return (
    <span
      className={[
        farbe[state],
        aktuell ? 'rounded bg-akzent/15 outline outline-2 outline-akzent' : '',
        char === ' ' ? 'inline-block min-w-[0.6em]' : '',
      ].join(' ')}
    >
      {char === ' ' ? ' ' : char}
    </span>
  );
}
