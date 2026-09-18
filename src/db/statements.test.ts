/**
 * Prüft die SQL-Anweisungen der Datenbankschicht gegen **dieselben
 * Migrationsdateien**, die auch die App ausführt.
 *
 * Läuft ohne Tauri: `node:sqlite` ist seit Node 22 eingebaut, und SQLite ist
 * SQLite. Geprüft wird damit genau das, was sonst nur in der laufenden App
 * passiert — vor allem das Zusammenführen der Bestwerte, das von Hand richtig
 * zu haben und nie zu prüfen leichtsinnig wäre.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  PROFILE_SELECT,
  PROFILE_INSERT,
  PROGRESS_SELECT,
  SESSION_INSERT,
  PROGRESS_UPSERT,
  CHAR_STATS_UPSERT,
  CONFUSION_UPSERT,
  LESSON_UNLOCK,
  CHAR_STATS_SELECT,
  CHALLENGE_INSERT,
  CHALLENGE_SELECT_DAY,
  CHALLENGE_PROGRESS_SET,
  CHALLENGE_DONE,
  CHALLENGE_DISMISS,
  BLIND_MS,
  SETTINGS_SET,
  PROFILE_EINSTELLUNGEN_SET,
  PROFILE_UPDATE,
  PLATZ_LEEREN,
} from './statements';

const HIER = dirname(fileURLToPath(import.meta.url));
const MIGRATIONEN = join(HIER, '..', '..', 'src-tauri', 'migrations');

/**
 * Alle Migrationen in derselben Reihenfolge wie die App
 * (`src-tauri/src/lib.rs`).
 *
 * Bewusst über das Verzeichnis und nicht als feste Liste: Eine neue Migration,
 * die hier vergessen würde, ließe die Tests gegen ein veraltetes Schema laufen
 * — und dann fiele der Fehler erst in der fertigen App auf.
 */
function alleMigrationen(): string[] {
  return readdirSync(MIGRATIONEN)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(join(MIGRATIONEN, f), 'utf8'));
}

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(':memory:');
  for (const sql of alleMigrationen()) db.exec(sql);
});

/** Führt eine Anweisung mit Platzhaltern `$1`, `$2` … aus. */
function run(sql: string, params: readonly unknown[]): void {
  const gebunden: Record<string, unknown> = {};
  params.forEach((p, i) => {
    gebunden[String(i + 1)] = p as never;
  });
  db.prepare(sql).run(gebunden as never);
}

function alle<T = Record<string, unknown>>(sql: string): T[] {
  return db.prepare(sql).all() as T[];
}

/** Wie `alle`, aber mit Platzhaltern — für Abfragen, die Parameter haben. */
function alleMit<T = Record<string, unknown>>(sql: string, params: readonly unknown[]): T[] {
  const gebunden: Record<string, unknown> = {};
  params.forEach((p, i) => {
    gebunden[String(i + 1)] = p as never;
  });
  return db.prepare(sql).all(gebunden as never) as T[];
}

describe('Migrationen — SPEC.md 5', () => {
  it('legt alle Tabellen des Datenmodells an', () => {
    const namen = alle<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    ).map((r) => r.name);

    for (const erwartet of [
      'profile',
      'interests',
      'lesson_progress',
      'sessions',
      'char_stats',
      'confusions',
      'rewards',
      'streak',
      'xp',
      'daily_challenge',
      'weekly_goal',
      'text_cache',
    ]) {
      expect(namen, `Tabelle ${erwartet} fehlt`).toContain(erwartet);
    }
  });

  it('lässt nur eine Zeile in streak und xp zu', () => {
    db.exec('INSERT INTO streak (id) VALUES (1)');
    expect(() => db.exec('INSERT INTO streak (id) VALUES (2)')).toThrow();
  });

  it('hat die Altersstufe im Profil mit A2 als Vorgabe (SPEC.md 9.8)', () => {
    run(PROFILE_INSERT, ['', 'maus', '2026-09-14T10:00:00Z', 10, 1, 'hell', 'A2']);
    const p = alle<{ age_band: string }>(PROFILE_SELECT)[0]!;
    expect(p.age_band).toBe('A2');
  });
});

