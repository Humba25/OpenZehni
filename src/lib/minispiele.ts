/**
 * Die beiden Minispiele (SPEC.md 8.10).
 *
 * Die verbindlichen Schranken aus der Spec stecken hier im Code:
 *
 * - **Nur bereits gelernte Zeichen.** Beide Spiele bekommen den Zeichenvorrat
 *   einer Lektion und erzeugen nichts außerhalb davon — dieselbe harte Regel
 *   wie für Übungstexte (6.2).
 * - **Kein Ergebnis fließt in eine Bewertung.** Dieses Modul liefert Zeichen
 *   und Wörter, sonst nichts. Es gibt hier keine Funktion, die eine Punktzahl
 *   nach `sessions`, `lesson_progress` oder `char_stats` tragen könnte.
 * - **Keine Leben, die den Zugang begrenzen** (SPEC.md 8.11). Das ist das
 *   Duolingo-Modell: Herzen alle, Tür zu, komm morgen wieder. So etwas gibt es
 *   hier nicht — jede Runde ist sofort neu startbar, immer.
 *
 *   Drei Fehlversuche **innerhalb** einer Runde sind etwas anderes und seit
 *   dem 2026-09-18 erlaubt (Entscheidung des Nutzers, SPEC.md 8.10). Sie
 *   beenden die Runde, nicht den Zugang.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import daten from '../../content/minispiele.json';
import { getLesson, allLessons } from './curriculum';

export type MinispielId = 'buchstabenregen' | 'wortsalat' | 'elfmeter' | 'pferderennen';

/**
 * Wie lange eine Runde „Wortsalat" dauert.
 *
 * Eine Zeitbegrenzung **innerhalb** eines Minispiels ist ausdrücklich zulässig
 * (SPEC.md 8.10): Es ist keine Übung, die dadurch abgebrochen würde. Nach
 * Ablauf steht das Ergebnis da und ein Knopf zum Neustarten, sonst nichts.
 *
 * **„Buchstabenregen" hat seit dem 2026-09-18 keine Uhr mehr.** Dort endet die
 * Runde an den Fehlversuchen (`REGEN_LEBEN`). Das ist näher an 8.11 als eine
 * Uhr: „Kein Countdown, der eine laufende Übung abbricht."
 */
export const SPIEL_SEKUNDEN = 60;

/**
 * Wie viele Buchstaben unten ankommen dürfen, bevor die Runde vorbei ist.
 *
 * **Kein Verstoß gegen 8.11.** Dort steht „Keine Herzen/Leben, die den *Zugang*
 * begrenzen" — gemeint ist das Modell, bei dem man nach dem dritten Fehler
 * nicht mehr spielen darf. Hier ist die Runde vorbei und die nächste beginnt
 * mit einem Tastendruck.
 *
 * Was ein Spiel braucht, ist ein Ende, das man selbst herbeiführt. Vorher kam
 * es von einer Uhr; jetzt hängt es daran, wie gut man ist.
 */
export const REGEN_LEBEN = 3;

/** Wie lange ein Buchstabe von oben nach unten braucht. */
export const FALLDAUER_MS = 5500;

/** Abstand zwischen zwei neuen Buchstaben. */
export const ABWURF_MS = 900;

/**
 * Wie viele Wörter mindestens zur Verfügung stehen müssen, damit „Wortsalat"
 * angeboten wird.
 *
 * In `L01` sind drei Zeichen gelernt; daraus lässt sich kein Wortspiel bauen.
 * Statt schlechte Runden zu erzeugen, sagt das Spiel dann, dass es noch nicht
 * so weit ist — eine ehrliche Antwort ist besser als eine schlechte Runde.
 */
export const MIN_WOERTER = 12;

const WOERTER: readonly string[] = daten.woerter as readonly string[];

/**
 * Die ganze Wortliste.
 *
 * Sie ist nicht nur Spielmaterial: `drill.ts` streut dieselben Wörter in die
 * Übungen ein. Deshalb muss sie prüfbar sein, und deshalb steht sie hier
 * offen — die Prüfungen laufen in `minispiele.test.ts`.
 */
