-- Zehni, zweite Migration: Ergebnis der Tastaturprüfung (SPEC.md 7.4).
--
-- ACHTUNG: 0001_initial.sql wird dabei NICHT angefasst. Eine ausgelieferte
-- Migration zu ändern zerstört die Datenbanken aller, die sie schon ausgeführt
-- haben (CLAUDE.md, Architekturregel 3).

-- Wann die Tastaturbelegung zuletzt als T1 bestaetigt wurde.
-- NULL heisst: noch nie geprueft -> der Lernpfad bleibt gesperrt.
--
-- Gespeichert wird nur der Zeitstempel, nicht was getippt wurde. Die Pruefung
-- laeuft ueber vier vorgegebene Zeichen; sie zu speichern brächte nichts und
-- waere unnoetige Datenhaltung.
ALTER TABLE profile ADD COLUMN layout_verified_at TEXT;