describe('Profil', () => {
  it('legt genau eine Zeile mit id = 1 an', () => {
    run(PROFILE_INSERT, ['', 'maus', '2026-09-14T10:00:00Z', 10, 1, 'hell', 'A2']);
    const rows = alle<{ id: number }>(PROFILE_SELECT);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe(1);
  });
});

describe('Lektion freischalten', () => {
  it('legt eine offene Lektion an', () => {
    run(LESSON_UNLOCK, ['L01']);
    const p = alle<{ lesson_id: string; status: string }>(PROGRESS_SELECT);
    expect(p).toHaveLength(1);
    expect(p[0]!.status).toBe('unlocked');
  });

  it('überschreibt einen bestehenden Stand nicht', () => {
    run(PROGRESS_UPSERT, ['L01', 'passed', 3, 120, 0.5, 99, '2026-09-14T10:00:00Z']);
    run(LESSON_UNLOCK, ['L01']);
    const p = alle<{ status: string; stars: number }>(PROGRESS_SELECT)[0]!;
    expect(p.status).toBe('passed');
    expect(p.stars).toBe(3);
  });
});

describe('Fortschritt zusammenführen — die Bestwert-Logik', () => {
  const runde = (
    status: string,
    stars: number,
    tempo: number,
    quote: number,
    sicherheit: number,
  ): void => {
    run(PROGRESS_UPSERT, ['L01', status, stars, tempo, quote, sicherheit, '2026-09-14T10:00:00Z']);
  };

  const stand = () =>
    alle<{
      status: string;
      stars: number;
      best_strokes_min: number;
      best_error_rate: number;
      best_safety: number;
      attempts: number;
    }>(PROGRESS_SELECT)[0]!;

  it('übernimmt beim ersten Versuch alle Werte unverändert', () => {
    runde('unlocked', 1, 55, 3.2, 91);
    const s = stand();
    expect(s.best_strokes_min).toBe(55);
    expect(s.best_error_rate).toBe(3.2);
    expect(s.best_safety).toBe(91);
    expect(s.attempts).toBe(1);
  });

  it('behält beim Tempo das Maximum', () => {
    runde('unlocked', 1, 55, 3.2, 91);
    runde('unlocked', 1, 40, 3.2, 91);
    expect(stand().best_strokes_min).toBe(55);
    runde('unlocked', 1, 70, 3.2, 91);
    expect(stand().best_strokes_min).toBe(70);
  });

  /** Bei der Fehlerquote ist **weniger** besser — die häufigste Verwechslung. */
  it('behält bei der Fehlerquote das Minimum', () => {
    runde('unlocked', 1, 55, 3.2, 91);
    runde('unlocked', 1, 55, 5.0, 91);
    expect(stand().best_error_rate).toBe(3.2);
    runde('unlocked', 1, 55, 1.1, 91);
    expect(stand().best_error_rate).toBe(1.1);
  });

  it('behält bei der Sicherheit das Maximum', () => {
    runde('unlocked', 1, 55, 3.2, 91);
    runde('unlocked', 1, 55, 3.2, 85);
    expect(stand().best_safety).toBe(91);
    runde('unlocked', 1, 55, 3.2, 97);
    expect(stand().best_safety).toBe(97);
  });

  it('behält die höchste Sternzahl', () => {
    runde('unlocked', 2, 55, 3.2, 91);
    runde('unlocked', 1, 55, 3.2, 91);
    expect(stand().stars).toBe(2);
  });

  /** Einmal bestanden bleibt bestanden — sonst würde eine schwache Runde die
   *  nächste Lektion wieder zusperren. */
  it('fällt nie von bestanden zurück', () => {
    runde('passed', 1, 55, 3.2, 91);
    runde('unlocked', 0, 20, 9.9, 50);
    expect(stand().status).toBe('passed');
  });

  it('zählt die Versuche hoch', () => {
    runde('unlocked', 1, 55, 3.2, 91);
    runde('unlocked', 1, 55, 3.2, 91);
    runde('unlocked', 1, 55, 3.2, 91);
    expect(stand().attempts).toBe(3);
  });

  /**
   * Der Ersatzwert für die erste Fehlerquote ist bewusst absurd hoch (1e9).
   * Wäre er 0, bliebe der Bestwert für immer 0 und jede echte Runde sähe
   * schlechter aus als der Startwert.
   */
  it('lässt den ersten echten Wert gegen den Ersatzwert gewinnen', () => {
    runde('unlocked', 1, 55, 8.0, 91);
    expect(stand().best_error_rate).toBe(8.0);
    expect(stand().best_error_rate).toBeLessThan(1e9);
  });
});

