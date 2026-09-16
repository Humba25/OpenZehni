/**
 * Tastaturwissen für T1 nach DIN 2137-1:2023-08.
 *
 * Diese Datei ist die einzige Stelle, an der steht, welche physische Taste
 * welches Zeichen erzeugt und welche Zusatztaste dafür nötig ist. Daraus
 * folgen drei Dinge:
 *
 *   1. die Anschlagzählung in `metrics.ts` (NORMEN.md 4.1),
 *   2. die Tastaturgrafik (SPEC.md 7.3),
 *   3. die Fingerzuordnung (SPEC.md 6.1).
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 *
 * NORMSTATUS — bitte vor dem Ändern lesen:
 * Die **Belegung** ist genormt (DIN 2137-1:2023-08). Die **Fingerzuordnung**
 * ist es nicht; sie ist in allen deutschen Lehrwerken gleich und wird
 * unverändert übernommen (NORMEN.md 3.2). In der Oberfläche darf sie nie als
 * Norm ausgegeben werden.
 */

/** Finger nach SPEC.md 6.1. Englische Bezeichner, deutsche Oberfläche. */
export type Finger =
  | 'leftPinky'
  | 'leftRing'
  | 'leftMiddle'
  | 'leftIndex'
  | 'thumb'
  | 'rightIndex'
  | 'rightMiddle'
  | 'rightRing'
  | 'rightPinky';

/** Tastaturreihe, für die Grafik und für die Lektionsgliederung. */
export type KeyRow = 'number' | 'top' | 'home' | 'bottom' | 'space';

/** Zusatztaste, die für ein Zeichen gedrückt werden muss. */
export type Modifier = 'none' | 'shift' | 'altgr';

/**
 * Eine physische Taste. `code` ist der Wert von `KeyboardEvent.code`, also die
 * physische Position - unabhängig davon, welches Zeichen sie erzeugt
 * (SPEC.md 7.4). Genau deshalb heißt die Taste neben `KeyT` hier `KeyY`,
 * obwohl sie auf T1 ein `z` schreibt.
 */
export interface KeyDefinition {
  readonly code: string;
  readonly base: string;
  readonly shift?: string;
  readonly altgr?: string;
  readonly finger: Finger;
  readonly row: KeyRow;
  /** Tote Taste: erzeugt allein kein Zeichen, sondern wartet auf das nächste. */
  readonly dead?: boolean;
}

/**
 * Die Tastenbelegung T1. Zahlenreihe, drei Buchstabenreihen, Leertaste.
 *
 * Nicht enthalten sind Tasten, die kein Zeichen erzeugen (Umschalt, Strg,
 * Feststell, Pfeile). Sie erscheinen in der Grafik, spielen aber für die
 * Zeichenerzeugung keine Rolle.
 */
