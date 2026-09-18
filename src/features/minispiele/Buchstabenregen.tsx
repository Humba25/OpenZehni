/**
 * Minispiel „Buchstabenregen" (SPEC.md 8.10).
 *
 * Buchstaben fallen von oben, die richtige Taste fängt sie ab. Umsetzung als
 * DOM ohne Spiel-Engine und ohne neue Abhängigkeit, wie die Spec es verlangt
 * (Performance-Budget 12.1).
 *
 * **Drei Fehlversuche, dann ist die Runde vorbei** (seit 2026-09-18,
 * Entscheidung des Nutzers). Keine Uhr mehr: Ein Countdown, der etwas beendet,
 * ist ausdrücklich unerwünscht (SPEC.md 8.11). Jetzt hängt das Ende daran, wie
 * gut man ist, und die nächste Runde beginnt sofort.
 *
 * Das sind **keine Leben, die den Zugang begrenzen** — das verbietet 8.11 und
 * es bleibt verboten. Nach der dritten verpassten Taste ist die Runde zu Ende,
 * nicht das Spiel.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMemo } from 'react';
import {
  regenGruppenBis,
  regenVorrat,
  naechstesZeichen,
  createRandom,
  REGEN_LEBEN,
  FALLDAUER_MS,
  ABWURF_MS,
} from '../../lib/minispiele';
import { de } from '../../i18n/de';

/** Ein Buchstabe auf dem Weg nach unten. */
interface Tropfen {
  readonly id: number;
  readonly zeichen: string;
  /** Waagerechte Lage in Prozent. */
  readonly links: number;
  /** Zeitstempel des Abwurfs. */
  readonly start: number;
}

/** Die Optik eines Auswahlknopfes. Steht hier, damit sie nicht zweimal dasteht. */
const knopf = (aktiv: boolean): string =>
  [
    'rounded-lg border px-3 py-1 text-sm transition-colors',
    aktiv ? 'border-akzent bg-akzent/10 font-semibold' : 'border-rand hover:border-akzent',
  ].join(' ');

/** Wie oft die Anzeige neu gerechnet wird. 20 Bilder je Sekunde reichen. */
const TAKT_MS = 50;

export interface BuchstabenregenProps {
  /** Aus deren Zeichenvorrat fällt es — nur Gelerntes (SPEC.md 8.10). */
  readonly lessonId: string;
  readonly saat: string;
  readonly onBeenden: (gefangen: number) => void;
}

