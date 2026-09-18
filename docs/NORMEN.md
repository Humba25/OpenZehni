# Zehni — Normative Grundlagen

> Verbindliche Referenz für alles, was Zehni lehrt und misst.
> Ergänzt `SPEC.md`. Bei Widerspruch zwischen SPEC und dieser Datei gewinnt
> **diese Datei**, und die SPEC ist nachzuziehen.
> Stand: 2026-09-12

---

## 1. Warum diese Datei existiert

Zehni wird an ein Kind weitergegeben und ersetzt einen kostenpflichtigen,
professionell entwickelten Kurs. Was wir lehren, muss deshalb dem entsprechen,
was in Deutschland tatsächlich gilt — nicht einer selbst ausgedachten Methode.
Ein Kind, das mit Zehni lernt, soll ohne Umlernen an einem Schulwettbewerb,
einer kaufmännischen Ausbildung oder einer IHK-Prüfung anschlussfähig sein.

Zugleich gilt intellektuelle Ehrlichkeit: **nicht alles am Tastschreiben ist
genormt.** Diese Datei trennt sauber zwischen

- **[NORM]** — in einer DIN oder einem verbindlichen Regelwerk festgelegt,
- **[REGELWERK]** — in einer Wettbewerbs-/Prüfungsordnung festgelegt,
- **[RAHMEN]** — bildungspolitischer Referenzrahmen (KMK, EU, Land),
- **[KONVENTION]** — fachlich etabliert, aber nirgends normiert.

---

## 2. Überblick der Regelwerke

| Regelwerk | Fassung | Regelt für Zehni | Status |
|---|---|---|---|
| **DIN 2137-1** | 2023-08 | Tastaturbelegung T1 (dt. Standardtastatur), dazu E1/E2 | [NORM] |
| **DIN 2137-2** | 2018-12 | Zusätzliche Anforderungen an Tastaturen | [NORM] |
| **DIN 5008** | 2020-03 | Schreib- und Gestaltungsregeln für Text- und Informationsverarbeitung | [NORM] |
| **Wettschreibordnung DStB** | Beschluss 27.11.2022 | Texterfassung: Anschlagszählung, Fehlerbewertung, Leistungsklassen | [REGELWERK] |
| **Bundesjugendschreiben (BJCKM)** | laufend | Mindestleistung der 10-Minuten-Abschrift für Jugendliche | [REGELWERK] |
| **KMK „Bildung in der digitalen Welt"** | 2016, fortgeschr. 2021 | Sechs Kompetenzbereiche der Medienbildung | [RAHMEN] |
| **DigComp 2.2 (EU)** | 2022 | Europäischer Referenzrahmen digitaler Kompetenzen | [RAHMEN] |
| **Thüringer Kursplan Medienkunde Kl. 5–10** | Schulportal Thüringen | Landesvorgabe; Doppelklassenstufen 5/6, 7/8, 9/10, mind. 2 Jahreswochenstunden, fachintegriert | [RAHMEN] |
| Lektionsreihenfolge, Fingersatz-Zuordnung | — | **nicht genormt**, siehe 3.2 | [KONVENTION] |

---

## 3. Tastatur und Fingersatz

### 3.1 Tastaturbelegung [NORM]

Zehni setzt die deutsche Standardbelegung **T1 nach DIN 2137-1:2023-08**
voraus. E1 und E2 (die 2023 die früheren T2/T3 ersetzt haben) werden nicht
unterstützt und müssen auch nicht unterstützt werden — sie sind auf
Endanwendergeräten praktisch nicht anzutreffen.

Konsequenzen für die Umsetzung:

- Die Tastaturgrafik bildet **T1** ab, nicht ein amerikanisches Layout mit
  deutschen Beschriftungen.
- Die Layout-Erkennung im Onboarding (SPEC 7.4) prüft auf T1: `z`, `ö`, `ß`
  und `@` (AltGr+Q). Schlägt sie fehl, ist der Lernpfad gesperrt, bis das
  Layout stimmt — mit einer bebilderten Anleitung.
