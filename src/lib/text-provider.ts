/**
 * Woher der Übungstext einer Lektion kommt.
 *
 * Der Datenfluss steht in SPEC.md 4.1. In M1 ist der Weg kurz, weil es weder
 * KI noch Cache gibt: entweder ein Drilltext aus `drill.ts` oder ein Seed-Text
 * aus der Themendatenbank.
 *
 * **Die Regel, um die sich hier alles dreht** (SPEC.md 9.7): Seed-Texte sind
 * nur in den neun Lektionen erlaubt, deren Zeichenvorrat sich exakt mit ihrer
 * Zeichensatzstufe deckt. In den übrigen sechzehn enthielten sie Zeichen, die
 * dort noch nicht gelernt sind.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import seed from '../../content/topics.seed.json';
import { getLesson, type AgeBand, type CharsetStage } from './curriculum';
import { drillForLesson } from './drill';

/** Altersangabe eines Seed-Textes. `alle` heißt altersneutral (SPEC.md 9.8). */
export type TextAge = AgeBand | 'alle';

interface SeedText {
  readonly charset: string;
  readonly age: string;
  readonly body: string;
}

interface SeedTopic {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly texts: readonly SeedText[];
  readonly facts: readonly string[];
}

const TOPICS: readonly SeedTopic[] = seed.topics as readonly SeedTopic[];

export interface ProvidedText {
  readonly body: string;
  /** Woher der Text stammt. Landet in `sessions.source` (SPEC.md 5). */
  readonly source: 'drill' | 'seed';
  readonly topicId?: string;
}

export function allTopics(): readonly { id: string; label: string; icon: string }[] {
  return TOPICS.map((t) => ({ id: t.id, label: t.label, icon: t.icon }));
}

/**
 * Rückfall zwischen den Altersstufen (SPEC.md 9.8).
 *
 * Ist die passende Zelle leer, wird die **benachbarte** Stufe genommen, danach
 * `alle`. Ein Text wird nie wegen der Altersstufe verweigert — das verstieße
 * gegen „Offline ist der Normalfall".
 */
function ageFallbackOrder(band: AgeBand): readonly TextAge[] {
  switch (band) {
    case 'A1':
      return ['A1', 'A2', 'alle', 'A3'];
    case 'A3':
      return ['A3', 'A2', 'alle', 'A1'];
    default:
      return ['A2', 'A1', 'alle', 'A3'];
  }
}

export interface TextRequest {
  readonly lessonId: string;
  readonly topicId?: string;
  readonly ageBand: AgeBand;
  /** Versuchsnummer. Sorgt dafür, dass nicht immer derselbe Text erscheint. */
  readonly attempt: number;
  /** Problemzeichen aus `char_stats`, höchstens drei (SPEC.md 6.4). */
  readonly emphasize?: readonly string[];
}

/**
 * Liefert den Übungstext für eine Lektion. **Schlägt nie fehl** — notfalls
 * erzeugt `drill.ts` einen, und der kann per Konstruktion immer erzeugt werden.
 */
export function provideText(request: TextRequest): ProvidedText {
  const lesson = getLesson(request.lessonId);
  if (!lesson) {
    throw new Error(`text-provider: Lektion '${request.lessonId}' gibt es nicht.`);
  }

  if (lesson.textSource === 'topic' && request.topicId) {
    const body = pickSeedText(request.topicId, lesson.stage, request.ageBand, request.attempt);
    if (body) return { body, source: 'seed', topicId: request.topicId };
    // Kein passender Seed-Text vorhanden: Der Drill faengt das stumm ab.
    // Die Nutzerin merkt nie, welcher Weg gewonnen hat (SPEC.md 4.1).
  }

  return {
    body: drillForLesson(request.lessonId, request.attempt, request.emphasize ?? []),
    source: 'drill',
  };
}

/**
 * Sucht einen Seed-Text zu (Thema, Zeichensatzstufe, Altersstufe).
 *
 * Die Auswahl ist **deterministisch** über die Versuchsnummer: Beim zweiten
 * Versuch kommt ein anderer Text, aber derselbe zweite Versuch liefert immer
 * denselben. Das braucht der Geisterschreiber (SPEC.md 8.7), und es macht die
 * Auswahl testbar.
 *
 * **Alle Altersstufen bilden einen Vorrat, die eigene zuerst.** Bis zum
 * 2026-09-17 hörte die Suche bei der ersten nicht leeren Stufe auf. Ein
 * achtjähriges Kind hatte damit vier Texte je Lektion und sah beim fünften
 * Versuch denselben wieder — während acht weitere derselben
 * Zeichensatzstufe ungenutzt danebenlagen.
 *
 * Seit die KI-Texte gestrichen sind (SPEC.md 9), ist der Seed die einzige
 * Quelle. Eine Wiederholung ist dann schlimmer als ein Text, der eine Stufe
 * zu lang oder zu kurz ist: Wer denselben Text erneut bekommt, schreibt ihn
 * beim zweiten Mal auswendig ab, statt zu tippen.
 *
 * Die Reihenfolge aus `ageFallbackOrder()` bleibt maßgeblich, deshalb ändert
 * sich an den ersten Versuchen **nichts** — fremde Stufen kommen erst, wenn
 * die eigene aufgebraucht ist. Der Zeichensatz ist dabei nie ein Problem: Alle
 * Texte einer Stufe halten denselben Vorrat ein.
 */
export function pickSeedText(
  topicId: string,
  stage: CharsetStage,
  ageBand: AgeBand,
  attempt: number,
): string | undefined {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) return undefined;

  const vorrat: string[] = [];
  for (const age of ageFallbackOrder(ageBand)) {
    for (const t of topic.texts) {
      if (t.charset === stage && t.age === age) vorrat.push(t.body);
    }
  }
  if (vorrat.length === 0) return undefined;

  const index = ((attempt % vorrat.length) + vorrat.length) % vorrat.length;
  return vorrat[index]!;
}

/**
 * Ein Wissenshäppchen zum Thema für den Auswertungsbildschirm (SPEC.md 9.9).
 *
 * Diese Texte werden **gelesen, nicht getippt** und dürfen deshalb alle Zeichen
 * enthalten.
 */
export function pickFact(topicId: string, attempt: number): string | undefined {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic || topic.facts.length === 0) return undefined;
  const index = ((attempt % topic.facts.length) + topic.facts.length) % topic.facts.length;
  return topic.facts[index];
}

/** Themen, die überhaupt schon Texte haben. Der Rest wartet noch auf Inhalte. */
export function topicsWithContent(): readonly string[] {
  return TOPICS.filter((t) => t.texts.length > 0).map((t) => t.id);
}
