/**
 * Die acht Fingerfarben — **eine Quelle für Tastatur und Handgrafik**.
 *
 * `SPEC.md` 7.3 verlangt ausdrücklich: „Farbcodierung nach Finger … Konsistent
 * mit den Farben der Handgrafik." Zwei getrennte Farblisten würden früher oder
 * später auseinanderlaufen, und dann zeigt die Tastatur eine andere Farbe als
 * die Hand — für ein Kind wäre die Zuordnung damit wertlos.
 *
 * Die Töne sind so gewählt, dass sie sich auch bei Rot-Grün-Blindheit in der
 * Helligkeit unterscheiden (SPEC.md 12.2). Verlassen darf sich die Oberfläche
 * darauf trotzdem nicht: Der zuständige Finger wird **zusätzlich** im Klartext
 * benannt, und die Zieltaste bekommt einen Rahmen.
 */

import type { Finger } from '../../lib/charset';

export const FINGER_COLOR: Record<Finger, string> = {
  leftPinky: '#8e6bd6',
  leftRing: '#4b7fd8',
  leftMiddle: '#3fa3a8',
  leftIndex: '#4aa564',
  thumb: '#8a8f98',
  rightIndex: '#c9902f',
  rightMiddle: '#d4703a',
  rightRing: '#cc5566',
  rightPinky: '#a6558f',
};

/** Gedämpfte Farbe für Finger, die gerade nicht gebraucht werden. */
export const FINGER_COLOR_IDLE = '#c3c9d4';
