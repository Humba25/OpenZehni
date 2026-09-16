# scripts/

Prüfskripte, die auch in der CI laufen. Aufruf über npm:

```bash
npm run validate:seed          # alle Seed-Texte
npm run validate:seed -- tiere # nur ein Thema
npm run check:din5008          # alle ausgegebenen Texte
```

| Datei | Prüft |
|---|---|
| `validate-seed.ts` | `content/topics.seed.json` mit **derselben** `validateText()`-Funktion, die auch KI-Antworten prüft (`SPEC.md` 9.6): Zeichenvorrat, Länge, Blocklist, Adressen und Nummern, Degeneration, DIN 5008, Schreibweise |
| `check-din5008.ts` | **alle** ausgegebenen Texte gegen DIN 5008 und auf umschriebene Umlaute: Oberfläche (`src/i18n/de.ts`), Lektionstitel, Seed-Texte, Wissenshäppchen |

Beide enden mit Code 1, wenn etwas zu beanstanden ist.

## Was die Skripte **nicht** ersetzen

`npm test` deckt dasselbe ab und läuft schneller — die Prüfungen stehen als
Tests in `src/lib/*.test.ts`. Die Skripte sind für den Fall gedacht, dass
jemand gezielt nur die Inhalte prüfen will, etwa nach dem Schreiben neuer
Seed-Texte, und sie benennen die Fundstellen ausführlicher.

**Wer Seed-Texte schreibt, lässt nach jedem Thema `npm run validate:seed`
laufen.** Von Hand findet man diese Fehler nicht: Am 2026-09-14 hat der Prüfer
eine E-Mail-Adresse in einem Übungstext gefunden, die dort laut `SPEC.md` 9.4
nicht stehen darf, und fünf falsch geschriebene Wörter.

## Historie

Bis zum 2026-09-14 lagen hier zwei PowerShell-Behelfe (`pruefe-seed.ps1`,
`pruefe-lektionen.ps1`). Sie sind entstanden, als weder Node noch Rust
installiert waren, konnten nur den Zeichenvorrat und die Länge prüfen und sind
mit diesen Skripten ersetzt worden.
