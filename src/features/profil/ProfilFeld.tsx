/**
 * Die Kinderverwaltung in den Einstellungen (SPEC.md 5.1).
 *
 * Drei Dinge: wer an diesem Rechner übt, ein Kind dazunehmen, ein Kind löschen.
 *
 * **Warum das in die Einstellungen gehört und nicht in die Kopfzeile.** Ein
 * Kind hinzufügen oder löschen tut ein Erwachsener, und zwar selten. Ein Knopf
 * dafür neben „Spiele" wäre eine Einladung zum Ausprobieren — mit dem
 * Lernfortschritt eines Geschwisterkindes als Einsatz.
 *
 * **Löschen fragt nach und nennt die Folge beim Namen.** Kein „Wirklich?",
 * sondern der Satz, worum es geht: Der Lernfortschritt ist danach weg.
 */

import { useState } from 'react';
import { Maskottchen } from '../mascot/Maskottchen';
import { de } from '../../i18n/de';
import type { PlatzStand } from '../../db';
import { loeschbarerPlatz } from '../../lib/plaetze';

export interface ProfilFeldProps {
  readonly plaetze: readonly PlatzStand[];
  readonly offen: number;
  readonly onWechseln: () => void;
  readonly onNeu: (platz: number) => void;
  readonly onLoeschen: (platz: number) => void;
  /** Wie viele Kinder überhaupt möglich sind. */
  readonly maximum: number;
}

export function ProfilFeld({
  plaetze,
  offen,
  onWechseln,
  onNeu,
  onLoeschen,
  maximum,
}: ProfilFeldProps) {
  const [fragt, setFragt] = useState<number | null>(null);

  const belegt = plaetze.filter((p) => p.belegt);
  const frei = plaetze.find((p) => !p.belegt);
  const loeschbar = loeschbarerPlatz(belegt.map((p) => p.platz));

  return (
    <section className="rounded-2xl border border-rand bg-flaeche p-4">
      <h2 className="font-semibold">{de.profilwahl.verwalten}</h2>
      <p className="mt-1 text-sm text-gedaempft">{de.profilwahl.getrennt}</p>

      <ul className="mt-3 flex flex-col gap-2">
        {belegt.map((p) => (
          <li
            key={p.platz}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-rand px-3 py-2"
          >
            <Maskottchen zustand="idle" groesse={24} />
            <span className="font-semibold">{p.name || de.profilwahl.ohneNamen}</span>
            {p.platz === offen && (
              <span className="rounded-full bg-akzent/15 px-2 py-0.5 text-xs font-semibold text-akzent">
                {de.navigation.hier}
              </span>
            )}

            {p.platz === loeschbar && p.platz !== offen && (
              <button
                type="button"
                onClick={() => setFragt(p.platz)}
                className="ml-auto rounded-lg border border-rand px-3 py-1 text-sm text-gedaempft hover:border-korrigiert hover:text-korrigiert"
              >
                {de.profilwahl.loeschen}
              </button>
            )}
          </li>
        ))}
      </ul>

      {fragt !== null && (
        <div
          role="alertdialog"
          aria-label={de.profilwahl.loeschen}
          className="mt-3 rounded-lg border border-korrigiert bg-korrigiert/10 p-3 text-sm"
        >
          <p>
            {de.profilwahl.loeschenFrage(
              plaetze.find((p) => p.platz === fragt)?.name || de.profilwahl.ohneNamen,
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onLoeschen(fragt);
                setFragt(null);
              }}
              className="rounded-lg bg-korrigiert px-3 py-1.5 font-semibold text-white"
            >
              {de.profilwahl.loeschenJa}
            </button>
            <button
              type="button"
              onClick={() => setFragt(null)}
              className="rounded-lg border border-rand px-3 py-1.5"
            >
              {de.profilwahl.loeschenNein}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {belegt.length > 1 && (
          <button
            type="button"
            onClick={onWechseln}
            title={de.profilwahl.wechselnTitel}
            className="rounded-lg border border-rand px-4 py-2 hover:border-akzent"
          >
            {de.profilwahl.wechseln}
          </button>
        )}

        {frei ? (
          <button
            type="button"
            onClick={() => onNeu(frei.platz)}
            className="rounded-lg border border-rand px-4 py-2 hover:border-akzent"
          >
            {de.profilwahl.neu}
          </button>
        ) : (
          <p className="text-sm text-gedaempft">{de.profilwahl.voll(maximum)}</p>
        )}
      </div>

      {belegt.length > 1 && (
        <p className="mt-2 text-xs text-gedaempft">{de.profilwahl.nurLetztes}</p>
      )}
    </section>
  );
}