- Zeichen, die T1 nur über AltGr erreicht (`@ € | ~ \ { } [ ]`), werden als
  solche gelehrt und in der Grafik mit AltGr dargestellt.

### 3.2 Fingersatz [KONVENTION]

**Es gibt keine DIN, die festlegt, welcher Finger welche Taste bedient.**
Die Zuordnung ergibt sich aus der Grundstellung und ist in allen deutschen
Lehrwerken und Wettbewerbsordnungen identisch. Zehni übernimmt sie unverändert
(SPEC 6.1). Wir erfinden hier nichts und weichen hier nichts ab.

Ebenso **nicht genormt ist die Reihenfolge, in der die Tasten eingeführt
werden.** Sie unterscheidet sich zwischen den Lehrwerken. Zehni folgt dem in
Deutschland verbreitetsten Aufbau: Grundreihe → obere Reihe → untere Reihe →
Umschaltung → Ziffern → Sonderzeichen (SPEC 6.2). Das ist eine begründete
Entscheidung, keine Norm — und in der App auch nicht als Norm auszugeben.

---

## 4. Leistungsmessung — verbindlich

Dies ist der Abschnitt, in dem Zehni sich bisher am weitesten von der offiziellen
Praxis entfernt hatte. Die folgenden Definitionen sind ab sofort bindend.

### 4.1 Anschlag [REGELWERK]

> Ein **Anschlag** ist jeder Tastendruck. Für jeden Großbuchstaben und für die
> meisten Sonderzeichen zählen **zwei Anschläge**, weil Umschalt- bzw.
> AltGr-Taste mitgeschlagen werden.

Das ist die Zählweise der Wettschreibordnung und der 10-Minuten-Abschrift.
Zehni zählt genauso. Ein Text mit 100 Zeichen, davon 8 Großbuchstaben,
hat **108 Anschläge**, nicht 100.

Implementierung: `countStrokes(text: string): number` in `lib/metrics.ts`,
mit Tabelle der T1-Zeichen, die Umschalt oder AltGr erfordern. Diese Funktion
ist der einzige Ort, an dem Anschläge gezählt werden — überall sonst wird sie
aufgerufen.

### 4.2 Fehler [REGELWERK]

Gezählt wird am **Ergebnistext**, nicht am Tippweg:

- jedes falsche Zeichen = 1 Fehler
- jedes fehlende Zeichen = 1 Fehler
- jedes zusätzliche Zeichen = 1 Fehler
- jede falsche oder fehlende Zeilenschaltung, jede überzählige Leerzeile = 1 Fehler

**Während des Schreibens korrigierte Fehler zählen nicht.** Wer den Fehler
bemerkt und verbessert, hat am Ende einen richtigen Text.

### 4.3 Fehlerquotient [REGELWERK]

```
Fehlerquote [%] = (Fehler × 100) / Gesamtanschläge
```

### 4.4 Die zwei Kennzahlen von Zehni

Weil 4.2 das Lernen nur unvollständig abbildet, führt Zehni **zwei** Kennzahlen
— und hält sie sauber auseinander:

| Kennzahl | Definition | Wofür |
|---|---|---|
| **Fehlerquote** (amtlich) | nach 4.2/4.3, Korrekturen zählen nicht | Bewertung, Sterne, Abschlusstest, alles was nach außen aussieht wie eine Note |
| **Treffer beim ersten Anschlag** (Lernwert) | Anteil der Zeichen, die *ohne* Korrektur richtig waren | Fehlerprofil je Taste, adaptive Wiederholung, Trainingsrückmeldung |

