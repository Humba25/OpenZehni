/**
 * Datenbankzugriff für Tagesaufgabe, Wochenziel, Blindmodus und die
 * Einstellungen dazu (SPEC.md 8.6 bis 8.9).
 *
 * Gerechnet wird nicht hier: Ob ein Fortschritt zählt, entscheidet
 * `lib/challenges.ts`, wie hoch das Wochenziel liegt `lib/wochenziel.ts`. Diese
 * Datei liest und schreibt, sonst nichts (ARCHITEKTUR.md, Architekturregel 1 und 3).
 */

import { db } from './index';
import {
  CHALLENGE_INSERT,
  CHALLENGE_SELECT_DAY,
  CHALLENGE_PROGRESS_SET,
  CHALLENGE_DONE,
  CHALLENGE_DISMISS,
  WEEKLY_SELECT,
  WEEKLY_INSERT,
  WEEKLY_PROGRESS_SET,
  WEEKLY_REWARD_GIVEN,
  WEEKLY_WINS,
  LESSONS_PASSED_BETWEEN,
  BLIND_MS,
  SETTINGS_SET,
  MINIGAME_ADD,
  MINIGAME_SELECT_DAY,
} from './statements';
import {
  tagesaufgabeFuer,
  getChallenge,
  fortschrittNach,
  istErfuellt,
  type Challenge,
  type Ereignis,
} from '../lib/challenges';
import { isoWoche, montagDerWoche, zielFuerWoche, type Wochenstand } from '../lib/wochenziel';
import { XP, MINISPIEL_XP_PRO_TAG } from '../lib/gamification';

const heuteIso = (): string => new Date().toISOString().slice(0, 10);

// ------------------------------------------------------------ Tagesaufgabe

export interface Tagesaufgabe {
  readonly tag: string;
  readonly aufgabe: Challenge;
  readonly fortschritt: number;
  readonly erfuellt: boolean;
  /** Weggeklickt — die Karte kommt heute nicht wieder (SPEC.md 8.6). */
  readonly ausgeblendet: boolean;
}

interface ChallengeRow {
  day: string;
  challenge_id: string;
  progress: number;
  done_at: string | null;
  dismissed: number;
}

/**
 * Die Aufgabe des Tages — vorhandene laden, sonst ziehen.
 *
 * **Gezogen wird nur einmal je Tag.** Steht schon eine im Tagebuch, bleibt sie
 * stehen, auch wenn inzwischen weitere Lektionen freigeschaltet sind. Sonst
 * tauschte sich die Karte unter der Hand aus.
 *
 * `undefined` heißt: Es gibt heute nichts anzubieten (noch keine erfüllbare
 * Aufgabe, oder die Aufgabe wurde weggeklickt). Das ist kein Fehler.
 */
export async function ladeTagesaufgabe(
  profilId: number,
  freigeschaltet: ReadonlySet<string>,
  tag = heuteIso(),
): Promise<Tagesaufgabe | undefined> {
  const d = await db();

  const vorhanden = await d.select<ChallengeRow[]>(CHALLENGE_SELECT_DAY, [tag]);
  let zeile = vorhanden[0];

  if (!zeile) {
    const gezogen = tagesaufgabeFuer(tag, profilId, freigeschaltet);
    if (!gezogen) return undefined;
    await d.execute(CHALLENGE_INSERT, [tag, gezogen.id]);
    zeile = (await d.select<ChallengeRow[]>(CHALLENGE_SELECT_DAY, [tag]))[0];
    if (!zeile) return undefined;
  }

  const aufgabe = getChallenge(zeile.challenge_id);
  // Eine Aufgabe, die es nicht mehr gibt (Katalog geaendert), wird
  // stillschweigend nicht angezeigt. Sie zu ersetzen waere schlimmer: Dann
  // taeuschte die App einen Fortschritt vor, der zu etwas anderem gehoert.
  if (!aufgabe) return undefined;

  return {
    tag: zeile.day,
    aufgabe,
    fortschritt: zeile.progress,
    erfuellt: zeile.done_at !== null,
    ausgeblendet: zeile.dismissed === 1,
  };
}

/**
 * Schreibt ein Ereignis auf die Tagesaufgabe fort.
 *
 * Gibt zurück, ob die Aufgabe **gerade jetzt** erfüllt wurde — nur dann gibt es
 * die XP, und nur dann meldet die Oberfläche etwas.
 */
export async function tagesaufgabeFortschreiben(
  stand: Tagesaufgabe,
  ereignis: Ereignis,
): Promise<{ neuerStand: number; geradeErfuellt: boolean }> {
  const d = await db();
  const neu = fortschrittNach(stand.aufgabe, stand.fortschritt, ereignis);
  if (neu === stand.fortschritt) {
    return { neuerStand: stand.fortschritt, geradeErfuellt: false };
  }

  await d.execute(CHALLENGE_PROGRESS_SET, [stand.tag, neu]);

  const geradeErfuellt = !stand.erfuellt && istErfuellt(stand.aufgabe, neu);
  if (geradeErfuellt) await d.execute(CHALLENGE_DONE, [stand.tag, new Date().toISOString()]);

  return { neuerStand: neu, geradeErfuellt };
}