describe('Runden, Fehlerprofil und Verwechslungen', () => {
  it('schreibt eine Runde vollständig weg', () => {
    run(SESSION_INSERT, [
      'L01',
      '2026-09-14T10:00:00Z',
      45000,
      132,
      0,
      0,
      176,
      93.5,
      null,
      'drill',
      0,
      1,
    ]);
    const s = alle<{
      lesson_id: string;
      strokes_total: number;
      first_try_pct: number;
      source: string;
    }>('SELECT * FROM sessions')[0]!;
    expect(s.lesson_id).toBe('L01');
    expect(s.strokes_total).toBe(132);
    expect(s.first_try_pct).toBe(93.5);
    expect(s.source).toBe('drill');
  });

  it('summiert das Fehlerprofil über mehrere Runden', () => {
    run(CHAR_STATS_UPSERT, ['f', 10, 2, 250, '2026-09-14T10:00:00Z']);
    run(CHAR_STATS_UPSERT, ['f', 5, 3, 300, '2026-09-14T10:05:00Z']);
    const c = alle<{ char: string; hits: number; misses: number; avg_latency_ms: number }>(
      CHAR_STATS_SELECT,
    )[0]!;
    expect(c.hits).toBe(15);
    expect(c.misses).toBe(5);
    expect(c.avg_latency_ms).toBe(300);
  });

  it('behält die alte Latenz, wenn keine neue vorliegt', () => {
    run(CHAR_STATS_UPSERT, ['f', 10, 0, 250, '2026-09-14T10:00:00Z']);
    run(CHAR_STATS_UPSERT, ['f', 0, 1, null, '2026-09-14T10:05:00Z']);
    expect(alle<{ avg_latency_ms: number }>(CHAR_STATS_SELECT)[0]!.avg_latency_ms).toBe(250);
  });

  it('zählt Verwechslungen zusammen', () => {
    run(CONFUSION_UPSERT, ['z', 'y', 1]);
    run(CONFUSION_UPSERT, ['z', 'y', 2]);
    run(CONFUSION_UPSERT, ['z', 'x', 1]);
    const c = alle<{ expected: string; typed: string; count: number }>(
      'SELECT * FROM confusions ORDER BY typed',
    );
    expect(c).toHaveLength(2);
    expect(c.find((r) => r.typed === 'y')!.count).toBe(3);
    expect(c.find((r) => r.typed === 'x')!.count).toBe(1);
  });

  /**
   * Leer- und Satzzeichen müssen als verwechselte Zeichen funktionieren — genau
   * dafür wurde der zusammengesetzte Zeichenschlüssel aufgegeben.
   */
  it('kommt mit Leer- und Satzzeichen als Schlüssel zurecht', () => {
    run(CONFUSION_UPSERT, [' ', ',', 1]);
    run(CONFUSION_UPSERT, [',', ' ', 1]);
    expect(alle('SELECT * FROM confusions')).toHaveLength(2);
  });
});

