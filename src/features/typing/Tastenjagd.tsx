/**
 * Die Tastenjagd (SPEC.md 8.9).
 *
 * Zwei Bildschirme: das Angebot nach der Auswertung und die Jagd selbst.
 *
 * **Immer ein Angebot, nie ein Zwang.** „Lieber nicht" führt ohne Nachfrage und
 * ohne Folgen zurück. Und **unbewertet**: keine Sterne, keine Fehlerquote, kein
 * Eintrag in `lesson_progress` — XP gibt es trotzdem, weil Anstrengung belohnt
 * wird (SPEC.md 8, Leitregel).
 */

import { useMemo } from 'react';
import {
  jagdSequenzen,
  jagdbilanz,
  JAGD_RUNDEN,
  JAGD_SEKUNDEN,
  type Jagdangebot,
  type Jagdbilanz,
} from '../../lib/tastenjagd';
import { XP } from '../../lib/gamification';
import { DrillScreen } from './DrillScreen';
import { MaskottchenMitSpruch } from '../mascot/Maskottchen';
import { maskottchenFuer } from '../../lib/maskottchen';
import { de } from '../../i18n/de';

export function Jagdfrage({
  angebot,
  onLosgehen,
  onSpaeter,
}: {
  angebot: Jagdangebot;
  onLosgehen: () => void;
  onSpaeter: () => void;
}) {
  const maus = maskottchenFuer({ art: 'tastenjagd' });

  return (
    <section className="rounded-2xl border border-rand bg-flaeche p-4">
      <MaskottchenMitSpruch
        zustand={maus.zustand}
        spruch={de.tastenjagd.angebot(angebot.zeichen)}
        groesse={64}
      />
      <p className="mt-3 text-xs text-gedaempft">{de.tastenjagd.unbewertet}</p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={onLosgehen}
          className="rounded-xl bg-akzent px-4 py-2 text-sm font-semibold text-white"
        >
          {de.tastenjagd.losgehen}
        </button>
        <button
          type="button"
          onClick={onSpaeter}
          className="rounded-xl border border-rand px-4 py-2 text-sm text-gedaempft hover:text-text"
        >
          {de.tastenjagd.spaeter}
        </button>
      </div>
    </section>
  );
}

export interface TastenjagdProps {
  readonly angebot: Jagdangebot;
  /** Geht in die Saat ein, damit eine zweite Jagd andere Zeilen bringt. */
  readonly saat: string;
  readonly blind: boolean;
  readonly onFertig: () => void;
}

export function Tastenjagd({ angebot, saat, blind, onFertig }: TastenjagdProps) {
  const sequenzen = useMemo(() => jagdSequenzen(angebot, JAGD_RUNDEN, saat), [angebot, saat]);

  return (
    <DrillScreen
      titel={de.tastenjagd.titel}
      erklaerung={de.tastenjagd.unbewertet}
      texte={sequenzen}
      sekunden={JAGD_SEKUNDEN}
      weiterLabel={de.tastenjagd.zurueck}
      fertigText={de.tastenjagd.fertig}
      onFertig={onFertig}
      onAbbrechen={onFertig}
      fertigInhalt={(statistiken) => <Jagdende bilanz={jagdbilanz(angebot.zeichen, statistiken)} />}
      zeigeRunden
      blind={blind}
    />
  );
}

/**
 * Was nach der Jagd dasteht.
 *
 * **Beschreibend, nicht bewertend.** Die Jagd ist unbewertet (SPEC.md 8.9):
 * keine Sterne, keine Fehlerquote, keine Note. Hier steht deshalb nur, was
 * passiert ist — und ausdrücklich **kein** „du bist besser geworden". Fünf
 * Runden tragen eine solche Aussage nicht; sie wäre eine erfundene
 * Fortschrittszahl (MODUL-LERNEN.md 1.1).
 *
 * Bis zum 2026-09-18 stand hier gar nichts: Die Jagd endete mit einem kleinen
 * „Jagd beendet." neben dem Knopf, und wer zurückging, landete wortlos im
 * Lernweg. Aus Sicht des Nutzers war das „es passiert nichts".
 */
function Jagdende({ bilanz }: { bilanz: Jagdbilanz }) {
  const nichtsVorgekommen = bilanz.treffer === 0 && bilanz.daneben === 0;

  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold">{de.tastenjagd.bilanzTitel}</h2>

      {nichtsVorgekommen ? (
        <p className="mt-3">{de.tastenjagd.bilanzNichts(bilanz.zeichen)}</p>
      ) : (
        <>
          <p className="mt-3 text-lg">
            {de.tastenjagd.bilanzTreffer(bilanz.zeichen, bilanz.treffer)}
          </p>
          <p className="mt-1 text-gedaempft">{de.tastenjagd.bilanzDaneben(bilanz.daneben)}</p>
        </>
      )}

      <p className="mt-1 text-sm text-gedaempft">
        {de.tastenjagd.bilanzAnschlaege(bilanz.anschlaege)}
      </p>

      <p className="mt-4 inline-block rounded-full bg-akzent px-4 py-1.5 font-semibold text-white">
        {de.tastenjagd.bilanzXp(XP.tastenjagd)}
      </p>

      <p className="mt-4 text-sm text-gedaempft">{de.tastenjagd.bilanzUnbewertet}</p>
    </div>
  );
}
