/**
 * Datenbankzugriff. **Die einzige Stelle mit SQL** (ARCHITEKTUR.md,
 * Architekturregel 3) — in Komponenten steht nie eine Abfrage.
 *
 * Die Migrationen laufen auf der Rust-Seite beim Start (`src-tauri/src/lib.rs`).
 * Hier wird nur gelesen und geschrieben.
 */

import Database from '@tauri-apps/plugin-sql';
import type { AgeBand } from '../lib/curriculum';
import type { CharStat, Confusion } from '../lib/typing-engine';
import { PLAETZE, dbUrl, weiterSuchen } from '../lib/plaetze';
import {
  PROFILE_SELECT,
  PLATZ_LEEREN,
  PROFILE_INSERT,
  PROGRESS_SELECT,
  SESSION_INSERT,
  PROGRESS_UPSERT,
  CHAR_STATS_UPSERT,
  CONFUSION_UPSERT,
  LESSON_UNLOCK,
  LESSON_PASSES,
  LESSON_PASSES_ALL,
  CHAR_STATS_SELECT,
  LAYOUT_VERIFIED_SET,
  LAYOUT_VERIFIED_CLEAR,
  LAST_SESSION_SPEED,
} from './statements';

// Damit die Oberflaeche nicht zwei Stellen kennen muss (SPEC.md 5.1).
export { PLAETZE, dbUrl } from '../lib/plaetze';

/**
 * Der Platz, dessen Daten gerade gemeint sind.
 *
 * Ein Modulzustand statt eines Parameters an jeder Funktion: So bleiben alle
 * bestehenden Aufrufe unverändert gültig, und es gibt keine Abfrage, die den
 * Platz „vergessen" könnte. Gesetzt wird er genau einmal je Sitzung, bevor
 * irgendetwas gelesen wird.
 */
let aktiverPlatz = 1;

let verbindung: Database | null = null;

/** Welcher Platz gerade offen ist. */
export function offenerPlatz(): number {
  return aktiverPlatz;
}

/**
 * Wechselt den Platz und wirft die offene Verbindung weg.
 *
 * Das Wegwerfen ist der wichtige Teil: Bliebe die alte Verbindung stehen,
 * schriebe das zweite Kind in die Datenbank des ersten.
 */
export function platzWaehlen(platz: number): void {
  if (platz === aktiverPlatz) return;
  aktiverPlatz = platz;
  verbindung = null;
}

/** Öffnet die Datenbank beim ersten Aufruf und gibt sie danach wieder. */
export async function db(): Promise<Database> {
  verbindung ??= await Database.load(dbUrl(aktiverPlatz));
  return verbindung;
}

// ---------------------------------------------------------------- Profil

export interface Profile {
  readonly id: number;
  readonly name: string;
  readonly avatar: string;
  readonly dailyGoalMin: number;
  readonly aiEnabled: boolean;
  readonly theme: string;
  readonly ageBand: AgeBand;
  /**
   * Wann die Tastaturbelegung zuletzt als T1 bestätigt wurde (SPEC.md 7.4).
   * `null` heißt: noch nie — der Lernpfad bleibt gesperrt.
   */
  readonly layoutVerifiedAt: string | null;
  /** Wann das Onboarding durchlaufen wurde. `null` heißt: noch nie. */
  readonly onboardedAt: string | null;
  /** Läuft der Geisterschreiber mit (SPEC.md 8.7)? */
  readonly ghostEnabled: boolean;
  /** Zuletzt gewählter Blindmodus (SPEC.md 8.1). */
  readonly blindMode: boolean;
  /** Schriftgröße: normal | gross | sehr-gross (SPEC.md 12.2). */
  readonly fontScale: string;
}

interface ProfileRow {
  id: number;
  name: string;
  avatar: string;
  daily_goal_min: number;
  ai_enabled: number;
  theme: string;
  age_band: string;
  layout_verified_at: string | null;
  onboarded_at: string | null;
  ghost_enabled: number;
  blind_mode: number;
  font_scale: string;
}

