/**
 * Die Auswahl der Minispiele (SPEC.md 8.10).
 *
 * Eigener Eintrag **neben** dem Lernpfad, nie in eine Lektion eingebaut. Ein
 * Minispiel schaltet nichts frei — und wer nicht spielt, verpasst nichts.
 */

import { wortsalatSpielbar, wortsalatAbLektion, type MinispielId } from '../../lib/minispiele';
import { allLessons, getLesson } from '../../lib/curriculum';
import { de } from '../../i18n/de';

export interface SpielauswahlProps {
  /** Die zuletzt freigeschaltete Lektion — sie gibt den Zeichenvorrat vor. */
  readonly lessonId: string;
  readonly onSpielen: (spiel: MinispielId) => void;
  readonly onZurueck: () => void;
}

export function Spielauswahl({ lessonId, onSpielen, onZurueck }: SpielauswahlProps) {
  const salatGeht = wortsalatSpielbar(lessonId);
  const abId = wortsalatAbLektion(allLessons());
  const abNummer = abId ? getLesson(abId)?.order : undefined;

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{de.minispiele.titel}</h1>
            <p className="mt-1 text-gedaempft">{de.minispiele.untertitel}</p>
          </div>
          <button
            type="button"
            onClick={onZurueck}
            className="rounded-lg border border-rand px-4 py-2 text-gedaempft hover:text-text"
          >
            {de.minispiele.zurueck}
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Karte
            titel={de.minispiele.buchstabenregen.titel}
            beschreibung={de.minispiele.buchstabenregen.beschreibung}
            onSpielen={() => onSpielen('buchstabenregen')}
          />

          <Karte
            titel={de.minispiele.elfmeter.titel}
            beschreibung={de.minispiele.elfmeter.beschreibung}
            onSpielen={() => onSpielen('elfmeter')}
          />

          <Karte
            titel={de.minispiele.pferderennen.titel}
            beschreibung={de.minispiele.pferderennen.beschreibung}
            onSpielen={() => onSpielen('pferderennen')}
          />

          <Karte
            titel={de.minispiele.wortsalat.titel}
            beschreibung={de.minispiele.wortsalat.beschreibung}
            onSpielen={salatGeht ? () => onSpielen('wortsalat') : undefined}
            hinweis={
              salatGeht
                ? undefined
                : abNummer !== undefined
                  ? de.minispiele.wortsalat.nochNicht(String(abNummer))
                  : de.minispiele.wortsalat.nochNichtOhneLektion
            }
          />
        </div>

        <p className="mt-6 text-sm text-gedaempft">{de.minispiele.xpHinweis}</p>
      </div>
    </div>
  );
}

function Karte({
  titel,
  beschreibung,
  onSpielen,
  hinweis,
}: {
  titel: string;
  beschreibung: string;
  onSpielen?: (() => void) | undefined;
  hinweis?: string | undefined;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-rand bg-flaeche p-5">
      <h2 className="text-xl font-semibold">{titel}</h2>
      <p className="mt-1 flex-1 text-sm text-gedaempft">{beschreibung}</p>

      {onSpielen ? (
        <button
          type="button"
          onClick={onSpielen}
          className="mt-4 self-start rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
        >
          {de.minispiele.spielen}
        </button>
      ) : (
        // Kein ausgegrauter Knopf ohne Grund: Dasteht, warum es noch nicht geht
        // und ab wann (ARCHITEKTUR.md, keine Sackgasse).
        <p className="mt-4 text-sm text-gedaempft">{hinweis}</p>
      )}
    </section>
  );
}
