/**
 * Der Lernweg: Lektionen **und** die Stationen dazwischen (SPEC.md 6.7).
 *
 * Freischaltung nach SPEC.md 6.3: **Ein Stern genügt.** Perfektion darf den
 * Fortschritt nicht blockieren — ein Kind, das in `L03` feststeckt, hört auf.
 *
 * **Stationen halten nie auf.** Zwischenstücke, Modul-Einheiten und Minispiele
 * stehen sichtbar zwischen den Lektionen, aber die nächste Lektion hängt allein
 * an der vorigen. Sie stehen hier, weil ein Menü, in das man erst hineinklicken
 * muss, für die meisten gar nicht existiert.
 */

import type { ReactNode } from 'react';
import { allLessons, getLesson, type Lesson } from '../../lib/curriculum';
import { lernpfad, stationOffen, type Station } from '../../lib/lernpfad';
import { getInterlude } from '../../lib/interludes';
import { getEinheit } from '../../lib/module';
import type { MinispielId } from '../../lib/minispiele';
import type { LessonProgress } from '../../db';
import { de } from '../../i18n/de';

export interface LessonListProps {
  readonly progress: ReadonlyMap<string, LessonProgress>;
  /** IDs der abgeschlossenen Zwischenstücke und Modul-Einheiten. */
  readonly erledigt: ReadonlySet<string>;
  readonly onStart: (lesson: Lesson) => void;
  readonly onZwischenstueck: (unitId: string) => void;
  readonly onModul: (einheitId: string) => void;
  readonly onSpiel: (spiel: MinispielId) => void;
  /**
   * Karten über der Liste: Tagesaufgabe, Begrüßung (SPEC.md 8.6,
   * 8.8). Sie kommen von außen, weil sie an der Datenbank hängen und diese
   * Komponente keine Abfragen kennt (ARCHITEKTUR.md, Architekturregel 3).
   */
  readonly kopfbereich?: ReactNode;
}