describe('Tagesaufgabe — SPEC.md 8.6', () => {
  const TAG = '2026-09-14';

  it('legt die Aufgabe des Tages an', () => {
    run(CHALLENGE_INSERT, [TAG, 'runden-zwei']);
    const c = alleMit<{ challenge_id: string; progress: number; dismissed: number }>(
      CHALLENGE_SELECT_DAY,
      [TAG],
    )[0]!;
    expect(c.challenge_id).toBe('runden-zwei');
    expect(c.progress).toBe(0);
    expect(c.dismissed).toBe(0);
  });

  it('findet fuer einen anderen Tag nichts', () => {
    run(CHALLENGE_INSERT, [TAG, 'runden-zwei']);
    expect(alleMit(CHALLENGE_SELECT_DAY, ['2026-09-15'])).toHaveLength(0);
  });

  /**
   * Die eigentliche Zusage: Ist fuer den Tag schon gezogen, bleibt es dabei.
   * Sonst koennte eine mitten am Tag freigeschaltete Lektion die Karte unter
   * der Hand austauschen.
   */
  it('zieht je Tag nur einmal', () => {
    run(CHALLENGE_INSERT, [TAG, 'runden-zwei']);
    run(CHALLENGE_INSERT, [TAG, 'blind-drei']);
    const c = alle<{ challenge_id: string }>('SELECT * FROM daily_challenge');
    expect(c).toHaveLength(1);
    expect(c[0]!.challenge_id).toBe('runden-zwei');
  });

  it('laesst den Fortschritt nie zurueckfallen', () => {
    run(CHALLENGE_INSERT, [TAG, 'strecke-200']);
    run(CHALLENGE_PROGRESS_SET, [TAG, 150]);
    run(CHALLENGE_PROGRESS_SET, [TAG, 80]);
    expect(alle<{ progress: number }>('SELECT * FROM daily_challenge')[0]!.progress).toBe(150);
    run(CHALLENGE_PROGRESS_SET, [TAG, 200]);
    expect(alle<{ progress: number }>('SELECT * FROM daily_challenge')[0]!.progress).toBe(200);
  });

  it('haelt den ersten Erfuellungszeitpunkt fest', () => {
    run(CHALLENGE_INSERT, [TAG, 'runden-zwei']);
    run(CHALLENGE_DONE, [TAG, '2026-09-14T18:00:00Z']);
    run(CHALLENGE_DONE, [TAG, '2026-09-14T20:00:00Z']);
    expect(alle<{ done_at: string }>('SELECT * FROM daily_challenge')[0]!.done_at).toBe(
      '2026-09-14T18:00:00Z',
    );
  });

  it('merkt sich das Wegklicken', () => {
    run(CHALLENGE_INSERT, [TAG, 'runden-zwei']);
    run(CHALLENGE_DISMISS, [TAG]);
    expect(alle<{ dismissed: number }>('SELECT * FROM daily_challenge')[0]!.dismissed).toBe(1);
  });
});

/**
 * Grundlage für das Abzeichen „Blindflug" (SPEC.md 8.2).
 *
 * Der Test stand bis zum 2026-09-18 im Block „Bestandene Lektionen je
 * Zeitraum", der mit dem Wochenziel entfallen ist. Er hat damit nichts zu tun
 * und steht jetzt für sich.
 */
describe('Blindmodus — SPEC.md 8.2', () => {
  const runde = (lessonId: string, at: string, passed: number, blind = 0): void => {
    run(SESSION_INSERT, [lessonId, at, 60000, 100, 0, 0, 100, 95, null, 'drill', blind, passed]);
  };

  it('summiert die Zeit im Blindmodus', () => {
    runde('L01', '2026-09-14T10:00:00Z', 1, 1);
    runde('L02', '2026-09-14T10:05:00Z', 1, 0);
    runde('L03', '2026-09-14T10:10:00Z', 1, 1);
    expect(alle<{ ms: number }>(BLIND_MS)[0]!.ms).toBe(120000);
  });
});

describe('Einstellungen — SPEC.md 8.7', () => {
  it('merkt sich Geisterschreiber und Blindmodus', () => {
    run(PROFILE_INSERT, ['', 'maus', '2026-09-14T10:00:00Z', 10, 1, 'hell', 'A2']);
    // Vorgabe: Geist an, Blindmodus aus.
    let p = alle<{ ghost_enabled: number; blind_mode: number }>(PROFILE_SELECT)[0]!;
    expect(p.ghost_enabled).toBe(1);
    expect(p.blind_mode).toBe(0);

    run(SETTINGS_SET, [0, 1]);
    p = alle<{ ghost_enabled: number; blind_mode: number }>(PROFILE_SELECT)[0]!;
    expect(p.ghost_enabled).toBe(0);
    expect(p.blind_mode).toBe(1);
  });
});

