# Zehni — Modul „Lernen lernen"

> Detailspezifikation zu `SPEC.md` 10.3. Verbindlich für Inhalt und Tonfall
> des Moduls `modul-lernen`.
> Stand: 2026-09-12

---

## 1. Die Leitidee

Dieses Modul hat **eine** Kernbotschaft, und alles andere hängt daran:

> **Niemand kommt auf die Welt und kann ein Flugzeug fliegen.**
> Alles, was ein Mensch kann, hat er irgendwann nicht gekonnt.

Und den dazugehörigen zweiten Satz, für den Moment, in dem jemand zweifelt, ob
er zu spät dran ist:

> **Jünger wirst du nicht.**
> Der früheste Zeitpunkt, mit etwas anzufangen, ist immer heute.

Das Modul ist keine Sammlung von Lerntipps mit einem Motivationsspruch obendrauf.
Es ist umgekehrt: Die Haltung ist der Inhalt, und die Techniken (Abrufen,
verteiltes Üben, Fokus) sind das Werkzeug, mit dem sie sich beweisen lässt.

### 1.1 Warum Zehni das besser kann als ein Textmodul

Ein Motivationstext kann behaupten, dass Übung wirkt. **Zehni kann es zeigen.**

Die App besitzt die Lernkurve der Nutzerin: `sessions`, `lesson_progress` und
`char_stats` enthalten den vollständigen Verlauf vom ersten Tag an. Das ist der
Unterschied zwischen „Übung macht den Meister" (eine Floskel) und:

> „Am 3. September hast du 24 Anschläge pro Minute geschafft, mit 6 % Fehlern.
> Heute sind es 71 bei 1,2 %. Das hat dir niemand gegeben. Das hast du geübt."

**Verbindlich:** Jede Einheit dieses Moduls, die eine Behauptung über Lernen
aufstellt, belegt sie mit den **echten Daten der Nutzerin**, sobald genug davon
da sind (ab 5 abgeschlossenen Sitzungen). Vorher greifen neutrale Beispiele.
Kein Satz über Lernen ohne Beleg aus dem eigenen Fortschritt — das ist die
tragende Idee des Moduls.

Technisch: `features/modules/lernen/` liest über eine schmale Schnittstelle
`getLearningEvidence()` aus `features/stats/`. Die Einheiten enthalten
Platzhalter (`{{ersteSitzungAmin}}`, `{{aktuellAmin}}`, `{{tageGeuebt}}`,
`{{schwerstesZeichenDamals}}`), die zur Laufzeit gefüllt werden.

---

## 2. Anregung: HTB-Academy-Modul „Learning Process"

Das Modul „Learning Process" der Hack-The-Box-Academy (Abschnitte u. a. *Way Of
Thinking*, *Talent*, *Way Of Learning*, *The Will*, *Focus*, *Obstacles*,
*Questioning*, *Handling Frustration*, *Learning Progress*) ist die Anregung für
dieses Modul. Was daran gut funktioniert und übernommen wird:

- Die Haltung steht **vor** der Technik. Das Modul beginnt nicht mit
  Lernmethoden, sondern mit der Frage, wofür man sich selbst hält.
- Talent wird entzaubert statt gefeiert.
- Frustration wird als **normaler Teil** des Lernens behandelt, nicht als
  Zeichen dafür, dass man ungeeignet ist.
- Fragen zu stellen wird als Stärke dargestellt, nicht als Eingeständnis.
- Der Fortschritt wird explizit sichtbar gemacht, weil man ihn an sich selbst
  nicht merkt.

### 2.1 Was **nicht** übernommen wird

1. **Kein Text, keine Struktur, keine Formulierung 1 : 1.** Die Inhalte der
   HTB-Academy sind urheberrechtlich geschützt. Zehni übernimmt die
   **pädagogische Haltung**, und die ist nicht schutzfähig — Sätze sind es.
   Jede Einheit wird neu geschrieben. Keine Zitate, keine Übersetzungen,
   keine 20 Abschnitte in gleicher Reihenfolge.
2. **Der Tonfall passt nicht.** Das Original richtet sich an Erwachsene, die
   Penetration Testing lernen. Hier sitzt ein Kind von ungefähr elf Jahren vor
   dem Bildschirm. Acht kurze Einheiten statt zwanzig, konkrete Beispiele aus
   ihrem Alltag, keine Karrierelogik.
3. **Der Abschnitt „Learning Types" wird ausgelassen** — siehe 3.

---