export const T1_KEYS: readonly KeyDefinition[] = [
  // Zahlenreihe
  { code: 'Backquote', base: '^', shift: '°', finger: 'leftPinky', row: 'number', dead: true },
  { code: 'Digit1', base: '1', shift: '!', finger: 'leftPinky', row: 'number' },
  { code: 'Digit2', base: '2', shift: '"', altgr: '²', finger: 'leftRing', row: 'number' },
  { code: 'Digit3', base: '3', shift: '§', altgr: '³', finger: 'leftMiddle', row: 'number' },
  { code: 'Digit4', base: '4', shift: '$', finger: 'leftIndex', row: 'number' },
  { code: 'Digit5', base: '5', shift: '%', finger: 'leftIndex', row: 'number' },
  { code: 'Digit6', base: '6', shift: '&', finger: 'rightIndex', row: 'number' },
  { code: 'Digit7', base: '7', shift: '/', altgr: '{', finger: 'rightIndex', row: 'number' },
  { code: 'Digit8', base: '8', shift: '(', altgr: '[', finger: 'rightMiddle', row: 'number' },
  { code: 'Digit9', base: '9', shift: ')', altgr: ']', finger: 'rightRing', row: 'number' },
  { code: 'Digit0', base: '0', shift: '=', altgr: '}', finger: 'rightPinky', row: 'number' },
  { code: 'Minus', base: 'ß', shift: '?', altgr: '\\', finger: 'rightPinky', row: 'number' },
  { code: 'Equal', base: '´', shift: '`', finger: 'rightPinky', row: 'number', dead: true },

  // Obere Buchstabenreihe
  { code: 'KeyQ', base: 'q', shift: 'Q', altgr: '@', finger: 'leftPinky', row: 'top' },
  { code: 'KeyW', base: 'w', shift: 'W', finger: 'leftRing', row: 'top' },
  { code: 'KeyE', base: 'e', shift: 'E', altgr: '€', finger: 'leftMiddle', row: 'top' },
  { code: 'KeyR', base: 'r', shift: 'R', finger: 'leftIndex', row: 'top' },
  { code: 'KeyT', base: 't', shift: 'T', finger: 'leftIndex', row: 'top' },
  // Physisch die Y-Taste, auf T1 schreibt sie z. Das ist der Unterschied
  // zwischen event.code und event.key (SPEC.md 7.4).
  { code: 'KeyY', base: 'z', shift: 'Z', finger: 'rightIndex', row: 'top' },
  { code: 'KeyU', base: 'u', shift: 'U', finger: 'rightIndex', row: 'top' },
  { code: 'KeyI', base: 'i', shift: 'I', finger: 'rightMiddle', row: 'top' },
  { code: 'KeyO', base: 'o', shift: 'O', finger: 'rightRing', row: 'top' },
  { code: 'KeyP', base: 'p', shift: 'P', finger: 'rightPinky', row: 'top' },
  { code: 'BracketLeft', base: 'ü', shift: 'Ü', finger: 'rightPinky', row: 'top' },
  { code: 'BracketRight', base: '+', shift: '*', altgr: '~', finger: 'rightPinky', row: 'top' },

  // Grundreihe
  { code: 'KeyA', base: 'a', shift: 'A', finger: 'leftPinky', row: 'home' },
  { code: 'KeyS', base: 's', shift: 'S', finger: 'leftRing', row: 'home' },
  { code: 'KeyD', base: 'd', shift: 'D', finger: 'leftMiddle', row: 'home' },
  { code: 'KeyF', base: 'f', shift: 'F', finger: 'leftIndex', row: 'home' },
  { code: 'KeyG', base: 'g', shift: 'G', finger: 'leftIndex', row: 'home' },
  { code: 'KeyH', base: 'h', shift: 'H', finger: 'rightIndex', row: 'home' },
  { code: 'KeyJ', base: 'j', shift: 'J', finger: 'rightIndex', row: 'home' },
  { code: 'KeyK', base: 'k', shift: 'K', finger: 'rightMiddle', row: 'home' },
  { code: 'KeyL', base: 'l', shift: 'L', finger: 'rightRing', row: 'home' },
  { code: 'Semicolon', base: 'ö', shift: 'Ö', finger: 'rightPinky', row: 'home' },
  { code: 'Quote', base: 'ä', shift: 'Ä', finger: 'rightPinky', row: 'home' },
  { code: 'Backslash', base: '#', shift: "'", finger: 'rightPinky', row: 'home' },

  // Untere Buchstabenreihe
  { code: 'IntlBackslash', base: '<', shift: '>', altgr: '|', finger: 'leftPinky', row: 'bottom' },
  // Physisch die Z-Taste, auf T1 schreibt sie y.
  { code: 'KeyZ', base: 'y', shift: 'Y', finger: 'leftPinky', row: 'bottom' },
  { code: 'KeyX', base: 'x', shift: 'X', finger: 'leftRing', row: 'bottom' },
  { code: 'KeyC', base: 'c', shift: 'C', finger: 'leftMiddle', row: 'bottom' },
  { code: 'KeyV', base: 'v', shift: 'V', finger: 'leftIndex', row: 'bottom' },
  { code: 'KeyB', base: 'b', shift: 'B', finger: 'leftIndex', row: 'bottom' },
  { code: 'KeyN', base: 'n', shift: 'N', finger: 'rightIndex', row: 'bottom' },
  { code: 'KeyM', base: 'm', shift: 'M', altgr: 'µ', finger: 'rightIndex', row: 'bottom' },
  { code: 'Comma', base: ',', shift: ';', finger: 'rightMiddle', row: 'bottom' },
  { code: 'Period', base: '.', shift: ':', finger: 'rightRing', row: 'bottom' },
  { code: 'Slash', base: '-', shift: '_', finger: 'rightPinky', row: 'bottom' },

  // Leertaste und Zeilenschaltung
  { code: 'Space', base: ' ', finger: 'thumb', row: 'space' },
  { code: 'Enter', base: '\n', finger: 'rightPinky', row: 'home' },
];

