/**
 * Minispiel „Pferderennen" (SPEC.md 8.10.1).
 *
 * Tippen treibt an, die Leertaste springt, ein Gegner läuft gleichmäßig mit.
 * Umsetzung als DOM/SVG ohne Spiel-Engine und ohne neue Abhängigkeit, wie 8.10
 * es verlangt (Performance-Budget 12.1).
 *
 * **Ein verpasster Sprung kostet Zeit, nicht Fortschritt.** Das Pferd stolpert
 * kurz und läuft weiter. Erspieltes wieder wegzunehmen wäre eine
 * Bestrafungsmechanik (8.11).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  STRECKE,
  STOLPER_MS,
  RENNSTUFEN,
  rennzeichen,
  huerdenPositionen,
  offeneHuerde,
  huerdeGerissen,
  gegnerAnteil,
  ausgang,
  type Rennstufe,
} from '../../lib/pferderennen';
import { de } from '../../i18n/de';

/** Wie oft die Anzeige neu gerechnet wird. 20 Bilder je Sekunde reichen. */
const TAKT_MS = 50;

export interface PferderennenProps {
  /** Aus deren Zeichenvorrat kommen die Zeichen (SPEC.md 8.10). */
  readonly lessonId: string;
  readonly saat: string;
  readonly onBeenden: (position: number) => void;
}

