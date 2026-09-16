/**
 * Auswertung nach einer Runde (SPEC.md 6.5).
 *
 * **Die wichtigste Regel dieses Bildschirms** (NORMEN.md 4.4.1): In
 * `L01`–`L13` erscheint das Wort „Fehlerquote" nirgends. Dort bewertet die
 * Sicherheit, weil der blockierende Modus die amtliche Fehlerquote strukturell
 * auf 0,00 % zwingt. Beide Zahlen zu zeigen, würde genau die Scheingenauigkeit
 * erzeugen, die der Abschnitt verhindern soll.
 */

import type { ReactNode } from 'react';
import { wordsPerMinute } from '../../lib/metrics';
import { thresholdsFor, type Lesson } from '../../lib/curriculum';
import { vergleich } from '../../lib/geist';
import { levelFortschritt, type BadgeId } from '../../lib/gamification';
import { maskottchenFuer } from '../../lib/maskottchen';
import { AbzeichenIcon } from './Abzeichen';
import { MaskottchenMitSpruch } from '../mascot/Maskottchen';
import type { LessonRunResult } from '../typing/LessonScreen';
import { de } from '../../i18n/de';

/** Was diese Runde eingebracht hat (SPEC.md 8.1, 8.2). */
export interface Belohnung {
  readonly xp: number;
  readonly neueAbzeichen: readonly string[];
  readonly tageszielGeradeErreicht: boolean;
  /** Neues Deko-Teil für die Lernstube, wenn das Wochenziel fiel (SPEC.md 8.8). */
  readonly wochenzielTeil?: string;
  /** XP-Stand nach dieser Runde — für den Fortschrittsbalken (SPEC.md 6.5, Schritt 4). */
  readonly xpGesamt: number;
  /** Das neue Level, falls eines erreicht wurde. */
  readonly levelAufstieg?: number;
}

export interface ResultScreenProps {
  readonly lesson: Lesson;
  readonly result: LessonRunResult;
  readonly fact?: string | undefined;
  readonly bestBefore?: number | null;
  /**
   * Tempo der **letzten** Runde dieser Lektion — nicht der besten. SPEC.md 6.5
   * verlangt den Vergleich zum letzten Mal; der Bestwert steht daneben.
   */
  readonly letzteStrokesMin?: number | null;
  readonly belohnung?: Belohnung;
  /**
   * Das Angebot der Tastenjagd (SPEC.md 8.9), fertig gebaut von außen. Es steht
   * hier, weil es nach der Auswertung kommt — und es ist ein Angebot: Diese
   * Komponente zwingt niemanden hinein.
   */
  readonly jagdangebot?: ReactNode;
  readonly onRepeat: () => void;
  readonly onContinue: () => void;
  readonly hasNext: boolean;
}

