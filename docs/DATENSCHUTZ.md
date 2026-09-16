# Was Zehni speichert — und was nicht

> Für Eltern. Eine Seite, ohne Juristendeutsch.
> Stand: 2026-09-15

---

## Die kurze Fassung

Zehni läuft auf dem Rechner Ihres Kindes und sonst nirgends. Es gibt kein
Konto, keine Anmeldung, keinen Server, auf dem etwas über Ihr Kind liegt.
Niemand — auch nicht der Entwickler — kann sehen, wie Ihr Kind vorankommt.

Es gibt keine Werbung und keine Auswertung des Nutzungsverhaltens. Beides ist
nicht abgeschaltet, sondern gar nicht erst gebaut.

---

## Was auf dem Rechner gespeichert wird

Alles liegt in einer einzigen Datei unter `%APPDATA%\de.zehni.app\zehni.db`:

- Der Name, den Ihr Kind bei der Einrichtung eingegeben hat. **Er darf leer
  bleiben**, und Zehni funktioniert dann genauso.
- Die Altersstufe — als eine von drei Stufen (8 bis 10, 11 bis 13, ab 14).
  **Kein Geburtsdatum.** Für die Auswahl der Übungstexte reicht die Stufe.
- Die gewählten Themen und das Tagesziel.
- Der Lernfortschritt: welche Lektion wie oft geübt wurde, wie schnell, wie
  genau, welche Zeichen häufig danebengehen.
- XP, Level, Abzeichen, die Serie.

Diese Datei können Sie kopieren, verschieben oder löschen. Beim Deinstallieren
fragt Zehni, ob sie bleiben soll; voreingestellt ist Ja.

---

## Was das Gerät verlässt

**Im Normalbetrieb: nichts.**

Es gibt genau zwei Stellen, an denen Zehni überhaupt ins Internet geht, und
beide sind abschaltbar:

### 1. Die Suche nach Updates

Beim Start fragt Zehni beim Projekt-Repository nach, ob es eine neuere Version
gibt. Dabei wird nichts übertragen außer der Anfrage selbst. Wie bei jedem
Aufruf einer Internetseite sieht die Gegenstelle dabei die IP-Adresse des
Anschlusses — mehr nicht: kein Name, kein Fortschritt, keine Gerätekennung.

Ohne Internet passiert an dieser Stelle gar nichts, und die App arbeitet
unverändert weiter.

### 2. Frische Übungstexte (in Vorbereitung)

Zehni kann sich Übungstexte von einem Textdienst holen, damit nicht immer
dieselben kommen. Eine solche Anfrage enthält **ausschließlich** vier Angaben:

- welches Thema (zum Beispiel „Tiere"),
- welche Buchstaben schon gelernt sind,
- wie lang der Text sein soll,
- welche Lesestufe.

**Niemals** den Namen, niemals das Getippte, niemals Statistiken, niemals eine
Kennung des Geräts. Der Schalter dafür steht in den Einstellungen unter
„Frische Texte aus dem Internet" und lässt sich jederzeit ausschalten. Ist er
aus, kommen alle Texte aus Zehni selbst, und es fehlt nichts Wesentliches.

> Dieser Teil ist noch nicht in Betrieb. Sobald er es ist, steht hier das
> Datum.

---

## Die nachgestellten Fallen — bitte einmal lesen

Zehni bringt Kindern bei, Maschen im Internet zu erkennen. Das geht nicht mit
Merksätzen allein, deshalb **stellt Zehni drei solche Situationen nach**: ein
angebliches Gewinnspiel, ein Spieleprofil, das später in einem erfundenen Forum
wieder auftaucht, und ein „kostenloses" Angebot mit Kleingedrucktem.

Damit Sie wissen, woran Sie sind — diese Regeln gelten ohne Ausnahme:

1. **Kein Formular in Zehni nimmt echte persönliche Daten entgegen.**
   Telefonnummer, Name und Schule sind in den Fallen bereits mit erfundenen
   Werten ausgefüllt und **lassen sich nicht ändern**. Ihr Kind spielt eine
   erfundene Person. Der Lernmoment ist der Klick auf „Absenden", nicht das
   Eintippen — ein Kind, das in der Übung seine echte Nummer eintippt, hätte
   genau den Reflex geübt, den die Einheit abgewöhnen soll.
2. **Frei eingeben lässt sich nur Harmloses**: Spitzname, Lieblingstier,
   Lieblingsfarbe. Das fühlt sich persönlich an und identifiziert niemanden.
3. **Nichts davon wird gespeichert.** Die Eingaben leben im Arbeitsspeicher und
   sind weg, sobald die Einheit verlassen wird. In der Datenbank landen je
   Einheit zwei Wahrheitswerte: angesehen ja/nein, Masche erkannt ja/nein.
4. **Nichts verlässt das Gerät.** Die Module sprechen mit keinem Netzwerk.
   Auch nicht mit dem Textdienst.
5. **Wer hineintappt, bekommt dieselbe Aufmerksamkeit wie wer die Masche
   erkennt** — dieselbe Erklärung, ohne Häme, ohne Punktabzug. Der erste Satz
   lautet sinngemäß: Das passiert auch Erwachsenen ständig.
6. **Ein Zähler darf in einer Falle ablaufen**, denn falscher Zeitdruck ist
   genau das Erkennungsmerkmal, um das es geht. Er bricht aber nichts ab und
   nimmt nichts weg.

Wenn Ihnen das zu weit geht, überspringen Sie die Einheiten: Jede lässt sich
wegklicken, und der Lernweg bleibt offen.

---

## Was Zehni ausdrücklich nicht tut

- Keine Telemetrie, kein Tracking, keine Absturzberichte.
- Keine Werbung, keine Käufe, keine Verknüpfung mit sozialen Netzwerken.
- Kein Zugriff auf Kamera, Mikrofon, Kontakte, Dateien oder Standort.
- Keine Bestenliste und kein Vergleich mit anderen Kindern. Es gibt nur ein
  Profil, und es vergleicht sich nur mit sich selbst.
- Kein Lerntypentest. Die Einteilung in „Lerntypen" ist wissenschaftlich nicht
  belegt, und Zehni behauptet nichts, was es nicht belegen kann.

---

## Wer verantwortlich ist

Zehni ist ein privates Projekt ohne Firma dahinter. Es gibt keinen
Vertragspartner, keine Datenverarbeitung im Auftrag und nichts zu widerrufen —
weil nichts erhoben wird.

Wenn Sie eine Frage haben oder etwas nicht stimmt, wenden Sie sich an die
Person, von der Sie das Programm bekommen haben.

---

## Für Genauere

Die technischen Festlegungen dahinter stehen in `docs/SPEC.md` (Abschnitte 6.6.1
und 12.3) und in `ARCHITEKTUR.md`. Der Quelltext ist einsehbar; die Regeln aus diesem
Dokument sind dort durch automatische Tests abgesichert, nicht durch
Sorgfalt allein.
