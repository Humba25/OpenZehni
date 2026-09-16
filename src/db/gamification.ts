/**
 * Datenbankzugriff für Onboarding, XP, Abzeichen und Serie.
 *
 * Getrennt von `index.ts`, damit die Zugriffsschicht nicht zu einer einzigen
 * unübersichtlichen Datei wird. Die SQL-Anweisungen stehen weiterhin
 * ausschließlich in `statements.ts` (ARCHITEKTUR.md, Architekturregel 3).
 */

import { db } from './index';
import {
  PROFILE_UPDATE,
  INTERESTS_CLEAR,
  INTEREST_INSERT,
  INTERESTS_SELECT,
  XP_ADD,
  XP_SELECT,
  STREAK_SELECT,
  STREAK_SET,
  REWARD_INSERT,
  REWARDS_SELECT,
  ACTIVITY_ADD,
  ACTIVITY_SELECT_DAY,
  MODULE_SET,
  MODULE_SELECT,
  TOPICS_TRIED,
  SESSION_HIGHLIGHTS,
  LERNKURVE,
  REWARDS_SELECT_DATES,
  PROFILE_EINSTELLUNGEN_SET,
  LAST_SESSION_DAY,
} from './statements';
import { JOKER_PRO_MONAT, tageDazwischen, type SerienStand } from '../lib/gamification';
import type { AgeBand } from '../lib/curriculum';

// ------------------------------------------------------------- Onboarding

export interface OnboardingDaten {
  readonly name: string;
  readonly ageBand: AgeBand;
  readonly dailyGoalMin: number;
  readonly topicIds: readonly string[];
}

/**
 * Schreibt das Ergebnis des Onboardings weg.
 *
 * Der Name darf leer bleiben — nicht jedes Kind will seinen Namen eintippen,
 * und für die App braucht sie ihn nicht. Ein Zwangsfeld wäre ein Zwangsdialog
 * (ARCHITEKTUR.md).
 */
export async function saveOnboarding(daten: OnboardingDaten): Promise<void> {
  const d = await db();
  await d.execute(PROFILE_UPDATE, [
    daten.name,
    daten.ageBand,
    daten.dailyGoalMin,
    new Date().toISOString(),
  ]);

  await d.execute(INTERESTS_CLEAR, []);
  for (const [i, topicId] of daten.topicIds.entries()) {
    // Das zuerst gewaehlte Thema gilt als Lieblingsthema (SPEC.md 5).
    await d.execute(INTEREST_INSERT, [topicId, i === 0 ? 2 : 1]);
  }
}

export async function loadInterests(): Promise<{ topicId: string; weight: number }[]> {
  const d = await db();
  const rows = await d.select<{ topic_id: string; weight: number }[]>(INTERESTS_SELECT);
  return rows.map((r) => ({ topicId: r.topic_id, weight: r.weight }));
}

// -------------------------------------------------------------------- XP

export async function addXp(betrag: number): Promise<void> {
  if (betrag <= 0) return;
  const d = await db();
  await d.execute(XP_ADD, [betrag]);
}

export async function loadXp(): Promise<number> {
  const d = await db();
  const rows = await d.select<{ total: number }[]>(XP_SELECT);
  return rows[0]?.total ?? 0;
}

// ----------------------------------------------------------------- Serie

interface StreakRow {
  current_days: number;
  longest_days: number;
  last_day: string | null;
  freezes_left: number;
}

export async function loadStreak(): Promise<SerienStand> {
  const d = await db();
  const rows = await d.select<StreakRow[]>(STREAK_SELECT);
  const r = rows[0];
  if (!r) {
    return { currentDays: 0, longestDays: 0, lastDay: null, freezesLeft: JOKER_PRO_MONAT };
  }
  return {
    currentDays: r.current_days,
    longestDays: r.longest_days,
    lastDay: r.last_day,
    freezesLeft: r.freezes_left,
  };
}

