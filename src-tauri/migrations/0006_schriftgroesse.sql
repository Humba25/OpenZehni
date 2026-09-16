-- Zehni, sechste Migration: Schriftgroesse (SPEC.md 12.2).
--
-- ACHTUNG: 0001 bis 0005 werden nicht angefasst (ARCHITEKTUR.md, Architekturregel 3).
--
-- Drei Stufen, gespeichert als Text: normal | gross | sehr-gross. Sie setzt die
-- Schriftgroesse der Wurzel; die ganze Oberflaeche rechnet in rem und waechst
-- deshalb mit. Ein Wert statt vieler Schalter -- wer groessere Schrift braucht,
-- braucht sie ueberall.
ALTER TABLE profile ADD COLUMN font_scale TEXT NOT NULL DEFAULT 'normal';