## 3. Was wir nicht behaupten (Belegstand)

Das Modul soll ehrlich sein, gerade weil es motivieren will. Drei Grenzen:

**Lerntypen gibt es nicht — jedenfalls nicht so.** Die Vorstellung, jemand sei
ein „visueller" oder „auditiver" Lerntyp und lerne besser, wenn der Unterricht
dazu passt (die *meshing hypothesis*), ist wissenschaftlich nicht belegt.
Pashler, McDaniel, Rohrer und Bjork fanden in ihrer Übersichtsarbeit praktisch
keine tragfähige Evidenz dafür (*Psychological Science in the Public Interest*
9(3), 2008/2009, S. 105–119). **Zehni enthält keinen Lerntypentest und keine
Lerntypen-Erklärung.** Wenn das Thema vorkommt, dann als aufgeklärter Hinweis:
„Du wirst vielleicht hören, du seist ein bestimmter Lerntyp. Das ist ein
verbreiteter Irrtum. Was wirklich hilft, kommt in den nächsten Einheiten."

**Die richtige Einstellung allein macht keine besseren Noten.** Die Forschung
zum Growth Mindset zeigt reale, aber kleinere Effekte, als populäre Darstellungen
nahelegen. Zehni verspricht deshalb **nicht** „glaub an dich, dann klappt alles",
sondern trifft die viel härtere und viel besser belegte Aussage: *Fertigkeiten
wie Tastschreiben entstehen durch Übung — und das kannst du an deiner eigenen
Kurve nachsehen.*

**Was belegt ist, steht im Mittelpunkt.** Dunlosky, Rawson, Marsh, Nathan und
Willingham haben zehn verbreitete Lerntechniken auf ihre Wirksamkeit geprüft
(*Psychological Science in the Public Interest* 14(1), 2013, S. 4–58). Hohe
Wirksamkeit hatten nur zwei: **sich selbst abfragen** (practice testing) und
**verteiltes Üben** (distributed practice). Niedrige Wirksamkeit hatten
ausgerechnet die beliebtesten: Markieren, Zusammenfassen und Wiederlesen.
Das Modul lehrt deshalb die zwei, die wirken — und sagt ausdrücklich, dass
Textmarker und Wiederlesen sich produktiv *anfühlen*, aber wenig bringen.

---

## 4. Die acht Einheiten

Jede Einheit: 3–5 Minuten. Aufbau `Bild/Frage → kurze Erklärung → Aufgabe →
dein Beleg`. Kein Fließtext über fünf Sätze am Stück.

### E1 — „Kann das jemand von Geburt an?"

**Botschaft:** Alles, was Menschen können, haben sie gelernt.

Einstieg mit dem Flugzeugbild: Ein Pilot sitzt im Cockpit und bedient dreißig
Schalter, ohne hinzusehen. Niemand kommt so auf die Welt. Er hat angefangen wie
alle: ohne Ahnung, welcher Schalter was macht.

**Aufgabe:** Karten in zwei Fächer ziehen — *angeboren* oder *gelernt*:
atmen · laufen · sprechen · Fahrrad fahren · lesen · schwimmen · schreiben ·
ein Instrument spielen · blind tippen · ein Flugzeug fliegen.
Nur „atmen" landet bei *angeboren*. Das ist der ganze Trick der Aufgabe.

**Dein Beleg:** „Vor `{{tageGeuebt}}` Tagen konntest du die Tasten nicht blind
finden. Jetzt schon. Genau so ist das mit allem anderen auch."

### E2 — Deine eigene Kurve

**Botschaft:** Fortschritt merkt man an sich selbst nicht. Man muss ihn ansehen.

Der Kern der Einheit ist ein Diagramm: die echten Anschläge pro Minute und die
echte Fehlerquote der Nutzerin über die Zeit, mit ihrem ersten Tag markiert.

**Aufgabe:** Drei Fragen zur eigenen Kurve — Wann war dein bester Tag? Wo war
eine Woche, in der es nicht besser wurde? Wie viel schneller bist du heute als
am Anfang? (Die App kennt die Antworten und bestätigt.)

**Dein Beleg:** die Kurve selbst. Diese Einheit ist erst ab 5 Sitzungen
freigeschaltet; vorher zeigt der Lernpfad sie als „kommt bald, wir brauchen erst
ein paar Übungstage von dir" — was für sich genommen schon die Botschaft ist.

### E3 — „Dafür bin ich zu spät dran"

