/**
 * Ein Zwischenstück im Lernpfad (SPEC.md 6.6).
 *
 * Der Verteiler wählt nach `type` die passende Darstellung. Die drei Fallen
 * liegen in `Fallen.tsx`, weil ihre Abläufe sich stark unterscheiden; Wissens-
 * und Lerneinheiten teilen sich eine Darstellung aus Textblöcken und einer
 * Frage.
 *
 * **Ein Zwischenstück hält nie auf** (SPEC.md 6.6): Überspringen geht immer,
 * und wer überspringt, bekommt es später erneut angeboten.
 */

import { useState } from 'react';
import type { Interlude } from '../../lib/interludes';
import { darfUeberLernenSprechen } from '../../lib/interludes';
import { FalleGewinn, FalleSteckbrief, FalleKleingedrucktes } from './Fallen';
import { de } from '../../i18n/de';

export interface InterludeScreenProps {
  readonly unit: Interlude;
  /** Zahlen der Nutzerin für die datengestützte Einheit. */
  readonly lernzahlen?: Lernzahlen | undefined;
  readonly onFertig: (erkannt: boolean | null) => void;
  readonly onUeberspringen: () => void;
}

/** Echte Zahlen aus den Sitzungen der Nutzerin (MODUL-LERNEN.md 1.1). */
export interface Lernzahlen {
  readonly sitzungen: number;
  readonly ersteStrokesMin: number;
  readonly letzteStrokesMin: number;
}

export function InterludeScreen({
  unit,
  lernzahlen,
  onFertig,
  onUeberspringen,
}: InterludeScreenProps) {
  switch (unit.type) {
    case 'falle-gewinn':
      return <FalleGewinn unit={unit} onFertig={(e) => onFertig(e)} />;
    case 'falle-steckbrief':
      return <FalleSteckbrief unit={unit} onFertig={() => onFertig(null)} />;
    case 'falle-kleingedrucktes':
      return <FalleKleingedrucktes unit={unit} onFertig={(e) => onFertig(e)} />;
    case 'lernen-kurve':
      return (
        <LernkurvenEinheit
          unit={unit}
          {...(lernzahlen ? { lernzahlen } : {})}
          onFertig={() => onFertig(null)}
          onUeberspringen={onUeberspringen}
        />
      );
    default:
      return (
        <TextEinheit
          unit={unit}
          onFertig={() => onFertig(null)}
          onUeberspringen={onUeberspringen}
        />
      );
  }
}

/** Textblöcke, dann eine Frage. Für Wissens- und Lerneinheiten. */
function TextEinheit({
  unit,
  onFertig,
  onUeberspringen,
}: {
  unit: Interlude;
  onFertig: () => void;
  onUeberspringen: () => void;
}) {
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);
  const frage = unit.frage;
  const richtig = frage !== undefined && gewaehlt === frage.richtig;

  return (
    <Rahmen onUeberspringen={onUeberspringen}>
      <h1 className="text-2xl font-semibold">{unit.title}</h1>

      <div className="mt-4 space-y-3">
        {unit.bloecke?.map((b) => (
          <p key={b} className="leading-relaxed">
            {b}
          </p>
        ))}
      </div>

      {frage && (
        <section className="mt-8 rounded-2xl border border-rand bg-grund p-6">
          <p className="text-sm font-semibold text-gedaempft">{de.zwischenstueck.frageTitel}</p>
          <p className="mt-1 text-lg">{frage.text}</p>

          <ul className="mt-4 space-y-2">
            {frage.optionen.map((o, i) => {
              const dieseGewaehlt = gewaehlt === i;
              const dieseRichtig = i === frage.richtig;
              const zeigen = gewaehlt !== null;
              return (
                <li key={o}>
                  <button
                    type="button"
                    disabled={zeigen}
                    onClick={() => setGewaehlt(i)}
                    className={[
                      'w-full rounded-xl border px-4 py-3 text-left transition-colors',
                      !zeigen
                        ? 'border-rand bg-flaeche hover:border-akzent'
                        : dieseRichtig
                          ? 'border-richtig bg-richtig/10 font-semibold'
                          : dieseGewaehlt
                            ? 'border-falsch bg-falsch/10'
                            : 'border-rand bg-flaeche opacity-60',
                    ].join(' ')}
                  >
                    {o}
                  </button>
                </li>
              );
            })}
          </ul>

          {gewaehlt !== null && (
            <div className="mt-4">
              <p className={richtig ? 'font-semibold text-richtig' : 'font-semibold'}>
                {richtig ? de.zwischenstueck.richtig : de.zwischenstueck.nichtGanz}
                {!richtig && (
                  <span className="font-normal text-gedaempft">
                    {' '}
                    {de.zwischenstueck.keineSorge}
                  </span>
                )}
              </p>
              <p className="mt-2 leading-relaxed text-gedaempft">{frage.erklaerung}</p>
            </div>
          )}
        </section>
      )}

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onFertig}
          disabled={frage !== undefined && gewaehlt === null}
          className="rounded-lg bg-akzent px-6 py-3 text-lg font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {de.zwischenstueck.fertig}
        </button>
      </div>
    </Rahmen>
  );
}

