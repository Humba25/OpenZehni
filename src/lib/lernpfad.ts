/**
 * Der Lernweg als Folge von **Stationen** (SPEC.md 6.7).
 *
 * **Warum es das gibt:** Vorher stand auf dem Lernweg eine Liste aus
 * 25 Lektionen, und alles andere — Module, Minispiele — lag hinter einem
 * eigenen Menü. Wer nicht von selbst dort hineinklickt, sieht die halbe App
 * nie. Genau das ist beim ersten Ausprobieren durch fremde Augen aufgefallen.
 *
 * Jetzt liegen die Stationen sichtbar zwischen den Lektionen: erst tippen, dann
 * etwas anderes, dann wieder tippen.
 *
 * **Eine Station hält nie auf.** Die nächste Lektion wird allein durch die
 * vorige freigeschaltet. Dieses Modul kennt deshalb keine Funktion, die aus
 * einer Station eine Bedingung machen könnte — das ist die Zusage aus
 * SPEC.md 8.10 („Ein Minispiel schaltet nie eine Lektion frei") und 6.6
 * („Ein Zwischenstück hält nicht auf").
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import plan from '../../content/lernpfad.json';
import { allLessons } from './curriculum';
import { allInterludes } from './interludes';
import type { MinispielId } from './minispiele';

export type Station =
  | { readonly art: 'lektion'; readonly lessonId: string }
  | { readonly art: 'zwischenstueck'; readonly unitId: string; readonly nachLektion: string }
  | { readonly art: 'modul'; readonly einheitId: string; readonly nachLektion: string }
  | { readonly art: 'spiel'; readonly spiel: MinispielId; readonly nachLektion: string };

interface Planeintrag {
  readonly nachLektion: string;
  readonly art: 'modul' | 'spiel';
  readonly einheit?: string;
  readonly spiel?: MinispielId;
}

const PLAN: readonly Planeintrag[] = plan.stationen as readonly Planeintrag[];

/**
 * Der vollständige Lernweg in der Reihenfolge, in der er angezeigt wird.
 *
 * Nach jeder Lektion kommen erst ihr Zwischenstück (falls eines dort liegt),
 * dann die geplanten Stationen in der Reihenfolge der Datei.
 */
export function lernpfad(): readonly Station[] {
  const stationen: Station[] = [];

  for (const lesson of allLessons()) {
    stationen.push({ art: 'lektion', lessonId: lesson.id });

    const zwischen = allInterludes().find((u) => u.afterLesson === lesson.id);
    if (zwischen) {
      stationen.push({
        art: 'zwischenstueck',
        unitId: zwischen.id,
        nachLektion: lesson.id,
      });
    }

    for (const e of PLAN.filter((p) => p.nachLektion === lesson.id)) {
      if (e.art === 'modul' && e.einheit !== undefined) {
        stationen.push({ art: 'modul', einheitId: e.einheit, nachLektion: lesson.id });
      } else if (e.art === 'spiel' && e.spiel !== undefined) {
        stationen.push({ art: 'spiel', spiel: e.spiel, nachLektion: lesson.id });
      }
    }
  }

  return stationen;
}

/** Die geplanten Stationen, unabhängig vom Lernweg — für Tests und Prüfungen. */
export function geplanteStationen(): readonly Planeintrag[] {
  return PLAN;
}

/**
 * Nach welcher Lektion eine Station liegt. Für die Frage, ob sie schon
 * erreichbar ist: Eine Station ist offen, sobald die Lektion davor offen ist —
 * **nicht** erst, wenn sie bestanden wurde. Wer an einer Lektion hängt, soll
 * trotzdem etwas anderes machen dürfen.
 */
export function stationOffen(station: Station, offeneLektionen: ReadonlySet<string>): boolean {
  if (station.art === 'lektion') return offeneLektionen.has(station.lessonId);
  return offeneLektionen.has(station.nachLektion);
}
