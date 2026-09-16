/**
 * Tastaturgrafik T1 nach DIN 2137-1:2023-08 (SPEC.md 7.3).
 *
 * **Kein US-Layout mit deutschen Beschriftungen** (ARCHITEKTUR.md). Die Belegung
 * kommt vollständig aus `lib/charset.ts`; diese Komponente zeichnet nur.
 *
 * Bei einem Zeichen, das Umschalt braucht, wird **die gegengleiche
 * Umschalttaste mit hervorgehoben**. Beides mit einer Hand zu greifen ist der
 * hartnäckigste Anfängerfehler (DIDAKTIK.md 2.3).
 */

import { useMemo } from 'react';
import {
  T1_KEYS,
  strokeFor,
  oppositeShiftFor,
  type Finger,
  type KeyDefinition,
} from '../../lib/charset';
import { FINGER_COLOR } from './fingerColors';
import { de } from '../../i18n/de';

// Die Fingerfarben stehen an einer Stelle, damit Tastatur und Handgrafik nie
// auseinanderlaufen (SPEC.md 7.3).

const UNIT = 44;
const GAP = 4;

interface PlacedKey {
  readonly def: KeyDefinition | null;
  /** Beschriftung für Tasten ohne Zeichen (Umschalt, Rücktaste …). */
  readonly label?: string;
  readonly code: string;
  readonly width: number;
  readonly finger: Finger;
}

/**
 * Die Reihen der Tastatur in ihrer physischen Anordnung.
 *
 * Tasten ohne Zeichen (Umschalt, Rücktaste, Eingabe, Feststell) stehen hier
 * mit Beschriftung, weil sie in der Grafik sichtbar sein müssen — sie erzeugen
 * aber kein Zeichen und stehen deshalb nicht in `T1_KEYS`.
 */
function useRows(): readonly (readonly PlacedKey[])[] {
  return useMemo(() => {
    const byCode = new Map(T1_KEYS.map((k) => [k.code, k]));
    const k = (code: string, width = 1): PlacedKey => {
      const def = byCode.get(code) ?? null;
      return { def, code, width, finger: def?.finger ?? 'leftPinky' };
    };
    const special = (code: string, label: string, width: number, finger: Finger): PlacedKey => ({
      def: null,
      label,
      code,
      width,
      finger,
    });

    return [
      [
        k('Backquote'),
        k('Digit1'),
        k('Digit2'),
        k('Digit3'),
        k('Digit4'),
        k('Digit5'),
        k('Digit6'),
        k('Digit7'),
        k('Digit8'),
        k('Digit9'),
        k('Digit0'),
        k('Minus'),
        k('Equal'),
        special('Backspace', de.tastatur.rueck, 2, 'rightPinky'),
      ],
      [
        special('Tab', 'Tab', 1.5, 'leftPinky'),
        k('KeyQ'),
        k('KeyW'),
        k('KeyE'),
        k('KeyR'),
        k('KeyT'),
        k('KeyY'),
        k('KeyU'),
        k('KeyI'),
        k('KeyO'),
        k('KeyP'),
        k('BracketLeft'),
        k('BracketRight'),
      ],
      [
        special('CapsLock', 'Feststell', 1.8, 'leftPinky'),
        k('KeyA'),
        k('KeyS'),
        k('KeyD'),
        k('KeyF'),
        k('KeyG'),
        k('KeyH'),
        k('KeyJ'),
        k('KeyK'),
        k('KeyL'),
        k('Semicolon'),
        k('Quote'),
        k('Backslash'),
        special('Enter', de.tastatur.eingabe, 1.7, 'rightPinky'),
      ],
      [
        special('ShiftLeft', de.tastatur.umschalt, 1.3, 'leftPinky'),
        k('IntlBackslash'),
        k('KeyZ'),
        k('KeyX'),
        k('KeyC'),
        k('KeyV'),
        k('KeyB'),
        k('KeyN'),
        k('KeyM'),
        k('Comma'),
        k('Period'),
        k('Slash'),
        special('ShiftRight', de.tastatur.umschalt, 2.7, 'rightPinky'),
      ],
      [
        // Die unterste Reihe erzeugt keine Zeichen, muss aber da sein: AltGr
        // wird fuer das at-Zeichen gebraucht (L23) und soll dann aufleuchten.
        special('ControlLeft', 'Strg', 1.5, 'leftPinky'),
        special('MetaLeft', 'Win', 1.2, 'leftPinky'),
        special('AltLeft', 'Alt', 1.2, 'leftIndex'),
        special('Space', de.tastatur.leertaste, 6.4, 'thumb'),
        special('AltRight', 'AltGr', 1.2, 'rightIndex'),
        special('MetaRight', 'Win', 1.2, 'rightPinky'),
        special('ControlRight', 'Strg', 1.5, 'rightPinky'),
      ],
    ];
  }, []);
}

export interface KeyboardProps {
  /** Das als Nächstes zu tippende Zeichen. */
  readonly nextChar?: string | undefined;
  /** Nach einem Fehlgriff: die richtige Taste deutlich zeigen. */
  readonly showHint?: boolean;
  /** Fingerfarben ausblenden (für Fortgeschrittene, SPEC.md 7.3). */
  readonly plain?: boolean;
}