export async function saveStreak(s: SerienStand): Promise<void> {
  const d = await db();
  await d.execute(STREAK_SET, [s.currentDays, s.longestDays, s.lastDay, s.freezesLeft]);
}

// ------------------------------------------------------------- Abzeichen

export async function loadRewards(): Promise<Set<string>> {
  const d = await db();
  const rows = await d.select<{ id: string }[]>(REWARDS_SELECT);
  return new Set(rows.map((r) => r.id));
}

/** Vergibt Abzeichen. Bereits vergebene bleiben unangetastet. */
export async function grantRewards(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  const d = await db();
  const jetzt = new Date().toISOString();
  for (const id of ids) await d.execute(REWARD_INSERT, [id, jetzt]);
}

// ------------------------------------------------------- Tagesaktivität

export interface Tagesaktivitaet {
  readonly day: string;
  readonly activeMs: number;
  readonly goalMet: boolean;
}

/** Schreibt Übungszeit auf den heutigen Tag und meldet den neuen Stand. */
export async function addActivity(
  activeMs: number,
  dailyGoalMin: number,
  heute = new Date().toISOString().slice(0, 10),
): Promise<Tagesaktivitaet> {
  const d = await db();
  const vorher = await d.select<{ active_ms: number }[]>(ACTIVITY_SELECT_DAY, [heute]);
  const gesamt = (vorher[0]?.active_ms ?? 0) + activeMs;
  const erreicht = gesamt >= dailyGoalMin * 60_000;

  await d.execute(ACTIVITY_ADD, [heute, activeMs, erreicht ? 1 : 0]);
  return { day: heute, activeMs: gesamt, goalMet: erreicht };
}

export async function loadActivity(
  tag = new Date().toISOString().slice(0, 10),
): Promise<Tagesaktivitaet> {
  const d = await db();
  const rows = await d.select<{ day: string; active_ms: number; goal_met: number }[]>(
    ACTIVITY_SELECT_DAY,
    [tag],
  );
  const r = rows[0];
  return {
    day: tag,
    activeMs: r?.active_ms ?? 0,
    goalMet: (r?.goal_met ?? 0) === 1,
  };
}

// ---------------------------------------------------------------- Module

export interface ModulStand {
  readonly unitId: string;
  readonly completed: boolean;
  /** Nur bei Fallen belegt: erkannt oder nicht (SPEC.md 6.6.1). */
  readonly recognized: boolean | null;
}

export async function loadModules(): Promise<Map<string, ModulStand>> {
  const d = await db();
  const rows =
    await d.select<{ unit_id: string; completed: number; recognized: number | null }[]>(
      MODULE_SELECT,
    );
  return new Map(
    rows.map((r) => [
      r.unit_id,
      {
        unitId: r.unit_id,
        completed: r.completed === 1,
        recognized: r.recognized === null ? null : r.recognized === 1,
      },
    ]),
  );
}

/**
 * Hält fest, dass eine Einheit abgeschlossen wurde.
 *
 * **Gespeichert werden zwei Wahrheitswerte, sonst nichts** (SPEC.md 6.6.1,
 * Regel 3). Was das Kind in einer Falle eingetippt hat, kommt hier nie an —
 * die Komponente wirft es beim Verlassen weg.
 */
export async function completeModule(
  unitId: string,
  recognized: boolean | null = null,
): Promise<void> {
  const d = await db();
  await d.execute(MODULE_SET, [
    unitId,
    recognized === null ? null : recognized ? 1 : 0,
    new Date().toISOString(),
  ]);
}

// -------------------------------------------------- Zahlen für Abzeichen

export interface Leistungsdaten {
  readonly besteStrokesMin: number;
  readonly besteErrorRate: number | null;
  readonly themenProbiert: number;
}

