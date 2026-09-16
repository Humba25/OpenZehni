# Zehni — Didaktik

> Herleitung des Lernpfads. Verbindlich ist, was in `NORMEN.md` und `SPEC.md` 6
> steht — diese Datei erklärt das **Warum** dahinter, damit niemand eine
> begründete Entscheidung später für eine Nachlässigkeit hält und „korrigiert".
>
> Rangfolge bei Widerspruch: **Nutzeranweisung → `NORMEN.md` → `SPEC.md` →
> `ARCHITEKTUR.md`.** Diese Datei steht unterhalb davon: Wenn sie einer der drei
> widerspricht, ist sie falsch und wird angepasst, nicht umgekehrt.
>
> Stand: 2026-09-12

---

## 1. Was hier genormt ist und was nicht

Das ist die wichtigste Unterscheidung des ganzen Dokuments, weil ihre Verletzung
eine unverhandelbare Regel bricht (`ARCHITEKTUR.md`: „Keine Norm behaupten, die wir
nicht einhalten").

| Gegenstand | Status |
|---|---|
| Tastaturbelegung **T1** | **Genormt** — DIN 2137-1:2023-08 |
| Zählweise von Anschlägen, Fehlern, Fehlerquote | **Regelwerk** — Wettschreibordnung, 10-Minuten-Abschrift (`NORMEN.md` 4) |
| Schreib- und Gestaltungsregeln der ausgegebenen Texte | **Genormt** — DIN 5008:2020-03 |
| Zuordnung Finger → Taste | **Konvention.** In allen deutschen Lehrwerken gleich, aber nicht genormt |
| Reihenfolge, in der die Tasten eingeführt werden | **Eigene Entscheidung.** Nicht genormt, hier begründet |
| Bestehenskriterien und Sterne | **Eigene Entscheidung**, abgeleitet aus den amtlichen Fehlergrenzen |
| Altersstufen `A1`–`A3` | **Eigene Entscheidung** |

In der Oberfläche darf nichts aus den unteren vier Zeilen als Norm ausgegeben
werden (`NORMEN.md` 3.2 und 8). Zehni ist außerdem nicht zertifiziert, und das
Diplom ist eine Selbstprüfung.

---

## 2. Der Fingersatz

### 2.1 Die Zuordnung

Übernommen aus der gängigen Lehrpraxis, unverändert (`SPEC.md` 6.1). Jeder
Finger bekommt eine Ausgangstaste in der Grundstellung und von dort aus eine
schräge Spur nach oben und unten.

| Finger | Tasten |
|---|---|
| Links klein | `a` `q` `y` `1` `<` |
| Links Ring | `s` `w` `x` `2` |
| Links Mitte | `d` `e` `c` `3` |
| Links Zeige | `f` `r` `v` `g` `t` `b` `4` `5` |
| Daumen | Leertaste |
| Rechts Zeige | `j` `u` `m` `h` `z` `n` `6` `7` |
| Rechts Mitte | `k` `i` `,` `8` |
| Rechts Ring | `l` `o` `.` `9` |
| Rechts klein | `ö` `ä` `ü` `p` `ß` `-` `0` und alle Sondertasten rechts |

### 2.2 Warum die Zeigefinger mehr Tasten bekommen

Sie sind die kräftigsten und beweglichsten Finger und können als einzige
zuverlässig eine Spalte nach innen greifen (`g` und `h`). Die kleinen Finger
sind die schwächsten und ungenauesten — sie bekommen trotzdem viele Tasten, weil
rechts außen die Umlaute und Sonderzeichen liegen. Das ist kein Entwurfsfehler
der Belegung, sondern eine Folge davon, dass T1 aus der Schreibmaschine
hervorgegangen ist.

Praktische Folge für Zehni: Die Lektionen mit kleinen Fingern (`L04`, `L11`,
`L12`, `L19`) sind erfahrungsgemäß die zähen. Sie bekommen deshalb **keine**
höheren Ziele als ihre Nachbarn, und die adaptive Wiederholung (Abschnitt 6)
greift dort besonders oft.

### 2.3 Die Umschalttaste ist immer die gegengleiche

Ein `A` wird mit dem linken kleinen Finger getippt — also mit der **rechten**
Umschalttaste. Das ist die häufigste hartnäckige Fehlgewohnheit überhaupt: Wer
beide Zeichen mit derselben Hand nimmt, verlässt die Grundstellung und kommt
nicht mehr sauber zurück.

Deshalb zeigt die Tastaturgrafik bei jedem Umschalt-Zeichen **beide** Tasten
(`SPEC.md` 7.3), und die Umschalttaste bekommt in `L20` eine ganze eigene
Lektion, statt nebenbei mitzulaufen.

---

## 3. Die Reihenfolge der Lektionen

### 3.1 Der Grundgedanke

Drei Bedingungen, die gleichzeitig gelten müssen:

1. **Die Grundstellung zuerst.** Alles andere wird relativ zu ihr gegriffen. Wer
   sie nicht blind findet, lernt jede weitere Taste doppelt.
2. **Nie ein ungelerntes Zeichen.** Sobald in einem Übungstext ein Zeichen
   auftaucht, das noch nicht eingeführt wurde, muss das Kind hinsehen — und
   genau das soll es nicht. Das ist die härteste Regel des Projekts und
   betrifft Seed-Texte, Drilltexte und KI-Texte gleichermaßen.
3. **So früh wie möglich echte Wörter.** Sinnlose Buchstabenfolgen sind
   demotivierend. Die Reihenfolge ist deshalb so gewählt, dass früh viele
   deutsche Wörter möglich werden.

Bedingung 2 und 3 ziehen gegeneinander. Die Auflösung steht in 3.3.

### 3.2 Warum diese Paare in dieser Folge

| # | Neu | Begründung |
|---|---|---|
| `L01` | `f` `j` + Leertaste | Die beiden Tasten mit den **Tastnoppen**. Sie sind der einzige Orientierungspunkt, den die Finger ohne Hinsehen finden. Alles beginnt hier. Die Leertaste kommt sofort dazu, weil ohne sie kein Wortabstand möglich ist. |
| `L02` | `d` `k` | Nach innen zu den Zeigefingern benachbart, Mittelfinger. Kurzer Weg, sichere Rückkehr. |
| `L03` | `s` `l` | Ringfinger. |
| `L04` | `a` `ö` | Kleine Finger — die schwächsten zuletzt. Damit ist die Grundstellung vollständig. |
| `L05` | — | Wiederholung. Mit `a s d f j k l ö` sind erste echte Wörter möglich (`also`, `falls`, `alles`, `kalk`). |
| `L06` | `g` `h` | Die Innenspalte. Der Zeigefinger streckt sich zur Seite — eine neue Bewegungsart, deshalb eigene Lektion. `h` macht viele Wörter möglich. |
| `L07` | `e` `i` | Beginn der oberen Reihe mit den **häufigsten Vokalen des Deutschen**. Der Gewinn an möglichen Wörtern ist hier am größten. |
| `L08` | `r` `u` | Zeigefinger oben. |
| `L09` | `t` `z` | Zeigefinger oben mit Streckung — dieselbe Bewegung wie `g`/`h`, eine Reihe höher. |
| `L10` | `w` `o` | Ringfinger oben. |
| `L11` | `q` `p` | Kleine Finger oben. `q` ist im Deutschen selten, `p` häufig. |
| `L12` | `ü` | Rechter kleiner Finger, eine Spalte weiter außen. |
| `L13` | — | Wiederholung. Zwei Reihen zusammen; ab hier ist beinahe alles schreibbar. |
| `L14` | `v` `m` | Beginn der unteren Reihe, wieder mit den Zeigefingern. |
| `L15` | `c` `,` | Mittelfinger unten. Das Komma sitzt in derselben Reihe und wird gleich mitgenommen. |
| `L16` | `x` `.` | Ringfinger unten, Punkt. Ab hier sind vollständige Sätze mit Satzschluss möglich. |
| `L17` | `y` `n` | `y` ist der seltenste Buchstabe im Deutschen und sitzt links außen unten — die unbequemste Taste überhaupt. Sie kommt spät und bekommt Gesellschaft von `n`, damit die Lektion nicht aus einer einzigen Seltenheit besteht. |
| `L18` | `b` `ä` | |
| `L19` | `ß` `-` | Damit sind **alle Buchstaben** eingeführt. |
| `L20` | Umschalt | Siehe 2.3. Eigene Lektion, weil die Bewegung neu ist und der typische Fehler hartnäckig. |
| `L21` | `!` `?` `;` `:` | Satzzeichen, die Umschalt brauchen — direkt nach der Umschalttaste. |
| `L22` | Zahlenreihe | Weit von der Grundstellung entfernt und im Fließtext selten. Deshalb spät. |
| `L23` | `@` `/` `(` `)` `"` | AltGr für `@` — noch eine neue Bewegungsart, deshalb zuletzt. |
| `L24` | — | Fließtext und Tempo. |
| `L25` | — | Abschlusstest (`NORMEN.md` 4.7). |

### 3.3 Warum obere Reihe vor unterer

Zwei Gründe:

1. **Wortausbeute.** Die obere Reihe enthält `e i r u t z w o q p ü` und damit
   fünf der sechs Vokale. Nach `L13` ist fast jedes deutsche Wort ohne Umlaute
   und Satzzeichen schreibbar. Nach derselben Anzahl Lektionen mit der unteren
   Reihe wären es deutlich weniger.
2. **Bewegungsrichtung.** Der Weg nach oben ist für die meisten Hände der
   natürlichere; der Weg nach unten verlangt ein Einrollen der Finger und wird
   häufiger mit einem Handgelenkknick beantwortet.

### 3.4 Die drei Wiederholungslektionen sind Pflicht

`L05`, `L13` und `L24` führen kein neues Zeichen ein. Sie sind trotzdem keine
Zugabe und nicht überspringbar (`SPEC.md` 6.2). Sie sitzen an den drei Stellen,
an denen ein abgeschlossener Abschnitt vorliegt — Grundreihe, zwei Reihen, alles
— und sind der erste Moment, in dem das Kind das Gelernte als Ganzes benutzt
statt als Einzelteile übt.

Zusätzlich sind sie die einzigen frühen Lektionen, in denen **Seed-Texte zum
gewählten Interessenthema** erlaubt sind (siehe 7.2). Sie sind also auch die
inhaltliche Belohnung für den Drill davor.

---

## 4. Blockierend oder fließend — und was das für die Messung bedeutet

### 4.1 Die beiden Modi

- **Blockierend** (Standard `L01`–`L13`): Bei einer falschen Taste rückt der
  Cursor nicht weiter. Die richtige Taste wird auf der Grafik hervorgehoben.
- **Fließend** (ab `L14`, umschaltbar): Fehler werden markiert, der Cursor läuft
  weiter, Korrektur per Rücktaste.

### 4.2 Warum am Anfang blockierend

Am Anfang wird eine **Bewegung** eingeübt, nicht ein Text geschrieben. Läuft der
Cursor nach einem Fehlgriff weiter, hat die Hand die falsche Bewegung einmal
ausgeführt und ist damit ein Stück weit eingeübt worden. Die Sperre sorgt dafür,
dass die letzte Bewegung zu jedem Zeichen die richtige ist.

Ab `L14` kehrt sich das um: Jetzt geht es um Fluss und Tempo, und ständiges
Anhalten zerstört den Rhythmus. Außerdem gehört das Bemerken und Verbessern
eigener Fehler ab hier zur Aufgabe — genau so, wie es die amtliche Zählweise
vorsieht (`NORMEN.md` 4.2: korrigierte Fehler zählen nicht).

### 4.3 Die Folge, die man leicht übersieht

**Im blockierenden Modus ist der Ergebnistext immer fehlerfrei.** Eine falsche
Taste kommt ja gar nicht in den Text. Die amtliche Fehlerquote, die am
Ergebnistext gezählt wird, ist damit in `L01`–`L13` strukturell **0,00 %** — sie
kann dort nichts unterscheiden.

Das war bis zum 2026-09-12 ein Widerspruch in der Spezifikation: `SPEC.md` 6.3
wollte alle Lektionen nach der Fehlerquote bewerten, `SPEC.md` 7.1 machte diese
Quote in der ersten Hälfte des Lernpfads unbrauchbar. Alle dreizehn Lektionen
wären sofort bestanden gewesen.

**Auflösung** (`NORMEN.md` 4.4.1): In `L01`–`L13` vergeben **Sicherheit und
Tempo** die Sterne. Ab `L14` übernimmt die amtliche Fehlerquote. Das Wort
„Fehlerquote" erscheint in `L01`–`L13` nirgends in der Oberfläche, und kein Wert
aus diesen Lektionen wird in eine Aussage über die amtliche Fehlerquote
übersetzt.

### 4.4 Warum das die Trennung der beiden Kennzahlen nicht aufweicht

`NORMEN.md` 4.4 verlangt, dass die Sicherheit nie in eine Bewertung einfließt.
Gemeint ist: nie in etwas, das **wie eine Note aussieht**. Das bleibt gültig —
Diplom, Urkunde, Notenschlüssel und Elternansicht rechnen ausschließlich mit der
amtlichen Fehlerquote und existieren erst ab `L14` beziehungsweise `L25`.

Sterne sind keine Note. Sie sind Trainingsrückmeldung, sie schalten die nächste
Lektion frei, und sie erscheinen nirgends außerhalb der App. Genau dafür ist die
Sicherheit die richtige Zahl.

---

## 5. Bestehenskriterien

### 5.1 Die Werte

**`L01`–`L13`, blockierend — Sterne nach Sicherheit:**

| Lektionen | ★ | ★★ | ★★★ (zusätzlich) |
|---|---|---|---|
| `L01`–`L05` | ≥ 90,0 % | ≥ 95,0 % | ≥ 98,0 % und 60 A/min |
| `L06`–`L13` | ≥ 93,0 % | ≥ 96,0 % | ≥ 98,5 % und 80 A/min |

**Ab `L14`, fließend — Sterne nach amtlicher Fehlerquote:**

| Lektionen | ★ | ★★ | ★★★ (zusätzlich) |
|---|---|---|---|
| `L14`–`L19` | ≤ 1,5 % | ≤ 0,75 % | ≤ 0,375 % und 100 A/min |
| `L20`–`L23` | ≤ 1,0 % | ≤ 0,5 % | ≤ 0,25 % und 120 A/min |
| `L24` | ≤ 0,5 % | ≤ 0,25 % | ≤ 0,125 % und 140 A/min |
| `L25` | Abschlusstest nach `NORMEN.md` 4.7 | | |

### 5.2 Warum die Sicherheitsschwellen milder aussehen

Weil sie es nicht sind. Sicherheit ist die **strengere** Kennzahl: In sie geht
jeder Vertipper ein, auch der sofort verbesserte. Die Fehlerquote verzeiht ihn.
Wer die alten Werte eins zu eins überträgt (≤ 4,0 % Fehlerquote ⇒ Sicherheit
≥ 96,0 %), verschärft den Einstieg unbemerkt erheblich.

Die Zahlen der ersten beiden Stufen sind **Erfahrungswerte ohne
Datengrundlage**. Sie liegen an einer Stelle im Code (`lib/curriculum.ts`) und
gehören nachjustiert, sobald echte Sitzungen vorliegen. Wer sie ändert, ändert
sie dort und nirgends sonst.

### 5.3 Warum ★ schon freischaltet

Die nächste Lektion öffnet bereits bei einem Stern. Perfektion darf den
Fortschritt nicht blockieren: Ein Kind, das in `L03` feststeckt, hört auf. Die
Staffelung sorgt ohnehin dafür, dass die Ansprüche steigen, und die adaptive
Wiederholung holt Schwächen später zurück — sie bleiben also nicht liegen, sie
blockieren nur nicht.

### 5.4 Warum die Zielwerte an 0,5 % heranführen

0,5 % ist die zulässige Fehlergrenze im Schnellschreiben und die Anforderung des
Abschlusstests (`NORMEN.md` 4.6, 4.7). Von 4,0 % in `L01` bis 0,5 % in `L24` in
fünf Stufen — jede Stufe ist erreichbar, und am Ende steht ein Wert, der
außerhalb von Zehni etwas bedeutet.

Ausdrücklich **keine** Prozentangaben zur „Genauigkeit". 92 % Genauigkeit klingt
gut und entspräche 8 % Fehlerquote — dem Sechzehnfachen der Wettbewerbsgrenze.
Solche Zahlen sind mit nichts vergleichbar und wurden deshalb abgeschafft
(`NORMEN.md` 4.8).

---

## 6. Adaptive Wiederholung

Nach jeder Lektion bestimmt `lib/scheduler.ts` die drei schwächsten Zeichen aus
`char_stats`, gewichtet nach `misses / (hits + misses)` mal durchschnittlicher
Latenz. Beide Faktoren zusammen, weil ein Zeichen auf zwei Arten schlecht sitzen
kann: Man trifft es falsch, oder man trifft es richtig, aber erst nach
Nachdenken. Das zweite ist der Vorbote des ersten.

Diese Zeichen erscheinen häufiger im nächsten Übungstext und im 20-Sekunden-
Aufwärmen der nächsten Einheit. Sichtbar gemacht wird das durch die
**Tastenjagd** (`SPEC.md` 8.9).

**Eine Schwäche wird erst ab zwölf Anschlägen auf diesem Zeichen benannt.**
Darunter sagt die App nichts darüber. Das ist dieselbe Regel, die
`MODUL-LERNEN.md` 1.1 für jede Aussage über die Nutzerin aufstellt: Was über sie
behauptet wird, muss ihren eigenen Daten entnommen sein. Eine Jagd auf ein
Zeichen, das sie zweimal verhauen hat, ist eine erfundene Schwäche.

---

## 7. Woher der Übungstext kommt

### 7.1 Das Problem

Die Zeichensatzstufen `S1`–`S5` fassen ganze Lektionsblöcke zusammen, die Regel
„kein ungelerntes Zeichen" gilt aber je Lektion. Beides deckt sich nur in neun
von 25 Lektionen (`SPEC.md` 9.7):

| Deckungsgleich | Enger als die Stufe |
|---|---|
| `L04` `L05` `L12` `L13` `L19` `L21` `L23` `L24` `L25` | `L01`–`L03`, `L06`–`L11`, `L14`–`L18`, `L20`, `L22` |

In `L01` sind `f`, `j` und die Leertaste gelernt. Jeder `S1`-Seed-Text enthält
darüber hinaus `a s d k l ö`. Offline stünde dort also kein zulässiger Text zur
Verfügung.

### 7.2 Die Lösung

- **Neun Lektionen** ziehen Texte zum gewählten Interessenthema aus der
  Seed-Datenbank. Das sind die inhaltlich belohnenden Lektionen, darunter alle
  drei Wiederholungslektionen.
- **Sechzehn Lektionen** bekommen lokal erzeugte Drilltexte aus `lib/drill.ts` —
  deterministisch, nur aus dem Vorrat der Lektion, mit den neuen Zeichen bei
  rund 40 % der Anschläge.
- Die KI kann beides besser, weil `allowedChars` je Lektion exakt gesetzt wird.
  Sie ist aber optional und darf nie Voraussetzung sein.

### 7.3 Silben vor Zufall

Wo der Vorrat einen Vokal enthält, werden Konsonant-Vokal-Muster gebildet:
`falls`, `kalk`, `dasa`. Aussprechbare Silben lassen sich als Einheit greifen,
Zufallsbuchstaben nicht.

`L01`–`L03` haben **keinen Vokal** (`f j`, dann `d k`, dann `s l`). Dort sind
rhythmische Gruppen (`fff jjj fjf jfj`) das einzig Mögliche — und in
Tipptrainern die übliche Form. Der Rhythmus selbst ist hier der Lerngegenstand.

---

## 8. Altersstufen

Ein Neunjähriger braucht andere Texte als eine Zwölfjährige — gleiche Tasten,
andere Sprache. Zehni führt dafür drei Stufen (`SPEC.md` 9.8):

| ID | Alter | Sätze | Ton |
|---|---|---|---|
| `A1` | 8–10 | 6–12 Wörter, Hauptsätze | Konkret, bildhaft, kein unerklärtes Fachwort |
| `A2` | 11–13 | 10–18 Wörter, Nebensätze erlaubt | Sachlich mit Zahlen und Vergleichen |
| `A3` | ab 14 | 12–25 Wörter | Sachlich, keine Kindersprache, keine Verniedlichung |

Was sich **nicht** ändert: Lektionsreihenfolge, Fingersatz, Zeichensatzstufen,
Bestehenskriterien, alle Normen. Ein Anschlag ist in jedem Alter ein Anschlag.

Was sich ändert: Wortschatz, Satzlänge, Themenbehandlung, die Sprüche des
Maskottchens.

`S1` und `S2` sind Silbendrills und tragen `"age": "alle"` — an „fad ledert das
Gras" ist nichts alterstypisch. Erst ab `S3` wird unterschieden.

**Vollbestand ist `A2`**, weil es die Kernzielgruppe ist. `A1` und `A3` dürfen
lückenhaft bleiben; fehlt eine Zelle, greift stumm die Nachbarstufe. Ein Text
wird nie wegen der Altersstufe verweigert — offline muss immer etwas da sein.

---

## 9. Was bewusst nicht gemacht wird

- **Kein Lerntypentest, keine Lerntypen-Lehre.** Die Zuordnung von Unterricht zu
  „visuellen" oder „auditiven" Lerntypen ist wissenschaftlich nicht belegt
  (`MODUL-LERNEN.md` 3). Zehni behauptet so etwas nicht.
- **Keine Schulnoten für das Kind.** Der Notenschlüssel wird intern gerechnet
  und in Sterne und Klartext übersetzt. In der Elternansicht darf die Note
  stehen (`NORMEN.md` 4.6).
- **Keine Bestrafungsmechanik.** Keine Leben, kein Countdown, der eine Übung
  abbricht, kein Fehlerton, kein Zwangsdialog beim Start.
- **Keine Wirkungsversprechen.** Kein Satz über weniger Rechtschreibfehler oder
  bessere Konzentration als Folge des Tippenlernens. Solche Behauptungen stehen
  im Werbematerial des Vergleichsangebots ohne Quellenangabe —
  Zehni übernimmt sie nicht.
- **Keine erfundenen Fortschrittszahlen.** Jede Aussage über das Lernen der
  Nutzerin wird mit ihren echten Daten belegt oder gar nicht gemacht. Unter
  fünf Sitzungen zeigt das Modul „Lernen lernen" seine neutrale Fassung
  (`MODUL-LERNEN.md` 1.1, 7).

---

## 10. Was offen ist

1. **Die Sicherheitsschwellen aus 5.1** sind Erfahrungswerte. Nach den ersten
   echten Sitzungen prüfen: Bleibt jemand in `L01`–`L03` hängen, sind sie zu
   hoch; gibt es reihenweise ★★★ im ersten Versuch, zu niedrig.
2. **Ergonomie und Sitzhaltung** sind bisher nur eine Pausenerinnerung. Eine
   kurze eigene Einheit würde einen echten Nachteil gegenüber einem betreuten
   Präsenzkurs verkleinern (`SPEC.md` 15.9).
3. **Der Blindmodus ab `L05`** ist als Angebot mit Bonus-XP vorgesehen. Ob das
   für die Zielgruppe reizvoll genug ist, muss sich zeigen.
4. **Der Anteil neuer Zeichen im Drill** (rund 40 %) ist geschätzt. Zu hoch
   wirkt monoton, zu niedrig übt zu wenig.