/** Karte weggeklickt. Sie kommt heute nicht wieder — und sonst passiert nichts. */
export async function tagesaufgabeAusblenden(tag = heuteIso()): Promise<void> {
  const d = await db();
  await d.execute(CHALLENGE_DISMISS, [tag]);
}

// -------------------------------------------------------------- Wochenziel

interface WeeklyRow {
  week: string;
  target: number;
  progress: number;
  reward_given: number;
}

/** Wie viele verschiedene Lektionen zwischen zwei Tagen bestanden wurden. */
async function lektionenZwischen(vonIso: string, bisIso: string): Promise<number> {
  const d = await db();
  const rows = await d.select<{ n: number }[]>(LESSONS_PASSED_BETWEEN, [vonIso, bisIso]);
  return rows[0]?.n ?? 0;
}

/** Der Montag der Woche davor und der Montag dieser Woche. */
function wochenGrenzen(tag: string): {
  montag: string;
  vorMontag: string;
  naechsterMontag: string;
} {
  const montag = montagDerWoche(tag);
  const alsZahl = Date.parse(`${montag}T00:00:00Z`);
  return {
    montag,
    vorMontag: new Date(alsZahl - 7 * 86_400_000).toISOString().slice(0, 10),
    naechsterMontag: new Date(alsZahl + 7 * 86_400_000).toISOString().slice(0, 10),
  };
}

/**
 * Der Stand der laufenden Woche. Legt die Zeile an, wenn es sie noch nicht gibt.
 *
 * Das Ziel richtet sich nach der **tatsächlichen** Aktivität der Vorwoche und
 * steigt nie um mehr als eine Einheit (SPEC.md 8.8). Der Fortschritt wird jedes
 * Mal neu aus den Runden gezählt statt hochaddiert: So kann er nicht
 * auseinanderlaufen, und eine wiederholte Lektion zählt nicht doppelt.
 */
export async function ladeWochenziel(tag = heuteIso()): Promise<Wochenstand> {
  const d = await db();
  const woche = isoWoche(tag);
  const { montag, vorMontag, naechsterMontag } = wochenGrenzen(tag);

  let zeile = (await d.select<WeeklyRow[]>(WEEKLY_SELECT, [woche]))[0];

  if (!zeile) {
    const vorwoche = (await d.select<WeeklyRow[]>(WEEKLY_SELECT, [isoWoche(vorMontag)]))[0];
    const geschafft = await lektionenZwischen(vorMontag, montag);
    const ziel = zielFuerWoche(geschafft, vorwoche?.target ?? null);
    await d.execute(WEEKLY_INSERT, [woche, ziel]);
    zeile = (await d.select<WeeklyRow[]>(WEEKLY_SELECT, [woche]))[0];
    if (!zeile) return { week: woche, target: ziel, progress: 0, rewardGiven: false };
  }

  const fortschritt = await lektionenZwischen(montag, naechsterMontag);
  if (fortschritt !== zeile.progress) {
    await d.execute(WEEKLY_PROGRESS_SET, [woche, fortschritt]);
  }

  return {
    week: woche,
    target: zeile.target,
    progress: fortschritt,
    rewardGiven: zeile.reward_given === 1,
  };
}

/** Hält fest, dass die Belohnung für diese Woche vergeben wurde. */
export async function wochenzielBelohnt(woche: string): Promise<void> {
  const d = await db();
  await d.execute(WEEKLY_REWARD_GIVEN, [woche]);
}

/** Wie oft das Wochenziel insgesamt erreicht wurde — für die Lernstube (8.4). */
export async function ladeWochenzielSiege(): Promise<number> {
  const d = await db();
  const rows = await d.select<{ n: number }[]>(WEEKLY_WINS);
  return rows[0]?.n ?? 0;
}

// ------------------------------------------- Blindmodus und Einstellungen

/** Geübte Minuten im Blindmodus, für das Abzeichen „blindflug" (SPEC.md 8.2). */
export async function ladeBlindMinuten(): Promise<number> {
  const d = await db();
  const rows = await d.select<{ ms: number }[]>(BLIND_MS);
  return (rows[0]?.ms ?? 0) / 60_000;
}

export async function speichereEinstellungen(e: {
  geistAn: boolean;
  blindmodus: boolean;
}): Promise<void> {
  const d = await db();
  await d.execute(SETTINGS_SET, [e.geistAn ? 1 : 0, e.blindmodus ? 1 : 0]);
}

// ----------------------------------------------------------- Minispiele

/**
 * Zählt eine gespielte Minispielrunde und meldet die verdienten XP.
 *
 * **Höchstens dreimal je Tag** (SPEC.md 8.1). Die Deckelung ist Absicht: XP
 * sollen dem Lernpfad folgen, nicht der Spielzeit. Darüber hinaus darf beliebig
 * weitergespielt werden — es gibt nur nichts mehr dafür, und das ist etwas
 * anderes als eine Sperre.
 */
export async function minispielGespielt(tag = heuteIso()): Promise<number> {
  const d = await db();
  const vorher = await d.select<{ plays: number }[]>(MINIGAME_SELECT_DAY, [tag]);
  const bisher = vorher[0]?.plays ?? 0;

  await d.execute(MINIGAME_ADD, [tag]);
  return bisher < MINISPIEL_XP_PRO_TAG ? XP.minispiel : 0;
}
