/**
 * Erzeugt Übungstexte für Lektionen, deren Zeichenvorrat enger ist als ihre
 * Zeichensatzstufe.
 *
 * **Warum es dieses Modul gibt** (SPEC.md 9.7): Die Zeichensatzstufen `S1`-`S5`
 * fassen ganze Lektionsblöcke zusammen, die harte Regel „kein ungelerntes
 * Zeichen" gilt aber je Lektion. Beides deckt sich nur in neun von 25
 * Lektionen. In `L01` sind `f`, `j` und die Leertaste gelernt - jeder
 * `S1`-Seed-Text bringt zusätzlich `a s d k l ö` mit. Ohne dieses Modul gäbe
 * es dort offline **keinen einzigen zulässigen Übungstext**, und „Offline ist
 * der Normalfall" ist eine unverhandelbare Regel.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import { getLesson, newCharsOf } from './curriculum';
import wortdaten from '../../content/minispiele.json';

const WORTLISTE: readonly string[] = wortdaten.woerter as readonly string[];

/** Vokale des Deutschen. `y` zählt hier nicht mit — es ist zu selten, um Silben zu tragen. */
const VOWELS = new Set([...'aeiouäöü']);

const PUNCTUATION = new Set([...',.-!?;:@/()"\'#+*~<>|']);

/**
 * Zeichen, die im Deutschen nie am Wortanfang stehen.
 *
 * Ein Drill ist zwar sinnfrei, aber er prägt Bewegungsfolgen ein. `ßöt` bringt
 * einem Kind eine Buchstabenfolge bei, die es nie wieder braucht — und
 * nebenbei eine falsche Vorstellung von der Rechtschreibung.
 */
const NEVER_INITIAL = new Set(['ß']);

/**
 * Der Bindestrich verbindet zwei Wortteile, er schließt kein Wort ab.
 * Er wird deshalb nie angehängt, sondern nur zwischen zwei Gruppen gesetzt.
 */
const JOINING_ONLY = new Set(['-']);

export interface DrillOptions {
  /**
   * Echte Wörter, die eingestreut werden dürfen. Leer heißt: reiner
   * Silbendrill, wie in `L01` bis `L06`.
   */
  readonly woerter?: readonly string[] | undefined;
  /** Vollständiger Zeichenvorrat der Lektion. Nichts außerhalb davon wird erzeugt. */
  readonly chars: string;
  /** Zeichen, die diese Lektion neu einführt. Sie machen rund 40 % der Anschläge aus. */
  readonly newChars: readonly string[];
  /** Problemzeichen aus `char_stats`, höchstens drei (SPEC.md 6.4). */
  readonly emphasize?: readonly string[];
  readonly minLength?: number;
  readonly maxLength?: number;
  /** Saat für den Zufallsgenerator. Gleiche Saat, gleicher Text. */
  readonly seed: string;
}

/**
 * Kleiner, schneller Zufallsgenerator (mulberry32).
 *
 * Absichtlich **kein** `Math.random()`: Der Text muss reproduzierbar sein, sonst
 * lassen sich weder Golden Tests schreiben noch der Geisterschreiber (SPEC.md
 * 8.7) über denselben Text laufen.
 */
