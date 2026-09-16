/**
 * Das Wochenziel (SPEC.md 8.8).
 *
 * Ein größeres Ziel über die Woche, sichtbar als Balken: „5 Lektionen diese
 * Woche". Die Woche läuft **Montag bis Sonntag** nach ISO 8601 — dieselbe
 * Festlegung, die `NORMEN.md` 5 für alle Datumsangaben trifft.
 *
 * **Warum das Ziel gedeckelt steigt:** Ein Ziel, das sich nach jeder guten
 * Woche selbst erhöht, wird irgendwann unerreichbar, und dann motiviert es
 * nicht mehr, sondern entmutigt. Es darf deshalb nie um mehr als eine Einheit
 * über das Ziel der Vorwoche hinausgehen. Nach unten gibt es keine Bremse: Wer
 * eine schwache Woche hatte, bekommt sofort wieder ein erreichbares Ziel.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

/** Kleinstes Wochenziel. Darunter wäre es kein Ziel mehr. */
export const MIN_ZIEL = 3;

/**
 * Größtes Wochenziel. Mehr als zehn Lektionen in einer Woche ist für die
 * Zielgruppe kein Ziel mehr, sondern eine Tretmühle.
 */
export const MAX_ZIEL = 10;

/**
 * Der ISO-Wochenschlüssel zu einem Datum, etwa `2026-W38`.
 *
 * Gerechnet wird über den Donnerstag derselben Woche — das ist die Definition
 * aus ISO 8601 und der einzige Weg, den Jahreswechsel richtig zu treffen: Der
 * 1. Januar 2027 liegt in der Woche `2026-W53`.
 */
export function isoWoche(datum: string | Date): string {
  const d = typeof datum === 'string' ? new Date(`${datum.slice(0, 10)}T00:00:00Z`) : datum;
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const wochentag = t.getUTCDay() === 0 ? 7 : t.getUTCDay(); // Montag = 1, Sonntag = 7
  t.setUTCDate(t.getUTCDate() + 4 - wochentag);
  const jahresanfang = Date.UTC(t.getUTCFullYear(), 0, 1);
  const woche = Math.ceil(((t.getTime() - jahresanfang) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(woche).padStart(2, '0')}`;
}

/** Das ISO-Datum des Montags, an dem die Woche dieses Tages begonnen hat. */
export function montagDerWoche(datum: string | Date): string {
  const d = typeof datum === 'string' ? new Date(`${datum.slice(0, 10)}T00:00:00Z`) : datum;
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const wochentag = t.getUTCDay() === 0 ? 7 : t.getUTCDay();
  t.setUTCDate(t.getUTCDate() - (wochentag - 1));
  return t.toISOString().slice(0, 10);
}

/** Liegen zwei Tage in derselben ISO-Woche? */
export function gleicheWoche(a: string | Date, b: string | Date): boolean {
  return isoWoche(a) === isoWoche(b);
}

/**
 * Das Ziel für eine neue Woche.
 *
 * Grundlage ist, was in der Vorwoche **tatsächlich** geschafft wurde — nicht,
 * was dort als Ziel stand. Wer sein Ziel übertroffen hat, bekommt trotzdem
 * höchstens eine Einheit mehr als beim letzten Mal (SPEC.md 8.8).
 *
 * @param vorwocheGeschafft Bestandene Lektionen der Vorwoche.
 * @param vorwocheZiel      Das Ziel der Vorwoche, `null` in der ersten Woche.
 */
export function zielFuerWoche(vorwocheGeschafft: number, vorwocheZiel: number | null): number {
  if (vorwocheZiel === null) return MIN_ZIEL;
  const obergrenze = Math.min(vorwocheZiel + 1, MAX_ZIEL);
  return Math.min(Math.max(vorwocheGeschafft, MIN_ZIEL), obergrenze);
}

export interface Wochenstand {
  readonly week: string;
  readonly target: number;
  readonly progress: number;
  readonly rewardGiven: boolean;
}

/** Ist das Ziel erreicht? */
export function zielErreicht(stand: Wochenstand): boolean {
  return stand.progress >= stand.target;
}

/**
 * Anteil des Balkens, zwischen 0 und 1.
 *
 * Gedeckelt bei 1: Ein Balken, der über sein Ende hinausläuft, sieht nach
 * Fehler aus, nicht nach Erfolg.
 */
export function balkenAnteil(stand: Wochenstand): number {
  if (stand.target <= 0) return 1;
  return Math.min(1, stand.progress / stand.target);
}

/**
 * Ob es für diese Woche jetzt eine Belohnung gibt (SPEC.md 8.1: 120 XP und ein
 * Deko-Teil). Genau einmal je Woche — `rewardGiven` verhindert die Wiederholung.
 */
export function belohnungFaellig(stand: Wochenstand): boolean {
  return zielErreicht(stand) && !stand.rewardGiven;
}