/** Ein Platz in der Übersicht: belegt mit einem Namen, oder noch frei. */
export interface PlatzStand {
  readonly platz: number;
  /** Leer, solange das Onboarding nicht durch ist. */
  readonly name: string;
  readonly avatar: string;
  /** Ist hier ein Kind eingerichtet? */
  readonly belegt: boolean;
}

/**
 * Welche Plätze belegt sind — die Grundlage der Profilwahl.
 *
 * **Geprüft wird nur bis zum ersten freien Platz.** Das Öffnen einer
 * Datenbankdatei legt sie an und lässt die Migrationen laufen; alle vier
 * Plätze bei jedem Start zu prüfen hieße, auf einer alten Festplatte viermal
 * dafür zu bezahlen (Startbudget, SPEC.md 12.1). Da Plätze immer der Reihe
 * nach belegt werden, sagt der erste freie alles Weitere.
 *
 * Der erste freie Platz ist im Ergebnis enthalten: Die Oberfläche braucht ihn,
 * um „noch ein Kind" anzubieten.
 */
export async function plaetzeLesen(): Promise<readonly PlatzStand[]> {
  const stand: PlatzStand[] = [];

  for (let platz = 1; platz <= PLAETZE; platz++) {
    let eintrag: PlatzStand = { platz, name: '', avatar: 'maus', belegt: false };
    try {
      const d = await Database.load(dbUrl(platz));
      const rows = await d.select<ProfileRow[]>(PROFILE_SELECT);
      const r = rows[0];
      // Belegt heisst: Das Onboarding ist durch. Eine Datei, die nur angelegt
      // wurde, ist kein Kind.
      if (r && r.onboarded_at) {
        eintrag = { platz, name: r.name, avatar: r.avatar, belegt: true };
      }
    } catch (error) {
      // Ein unlesbarer Platz darf die anderen nicht mitreissen.
      console.warn(`Zehni: Platz ${platz} nicht lesbar`, error);
    }

    stand.push(eintrag);
    if (!weiterSuchen(eintrag.belegt, platz)) break;
  }

  return stand;
}

/**
 * Löscht alles, was zu einem Platz gehört.
 *
 * **Nur der letzte belegte Platz.** Plätze werden der Reihe nach belegt, und
 * `plaetzeLesen()` hört beim ersten freien auf — eine Lücke in der Mitte wäre
 * für alles Dahinterliegende dasselbe wie gelöscht. Diese Einschränkung steht
 * in `SPEC.md` 15.17 als offener Punkt.
 *
 * Gelöscht wird zeilenweise, nicht die Datei: Aus der WebView heraus gibt es
 * keinen Dateizugriff, und dabei soll es bleiben (ARCHITEKTUR.md,
 * Architekturregel 2). Die leere Datei bleibt liegen und zählt wieder als
 * freier Platz.
 */
export async function platzLoeschen(platz: number): Promise<void> {
  if (platz <= 1) throw new Error('Der erste Platz laesst sich nicht loeschen.');
  if (platz === aktiverPlatz) throw new Error('Der offene Platz laesst sich nicht loeschen.');

  const d = await Database.load(dbUrl(platz));
  for (const anweisung of PLATZ_LEEREN) await d.execute(anweisung);
}

/**
 * Holt das Profil. Gibt es noch keines, wird eines angelegt.
 *
 * In v1 existiert genau ein Profil mit `id = 1` (SPEC.md 5). Es ohne Nachfrage
 * anzulegen ist Absicht: Ein Zwangsdialog beim Start ist ausdrücklich
 * ausgeschlossen (ARCHITEKTUR.md, keine Bestrafungsmechanik). Das Onboarding kommt
 * später und darf das Profil dann ergänzen.
 */
