/**
 * Minispiel „Buchstabenregen" (SPEC.md 8.10).
 *
 * Buchstaben fallen von oben, die richtige Taste fängt sie ab. Umsetzung als
 * DOM ohne Spiel-Engine und ohne neue Abhängigkeit, wie die Spec es verlangt
 * (Performance-Budget 12.1).
 *
 * **Keine Leben, kein Verlieren-Bildschirm.** Ein verpasster Buchstabe
 * verschwindet unten und sonst passiert nichts. Das Spiel endet, wenn die Zeit
 * um ist, und ist sofort neu startbar.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  regenZeichen,
  naechstesZeichen,
  createRandom,
  SPIEL_SEKUNDEN,
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

/** Wie oft die Anzeige neu gerechnet wird. 20 Bilder je Sekunde reichen. */
const TAKT_MS = 50;

export interface BuchstabenregenProps {
  /** Aus deren Zeichenvorrat fällt es — nur Gelerntes (SPEC.md 8.10). */
  readonly lessonId: string;
  readonly saat: string;
  readonly onBeenden: (gefangen: number) => void;
}

export function Buchstabenregen({ lessonId, saat, onBeenden }: BuchstabenregenProps) {
  const [tropfen, setTropfen] = useState<readonly Tropfen[]>([]);
  const [gefangen, setGefangen] = useState(0);
  const [verbleibend, setVerbleibend] = useState(SPIEL_SEKUNDEN);
  const [jetzt, setJetzt] = useState(() => performance.now());

  const vorrat = useRef(regenZeichen(lessonId));
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

  const vorbei = verbleibend <= 0;

  // Die Uhr. Sie laeuft bis null und bleibt dort stehen.
  useEffect(() => {
    if (vorbei) return;
    const id = window.setInterval(() => setVerbleibend((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [vorbei]);

  // Der Spieltakt: neue Buchstaben abwerfen, unten angekommene entfernen.
  useEffect(() => {
    if (vorbei) return;

    const id = window.setInterval(() => {
      const t = performance.now();
      setJetzt(t);

      // Unten angekommen: verschwindet, und sonst passiert nichts.
      let neu = tropfenRef.current.filter((x) => t - x.start < FALLDAUER_MS);

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
          <span className="tabular-nums">{de.minispiele.verbleibend(verbleibend)}</span>
        </div>
      </header>

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
              <p className="text-2xl font-semibold">
                {de.minispiele.buchstabenregen.ergebnis(gefangen)}
              </p>
              <p className="mt-2 text-sm text-gedaempft">{de.minispiele.xpHinweis}</p>
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
