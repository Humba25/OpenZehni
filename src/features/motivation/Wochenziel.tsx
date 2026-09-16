/**
 * Der Balken des Wochenziels (SPEC.md 8.8).
 *
 * Nicht erreicht: Der Balken beginnt am Montag neu. Keine Meldung, keine
 * Einordnung, kein Verlust — diese Komponente kennt deshalb keinen Zustand
 * „verpasst".
 */

import { balkenAnteil, zielErreicht, type Wochenstand } from '../../lib/wochenziel';
import { de } from '../../i18n/de';

export function WochenzielBalken({ stand }: { stand: Wochenstand }) {
  const anteil = balkenAnteil(stand);
  const geschafft = zielErreicht(stand);

  return (
    <section className="rounded-2xl border border-rand bg-flaeche p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wide text-gedaempft">{de.wochenziel.titel}</p>
        <span className="tabular-nums text-sm text-gedaempft">
          {de.wochenziel.stand(stand.progress, stand.target)}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-rand/50">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            geschafft ? 'bg-richtig' : 'bg-akzent'
          }`}
          style={{ width: `${Math.round(anteil * 100)}%` }}
          role="progressbar"
          aria-valuenow={stand.progress}
          aria-valuemin={0}
          aria-valuemax={stand.target}
          aria-label={de.wochenziel.titel}
        />
      </div>

      <p className="mt-2 text-xs text-gedaempft">
        {geschafft ? de.wochenziel.geschafft : de.wochenziel.erklaerung}
      </p>
    </section>
  );
}