export async function getOrCreateProfile(): Promise<Profile> {
  const d = await db();
  const rows = await d.select<ProfileRow[]>(PROFILE_SELECT);

  if (rows.length === 0) {
    await d.execute(PROFILE_INSERT, ['', 'maus', new Date().toISOString(), 10, 1, 'hell', 'A2']);
    return {
      id: 1,
      name: '',
      avatar: 'maus',
      dailyGoalMin: 10,
      aiEnabled: true,
      theme: 'hell',
      ageBand: 'A2',
      layoutVerifiedAt: null,
      onboardedAt: null,
      // Der Geist ist standardmaessig an, der Blindmodus aus: Wer gerade erst
      // anfaengt, braucht die Tastaturgrafik.
      ghostEnabled: true,
      blindMode: false,
      fontScale: 'normal',
    };
  }

  const r = rows[0]!;
  return {
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    dailyGoalMin: r.daily_goal_min,
    aiEnabled: r.ai_enabled === 1,
    theme: r.theme,
    ageBand: (['A1', 'A2', 'A3'] as const).includes(r.age_band as AgeBand)
      ? (r.age_band as AgeBand)
      : 'A2',
    layoutVerifiedAt: r.layout_verified_at,
    onboardedAt: r.onboarded_at,
    ghostEnabled: r.ghost_enabled === 1,
    blindMode: r.blind_mode === 1,
    fontScale: r.font_scale,
  };
}

/**
 * Hält fest, dass die Tastaturbelegung als T1 bestätigt wurde (SPEC.md 7.4).
 */
export async function markLayoutVerified(): Promise<void> {
  const d = await db();
  await d.execute(LAYOUT_VERIFIED_SET, [new Date().toISOString()]);
}

/** Setzt die Bestätigung zurück; die Prüfung erscheint dann wieder. */
export async function clearLayoutVerified(): Promise<void> {
  const d = await db();
  await d.execute(LAYOUT_VERIFIED_CLEAR, []);
}

// ------------------------------------------------------- Lektionsfortschritt

export type LessonStatus = 'locked' | 'unlocked' | 'passed';

export interface LessonProgress {
  readonly lessonId: string;
  readonly status: LessonStatus;
  readonly stars: number;
  readonly bestStrokesMin: number | null;
  readonly bestErrorRate: number | null;
  readonly bestSafety: number | null;
  readonly attempts: number;
  readonly lastPlayed: string | null;
}

interface ProgressRow {
  lesson_id: string;
  status: string;
  stars: number;
  best_strokes_min: number | null;
  best_error_rate: number | null;
  best_safety: number | null;
  attempts: number;
  last_played: string | null;
}

export async function loadProgress(): Promise<Map<string, LessonProgress>> {
  const d = await db();
  const rows = await d.select<ProgressRow[]>(PROGRESS_SELECT);
  return new Map(
    rows.map((r) => [
      r.lesson_id,
      {
        lessonId: r.lesson_id,
        status: r.status as LessonStatus,
        stars: r.stars,
        bestStrokesMin: r.best_strokes_min,
        bestErrorRate: r.best_error_rate,
        bestSafety: r.best_safety,
        attempts: r.attempts,
        lastPlayed: r.last_played,
      },
    ]),
  );
}

/** Was in einer beendeten Runde herausgekommen ist. */
export interface SessionRecord {
  readonly lessonId: string;
  readonly startedAt: string;
  readonly durationMs: number;
  readonly strokesTotal: number;
  readonly errors: number;
  readonly errorRate: number;
  readonly strokesMin: number;
  readonly firstTryPct: number;
  readonly topicId?: string | undefined;
  readonly source: string;
  readonly stars: number;
  readonly passed: boolean;
  /** Im Blindmodus getippt (SPEC.md 8.1, Abzeichen „blindflug"). */
  readonly blind: boolean;
  readonly charStats: ReadonlyMap<string, CharStat>;
  readonly confusions: readonly Confusion[];
}

/**
 * Schreibt eine beendete Runde weg: die Runde selbst, den Lektionsfortschritt,
 * das Fehlerprofil und die Verwechslungen.
 *
 * Die Bestwerte werden je Kennzahl getrennt geführt. Welche davon zählt, hängt
 * an der Lektion (NORMEN.md 4.4.1) — deshalb werden beide festgehalten und die
 * Entscheidung der Anzeige überlassen.
 */