export function Keyboard({ nextChar, showHint = false, plain = false }: KeyboardProps) {
  const rows = useRows();

  const stroke = nextChar ? strokeFor(nextChar) : undefined;
  const zielCode = stroke?.key.code;
  const umschaltCode = nextChar ? oppositeShiftFor(nextChar) : undefined;
  const brauchtAltGr = stroke?.modifier === 'altgr';

  const breite = Math.max(...rows.map((r) => r.reduce((s, key) => s + key.width * UNIT + GAP, 0)));
  const hoehe = rows.length * (UNIT + GAP);

  return (
    <div className="select-none">
      <svg
        viewBox={`0 0 ${breite} ${hoehe}`}
        className="w-full"
        role="img"
        aria-label={de.tastatur.titel}
      >
        {rows.map((row, rowIndex) => {
          let x = 0;
          return (
            <g key={rowIndex} transform={`translate(0, ${rowIndex * (UNIT + GAP)})`}>
              {row.map((key) => {
                const w = key.width * UNIT;
                const meinX = x;
                x += w + GAP;

                const istZiel = key.code === zielCode;
                const istUmschalt = key.code === umschaltCode;
                const istAltGr = brauchtAltGr && key.code === 'AltRight';
                const hervorgehoben = istZiel || istUmschalt || istAltGr;

                const farbe = plain ? '#9aa3b2' : FINGER_COLOR[key.finger];

                return (
                  <g key={key.code}>
                    <rect
                      x={meinX}
                      y={0}
                      width={w}
                      height={UNIT}
                      rx={6}
                      className="transition-colors"
                      fill={hervorgehoben ? farbe : 'rgb(var(--farbe-flaeche))'}
                      stroke={hervorgehoben ? farbe : 'rgb(var(--farbe-rand))'}
                      strokeWidth={hervorgehoben ? 3 : 1.5}
                      opacity={hervorgehoben ? 1 : 0.95}
                    />
                    {/* Ein schmaler Fingerstreifen am unteren Rand: Er zeigt die
                        Fingerzuordnung, ohne die Beschriftung zu ueberdecken. */}
                    {!plain && (
                      <rect
                        x={meinX + 4}
                        y={UNIT - 5}
                        width={w - 8}
                        height={3}
                        rx={1.5}
                        fill={farbe}
                        opacity={hervorgehoben ? 0 : 0.55}
                      />
                    )}
                    <KeyLabel
                      x={meinX}
                      width={w}
                      def={key.def}
                      label={key.label}
                      hervorgehoben={hervorgehoben}
                    />
                    {/* Der Ring macht die Zieltaste auch ohne Farbe erkennbar. */}
                    {istZiel && showHint && (
                      <rect
                        x={meinX - 2}
                        y={-2}
                        width={w + 4}
                        height={UNIT + 4}
                        rx={8}
                        fill="none"
                        stroke="rgb(var(--farbe-akzent))"
                        strokeWidth={3}
                      />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {umschaltCode && (
        <p className="mt-2 text-center text-sm font-semibold text-akzent">
          {de.tastatur.umschaltHinweis}
        </p>
      )}
    </div>
  );
}

function KeyLabel({
  x,
  width,
  def,
  label,
  hervorgehoben,
}: {
  x: number;
  width: number;
  def: KeyDefinition | null;
  label?: string | undefined;
  hervorgehoben: boolean;
}) {
  const farbe = hervorgehoben ? '#ffffff' : 'rgb(var(--farbe-text))';

  if (!def) {
    return (
      <text
        x={x + width / 2}
        y={UNIT / 2 + 4}
        textAnchor="middle"
        fontSize={11}
        fill={farbe}
        className="font-lesen"
      >
        {label}
      </text>
    );
  }

  // Leertaste und Eingabe haben kein sinnvolles Zeichen zum Anzeigen.
  if (def.base === ' ' || def.base === '\n') {
    return (
      <text x={x + width / 2} y={UNIT / 2 + 4} textAnchor="middle" fontSize={11} fill={farbe}>
        {def.base === ' ' ? de.tastatur.leertaste : de.tastatur.eingabe}
      </text>
    );
  }

  const hatZweiteBelegung = def.shift !== undefined && def.shift !== def.base.toUpperCase();

  return (
    <>
      {hatZweiteBelegung && (
        <text
          x={x + width / 2}
          y={16}
          textAnchor="middle"
          fontSize={11}
          fill={farbe}
          opacity={0.75}
        >
          {def.shift}
        </text>
      )}
      <text
        x={x + width / 2}
        y={hatZweiteBelegung ? UNIT - 12 : UNIT / 2 + 5}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fill={farbe}
      >
        {def.base}
      </text>
      {def.altgr && (
        <text
          x={x + width - 7}
          y={UNIT - 8}
          textAnchor="end"
          fontSize={9}
          fill={farbe}
          opacity={0.6}
        >
          {def.altgr}
        </text>
      )}
    </>
  );
}
