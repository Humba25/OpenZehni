/**
 * Die Karte der Tagesaufgabe (SPEC.md 8.6).
 *
 * Sie steht auf dem Lernweg, ist **freiwillig** und lässt sich wegklicken.
 * Nicht geschafft heißt gar nichts: Diese Komponente kennt keinen Zustand
 * „verpasst" und keine Meldung darüber — um Mitternacht ist die Karte einfach
 * weg.
 */

import { balkenAnteil } from '../../lib/challenges';
import { XP } from '../../lib/gamification';
import type { Tagesaufgabe as Stand } from '../../db/motivation';
import { de } from '../../i18n/de';

export interface TagesaufgabeProps {
  readonly stand: Stand;
  readonly onAusblenden: () => void;
}

export function TagesaufgabeKarte({ stand, onAusblenden }: TagesaufgabeProps) {
  const anteil = balkenAnteil(stand.aufgabe, stand.fortschritt);

  return (
    <section className="rounded-2xl border border-rand bg-flaeche p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-gedaempft">{de.tagesaufgabe.titel}</p>
          <p className="mt-1 font-semibold">{stand.aufgabe.text}</p>
        </div>
        <button
          type="button"
          onClick={onAusblenden}
          className="shrink-0 rounded-lg border border-rand px-2 py-1 text-xs text-gedaempft hover:text-text"
        >
          {de.tagesaufgabe.ausblenden}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-rand/50">
          <div
            className="h-full rounded-full bg-akzent transition-[width] duration-300"
            style={{ width: `${Math.round(anteil * 100)}%` }}
            role="progressbar"
            aria-valuenow={stand.fortschritt}
            aria-valuemin={0}
            aria-valuemax={stand.aufgabe.ziel}
            aria-label={de.tagesaufgabe.titel}
          />
        </div>
        <span className="shrink-0 tabular-nums text-sm text-gedaempft">
          {de.tagesaufgabe.stand(stand.fortschritt, stand.aufgabe.ziel)}
        </span>
      </div>

      <p className="mt-2 text-xs text-gedaempft">
        {stand.erfuellt
          ? `${de.tagesaufgabe.geschafft} ${de.tagesaufgabe.belohnung(XP.tagesaufgabe)}`
          : de.tagesaufgabe.freiwillig}
      </p>
    </section>
  );
}
