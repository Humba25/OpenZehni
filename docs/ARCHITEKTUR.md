# Zehni — Architektur und verbindliche Regeln

Diese Datei beschreibt, wie Zehni gebaut ist und welche Regeln dabei nicht
verhandelbar sind. Sie gilt für jeden, der an diesem Programm arbeitet.

Die vollständige Fachspezifikation steht in [`SPEC.md`](SPEC.md), die
verbindlichen Normen und Regelwerke in [`NORMEN.md`](NORMEN.md), das Modul
„Lernen lernen" in [`MODUL-LERNEN.md`](MODUL-LERNEN.md), die Herleitung des
Lernpfads in [`DIDAKTIK.md`](DIDAKTIK.md).

Rangfolge bei Widerspruch: **`NORMEN.md` → `SPEC.md` → diese Datei.**
Was gewinnt, wird im selben Zug in die unterlegene Datei nachgezogen.

---

## Projekt in drei Sätzen

Zehni ist eine Windows-Desktop-App (Tauri v2 + React/TypeScript), mit der ein
Kind das 10-Finger-Tastschreiben lernt, dazu Medienkompetenz und Lerntechniken.
Kernzielgruppe ist die 5. Klasse; über drei Altersstufen (`A1` 8–10, `A2` 11–13,
`A3` ab 14, `SPEC.md` 9.8) passen sich **nur die Texte** an — Lernpfad,
Fingersatz und Normen sind für alle gleich. Alles läuft offline; Übungstexte kommen optional aus einer
kostenlosen KI-API, sonst aus einer mitgelieferten Textdatenbank. Zielhardware
sind alte Laptops — Sparsamkeit ist eine Funktionsanforderung.

---

## Sprache

- **Oberfläche, Inhalte, Kommentare, Commit-Messages: Deutsch.**
- Code-Bezeichner (Variablen, Funktionen, Typen, Tabellen- und Spaltennamen):
  **Englisch**.
- Nutzertexte niemals hartkodieren — immer über `src/i18n/de.ts`.

---

## Befehle

