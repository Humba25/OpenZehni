# Zehni

**Tippen lernen mit zehn Fingern — kostenlos, werbefrei, offline.**

Zehni bringt Kindern ab etwa der 5. Klasse das Zehnfingersystem bei. Dazu
kommen Einheiten zu Medienkompetenz, Textverarbeitung nach DIN 5008 und
Lerntechniken.

Kein Konto, kein Abo, keine Werbung, keine Telemetrie. Alles läuft auf dem
eigenen Rechner.

---

## Warum es das gibt

Einer Schule wurde ein kostenpflichtiger Nachmittagskurs zum Tastschreiben
angeboten: 29,90 € im Monat. Inhaltlich sinnvoll, preislich unverhältnismäßig —
besonders für Familien, für die das eine Frage ist.

Zehni ist die kostenlose Alternative dazu. Es soll denselben Zweck erfüllen und
darf dabei ruhig weniger können, solange es das Wesentliche kann.

---

## Was Zehni kann

- **25 Lektionen** von der Grundstellung bis zum Abschlusstest, mit
  Tastaturbild und Fingerführung nach DIN 2137-1 (T1-Belegung).
- **Amtliche Messung** nach der Wettschreibordnung: Anschläge mit Umschalttaste,
  Fehler am Ergebnistext, Fehlerquote in Prozent.
- **Übungstexte zu zehn Themen**, passend zum bereits gelernten Zeichenvorrat —
  in keinem Text kommt ein Zeichen vor, das noch nicht dran war.
- **Drei Altersstufen**, die nur Wortschatz und Satzlänge steuern. Lernpfad und
  Normen sind für alle gleich.
- **Medienkompetenz** mit nachgestellten Situationen statt Merksätzen, unter
  strengen Schutzregeln (siehe unten).
- **Textverarbeitung** nach DIN 5008 in kindgerechter Auswahl.
- **„Lernen lernen"** — acht Einheiten, deren Aussagen über den Lernfortschritt
  ausschließlich mit den echten Daten der Nutzerin belegt werden.
- **Motivation**: XP, Level, Abzeichen, Serie mit Jokern, Tagesaufgabe,
  Wochenziel, Geisterschreiber gegen den eigenen Rekord, zwei Minispiele.

## Was Zehni bewusst nicht tut

- Keine Telemetrie, kein Tracking, kein Konto, keine Cloud.
- Keine Werbung, keine Käufe.
- Keine Bestrafungsmechanik: keine Leben, keine Countdowns, die eine Übung
  abbrechen, kein Fehlerton.
- Keine Lerntypen-Lehre — wissenschaftlich nicht belegt.
- **Kein Formular nimmt echte persönliche Daten entgegen.** In den
  Medienkompetenz-Einheiten sind Telefonnummer und Name fest vorgegeben und
  nicht änderbar; frei eingeben lässt sich nur Harmloses. Nichts davon wird
  gespeichert, nichts verlässt das Gerät.

---

## Installieren

Fertige Installer liegen unter [Releases](../../releases). Anleitung für
Eltern: [`docs/INSTALL.md`](docs/INSTALL.md).

Was gespeichert wird und was nicht:
[`docs/DATENSCHUTZ.md`](docs/DATENSCHUTZ.md).

---

## Selbst bauen

Gebraucht werden Node 24 LTS und eine Rust-Werkzeugkette (stable).

```bash
npm install
npm run dev      # Entwicklungsmodus
npm run build    # Produktionsbuild und Installer
npm test         # Unit-Tests
npm run lint     # ESLint, Prettier, tsc
```

Zielhardware sind alte Familien- und Schullaptops. Sparsamkeit ist eine
Funktionsanforderung, keine Stilfrage: Der Installer bleibt unter 20 MB, der
Kaltstart unter vier Sekunden.

---

## Für Mitlesende und Mitmachende

Die Bauanleitung und die unverhandelbaren Regeln stehen in
[`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md). Bevor dort etwas geändert wird,
lohnt sich ein Blick hinein — mehrere Regeln sehen wie Kleinigkeiten aus und
sind in Wahrheit Normvorgaben.

| Datei | Inhalt |
|---|---|
| [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md) | Architektur, Befehle, unverhandelbare Regeln |
| [`docs/SPEC.md`](docs/SPEC.md) | vollständige Fachspezifikation |
| [`docs/NORMEN.md`](docs/NORMEN.md) | DIN 2137, DIN 5008, Zählweise, Notenschlüssel |
| [`docs/DIDAKTIK.md`](docs/DIDAKTIK.md) | Herleitung des Lernpfads |
| [`docs/MODUL-LERNEN.md`](docs/MODUL-LERNEN.md) | Modul „Lernen lernen" |

Alles ist auf Deutsch: Oberfläche, Inhalte, Kommentare. Nur Bezeichner im Code
sind englisch.

---

## Lizenz

[GNU General Public License v3.0](LICENSE).

Du darfst Zehni benutzen, weitergeben und verändern. Wenn du eine veränderte
Fassung weitergibst, muss auch sie unter der GPL stehen und ihren Quelltext
offenlegen. Wer hiermit arbeitet, gibt weiter, was er bekommen hat.

---

## Name

„Zehni" ist frei gewählt und spielt auf die zehn Finger an. Das Maskottchen ist
eine Maus — wegen Tastatur und Maus.
