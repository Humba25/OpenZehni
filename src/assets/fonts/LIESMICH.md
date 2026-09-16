# Mitgelieferte Schriften

Zehni bindet seine Schriften **lokal** ein. Keine Web-Fonts, keine
CDN-Einbindung (`ARCHITEKTUR.md`) — die App muss ohne Internet identisch
aussehen, und niemand soll beim Tippenlernen nebenbei eine Verbindung zu einem
Schriftenanbieter aufbauen.

## Atkinson Hyperlegible

| | |
|---|---|
| Herkunft | Braille Institute of America |
| Bezugsquelle | https://github.com/googlefonts/atkinson-hyperlegible |
| Lizenz | SIL Open Font License 1.1 — [`OFL-AtkinsonHyperlegible.txt`](OFL-AtkinsonHyperlegible.txt) |
| Verwendung | Oberfläche und alle Lesetexte |

Eigens für Menschen mit eingeschränktem Sehvermögen entworfen. Die Buchstaben
sind an den Stellen unterschieden, an denen übliche Schriften sich ähneln —
großes `I`, kleines `l` und die `1` sind eindeutig auseinanderzuhalten, ebenso
`0` und `O`. Für ein Programm, in dem Kinder Zeichen von der Vorlage abtippen,
ist das keine Geschmacksfrage (`SPEC.md` 12.2).

## JetBrains Mono

| | |
|---|---|
| Herkunft | JetBrains s.r.o. |
| Bezugsquelle | https://github.com/JetBrains/JetBrainsMono |
| Lizenz | SIL Open Font License 1.1 — [`OFL-JetBrainsMono.txt`](OFL-JetBrainsMono.txt) |
| Verwendung | Übungstexte, Drillzeilen, Minispiele |

Dicktengleich: Jedes Zeichen ist gleich breit. Dadurch springt der Cursor beim
Tippen nicht, und die Vorlage steht still — was beim Abtippen den Unterschied
macht.

## Was mitgeliefert werden muss

Die SIL Open Font License erlaubt Weitergabe und Einbettung ohne Gebühr. Sie
verlangt dafür, dass der **Lizenztext mitgeliefert** wird und die Schriften
nicht unter ihrem ursprünglichen Namen verändert weitergegeben werden. Beide
Lizenztexte liegen deshalb unverändert in diesem Ordner und werden mit
ausgeliefert.

Nur die Schnitte *Regular* und *Bold* sind dabei. Kursive Schnitte werden
nirgends benutzt; sie mitzuliefern hieße, den Installer ohne Gegenwert
aufzublähen.
