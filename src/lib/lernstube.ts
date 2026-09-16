/**
 * Die Lernstube (SPEC.md 8.4).
 *
 * Ein einfacher Raum, der mit erspielten Gegenständen eingerichtet wird. **Rein
 * kosmetisch, kein Spielmechanismus dahinter** — das Ziel ist Wiedererkennung
 * und Besitzgefühl. Deko-Teile schalten nichts frei, geben keine XP und gehen
 * nie wieder verloren.
 *
 * Woher die Teile kommen: eines je erreichtem Level (SPEC.md 8.1) und eines je
 * erreichtem Wochenziel (SPEC.md 8.8).
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import katalog from '../../content/deko.json';

export interface DekoTeil {
  readonly id: string;
  readonly label: string;
  /** Welche SVG-Figur die Komponente zeichnet. */
  readonly form: string;
  /** Position im Raum in Prozent. */
  readonly links: number;
  readonly oben: number;
  /** Breite in Prozent der Raumbreite. */
  readonly groesse: number;
  /** Steht von Anfang an da, ohne dass es erspielt werden müsste. */
  readonly vonAnfangAn?: boolean;
}

const TEILE: readonly DekoTeil[] = katalog.teile as readonly DekoTeil[];

export function alleDekoTeile(): readonly DekoTeil[] {
  return TEILE;
}

/** Wie viele Teile der Raum insgesamt aufnehmen kann. */
export const DEKO_GESAMT = TEILE.length;

export interface Besitzstand {
  /** Erreichtes Level (SPEC.md 8.1). */
  readonly level: number;
  /** Wie oft das Wochenziel schon erreicht wurde (SPEC.md 8.8). */
  readonly wochenziele: number;
}

/**
 * Wie viele Teile verdient sind.
 *
 * Level 1 bringt noch nichts — es ist der Startzustand und keine Leistung.
 * Der Schreibtisch steht trotzdem da; er zählt hier nicht mit, weil er nicht
 * erspielt wurde.
 */
export function verdienteTeile(b: Besitzstand): number {
  return Math.max(0, b.level - 1) + Math.max(0, b.wochenziele);
}

/**
 * Die Teile, die im Raum stehen.
 *
 * Die Reihenfolge des Katalogs ist die Reihenfolge des Freischaltens — so füllt
 * sich der Raum von der Mitte nach außen und sieht in jedem Zwischenstand
 * eingerichtet aus, nicht halbfertig.
 */
export function eingerichteteTeile(b: Besitzstand): readonly DekoTeil[] {
  const verdient = verdienteTeile(b);
  const feste = TEILE.filter((t) => t.vonAnfangAn === true);
  const erspielbar = TEILE.filter((t) => t.vonAnfangAn !== true);
  return [...feste, ...erspielbar.slice(0, verdient)];
}

/**
 * Das Teil, das gerade dazugekommen ist — für die Meldung „Neu in deiner
 * Lernstube". `undefined`, wenn der Raum voll ist.
 */
export function neuesTeil(vorher: Besitzstand, nachher: Besitzstand): DekoTeil | undefined {
  const alt = eingerichteteTeile(vorher);
  const neu = eingerichteteTeile(nachher);
  return neu.length > alt.length ? neu[neu.length - 1] : undefined;
}

/** Ist der Raum vollständig eingerichtet? */
export function raumVoll(b: Besitzstand): boolean {
  return eingerichteteTeile(b).length >= DEKO_GESAMT;
}