In der Oberfläche heißt die erste „Fehlerquote", die zweite „Sicherheit".
Die zweite erscheint als Trainingshinweis („Bei `z` musstest du oft korrigieren
— das üben wir gleich").

#### 4.4.1 Wo welche Kennzahl bewertet — die Trennlinie

Der blockierende Übungsmodus (SPEC 7.1, Standard für `L01`–`L13`) lässt eine
falsche Taste gar nicht erst durch. Der Ergebnistext ist dort **bauartbedingt
immer fehlerfrei**, die amtliche Fehlerquote also immer 0,00 %. Sie kann in
diesen Lektionen nichts unterscheiden und wird dort deshalb weder berechnet
noch angezeigt.

| Bereich | Modus | Bewertet nach |
|---|---|---|
| `L01`–`L13` | blockierend | **Sicherheit** (4.4) + Geschwindigkeit |
| `L14`–`L24` | fließend | **Fehlerquote** (amtlich, 4.2/4.3) + Geschwindigkeit |
| `L25` Abschlusstest | fließend | **Fehlerquote** nach 4.7 |

Damit gilt der Satz „bewertet wird nur nach der amtlichen Fehlerquote"
unverändert für **jede Zahl, die wie eine Note aussieht** — Diplom, Urkunde,
Elternansicht, Notenschlüssel nach 4.6. Die Sicherheit vergibt in `L01`–`L13`
Sterne, und Sterne sind Trainingsrückmeldung, keine Note.

**Verbindliche Folgeregel:** In `L01`–`L13` erscheint das Wort „Fehlerquote"
nirgends in der Oberfläche, und kein Wert aus diesen Lektionen wird in eine
Aussage über die amtliche Fehlerquote übersetzt. Ein Diagramm, das die
Fehlerquote über die Zeit zeigt, beginnt bei `L14`. Wer beides vermischt,
erzeugt genau die Scheingenauigkeit, die dieser Abschnitt verhindern soll.

> Entschieden am 2026-09-12. Vorher war der Widerspruch offen: SPEC 6.3 wollte
> `L01`–`L13` nach Fehlerquote bewerten, SPEC 7.1 machte diese Quote dort
> strukturell zu 0.

### 4.5 Geschwindigkeit

```
Anschläge pro Minute (A/min) = Gesamtanschläge / aktive Minuten
```

„A/min" ist die im deutschen Sprachraum übliche Größe und die einzige, die
Zehni prominent anzeigt. WPM (= A/min ÷ 5) erscheint nur klein daneben, weil
Kinder es aus Online-Tipptests kennen.

Zur Ehrlichkeit der Zahl: Pausen über 3 Sekunden werden aus der aktiven Zeit
herausgerechnet (SPEC 7.1). Für den Abschlusstest nach 4.7 gilt das **nicht** —
dort läuft die Uhr wie im Wettbewerb durch.

### 4.6 Notenschlüssel [REGELWERK]

**Anfängerschlüssel** (10-Minuten-Abschrift, Schulpraxis) — den verwendet Zehni
für die Rückmeldung im Lernpfad:

| Fehlerquote | Note |
|---|---|
| 0,000–0,125 % | sehr gut |
| 0,126–0,250 % | gut |
| 0,251–0,375 % | befriedigend |
| 0,376–0,500 % | ausreichend |
| 0,501–1,000 % | mangelhaft |
| über 1,000 % | ungenügend |

**Schlüssel der Wettschreibordnung (Schnellschreiben)** — für den Abschlusstest:
Note 1 bei 0–0,08 %, Note 2 bei >0,08–0,19 %, Note 3 bei >0,19–0,33 %,
Note 4 bei >0,33–0,50 %. Zulässige Fehlergrenze Schnellschreiben: **0,5 %**;
Perfektionsschreiben: **0,1 %**.

Zehni zeigt Kindern **keine Schulnoten** (SPEC, Leitprinzip 6). Der Schlüssel
wird intern gerechnet und in Sterne und Klartext übersetzt („Das war
wettbewerbsreif!"). In der Elternansicht darf die Note im Klartext stehen.

### 4.7 Abschlusstest „Zehni-Diplom" [REGELWERK]

Der Abschlusstest (`L25`) ist eine **10-Minuten-Abschrift nach dem Muster des
Bundesjugendschreibens**:

- Dauer exakt 10 Minuten, Uhr läuft durch, keine Pausenherausrechnung.
- Vorlage ist länger, als in 10 Minuten zu schaffen ist.
- Korrigieren während des Schreibens ist erlaubt.
- **Bestanden**: mindestens **600 Gesamtanschläge** (= 60 A/min) bei höchstens
  **0,5 % Fehlerquote**. Das ist die Mindestleistung des Bundesjugendschreibens.
- Die Urkunde nennt Anschläge/Minute, Fehlerquote und die angewandte
  Bewertungsgrundlage — und weist ausdrücklich darauf hin, dass es sich um eine
  Selbstprüfung handelt (siehe 8).

### 4.8 Lektionsziele in offiziellen Einheiten

Die früheren Prozentangaben zur „Genauigkeit" waren mit den amtlichen
Fehlerquoten nicht vergleichbar (92 % Genauigkeit entspräche 8 % Fehlerquote —
das Sechzehnfache der Wettbewerbsgrenze). Verbindlich sind stattdessen:

**Blockierender Teil `L01`–`L13` — bewertet nach Sicherheit (4.4.1):**

| Lektionen | ★ | ★★ | ★★★ (zusätzlich) |
|---|---|---|---|
| `L01`–`L05` | Sicherheit ≥ 90,0 % | ≥ 95,0 % | ≥ 98,0 % **und** 60 A/min |
| `L06`–`L13` | Sicherheit ≥ 93,0 % | ≥ 96,0 % | ≥ 98,5 % **und** 80 A/min |

**Fließender Teil ab `L14` — bewertet nach amtlicher Fehlerquote:**

| Lektionen | Zielfehlerquote (★) | Zielgeschwindigkeit (★★★) |
|---|---|---|
| `L14`–`L19` | ≤ 1,5 % | 100 A/min |
| `L20`–`L23` | ≤ 1,0 % | 120 A/min |
| `L24` | ≤ 0,5 % | 140 A/min |
| `L25` | ≤ 0,5 % **und** ≥ 600 Anschläge in 10 min | — |

Sterne im fließenden Teil:

- ★ Zielfehlerquote der Stufe erreicht
- ★★ höchstens die **Hälfte** der Zielfehlerquote
- ★★★ höchstens ein **Viertel** der Zielfehlerquote **und** Zielgeschwindigkeit

Warum die Sicherheitsschwellen milder wirken, als die Fehlerquoten es täten:
Sicherheit ist die **strengere** Kennzahl. In sie geht jeder Vertipper ein,
auch der sofort verbesserte — die Fehlerquote verzeiht ihn. Die alten Werte
(≤ 4,0 % ⇒ Sicherheit ≥ 96,0 %) eins zu eins auf die Sicherheit zu übertragen,
hätte den Einstieg unbemerkt verschärft. Die Schwellen sind deshalb bewusst
niedriger angesetzt und beim Übergang auf `L14` ist ein sichtbarer Sprung
gewollt: Dort fällt die Tippsperre weg, und die amtliche Zählweise übernimmt.

Die Schwellen der ersten beiden Stufen sind **Erfahrungswerte ohne
Datengrundlage** — sie stehen an einer Stelle im Code (`lib/curriculum.ts`)
und werden nachjustiert, sobald echte Sitzungsdaten vorliegen.

Die Staffelung führt das Kind von einem realistischen Anfängerwert schrittweise
an die 0,5-%-Grenze heran, die im Wettbewerb und in der Ausbildung gilt.

---

## 5. DIN 5008:2020-03 — Schreib- und Gestaltungsregeln

DIN 5008 ist die Norm für die Gestaltung von Texten in der Text- und
Informationsverarbeitung (Nachfolgerin der „Regeln für Maschineschreiben" von
1949). Sie hat empfehlenden Charakter, ist aber in Schule, Ausbildung und
Verwaltung der De-facto-Maßstab.

### 5.1 Zehni hält sich selbst daran

**Jeder Text, den Zehni ausgibt — Seed, KI-generiert, Oberflächentexte,
Urkunde — folgt DIN 5008.** Das wird maschinell geprüft
(`scripts/check-din5008.ts`, läuft in der CI und im Textvalidator).

Mindestens diese Regeln:

- Nach Satzzeichen ein Leerzeichen, davor keines.
- Gedankenstrich ist der Halbgeviertstrich `–` mit Leerzeichen davor und
  danach; Bindestrich `-` ohne Leerzeichen. *(In den Lektionen `L01`–`L19`
  existiert nur der Bindestrich — Gedankenstriche sind dort im Text verboten.)*
- Zahlen ab fünf Stellen werden von rechts in Dreiergruppen mit **Leerzeichen**
  gegliedert (`45 000`), Geldbeträge mit Punkt und Komma (`1.234,56 EUR`).
  Vierstellige Zahlen bleiben ungegliedert (`8000`).
- Datum: `2026-09-12` oder `12.09.2026`, nicht `12.9.26`.
- Uhrzeit mit Doppelpunkt: `14:30 Uhr`.
- Maßeinheiten und Währungen mit Leerzeichen vom Wert getrennt (`5 kg`, `20 %`).
- Auslassungspunkte `...` mit Leerzeichen davor, wenn sie ein Wort ersetzen.
- Keine doppelten Leerzeichen, kein Leerzeichen vor Zeilenende.

### 5.2 Zehni lehrt sie

Das Modul „Textverarbeitung" (SPEC 10.2) vermittelt DIN 5008 ausdrücklich als
das, was sie ist — die geltende Norm —, in kindgerechter Auswahl:
Satzzeichenabstände, Datums- und Uhrzeitformat, Zahlengliederung,
Aufzählungen, Überschriftenhierarchie und der Aufbau eines Briefs
(Anschriftfeld, Betreff, Anrede, Gruß).

Vollständigkeit ist nicht das Ziel — die Norm hat rund 70 Seiten. Ziel ist,
dass das Kind weiß, **dass** es eine Norm gibt, welche Regeln im Alltag
ständig vorkommen, und wo man nachschlägt.

---

## 6. Medienkompetenz: Zuordnung zum KMK-Rahmen

Jede Einheit des Moduls „Medienkompetenz" (SPEC 10.1) trägt im Inhalts-JSON ein
Feld `kmk` mit dem zugeordneten Kompetenzbereich der KMK-Strategie „Bildung in
der digitalen Welt" (2016, fortgeschrieben 2021):

| # | KMK-Kompetenzbereich | Zehni-Einheiten |
|---|---|---|
| 1 | Suchen, Verarbeiten und Aufbewahren | Quellen prüfen; Dateien und Ordner |
| 2 | Kommunizieren und Kooperieren | Kettenbriefe, Cybermobbing, Hilfe holen |
| 3 | Produzieren und Präsentieren | Modul Textverarbeitung (gesamt) |
| 4 | Schützen und sicher Agieren | Passwörter; persönliche Daten; **Falle F1 „Du hast gewonnen!"**; **Falle F2 „Das Internet vergisst nie"**; **Falle F3 „Das Kleingedruckte"** |
| 5 | Problemlösen und Handeln | Tastenkürzel; Backup |
| 6 | Analysieren und Reflektieren | Werbung erkennen; Influencer-Werbung; Von einem Computer gemacht? (`medien-ki`, DigComp 1.2); **Falle F3** |

Die drei Fallen (SPEC 6.6.1 und 10.1) stellen Situationen nach, statt Regeln
aufzuzählen. Sie sind der Teil des Moduls, der am ehesten missverstanden werden
kann, deshalb steht hier ausdrücklich: **Zehni erhebt dabei keine
personenbezogenen Daten.** Telefonnummer und E-Mail sind in den Formularen
vorgegeben und nicht änderbar, freie Eingaben beschränken sich auf Harmloses,
nichts wird gespeichert, nichts verlässt das Gerät. Wer eine Falle baut, die
das verletzt, hat die Einheit in ihr Gegenteil verkehrt.

Zusätzlich trägt jede Einheit ein Feld `digcomp` mit dem entsprechenden Bereich
aus **DigComp 2.2**. Die Felder sind reine Metadaten — sie erscheinen nicht in
der Kinder-Oberfläche, sondern nur in der Elternansicht und in der
Dokumentation. Nutzen: Eltern und Lehrkräfte sehen, dass die Inhalte an einem
anerkannten Rahmen hängen, und Lücken werden beim Bauen sichtbar.

Für Thüringen (Wohnort der Zielnutzerin) ist der **Kursplan Medienkunde
Klassen 5–10** die Landesvorgabe: Unterricht in den Doppelklassenstufen 5/6,
7/8 und 9/10 mit mindestens zwei Jahreswochenstunden, fachintegriert, mit
medienkundlichen und informatischen Inhalten. Zehni ist danach eine **Ergänzung
zum Unterricht, kein Ersatz** — das Modul deckt bewusst die Doppelklassenstufe
5/6 ab.

---

## 7. Prüfpflichten (CI)

Diese Tests sind Teil der Definition of Done und dürfen nicht entfallen:

1. `countStrokes()` gegen eine Tabelle von Referenzfällen aus T1
   (Kleinbuchstabe = 1, Großbuchstabe = 2, `@` = 2, `ß` = 1, `?` = 2 …).
2. Fehlerzählung gegen Referenzpaare (Vorlage / Abschrift) mit bekanntem
   Sollergebnis, inklusive Zeilenschaltungsfehler.
3. Fehlerquotient und beide Notenschlüssel gegen die Tabellen in 4.6.
4. Abschlusstest-Logik: 600 Anschläge / 0,5 % als Grenzfall exakt getroffen.
5. DIN-5008-Prüfung über **alle** Seed-Texte und alle Oberflächentexte.
6. Golden Test Zeichensatz je Lektion (bereits in SPEC 13).

---

## 8. Was Zehni ausdrücklich **nicht** behauptet

Ebenso wichtig wie die Normtreue ist, keine Autorität vorzutäuschen:

- Zehni ist **nicht zertifiziert**, von niemandem geprüft und trägt **kein
  DIN-Siegel**. Eine DIN-Nummer nennen heißt, sich an sie zu halten — nicht,
  von ihr anerkannt zu sein.
- Das „Zehni-Diplom" ist eine **Selbstprüfung** unter Wettbewerbsbedingungen,
  keine Urkunde des Deutschen Stenografenbundes und kein Schulzeugnis. Das steht
  auf der Urkunde selbst.
- Die Normtexte selbst (DIN 2137, DIN 5008) sind urheberrechtlich geschützt und
  werden **nicht** mitgeliefert oder zitiert. Zehni setzt ihre Regeln um und
  nennt Fundstelle und Ausgabe — mehr nicht.
- Wo Zehni über die Regelwerke hinausgeht (Lektionsreihenfolge, Gamification,
  Zielfehlerquoten der Anfängerstufen), ist das als eigene didaktische
  Entscheidung kenntlich zu machen, in der Dokumentation wie im Code-Kommentar.

---

## 9. Quellen

- DIN 2137-1:2023-08 · DIN 2137-2:2018-12 — Tastaturen für die Daten- und
  Texteingabe; Belegung T1 sowie E1/E2 (lösten 2023 die früheren T2/T3 ab).
- DIN 5008:2020-03 — Schreib- und Gestaltungsregeln für die Text- und
  Informationsverarbeitung.
- Deutscher Stenografenbund e. V., Wettschreibordnung, Beschluss vom
  27.11.2022 — Texterfassung: Leistungsklassen, Fehlergrenzen (0,5 % bzw.
  0,1 %), Notenschlüssel.
- Bundesjugendschreiben (BJCKM) — 10-Minuten-Abschrift, Mindestleistung
  600 Anschläge bei höchstens 0,5 % Fehlern, Korrigieren erlaubt.
- Anschlagsdefinition und Anfänger-Notenschlüssel der 10-Minuten-Abschrift.
- KMK, „Bildung in der digitalen Welt" (2016), fortgeschrieben durch „Lehren und
  Lernen in der digitalen Welt" (2021) — sechs Kompetenzbereiche.
- Europäische Kommission, DigComp 2.2 (2022).
- Thüringer Schulportal, Kursplan Medienkunde Klassen 5–10.

Verlinkte Fundstellen stehen im Projektwiki bzw. in der Chat-Antwort, aus der
diese Datei stammt. Vor jedem Major-Release ist zu prüfen, ob eine neue
Ausgabe der genannten Normen erschienen ist; das Ergebnis wird hier mit Datum
vermerkt.

**Letzte Normenprüfung:** 2026-09-12 — alle oben genannten Fassungen aktuell.