export function alleSpielWoerter(): readonly string[] {
  return WOERTER;
}

/** Kleiner, reproduzierbarer Zufallsgenerator (mulberry32, wie in `drill.ts`). */
export function createRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --------------------------------------------------------- Buchstabenregen

/**
 * Die Zeichen, die fallen können: der Vorrat der Lektion ohne Leerzeichen und
 * ohne Zeilenschaltung — beides lässt sich nicht als fallender Buchstabe
 * zeigen.
 */
export function regenZeichen(lessonId: string): readonly string[] {
  const lesson = getLesson(lessonId);
  if (!lesson) return [];
  return [...new Set([...lesson.chars])].filter((c) => c !== ' ' && c !== '\n');
}

/** Ein zufälliges Zeichen aus dem Vorrat. */
export function naechstesZeichen(vorrat: readonly string[], rnd: () => number): string | undefined {
  if (vorrat.length === 0) return undefined;
  return vorrat[Math.floor(rnd() * vorrat.length)];
}

// ---------------------------------------------------------------- Wortsalat

/** Die Wörter, die sich mit diesem Zeichenvorrat schreiben lassen. */
export function wortsalatWoerter(lessonId: string): readonly string[] {
  const lesson = getLesson(lessonId);
  if (!lesson) return [];
  const erlaubt = new Set([...lesson.chars]);
  return WOERTER.filter((w) => [...w].every((c) => erlaubt.has(c)));
}

/** Lässt sich „Wortsalat" mit diesem Stand überhaupt sinnvoll spielen? */
export function wortsalatSpielbar(lessonId: string): boolean {
  return wortsalatWoerter(lessonId).length >= MIN_WOERTER;
}

/**
 * Die früheste Lektion, ab der „Wortsalat" genug Wörter hat.
 *
 * Wird der Nutzerin genannt, statt das Spiel wortlos auszugrauen — eine
 * gesperrte Schaltfläche ohne Grund ist eine Sackgasse (ARCHITEKTUR.md).
 */
export function wortsalatAbLektion(lektionen: readonly { id: string }[]): string | undefined {
  return lektionen.find((l) => wortsalatSpielbar(l.id))?.id;
}

/**
 * Verwürfelt ein Wort.
 *
 * Das Ergebnis ist garantiert **verschieden** vom Ausgangswort: Ein
 * „verdrehtes" Wort, das genauso aussieht wie vorher, ist keine Aufgabe.
 * Bei Wörtern aus lauter gleichen Buchstaben ginge das nicht — die gibt es in
 * der Liste nicht, und für den Fall bleibt das Wort eben stehen.
 */
export function verwuerfeln(wort: string, rnd: () => number): string {
  const zeichen = [...wort];
  if (new Set(zeichen).size <= 1) return wort;

  for (let versuch = 0; versuch < 20; versuch++) {
    const misch = [...zeichen];
    for (let i = misch.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [misch[i], misch[j]] = [misch[j]!, misch[i]!];
    }
    const ergebnis = misch.join('');
    if (ergebnis !== wort) return ergebnis;
  }
  return wort;
}

export interface Salatrunde {
  readonly wort: string;
  readonly verdreht: string;
}

/** Eine Folge von Runden für „Wortsalat", reproduzierbar aus der Saat. */
export function salatrunden(lessonId: string, anzahl: number, saat: string): readonly Salatrunde[] {
  const vorrat = wortsalatWoerter(lessonId);
  if (vorrat.length === 0) return [];

  const rnd = createRandom(`wortsalat#${lessonId}#${saat}`);
  const runden: Salatrunde[] = [];
  const schonDa = new Set<string>();

  // Nicht zweimal dasselbe Wort, solange der Vorrat es hergibt.
  for (let i = 0; runden.length < anzahl && i < anzahl * 20; i++) {
    const wort = vorrat[Math.floor(rnd() * vorrat.length)]!;
    if (schonDa.has(wort) && schonDa.size < vorrat.length) continue;
    schonDa.add(wort);
    runden.push({ wort, verdreht: verwuerfeln(wort, rnd) });
  }
  return runden;
}

