-- Zehni, erste Migration. Datenmodell nach SPEC.md 5.
--
-- ACHTUNG: Bestehende Migrationen werden nie verändert (CLAUDE.md,
-- Architekturregel 3). Jede Schemaänderung ist eine neue Datei mit der
-- nächsten Nummer. Wer hier etwas korrigiert, zerstört die Datenbanken aller,
-- die diese Migration schon ausgeführt haben.

-- Profil. In v1 gibt es genau eine Zeile mit id = 1.
CREATE TABLE IF NOT EXISTS profile (
  id             INTEGER PRIMARY KEY,
  name           TEXT    NOT NULL,
  avatar         TEXT    NOT NULL DEFAULT 'maus',
  created_at     TEXT    NOT NULL,
  daily_goal_min INTEGER NOT NULL DEFAULT 10,
  ai_enabled     INTEGER NOT NULL DEFAULT 1,
  theme          TEXT    NOT NULL DEFAULT 'hell',
  -- Altersstufe A1 | A2 | A3 (SPEC.md 9.8). Gespeichert wird die Stufe,
  -- nie ein Geburtsdatum -- fuer die Textauswahl genuegt sie (SPEC.md 12.3).
  age_band       TEXT    NOT NULL DEFAULT 'A2'
);

-- Gewaehlte Interessen, Mehrfachauswahl aus den zehn Themen (SPEC.md 9.1).
CREATE TABLE IF NOT EXISTS interests (
  topic_id TEXT    NOT NULL PRIMARY KEY,
  weight   INTEGER NOT NULL DEFAULT 1   -- 2 = Lieblingsthema
);

-- Fortschritt je Lektion.
CREATE TABLE IF NOT EXISTS lesson_progress (
  lesson_id        TEXT    PRIMARY KEY,
  status           TEXT    NOT NULL,           -- locked | unlocked | passed
  stars            INTEGER NOT NULL DEFAULT 0, -- 0..3
  best_strokes_min REAL,
  -- Bestwert der Kennzahl, nach der diese Lektion bewertet wird:
  -- L01-L13 die Sicherheit, ab L14 die amtliche Fehlerquote (NORMEN.md 4.4.1).
  best_error_rate  REAL,
  best_safety      REAL,
  attempts         INTEGER NOT NULL DEFAULT 0,
  last_played      TEXT
);

-- Jede einzelne Uebungsrunde. Grundlage aller Statistiken und aller Aussagen
-- des Moduls "Lernen lernen" (MODUL-LERNEN.md 1.1).
CREATE TABLE IF NOT EXISTS sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id     TEXT    NOT NULL,
  started_at    TEXT    NOT NULL,
  duration_ms   INTEGER NOT NULL,   -- aktive Zeit, tote Zeit abgezogen (SPEC.md 7.1)
  strokes_total INTEGER NOT NULL,   -- Anschlaege nach NORMEN.md 4.1, Umschalt zaehlt mit
  errors        INTEGER NOT NULL,   -- Fehler am Ergebnistext nach NORMEN.md 4.2
  error_rate    REAL    NOT NULL,   -- Fehlerquote in Prozent nach NORMEN.md 4.3
  strokes_min   REAL    NOT NULL,   -- Anschlaege pro Minute nach NORMEN.md 4.5
  first_try_pct REAL    NOT NULL,   -- "Sicherheit" nach NORMEN.md 4.4, nie eine Note
  topic_id      TEXT,
  source        TEXT    NOT NULL    -- ai | seed | cache | drill
);

CREATE INDEX IF NOT EXISTS idx_sessions_lesson ON sessions (lesson_id, started_at);

-- Fehlerprofil je Zeichen. Grundlage der adaptiven Wiederholung (SPEC.md 6.4)
-- und der Tastenjagd (SPEC.md 8.9).
CREATE TABLE IF NOT EXISTS char_stats (
  char           TEXT PRIMARY KEY,
  hits           INTEGER NOT NULL DEFAULT 0,
  misses         INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms REAL,
  updated_at     TEXT
);

-- Haeufigste Verwechslungen: erwartet -> getippt.
CREATE TABLE IF NOT EXISTS confusions (
  expected TEXT    NOT NULL,
  typed    TEXT    NOT NULL,
  count    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (expected, typed)
);

-- Gamification (SPEC.md 8).
CREATE TABLE IF NOT EXISTS rewards (
  id        TEXT PRIMARY KEY,   -- Abzeichen-ID
  earned_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS streak (
  id           INTEGER PRIMARY KEY CHECK (id = 1),
  current_days INTEGER NOT NULL DEFAULT 0,
  longest_days INTEGER NOT NULL DEFAULT 0,
  last_day     TEXT,
  freezes_left INTEGER NOT NULL DEFAULT 2   -- zwei Joker je Monat (SPEC.md 8.3)
);

CREATE TABLE IF NOT EXISTS xp (
  id    INTEGER PRIMARY KEY CHECK (id = 1),
  total INTEGER NOT NULL DEFAULT 0
);

-- Tagesaufgabe (SPEC.md 8.6). Eine Zeile je Tag. Verpasst bleibt done_at NULL --
-- es gibt keinen Zaehler verpasster Tage und keine Meldung darueber.
CREATE TABLE IF NOT EXISTS daily_challenge (
  day          TEXT    PRIMARY KEY,   -- ISO-Datum
  challenge_id TEXT    NOT NULL,
  progress     INTEGER NOT NULL DEFAULT 0,
  done_at      TEXT,
  dismissed    INTEGER NOT NULL DEFAULT 0
);

-- Wochenziel (SPEC.md 8.8). Das Ziel steigt nie um mehr als eins, damit aus
-- der Motivation keine Tretmuehle wird.
CREATE TABLE IF NOT EXISTS weekly_goal (
  week         TEXT    PRIMARY KEY,   -- ISO-Kalenderwoche, z. B. 2026-W37
  target       INTEGER NOT NULL,
  progress     INTEGER NOT NULL DEFAULT 0,
  reward_given INTEGER NOT NULL DEFAULT 0
);

-- Textcache, KI-generiert und Seed gleichermassen (SPEC.md 9.5, 9.6).
CREATE TABLE IF NOT EXISTS text_cache (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id    TEXT    NOT NULL,
  charset_key TEXT    NOT NULL,   -- deterministischer Schluessel des Zeichensatzes
  level       INTEGER NOT NULL,   -- Lesestufe aus Lektion und Altersstufe (SPEC.md 9.8)
  age_band    TEXT    NOT NULL DEFAULT 'alle',
  body        TEXT    NOT NULL,
  source      TEXT    NOT NULL,   -- ai | seed
  used_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cache_lookup
  ON text_cache (topic_id, charset_key, level, age_band);
