/**
 * Minispiel „Wortsalat" (SPEC.md 8.10).
 *
 * Verdrehte Wörter wieder richtig tippen. Die Wörter kommen aus einer festen
 * Liste, gefiltert nach dem Zeichenvorrat der Lektion — **nur bereits gelernte
 * Zeichen** (SPEC.md 8.10, 6.2).
 *
 * **Kein Verlieren.** Wer ein Wort nicht sieht, klickt auf „Nächstes Wort" und
 * es geht weiter. Das Spiel endet, wenn die Zeit um ist.
 */

import { useEffect, useMemo, useState } from 'react';
import { salatrunden, SPIEL_SEKUNDEN } from '../../lib/minispiele';
import { de } from '../../i18n/de';

/** Reichlich Runden im Vorrat — die Zeit begrenzt, nicht die Liste. */
const RUNDEN = 40;

export interface WortsalatProps {
  readonly lessonId: string;
  readonly saat: string;
  readonly onBeenden: (geloest: number) => void;
}

export function Wortsalat({ lessonId, saat, onBeenden }: WortsalatProps) {
  const runden = useMemo(() => salatrunden(lessonId, RUNDEN, saat), [lessonId, saat]);

  const [index, setIndex] = useState(0);
  const [eingabe, setEingabe] = useState('');
  const [geloest, setGeloest] = useState(0);
  const [verbleibend, setVerbleibend] = useState(SPIEL_SEKUNDEN);

  const vorbei = verbleibend <= 0 || index >= runden.length;
  const runde = runden[index];

  useEffect(() => {
    if (verbleibend <= 0) return;
    const id = window.setInterval(() => setVerbleibend((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [verbleibend]);

  const weiter = (): void => {
    setEingabe('');
    setIndex((i) => i + 1);
  };

  const pruefen = (wert: string): void => {
    setEingabe(wert);
    if (runde && wert.trim().toLowerCase() === runde.wort) {
      setGeloest((n) => n + 1);
      weiter();
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4 p-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">{de.minispiele.wortsalat.titel}</h1>
          <p className="text-sm text-gedaempft">{de.minispiele.wortsalat.beschreibung}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gedaempft">
          <span className="tabular-nums">{de.minispiele.wortsalat.gefunden(geloest)}</span>
          <span className="tabular-nums">{de.minispiele.verbleibend(verbleibend)}</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-rand bg-flaeche p-8">
        {vorbei ? (
          <div className="text-center">
            <p className="text-2xl font-semibold">{de.minispiele.wortsalat.ergebnis(geloest)}</p>
            <p className="mt-2 text-sm text-gedaempft">{de.minispiele.xpHinweis}</p>
          </div>
        ) : (
          runde && (
            <>
              <p className="font-tippen text-5xl font-semibold tracking-[0.3em] text-akzent">
                {runde.verdreht}
              </p>
              <input
                type="text"
                value={eingabe}
                onChange={(e) => pruefen(e.target.value)}
                autoFocus
                spellCheck={false}
                aria-label={de.minispiele.wortsalat.titel}
                className="mt-8 w-64 rounded-xl border border-rand bg-grund px-4 py-3 text-center font-tippen text-2xl"
              />
              <button
                type="button"
                onClick={weiter}
                className="mt-4 rounded-lg border border-rand px-3 py-1.5 text-sm text-gedaempft hover:text-text"
              >
                {de.minispiele.wortsalat.ueberspringen}
              </button>
            </>
          )
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onBeenden(geloest)}
          className="rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
        >
          {vorbei ? de.minispiele.beenden : de.minispiele.zurueck}
        </button>
      </div>
    </div>
  );
}
