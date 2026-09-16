-- Zehni, vierte Migration: Blindmodus, Geisterschreiber und die Zahlen, die
-- Tagesaufgabe und Wochenziel brauchen (SPEC.md 8.6 bis 8.9).
--
-- ACHTUNG: 0001 bis 0003 werden nicht angefasst (ARCHITEKTUR.md, Architekturregel 3).
--
-- Die Tabellen daily_challenge und weekly_goal gibt es bereits seit 0001. Hier
-- fehlen nur die Angaben an der Runde selbst.

-- Wurde diese Runde im Blindmodus getippt (SPEC.md 8.1)?
-- Grundlage fuer den XP-Bonus von 20 Prozent und fuer das Abzeichen "blindflug"
-- (10 Minuten im Blindmodus, SPEC.md 8.2).
ALTER TABLE sessions ADD COLUMN blind INTEGER NOT NULL DEFAULT 0;

-- Wurde die Lektion in dieser Runde bestanden?
--
-- Stand bisher nur in lesson_progress, dort aber ohne Datum der einzelnen
-- Runde. Das Wochenziel (SPEC.md 8.8) zaehlt die Lektionen einer Kalenderwoche
-- und braucht deshalb den Zeitbezug. Gezaehlt werden verschiedene Lektionen,
-- nicht Runden -- wer L01 fuenfmal wiederholt, hat nicht fuenf Lektionen
-- geschafft.
ALTER TABLE sessions ADD COLUMN passed INTEGER NOT NULL DEFAULT 0;

-- Der Geisterschreiber laesst sich abschalten (SPEC.md 8.7). Standardmaessig an;
-- im Abschlusstest L25 ist er unabhaengig davon immer aus (NORMEN.md 4.7), das
-- entscheidet lib/geist.ts und nicht diese Spalte.
ALTER TABLE profile ADD COLUMN ghost_enabled INTEGER NOT NULL DEFAULT 1;

-- Zuletzt gewaehlter Blindmodus. Standardmaessig aus: Wer gerade erst anfaengt,
-- braucht die Tastaturgrafik.
ALTER TABLE profile ADD COLUMN blind_mode INTEGER NOT NULL DEFAULT 0;
