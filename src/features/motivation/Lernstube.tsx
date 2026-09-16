/**
 * Die Lernstube (SPEC.md 8.4).
 *
 * Ein einfacher Raum, der sich mit erspielten Gegenständen füllt. **Rein
 * kosmetisch** — hier hängt kein Spielmechanismus dran, und nichts davon
 * schaltet etwas frei.
 *
 * Umsetzung wie in der Spec vorgegeben: CSS-positionierte SVG-Ebenen, keine
 * Spiel-Engine und keine neue Abhängigkeit (Performance-Budget 12.1).
 */

import { eingerichteteTeile, DEKO_GESAMT, type DekoTeil } from '../../lib/lernstube';
import { Maskottchen } from '../mascot/Maskottchen';
import { de } from '../../i18n/de';

export interface LernstubeProps {
  readonly level: number;
  readonly wochenziele: number;
  readonly onZurueck: () => void;
}

export function Lernstube({ level, wochenziele, onZurueck }: LernstubeProps) {
  const teile = eingerichteteTeile({ level, wochenziele });
  const voll = teile.length >= DEKO_GESAMT;

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-4 p-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">{de.lernstube.titel}</h1>
          <p className="text-sm text-gedaempft">{de.lernstube.erklaerung}</p>
        </div>
        <button
          type="button"
          onClick={onZurueck}
          className="rounded-lg border border-rand px-3 py-1.5 text-sm text-gedaempft hover:text-text"
        >
          {de.lernstube.zurueck}
        </button>
      </header>

      <Raum teile={teile} />

      <p className="text-center text-sm text-gedaempft">
        {voll ? de.lernstube.voll : de.lernstube.stand(teile.length, DEKO_GESAMT)}
      </p>
    </div>
  );
}