```bash
npm install              # Abhängigkeiten
npm run dev              # Tauri-Dev-Modus (Frontend + Rust, Hot Reload)
                         # Laeuft mit eigener Kennung und eigenem Datenordner,
                         # damit Testrunden nie im echten Lernfortschritt
                         # landen.
npm run build            # Produktionsbuild + NSIS-Installer
npm test                 # Vitest (Unit)
npm run lint             # ESLint + Prettier + tsc --noEmit
npm run validate:seed    # prüft content/topics.seed.json gegen validateText()
npm run check:din5008    # prüft alle ausgegebenen Texte gegen DIN 5008
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

**Noch nicht vorhanden**, hier bewusst nicht aufgeführt: `npm run test:e2e`
(Playwright ist noch nicht eingerichtet) und `cargo test` (die Rust-Seite hat
noch keine Tests — sie besteht in M1 nur aus dem Start und den Migrationen).
Eine Arbeitsanweisung, die Befehle verspricht, die ins Leere laufen, ist eine
Falle für die nächste Sitzung.

Vor jedem Commit müssen `npm run lint`, `npm test` und `cargo clippy`
fehlerfrei durchlaufen. Wer Inhalte geändert hat, zusätzlich
`npm run validate:seed` und `npm run check:din5008`.

**Wer `tauri.conf.json`, die Plugins in `src-tauri/src/lib.rs` oder die
Berechtigungen in `src-tauri/capabilities/` anfasst, startet die App
anschließend wirklich** — `npm run dev`, bis das Fenster offen ist. Kein Test
und kein Bundler merkt, wenn die Anwendung beim Start abstürzt; genau das ist
am 2026-09-15 passiert und wäre beinahe ausgeliefert worden.

---

## Architekturregeln

1. **Logik gehört nach `src/lib/`.** Tipp-Engine, Metriken, Zeichensätze,
   Scheduler, XP-Rechnung sind reine TypeScript-Module ohne React-Import und
   ohne DB-Zugriff. Sie sind vollständig unit-getestet. React-Komponenten
   enthalten keine Lernlogik.
2. **Netzwerk und Schlüssel nur in Rust.** Kein `fetch` aus dem Frontend zu
   einem KI-Anbieter, kein API-Schlüssel im JS-Bundle. Das Frontend ruft
   ausschließlich Tauri-Commands.
3. **Datenbankzugriff nur über `src/db/`.** Keine SQL-Strings in Komponenten.
   Jede Schemaänderung ist eine neue Datei in `src-tauri/migrations/`;
   **bestehende Migrationen werden nie verändert — auch kein Komma im
   Kommentar.** Die Datenbank merkt sich eine Prüfsumme jeder angewandten
   Migration; weicht der Text ab, verweigert sie den ganzen Satz, und die App
   kann bei jedem, der die alte Fassung ausgeführt hat, nichts mehr speichern.
   Abgesichert durch `src/db/migrationen.test.ts` gegen
   `src-tauri/migrations/PRUEFSUMMEN.txt`.

   **Nach einer Schemaänderung reicht es nicht, die App zu starten** — sie
   startet auch, wenn die Datenbank streikt. Nachsehen, ob die neue Migration
   in `_sqlx_migrations` steht.
4. **Inhalte sind Daten, kein Code.** Lektionen, Themen, Texte, Modulaufgaben
   liegen als JSON in `content/` und werden typisiert eingelesen.
5. **Ein Feature pro Ordner** unter `src/features/`; gemeinsame UI-Bausteine in
   `src/components/`.

---

## Unverhandelbare Regeln

Diese Punkte sind in der Vergangenheit die typischen Fehlerquellen. Sie sind
durch Tests abzusichern, nicht durch Sorgfalt.

- **Messen nach amtlicher Zählweise.** Anschläge: jeder Tastendruck, Umschalt
  und AltGr zählen mit (Großbuchstabe = 2 Anschläge). Fehler: falsche, fehlende,
  zusätzliche Zeichen und Zeilenschaltungsfehler, gezählt **am Ergebnistext** —
  während des Schreibens korrigierte Fehler zählen nicht. Fehlerquote =
  (Fehler × 100) / Anschläge. Das ist `NORMEN.md` 4 und nicht verhandelbar;
  `countStrokes()` ist die einzige Stelle, die Anschläge zählt. Die zweite
  Kennzahl „Sicherheit" (Treffer ohne Korrektur) ist reine Trainingsrückmeldung
  und fließt **nie** in eine Bewertung ein.
- **Tastatur ist T1 nach DIN 2137-1:2023-08.** Kein US-Layout mit deutschen
  Beschriftungen. Bei erkanntem Fremdlayout bleibt der Lernpfad gesperrt.
- **Alle ausgegebenen Texte folgen DIN 5008:2020-03** — Seed, KI-Texte,
  Oberfläche, Urkunde. Geprüft durch `checkDin5008()` in Validator und CI.
- **Keine Norm behaupten, die wir nicht einhalten.** Zehni ist nicht
  zertifiziert, das Diplom ist eine Selbstprüfung, Normtexte werden nicht
  mitgeliefert oder zitiert. Lektionsreihenfolge und Fingersatzzuordnung sind
  Konvention, keine Norm — in der App nie als Norm ausgeben (`NORMEN.md` 3.2, 8).
- **Kein ungelerntes Zeichen.** In keinem Übungstext einer Lektion darf ein
  Zeichen vorkommen, das erst in einer späteren Lektion eingeführt wird —
  weder aus dem Seed noch aus der KI. Golden Test vorhanden halten.
- **Jede KI-Antwort wird validiert** (`validate_text`): Zeichensatz, Länge,
  Blocklist, keine URLs, kein Degenerationsmuster. Ungültig ⇒ verwerfen, nicht
  reparieren. Maximal ein Wiederholungsversuch, Gesamttimeout 4 s, dann Seed.
- **Offline ist der Normalfall.** Kein Bildschirm, kein Ablauf darf auf eine
  Netzwerkantwort warten. KI-Ausfälle sind für die Nutzerin unsichtbar.
- **Keine Telemetrie, keine personenbezogenen Daten nach außen.** Ein KI-Request
  enthält nur Thema, Zeichensatz, Länge, Level.
- **Kein Formular in Zehni nimmt echte persönliche Daten entgegen.** Die
  Medienkompetenz-Fallen (`SPEC.md` 6.6.1) stellen Situationen nach, in denen
  jemand nach Telefonnummer oder E-Mail fragt. Diese Felder sind **immer schon
  mit erfundenen Werten gefüllt und nicht änderbar** — ein Kind, das in der
  Übung seine echte Nummer eintippt, hätte genau den Reflex geübt, den die
  Einheit abgewöhnen soll. Frei eingeben darf es nur Harmloses (Spitzname,
  Lieblingstier). Eingaben aus Modulen bleiben im Arbeitsspeicher, werden **nie**
  in die Datenbank geschrieben und beim Verlassen verworfen; gespeichert werden
  nur zwei Wahrheitswerte je Einheit (abgeschlossen, Falle erkannt). Module
  sprechen mit **keinem** Netzwerk.
- **Keine erfundenen Fortschrittszahlen.** Im Modul „Lernen lernen" werden
  Aussagen über das Lernen mit den echten Daten der Nutzerin belegt. Liegen
  weniger als 5 Sitzungen vor, zeigt die Einheit ihre neutrale Fassung — es wird
  nie ein Beispielwert als ihr Wert ausgegeben (`MODUL-LERNEN.md` 1.1, 7).
- **Kein Lerntypentest, keine Lerntypen-Lehre** — wissenschaftlich nicht belegt
  (`MODUL-LERNEN.md` 3).
- **Keine Bestrafungsmechanik**: keine Leben, keine Countdowns, die eine Übung
  abbrechen, kein Fehlerton, kein Zwangsdialog beim Start.
- **Performance-Budget einhalten** (Spec 12.1): Kaltstart ≤ 4 s, RAM ≤ 250 MB,
  Eingabelatenz ≤ 30 ms p95, Installer ≤ 20 MB. Eine neue Abhängigkeit, die
  spürbar Startzeit oder Bundlegröße kostet, ist zu begründen oder zu lassen.
- **Keine Web-Fonts, keine CDN-Einbindungen.** Alles wird mitgeliefert.
- **Private Schlüssel gehören nie ins Repository** (Signierschlüssel und
  API-Schlüssel nur in GitHub-Secrets bzw. in der Remote-Konfiguration).

---

## Stil

- TypeScript `strict`, keine `any` ohne Kommentar mit Begründung.
- Funktionale React-Komponenten, keine Klassenkomponenten.
- Fehlerbehandlung explizit; keine stillen `catch {}`-Blöcke außer dort, wo die
  Spec ausdrücklich stilles Scheitern verlangt (Updater, Remote-Konfiguration) —
  dort mit Log-Eintrag.
- Kommentare erklären das *Warum*, nicht das *Was*. Didaktische Entscheidungen
  werden am Code kommentiert, damit sie nicht versehentlich „optimiert" werden.
- Commit-Messages: `bereich: kurze Beschreibung im Imperativ`
  (z. B. `metrics: Umschalttaste als eigenen Anschlag zaehlen`).

---

## Zielgruppe im Kopf behalten

Jede Entscheidung im Zweifel so treffen, wie es für ein 11-jähriges Kind auf
einem sieben Jahre alten Laptop am besten ist: schnell sichtbarer Erfolg,
kein Fachjargon, keine Wartezeit, keine Sackgasse, aus der es nicht allein
herausfindet.

Bei **Texten** zusätzlich die Altersstufe mitdenken (`SPEC.md` 9.8): Was für
eine Zwölfjährige gerade richtig ist, ist für einen Neunjährigen zu lang und für
eine Fünfzehnjährige albern. Im Zweifel `A2` schreiben — das ist der
Vollbestand, auf den alle anderen Stufen zurückfallen.