export function ResultScreen({
  lesson,
  result,
  fact,
  bestBefore,
  letzteStrokesMin,
  belohnung,
  jagdangebot,
  onRepeat,
  onContinue,
  hasNext,
}: ResultScreenProps) {
  const schwellen = thresholdsFor(lesson.id);
  const bewertetNachSicherheit = schwellen?.kind === 'safety';

  const spruch =
    result.stars === 3
      ? de.auswertung.dreiSterne
      : result.stars === 2
        ? de.auswertung.zweiSterne
        : result.stars === 1
          ? de.auswertung.einStern
          : de.auswertung.keinStern;

  const istBestleistung = bestBefore != null && bestBefore > 0 && result.strokesMin > bestBefore;

  // Das Maskottchen sagt genau einen Satz je Auswertung (SPEC.md 8.5).
  const maus = maskottchenFuer({
    art: 'auswertung',
    bestanden: result.passed,
    sterne: result.stars,
    neueBestleistung: istBestleistung,
    tageszielGeradeErreicht: belohnung?.tageszielGeradeErreicht ?? false,
  });

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-2xl rounded-2xl border border-rand bg-flaeche p-8">
        <p className="text-sm text-gedaempft">
          {de.lernpfad.lektion} {lesson.order} · {lesson.title}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{de.auswertung.titel}</h1>

        <Sterne anzahl={result.stars} />
        <p className="mt-2 text-center text-lg">{spruch}</p>
        {istBestleistung && (
          <p className="mt-1 text-center text-sm font-semibold text-akzent">
            {de.auswertung.bestleistung}
          </p>
        )}

        <div className="mt-6 flex justify-center">
          <MaskottchenMitSpruch
            zustand={maus.zustand}
            spruch={de.maskottchen.sprueche[maus.spruch]}
            groesse={72}
          />
        </div>

        {/* Der Geisterschreiber gewinnt nie lautstark: ein sachlicher Satz,
            keine Wertung, kein Verlust (SPEC.md 8.7). */}
        {result.geistStrokesMin !== null && (
          <p className="mt-4 text-center text-sm text-gedaempft">
            <span className="font-semibold">{de.auswertung.geistTitel}:</span>{' '}
            {
              {
                schneller: de.auswertung.geistSchneller,
                gleichauf: de.auswertung.geistGleichauf,
                langsamer: de.auswertung.geistLangsamer,
              }[vergleich(result.strokesMin, result.geistStrokesMin)]
            }
          </p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4">
          <Kennzahl
            titel={de.auswertung.tempo}
            wert={Math.round(result.strokesMin).toString()}
            einheit={de.auswertung.tempoKurz}
            erklaerung={de.auswertung.tempoEinheit}
            klein={`${Math.round(wordsPerMinute(result.strokesMin))} ${de.auswertung.wpmKurz}`}
          />

          {/* Genau eine der beiden Kennzahlen -- nie beide (NORMEN.md 4.4.1). */}
          {bewertetNachSicherheit ? (
            <Kennzahl
              titel={de.auswertung.sicherheit}
              wert={result.firstTryPct.toFixed(1).replace('.', ',')}
              einheit="%"
              erklaerung={de.auswertung.sicherheitErklaerung}
            />
          ) : (
            <Kennzahl
              titel={de.auswertung.fehlerquote}
              wert={result.errorRate.toFixed(2).replace('.', ',')}
              einheit="%"
              erklaerung={de.auswertung.fehlerquoteErklaerung}
            />
          )}
        </div>

        {belohnung && belohnung.xp > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-akzent px-4 py-1.5 font-semibold text-white">
              {de.belohnung.xpErhalten(belohnung.xp)}
            </span>
            {belohnung.tageszielGeradeErreicht && (
              <span className="rounded-full bg-richtig px-4 py-1.5 font-semibold text-white">
                {de.belohnung.tagesziel}
              </span>
            )}
            {belohnung.wochenzielTeil !== undefined && (
              <span className="rounded-full bg-richtig px-4 py-1.5 font-semibold text-white">
                {de.wochenziel.geschafft}
              </span>
            )}
          </div>
        )}

        {belohnung?.wochenzielTeil !== undefined && (
          <p className="mt-2 text-sm text-gedaempft">
            {de.wochenziel.neuesTeil(belohnung.wochenzielTeil)}
          </p>
        )}

        {/* Schritt 4 aus SPEC.md 6.5: der Fortschrittsbalken. */}
        {belohnung && <Levelbalken belohnung={belohnung} />}

        {/* Schritt 3: der Vergleich zum letzten Mal. */}
        <Vergleich jetzt={result.strokesMin} vorher={letzteStrokesMin ?? null} />

        {belohnung && belohnung.neueAbzeichen.length > 0 && (
          <div className="mt-4 rounded-xl border border-korrigiert/40 bg-korrigiert/10 p-4">
            <p className="text-sm font-semibold text-korrigiert">
              {belohnung.neueAbzeichen.length === 1
                ? de.belohnung.neuesAbzeichen
                : de.belohnung.neueAbzeichen}
            </p>
            <ul className="mt-2 grid gap-2">
              {belohnung.neueAbzeichen.map((id) => {
                const text = de.abzeichen[id as BadgeId];
                return (
                  <li
                    key={id}
                    className="flex items-center gap-3 rounded-lg border border-korrigiert/40 bg-flaeche px-3 py-2"
                  >
                    <AbzeichenIcon id={id as BadgeId} verdient groesse={36} />
                    <span>
                      <span className="block text-sm font-semibold">{text?.titel ?? id}</span>
                      {/* Die kurze Gratulation aus SPEC.md 8.2. */}
                      {text && (
                        <span className="block text-xs text-gedaempft">{text.gratulation}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {fact && (
          <div className="mt-6 rounded-xl bg-akzent/10 p-4">
            <p className="text-sm font-semibold text-akzent">{de.auswertung.wusstestDu}</p>
            <p className="mt-1 text-sm">{fact}</p>
          </div>
        )}

        {jagdangebot && <div className="mt-6">{jagdangebot}</div>}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onRepeat}
            className="rounded-lg border border-rand px-4 py-2 hover:bg-grund"
          >
            {de.auswertung.nochmal}
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-lg bg-akzent px-5 py-2 font-semibold text-white hover:opacity-90"
          >
            {hasNext && result.passed ? de.auswertung.weiter : de.auswertung.zumLernweg}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Der Fortschrittsbalken zum nächsten Level (SPEC.md 6.5, Schritt 4; 8.1). */
function Levelbalken({ belohnung }: { belohnung: Belohnung }) {
  const f = levelFortschritt(belohnung.xpGesamt);
  const fehlend = f.bisZumNaechsten === null ? 0 : Math.max(0, f.bisZumNaechsten - f.imLevel);

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">{de.auswertung.levelBalken(f.level)}</span>
        <span className="text-gedaempft">
          {f.bisZumNaechsten === null
            ? de.auswertung.hoechstesLevel
            : de.auswertung.bisZumNaechsten(fehlend, f.level + 1)}
        </span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-rand/50">
        <div
          className="h-full rounded-full bg-akzent transition-[width] duration-500"
          style={{ width: `${Math.round(f.anteil * 100)}%` }}
          role="progressbar"
          aria-valuenow={Math.round(f.anteil * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={de.kopfzeile.xpTitel}
        />
      </div>
      {belohnung.levelAufstieg !== undefined && (
        <p className="mt-2 text-center font-semibold text-akzent">
          {de.auswertung.levelAufstieg(belohnung.levelAufstieg)}
        </p>
      )}
    </div>
  );
}

/**
 * Der Vergleich zum letzten Mal (SPEC.md 6.5, Schritt 3).
 *
 * Beim ersten Versuch gibt es nichts zu vergleichen — dann steht das auch so
 * da, statt eine Verbesserung um 0 zu behaupten.
 */
function Vergleich({ jetzt, vorher }: { jetzt: number; vorher: number | null }) {
  if (vorher === null || vorher <= 0) {
    return <p className="mt-4 text-center text-sm text-gedaempft">{de.auswertung.erstesMal}</p>;
  }

  const abstand = Math.round(jetzt - vorher);
  const text =
    Math.abs(abstand) <= 2
      ? de.auswertung.vergleichGleich
      : abstand > 0
        ? de.auswertung.vergleichSchneller(abstand)
        : de.auswertung.vergleichLangsamer(Math.abs(abstand));

  return (
    <p className="mt-4 text-center text-sm text-gedaempft">
      <span className="font-semibold">{de.auswertung.vergleichTitel}:</span> {text}
    </p>
  );
}

function Sterne({ anzahl }: { anzahl: number }) {
  return (
    <div
      className="mt-6 flex justify-center gap-2"
      role="img"
      aria-label={`${anzahl} ${de.auswertung.sterne}`}
    >
      {[1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-12 w-12" aria-hidden="true">
          <path
            d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.4l1.2-6.5L2.5 9.3l6.6-.9z"
            fill={i <= anzahl ? 'rgb(var(--farbe-korrigiert))' : 'rgb(var(--farbe-rand))'}
            stroke={i <= anzahl ? 'rgb(var(--farbe-korrigiert))' : 'rgb(var(--farbe-rand))'}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

function Kennzahl({
  titel,
  wert,
  einheit,
  erklaerung,
  klein,
}: {
  titel: string;
  wert: string;
  einheit: string;
  erklaerung: string;
  klein?: string;
}) {
  return (
    <div className="rounded-xl border border-rand p-4">
      <p className="text-sm text-gedaempft">{titel}</p>
      <p className="mt-1">
        <span className="text-4xl font-semibold tabular-nums">{wert}</span>{' '}
        <span className="text-lg text-gedaempft">{einheit}</span>
        {klein && <span className="ml-2 text-sm text-gedaempft">{klein}</span>}
      </p>
      <p className="mt-2 text-xs leading-snug text-gedaempft">{erklaerung}</p>
    </div>
  );
}