describe('Schriftgroesse — SPEC.md 12.2', () => {
  it('beginnt bei normal', () => {
    run(PROFILE_INSERT, ['', 'maus', '2026-09-16T10:00:00Z', 10, 1, 'hell', 'A2']);
    expect(alle<{ font_scale: string }>(PROFILE_SELECT)[0]!.font_scale).toBe('normal');
  });

  it('laesst sich mit den uebrigen Einstellungen speichern', () => {
    run(PROFILE_INSERT, ['', 'maus', '2026-09-16T10:00:00Z', 10, 1, 'hell', 'A2']);
    run(PROFILE_EINSTELLUNGEN_SET, ['Mia', 'A1', 15, 'dunkel', 0, 0, 1, 'sehr-gross']);

    const p = alle<{
      name: string;
      age_band: string;
      daily_goal_min: number;
      theme: string;
      ai_enabled: number;
      ghost_enabled: number;
      blind_mode: number;
      font_scale: string;
    }>(PROFILE_SELECT)[0]!;

    expect(p.name).toBe('Mia');
    expect(p.age_band).toBe('A1');
    expect(p.daily_goal_min).toBe(15);
    expect(p.theme).toBe('dunkel');
    expect(p.ai_enabled).toBe(0);
    expect(p.ghost_enabled).toBe(0);
    expect(p.blind_mode).toBe(1);
    expect(p.font_scale).toBe('sehr-gross');
  });

  /**
   * Das Onboarding ist nach den Einstellungen nicht erneut zu durchlaufen
   * (SPEC.md 8.12). Die Einstellungen duerfen `onboarded_at` also nicht
   * ueberschreiben.
   */
  it('laesst das Onboarding-Datum unangetastet', () => {
    run(PROFILE_INSERT, ['', 'maus', '2026-09-16T10:00:00Z', 10, 1, 'hell', 'A2']);
    run(PROFILE_UPDATE, ['Mia', 'A2', 10, '2026-09-16T11:00:00Z']);
    run(PROFILE_EINSTELLUNGEN_SET, ['Mia', 'A1', 15, 'dunkel', 0, 0, 1, 'gross']);
    expect(alle<{ onboarded_at: string }>(PROFILE_SELECT)[0]!.onboarded_at).toBe(
      '2026-09-16T11:00:00Z',
    );
  });
});

/**
 * Das Leeren eines Platzes (SPEC.md 5.1).
 *
 * **Warum das geprüft wird.** Jedes Kind hat eine eigene Datenbankdatei, und
 * beim Löschen wird zeilenweise geleert, nicht die Datei entfernt. Eine
 * vergessene Tabelle hieße: Das nächste Kind auf diesem Platz erbt die
 * Abzeichen, die Serie oder das Fehlerprofil des vorigen. Das fiele niemandem
 * auf — es sähe nur nach einem Kind aus, das erstaunlich weit ist.
 */
describe('PLATZ_LEEREN — SPEC.md 5.1', () => {
  /** Die Tabellen, die die Migrationen wirklich anlegen. */
  function tabellenAusMigrationen(): string[] {
    const namen = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all() as { name: string }[];
    return namen.map((r) => r.name);
  }

  it('nennt jede Tabelle, die es gibt', () => {
    const geleert = PLATZ_LEEREN.map((s) => s.replace('DELETE FROM ', '').trim()).sort();
    expect(geleert).toEqual(tabellenAusMigrationen());
  });

  it('nennt keine Tabelle doppelt', () => {
    const geleert = PLATZ_LEEREN.map((s) => s.replace('DELETE FROM ', '').trim());
    expect(new Set(geleert).size).toBe(geleert.length);
  });

  /**
   * Der eigentliche Beweis: erst füllen, dann leeren, dann nachzählen.
   * Eine Anweisung, die sich gegen das echte Schema nicht ausführen lässt,
   * fällt hier ebenfalls auf.
   */
  it('lässt nach dem Leeren nichts stehen', () => {
    const jetzt = new Date().toISOString();
    run(PROFILE_INSERT, ['Kind', 'maus', jetzt, 10, 1, 'hell', 'A2']);
    run(LESSON_UNLOCK, ['L01']);
    run(SESSION_INSERT, ['L01', jetzt, 60000, 300, 2, 0.6, 180, 96, null, 'seed', 0, 1]);
    run(CHAR_STATS_UPSERT, ['f', 10, 1, 200, jetzt]);
    run('INSERT INTO rewards (id, earned_at) VALUES ($1, $2)', ['grundstellung', jetzt]);
    run('INSERT INTO xp (id, total) VALUES (1, $1)', [500]);

    for (const anweisung of PLATZ_LEEREN) db.exec(anweisung);

    for (const tabelle of tabellenAusMigrationen()) {
      const n = db.prepare(`SELECT COUNT(*) AS n FROM ${tabelle}`).get() as { n: number };
      expect(n.n, `${tabelle} ist nicht leer`).toBe(0);
    }
  });
});
