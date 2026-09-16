/**
 * Welche Abzeichen die Galerie zeigt und in welcher Reihenfolge (SPEC.md 8.2).
 *
 * Getrennt von `Abzeichen.tsx`, weil dort nur Komponenten stehen sollen — eine
 * Datei, die beides mischt, verliert im Entwicklungsmodus das Hot Reload.
 */

import { verdienteAbzeichen, type BadgeId } from '../../lib/gamification';

/** Alle Abzeichen in der Reihenfolge, in der sie üblicherweise fallen. */
const REIHENFOLGE: readonly BadgeId[] = [
  'grundstellung',
  'erste-woerter',
  'obere-reihe',
  'untere-reihe',
  'grossschreiber',
  'zahlenjongleur',
  'sonderzeichen-profi',
  'fehlerfrei',
  'sprinter',
  'blindflug',
  'ausdauer',
  'woche',
  'monat',
  'neugierig',
  'nicht-reingefallen',
  'wachsam',
  'durchblicker',
  'zehni-diplom',
];

export function galerieReihenfolge(): readonly BadgeId[] {
  return REIHENFOLGE;
}

/**
 * Welche Abzeichen kennt die Vergabelogik, die diese Galerie nicht zeigt?
 *
 * Der Wächter gegen ein vergessenes Abzeichen: Kommt in `gamification.ts` eines
 * dazu, ohne dass es hier auftaucht, bekäme das Kind eine Meldung über ein
 * Abzeichen, das es in der Galerie nirgends wiederfindet. Geprüft in
 * `Abzeichen.test.tsx`.
 */
export function fehlendeInGalerie(): readonly string[] {
  const alle = verdienteAbzeichen({
    bestandeneLektionen: new Set(['L04', 'L05', 'L13', 'L19', 'L20', 'L22', 'L23', 'L25']),
    besteStrokesMin: 999,
    jeFehlerfrei: true,
    minutenHeute: 999,
    blindMinuten: 999,
    serieTage: 999,
    themenProbiert: 99,
    diplomBestanden: true,
    fallenErkannt: 3,
    zwischenstueckeFertig: 8,
  });
  const gezeigt = new Set<string>(REIHENFOLGE);
  return alle.filter((id) => !gezeigt.has(id));
}
