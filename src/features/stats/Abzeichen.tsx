/**
 * Die Abzeichen (SPEC.md 8.2).
 *
 * Jedes hat Icon, Titel, Beschreibung und eine kurze Gratulation. Die Texte
 * stehen in `i18n/de.ts`, die Icons hier — sie sind Code, kein Inhalt.
 *
 * **Auch noch nicht verdiente Abzeichen zeigen, wofür es sie gibt.** Eine
 * Galerie voller Fragezeichen motiviert niemanden; sie soll ein Ziel zeigen,
 * kein Rätsel. Verdient wird durch Anstrengung, nicht durch Raten (SPEC.md 8,
 * Leitregel).
 */

import type { BadgeId } from '../../lib/gamification';
import { galerieReihenfolge } from './abzeichenListe';
import { de } from '../../i18n/de';

const REIHENFOLGE = galerieReihenfolge();

export interface AbzeichenGalerieProps {
  /** IDs der bereits vergebenen Abzeichen mit dem Datum. */
  readonly vergeben: ReadonlyMap<string, string>;
  readonly onZurueck: () => void;
}

export function AbzeichenGalerie({ vergeben, onZurueck }: AbzeichenGalerieProps) {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{de.abzeichenGalerie.titel}</h1>
            <p className="mt-1 text-gedaempft">
              {de.abzeichenGalerie.stand(vergeben.size, REIHENFOLGE.length)}
            </p>
          </div>
          <button
            type="button"
            onClick={onZurueck}
            className="rounded-lg border border-rand px-4 py-2 text-gedaempft hover:text-text"
          >
            {de.abzeichenGalerie.zurueck}
          </button>
        </header>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REIHENFOLGE.map((id) => {
            const datum = vergeben.get(id);
            const text = de.abzeichen[id];
            return (
              <li
                key={id}
                className={[
                  'flex gap-3 rounded-xl border p-4',
                  datum ? 'border-korrigiert/50 bg-flaeche' : 'border-rand bg-flaeche/40',
                ].join(' ')}
              >
                <AbzeichenIcon id={id} verdient={datum !== undefined} />
                <div className="min-w-0">
                  <p className={datum ? 'font-semibold' : 'font-semibold text-gedaempft'}>
                    {text.titel}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-gedaempft">{text.beschreibung}</p>
                  <p className="mt-2 text-xs text-gedaempft">
                    {datum
                      ? de.abzeichenGalerie.erhaltenAm(alsDatum(datum))
                      : de.abzeichenGalerie.nochNicht}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** ISO-Zeitstempel als Datum in der Schreibweise nach NORMEN.md 5.1. */
function alsDatum(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const zahl = (n: number): string => String(n).padStart(2, '0');
  return `${zahl(d.getDate())}.${zahl(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const GOLD = '#d8a13a';
const GRAU = 'rgb(var(--farbe-rand))';

/**
 * Das Icon eines Abzeichens.
 *
 * Nicht verdiente Abzeichen erscheinen grau und **nicht** als Fragezeichen:
 * Man soll sehen, was es zu holen gibt.
 */
export function AbzeichenIcon({
  id,
  verdient,
  groesse = 44,
}: {
  id: BadgeId;
  verdient: boolean;
  groesse?: number;
}) {
  const farbe = verdient ? GOLD : GRAU;
  const strich = verdient ? '#fff' : 'rgb(var(--farbe-gedaempft))';

  return (
    <svg
      viewBox="0 0 48 48"
      width={groesse}
      height={groesse}
      className="shrink-0"
      role="img"
      aria-label={de.abzeichen[id].titel}
    >
      {/* Die Plakette, fuer alle gleich. Nur das Zeichen darin wechselt. */}
      <circle cx="24" cy="24" r="21" fill={farbe} />
      <circle cx="24" cy="24" r="17" fill="none" stroke={strich} strokeWidth="1.5" opacity="0.6" />
      <g fill="none" stroke={strich} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <Zeichen id={id} />
      </g>
    </svg>
  );
}

/** Das Innenleben der Plakette. */
function Zeichen({ id }: { id: BadgeId }) {
  switch (id) {
    // Die vier Tastenreihen: eine Reihe Punkte, die betroffene hervorgehoben.
    case 'grundstellung':
      return <Reihen hervor={1} />;
    case 'obere-reihe':
      return <Reihen hervor={0} />;
    case 'untere-reihe':
      return <Reihen hervor={2} />;

    case 'erste-woerter':
      return (
        <>
          <line x1="15" y1="20" x2="33" y2="20" />
          <line x1="15" y1="26" x2="28" y2="26" />
        </>
      );

    case 'grossschreiber':
      // Ein Pfeil nach oben -- das Zeichen der Umschalttaste.
      return (
        <>
          <path d="M 24 15 L 32 24 L 28 24 L 28 32 L 20 32 L 20 24 L 16 24 Z" />
        </>
      );

    case 'zahlenjongleur':
      return (
        <>
          <circle cx="18" cy="20" r="3" />
          <circle cx="24" cy="29" r="3" />
          <circle cx="30" cy="20" r="3" />
        </>
      );

    case 'sonderzeichen-profi':
      // Das At-Zeichen, stark vereinfacht.
      return (
        <>
          <circle cx="24" cy="24" r="5" />
          <path d="M 29 24 L 29 28 Q 34 28 34 22 Q 34 14 24 14 Q 14 14 14 24 Q 14 34 24 34" />
        </>
      );

    case 'blindflug':
      // Ein geschlossenes Auge.
      return (
        <>
          <path d="M 14 26 Q 24 34 34 26" />
          <line x1="17" y1="30" x2="15" y2="33" />
          <line x1="31" y1="30" x2="33" y2="33" />
        </>
      );

    case 'fehlerfrei':
      return <path d="M 15 24 L 22 31 L 34 17" />;

    case 'sprinter':
      return (
        <>
          <path d="M 16 30 L 24 18 L 32 30" />
          <line x1="14" y1="34" x2="34" y2="34" />
        </>
      );

    case 'ausdauer':
      // Eine Uhr.
      return (
        <>
          <circle cx="24" cy="25" r="9" />
          <path d="M 24 20 L 24 25 L 28 27" />
        </>
      );

    case 'woche':
      return <Kalender kreuze={2} />;
    case 'monat':
      return <Kalender kreuze={3} />;

    case 'neugierig':
      // Eine Lupe.
      return (
        <>
          <circle cx="22" cy="22" r="7" />
          <line x1="27" y1="27" x2="33" y2="33" />
        </>
      );

    case 'nicht-reingefallen':
      // Ein Schild.
      return <path d="M 24 14 L 33 18 L 33 26 Q 33 32 24 35 Q 15 32 15 26 L 15 18 Z" />;

    case 'wachsam':
      return (
        <>
          <path d="M 24 14 L 33 18 L 33 26 Q 33 32 24 35 Q 15 32 15 26 L 15 18 Z" />
          <path d="M 19 24 L 23 28 L 30 20" />
        </>
      );

    case 'durchblicker':
      // Ein aufgeschlagenes Buch.
      return (
        <>
          <path d="M 14 18 Q 24 15 24 19 L 24 32 Q 24 28 14 31 Z" />
          <path d="M 34 18 Q 24 15 24 19 L 24 32 Q 24 28 34 31 Z" />
        </>
      );

    case 'zehni-diplom':
      // Eine Urkunde mit Siegel.
      return (
        <>
          <path d="M 15 14 L 31 14 L 31 30 L 15 30 Z" />
          <line x1="19" y1="20" x2="27" y2="20" />
          <line x1="19" y1="24" x2="25" y2="24" />
          <circle cx="30" cy="32" r="4" />
        </>
      );
  }
}

/** Drei Tastenreihen, eine davon hervorgehoben. */
function Reihen({ hervor }: { hervor: 0 | 1 | 2 }) {
  return (
    <>
      {[0, 1, 2].map((reihe) => (
        <line
          key={reihe}
          x1={16}
          y1={18 + reihe * 6}
          x2={32}
          y2={18 + reihe * 6}
          strokeWidth={reihe === hervor ? 4 : 2}
          opacity={reihe === hervor ? 1 : 0.45}
        />
      ))}
    </>
  );
}

/** Ein Kalenderblatt mit abgehakten Tagen. */
function Kalender({ kreuze }: { kreuze: number }) {
  return (
    <>
      <rect x="15" y="16" width="18" height="16" rx="2" />
      <line x1="15" y1="21" x2="33" y2="21" />
      {Array.from({ length: kreuze }, (_, i) => (
        <line key={i} x1={18 + i * 5} y1={26} x2={21 + i * 5} y2={26} strokeWidth="3" />
      ))}
    </>
  );
}
