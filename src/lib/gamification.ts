/**
 * XP, Level, Abzeichen und Serie (SPEC.md 8).
 *
 * **Leitregel des ganzen Abschnitts:** Belohnung folgt der Anstrengung, nicht
 * dem Zufall. Keine Lootboxen, keine Verlustmechanik, kein Zeitdruck als
 * Kernmechanik.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import { thresholdsFor } from './curriculum';

/** Anlässe, für die es XP gibt (SPEC.md 8.1). */
export type XpReason =
  | 'lektion'
  | 'stern'
  | 'tagesziel'
  | 'bestleistung'
  | 'abzeichen'
  | 'tagesaufgabe'
  | 'tastenjagd'
  | 'minispiel'
  | 'wochenziel';

export const XP: Record<XpReason, number> = {
  lektion: 50,
  stern: 25,
  tagesziel: 40,
  bestleistung: 30,
  abzeichen: 100,
  tagesaufgabe: 35,
  tastenjagd: 15,
  minispiel: 10,
  wochenziel: 120,
};

/** Der Blindmodus gibt 20 % der Einheit obendrauf (SPEC.md 8.1). */
export const BLINDMODUS_BONUS = 0.2;

/** Höchstens dreimal je Tag gibt es XP fürs Minispiel (SPEC.md 8.1, 8.10). */
export const MINISPIEL_XP_PRO_TAG = 3;

export const MAX_LEVEL = 30;

/**
 * XP-Schwelle, ab der Level `n` erreicht ist.
 *
 * Formel aus SPEC.md 8.1: **`XP(n) = 50 · n · (n − 1)`**.
 *
 * **Warum nicht mehr exponentiell.** Bis zum 2026-09-16 stand hier
 * `100 · n · 1,25^(n-1)`. Das ergab für Level 30 rund 1,5 Millionen XP. Der
 * gesamte Lernpfad bringt mit allen Sternen und allen Abzeichen 4 625 XP, ein
 * Jahr täglichen Übens rund 55 000. Level 30 lag damit um den Faktor 27 daneben
 * — die obere Hälfte der Leiste war Dekoration. Eine Anzeige „Level 12 von 30",
 * bei der 30 nie kommt, ist genau die Sackgasse, die es hier nicht geben soll
 * (SPEC.md 8.11).
 *
 * Die quadratische Kurve trifft die echten Größenordnungen:
 *
 * | Level | XP | erreicht etwa |
 * |---|---|---|
 * | 2 | 100 | nach der ersten Lektion |
 * | 10 | 4 500 | Lernpfad zur Hälfte |
 * | 18 | 15 300 | Lernpfad fertig, ein Vierteljahr dabei |
 * | 30 | 43 500 | rund ein Jahr fast täglich |
 *
 * `50 · n · (n − 1)` ist immer ein Vielfaches von 100 — `n · (n − 1)` ist
 * gerade. Deshalb wird hier nicht mehr gerundet; die Zahlen sind von sich aus
 * glatt und damit für ein Kind lesbar.
 *
 * Level 1 beginnt bei 0 — sonst stünde eine Nutzerin ohne jede Übung auf
 * Level 0, und das ist kein guter erster Eindruck.
 */
export function xpSchwelle(level: number): number {
  if (level <= 1) return 0;
  return 50 * level * (level - 1);
}

/** Das Level zu einem XP-Stand. */
export function levelFuerXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpSchwelle(level + 1)) level++;
  return level;
}

export interface LevelFortschritt {
  readonly level: number;
  /** XP seit Beginn dieses Levels. */
  readonly imLevel: number;
  /** XP, die dieses Level insgesamt umfasst. `null` beim Höchstlevel. */
  readonly bisZumNaechsten: number | null;
  readonly anteil: number;
}

