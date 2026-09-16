-- Zehni, dritte Migration: Onboarding und Gamification (SPEC.md 8).
--
-- ACHTUNG: 0001 und 0002 werden nicht angefasst (CLAUDE.md, Architekturregel 3).

-- Wann das Onboarding durchlaufen wurde. NULL heisst: noch nie.
-- Ohne diese Spalte liesse sich "schon eingerichtet" nicht von "Name absichtlich
-- leer gelassen" unterscheiden.
ALTER TABLE profile ADD COLUMN onboarded_at TEXT;

-- Fortschritt in den Zwischenstuecken und Modulen (SPEC.md 6.6).
--
-- ACHTUNG: Hier stehen zwei Wahrheitswerte und ein Datum, sonst nichts. Was das
-- Kind in einer Falle eingetippt hat, wird NIE gespeichert (SPEC.md 6.6.1,
-- Regel 3). Wer dieser Tabelle eine Spalte fuer Eingaben hinzufuegt, hebt die
-- Zusage auf, die in der Elternansicht steht.
CREATE TABLE IF NOT EXISTS module_progress (
  unit_id      TEXT PRIMARY KEY,
  completed    INTEGER NOT NULL DEFAULT 0,
  recognized   INTEGER,
  completed_at TEXT
);

-- Taegliche Uebungszeit. Grundlage fuer Tagesziel, Serie und das Abzeichen
-- "ausdauer" (SPEC.md 8.3). Eine Zeile je Tag.
CREATE TABLE IF NOT EXISTS daily_activity (
  day        TEXT PRIMARY KEY,
  active_ms  INTEGER NOT NULL DEFAULT 0,
  goal_met   INTEGER NOT NULL DEFAULT 0
);