**Botschaft:** Der früheste mögliche Anfang ist immer jetzt.

Dieser Gedanke kommt in zwei Größen, und das Modul bringt beide, weil derselbe
Denkfehler in jedem Alter auftritt:

- **Für jetzt:** „Die anderen in meiner Klasse können das längst." — Stimmt
  vielleicht. Sie haben früher angefangen, nicht mehr Talent. Und du vergleichst
  dich mit ihrem Heute statt mit ihrem Anfang, den du nie gesehen hast.
- **Für später:** „Dafür bin ich zu alt." — **Jünger wirst du nicht.** Wer mit
  40 sagt, er sei zu alt zum Anfangen, wird mit 50 dasselbe sagen und dann zehn
  Jahre verloren haben. Es gibt keinen Zeitpunkt, zu dem man jünger ist als
  jetzt.

**Aufgabe:** Zwei Sätze auf einer Waage gegeneinander — „Ich fange nicht an,
weil es zu spät ist" gegen „In einem Jahr bin ich ein Jahr weiter oder ein Jahr
älter — beides passiert sowieso." Die Nutzerin schiebt den Zeiger und sieht,
welcher Satz in einem Jahr besser dasteht.

**Tonfall:** kein Vorwurf, kein „Ausreden!". Der Satz gehört der Nutzerin, nicht
dem Programm.

### E4 — „Noch nicht" ist ein vollständiger Satz

**Botschaft:** Zwischen „ich kann das nicht" und „ich kann das nicht *noch
nicht*" liegt die ganze Sache.

Dazu der Umgang mit Fehlern: Ein Fehler ist kein Urteil, sondern eine Auskunft.
Er sagt genau, was als Nächstes zu üben ist. Zehni macht das ohnehin (adaptive
Wiederholung, `SPEC.md` 6.4) — hier wird es der Nutzerin erklärt.

**Aufgabe:** Fünf Sätze umschreiben. „Ich kann kein Ö treffen" → „Ich treffe das
Ö **noch nicht** sicher." Eingabe per Tastatur (nebenbei Tippübung).

**Dein Beleg:** „Dein schwierigstes Zeichen war `{{schwerstesZeichenDamals}}`.
Du hast es `{{fehlerDamals}}`-mal verfehlt. Diese Woche: `{{fehlerJetzt}}`-mal."

### E5 — Die Delle

**Botschaft:** Es gibt Phasen, in denen es nicht vorangeht. Sie sind normal und
sie gehen vorbei. Das ist der Punkt, an dem die meisten aufhören — und das ist
das Einzige, was dabei wirklich schiefgehen kann.

Frustration wird benannt, nicht weggeredet: Es ist unangenehm, sich anzustrengen
und trotzdem schlechter zu sein als gestern. Konkrete Hilfen: kurze Pause,
bewusst **langsamer** üben (Genauigkeit vor Tempo), eine Stufe zurückgehen,
morgen wiederkommen.

**Aufgabe:** In der eigenen Kurve die flachen Abschnitte markieren — und sehen,
dass nach jedem davon wieder ein Anstieg kam.

### E6 — Üben, das wirklich wirkt

**Botschaft:** Zwei Techniken schlagen alle anderen: **sich selbst abfragen**
und **verteilt üben**.

- *Sich abfragen* heißt: den Stoff aus dem Kopf holen, nicht noch einmal ansehen.
  Wer eine Vokabel nachschlägt, fühlt sich sicher; wer sie aufsagt, lernt sie.
- *Verteilt üben* heißt: fünfmal zehn Minuten schlagen einmal fünfzig Minuten.
  Genau das macht Zehni mit dem Tagesziel und der Serie.
- Ehrlicher Zusatz: Markieren, Zusammenfassen und Wiederlesen fühlen sich
  fleißig an, bringen aber wenig. Das darf man wissen, bevor man drei Abende
  damit verbringt.

**Aufgabe:** Einen Wochenplan für ein Schulthema zusammenbauen — die App prüft,
ob verteilt geübt wird und ob Selbstabfrage vorkommt.

**Dein Beleg:** „Du hast an `{{tageGeuebt}}` Tagen geübt, im Schnitt
`{{minutenProTag}}` Minuten. Genau so soll es aussehen."

### E7 — Anfangen, obwohl man keine Lust hat

**Botschaft:** Auf Lust zu warten ist der langsamste Weg. Klein anfangen ist der
schnellste.