export function levelFortschritt(xp: number): LevelFortschritt {
  const level = levelFuerXp(xp);
  const start = xpSchwelle(level);
  if (level >= MAX_LEVEL) {
    return { level, imLevel: xp - start, bisZumNaechsten: null, anteil: 1 };
  }
  const naechste = xpSchwelle(level + 1);
  const spanne = naechste - start;
  return {
    level,
    imLevel: xp - start,
    bisZumNaechsten: spanne,
    anteil: spanne > 0 ? (xp - start) / spanne : 0,
  };
}

// ------------------------------------------------------------- Abzeichen

export type BadgeId =
  | 'grundstellung'
  | 'erste-woerter'
  | 'obere-reihe'
  | 'untere-reihe'
  | 'grossschreiber'
  | 'zahlenjongleur'
  | 'sonderzeichen-profi'
  | 'blindflug'
  | 'fehlerfrei'
  | 'sprinter'
  | 'ausdauer'
  | 'woche'
  | 'monat'
  | 'neugierig'
  | 'zehni-diplom'
  | 'nicht-reingefallen'
  | 'wachsam'
  | 'durchblicker';

/** Woraus sich ergibt, welche Abzeichen verdient sind. */
export interface FortschrittsBild {
  /** Lektions-ID → bestanden? */
  readonly bestandeneLektionen: ReadonlySet<string>;
  /** Bestes Tempo aller Zeiten in Anschlägen pro Minute. */
  readonly besteStrokesMin: number;
  /** Wurde je eine Runde ohne einen einzigen Fehler abgeschlossen? Siehe `istFehlerfrei()`. */
  readonly jeFehlerfrei: boolean;
  /** Geübte Minuten am heutigen Tag. */
  readonly minutenHeute: number;
  /** Im Blindmodus geübte Minuten insgesamt. */
  readonly blindMinuten: number;
  readonly serieTage: number;
  /** Wie viele der zehn Themen schon vorkamen. */
  readonly themenProbiert: number;
  readonly diplomBestanden: boolean;
  /** Erkannte Fallen (SPEC.md 6.6.1). */
  readonly fallenErkannt: number;
  /** Abgeschlossene Zwischenstücke (SPEC.md 6.6). */
  readonly zwischenstueckeFertig: number;
}

/** Bestwerte einer Lektion, wie sie aus `sessions` kommen. */
export interface LektionsBestwert {
  readonly lessonId: string;
  /** Kleinste amtliche Fehlerquote in Prozent (`NORMEN.md` 4.3). */
  readonly besteErrorRate: number | null;
  /** Höchste Sicherheit in Prozent (`NORMEN.md` 4.4). */
  readonly besteSicherheit: number | null;
}

/**
 * Hat die Nutzerin je eine Runde **ohne einen einzigen Fehler** geschafft?
 *
 * **Warum das nicht einfach „Fehlerquote 0" ist.** In `L01`–`L13` lässt der
 * blockierende Modus eine falsche Taste gar nicht erst durch. Der Ergebnistext
 * ist dort bauartbedingt sauber, die amtliche Fehlerquote also **immer**
 * 0,00 % — `NORMEN.md` 4.4.1 sagt ausdrücklich, dass sie dort nichts
 * unterscheiden kann.
 *
 * Bis zum 2026-09-18 hing das Abzeichen trotzdem an genau dieser Zahl. Es kam
 * damit in der allerersten Runde der allerersten Lektion, auch nach drei
 * Vertippern. Gemeldet hat es der Nutzer, nicht ein Test: Die Auswertung zeigte
 * „Sicherheit 97,5 %" und daneben „Fehlerfrei — kein einziger Fehler".
 *
 * Ein Abzeichen, das jeder in der ersten Minute bekommt, ist keine Auszeichnung,
 * und eines, das dem widerspricht, was daneben steht, beschädigt das Vertrauen
 * in alle anderen Zahlen.
 *
 * **Jetzt gilt in jedem Bereich die Kennzahl, die dort etwas unterscheidet:**
 *
 * | Bereich | Modus | fehlerfrei heißt |
 * |---|---|---|
 * | `L01`–`L13` | blockierend | Sicherheit 100 % — keine Taste je danebengegriffen |
 * | ab `L14` | fließend | Fehlerquote 0,00 % am Ergebnistext |
 *
 * Das steht nicht im Widerspruch dazu, dass die Sicherheit **nie eine Note**
 * ist (`NORMEN.md` 4.4.1): Sie vergibt dort bereits die Sterne, und ein
 * Abzeichen ist wie ein Stern Trainingsrückmeldung, keine Bewertung.
 */