function createRandom(seed: string): () => number {
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

/** Zieht ein Element gemäß seiner Gewichtung. */
function weightedPick<T>(items: readonly T[], weights: readonly number[], rnd: () => number): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rnd() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

interface Alphabet {
  readonly vowels: readonly string[];
  readonly consonants: readonly string[];
  readonly digits: readonly string[];
  readonly punctuation: readonly string[];
  readonly uppercase: readonly string[];
  readonly hasSpace: boolean;
}

function splitAlphabet(chars: string): Alphabet {
  const vowels: string[] = [];
  const consonants: string[] = [];
  const digits: string[] = [];
  const punctuation: string[] = [];
  const uppercase: string[] = [];
  let hasSpace = false;

  for (const c of new Set([...chars])) {
    if (c === ' ') {
      hasSpace = true;
    } else if (c === '\n') {
      // Zeilenschaltungen setzt der Drill nicht; sie gehoeren zu echten Texten.
    } else if (c >= '0' && c <= '9') {
      digits.push(c);
    } else if (PUNCTUATION.has(c)) {
      punctuation.push(c);
    } else if (c !== c.toLowerCase()) {
      uppercase.push(c);
    } else if (VOWELS.has(c)) {
      vowels.push(c);
    } else {
      consonants.push(c);
    }
  }

  const sort = (a: string[]): string[] => a.sort();
  return {
    vowels: sort(vowels),
    consonants: sort(consonants),
    digits: sort(digits),
    punctuation: sort(punctuation),
    uppercase: sort(uppercase),
    hasSpace,
  };
}

/**
 * Baut die Gewichtung: neue Zeichen und Problemzeichen kommen häufiger vor.
 *
 * Die rund 40 % für neue Zeichen aus SPEC.md 9.7 sind geschätzt (SPEC.md 15.12).
 * Zu hoch wirkt monoton, zu niedrig übt zu wenig.
 */
function weightsFor(
  pool: readonly string[],
  newChars: ReadonlySet<string>,
  emphasize: ReadonlySet<string>,
): number[] {
  return pool.map((c) => {
    let w = 1;
    if (newChars.has(c)) w += 4;
    if (emphasize.has(c)) w += 3;
    return w;
  });
}

/**
 * Erzeugt einen Übungstext, der **ausschließlich** Zeichen aus `chars` enthält.
 *
 * Aufbau: Gruppen von zwei bis fünf Zeichen, durch einzelne Leerzeichen
 * getrennt, Gesamtlänge zwischen `minLength` und `maxLength`.
 *
 * Sobald der Vorrat einen Vokal enthält, entstehen Konsonant-Vokal-Muster —
 * aussprechbare Silben lassen sich als Einheit greifen, Zufallsbuchstaben
 * nicht. `L01` bis `L03` haben **keinen** Vokal (`f j`, dann `d k`, dann `s l`);
 * dort entstehen rhythmische Gruppen wie `fff jjj fjf jfj`. Das ist in
 * Tipptrainern die übliche Form, und der Rhythmus ist dort der Lerngegenstand
 * (DIDAKTIK.md 7.3).
 */
export function generateDrill(options: DrillOptions): string {
  const { chars, seed } = options;
  const minLength = options.minLength ?? 120;
  const maxLength = options.maxLength ?? 200;
  const rnd = createRandom(seed);

  const alphabet = splitAlphabet(chars);
  const newChars = new Set(options.newChars.filter((c) => c.length === 1 && chars.includes(c)));
  const emphasize = new Set((options.emphasize ?? []).filter((c) => chars.includes(c)));

  const letters = [...alphabet.consonants, ...alphabet.vowels];
  if (letters.length === 0 && alphabet.digits.length === 0) {
    throw new Error(
      `drill.generateDrill: Zeichenvorrat '${chars}' enthaelt weder Buchstaben noch Ziffern.`,
    );
  }

  const canJoin = alphabet.punctuation.includes('-');
  const groups: string[] = [];
  let length = 0;

  /*
   * Anteil echter Wörter, sobald welche zur Verfügung stehen.
   *
   * Zwei Fünftel: genug, damit sich die Übung nach Sprache anfühlt, wenig
   * genug, dass die neuen Tasten noch gehäuft vorkommen — darum geht es im
   * Drill (SPEC.md 9.7).
   *
   * Bevorzugt werden Wörter, die eine der neuen Tasten enthalten. Ein Wort
   * ohne die Taste, die gerade geübt wird, trägt zum Zweck der Lektion nichts
   * bei.
   */
  const woerter = options.woerter ?? [];
  const mitNeuen = woerter.filter((w) => [...w].some((c) => newChars.has(c)));
  const wortquelle = mitNeuen.length >= 6 ? mitNeuen : woerter;

  while (length < minLength) {
    let group =
      wortquelle.length > 0 && rnd() < 0.4
        ? wortquelle[Math.floor(rnd() * wortquelle.length)]!
        : buildGroup(alphabet, newChars, emphasize, rnd);
    if (group.length === 0) continue;

    // Der Bindestrich verbindet zwei Wortteile zu einer Zusammensetzung -
    // so kommt er im Deutschen vor, und nur so wird er hier geuebt.
    // Muss vor dem Satzzeichen geschehen, sonst entsteht "iß.-qui".
    if (canJoin && rnd() < 0.12) {
      const second = buildGroup(alphabet, newChars, emphasize, rnd);
      if (second.length > 0) group = `${group}-${second.toLowerCase()}`;
    }
    group = appendPunctuation(group, alphabet, newChars, emphasize, rnd);

    // Plus eins fuer das trennende Leerzeichen, ausser bei der ersten Gruppe.
    const added = group.length + (groups.length === 0 ? 0 : 1);
    if (length + added > maxLength) break;
    groups.push(group);
    length += added;
  }

  // Kann der Vorrat keine Leerzeichen (theoretisch), haengen die Gruppen
  // aneinander. In allen echten Lektionen ist die Leertaste ab L01 dabei.
  return groups.join(alphabet.hasSpace ? ' ' : '');
}

function buildGroup(
  alphabet: Alphabet,
  newChars: ReadonlySet<string>,
  emphasize: ReadonlySet<string>,
  rnd: () => number,
): string {
  // Ziffern bekommen eigene Gruppen, sonst entstehen Gebilde wie "fa3d".
  if (alphabet.digits.length > 0 && rnd() < 0.25) {
    const len = 2 + Math.floor(rnd() * 3);
    const w = weightsFor(alphabet.digits, newChars, emphasize);
    // Keine fuehrende Null - "007" ist keine Zahl, die jemand schreibt.
    const leading = alphabet.digits.filter((d) => d !== '0');
    const lw = weightsFor(leading, newChars, emphasize);
    let s =
      leading.length > 0 ? weightedPick(leading, lw, rnd) : weightedPick(alphabet.digits, w, rnd);
    for (let i = 1; i < len; i++) s += weightedPick(alphabet.digits, w, rnd);
    return s;
  }

  let group =
    alphabet.vowels.length > 0
      ? buildSyllableGroup(alphabet, newChars, emphasize, rnd)
      : buildRhythmGroup(alphabet, newChars, emphasize, rnd);

  // Grossbuchstaben werden am Wortanfang geuebt - genau so kommen sie im
  // echten Text vor, und genau dort sitzt der gegengleiche Umschaltgriff.
  if (alphabet.uppercase.length > 0 && group.length > 0 && rnd() < 0.45) {
    const first = group[0]!;
    const gross = first.toUpperCase();
    if (gross !== first && alphabet.uppercase.includes(gross)) {
      group = gross + group.slice(1);
    }
  }

  return group;
}

/**
 * Satzzeichen hängen hinten an, nie mitten in einer Silbe.
 *
 * Wird **nach** dem Verbinden zweier Wortteile aufgerufen. Andersherum
 * entstünden Gebilde wie `iß.-qui` - ein Punkt vor einem Bindestrich, den es
 * in keinem deutschen Text gibt.
 */
function appendPunctuation(
  group: string,
  alphabet: Alphabet,
  newChars: ReadonlySet<string>,
  emphasize: ReadonlySet<string>,
  rnd: () => number,
): string {
  const trailing = alphabet.punctuation.filter((p) => !JOINING_ONLY.has(p));
  if (trailing.length === 0 || rnd() >= 0.3) return group;
  const w = weightsFor(trailing, newChars, emphasize);
  return group + weightedPick(trailing, w, rnd);
}

/** Konsonant-Vokal-Muster, sobald ein Vokal verfügbar ist. */
function buildSyllableGroup(
  alphabet: Alphabet,
  newChars: ReadonlySet<string>,
  emphasize: ReadonlySet<string>,
  rnd: () => number,
): string {
  const cw = weightsFor(alphabet.consonants, newChars, emphasize);
  const vw = weightsFor(alphabet.vowels, newChars, emphasize);

  // Am Wortanfang faellt weg, was dort im Deutschen nie steht.
  const initialPool = alphabet.consonants.filter((c) => !NEVER_INITIAL.has(c));
  const iw = weightsFor(initialPool, newChars, emphasize);

  const hasU = alphabet.vowels.includes('u');

  // Das q lebt im Deutschen nur als "qu" **vor einem Vokal**. Am Silbenende
  // gibt es es nicht - "Cüqu" oder "oqu" waeren erfundene Wortformen.
  const finalPool = alphabet.consonants.filter((c) => c !== 'q');
  const fw = weightsFor(finalPool, newChars, emphasize);

  /** Silbenanlaut. Liefert mit, ob daraus ein "qu" wurde. */
  const onset = (atStart: boolean): { text: string; isQu: boolean } => {
    const useInitial = atStart && initialPool.length > 0;
    const pool = useInitial ? initialPool : alphabet.consonants;
    const weights = useInitial ? iw : cw;
    if (pool.length === 0) return { text: '', isQu: false };
    const c = weightedPick(pool, weights, rnd);
    if (c === 'q') {
      // Ohne u im Vorrat waere ein q nicht sinnvoll schreibbar.
      return hasU ? { text: 'qu', isQu: true } : { text: '', isQu: false };
    }
    return { text: c, isQu: false };
  };

  /** Silbenauslaut. Nie ein q. */
  const coda = (): string => (finalPool.length > 0 ? weightedPick(finalPool, fw, rnd) : '');

  /** Nach "qu" darf kein weiteres u folgen. */
  const vowel = (afterQu: boolean): string => {
    if (!afterQu) return weightedPick(alphabet.vowels, vw, rnd);
    const pool = alphabet.vowels.filter((v) => v !== 'u');
    if (pool.length === 0) return weightedPick(alphabet.vowels, vw, rnd);
    return weightedPick(pool, weightsFor(pool, newChars, emphasize), rnd);
  };

  // Eine oder zwei Silben je Gruppe.
  const syllables = rnd() < 0.55 ? 1 : 2;
  let s = '';
  for (let i = 0; i < syllables; i++) {
    const atStart = s.length === 0;
    const shape = rnd();
    if (shape < 0.8) {
      const on = onset(atStart);
      s += on.text + vowel(on.isQu);
      // Geschlossene Silbe: Konsonant-Vokal-Konsonant.
      if (shape >= 0.5) s += coda();
    } else {
      s += vowel(false) + coda();
    }
  }
  return s;
}

/**
 * Rhythmische Gruppen für vokallose Vorräte (`L01`-`L03`).
 *
 * Muster wie `fff`, `jjj`, `fjf`, `jfj` - Wiederholung und Wechsel. Genau die
 * Form, die in den mitgelieferten Seed-Drills steht.
 */
function buildRhythmGroup(
  alphabet: Alphabet,
  newChars: ReadonlySet<string>,
  emphasize: ReadonlySet<string>,
  rnd: () => number,
): string {
  const pool = alphabet.consonants;
  if (pool.length === 0) return '';
  const w = weightsFor(pool, newChars, emphasize);
  const a = weightedPick(pool, w, rnd);

  const shape = rnd();
  if (shape < 0.35) {
    // Wiederholung: fff
    return a.repeat(3);
  }
  if (shape < 0.7 && pool.length > 1) {
    // Wechsel: fjf
    let b = weightedPick(pool, w, rnd);
    let guard = 0;
    while (b === a && guard++ < 8) b = weightedPick(pool, w, rnd);
    return a + b + a;
  }
  // Freie Folge aus zwei bis vier Zeichen.
  const len = 2 + Math.floor(rnd() * 3);
  let s = '';
  for (let i = 0; i < len; i++) s += weightedPick(pool, w, rnd);
  return s;
}

/**
 * Bequemer Zugang: Drilltext für eine Lektion.
 *
 * `attempt` geht in die Saat ein - derselbe Versuch ergibt denselben Text,
 * der nächste einen anderen.
 */
export function drillForLesson(
  lessonId: string,
  attempt: number,
  emphasize: readonly string[] = [],
): string {
  const lesson = getLesson(lessonId);
  if (!lesson) throw new Error(`drill.drillForLesson: Lektion '${lessonId}' gibt es nicht.`);

  return generateDrill({
    chars: lesson.chars,
    newChars: newCharsOf(lessonId),
    emphasize: emphasize.slice(0, 3),
    seed: `${lessonId}#${attempt}`,
    woerter: drillWoerter(lesson.chars),
  });
}

/**
 * Wie viele echte Wörter es mindestens geben muss, bevor welche in den Drill
 * kommen.
 *
 * Darunter käme immer dasselbe Wort, und das wäre kein Üben, sondern
 * Auswendiglernen. In `L06` sind es sechs — da bleibt es beim Silbendrill.
 */
export const MIN_DRILLWOERTER = 12;

/**
 * Die echten Wörter, die sich mit diesem Zeichenvorrat schreiben lassen.
 *
 * **Warum das nötig ist.** Der Drill baut aussprechbare Kunstsilben, und das
 * muss er auch: In `L01` gibt es nur `f` und `j`, da ist kein Wort möglich.
 * Er tat es aber **auch dann**, wenn längst echte Wörter möglich gewesen wären
 * — ab `L07` sind es vierzehn, ab `L09` fünfundfünfzig.
 *
 * Der Nutzer hat am 2026-09-18 darauf hingewiesen: Sobald man Wörter schreiben
 * kann, gehören sie in die Übung. Das ist auch fachlich richtig — Tippen lernt
 * man an Wörtern, nicht an Buchstabenfolgen.
 *
 * Unter `MIN_DRILLWOERTER` bleibt es beim reinen Silbendrill.
 *
 * Die Wortliste liegt in `content/minispiele.json`. Sie ist dort entstanden,
 * gehört aber der Sprache und nicht dem Spiel; `wortsalat` benutzt dieselbe.
 */
export function drillWoerter(chars: string): readonly string[] {
  const erlaubt = new Set([...chars]);
  const passend = WORTLISTE.filter((w) => [...w].every((c) => erlaubt.has(c)));
  return passend.length >= MIN_DRILLWOERTER ? passend : [];
}