Inhalte: große Aufgabe in kleine zerlegen; die Zwei-Minuten-Regel (nur anfangen,
nicht durchhalten müssen); Pomodoro 25/5 mit einem Timer, der auch außerhalb des
Moduls nutzbar ist; Ablenkungen vorher wegräumen statt ihnen zu widerstehen.

**Aufgabe:** Ein echtes Vorhaben der Nutzerin („Referat über Island") in vier
Schritte zerlegen, jeder höchstens 20 Minuten.

### E8 — Aufschreiben, damit du es nicht zweimal lernst

**Botschaft:** Was man in eigenen Worten notiert, hat man verstanden. Was man
abschreibt, nicht.

Inhalte: Merkzettel in eigenen Worten; nachschlagen ist keine Schwäche; Fragen
stellen ist die schnellste Abkürzung, die es gibt; ein eigenes kleines
Nachschlagewerk anlegen (Ordnerstruktur — Anknüpfung an das Medienmodul).

**Aufgabe:** Eine der vorherigen Einheiten in drei eigenen Sätzen zusammenfassen
— getippt, natürlich. Wird im Profil als „Mein Merkzettel" gespeichert und ist
später wieder aufrufbar.

---

## 5. Abschluss des Moduls

Kein Test, keine Punkte für richtige Antworten — es gibt hier keine richtigen
Antworten. Stattdessen am Ende eine Seite **„Was du in `{{tageGeuebt}}` Tagen
gelernt hast"**: die eigene Kurve, die Zahl der geübten Minuten, das schwerste
Zeichen von damals und von heute, die freigeschalteten Lektionen.

Darunter ein Satz, und nur dieser eine:

> Vor `{{tageGeuebt}}` Tagen konntest du das nicht.

Abzeichen `lernprofi`. Das Modul ist jederzeit wieder aufrufbar — besonders E3
und E5 sind dafür gedacht, dass man sie noch einmal liest, wenn es gerade
schwerfällt. Der Lernpfad schlägt E5 („Die Delle") von sich aus vor, wenn drei
Sitzungen in Folge unter der bisherigen Bestleistung lagen.

---

## 6. Tonfall — verbindlich

- **Kein Coaching-Sprech.** Keine „Reise", keine „Challenge", kein „Du schaffst
  alles, was du dir vornimmst" (stimmt nicht und merkt jedes Kind).
- **Keine Schuldzuweisung.** Wer nicht geübt hat, bekommt keine Ermahnung.
- **Konkret statt allgemein.** Nicht „Übung zahlt sich aus", sondern
  „24 → 71 Anschläge in sechs Wochen".
- **Die Nutzerin bleibt zuständig.** Das Programm sagt, was hilft; es sagt nicht,
  was sie zu wollen hat.
- **Das Maskottchen hält sich hier zurück.** In diesem Modul spricht Zehni
  höchstens einmal pro Einheit.

---

## 7. Umsetzung

- Inhalte als JSON in `content/modules/lernen.json`, Schema wie die anderen
  Module, zusätzlich Feld `evidence` je Einheit mit den benötigten Platzhaltern.
- `getLearningEvidence()` liefert alle Platzhalterwerte in einem Aufruf; fehlen
  Daten (< 5 Sitzungen), liefert sie `null` und die Einheit zeigt ihre neutrale
  Fassung. **Nie** erfundene Zahlen einsetzen — lieber die neutrale Fassung.
- Das Diagramm nutzt dieselbe Komponente wie die Statistikansicht, keine zweite
  Charting-Bibliothek (Performance-Budget, `SPEC.md` 12.1).
- Der Pomodoro-Timer aus E7 lebt in `features/modules/lernen/timer/` und ist von
  der Startseite aus erreichbar, auch ohne das Modul zu öffnen.
- Einordnung im KMK-Rahmen: Bereich 5 „Problemlösen und Handeln" und Bereich 6
  „Analysieren und Reflektieren" (`NORMEN.md` 6).

---

## 8. Quellen

- Hack The Box Academy, Modul „Learning Process" — Anregung für Haltung und
  Aufbau; kein Text übernommen.
- Pashler, H., McDaniel, M., Rohrer, D. & Bjork, R. (2008/2009). *Learning
  Styles: Concepts and Evidence.* Psychological Science in the Public Interest
  9(3), 105–119. — Grundlage für den Verzicht auf Lerntypen.
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J. & Willingham, D. T.
  (2013). *Improving Students' Learning With Effective Learning Techniques.*
  Psychological Science in the Public Interest 14(1), 4–58. — Grundlage für E6.