export function istFehlerfrei(bestwerte: readonly LektionsBestwert[]): boolean {
  return bestwerte.some((b) => {
    const schwellen = thresholdsFor(b.lessonId);
    if (!schwellen) return false;

    if (schwellen.kind === 'safety') {
      return b.besteSicherheit !== null && b.besteSicherheit >= 100;
    }
    return b.besteErrorRate !== null && b.besteErrorRate === 0;
  });
}

/** Schwellen, an denen Abzeichen hängen. An einer Stelle änderbar. */
export const BADGE_SCHWELLEN = {
  sprinter: 120,
  ausdauerMinuten: 30,
  blindflugMinuten: 10,
  woche: 7,
  monat: 30,
  themen: 10,
  fallen: 3,
  zwischenstuecke: 8,
} as const;

/**
 * Alle Abzeichen, die nach diesem Stand verdient sind.
 *
 * **Ein einmal verdientes Abzeichen wird nie wieder entzogen.** Diese Funktion
 * sagt nur, was verdient *ist*; die Datenbank hält fest, was schon vergeben
 * wurde. Wer eine Serie verliert, behält das Wochen-Abzeichen.
 */
export function verdienteAbzeichen(f: FortschrittsBild): BadgeId[] {
  const hat = (id: string): boolean => f.bestandeneLektionen.has(id);
  const badges: BadgeId[] = [];

  if (hat('L04')) badges.push('grundstellung');
  if (hat('L05')) badges.push('erste-woerter');
  if (hat('L13')) badges.push('obere-reihe');
  if (hat('L19')) badges.push('untere-reihe');
  if (hat('L20')) badges.push('grossschreiber');
  if (hat('L22')) badges.push('zahlenjongleur');
  if (hat('L23')) badges.push('sonderzeichen-profi');

  if (f.blindMinuten >= BADGE_SCHWELLEN.blindflugMinuten) badges.push('blindflug');
  if (f.jeFehlerfrei) badges.push('fehlerfrei');
  if (f.besteStrokesMin >= BADGE_SCHWELLEN.sprinter) badges.push('sprinter');
  if (f.minutenHeute >= BADGE_SCHWELLEN.ausdauerMinuten) badges.push('ausdauer');
  if (f.serieTage >= BADGE_SCHWELLEN.woche) badges.push('woche');
  if (f.serieTage >= BADGE_SCHWELLEN.monat) badges.push('monat');
  if (f.themenProbiert >= BADGE_SCHWELLEN.themen) badges.push('neugierig');
  if (f.diplomBestanden) badges.push('zehni-diplom');

  if (f.fallenErkannt >= 1) badges.push('nicht-reingefallen');
  if (f.fallenErkannt >= BADGE_SCHWELLEN.fallen) badges.push('wachsam');
  if (f.zwischenstueckeFertig >= BADGE_SCHWELLEN.zwischenstuecke) badges.push('durchblicker');

  return badges;
}

/** Welche Abzeichen sind neu dazugekommen? */
export function neueAbzeichen(
  bereitsVergeben: ReadonlySet<string>,
  f: FortschrittsBild,
): BadgeId[] {
  return verdienteAbzeichen(f).filter((b) => !bereitsVergeben.has(b));
}

// ----------------------------------------------------------------- Serie

