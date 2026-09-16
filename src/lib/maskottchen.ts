/**
 * Das Maskottchen (SPEC.md 8.5).
 *
 * „Zehni", eine Maus — Anspielung auf Tastatur und Maus. Fünf Zustände:
 * `idle`, `freut-sich`, `denkt`, `winkt`, `schlaeft`.
 *
 * **Es kommentiert sparsam.** Höchstens ein Satz je Auswertungsbildschirm, und
 * **nie während des Tippens**. Deshalb gibt dieses Modul zu jedem Anlass genau
 * eine Spruch-Kennung zurück, nie eine Liste — und es kennt gar keinen Anlass
 * „Übung läuft". Wer dem Übungsbildschirm ein Maskottchen hinzufügen wollte,
 * fände hier nichts, was er dort zeigen könnte. Das ist Absicht: Eine Figur,
 * die neben der Vorlage herumzappelt, kostet genau die Aufmerksamkeit, die
 * zum Tippen gebraucht wird.
 *
 * Die Sätze selbst stehen in `i18n/de.ts` — hier steht nur, **welcher** Satz
 * fällt (ARCHITEKTUR.md, Sprache).
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

export type MaskottchenZustand = 'idle' | 'freut-sich' | 'denkt' | 'winkt' | 'schlaeft';

/** Kennung des Satzes. Der Wortlaut steht in `i18n/de.ts`. */
export type SpruchId =
  | 'willkommen'
  | 'zurueck'
  | 'serie'
  | 'tagesziel'
  | 'erklaerung'
  | 'bestanden'
  | 'volleSterne'
  | 'bestleistung'
  | 'nochmal'
  | 'jagd'
  | 'zwischenstueck';

/**
 * Wann die Maus schläft: Sie schläft, wenn seit dem letzten Üben mehr als ein
 * Tag vergangen ist — nicht als Vorwurf, sondern weil eine schlafende Maus
 * sympathischer ist als eine, die mahnt.
 */
export const SCHLAEFT_AB_TAGEN = 2;

export type Anlass =
  | { readonly art: 'begruessung'; readonly serieTage: number; readonly tageSeitLetztem: number }
  | { readonly art: 'erklaerung' }
  | {
      readonly art: 'auswertung';
      readonly bestanden: boolean;
      readonly sterne: number;
      readonly neueBestleistung: boolean;
      readonly tageszielGeradeErreicht: boolean;
    }
  | { readonly art: 'tastenjagd' }
  | { readonly art: 'zwischenstueck' };

export interface Maskottchen {
  readonly zustand: MaskottchenZustand;
  readonly spruch: SpruchId;
}

/**
 * Was die Maus gerade macht und sagt.
 *
 * Die Reihenfolge der Fälle in der Auswertung ist die Rangfolge dessen, was
 * das Kind hören will: erst die persönliche Bestleistung, dann die vollen
 * Sterne, dann das Bestehen. Ein Satz, nicht drei.
 */
export function maskottchenFuer(anlass: Anlass): Maskottchen {
  switch (anlass.art) {
    case 'begruessung':
      if (anlass.tageSeitLetztem >= SCHLAEFT_AB_TAGEN) {
        return { zustand: 'schlaeft', spruch: 'zurueck' };
      }
      if (anlass.serieTage >= 2) return { zustand: 'freut-sich', spruch: 'serie' };
      return { zustand: 'winkt', spruch: 'willkommen' };

    case 'erklaerung':
      return { zustand: 'denkt', spruch: 'erklaerung' };

    case 'auswertung':
      if (anlass.neueBestleistung) return { zustand: 'freut-sich', spruch: 'bestleistung' };
      if (anlass.sterne >= 3) return { zustand: 'freut-sich', spruch: 'volleSterne' };
      if (anlass.tageszielGeradeErreicht) return { zustand: 'freut-sich', spruch: 'tagesziel' };
      if (anlass.bestanden) return { zustand: 'winkt', spruch: 'bestanden' };
      // Nicht bestanden ist kein Anlass fuer Trauer: Die Maus denkt nach und
      // schlaegt einen zweiten Anlauf vor (ARCHITEKTUR.md, keine Bestrafungsmechanik).
      return { zustand: 'denkt', spruch: 'nochmal' };

    case 'tastenjagd':
      return { zustand: 'denkt', spruch: 'jagd' };

    case 'zwischenstueck':
      return { zustand: 'idle', spruch: 'zwischenstueck' };
  }
}