export async function saveSession(record: SessionRecord): Promise<void> {
  const d = await db();

  await d.execute(SESSION_INSERT, [
    record.lessonId,
    record.startedAt,
    record.durationMs,
    record.strokesTotal,
    record.errors,
    record.errorRate,
    record.strokesMin,
    record.firstTryPct,
    record.topicId ?? null,
    record.source,
    record.blind ? 1 : 0,
    record.passed ? 1 : 0,
  ]);

  await d.execute(PROGRESS_UPSERT, [
    record.lessonId,
    record.passed ? 'passed' : 'unlocked',
    record.stars,
    record.strokesMin,
    record.errorRate,
    record.firstTryPct,
    record.startedAt,
  ]);

  for (const [char, stat] of record.charStats) {
    const avgLatency = stat.samples > 0 ? stat.totalLatencyMs / stat.samples : null;
    await d.execute(CHAR_STATS_UPSERT, [
      char,
      stat.hits,
      stat.misses,
      avgLatency,
      record.startedAt,
    ]);
  }

  for (const c of record.confusions) {
    await d.execute(CONFUSION_UPSERT, [c.expected, c.typed, c.count]);
  }
}

/** Schaltet eine Lektion frei, falls sie es noch nicht ist. */
/**
 * Wie oft diese Lektion bestanden wurde.
 *
 * Die Freischaltung hängt daran (`curriculum.ts`, `PFLICHTRUNDEN`). Gezählt
 * wird in `sessions`, weil dort jede einzelne Runde steht — `lesson_progress`
 * kennt nur eine Summe aller Versuche.
 */
/**
 * Bestandene Runden je Lektion. Der Lernweg zeigt damit an, wie viele noch
 * fehlen (`curriculum.ts`, `PFLICHTRUNDEN`).
 */
export async function loadPasses(): Promise<ReadonlyMap<string, number>> {
  const d = await db();
  const rows = await d.select<{ lesson_id: string; n: number }[]>(LESSON_PASSES_ALL);
  return new Map(rows.map((r) => [r.lesson_id, r.n]));
}

export async function countPasses(lessonId: string): Promise<number> {
  const d = await db();
  const rows = await d.select<{ n: number }[]>(LESSON_PASSES, [lessonId]);
  return rows[0]?.n ?? 0;
}

export async function unlockLesson(lessonId: string): Promise<void> {
  const d = await db();
  await d.execute(LESSON_UNLOCK, [lessonId]);
}

// ------------------------------------------------------------ Fehlerprofil

interface CharStatRow {
  char: string;
  hits: number;
  misses: number;
  avg_latency_ms: number | null;
}

/** Das gesammelte Fehlerprofil für die adaptive Wiederholung (SPEC.md 6.4). */
export async function loadCharStats(): Promise<Map<string, CharStat>> {
  const d = await db();
  const rows = await d.select<CharStatRow[]>(CHAR_STATS_SELECT);
  return new Map(
    rows.map((r) => [
      r.char,
      {
        hits: r.hits,
        misses: r.misses,
        totalLatencyMs: (r.avg_latency_ms ?? 0) * Math.max(1, r.hits),
        samples: Math.max(1, r.hits),
      },
    ]),
  );
}

/**
 * Das Tempo der zuletzt gespielten Runde dieser Lektion, für den Vergleich in
 * der Auswertung (SPEC.md 6.5, Schritt 3).
 *
 * **Vor** `saveSession()` aufrufen — sonst liefert es die gerade beendete Runde.
 */
export async function loadLastSpeed(lessonId: string): Promise<number | null> {
  const d = await db();
  const rows = await d.select<{ strokes_min: number }[]>(LAST_SESSION_SPEED, [lessonId]);
  return rows[0]?.strokes_min ?? null;
}