export interface SerienStand {
  readonly currentDays: number;
  readonly longestDays: number;
  /** ISO-Datum des letzten Tages, an dem das Tagesziel erreicht wurde. */
  readonly lastDay: string | null;
  /** Verbleibende Joker in diesem Monat (SPEC.md 8.3). */
  readonly freezesLeft: number;
}

export const JOKER_PRO_MONAT = 2;

/** Tage zwischen zwei ISO-Datumsangaben (nur Datumsteil, ohne Uhrzeit). */
export function tageDazwischen(von: string, bis: string): number {
  const a = Date.parse(`${von.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${bis.slice(0, 10)}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

/**
 * Schreibt die Serie fort, wenn das Tagesziel erreicht wurde.
 *
 * **Zwei Joker je Monat gleichen einen verpassten Tag aus — automatisch, ohne
 * Nachfrage** (SPEC.md 8.3). Die Serie soll motivieren, nicht bestrafen. Ein
 * Kind, das am Dienstag keine Zeit hatte, verliert nicht zwölf Tage Arbeit.
 *
 * Die Joker füllen sich zum Monatswechsel wieder auf.
 */
export function serieFortschreiben(stand: SerienStand, heute: string): SerienStand {
  const tag = heute.slice(0, 10);
  if (stand.lastDay === tag) return stand; // heute schon gezaehlt

  const jokerStand = jokerFuerMonat(stand, tag);

  if (stand.lastDay === null) {
    return {
      ...jokerStand,
      currentDays: 1,
      longestDays: Math.max(1, stand.longestDays),
      lastDay: tag,
    };
  }

  const luecke = tageDazwischen(stand.lastDay, tag);

  // Direkt am Folgetag: Serie laeuft weiter.
  if (luecke === 1) {
    const neu = stand.currentDays + 1;
    return {
      ...jokerStand,
      currentDays: neu,
      longestDays: Math.max(neu, stand.longestDays),
      lastDay: tag,
    };
  }

  // Genau ein Tag verpasst und ein Joker uebrig: Serie bleibt stehen.
  if (luecke === 2 && jokerStand.freezesLeft > 0) {
    const neu = stand.currentDays + 1;
    return {
      currentDays: neu,
      longestDays: Math.max(neu, stand.longestDays),
      lastDay: tag,
      freezesLeft: jokerStand.freezesLeft - 1,
    };
  }

  // Serie gerissen. Die laengste Serie bleibt erhalten -- sie ist der Trost,
  // den SPEC.md 8.3 verlangt ("Deine laengste Serie: 12 Tage").
  return { ...jokerStand, currentDays: 1, longestDays: stand.longestDays, lastDay: tag };
}

/** Setzt die Joker zurück, sobald ein neuer Monat begonnen hat. */
function jokerFuerMonat(stand: SerienStand, tag: string): SerienStand {
  if (stand.lastDay && stand.lastDay.slice(0, 7) === tag.slice(0, 7)) return stand;
  return { ...stand, freezesLeft: JOKER_PRO_MONAT };
}

/**
 * XP für eine beendete Übungsrunde.
 *
 * `blindmodus` gibt 20 % obendrauf. Die Bestleistung zählt nur, wenn sie
 * wirklich übertroffen wurde — nicht beim ersten Versuch, wo es noch nichts zu
 * übertreffen gab.
 */
export interface RundenXpEingabe {
  readonly sterne: number;
  readonly bestanden: boolean;
  readonly neueBestleistung: boolean;
  readonly blindmodus: boolean;
}

export function xpFuerRunde(e: RundenXpEingabe): number {
  let xp = 0;
  if (e.bestanden) xp += XP.lektion;
  xp += e.sterne * XP.stern;
  if (e.neueBestleistung) xp += XP.bestleistung;
  if (e.blindmodus) xp = Math.round(xp * (1 + BLINDMODUS_BONUS));
  return xp;
}