export function Buchstabenregen({ lessonId, saat, onBeenden }: BuchstabenregenProps) {
  /**
   * Welche Tastenreihe fällt. Die Auswahl steht **im Spiel**, nicht davor: So
   * funktioniert sie auch, wenn die Runde aus dem Lernweg heraus beginnt, und
   * man kann zwischen zwei Runden wechseln, ohne das Spiel zu verlassen.
   */
  const gruppen = useMemo(() => regenGruppenBis(lessonId), [lessonId]);

  /**
   * Die gewählten Gruppen. **Leer heißt alles** — das ist die Vorgabe und das
   * Verhalten von vorher. Mehrfachauswahl ist hier der Kern: „vielleicht nur
   * d k, oder vielleicht d f j k."
   */
  const [gewaehlt, setGewaehlt] = useState<ReadonlySet<string>>(new Set());
  const [tropfen, setTropfen] = useState<readonly Tropfen[]>([]);
  const [gefangen, setGefangen] = useState(0);
  const [verpasst, setVerpasst] = useState(0);
  const [jetzt, setJetzt] = useState(() => performance.now());

  const vorrat = useRef<readonly string[]>([]);
  vorrat.current = regenVorrat(lessonId, gruppen, gewaehlt);
  const rnd = useRef(createRandom(`regen#${lessonId}#${saat}`));
  const naechsteId = useRef(0);
  const letzterAbwurf = useRef(0);

  /**
   * Spiegel des Zustands für den Tastendruck.
   *
   * Ein Tastendruck muss wissen, was **jetzt** fällt, und darf nicht in einer
   * Zustandsfunktion nebenbei zählen: Die kann React zweimal aufrufen, und dann
   * zählte ein Treffer doppelt.
   */
  const tropfenRef = useRef<readonly Tropfen[]>([]);
  const setzeTropfen = useCallback((neu: readonly Tropfen[]): void => {
    tropfenRef.current = neu;
    setTropfen(neu);
  }, []);

  const vorbei = verpasst >= REGEN_LEBEN;

  /**
   * Sofort wieder spielbar — das ist der Unterschied zwischen „Runde vorbei"
   * und „Zugang begrenzt" (SPEC.md 8.11). Ohne diesen Knopf wäre das Ende eine
   * Sackgasse, und genau die soll es nirgends geben (ARCHITEKTUR.md).
   */
  const neuStarten = useCallback((): void => {
    setzeTropfen([]);
    setGefangen(0);
    setVerpasst(0);
    naechsteId.current = 0;
    letzterAbwurf.current = 0;
    setJetzt(performance.now());
  }, [setzeTropfen]);

  // Der Spieltakt: neue Buchstaben abwerfen, unten angekommene entfernen.
  useEffect(() => {
    if (vorbei) return;

    const id = window.setInterval(() => {
      const t = performance.now();
      setJetzt(t);

      // Unten angekommen: kostet einen Versuch.
      const durch = tropfenRef.current.filter((x) => t - x.start >= FALLDAUER_MS);
      let neu = tropfenRef.current.filter((x) => t - x.start < FALLDAUER_MS);
      if (durch.length > 0) setVerpasst((n) => n + durch.length);

      if (t - letzterAbwurf.current >= ABWURF_MS) {
        const zeichen = naechstesZeichen(vorrat.current, rnd.current);
        if (zeichen !== undefined) {
          letzterAbwurf.current = t;
          neu = [
            ...neu,
            { id: naechsteId.current++, zeichen, links: 6 + rnd.current() * 84, start: t },
          ];
        }
      }

      setzeTropfen(neu);
    }, TAKT_MS);

    return () => window.clearInterval(id);
  }, [vorbei, setzeTropfen]);

  const fangen = useCallback(
    (zeichen: string) => {
      const alte = tropfenRef.current;

      // Der unterste passende Buchstabe zuerst: Er ist am naechsten dran, unten
      // anzukommen. Frueher abgeworfen heisst weiter unten.
      let index = -1;
      for (let i = 0; i < alte.length; i++) {
        if (alte[i]!.zeichen !== zeichen) continue;
        if (index === -1 || alte[i]!.start < alte[index]!.start) index = i;
      }
      if (index === -1) return;

      setzeTropfen(alte.filter((_, i) => i !== index));
      setGefangen((n) => n + 1);
    },
    [setzeTropfen],
  );

  useEffect(() => {
    if (vorbei) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === 'Escape') {
        onBeenden(gefangen);
        return;
      }
      if (event.key.length !== 1) return;
      event.preventDefault();
      fangen(event.key);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [vorbei, fangen, gefangen, onBeenden]);

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 p-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">{de.minispiele.buchstabenregen.titel}</h1>
          <p className="text-sm text-gedaempft">{de.minispiele.buchstabenregen.beschreibung}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gedaempft">
          <span className="tabular-nums">{de.minispiele.buchstabenregen.gefangen(gefangen)}</span>
          <span className="tabular-nums">
            {de.minispiele.buchstabenregen.leben(Math.max(0, REGEN_LEBEN - verpasst))}
          </span>
        </div>
      </header>

      {/*
        Auswahl der Tastenreihe. Nur was gelernt ist, steht hier — die harte
        Regel aus SPEC.md 6.2 gilt im Spiel genauso.

        Ein Wechsel startet die Runde neu: Mitten im Fallen den Vorrat zu
        tauschen, hieße Buchstaben stehen zu lassen, die nicht mehr dazugehören.
      */}
      {gruppen.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gedaempft">
            {de.minispiele.buchstabenregen.gruppeFrage}
          </span>

          {/* Nichts gewählt heißt alles — deshalb ist dieser Knopf aktiv,
              solange die Auswahl leer ist. */}
          <button
            type="button"
            aria-pressed={gewaehlt.size === 0}
            onClick={() => {
              setGewaehlt(new Set());
              neuStarten();
            }}
            className={knopf(gewaehlt.size === 0)}
          >
            {de.minispiele.buchstabenregen.gruppeAlles}
          </button>

          {gruppen.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={gewaehlt.has(g.id)}
              onClick={() => {
                const neu = new Set(gewaehlt);
                if (neu.has(g.id)) neu.delete(g.id);
                else neu.add(g.id);
                setGewaehlt(neu);
                neuStarten();
              }}
              className={`${knopf(gewaehlt.has(g.id))} font-tippen`}
            >
              {g.zeichen.join(' ')}
            </button>
          ))}
        </div>
      )}

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-rand bg-flaeche">
        {!vorbei &&
          tropfen.map((x) => {
            const anteil = Math.min(1, (jetzt - x.start) / FALLDAUER_MS);
            return (
              <span
                key={x.id}
                className="absolute font-tippen text-3xl font-semibold text-akzent"
                style={{ left: `${x.links}%`, top: `${anteil * 88}%` }}
              >
                {x.zeichen}
              </span>
            );
          })}

        {vorbei && (
          <div className="grid h-full place-items-center p-6 text-center">
            <div>
              <p className="text-sm text-gedaempft">{de.minispiele.buchstabenregen.verloren}</p>
              <p className="mt-2 text-2xl font-semibold">
                {de.minispiele.buchstabenregen.ergebnis(gefangen)}
              </p>
              <button
                type="button"
                onClick={neuStarten}
                className="mt-4 rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
              >
                {de.minispiele.buchstabenregen.nochmal}
              </button>
              <p className="mt-4 text-sm text-gedaempft">{de.minispiele.xpHinweis}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onBeenden(gefangen)}
          className="rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
        >
          {vorbei ? de.minispiele.beenden : de.minispiele.zurueck}
        </button>
      </div>
    </div>
  );
}