// ------------------------------------------------- Auswahl des Zeichenvorrats

/**
 * Eine wählbare Tastengruppe für „Buchstabenregen".
 *
 * **Eine Gruppe je Lektion, mit genau deren neuen Tasten.** Nicht je Reihe: Der
 * Nutzer will „ich habe die Lektion mit f und j gemacht, jetzt nur d und k" —
 * und das ist die Einheit, in der er denkt. Eine ganze Reihe wäre dafür zu
 * grob.
 *
 * Die Bezeichnung sind die Zeichen selbst, also `f j`. Das braucht keine
 * Übersetzung und ist für ein Kind unmittelbar zu lesen — anders als `L02`.
 *
 * Lektionen ohne neue **fallende** Zeichen kommen nicht vor: `L05` („Erste
 * echte Wörter") bringt keine neue Taste, und `L20` führt die beiden
 * Umschalttasten ein — die lassen sich nicht als fallender Buchstabe zeigen.
 * Ein Knopf ohne Zeichen dahinter wäre eine Sackgasse.
 */
export interface Zeichengruppe {
  /** Die Lektion, aus der die Tasten stammen. */
  readonly id: string;
  /** Die neuen Tasten dieser Lektion, ohne Leerzeichen. */
  readonly zeichen: readonly string[];
}

/**
 * Welche Gruppen zur Verfügung stehen — eine je Lektion mit neuen Tasten.
 *
 * **Nur bereits Gelerntes** (SPEC.md 8.10, harte Regel aus 6.2): Angeboten wird
 * ausschließlich, was in den übergebenen Lektionen vorkommt.
 */
export function regenGruppen(
  freigeschaltet: readonly { id: string; order: number; newChars: readonly string[] }[],
): readonly Zeichengruppe[] {
  return [...freigeschaltet]
    .sort((a, b) => a.order - b.order)
    .map((l) => ({
      id: l.id,
      // Nur einzelne, fallbare Zeichen. `newChars` enthält bei `L20` die
      // Beschreibungen „Umschalt links" und „Umschalt rechts" — das ist keine
      // Taste, die von oben fallen kann.
      zeichen: [...new Set(l.newChars)].filter(
        (c) => [...c].length === 1 && c !== ' ' && c !== '\n',
      ),
    }))
    .filter((g) => g.zeichen.length > 0);
}

/** Die Gruppen, die bis zu dieser Lektion zur Verfügung stehen. */
export function regenGruppenBis(lessonId: string): readonly Zeichengruppe[] {
  const lesson = getLesson(lessonId);
  if (!lesson) return [];
  return regenGruppen(allLessons().filter((l) => l.order <= lesson.order));
}

/**
 * Die Zeichen der gewählten Gruppen, zusammengelegt.
 *
 * **Mehrfachauswahl ist der Kern der Sache:** „vielleicht nur d k, oder
 * vielleicht d f j k."
 *
 * **Ist nichts gewählt, fällt der volle Vorrat der Lektion** — nicht die Summe
 * der Gruppen. Das ist nicht dasselbe: Die Großbuchstaben haben keine eigene
 * Gruppe, weil `L20` nur die Umschalttasten einführt. Über die Gruppen wären
 * sie also nicht zu erreichen, über den vollen Vorrat schon.
 */
export function regenVorrat(
  lessonId: string,
  gruppen: readonly Zeichengruppe[],
  gewaehlt: ReadonlySet<string>,
): readonly string[] {
  if (gewaehlt.size === 0) return regenZeichen(lessonId);
  const passend = gruppen.filter((g) => gewaehlt.has(g.id));
  return [...new Set(passend.flatMap((g) => [...g.zeichen]))];
}
