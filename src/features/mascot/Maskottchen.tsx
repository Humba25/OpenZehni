/**
 * Zehni, die Maus (SPEC.md 8.5).
 *
 * Eine kleine SVG-Figur mit fünf Zuständen. Keine Bilddatei, keine Animation
 * mit Zeitgeber, keine neue Abhängigkeit — das Maskottchen kostet damit weder
 * Bundlegröße noch Startzeit (Performance-Budget 12.1).
 *
 * **Nie während des Tippens.** Der Übungsbildschirm bindet diese Komponente
 * nicht ein; eine Figur, die neben der Vorlage herumzappelt, kostet genau die
 * Aufmerksamkeit, die zum Tippen gebraucht wird.
 */

import type { MaskottchenZustand } from '../../lib/maskottchen';
import { de } from '../../i18n/de';

export interface MaskottchenProps {
  readonly zustand: MaskottchenZustand;
  /** Kantenlänge in Pixeln. */
  readonly groesse?: number;
}

/** Fellfarben. Grau funktioniert in beiden Farbschemata (SPEC.md 12.2). */
const FELL = '#b9b2ab';
const FELL_DUNKEL = '#8d857d';
const OHR = '#e3b7bd';
const STRICH = '#4a443e';

export function Maskottchen({ zustand, groesse = 96 }: MaskottchenProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={groesse}
      height={groesse}
      role="img"
      aria-label={de.maskottchen.zustand[zustand]}
      className="shrink-0"
    >
      {/* Schwanz */}
      <path
        d="M 72 74 q 18 4 16 -14"
        fill="none"
        stroke={FELL_DUNKEL}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Ohren */}
      <circle cx="28" cy="30" r="13" fill={FELL} />
      <circle cx="28" cy="30" r="7" fill={OHR} />
      <circle cx="72" cy="30" r="13" fill={FELL} />
      <circle cx="72" cy="30" r="7" fill={OHR} />

      {/* Kopf und Körper */}
      <ellipse cx="50" cy="62" rx="30" ry="27" fill={FELL} />
      <ellipse cx="50" cy="70" rx="19" ry="17" fill="#d6d0c9" />

      <Gesicht zustand={zustand} />

      {/* Schnurrhaare */}
      <g stroke={STRICH} strokeWidth="1.4" strokeLinecap="round" opacity="0.7">
        <line x1="44" y1="66" x2="28" y2="62" />
        <line x1="44" y1="68" x2="27" y2="69" />
        <line x1="56" y1="66" x2="72" y2="62" />
        <line x1="56" y1="68" x2="73" y2="69" />
      </g>

      {zustand === 'winkt' && (
        // Die winkende Pfote. Nur in diesem Zustand, sonst haette die Maus
        // dauerhaft einen erhobenen Arm.
        <g>
          <path
            d="M 76 68 q 10 -6 12 -18"
            fill="none"
            stroke={FELL}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx="89" cy="48" r="5" fill={FELL} />
        </g>
      )}

      {zustand === 'schlaeft' && (
        <g fill={STRICH} opacity="0.55" fontSize="11" fontWeight="700">
          <text x="76" y="30">
            z
          </text>
          <text x="84" y="20">
            z
          </text>
        </g>
      )}
    </svg>
  );
}

/** Augen, Nase und Mund — der einzige Teil, der sich je Zustand unterscheidet. */
function Gesicht({ zustand }: { zustand: MaskottchenZustand }) {
  const augen =
    zustand === 'schlaeft' ? (
      // Geschlossene Augen: zwei Boegen, keine Punkte.
      <g fill="none" stroke={STRICH} strokeWidth="2.2" strokeLinecap="round">
        <path d="M 38 58 q 4 4 8 0" />
        <path d="M 54 58 q 4 4 8 0" />
      </g>
    ) : zustand === 'freut-sich' ? (
      <g fill="none" stroke={STRICH} strokeWidth="2.2" strokeLinecap="round">
        <path d="M 38 60 q 4 -5 8 0" />
        <path d="M 54 60 q 4 -5 8 0" />
      </g>
    ) : (
      <g fill={STRICH}>
        <circle cx="42" cy="58" r="3" />
        <circle cx="58" cy="58" r="3" />
        {/* Ein Blick zur Seite reicht, um „denkt" zu zeigen. */}
        {zustand === 'denkt' && (
          <>
            <circle cx="43.5" cy="57" r="1" fill="#fff" />
            <circle cx="59.5" cy="57" r="1" fill="#fff" />
          </>
        )}
      </g>
    );

  const mund =
    zustand === 'freut-sich' ? (
      <path d="M 44 72 q 6 7 12 0" fill="none" stroke={STRICH} strokeWidth="2.2" />
    ) : zustand === 'denkt' ? (
      <line
        x1="46"
        y1="73"
        x2="54"
        y2="73"
        stroke={STRICH}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    ) : (
      <path d="M 45 71 q 5 4 10 0" fill="none" stroke={STRICH} strokeWidth="2" />
    );

  return (
    <g>
      {augen}
      <ellipse cx="50" cy="66" rx="4" ry="3" fill={OHR} stroke={STRICH} strokeWidth="1.2" />
      {mund}
    </g>
  );
}

/**
 * Maskottchen mit Sprechblase. Genau **ein** Satz (SPEC.md 8.5) — die
 * Komponente nimmt deshalb einen String und keine Liste.
 */
export function MaskottchenMitSpruch({
  zustand,
  spruch,
  groesse = 80,
}: {
  zustand: MaskottchenZustand;
  spruch: string;
  groesse?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <Maskottchen zustand={zustand} groesse={groesse} />
      <p className="relative max-w-xs rounded-2xl border border-rand bg-flaeche px-4 py-3 text-sm">
        {spruch}
      </p>
    </div>
  );
}