export function LessonList({
  progress,
  erledigt,
  onStart,
  onZwischenstueck,
  onModul,
  onSpiel,
  kopfbereich,
}: LessonListProps) {
  const lessons = allLessons();

  /**
   * Eine Lektion ist offen, wenn sie die erste ist oder die davor bestanden
   * wurde. Bewusst hier berechnet und nicht in der Datenbank gespeichert: So
   * kann eine spätere Änderung an der Reihenfolge nichts kaputt machen.
   */
  const istOffen = (lesson: Lesson): boolean => {
    if (lesson.order === 1) return true;
    const davor = lessons.find((l) => l.order === lesson.order - 1);
    return davor ? progress.get(davor.id)?.status === 'passed' : false;
  };

  const offeneLektionen = new Set(lessons.filter(istOffen).map((l) => l.id));

  return (
    <div className="h-full overflow-y-auto p-8">
      <header className="mx-auto mb-6 max-w-4xl">
        <h1 className="text-3xl font-semibold">{de.lernpfad.titel}</h1>
        <p className="mt-1 text-gedaempft">{de.app.untertitel}</p>
      </header>

      {kopfbereich && <div className="mx-auto mb-8 max-w-4xl">{kopfbereich}</div>}

      <ul className="mx-auto grid max-w-4xl gap-3">
        {lernpfad().map((station, i) => (
          <li key={`${station.art}-${i}`}>
            {station.art === 'lektion' ? (
              <Lektionszeile
                lesson={getLesson(station.lessonId)!}
                fortschritt={progress.get(station.lessonId)}
                offen={offeneLektionen.has(station.lessonId)}
                onStart={onStart}
              />
            ) : (
              <Stationszeile
                station={station}
                offen={stationOffen(station, offeneLektionen)}
                erledigt={erledigt}
                onZwischenstueck={onZwischenstueck}
                onModul={onModul}
                onSpiel={onSpiel}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Lektionszeile({
  lesson,
  fortschritt,
  offen,
  onStart,
}: {
  lesson: Lesson;
  fortschritt: LessonProgress | undefined;
  offen: boolean;
  onStart: (lesson: Lesson) => void;
}) {
  return (
    <button
      type="button"
      disabled={!offen}
      onClick={() => onStart(lesson)}
      className={[
        'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors',
        offen
          ? 'border-rand bg-flaeche hover:border-akzent'
          : 'cursor-not-allowed border-rand/50 bg-flaeche/40 opacity-60',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-semibold tabular-nums',
          fortschritt?.status === 'passed' ? 'bg-richtig text-white' : 'bg-grund text-gedaempft',
        ].join(' ')}
      >
        {lesson.order}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{lesson.title}</span>
        <span className="block truncate text-sm text-gedaempft">
          {lesson.review
            ? de.lernpfad.wiederholung
            : lesson.newChars.length > 0
              ? `${de.lernpfad.neueZeichen}: ${lesson.newChars.join(' ')}`
              : lesson.focus}
        </span>
      </span>

      {offen ? (
        <SterneKlein anzahl={fortschritt?.stars ?? 0} />
      ) : (
        <span className="shrink-0 text-sm text-gedaempft">{de.lernpfad.gesperrt}</span>
      )}
    </button>
  );
}

/**
 * Eine Station zwischen zwei Lektionen.
 *
 * Optisch bewusst anders als eine Lektion: eingerückt, gestrichelter Rand,
 * kleiner. Man soll auf einen Blick sehen, dass hier etwas anderes kommt und
 * dass es nicht zum Pflichtweg gehört.
 */
function Stationszeile({
  station,
  offen,
  erledigt,
  onZwischenstueck,
  onModul,
  onSpiel,
}: {
  station: Exclude<Station, { art: 'lektion' }>;
  offen: boolean;
  erledigt: ReadonlySet<string>;
  onZwischenstueck: (unitId: string) => void;
  onModul: (einheitId: string) => void;
  onSpiel: (spiel: MinispielId) => void;
}) {
  const inhalt = beschreibe(station);
  if (!inhalt) return null;

  // Ein Spiel ist nie „erledigt" -- man kann es beliebig oft spielen.
  const gemacht = inhalt.id !== null && erledigt.has(inhalt.id);

  return (
    <div className="pl-10">
      <button
        type="button"
        disabled={!offen}
        onClick={inhalt.oeffnen}
        className={[
          'flex w-full items-center gap-3 rounded-xl border border-dashed p-3 text-left transition-colors',
          offen
            ? gemacht
              ? 'border-richtig/50 bg-richtig/5 hover:border-akzent'
              : 'border-rand bg-flaeche/60 hover:border-akzent'
            : 'cursor-not-allowed border-rand/40 bg-flaeche/20 opacity-50',
        ].join(' ')}
      >
        <Stationssymbol art={station.art} />

        <span className="min-w-0 flex-1">
          <span className="block text-xs uppercase tracking-wide text-gedaempft">
            {inhalt.gattung}
          </span>
          <span className="block font-medium">{inhalt.titel}</span>
        </span>

        <span className="shrink-0 text-sm text-gedaempft">
          {gemacht ? de.lernpfad.stationGemacht : offen ? inhalt.knopf : de.lernpfad.gesperrt}
        </span>
      </button>
    </div>
  );

  function beschreibe(s: Exclude<Station, { art: 'lektion' }>): {
    id: string | null;
    gattung: string;
    titel: string;
    knopf: string;
    oeffnen: () => void;
  } | null {
    if (s.art === 'zwischenstueck') {
      const u = getInterlude(s.unitId);
      if (!u) return null;
      return {
        id: s.unitId,
        gattung: de.lernpfad.stationZwischenstueck,
        titel: u.title,
        knopf: de.lernpfad.stationOeffnen,
        oeffnen: () => onZwischenstueck(s.unitId),
      };
    }
    if (s.art === 'modul') {
      const u = getEinheit(s.einheitId);
      if (!u) return null;
      return {
        id: s.einheitId,
        gattung: de.lernpfad.stationModul,
        titel: u.title,
        knopf: de.lernpfad.stationOeffnen,
        oeffnen: () => onModul(s.einheitId),
      };
    }
    return {
      id: null,
      gattung: de.lernpfad.stationSpiel,
      titel: de.minispiele[s.spiel].titel,
      knopf: de.lernpfad.stationSpielen,
      oeffnen: () => onSpiel(s.spiel),
    };
  }
}

/** Ein kleines Zeichen, das die Art der Station auf einen Blick verrät. */
function Stationssymbol({ art }: { art: 'zwischenstueck' | 'modul' | 'spiel' }) {
  const farbe = art === 'spiel' ? 'bg-korrigiert/20 text-korrigiert' : 'bg-akzent/15 text-akzent';

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${farbe}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {art === 'spiel' ? (
          // Spielwuerfel
          <>
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none" />
          </>
        ) : art === 'zwischenstueck' ? (
          // Gluehbirne
          <>
            <path d="M9 17h6" />
            <path d="M10 20h4" />
            <path d="M12 3a6 6 0 0 0-3 11v3h6v-3a6 6 0 0 0-3-11z" />
          </>
        ) : (
          // Aufgeschlagenes Buch
          <>
            <path d="M3 5h6a3 3 0 0 1 3 3v11a3 3 0 0 0-3-3H3z" />
            <path d="M21 5h-6a3 3 0 0 0-3 3v11a3 3 0 0 1 3-3h6z" />
          </>
        )}
      </svg>
    </span>
  );
}

function SterneKlein({ anzahl }: { anzahl: number }) {
  return (
    <span
      className="flex shrink-0 gap-0.5"
      role="img"
      aria-label={`${anzahl} ${de.auswertung.sterne}`}
    >
      {[1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.4l1.2-6.5L2.5 9.3l6.6-.9z"
            fill={i <= anzahl ? 'rgb(var(--farbe-korrigiert))' : 'rgb(var(--farbe-rand))'}
          />
        </svg>
      ))}
    </span>
  );
}