/**
 * „Deine eigene Kurve" — die einzige Einheit, die mit echten Zahlen arbeitet.
 *
 * **Unter fünf Sitzungen erscheint die neutrale Fassung** (MODUL-LERNEN.md
 * 1.1, 7). Es wird nie ein Beispielwert als ihr Wert ausgegeben — das ist eine
 * unverhandelbare Regel (ARCHITEKTUR.md).
 */
function LernkurvenEinheit({
  unit,
  lernzahlen,
  onFertig,
  onUeberspringen,
}: {
  unit: Interlude;
  lernzahlen?: Lernzahlen;
  onFertig: () => void;
  onUeberspringen: () => void;
}) {
  const genugDaten = lernzahlen !== undefined && darfUeberLernenSprechen(lernzahlen.sitzungen);

  return (
    <Rahmen onUeberspringen={onUeberspringen}>
      <h1 className="text-2xl font-semibold">{unit.title}</h1>

      <div className="mt-4 space-y-3">
        {unit.bloecke?.map((b) => (
          <p key={b} className="leading-relaxed">
            {b}
          </p>
        ))}
      </div>

      {genugDaten ? (
        <section className="mt-8 rounded-2xl border border-akzent/30 bg-akzent/10 p-6">
          <p className="text-lg">
            {de.lernkurve.satz(
              lernzahlen.sitzungen,
              Math.round(lernzahlen.ersteStrokesMin),
              Math.round(lernzahlen.letzteStrokesMin),
            )}
          </p>
          <p className="mt-3 text-sm text-gedaempft">{unit.erklaerungNachDaten}</p>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-rand bg-grund p-6">
          <p className="leading-relaxed">{unit.neutraleFassung}</p>
        </section>
      )}

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          autoFocus
          onClick={onFertig}
          className="rounded-lg bg-akzent px-6 py-3 text-lg font-semibold text-white hover:opacity-90"
        >
          {de.zwischenstueck.fertig}
        </button>
      </div>
    </Rahmen>
  );
}

function Rahmen({
  children,
  onUeberspringen,
}: {
  children: React.ReactNode;
  onUeberspringen: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-sm text-gedaempft">{de.zwischenstueck.ueberschrift}</p>
          <button
            type="button"
            onClick={onUeberspringen}
            className="text-sm text-gedaempft underline hover:text-text"
            title={de.zwischenstueck.ueberspringenHinweis}
          >
            {de.zwischenstueck.ueberspringen}
          </button>
        </div>
        <div className="rounded-2xl border border-rand bg-flaeche p-8">{children}</div>
      </div>
    </div>
  );
}