export function Pferderennen({ lessonId, saat, onBeenden }: PferderennenProps) {
  const [stufe, setStufe] = useState<Rennstufe>(RENNSTUFEN[0]!);
  const [rennen, setRennen] = useState(0);
  const [position, setPosition] = useState(0);
  const [gegner, setGegner] = useState(0);
  const [gesprungen, setGesprungen] = useState<ReadonlySet<number>>(new Set());
  const [stolpertBis, setStolpertBis] = useState(0);
  const [gestartet, setGestartet] = useState(false);

  const runde = `${saat}#${rennen}`;
  const zeichen = useMemo(() => rennzeichen(lessonId, runde), [lessonId, runde]);
  const huerden = useMemo(() => huerdenPositionen(stufe, runde), [stufe, runde]);

  const beginn = useRef(0);
  const positionRef = useRef(0);
  const gesprungenRef = useRef<ReadonlySet<number>>(new Set());
  const stolpertRef = useRef(0);

  const imZiel = position >= STRECKE;
  const gegnerDa = gegner >= 1;
  const vorbei = imZiel || gegnerDa;

  const neuesRennen = useCallback((): void => {
    setRennen((n) => n + 1);
    setPosition(0);
    setGegner(0);
    setGesprungen(new Set());
    setStolpertBis(0);
    setGestartet(false);
    positionRef.current = 0;
    gesprungenRef.current = new Set();
    stolpertRef.current = 0;
  }, []);

  // Die Uhr des Gegners. Sie laeuft erst, wenn das erste Zeichen getippt ist --
  // sonst verliert man, waehrend man noch liest.
  useEffect(() => {
    if (!gestartet || vorbei) return;
    const id = window.setInterval(() => {
      setGegner(gegnerAnteil(performance.now() - beginn.current, stufe));
    }, TAKT_MS);
    return () => window.clearInterval(id);
  }, [gestartet, vorbei, stufe]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      if (event.key === 'Escape') {
        onBeenden(positionRef.current);
        return;
      }

      if (vorbei) {
        if (event.key === 'Enter') {
          event.preventDefault();
          neuesRennen();
        }
        return;
      }

      // Die Leertaste springt -- und nur das. Sie steht deshalb vor der
      // Pruefung auf das naechste Zeichen.
      if (event.key === ' ') {
        event.preventDefault();
        const huerde = offeneHuerde(positionRef.current, huerden, stufe, gesprungenRef.current);
        if (huerde !== undefined) {
          const neu = new Set(gesprungenRef.current);
          neu.add(huerde);
          gesprungenRef.current = neu;
          setGesprungen(neu);
        }
        return;
      }

      if (event.key.length !== 1) return;
      event.preventDefault();

      // Waehrend des Stolperns geht es nicht voran. Kein Ton, keine Meldung --
      // man sieht es am Pferd.
      if (performance.now() < stolpertRef.current) return;

      if (event.key !== zeichen[positionRef.current]) return;

      if (!gestartet) {
        beginn.current = performance.now();
        setGestartet(true);
      }

      const naechste = positionRef.current + 1;
      positionRef.current = naechste;
      setPosition(naechste);

      // Genau auf der Huerde: Wer nicht gesprungen ist, stolpert.
      if (huerdeGerissen(naechste, huerden, gesprungenRef.current) !== undefined) {
        stolpertRef.current = performance.now() + STOLPER_MS;
        setStolpertBis(stolpertRef.current);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zeichen, huerden, stufe, gestartet, vorbei, neuesRennen, onBeenden]);

  const anteil = Math.min(1, position / STRECKE);
  const stolpertGerade = stolpertBis > performance.now();
  const naechsteHuerde = offeneHuerde(position, huerden, stufe, gesprungen);

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 p-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">{de.minispiele.pferderennen.titel}</h1>
          <p className="text-sm text-gedaempft">{de.minispiele.pferderennen.beschreibung}</p>
        </div>
        <span className="tabular-nums text-sm text-gedaempft">
          {de.minispiele.pferderennen.strecke(Math.round(anteil * 100))}
        </span>
      </header>

      {/* Schwierigkeit. Ein Wechsel beginnt ein neues Rennen. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gedaempft">{de.minispiele.pferderennen.stufeFrage}</span>
        {RENNSTUFEN.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={s.id === stufe.id}
            onClick={() => {
              setStufe(s);
              neuesRennen();
            }}
            className={[
              'rounded-lg border px-3 py-1 text-sm transition-colors',
              s.id === stufe.id
                ? 'border-akzent bg-akzent/10 font-semibold'
                : 'border-rand hover:border-akzent',
            ].join(' ')}
          >
            {de.minispiele.pferderennen.stufen[s.id]}
          </button>
        ))}
      </div>

      <section className="flex-1 rounded-2xl border border-rand bg-flaeche p-6">
        {vorbei ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <p className="text-2xl font-semibold">
                {ausgang(position, gegner) === 'gewonnen'
                  ? de.minispiele.pferderennen.gewonnen
                  : de.minispiele.pferderennen.verloren}
              </p>
              <p className="mt-2 text-sm text-gedaempft">
                {de.minispiele.pferderennen.huerdenBilanz(gesprungen.size, huerden.length)}
              </p>
              <button
                type="button"
                onClick={neuesRennen}
                className="mt-4 rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
              >
                {de.minispiele.pferderennen.nochmal}
              </button>
              <p className="mt-4 text-sm text-gedaempft">{de.minispiele.xpHinweis}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Die Bahn. Zwei Spuren: das eigene Pferd und der Gegner. */}
            <Bahn anteil={anteil} huerden={huerden} gesprungen={gesprungen} eigene />
            <Bahn anteil={gegner} huerden={[]} gesprungen={new Set()} />

            <p className="mt-6 text-center font-tippen text-3xl tracking-widest">
              <span className="text-gedaempft/40">
                {zeichen.slice(Math.max(0, position - 3), position)}
              </span>
              <span className={stolpertGerade ? 'text-gedaempft' : 'font-semibold text-akzent'}>
                {zeichen[position]}
              </span>
              <span>{zeichen.slice(position + 1, position + 8)}</span>
            </p>

            <p className="mt-3 text-center text-sm">
              {stolpertGerade ? (
                <span className="text-korrigiert">{de.minispiele.pferderennen.gestolpert}</span>
              ) : naechsteHuerde !== undefined ? (
                <span className="font-semibold text-akzent">
                  {de.minispiele.pferderennen.springen}
                </span>
              ) : gestartet ? (
                <span className="text-gedaempft">{de.minispiele.pferderennen.laufen}</span>
              ) : (
                <span className="text-gedaempft">{de.minispiele.pferderennen.losgehen}</span>
              )}
            </p>
          </>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onBeenden(position)}
          className="rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
        >
          {vorbei ? de.minispiele.beenden : de.minispiele.zurueck}
        </button>
      </div>
    </div>
  );
}

/** Eine Bahn mit Pferd und, beim eigenen Pferd, den Hürden. */
function Bahn({
  anteil,
  huerden,
  gesprungen,
  eigene = false,
}: {
  anteil: number;
  huerden: readonly number[];
  gesprungen: ReadonlySet<number>;
  eigene?: boolean;
}) {
  return (
    <div
      className={[
        'relative mt-3 h-12 overflow-hidden rounded-xl border',
        eigene ? 'border-akzent/40 bg-akzent/5' : 'border-rand bg-grund',
      ].join(' ')}
    >
      {huerden.map((h) => (
        <span
          key={h}
          aria-hidden
          className={[
            'absolute top-1/2 -translate-y-1/2 text-lg',
            gesprungen.has(h) ? 'opacity-30' : '',
          ].join(' ')}
          style={{ left: `${(h / STRECKE) * 92}%` }}
        >
          ⛩
        </span>
      ))}

      <span
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 text-2xl transition-[left] duration-100"
        style={{ left: `${anteil * 92}%` }}
      >
        🐴
      </span>

      {/* Die Ziellinie. */}
      <span className="absolute right-0 top-0 h-full w-1 bg-text/40" />
    </div>
  );
}
