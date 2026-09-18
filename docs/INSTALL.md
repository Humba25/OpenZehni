# Zehni installieren

> Für Eltern und alle, die Zehni auf einen Rechner bringen wollen.
> Es dauert etwa zwei Minuten und braucht keine Vorkenntnisse.

---

## Was Zehni ist

Ein Programm, mit dem Kinder ab etwa der 5. Klasse das Tippen mit zehn Fingern
lernen. Dazu gehören ein paar Einheiten über den Umgang mit Medien und darüber,
wie Lernen funktioniert.

Zehni ist kostenlos, werbefrei und braucht kein Konto. Es läuft vollständig auf
dem Rechner: Kein Lernfortschritt verlässt das Gerät. Ausführlich steht das in
[DATENSCHUTZ.md](DATENSCHUTZ.md).

---

## Was der Rechner braucht

| | |
|---|---|
| Betriebssystem | Windows 10 oder Windows 11 |
| Arbeitsspeicher | 4 GB reichen |
| Platz auf der Platte | etwa 50 MB |
| Internet | nur zum Herunterladen, danach nicht mehr |
| Adminrechte | **nein** |

Zehni ist für alte Familienlaptops gebaut. Wenn der Rechner den Browser
startet, startet er auch Zehni.

---

## Schritt für Schritt

### 1. Installer herunterladen

**Dieser Link führt immer zur neuesten Version:**

<https://github.com/Humba25/OpenZehni/releases/latest/download/Zehni-Setup.exe>

Die Adresse ändert sich nie. Man kann sie sich merken, weitergeben oder als
Lesezeichen ablegen — sie liefert stets die aktuelle Ausgabe.

Wer lieber nachsieht, was er bekommt: Auf der Releases-Seite des Projekts liegt
dieselbe Datei zusätzlich unter ihrem vollen Namen, also
`Zehni_1.2.3_x64-setup.exe`. Beide sind byteweise identisch; die eine ist nur
die Kopie der anderen unter einem festen Namen.

> **Einmal herunterladen genügt.** Zehni hält sich danach selbst aktuell (siehe
> „Updates" weiter unten). Auch ein älterer Installer führt also innerhalb
> weniger Augenblicke zur neuesten Fassung.

### 2. Doppelklick — und die Warnung von Windows

Beim ersten Start meldet sich Windows mit einem blauen Fenster:

> **Der Computer wurde durch Windows geschützt**
> Von Microsoft Defender SmartScreen wurde der Start einer unbekannten App
> verhindert.

**Das ist normal, und es ist kein Zeichen dafür, dass etwas nicht stimmt.**
Windows kennt Zehni schlicht nicht: Damit ein Programm ohne Warnung startet,
muss der Hersteller ein Zertifikat kaufen, das jährlich Geld kostet. Für ein
kostenloses Programm gibt es das nicht.

So geht es weiter:

1. Auf **Weitere Informationen** klicken.
2. Auf **Trotzdem ausführen** klicken.

> **Ein Wort dazu, das über Zehni hinausgeht:** So eine Warnung wegzuklicken
> ist genau der Reflex, den man sich normalerweise **nicht** angewöhnen sollte.
> Der Unterschied ist, dass Sie hier wissen, woher die Datei kommt und warum
> die Warnung erscheint. Bei einer Datei aus einer E-Mail oder von einer
> unbekannten Seite gilt das Gegenteil. Zehni bringt Ihrem Kind genau diese
> Unterscheidung bei — es wäre schade, sie schon bei der Installation zu
> übergehen.

### 3. Der Installer

Er fragt wenig. Voreingestellt ist:

- Installation nach `%LOCALAPPDATA%\Zehni` — also in das eigene Benutzerkonto,
  **ohne Adminrechte**. Auf Schul- und Familiengeräten ist das der Punkt, an
  dem sonst alles scheitert.
- Eine Verknüpfung auf dem Desktop.
- **Kein** Autostart.

Falls auf dem Rechner die Komponente „WebView2" fehlt — auf Windows 11 und
aktuellem Windows 10 ist sie vorhanden —, lädt der Installer sie automatisch
nach. Dafür wird einmalig Internet gebraucht.

### 4. Starten

Zehni öffnet sich, begrüßt und führt durch eine kurze Einrichtung: Name (darf
leer bleiben), Alter, Themen, Tagesziel. Dazu kommt eine kleine Prüfung der
Tastatur — dazu unten mehr.

---

## Die Tastaturprüfung

Zehni zeigt auf dem Bildschirm, wo jede Taste liegt. Dafür muss Windows auf die
**deutsche** Tastatur eingestellt sein. Liegt eine andere Belegung an, zeigt
Zehni falsche Tasten, und das Kind lernt etwas Falsches.

Deshalb wird beim ersten Start geprüft, ob vier bestimmte Zeichen ankommen.
Geht die Prüfung schief, hilft:

1. Unten rechts neben der Uhr auf das Sprachkürzel klicken (`DEU` oder `ENG`).
2. **Deutsch (Deutschland)** wählen.
3. In Zehni die Prüfung wiederholen.

Alternativ mit `Windows` + `Leertaste` durchschalten. Die Einstellung findet
sich auch unter *Einstellungen → Zeit und Sprache → Sprache und Region*.

---

## Wo die Daten liegen

| Was | Wo |
|---|---|
| Das Programm | `%LOCALAPPDATA%\Zehni` |
| Lernfortschritt, Abzeichen, Einstellungen | `%APPDATA%\de.zehni.app` |

Beides lässt sich im Explorer öffnen, indem man den Pfad in die Adresszeile
tippt. Wer den Fortschritt sichern will, kopiert den zweiten Ordner.

---

## Updates

Zehni sieht beim Start nach, ob es eine neue Version gibt. Wenn ja, erscheint
unten rechts ein kleiner Hinweis — kein Fenster, das etwas verlangt, und nichts
wird ungefragt installiert. Wer nicht klickt, arbeitet einfach weiter.

Ohne Internet passiert an dieser Stelle gar nichts, und die App funktioniert
unverändert.

---

## Deinstallieren

Über *Einstellungen → Apps → Installierte Apps → Zehni → Deinstallieren*.

Dabei fragt Zehni, ob der Lernfortschritt auf dem Rechner bleiben soll.
Voreingestellt ist **ja** — wer versehentlich deinstalliert und neu
installiert, findet alles wieder. Nur wer ausdrücklich „Nein" wählt, löscht die
Daten, und das lässt sich nicht rückgängig machen.

---

## Wenn etwas nicht geht

| Problem | Was hilft |
|---|---|
| Windows lässt den Installer nicht zu | „Weitere Informationen" → „Trotzdem ausführen", siehe oben |
| Zehni startet nicht | Rechner neu starten. Hilft das nicht, fehlt vermutlich WebView2: „Microsoft Edge WebView2 Runtime" von Microsoft herunterladen und installieren |
| Die Tastaturprüfung schlägt fehl | Tastaturbelegung auf Deutsch stellen, siehe oben |
| Der Fortschritt ist weg | Nachsehen, ob unter `%APPDATA%\de.zehni.app` eine Datei `zehni.db` liegt. Ist sie da, ist der Fortschritt da |
| Ein Virenscanner meldet sich | Kommt bei unsignierten Programmen vor. Die Datei stammt aus den Releases des Projekts; im Zweifel dort erneut herunterladen |