/** Wand, Boden und alles, was darin steht. */
function Raum({ teile }: { teile: readonly DekoTeil[] }) {
  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-rand bg-[#f0e7da]">
      {/* Boden: eine hellere Flaeche im unteren Drittel. */}
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[#d9c4a5]" />
      <div className="absolute inset-x-0 bottom-[38%] h-px bg-black/10" />

      {teile.map((t) => (
        <div
          key={t.id}
          className="absolute"
          style={{ left: `${t.links}%`, top: `${t.oben}%`, width: `${t.groesse}%` }}
          title={t.label}
        >
          <DekoFigur form={t.form} label={t.label} />
        </div>
      ))}

      {/* Die Maus wohnt hier. Sie sitzt am Schreibtisch und tut nichts. */}
      <div className="absolute bottom-[6%] left-[46%] w-[14%]">
        <Maskottchen zustand="idle" groesse={64} />
      </div>
    </div>
  );
}

const HOLZ = '#a9784c';
const HOLZ_HELL = '#c89a68';
const GRUEN = '#5f8d4e';
const STOFF = '#7a8db5';
const METALL = '#9aa0a6';
const RAHMEN = '#6b5645';

/**
 * Die Figuren. Bewusst grob: Der Raum wird klein angezeigt, und je weniger
 * Pfade, desto schneller zeichnet ein alter Laptop ihn neu.
 */
function DekoFigur({ form, label }: { form: string; label: string }) {
  const gemeinsam = {
    viewBox: '0 0 100 100',
    className: 'h-auto w-full',
    role: 'img' as const,
    'aria-label': label,
  };

  switch (form) {
    case 'schreibtisch':
      return (
        <svg {...gemeinsam}>
          <rect x="4" y="40" width="92" height="10" rx="3" fill={HOLZ} />
          <rect x="10" y="50" width="8" height="40" fill={HOLZ_HELL} />
          <rect x="82" y="50" width="8" height="40" fill={HOLZ_HELL} />
          <rect x="52" y="50" width="38" height="26" rx="2" fill={HOLZ_HELL} />
          <line x1="52" y1="63" x2="90" y2="63" stroke={RAHMEN} strokeWidth="1.5" />
        </svg>
      );
    case 'stuhl':
      return (
        <svg {...gemeinsam}>
          <rect x="24" y="14" width="52" height="34" rx="6" fill={STOFF} />
          <rect x="20" y="48" width="60" height="10" rx="4" fill={STOFF} />
          <rect x="46" y="58" width="8" height="26" fill={METALL} />
          <rect x="24" y="84" width="52" height="6" rx="3" fill={METALL} />
        </svg>
      );
    case 'lampe':
      return (
        <svg {...gemeinsam}>
          <path d="M 30 34 L 70 34 L 60 8 L 40 8 Z" fill="#e8c15a" />
          <rect x="46" y="34" width="8" height="50" fill={METALL} />
          <ellipse cx="50" cy="88" rx="24" ry="6" fill={METALL} />
        </svg>
      );
    case 'pflanze':
      return (
        <svg {...gemeinsam}>
          <path d="M 50 60 Q 22 44 28 16 Q 52 24 50 60 Z" fill={GRUEN} />
          <path d="M 50 60 Q 78 44 72 16 Q 48 24 50 60 Z" fill="#7cae62" />
          <path d="M 34 66 L 66 66 L 60 92 L 40 92 Z" fill="#b5653f" />
        </svg>
      );
    case 'poster':
      return (
        <svg {...gemeinsam}>
          <rect
            x="8"
            y="8"
            width="84"
            height="84"
            rx="3"
            fill="#f6f1e6"
            stroke={RAHMEN}
            strokeWidth="4"
          />
          <circle cx="50" cy="38" r="16" fill="#e8a33d" />
          <path d="M 16 84 L 40 52 L 62 84 Z" fill={GRUEN} />
        </svg>
      );
    case 'teppich':
      return (
        <svg viewBox="0 0 200 60" className="h-auto w-full" role="img" aria-label={label}>
          <ellipse cx="100" cy="30" rx="96" ry="26" fill="#c96f5a" />
          <ellipse cx="100" cy="30" rx="70" ry="17" fill="#dd8b74" />
          <ellipse cx="100" cy="30" rx="40" ry="9" fill="#c96f5a" />
        </svg>
      );
    case 'regal':
      return (
        <svg {...gemeinsam}>
          <rect x="8" y="10" width="84" height="80" rx="3" fill={HOLZ} />
          <rect x="14" y="16" width="72" height="22" fill="#f0e7da" />
          <rect x="14" y="44" width="72" height="22" fill="#f0e7da" />
          <rect x="18" y="18" width="6" height="18" fill="#c25b5b" />
          <rect x="26" y="20" width="6" height="16" fill={GRUEN} />
          <rect x="34" y="19" width="6" height="17" fill={STOFF} />
          <rect x="18" y="48" width="6" height="16" fill="#e8a33d" />
          <rect x="26" y="46" width="6" height="18" fill="#8c6bb1" />
        </svg>
      );
    case 'buecher':
      return (
        <svg {...gemeinsam}>
          <rect x="16" y="64" width="68" height="12" rx="2" fill="#c25b5b" />
          <rect x="20" y="50" width="60" height="12" rx="2" fill={GRUEN} />
          <rect x="26" y="36" width="48" height="12" rx="2" fill={STOFF} />
        </svg>
      );
    case 'becher':
      return (
        <svg {...gemeinsam}>
          <path
            d="M 26 30 L 74 30 L 68 84 L 32 84 Z"
            fill="#f0f0ef"
            stroke={METALL}
            strokeWidth="3"
          />
          <path d="M 74 42 q 16 8 0 22" fill="none" stroke={METALL} strokeWidth="5" />
        </svg>
      );
    case 'wanduhr':
      return (
        <svg {...gemeinsam}>
          <circle cx="50" cy="50" r="42" fill="#f6f1e6" stroke={RAHMEN} strokeWidth="6" />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="24"
            stroke={RAHMEN}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="50"
            x2="70"
            y2="58"
            stroke={RAHMEN}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'kaktus':
      return (
        <svg {...gemeinsam}>
          <rect x="40" y="22" width="20" height="50" rx="10" fill={GRUEN} />
          <rect x="16" y="38" width="14" height="26" rx="7" fill={GRUEN} />
          <rect x="24" y="38" width="20" height="10" fill={GRUEN} />
          <path d="M 32 72 L 68 72 L 62 94 L 38 94 Z" fill="#d99a5b" />
        </svg>
      );
    case 'bilderrahmen':
      return (
        <svg {...gemeinsam}>
          <rect x="10" y="18" width="80" height="64" rx="3" fill={RAHMEN} />
          <rect x="18" y="26" width="64" height="48" fill="#f6f1e6" />
          <circle cx="40" cy="46" r="8" fill="#e8a33d" />
          <circle cx="60" cy="52" r="11" fill={STOFF} />
        </svg>
      );
    case 'lichterkette':
      return (
        <svg viewBox="0 0 300 40" className="h-auto w-full" role="img" aria-label={label}>
          <path
            d="M 0 6 Q 75 34 150 6 Q 225 34 300 6"
            fill="none"
            stroke={RAHMEN}
            strokeWidth="2"
          />
          {[30, 75, 120, 150, 180, 225, 270].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 === 0 ? 22 : 18} r="6" fill="#f2c14e" />
          ))}
        </svg>
      );
    case 'koerbchen':
      return (
        <svg {...gemeinsam}>
          <path d="M 12 46 L 88 46 L 78 88 L 22 88 Z" fill="#d9a05b" />
          <ellipse cx="50" cy="46" rx="38" ry="10" fill="#e8bd80" />
          <ellipse cx="50" cy="50" rx="28" ry="7" fill={STOFF} />
        </svg>
      );
    case 'fenster':
      return (
        <svg {...gemeinsam}>
          <rect
            x="8"
            y="8"
            width="84"
            height="84"
            rx="3"
            fill="#bcd8e8"
            stroke={RAHMEN}
            strokeWidth="6"
          />
          <line x1="50" y1="8" x2="50" y2="92" stroke={RAHMEN} strokeWidth="5" />
          <line x1="8" y1="50" x2="92" y2="50" stroke={RAHMEN} strokeWidth="5" />
          <circle cx="70" cy="28" r="8" fill="#f2c14e" />
        </svg>
      );
    case 'urkunde':
      return (
        <svg {...gemeinsam}>
          <rect
            x="14"
            y="10"
            width="72"
            height="72"
            rx="3"
            fill="#f9f4e8"
            stroke={RAHMEN}
            strokeWidth="4"
          />
          <line x1="26" y1="30" x2="74" y2="30" stroke={METALL} strokeWidth="3" />
          <line x1="26" y1="42" x2="74" y2="42" stroke={METALL} strokeWidth="3" />
          <line x1="26" y1="54" x2="56" y2="54" stroke={METALL} strokeWidth="3" />
          <circle cx="70" cy="66" r="9" fill="#e8a33d" />
        </svg>
      );
    default:
      // Unbekannte Form: lieber nichts zeichnen als ein Fragezeichen zeigen.
      return null;
  }
}
