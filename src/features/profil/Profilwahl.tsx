/**
 * „Wer übt gerade?" — die Wahl des Kindes beim Start (SPEC.md 5.1).
 *
 * **Dieser Bildschirm erscheint nur, wenn es mehr als ein Kind gibt.** Solange
 * eines allein übt, ist er ein zusätzlicher Klick ohne jeden Nutzen — und der
 * erste Klick nach dem Öffnen entscheidet mit darüber, ob ein Kind die App
 * überhaupt aufmacht (SPEC.md 14, M3).
 *
 * **Es wird nichts gemerkt.** Beim nächsten Start steht die Frage wieder da.
 * Ein gemerkter Name wäre auf einem geteilten Laptop die häufigste Art, in der
 * Übungszeit beim falschen Kind landet — und das fällt niemandem auf.
 *
 * Reine Anzeige: Der Bildschirm sagt nur, welcher Platz gewählt wurde. Das
 * Umschalten der Datenbank macht `App.tsx` (ARCHITEKTUR.md, Architekturregel 1).
 */

import { Maskottchen } from '../mascot/Maskottchen';
import { de } from '../../i18n/de';
import type { PlatzStand } from '../../db';

export interface ProfilwahlProps {
  readonly plaetze: readonly PlatzStand[];
  readonly onWaehlen: (platz: number) => void;
  /** Fehlt, wenn alle Plätze belegt sind. */
  readonly onNeu?: ((platz: number) => void) | undefined;
}

export function Profilwahl({ plaetze, onWaehlen, onNeu }: ProfilwahlProps) {
  const belegt = plaetze.filter((p) => p.belegt);
  const frei = plaetze.find((p) => !p.belegt);

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-2xl font-semibold">{de.profilwahl.titel}</h1>

      <div className="flex flex-wrap items-stretch justify-center gap-4">
        {belegt.map((p) => (
          <button
            key={p.platz}
            type="button"
            onClick={() => onWaehlen(p.platz)}
            className="flex w-40 flex-col items-center gap-3 rounded-2xl border-2 border-rand bg-flaeche px-4 py-6 transition hover:border-akzent hover:bg-akzent/5"
          >
            <Maskottchen zustand="winkt" groesse={64} />
            <span className="text-lg font-semibold">{p.name || de.profilwahl.ohneNamen}</span>
          </button>
        ))}

        {frei && onNeu && (
          <button
            type="button"
            onClick={() => onNeu(frei.platz)}
            className="flex w-40 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-rand px-4 py-6 text-gedaempft transition hover:border-akzent hover:text-akzent"
          >
            <span aria-hidden="true" className="text-4xl leading-none">
              +
            </span>
            <span className="text-sm font-semibold">{de.profilwahl.neu}</span>
          </button>
        )}
      </div>

      {/* Die Zusage, die den ganzen Entwurf erklaert: getrennte Dateien, keine
          gemeinsame Auswertung, kein Vergleich zwischen Geschwistern. */}
      <p className="max-w-md text-center text-sm text-gedaempft">{de.profilwahl.getrennt}</p>
    </div>
  );
}