/** Wie ein Zeichen auf T1 erzeugt wird. */
export interface KeyStroke {
  readonly key: KeyDefinition;
  readonly modifier: Modifier;
  /**
   * Zeichen, die eine tote Taste benutzen, brauchen anschließend die
   * Leertaste, um als eigenständiges Zeichen zu erscheinen: `^` entsteht aus
   * `^` und Leertaste. Das ist ein zusätzlicher Anschlag.
   */
  readonly needsSpaceAfterDead: boolean;
}

/**
 * Abbildung Zeichen → Tastendruck. Wird einmal beim Laden aufgebaut.
 *
 * Reihenfolge der Einträge ist egal, aber jedes Zeichen darf nur einmal
 * vorkommen - sonst wäre die Anschlagzahl nicht eindeutig. Das prüft der
 * Aufbau unten und wirft sonst sofort beim Start.
 */
const CHAR_TO_STROKE: ReadonlyMap<string, KeyStroke> = (() => {
  const map = new Map<string, KeyStroke>();

  const add = (char: string | undefined, key: KeyDefinition, modifier: Modifier): void => {
    if (char === undefined) return;
    if (map.has(char)) {
      throw new Error(
        `charset.ts: Zeichen '${char}' ist mehrfach belegt (zuletzt ${key.code}/${modifier}). ` +
          'Die Anschlagzahl waere damit nicht eindeutig.',
      );
    }
    map.set(char, { key, modifier, needsSpaceAfterDead: key.dead === true });
  };

  for (const key of T1_KEYS) {
    add(key.base, key, 'none');
    add(key.shift, key, 'shift');
    add(key.altgr, key, 'altgr');
  }
  return map;
})();

/** Wie wird dieses Zeichen auf T1 getippt? `undefined`, wenn es T1 nicht erzeugt. */
export function strokeFor(char: string): KeyStroke | undefined {
  return CHAR_TO_STROKE.get(char);
}

/** Erzeugt T1 dieses Zeichen überhaupt? */
export function isTypable(char: string): boolean {
  return CHAR_TO_STROKE.has(char);
}

/** Welcher Finger ist für dieses Zeichen zuständig? SPEC.md 6.1. */
export function fingerFor(char: string): Finger | undefined {
  return CHAR_TO_STROKE.get(char)?.key.finger;
}

/**
 * Die gegengleiche Umschalttaste zu einem Zeichen.
 *
 * Wer `A` mit dem linken kleinen Finger tippt, nimmt die **rechte**
 * Umschalttaste. Beides mit einer Hand zu greifen ist der hartnäckigste
 * Anfängerfehler überhaupt - deshalb zeigt die Tastaturgrafik immer beide
 * Tasten (SPEC.md 7.3, DIDAKTIK.md 2.3).
 *
 * `undefined`, wenn das Zeichen keine Umschalttaste braucht.
 */
export function oppositeShiftFor(char: string): 'ShiftLeft' | 'ShiftRight' | undefined {
  const stroke = CHAR_TO_STROKE.get(char);
  if (!stroke || stroke.modifier !== 'shift') return undefined;
  const leftFingers: readonly Finger[] = ['leftPinky', 'leftRing', 'leftMiddle', 'leftIndex'];
  return leftFingers.includes(stroke.key.finger) ? 'ShiftRight' : 'ShiftLeft';
}

/** Alle Zeichen, die T1 erzeugen kann. Für Tests und den Validator. */
export function allTypableChars(): readonly string[] {
  return [...CHAR_TO_STROKE.keys()];
}
