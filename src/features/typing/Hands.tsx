/**
 * Handgrafik: zeigt, welcher Finger die nächste Taste anschlägt.
 *
 * `SPEC.md` 7.3: „Die als Nächstes zu tippende Taste pulsiert dezent; **der
 * zuständige Finger wird in der Handgrafik hervorgehoben**." Die Farben kommen
 * aus derselben Quelle wie die der Tastatur (`fingerColors.ts`), sonst zeigt
 * die Hand eine andere Farbe als die Taste.
 *
 * Bewusst **schematisch** gezeichnet, nicht naturalistisch: Ein Kind soll auf
 * einen Blick abzählen können, der wievielte Finger gemeint ist. Eine realistisch
 * gezeichnete Hand mit Schattierungen macht das schwerer, nicht leichter.
 *
 * Die Farbe allein trägt die Information nicht — der Finger bekommt zusätzlich
 * einen dicken Rahmen, und sein Name steht im Klartext daneben (SPEC.md 12.2).
 */

import { fingerFor, oppositeShiftFor, strokeFor, type Finger } from '../../lib/charset';
import { FINGER_COLOR, FINGER_COLOR_IDLE } from './fingerColors';
import { de } from '../../i18n/de';

/** Ein Finger in der Zeichnung: Position, Maße, Neigung. */
interface FingerShape {
  readonly finger: Finger;
  /** Mitte des Fingers auf der x-Achse. */
  readonly x: number;
  /** Länge. Der Mittelfinger ist der längste, der kleine der kürzeste. */
  readonly length: number;
  readonly width: number;
  /** Neigung in Grad. Nur der Daumen steht schräg. */
  readonly tilt?: number;
}

const PALM_TOP = 118;
const FINGER_BOTTOM = PALM_TOP + 6;

/** Linke Hand, von außen nach innen: kleiner Finger bis Zeigefinger, dann Daumen. */
const LEFT_FINGERS: readonly FingerShape[] = [
  { finger: 'leftPinky', x: 22, length: 52, width: 17 },
  { finger: 'leftRing', x: 45, length: 70, width: 18 },
  { finger: 'leftMiddle', x: 68, length: 78, width: 18 },
  { finger: 'leftIndex', x: 91, length: 68, width: 18 },
  { finger: 'thumb', x: 118, length: 44, width: 19, tilt: 38 },
];

/** Rechte Hand, gespiegelt. */
const RIGHT_FINGERS: readonly FingerShape[] = [
  { finger: 'thumb', x: 62, length: 44, width: 19, tilt: -38 },
  { finger: 'rightIndex', x: 89, length: 68, width: 18 },
  { finger: 'rightMiddle', x: 112, length: 78, width: 18 },
  { finger: 'rightRing', x: 135, length: 70, width: 18 },
  { finger: 'rightPinky', x: 158, length: 52, width: 17 },
];

export interface HandsProps {
  /** Das als Nächstes zu tippende Zeichen. */
  readonly nextChar?: string | undefined;
  /** Zusätzlich hervorzuhebende Finger, etwa auf der Erklärseite. */
  readonly alsoHighlight?: readonly Finger[];
  /** Ohne Namen darunter — für die Erklärseite, die ihn selbst schreibt. */
  readonly hideLabel?: boolean;
}

export function Hands({ nextChar, alsoHighlight = [], hideLabel = false }: HandsProps) {
  const zielFinger = nextChar ? fingerFor(nextChar) : undefined;

  // Braucht das Zeichen Umschalt, ist der kleine Finger der **anderen** Hand
  // mit im Spiel. Das ist der haeufigste Anfaengerfehler (DIDAKTIK.md 2.3).
  const umschalt = nextChar ? oppositeShiftFor(nextChar) : undefined;
  const umschaltFinger: Finger | undefined =
    umschalt === 'ShiftLeft' ? 'leftPinky' : umschalt === 'ShiftRight' ? 'rightPinky' : undefined;

  // AltGr liegt rechts neben der Leertaste und wird mit dem rechten Daumen
  // oder Zeigefinger genommen. Zehni zeigt den Daumen, weil er naeher liegt.
  const brauchtAltGr = nextChar ? strokeFor(nextChar)?.modifier === 'altgr' : false;

  const aktiv = new Set<Finger>(alsoHighlight);
  if (zielFinger) aktiv.add(zielFinger);
  if (umschaltFinger) aktiv.add(umschaltFinger);
  if (brauchtAltGr) aktiv.add('thumb');

  return (
    <div>
      <svg
        viewBox="0 0 360 190"
        className="w-full max-w-md"
        role="img"
        aria-label={ariaText(zielFinger)}
      >
        <Hand fingers={LEFT_FINGERS} offsetX={4} aktiv={aktiv} spiegel={false} />
        <Hand fingers={RIGHT_FINGERS} offsetX={176} aktiv={aktiv} spiegel />
      </svg>

      {!hideLabel && zielFinger && (
        <p className="mt-1 text-center">
          <span
            className="inline-block h-3 w-3 rounded-full align-middle"
            style={{ backgroundColor: FINGER_COLOR[zielFinger] }}
            aria-hidden="true"
          />{' '}
          <span className="align-middle font-semibold">{de.tastatur.finger[zielFinger]}</span>
        </p>
      )}
    </div>
  );
}

function ariaText(finger: Finger | undefined): string {
  return finger ? `${de.tastatur.titel}: ${de.tastatur.finger[finger]}` : de.tastatur.titel;
}

function Hand({
  fingers,
  offsetX,
  aktiv,
  spiegel,
}: {
  fingers: readonly FingerShape[];
  offsetX: number;
  aktiv: ReadonlySet<Finger>;
  spiegel: boolean;
}) {
  // Der Daumen der linken Hand und der der rechten sind derselbe Eintrag im
  // Fingersatz ('thumb'), sitzen aber an verschiedenen Stellen. Fuer die
  // Hervorhebung genuegt das: Die Leertaste nimmt man mit dem Daumen, welcher
  // ist Geschmackssache (SPEC.md 6.1).
  return (
    <g transform={`translate(${offsetX}, 0)`}>
      {/* Handflaeche */}
      <rect
        x={spiegel ? 44 : 10}
        y={PALM_TOP}
        width={126}
        height={62}
        rx={26}
        fill="rgb(var(--farbe-flaeche))"
        stroke="rgb(var(--farbe-rand))"
        strokeWidth={2}
      />
      {fingers.map((f) => {
        const an = aktiv.has(f.finger);
        const farbe = an ? FINGER_COLOR[f.finger] : FINGER_COLOR_IDLE;
        const y = FINGER_BOTTOM - f.length;
        return (
          <g
            key={f.finger + f.x}
            transform={f.tilt ? `rotate(${f.tilt}, ${f.x}, ${FINGER_BOTTOM})` : undefined}
          >
            <rect
              x={f.x - f.width / 2}
              y={y}
              width={f.width}
              height={f.length}
              rx={f.width / 2}
              fill={farbe}
              fillOpacity={an ? 1 : 0.45}
              stroke={an ? farbe : 'rgb(var(--farbe-rand))'}
              strokeWidth={an ? 4 : 1.5}
            />
          </g>
        );
      })}
    </g>
  );
}
