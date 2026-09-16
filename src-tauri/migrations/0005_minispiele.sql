-- Zehni, fuenfte Migration: gespielte Minispiele je Tag (SPEC.md 8.10).
--
-- ACHTUNG: 0001 bis 0004 werden nicht angefasst (ARCHITEKTUR.md, Architekturregel 3).
--
-- Gezaehlt wird ausschliesslich, um die XP-Deckelung aus SPEC.md 8.1 umzusetzen:
-- hoechstens dreimal je Tag gibt es XP fuers Minispiel. Die Deckelung ist
-- Absicht -- XP sollen dem Lernpfad folgen, nicht der Spielzeit.
--
-- Was hier NICHT steht und auch nie hierher gehoert: Punktzahlen, Bestwerte,
-- Dauer. Kein Ergebnis eines Minispiels fliesst in eine Bewertung ein
-- (SPEC.md 8.10). Wer dieser Tabelle eine Spalte fuer Punkte hinzufuegt, hebt
-- diese Zusage auf.
CREATE TABLE IF NOT EXISTS minigame_plays (
  day   TEXT    PRIMARY KEY,   -- ISO-Datum
  plays INTEGER NOT NULL DEFAULT 0
);
