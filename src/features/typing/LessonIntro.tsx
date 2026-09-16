/**
 * Erklärseite vor der Lektion: Welche Tasten kommen neu dazu, und **welcher
 * Finger ist dafür zuständig**?
 *
 * Entstanden aus der Rückmeldung nach der ersten Fassung: Die App zeigte zwar
 * die richtige Taste, sagte aber nirgends, mit welchem Finger man sie nehmen
 * soll. Damit ist der Kern des Zehnfingersystems unerklärt geblieben.
 *
 * Die Zuordnung wird **abgeleitet**, nicht abgeschrieben: `fingerFor()` aus
 * `lib/charset.ts` ist die einzige Quelle (SPEC.md 6.1). Eine zweite Liste
 * hier würde irgendwann von der ersten abweichen.
 *
 * Kein Zwangsdialog: Die Seite lässt sich mit einem Klick oder der Eingabetaste
 * verlassen und hält niemanden auf (ARCHITEKTUR.md, keine Bestrafungsmechanik).
 */

import { useEffect, type ReactNode } from 'react';
import { fingerFor, type Finger } from '../../lib/charset';
import { newCharsOf, type Lesson } from '../../lib/curriculum';
import { Hands } from './Hands';
import { FINGER_COLOR } from './fingerColors';
import { maskottchenFuer } from '../../lib/maskottchen';
import { MaskottchenMitSpruch } from '../mascot/Maskottchen';
import { de } from '../../i18n/de';

export interface LessonIntroProps {
  readonly lesson: Lesson;
  readonly onStart: () => void;
  readonly onBack: () => void;
  /**
   * Blindmodus (SPEC.md 8.1). Hier umschaltbar und nicht erst in der Übung:
   * Wer ihn mitten in der Runde anschaltet, hätte den Bonus für eine Runde
   * bekommen, die er größtenteils mit Tastaturbild getippt hat.
   */
  readonly blind: boolean;
  readonly onBlindUmschalten: (an: boolean) => void;
}

/** Ein neues Zeichen mit dem Finger, der es anschlägt. */
interface NeuesZeichen {
  readonly char: string;
  readonly finger: Finger | undefined;
  readonly anzeige: string;
}

export function LessonIntro({
  lesson,
  onStart,
  onBack,
  blind,
  onBlindUmschalten,
}: LessonIntroProps) {
  // Aus den Zeichen der Lektion, nicht aus dem Feld newChars: In L20 steht
  // dort "Umschalt links/rechts" und damit kein Zeichen (curriculum.ts).
  const neu: NeuesZeichen[] = newCharsOf(lesson.id)
    .filter((c) => c !== ' ')
    // Grossbuchstaben nicht einzeln aufzaehlen - in L20 waeren das dreissig.
    .filter((c) => c === c.toLowerCase())
    .map((char) => ({
      char,
      finger: fingerFor(char),
      anzeige: char,
    }));

  const maus = maskottchenFuer({ art: 'erklaerung' });
  const zeigtGrundstellung = lesson.stage === 'S1';
  const zeigtUmschalt = newCharsOf(lesson.id).some((c) => c !== c.toLowerCase());

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onStart();
      }
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart, onBack]);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-gedaempft">
          {de.lernpfad.lektion} {lesson.order}
        </p>
        <h1 className="text-2xl font-semibold">{lesson.title}</h1>
        <p className="mt-1 text-gedaempft">{lesson.focus}</p>

        {zeigtGrundstellung && (
          <Kasten titel={de.einfuehrung.grundstellungTitel}>
            <p>{de.einfuehrung.grundstellungText}</p>
            <p className="mt-2">{de.einfuehrung.noppenText}</p>
          </Kasten>
        )}

        {zeigtUmschalt && (
          <Kasten titel={de.einfuehrung.umschaltTitel}>
            <p>{de.einfuehrung.umschaltText}</p>
          </Kasten>
        )}

        <section className="mt-6 rounded-2xl border border-rand bg-flaeche p-6">
          <h2 className="font-semibold">{de.einfuehrung.neueTasten}</h2>

          {neu.length === 0 ? (
            <p className="mt-2 text-gedaempft">{de.einfuehrung.neueTastenKeine}</p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-3">
              {neu.map((z) => (
                <li
                  key={z.char}
                  className="flex items-center gap-3 rounded-xl border border-rand px-4 py-3"
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-lg font-tippen text-2xl font-bold text-white"
                    style={{ backgroundColor: z.finger ? FINGER_COLOR[z.finger] : '#888' }}
                  >
                    {z.anzeige}
                  </span>
                  <span>
                    <span className="block text-xs text-gedaempft">
                      {de.einfuehrung.welcherFinger}
                    </span>
                    <span className="font-semibold">
                      {z.finger ? de.tastatur.finger[z.finger] : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex justify-center">
            <Hands
              alsoHighlight={neu.map((z) => z.finger).filter((f): f is Finger => f !== undefined)}
              hideLabel
            />
          </div>
        </section>

        {/* Ein Satz zur Einstimmung (SPEC.md 8.5). Auf dem Übungsbildschirm
            danach erscheint die Maus nicht mehr. */}
        <div className="mt-6">
          <MaskottchenMitSpruch
            zustand={maus.zustand}
            spruch={de.maskottchen.sprueche[maus.spruch]}
            groesse={64}
          />
        </div>

        <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-rand bg-flaeche p-4">
          <input
            type="checkbox"
            checked={blind}
            onChange={(e) => onBlindUmschalten(e.target.checked)}
            className="h-4 w-4 accent-[rgb(var(--farbe-akzent))]"
          />
          <span>
            <span className="font-semibold">{de.blindmodus.titel}</span>
            <span className="ml-2 text-sm text-gedaempft">{de.blindmodus.erklaerung}</span>
          </span>
        </label>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-rand px-4 py-2 text-gedaempft hover:text-text"
          >
            {de.einfuehrung.zurueck}
          </button>
          <div className="text-right">
            <button
              type="button"
              onClick={onStart}
              autoFocus
              className="rounded-lg bg-akzent px-6 py-3 text-lg font-semibold text-white hover:opacity-90"
            >
              {de.einfuehrung.losGehts}
            </button>
            <p className="mt-1 text-xs text-gedaempft">{de.einfuehrung.hinweisWeiter}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kasten({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-akzent/30 bg-akzent/10 p-6">
      <h2 className="font-semibold text-akzent">{titel}</h2>
      <div className="mt-2 leading-relaxed">{children}</div>
    </section>
  );
}