export async function loadLeistungsdaten(): Promise<Leistungsdaten> {
  const d = await db();
  const h =
    await d.select<{ best_strokes_min: number | null; best_error_rate: number | null }[]>(
      SESSION_HIGHLIGHTS,
    );
  const t = await d.select<{ n: number }[]>(TOPICS_TRIED);
  return {
    besteStrokesMin: h[0]?.best_strokes_min ?? 0,
    besteErrorRate: h[0]?.best_error_rate ?? null,
    themenProbiert: t[0]?.n ?? 0,
  };
}

// ------------------------------------------------------------ Lernkurve

/**
 * Zahlen für die Einheit „Deine eigene Kurve" (MODUL-LERNEN.md 1.1).
 *
 * Sie kommen ausschließlich aus echten Sitzungen. Liegen weniger als fünf vor,
 * zeigt die Einheit ihre neutrale Fassung — **nie** ein Beispielwert als ihr
 * Wert (ARCHITEKTUR.md).
 */
export interface Lernkurve {
  readonly sitzungen: number;
  readonly ersteStrokesMin: number;
  readonly letzteStrokesMin: number;
}

export async function loadLernkurve(): Promise<Lernkurve> {
  const d = await db();
  const rows =
    await d.select<{ n: number; erste: number | null; letzte: number | null }[]>(LERNKURVE);
  const r = rows[0];
  return {
    sitzungen: r?.n ?? 0,
    ersteStrokesMin: r?.erste ?? 0,
    letzteStrokesMin: r?.letzte ?? 0,
  };
}

// -------------------------------------------------------- Einstellungen

/**
 * Abzeichen mit dem Datum ihrer Vergabe — für die Galerie (SPEC.md 8.2).
 *
 * Getrennt von `loadRewards()`, weil die Abzeichenprüfung nach jeder Runde nur
 * die IDs braucht und jedes zusätzlich gelesene Feld dort umsonst wäre.
 */
export async function loadRewardDates(): Promise<Map<string, string>> {
  const d = await db();
  const rows = await d.select<{ id: string; earned_at: string }[]>(REWARDS_SELECT_DATES);
  return new Map(rows.map((r) => [r.id, r.earned_at]));
}

export interface Einstellungen {
  readonly name: string;
  readonly ageBand: AgeBand;
  readonly dailyGoalMin: number;
  readonly theme: string;
  readonly aiEnabled: boolean;
  readonly ghostEnabled: boolean;
  readonly blindMode: boolean;
  readonly topicIds: readonly string[];
}

/**
 * Schreibt die Einstellungen weg (SPEC.md 8.7, 9.8).
 *
 * `onboarded_at` bleibt unangetastet: Wer hier ist, hat das Onboarding hinter
 * sich, und es soll nicht noch einmal erscheinen.
 */
export async function saveEinstellungen(e: Einstellungen): Promise<void> {
  const d = await db();
  await d.execute(PROFILE_EINSTELLUNGEN_SET, [
    e.name,
    e.ageBand,
    e.dailyGoalMin,
    e.theme,
    e.aiEnabled ? 1 : 0,
    e.ghostEnabled ? 1 : 0,
    e.blindMode ? 1 : 0,
  ]);

  await d.execute(INTERESTS_CLEAR, []);
  for (const [i, topicId] of e.topicIds.entries()) {
    await d.execute(INTEREST_INSERT, [topicId, i === 0 ? 2 : 1]);
  }
}

/**
 * Wie viele Tage seit der letzten Übungsrunde vergangen sind.
 *
 * `0`, wenn heute schon geübt wurde, und auch dann, wenn es noch **gar keine**
 * Runde gab: Beim allerersten Start ist niemand lange weg gewesen.
 */
export async function ladeTageSeitLetztem(
  heute = new Date().toISOString().slice(0, 10),
): Promise<number> {
  const d = await db();
  const rows = await d.select<{ started_at: string }[]>(LAST_SESSION_DAY);
  const letzte = rows[0]?.started_at;
  if (!letzte) return 0;
  return Math.max(0, tageDazwischen(letzte, heute));
}
