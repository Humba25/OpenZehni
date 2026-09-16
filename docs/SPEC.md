# Zehni — Projektspezifikation

> Lernprogramm für 10-Finger-Schreiben, sicheren Medienumgang und Lerntechniken.
> Diese Datei ist die verbindliche Vorgabe für die Umsetzung.
> Stand: 2026-09-12 · Version der Spec: 1.1
>
> **Begleitdokument `NORMEN.md`**: Tastaturbelegung, Anschlagszählung,
> Fehlerbewertung, Notenschlüssel, DIN 5008 und die Zuordnung zum
> KMK-Kompetenzrahmen sind dort verbindlich geregelt. Bei Widerspruch
> gewinnt `NORMEN.md`.

---

## 1. Ausgangslage und Ziel

Der Schule wurde ein kostenpflichtiger Nachmittagskurs angeboten (fiellascript®,
„Tastaturbedienung, IT-Anwendungen und Textverarbeitung", ab 5. Schuljahr,
29,90 € monatlich inkl. Material und Portalzugang). Inhaltlich sinnvoll, preislich
unverhältnismäßig.

Der Maßstab für die Frage, ob Zehni den Kurs tatsächlich ersetzen kann, ist die
Leistungsliste des Angebots: Was es zusagt, muss Zehni abdecken — und wo es das
nicht kann, wird die Lücke benannt statt verschwiegen.

**Zehni** ist die eigene, kostenlose Alternative: eine Desktop-Anwendung, mit der
ein Kind das 10-Finger-Tastschreiben eigenständig lernt — ohne Abo, ohne Konto,
ohne dauerhafte Internetverbindung. Ergänzend vermittelt Zehni sauberen Umgang
mit Medien, Grundlagen der Textverarbeitung und Lerntechniken („Lernen lernen"),
spielerisch aufbereitet.

**Primäre Nutzerin:** Schülerin ab ca. 5. Klasse (10–13 Jahre), keine Vorkenntnisse.
**Sekundär:** weitere Kinder im Umfeld, Weitergabe als fertiger Installer.

Weil die App weitergegeben wird, trifft sie auf verschiedene Jahrgänge. Ein
Neunjähriger braucht andere Übungstexte als eine Zwölfjährige — gleiche Tasten,
andere Sprache. Zehni führt dafür drei **Altersstufen** (`A1` 8–10, `A2` 11–13,
`A3` ab 14), die ausschließlich Wortschatz, Satzlänge und Ansprache steuern.
Lernpfad, Fingersatz und alle Normen sind für alle Stufen identisch. Einzelheiten
in 9.8.

### 1.1 Erfolgskriterien

Zehni gilt als erfolgreich, wenn:

1. Die Nutzerin nach ca. 8–12 Übungseinheiten à 15 Minuten die Grundreihe blind
   beherrscht (Sicherheit ≥ 90 %, ≥ 60 Anschläge/Minute). Die Grundreihe liegt
   in `L01`–`L05` und damit im blockierenden Modus — dort bewertet die
   Sicherheit, nicht die amtliche Fehlerquote (`NORMEN.md` 4.4.1). Die
   Zählweise der Anschläge folgt unverändert `NORMEN.md` 4.1.
   Fernziel des Lernpfads ist die **Mindestleistung des Bundesjugendschreibens**:
   600 Anschläge in 10 Minuten bei höchstens 0,5 % Fehlerquote.
2. Sie die App **freiwillig** wieder öffnet — Motivation ist ein Funktionsziel,
   kein Beiwerk.
3. Die Installation durch einen Nicht-Techniker in unter 2 Minuten gelingt
   (Doppelklick auf `Zehni-Setup.exe`, fertig).
4. Updates ohne Neuinstallation ankommen.

### 1.2 Nicht-Ziele (bewusst ausgeschlossen)

- Kein Benutzerkonto, kein Login, keine Cloud-Synchronisation.
- Keine Telemetrie, kein Tracking, keine Werbung.
- Keine Mehrbenutzerverwaltung in v1 (ein Profil pro Installation; Profile-Wechsel
  ist Phase 3).
- Keine mobile App, keine Web-Version.
- Kein lokales LLM (zu schwer für die Zielhardware).

---

## 2. Leitprinzipien

Diese Prinzipien haben Vorrang vor Einzelfeatures. Bei Konflikten gewinnt das
höher stehende Prinzip.

1. **Sofort motivierend.** Vom Start bis zum ersten getippten Buchstaben
   vergehen maximal 60 Sekunden. Jede Einheit endet mit sichtbarem Fortschritt.
2. **Offline-first.** Alle Kernfunktionen arbeiten ohne Internet. Internet
   verbessert die App (frische Texte, Updates), ist aber nie Voraussetzung.
3. **Leichtgewichtig.** Zielhardware sind alte Familien- und Schullaptops
   (4 GB RAM, HDD, Windows 10). Siehe Performance-Budget (Abschnitt 12).
4. **Kindgerecht und sicher.** Keine Datenweitergabe, keine externen Links ohne
   Nachfrage, keine ungefilterten KI-Inhalte.
5. **Didaktik vor Technik.** Kein Feature, das die Lernlogik verwässert
   (z. B. kein Überspringen ungeübter Tasten, keine „Turbo"-Abkürzung).
6. **Fehlerfreundlich.** Fehler werden erklärt und wiederholt, nicht bestraft.
   Keine roten Kreuze, keine „Verloren"-Screens.

---

## 3. Technischer Stack

| Bereich | Entscheidung | Begründung |
|---|---|---|
| Framework | **Tauri v2** | Nutzt die in Windows 10/11 vorhandene WebView2, dadurch Installer ~8–15 MB und RAM-Verbrauch ~80–150 MB statt 300 MB+ bei Electron. Entscheidend für die Zielhardware. |
| UI | **React 18 + TypeScript + Vite** | Größtes Ökosystem, sehr gut von Codegeneratoren beherrscht, saubere Typisierung des Datenmodells. |
| Styling | **Tailwind CSS** + CSS-Variablen für Themes | Schnell, keine Laufzeitkosten, Theme-Wechsel (hell/dunkel/kontrastreich) über Variablen. |
| State | **Zustand** (Store) + TanStack Query nur falls nötig | Klein und ausreichend; kein Redux-Overhead. |
| Datenbank | **SQLite** über `tauri-plugin-sql` | Eine Datei, keine Serverkomponente, robust gegen Stromausfall. |
| Backend/Native | **Rust** (Tauri-Core) | Dateizugriff, DB, HTTP zur KI, Updater. |
| HTTP | `tauri-plugin-http` (Rust-Seite) | KI-Aufrufe laufen über Rust, nicht über die WebView — der API-Key landet nie im JS-Bundle-Kontext der Seite. |
| Auto-Update | `tauri-plugin-updater` + GitHub Releases | Signierte Updates, eingebauter Dialog. |
| Installer | **NSIS** (Tauri-Bundler-Target `nsis`) | Erzeugt `Zehni-Setup.exe`, Installation ohne Adminrechte (`perMachine: false`). |
| Tests | Vitest (Unit), Playwright (E2E gegen die Dev-App) | |
| CI | GitHub Actions (`windows-latest`) | Build, Test, Release-Artefakte, Update-Manifest. |

### 3.1 Verbindliche Randbedingungen

- **Node 24 LTS**, **Rust stable (MSRV ≥ 1.77)**.
  (Bis 2026-09-12 stand hier Node 20 LTS. Node 20 hat im April 2026 das
  Wartungsende erreicht und bekommt keine Sicherheitskorrekturen mehr —
  deshalb der Sprung auf die aktuelle LTS-Reihe. Die Regel dahinter:
  Zehni baut auf keiner Laufzeitumgebung ohne Sicherheitspflege.)
- Ziel: `x86_64-pc-windows-msvc`. Kein Linux-/macOS-Build in v1 (die Codebasis
  soll aber nichts Windows-Spezifisches außerhalb von `src-tauri/` enthalten,
  damit ein späterer Linux-Build billig bleibt).
- Kein Feature, das WebView2-Versionen unterhalb Chromium 110 bricht.
  Kein `:has()`-Selektor-Zwang, keine experimentellen APIs.
- Alle Strings über eine i18n-Schicht (`de-DE` als einzige Sprache in v1,
  Struktur aber vorbereitet).

---

## 4. Architektur

```
zehni/
├─ src/                          # React-Frontend
│  ├─ app/                       # Routing, Layout, Theme
│  ├─ features/
│  │  ├─ onboarding/             # Begrüßung, Interessenauswahl, Tastaturtest
│  │  ├─ typing/                 # Tipp-Engine, Tastaturvisualisierung, Lektions-UI
│  │  ├─ curriculum/             # Lernpfad, Lektionsdefinitionen, Freischaltlogik
│  │  ├─ gamification/           # XP, Level, Abzeichen, Streak, Belohnungen
│  │  ├─ content/                # Textbeschaffung: KI + lokale DB
│  │  ├─ modules/                # Medienkompetenz, Lernen lernen (Phase 2)
│  │  ├─ stats/                  # Fortschritt, Heatmap, Elternansicht
│  │  └─ settings/
│  ├─ lib/                       # Reine Logik, frei von React (gut testbar)
│  │  ├─ typing-engine.ts
│  │  ├─ metrics.ts
│  │  ├─ charset.ts
│  │  └─ scheduler.ts            # Welche Lektion/Wiederholung als Nächstes?
│  └─ db/                        # Zugriffsschicht + Migrationen
├─ src-tauri/
│  ├─ src/
│  │  ├─ main.rs
│  │  ├─ ai.rs                   # KI-Client, Prompting, Filter, Cache
│  │  ├─ remote_config.rs        # Abruf von Provider/Modell/Key
│  │  └─ db.rs
│  ├─ migrations/                # SQL-Migrationen, fortlaufend nummeriert
│  ├─ resources/
│  │  └─ content/topics.seed.json
│  └─ tauri.conf.json
├─ content/                      # Quelle der lokalen Inhalte (wird gebündelt)
├─ docs/
│  ├─ SPEC.md                    # diese Datei
│  ├─ NORMEN.md                  # Normen und Regelwerke (vorrangig)
│  ├─ MODUL-LERNEN.md            # Modul "Lernen lernen" im Detail
│  └─ DIDAKTIK.md
└─ .github/workflows/release.yml
```

### 4.1 Datenfluss für einen Übungstext

```
Lektion startet
  └─> content/provider.ts fragt: Text für (Lektion L, Thema T, Zeichensatz C)
        ├─ 1. Cache-Treffer in SQLite?            -> sofort liefern
        ├─ 2. Online + KI aktiviert?              -> Rust-Command ai_generate_text
        │      ├─ Antwort validieren (Zeichensatz, Länge, Blocklist)
        │      ├─ gültig -> in Cache schreiben, liefern
        │      └─ ungültig/Fehler/Timeout (4 s) -> Schritt 3
        └─ 3. Lokale Themen-Datenbank (Seed)      -> immer erfolgreich
```

Regel: **Der Nutzer merkt nie, welcher Weg gewonnen hat.** Kein Ladespinner
länger als 400 ms — greift der Cache nicht sofort, wird zuerst ein Seed-Text
angezeigt und im Hintergrund für die *nächste* Übung KI-Text nachgeladen
(Vorab-Generierung, siehe 9.5).

---

## 5. Datenmodell (SQLite)

Migrationen liegen in `src-tauri/migrations/NNNN_name.sql` und laufen beim Start.

```sql
-- Profil (v1: genau eine Zeile mit id=1)
CREATE TABLE profile (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  avatar        TEXT NOT NULL DEFAULT 'maus',
  created_at    TEXT NOT NULL,
  daily_goal_min INTEGER NOT NULL DEFAULT 10,
  ai_enabled    INTEGER NOT NULL DEFAULT 1,
  theme         TEXT NOT NULL DEFAULT 'hell',
  age_band      TEXT NOT NULL DEFAULT 'A2'   -- A1 | A2 | A3, siehe 9.8.
                                             -- Nur die Stufe, nie ein Geburtsdatum.
);

-- Gewählte Interessen (Mehrfachauswahl aus den 10 Themen)
CREATE TABLE interests (
  topic_id      TEXT NOT NULL,
  weight        INTEGER NOT NULL DEFAULT 1,   -- 2 = Lieblingsthema
  PRIMARY KEY (topic_id)
);

-- Fortschritt je Lektion
CREATE TABLE lesson_progress (
  lesson_id     TEXT PRIMARY KEY,
  status        TEXT NOT NULL,                -- locked | unlocked | passed
  stars         INTEGER NOT NULL DEFAULT 0,   -- 0..3
  best_strokes_min REAL,
  best_error_rate  REAL,
  attempts      INTEGER NOT NULL DEFAULT 0,
  last_played   TEXT
);

-- Jede einzelne Übungsrunde (Basis aller Statistiken)
CREATE TABLE sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id     TEXT NOT NULL,
  started_at    TEXT NOT NULL,
  duration_ms   INTEGER NOT NULL,
  strokes_total INTEGER NOT NULL,   -- Anschläge nach NORMEN.md 4.1 (Umschalt zählt mit)
  errors        INTEGER NOT NULL,   -- Fehler nach NORMEN.md 4.2
  error_rate    REAL NOT NULL,      -- Fehlerquote in Prozent
  strokes_min   REAL NOT NULL,      -- Anschläge pro Minute
  first_try_pct REAL NOT NULL,      -- "Sicherheit": ohne Korrektur richtig
  topic_id      TEXT,
  source        TEXT NOT NULL                 -- ai | seed | cache
);

-- Fehlerprofil je Zeichen: Grundlage für gezielte Wiederholung
CREATE TABLE char_stats (
  char          TEXT PRIMARY KEY,
  hits          INTEGER NOT NULL DEFAULT 0,
  misses        INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms REAL,
  updated_at    TEXT
);

-- Häufigste Verwechslungen (erwartet -> getippt)
CREATE TABLE confusions (
  expected      TEXT NOT NULL,
  typed         TEXT NOT NULL,
  count         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (expected, typed)
);

-- Gamification
CREATE TABLE rewards (
  id            TEXT PRIMARY KEY,             -- Abzeichen-ID
  earned_at     TEXT NOT NULL
);
CREATE TABLE streak (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  current_days  INTEGER NOT NULL DEFAULT 0,
  longest_days  INTEGER NOT NULL DEFAULT 0,
  last_day      TEXT,
  freezes_left  INTEGER NOT NULL DEFAULT 2
);
CREATE TABLE xp (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  total         INTEGER NOT NULL DEFAULT 0
);

-- Tagesaufgabe (8.6): genau eine Zeile je Tag, wird nie gelöscht,
-- damit dieselbe Aufgabe nach einem Neustart erhalten bleibt.
CREATE TABLE daily_challenge (
  day           TEXT PRIMARY KEY,             -- ISO-Datum, z. B. 2026-09-12
  challenge_id  TEXT NOT NULL,                -- Schlüssel aus content/challenges.json
  progress      INTEGER NOT NULL DEFAULT 0,
  done_at       TEXT,                         -- NULL = offen; verpasst bleibt NULL
  dismissed     INTEGER NOT NULL DEFAULT 0
);

-- Wochenziel (8.8): eine Zeile je Kalenderwoche nach ISO 8601
CREATE TABLE weekly_goal (
  week          TEXT PRIMARY KEY,             -- z. B. 2026-W37
  target        INTEGER NOT NULL,             -- steigt nie um mehr als 1 (8.8)
  progress      INTEGER NOT NULL DEFAULT 0,
  reward_given  INTEGER NOT NULL DEFAULT 0
);

-- Fortschritt in den Zwischenstücken und Modulen (6.6).
--
-- ACHTUNG: Hier stehen **zwei Wahrheitswerte und ein Datum**, sonst nichts.
-- Was das Kind in einer Falle eingetippt hat, wird NIE gespeichert -- weder
-- der Spitzname noch irgendetwas anderes (6.6.1, Regel 3). Wer dieser Tabelle
-- eine Spalte für Eingaben hinzufügt, hebt die Zusage auf, die in der
-- Elternansicht steht.
CREATE TABLE module_progress (
  unit_id     TEXT PRIMARY KEY,          -- z. B. 'medien-f1', 'lernen-e1'
  completed   INTEGER NOT NULL DEFAULT 0,
  -- Nur bei Fallen belegt: hat das Kind sie erkannt?
  recognized  INTEGER,
  completed_at TEXT
);

-- Textcache (KI-generiert und Seed gleichermaßen)
CREATE TABLE text_cache (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id      TEXT NOT NULL,
  charset_key   TEXT NOT NULL,   -- deterministischer Hash des erlaubten Zeichensatzes
  level         INTEGER NOT NULL,
  body          TEXT NOT NULL,
  source        TEXT NOT NULL,   -- ai | seed
  used_count    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
CREATE INDEX idx_cache_lookup ON text_cache (topic_id, charset_key, level);
```

Speicherort: `%APPDATA%\Zehni\zehni.db`.
Bei jedem Start wird vor der Migration eine Kopie als `zehni.db.bak` angelegt.

---

## 6. Didaktik: der Lernpfad

Detaillierte Herleitung in `docs/DIDAKTIK.md`. Verbindlich ist Folgendes.

> **Normstatus:** Die Tastaturbelegung ist genormt (T1, DIN 2137-1:2023-08),
> die Zuordnung Finger → Taste **nicht** — sie ist in allen deutschen Lehrwerken
> gleich und wird unverändert übernommen. Die Reihenfolge, in der die Tasten
> eingeführt werden, ist ebenfalls nicht genormt und eine begründete eigene
> Entscheidung. Siehe `NORMEN.md` 3.2; in der App darf sie nicht als Norm
> ausgegeben werden.

### 6.1 Fingersatz (Belegung T1, DIN 2137-1:2023-08)

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

Grundstellung: `a s d f` / `j k l ö`, Tastgefühl über die Noppen auf `f` und `j`.

### 6.2 Lektionsreihenfolge

Jede Lektion schaltet neue Zeichen frei; **es erscheinen nie Zeichen, die noch
nicht gelernt wurden** (harte Regel, betrifft auch KI-Texte).

| # | ID | Neue Zeichen | Schwerpunkt |
|---|---|---|---|
| 1 | `L01` | `f j` + Leertaste | Grundstellung finden, Tastgefühl |
| 2 | `L02` | `d k` | |
| 3 | `L03` | `s l` | |
| 4 | `L04` | `a ö` | Grundreihe komplett |
| 5 | `L05` | — | Wiederholung Grundreihe, erste echte Wörter |
| 6 | `L06` | `g h` | Zeigefinger-Streckung |
| 7 | `L07` | `e i` | obere Reihe beginnt |
| 8 | `L08` | `r u` | |
| 9 | `L09` | `t z` | |
| 10 | `L10` | `w o` | |
| 11 | `L11` | `q p` | |
| 12 | `L12` | `ü` | |
| 13 | `L13` | — | Wiederholung: Grund- + obere Reihe |
| 14 | `L14` | `v m` | untere Reihe beginnt |
| 15 | `L15` | `c ,` | |
| 16 | `L16` | `x .` | erste Satzzeichen |
| 17 | `L17` | `y n` | |
| 18 | `L18` | `b ä` | |
| 19 | `L19` | `ß -` | |
| 20 | `L20` | Umschalt links/rechts | Großbuchstaben (Umschalt immer gegengleich!) |
| 21 | `L21` | `! ?` `;` `:` | Satzzeichen mit Umschalt |
| 22 | `L22` | Zahlenreihe `1`–`0` | |
| 23 | `L23` | `@ / ( ) "` | Sonderzeichen, AltGr für `@` |
| 24 | `L24` | — | Fließtext, Geschwindigkeitstraining |
| 25 | `L25` | — | Abschlusstest: 10-Minuten-Abschrift, `NORMEN.md` 4.7 |

**Wiederholungslektionen** (`L05`, `L13`, `L24`) und die adaptive Wiederholung
(6.4) sind Pflicht, nicht optional.

### 6.3 Bestehenskriterien

**Maßgeblich ist `NORMEN.md` 4.8, die Trennlinie steht in `NORMEN.md` 4.4.1.**
Der Lernpfad zerfällt in zwei Hälften, weil der blockierende Modus (7.1) eine
falsche Taste gar nicht durchlässt: Der Ergebnistext ist dort immer fehlerfrei,
die amtliche Fehlerquote also immer 0,00 % und als Kriterium unbrauchbar.

**`L01`–`L13` (blockierend) — Sterne nach Sicherheit:**

| Lektionen | ★ | ★★ | ★★★ (zusätzlich) |
|---|---|---|---|
| `L01`–`L05` | Sicherheit ≥ 90,0 % | ≥ 95,0 % | ≥ 98,0 % **und** 60 A/min |
| `L06`–`L13` | Sicherheit ≥ 93,0 % | ≥ 96,0 % | ≥ 98,5 % **und** 80 A/min |

**Ab `L14` (fließend) — Sterne nach amtlicher Fehlerquote:**

| Lektionen | Zielfehlerquote (★) | Zielgeschwindigkeit (★★★) |
|---|---|---|
| `L14`–`L19` | ≤ 1,5 % | 100 A/min |
| `L20`–`L23` | ≤ 1,0 % | 120 A/min |
| `L24` | ≤ 0,5 % | 140 A/min |
| `L25` | Abschlusstest nach `NORMEN.md` 4.7 | — |

Sterne im fließenden Teil: ★ Zielfehlerquote erreicht · ★★ höchstens die Hälfte
davon · ★★★ höchstens ein Viertel davon **und** Zielgeschwindigkeit.

Die Staffelung führt planmäßig an die 0,5-%-Grenze heran, die in Wettbewerb und
Ausbildung gilt. Die nächste Lektion schaltet bereits bei ★ frei — Perfektion
darf den Fortschritt nicht blockieren.

In `L01`–`L13` erscheint das Wort „Fehlerquote" **nirgends** in der Oberfläche
(`NORMEN.md` 4.4.1). Alle Schwellen dieses Abschnitts liegen als Datentabelle in
`lib/curriculum.ts` und sind an genau einer Stelle änderbar.

### 6.4 Adaptive Wiederholung

Nach jeder Lektion bestimmt `lib/scheduler.ts` die drei schwächsten Zeichen aus
`char_stats` (Gewicht: `misses / (hits + misses)` × Ø-Latenz). Diese Zeichen
werden im nächsten Übungstext mit erhöhter Häufigkeit angefordert (Parameter
`emphasize` im Textrequest, siehe 9.2) und im Aufwärmen der nächsten Einheit als
kurze Drill-Sequenz (20 Sekunden) geübt.

### 6.5 Aufbau einer Übungseinheit

0. **Erklärseite**: Welche Tasten kommen neu dazu, und **welcher Finger nimmt
   sie**? Dazu die Handgrafik mit den betroffenen Fingern. In `L01`–`L05`
   zusätzlich die Grundstellung und der Hinweis auf die Tastmarken von `f` und
   `j`; ab `L20` der Hinweis auf die gegengleiche Umschalttaste.
1. **Aufwärmen** (20 s): Drill der Problemzeichen aus 6.4, ohne Bewertung.
2. **Hauptteil** (2–4 Minuten): Übungstext zum gewählten Interessenthema.
3. **Auswertung**: A/min, Kennzahl der Stufe, Vergleich zum letzten Mal,
   Sterne, XP.
4. **Belohnung**: Fortschrittsbalken, ggf. Abzeichen, ggf. neues Deko-Teil.

Nie mehr als 5 Minuten am Stück ohne Auswertungsbildschirm.

> **Warum Schritt 0 nachträglich dazukam:** Die erste lauffähige Fassung zeigte
> die richtige Taste, ließ aber offen, **mit welchem Finger** man sie nehmen
> soll — also genau das, worum es beim Zehnfingersystem geht. Die Fingerführung
> stand in 7.3 bereits, war aber nicht gebaut; die Erklärseite kam am
> 2026-09-14 dazu.
>
> Die Erklärseite ist **kein Zwangsdialog**: Ein Klick oder die Eingabetaste
> gehen weiter, Escape zurück. Die Zuordnung Zeichen → Finger wird aus
> `lib/charset.ts` abgeleitet und nirgends zweitgeschrieben.

---

### 6.6 Zwischenstücke: Medienkompetenz und Lernen lernen im Lernpfad

**Nach jeder dritten Lektion** steht ein Zwischenstück von drei bis fünf
Minuten — eine Einheit aus Medienkompetenz (10.1) oder „Lernen lernen" (10.3).
Acht Stück über den ganzen Lernpfad:

| Nach | Einheit | Warum dort |
|---|---|---|
| `L03` | **Falle: „Du hast gewonnen!"** | Früh, weil es die wichtigste und die packendste Einheit ist. Ein Kind, das den Lernpfad abbricht, hat wenigstens diese eine gesehen. |
| `L06` | Lernen lernen E1: „Kann das jemand von Geburt an?" | Braucht keine Fortschrittsdaten und kommt genau dann, wenn die ersten Zweifel auftauchen. |
| `L09` | Passwörter | |
| `L12` | Lernen lernen E2: „Deine eigene Kurve" | Hier liegen sicher mehr als fünf Sitzungen vor — Voraussetzung dafür, dass die Einheit mit echten Daten arbeiten darf (`MODUL-LERNEN.md` 1.1). |
| `L15` | **Falle: „Das Internet vergisst nie"** | |
| `L18` | Lernen lernen E5: „Die Delle" | Die zähste Stelle des Lernpfads: alle Buchstaben da, Großschreibung noch nicht, sichtbarer Fortschritt gering. |
| `L21` | **Falle: „Das Kleingedruckte"** | Nach den Satzzeichen, wenn längere Texte lesbar sind. |
| `L24` | Lernen lernen E8: „Aufschreiben" | Vor dem Abschlusstest. |

Die übrigen **zehn** Einheiten liegen im frei zugänglichen Modulbereich und sind
jederzeit spielbar: sechs aus der Medienkompetenz (10.1, Einheiten 2 bis 7) und
vier aus „Lernen lernen" (E3, E4, E6, E7).

> Hier stand bis zum 2026-09-15 „sieben". Die Zahl stammte aus der Zeit, bevor
> die acht Zwischenstücke feststanden, und war beim Bauen des Modulbereichs
> nachzurechnen: Medienkompetenz hat 7 Einheiten plus 3 Fallen, „Lernen lernen"
> 8 Einheiten, zusammen 18; acht davon liegen im Lernpfad, bleiben zehn.

**Ein Zwischenstück hält nicht auf.** Es ist überspringbar wie alles andere;
wer es überspringt, bekommt es später noch einmal angeboten. Der Lernpfad
bleibt offen (`ARCHITEKTUR.md`: keine Sackgasse).

#### 6.6.1 Fallen — verbindliche Regeln

Drei der acht Zwischenstücke sind **Fallen**: Die App stellt eine Situation
nach, in der jemand versucht, an persönliche Daten zu kommen. Wer sie erkennt
und abbricht, bekommt ein Abzeichen und eine Erklärung, was er richtig gemacht
hat. Wer hineintappt, bekommt **dieselbe Aufmerksamkeit** und eine Erklärung,
was in Wirklichkeit passiert wäre.

Damit das kein Schaden anrichtet, gilt Folgendes ohne Ausnahme:

1. **Kein Formular in Zehni nimmt echte persönliche Daten entgegen.**
   Telefonnummer, E-Mail-Adresse und Anschrift sind in den Fallen bereits mit
   erfundenen Werten ausgefüllt und **nicht änderbar**. Das Kind spielt eine
   erfundene Person.

   Begründung: Ein Kind, das in der Übung seine echte Nummer eintippt, hat
   genau den Reflex geübt, den die Einheit abgewöhnen soll. Der Lernmoment ist
   **der Klick auf „Absenden"**, nicht das Tippen.

2. **Frei eingeben darf das Kind nur Harmloses** — Spitzname, Lieblingstier,
   Lieblingsfarbe. Genau das taucht in „Das Internet vergisst nie" später
   wieder auf. Es fühlt sich persönlich an und ist doch kein Merkmal, mit dem
   sich jemand identifizieren ließe.

3. **Nichts davon wird gespeichert.** Eingaben aus den Modulen bleiben im
   Arbeitsspeicher, werden nie in die Datenbank geschrieben und beim Verlassen
   der Einheit verworfen. Gespeichert wird ausschließlich, **ob** eine Einheit
   abgeschlossen und ob die Falle erkannt wurde — zwei Wahrheitswerte.

4. **Nichts verlässt das Gerät.** Die Module sprechen mit keinem Netzwerk. Auch
   nicht mit der KI-Schnittstelle (9.3) — die kennt nur Thema, Zeichensatz,
   Länge und Level und wird für Module gar nicht erst aufgerufen.

5. **Die Auflösung kommt sofort**, in derselben Einheit, und ohne Häme. Kein
   „Reingefallen!", kein Punktabzug, keine Wiederholungssperre. Wer hineintappt,
   bekommt später eine andere Falle und kann das Abzeichen dort noch holen.

6. **Der falsche Zeitdruck bleibt folgenlos.** Eine Falle darf mit einem
   ablaufenden Zähler drohen („nur noch 2:00 Minuten!") — das ist das
   Erkennungsmerkmal, um das es geht. Er darf aber **nichts** abbrechen und
   nichts verlieren lassen. Das ist kein Verstoß gegen 8.11, sondern dessen
   Gegenstand: Das Kind soll lernen, dass solche Zähler Druck vortäuschen.

7. **Nicht jedes Zwischenstück ist eine Falle.** Würde jede Einheit durch
   Wegklicken gelöst, lernte das Kind Wegklicken statt Prüfen. Einige
   Zwischenstücke enthalten deshalb eine völlig harmlose Eingabe — etwa die
   eigenen Einstellungen in Zehni —, bei der Ausfüllen die richtige Antwort
   ist. Das Abzeichen gibt es fürs **Unterscheiden**, nicht fürs Abbrechen.

8. **Eltern werden informiert.** Die Elternansicht nennt ausdrücklich, dass
   Zehni solche Situationen nachstellt, und mit welchen Schutzregeln. Niemand
   soll davon überrascht werden.

---

### 6.7 Der Lernweg ist eine Folge von Stationen

**Ergänzt am 2026-09-16 nach dem ersten Ausprobieren.** Der Lernweg zeigte bis
dahin 25 Lektionen und sonst nichts; Module und Minispiele lagen hinter einem
eigenen Menü in der Kopfzeile. Die Rückmeldung der Nutzerseite dazu war
eindeutig: *„der ist aus meiner sicht sehr steil ich würde auf dem Hauptpfad
mehr Spiele und Übungen gleich mit einbauen damit man sich nicht groß
durchklicken muss ich glaube das machen nämlich viele nicht."*

Das trifft zu. Ein Menü, in das man erst hineinklicken muss, existiert für die
meisten nicht — und damit war die halbe App unsichtbar.

Der Lernweg besteht deshalb aus **Stationen**:

| Art | Woher | Wie viele |
|---|---|---|
| Lektion | `content/lessons.json` | 25 |
| Zwischenstück | `content/interludes.json`, Position aus `afterLesson` | 8 |
| Modul-Einheit | `content/lernpfad.json` | 17 |
| Minispiel | `content/lernpfad.json` | 4 Stationen, 2 Spiele |

Die Anordnung steht als Plan in `content/lernpfad.json` — Inhalte sind Daten,
kein Code (`ARCHITEKTUR.md`, Architekturregel 4). Verbindlich dabei:

- **Keine Station hält auf.** Die nächste Lektion wird allein durch die vorige
  freigeschaltet. `lib/lernpfad.ts` kennt keine Funktion, die aus einer Station
  eine Bedingung machen könnte.
- **Eine Station ist offen, sobald die Lektion davor offen ist** — nicht erst,
  wenn sie bestanden wurde. Wer an einer Lektion hängt, soll etwas anderes
  machen dürfen, statt in einer Sackgasse zu sitzen.
- **Nie mehr als vier Lektionen ohne Station.** Durch Test abgesichert.
- **Keine Station nach einer Lektion mit Zwischenstück.** Zwei Unterbrechungen
  hintereinander wären eine zu viel.
- **Kein ungelerntes Zeichen, auch nicht in einer Station.** Die beiden
  Textproben aus 10.2 werden getippt und stehen deshalb erst ab `L22`;
  „Wortsalat" erst ab `L07`. Beides prüft ein Test gegen den Zeichenvorrat der
  Lektion, nicht gegen eine Vermutung.

Das Verbot aus 8.10 („nie in eine Lektion eingebaut") bleibt unberührt: Ein
Minispiel steht **zwischen** Lektionen, nie darin, und schaltet nichts frei.

Die Menüs in der Kopfzeile bleiben als Übersicht zum Wiederholen bestehen.
Gebraucht werden sie nicht mehr.

---

## 7. Tipp-Engine (`lib/typing-engine.ts`)

Reine, React-freie Logik — der Kern der App und der am besten getestete Teil.

### 7.1 Verhalten

- Der Text wird zeichenweise verglichen. Zustände je Zeichen:
  `pending | correct | wrong | corrected`.
- **Blockierender Modus (Standard für `L01`–`L13`):** Bei einem Fehler rückt der
  Cursor nicht weiter; das falsche Zeichen wird markiert, die richtige Taste auf
  der Tastaturgrafik hervorgehoben. So prägt sich die richtige Bewegung ein.
- **Fließender Modus (ab `L14`, umschaltbar):** Fehler werden markiert, der
  Cursor läuft weiter; Korrektur per Rücktaste möglich.
- `Rücktaste` korrigiert. Ein korrigiertes Zeichen zählt **nicht** als Fehler
  für die amtliche Fehlerquote (bewertet wird der Ergebnistext, `NORMEN.md` 4.2),
  wird aber als `corrected` festgehalten und fließt in die zweite Kennzahl
  „Sicherheit" (Treffer beim ersten Anschlag) und damit in das Fehlerprofil je
  Taste ein. Beide Zahlen sind strikt getrennt zu halten (`NORMEN.md` 4.4).
- `Enter` nur, wenn der Text Zeilenumbrüche enthält (ab `L21`).
- `Escape` pausiert. Pause stoppt die Zeitmessung.
- **Tote Zeit**: Pausen > 3 s zwischen zwei Anschlägen werden aus `duration_ms`
  herausgerechnet (verhindert absurd niedrige A/min nach Ablenkung).
  Ausnahme: der Abschlusstest `L25` läuft wettbewerbsgetreu ohne diese
  Herausrechnung (`NORMEN.md` 4.5).

### 7.2 Metriken (`lib/metrics.ts`)

Definitionen verbindlich nach `NORMEN.md` 4.1–4.5:

```
Anschläge     = countStrokes(text)   // Umschalt/AltGr zählen mit:
                                     // Großbuchstabe = 2, '@' = 2, 'a' = 1
Fehler        = falsche + fehlende + zusätzliche Zeichen
                + Zeilenschaltungsfehler   (am Ergebnistext, Korrekturen zählen nicht)
Fehlerquote % = (Fehler * 100) / Anschläge
A/min         = Anschläge / aktive Minuten
WPM           = A/min / 5
Sicherheit %  = Zeichen ohne Korrektur richtig / Zeichen gesamt   // nur Training
```

`countStrokes()` ist die **einzige** Stelle im Code, an der Anschläge gezählt
werden, und braucht eine Tabelle aller T1-Zeichen, die Umschalt oder AltGr
erfordern. Angezeigt wird primär **A/min** und die **Fehlerquote**; WPM klein
daneben, weil Kinder es aus Online-Tipptests kennen.

### 7.3 Tastaturvisualisierung

- SVG-Nachbildung der deutschen Standardbelegung **T1 nach DIN 2137-1:2023-08**,
  alle Tasten adressierbar (nicht: US-Layout mit deutschen Beschriftungen).
- Farbcodierung nach Finger (acht Farben, farbenblind-tauglich geprüft;
  siehe 12.2). Konsistent mit den Farben der Handgrafik.
- Die als Nächstes zu tippende Taste pulsiert dezent; der zuständige Finger wird
  in der Handgrafik hervorgehoben.
- Bei Umschalt-Zeichen wird **beide** Tasten angezeigt (Zeichen + gegengleiche
  Umschalttaste) — das ist der häufigste Anfängerfehler.
- Handgrafik kann in den Einstellungen ausgeblendet werden (ab Fortgeschritten).
- **Kein** „Bildschirm-Blick-Verbot"-Zwang; stattdessen ab `L05` optionaler
  Blindmodus, der die Tastaturgrafik nach 10 Sekunden ausblendet und dafür
  Bonus-XP gibt.

### 7.4 Tastatur-Eingabe technisch

- Verarbeitung über `keydown` mit `event.code` **und** `event.key`.
  `event.code` identifiziert die physische Taste (für die Visualisierung),
  `event.key` das erzeugte Zeichen (für den Textvergleich).
- Tote Tasten (`^`, `´`) und AltGr-Kombinationen (`@`, `|`, `~`) müssen korrekt
  verarbeitet werden — hierfür zusätzlich `beforeinput` auswerten.
- Erkennung eines nicht-deutschen Layouts beim Onboarding: Nutzerin tippt `z`,
  `ö`, `ß` und `@` (AltGr+Q); kommt etwas anderes an, ist der Lernpfad gesperrt
  und es erscheint eine bebilderte Anleitung zur Layout-Umstellung in Windows
  (`NORMEN.md` 3.1). **Dieser Test ist Pflicht** — ein falsches
  Layout macht die ganze App unbrauchbar und die Ursache ist für ein Kind nicht
  auffindbar.

---

## 8. Gamification

Die Motivation trägt das Projekt. Regel: **Belohnung folgt der Anstrengung,
nicht dem Zufall.** Keine Lootboxen, keine Verlustmechanik, keine Zeitdruck-Timer
als Kernmechanik.

### 8.1 XP und Level

| Aktion | XP |
|---|---|
| Lektion abgeschlossen | 50 |
| je Stern | 25 |
| Tagesziel erreicht | 40 |
| Persönliche Bestleistung (A/min) | 30 |
| Blindmodus-Bonus | +20 % der Einheit |
| Abzeichen | 100 |
| Tagesaufgabe erfüllt (8.6) | 35 |
| Tastenjagd abgeschlossen (8.9) | 15 |
| Minispiel gespielt (8.10), höchstens dreimal je Tag | 10 |
| Wochenziel erreicht (8.8) | 120 + Deko-Teil |

Die Deckelung beim Minispiel ist Absicht: XP sollen dem Lernpfad folgen, nicht
der Spielzeit (8.10).

Levelgrenzen: `XP(n) = 100 · n · 1,25^(n-1)` (gerundet auf 10). Level 1–30.
Jedes Level vergibt ein Deko-Teil für die Lernstube (8.4).

### 8.2 Abzeichen (Auswahl, mindestens diese 15 in v1)

`grundstellung` · `erste-woerter` · `obere-reihe` · `untere-reihe` ·
`grossschreiber` (Umschalt gemeistert) · `zahlenjongleur` ·
`sonderzeichen-profi` · `blindflug` (10 Min. im Blindmodus) ·
`fehlerfrei` (eine Lektion mit 0,00 % Fehlerquote) · `sprinter` (120 A/min) ·
`ausdauer` (30 Min. an einem Tag) · `woche` (7-Tage-Serie) ·
`monat` (30-Tage-Serie) · `neugierig` (alle 10 Themen probiert) ·
`zehni-diplom` (Abschlusstest bestanden).

Dazu drei Abzeichen aus den Zwischenstücken (6.6):
`nicht-reingefallen` (eine Falle erkannt) · `wachsam` (alle drei erkannt) ·
`durchblicker` (alle acht Zwischenstücke abgeschlossen).

Jedes Abzeichen hat Icon, Titel, Beschreibung und eine kurze Gratulation.

**Kein Abzeichen fürs Hineintappen, und keines dafür, einfach alles
wegzuklicken.** Wer eine Falle nicht erkennt, verliert nichts und bekommt beim
nächsten Mal eine neue Gelegenheit (6.6.1, Regel 5). Und weil nicht jedes
Zwischenstück eine Falle ist (Regel 7), führt blindes Abbrechen nicht zum
Abzeichen — es gibt es fürs **Unterscheiden**.

### 8.3 Serie (Streak)

- Ein Tag zählt, wenn das Tagesziel (Standard 10 Minuten) erreicht wurde.
- **Zwei „Joker" pro Monat**, die einen verpassten Tag ausgleichen — automatisch,
  ohne Nachfrage. Die Serie soll motivieren, nicht bestrafen.
- Nach Verlust der Serie: freundliche Einordnung („Deine längste Serie: 12 Tage.
  Auf zur nächsten!"), keine Dramatisierung.

### 8.4 Die Lernstube

Ein einfacher, isometrischer Raum, der mit erspielten Gegenständen eingerichtet
wird (Pflanze, Poster, Lampe, Haustier, Schreibtisch-Kram). Rein kosmetisch,
kein Spielmechanismus dahinter — das Ziel ist Wiedererkennung und Besitzgefühl.
Umsetzung als CSS-positionierte SVG-Layer, keine Game-Engine.

### 8.5 Maskottchen

„Zehni", eine Maus (Anspielung auf Tastatur & Maus), begleitet als kleine
SVG-Figur mit fünf Zuständen: `idle`, `freut-sich`, `denkt`, `winkt`,
`schläft`. Kommentiert sparsam — maximal ein Satz je Auswertungsbildschirm,
nie während des Tippens.

### 8.6 Tagesaufgabe

Eine kleine zusätzliche Aufgabe pro Tag, **freiwillig**, mit Extra-XP. Sie steht
als kleine Karte auf dem Startbildschirm und lässt sich wegklicken.

- Der Aufgabenkatalog liegt als Daten in `content/challenges.json`, nicht im
  Code (Architekturregel 4). Jede Aufgabe nennt Bedingung, Text und XP.
- Gezogen wird **nur aus Aufgaben, die mit den bereits freigeschalteten
  Lektionen erfüllbar sind.** Eine Aufgabe, die ein Zeichen aus `L18` verlangt,
  darf in `L03` nicht erscheinen.
- Beispiele: „200 Anschläge ohne Vertipper", „drei Runden im Blindmodus",
  „eine Lektion mit ★★ abschließen", „zwei Minuten am Stück üben".
- **Nicht geschafft heißt gar nichts.** Um Mitternacht verschwindet die Karte
  stillschweigend. Es gibt keine Meldung über eine verpasste Aufgabe, keinen
  Zähler verpasster Tage, keinen Verlust.
- Die Ziehung ist deterministisch aus Datum und Profil-ID — dieselbe Aufgabe
  bleibt den Tag über stehen, auch nach Neustart.

### 8.7 Wettlauf gegen dich selbst (Geisterschreiber)

Ein zweiter, blasser Cursor läuft durch denselben Text — im Tempo des eigenen
besten früheren Durchgangs derselben Lektion. Kein Gegner von außen, nur der
eigene Rekord (`NORMEN.md`-fern, reine Motivation).

- Datengrundlage ist `lesson_progress.best_strokes_min`; der Geist läuft in
  **gleichmäßigem** Tempo. Bewusst keine Aufzeichnung einzelner Anschlagzeiten:
  Das kostet Speicher und Rechenzeit, und der Nutzen wäre gering
  (Performance-Budget 12.1).
- Erscheint erst ab dem **zweiten** Versuch einer Lektion — vorher gibt es
  nichts zu schlagen.
- Abschaltbar in den Einstellungen. **Im Abschlusstest `L25` ist er immer aus**
  (Wettbewerbsbedingungen, `NORMEN.md` 4.7).
- Der Geist bricht nie etwas ab und gewinnt nie lautstark: Ist er zuerst fertig,
  läuft die Übung normal weiter und die Auswertung sagt sachlich, wie knapp es
  war. Er ist ein Schrittmacher, kein Countdown (siehe 8.10).

### 8.8 Wochenziel

Ein größeres Ziel über die Woche mit sichtbarem Balken, zum Beispiel
„5 Lektionen diese Woche". Belohnung: ein Abzeichen oder ein Deko-Teil für die
Lernstube (8.4).

- Die Woche läuft **Montag bis Sonntag** (ISO 8601, wie in `NORMEN.md` 5 für
  Datumsangaben zugrunde gelegt).
- Das Ziel richtet sich nach der tatsächlichen Aktivität der Vorwoche und darf
  **nie um mehr als eine Einheit steigen**. Damit kann daraus keine Tretmühle
  werden, die sich mit jedem guten Ergebnis selbst hochschraubt.
- Nicht erreicht: Der Balken beginnt am Montag neu. Keine Meldung, keine
  Einordnung, kein Verlust — wie bei der Serie (8.3) gilt: motivieren, nicht
  bestrafen.

### 8.9 Tastenjagd

Macht die adaptive Wiederholung (6.4) sichtbar und spielerisch: Die App weiß aus
`char_stats`, welche Taste ständig danebengeht, und bietet nach der Auswertung
eine kurze Jagd darauf an — „Dein `z` macht dir Ärger. Fünf Runden Jagd?"

- 30–45 Sekunden, kurze Sequenzen mit dem Problemzeichen in wechselnder
  Umgebung. **Nur bereits gelernte Zeichen** (harte Regel aus 6.2).
- **Unbewertet**: keine Sterne, keine Fehlerquote, kein Eintrag in
  `lesson_progress`. XP gibt es, weil Anstrengung belohnt wird (8, Leitregel).
- Immer ein Angebot, nie ein Zwang — wegklickbar wie die Tagesaufgabe.
- **Erst ab belastbarer Datenlage.** Ein Zeichen wird nur dann als Problem
  benannt, wenn es mindestens **zwölf Mal** angeschlagen wurde. Darunter sagt
  die App nichts über dieses Zeichen. Begründung: Es ist dieselbe Regel, die für
  das Modul „Lernen lernen" gilt (`MODUL-LERNEN.md` 1.1, 7) — über die Nutzerin
  wird nur behauptet, was ihre eigenen Daten hergeben. Eine Jagd auf ein Zeichen,
  das sie zweimal verhauen hat, ist eine erfundene Schwäche.

### 8.10 Minispiele

Eigene kleine Spiele **neben** dem Lernpfad, erreichbar über einen eigenen
Eintrag, nie in eine Lektion eingebaut. In v1 zwei Stück:

| Spiel | Ablauf |
|---|---|
| `buchstabenregen` | Buchstaben fallen von oben, die richtige Taste fängt sie ab. |
| `wortsalat` | Verdrehte Wörter wieder richtig tippen. |

Verbindliche Schranken, damit die Spiele nicht gegen 8.11 verstoßen:

- **Nur bereits gelernte Zeichen** — dieselbe harte Regel wie für Übungstexte.
- Kein Ergebnis eines Minispiels fließt in `sessions`, `lesson_progress`,
  `char_stats` oder in irgendeine Bewertung ein. XP ja, Sterne nein.
- **Ein Minispiel schaltet nie eine Lektion frei.** Wer nur spielt, kommt im
  Lernpfad nicht voran — und wer nicht spielt, verpasst nichts.
- Keine Leben, kein Verlieren-Bildschirm. Ein Spiel endet von selbst und ist
  sofort neu startbar. Eine Zeitbegrenzung *innerhalb* eines Minispiels ist
  zulässig, weil es keine Übung ist, die dadurch abgebrochen würde.
- Umsetzung als DOM/SVG ohne Spiel-Engine und ohne neue Abhängigkeit
  (Performance-Budget 12.1).

> **Aufwandshinweis:** Die Minispiele sind unter allen Punkten dieses Abschnitts
> der mit Abstand teuerste und der einzige, der nichts zum Lernpfad beiträgt.
> Sie stehen deshalb in Meilenstein M6 und dürfen kein früheres Ziel verzögern.

### 8.11 Was ausdrücklich nicht gebaut wird

- Kein Countdown, der eine laufende Übung abbricht.
- Keine Bestenliste gegen andere (es gibt nur ein Profil).
- Keine Herzen/Leben, die den Zugang begrenzen.
- Kein Ton, der bei Fehlern spielt. (Erfolgstöne ja, dezent, abschaltbar.)

### 8.12 Einstellungsbildschirm

Mehrere Abschnitte dieser Spec sagen, etwas sei „in den Einstellungen"
abschaltbar — der Geisterschreiber (8.7), die KI-Texte (9.3). Dieser Abschnitt
hält fest, wo das liegt, damit die Zusagen nicht ins Leere zeigen. Er steht
hier, weil die Einstellungen überwiegend Gamification-Schalter tragen; die
Nummer wurde angehängt statt eingeschoben, damit die Verweise auf 8.11 in Code
und Dokumentation gültig bleiben.

Erreichbar über die Kopfzeile, jederzeit, auch mitten im Lernpfad. Enthalten
sind: Name, Altersstufe (9.8), Tagesziel, Themen (9.1), Darstellung
einschließlich hohem Kontrast (12.2), Geisterschreiber, Blindmodus, KI-Texte
und ein Knopf, um die Tastaturprüfung (7.4) zu wiederholen.

Dazu **Version und Updates** (11.1): die laufende Versionsnummer, ein Knopf
„Jetzt nach Updates suchen" und die Antwort im Klartext. Ergänzt am 2026-09-16,
weil der Hinweis unten rechts nur erscheint, **wenn** es etwas gibt — wer
wissen will, ob er aktuell ist, hatte sonst keine Stelle zum Nachsehen.

- **Jede Änderung wirkt sofort und wird sofort gespeichert.** Kein
  Speichern-Knopf, den man vergessen kann — für ein Kind ist das eine Falle.
- **Keine Einstellung kostet Fortschritt**, und jede ist sofort zurücknehmbar.
  Wer die Altersstufe ändert, bekommt andere Texte, behält aber Lektionen, XP
  und Abzeichen.
- Das Onboarding (Abschnitt 6.5 Schritt 0 und 9.8) erscheint dadurch **nicht**
  erneut; `profile.onboarded_at` bleibt unangetastet.

---

## 9. Inhalte: KI-Generierung mit lokalem Fallback

### 9.1 Die zehn Themen

Beim Onboarding wählt die Nutzerin 1–3 Themen (änderbar in den Einstellungen).
Jedes Thema existiert **immer** auch als lokale Textsammlung, unabhängig davon,
ob die KI erreichbar ist.

| ID | Thema |
|---|---|
| `tiere` | Tiere & Natur |
| `weltall` | Weltall & Planeten |
| `sport` | Sport & Bewegung |
| `musik` | Musik & Instrumente |
| `technik` | Technik & Erfindungen |
| `geschichte` | Geschichte & Abenteuer |
| `kochen` | Kochen & Backen |
| `reisen` | Länder & Reisen |
| `kunst` | Kunst & Basteln |
| `raetsel` | Rätsel & Witze |

### 9.2 Der Textrequest

Das Frontend fragt Text niemals direkt bei einem Anbieter an, sondern ruft den
Rust-Command `generate_text`:

```ts
type TextRequest = {
  topicId: string;
  lessonId: string;
  allowedChars: string;   // exakter Zeichensatz, z.B. "fjdk asdf ..." 
  emphasize: string[];    // Problemzeichen aus 6.4, max. 3
  minChars: number;       // z.B. 120
  maxChars: number;       // z.B. 320
  level: number;          // Lesestufe aus Lektion UND Altersstufe (9.8),
                          // nicht die blanke Lektionsnummer.
                          // Es wird bewusst kein Altersfeld übertragen.
};

type TextResponse = {
  body: string;
  source: 'ai' | 'seed' | 'cache';
};
```

### 9.3 Anbieter und Schlüssel

- Anbieter sind **austauschbar**. Implementiert wird ein Trait `AiProvider` mit
  mindestens zwei Implementierungen: **OpenRouter** und **Groq** (beide bieten
  kostenlose Kontingente; konkrete Modell-IDs und Limits ändern sich laufend und
  gehören deshalb nicht fest in den Code).
- Anbieter, Modell-ID, Endpunkt und Schlüssel kommen aus einer
  **Remote-Konfiguration** (`remote_config.rs`): eine JSON-Datei, die beim Start
  (max. 1×/24 h, Timeout 2 s) von einer festen URL geladen und in
  `%APPDATA%\Zehni\remote.json` zwischengespeichert wird.

```json
{
  "schema": 1,
  "providers": [
    { "id": "openrouter", "endpoint": "...", "model": "...", "key": "...", "priority": 1 },
    { "id": "groq",       "endpoint": "...", "model": "...", "key": "...", "priority": 2 }
  ],
  "aiEnabled": true
}
```

  Vorteil: Modellwechsel, Anbieterwechsel oder ein kompromittierter Schlüssel
  lassen sich ohne App-Update beheben. Fällt der Abruf aus, gilt die letzte
  gecachte Konfiguration, danach die im Build eingebackene Notfallkonfiguration.

- **Ehrliche Einordnung:** Ein Schlüssel, der auf fremden Rechnern liegt, ist
  nicht geheim. Deshalb gilt:
  - nur Schlüssel mit kostenlosem Kontingent und hartem Ausgabelimit verwenden,
  - Schlüssel niemals im JS-Bundle, nur im Rust-Teil bzw. in `remote.json`,
  - clientseitige Drosselung: max. 40 Generierungen/Tag/Installation,
  - Rotation ist ein Einzeiler in der Remote-Konfiguration.
- Optional in den Einstellungen: „Eigener API-Schlüssel" (Power-User, leer per
  Default). Ein eigener Schlüssel hat Vorrang vor der Remote-Konfiguration.

### 9.4 Prompt und Validierung

Systemprompt (sinngemäß, final in `src-tauri/src/ai.rs`):

> Du schreibst Übungstexte für ein Kind (10–13 Jahre), das Tastschreiben lernt.
> Thema: {thema}. Verwende **ausschließlich** diese Zeichen: {allowedChars}.
> Keine anderen Buchstaben, Ziffern oder Satzzeichen — auch keine Anführungs-
> zeichen oder Bindestriche. Länge: {min}–{max} Zeichen. Kurze, einfache Sätze.
> Sachlich richtig, altersgerecht, freundlich. Keine Gewalt, keine Angst-
> themen, keine Werbung, keine Links, keine Namen realer Personen.
> Halte dich an DIN 5008: nach Satzzeichen ein Leerzeichen, davor keines;
> keine doppelten Leerzeichen; Zahlen ab fünf Stellen in Dreiergruppen mit
> Leerzeichen; Datum als TT.MM.JJJJ; Einheiten mit Leerzeichen vom Wert
> getrennt.
> Antworte ausschließlich mit dem Übungstext, ohne Einleitung.

**Jede** Antwort durchläuft `validate_text()` — keine Ausnahme:

1. Zeichensatzprüfung: jedes Zeichen ∈ `allowedChars`. Ein Verstoß ⇒ verwerfen.
   (Kein „Reparieren" durch Ersetzen — das erzeugt sinnlose Wörter.)
2. Längenprüfung `minChars ≤ len ≤ maxChars`.
3. Blocklist (Gewalt, Sexualität, Drogen, Beleidigungen, Selbstverletzung) —
   Wortliste in `content/blocklist.de.txt`, Prüfung wortgrenzenbasiert.
4. Keine URLs, E-Mail-Adressen, Telefonnummern (Regex).
5. Keine Wiederholung eines Satzes mehr als zweimal (Degenerationsschutz).
6. **DIN-5008-Prüfung** (`checkDin5008()`, siehe `NORMEN.md` 5.1): Abstände bei
   Satzzeichen, doppelte Leerzeichen, Zahlengliederung, Datums- und
   Uhrzeitformat, Einheiten. Ein Verstoß ⇒ verwerfen. Dieselbe Funktion prüft
   Seed- und Oberflächentexte.

Maximal **ein** Wiederholungsversuch mit verschärftem Prompt, dann Fallback.
Gesamttimeout für den KI-Weg: **4 Sekunden**.

### 9.5 Vorab-Generierung und Cache

- Beim Start und nach jeder Lektion füllt ein Hintergrundjob den Cache für die
  nächsten 3 Lektionen × gewählte Themen auf (Ziel: je 5 Texte).
- Ein Text wird erst nach 3-maliger Nutzung erneut verwendet; danach bevorzugt
  Neugenerierung.
- Cache-Obergrenze 2000 Einträge; ältestes/am häufigsten genutztes zuerst löschen.
- Vollständig offline bleibt die App unbegrenzt nutzbar (Seed-Texte + Cache).

### 9.6 Lokale Themen-Datenbank (Seed)

`content/topics.seed.json`, wird als Tauri-Resource gebündelt und beim ersten
Start in `text_cache` importiert (`source = 'seed'`).

Anforderung an den Seed-Bestand (Definition of Done für Meilenstein M2):

- Zeichensatzstufen (nicht je Lektion, sonst explodiert der Aufwand):
  `S1` = Grundreihe (`L01`–`L05`), `S2` = + `g h e i r u t z w o q p ü`
  (`L06`–`L13`), `S3` = + untere Reihe (`L14`–`L19`),
  `S4` = + Großbuchstaben/Satzzeichen (`L20`–`L21`), `S5` = voll (`L22`–`L25`).
- **Mengenrechnung mit Altersstufen** (9.8): `S1` und `S2` sind Silbendrills und
  altersneutral (`"age": "alle"`) — je 8 Texte. Ab `S3` wird nach Altersstufe
  unterschieden, Vollbestand ist `A2`:

  | Stufe | Altersstufen | Texte je Thema |
  |---|---|---|
  | `S1`, `S2` | `alle` | 2 × 8 = 16 |
  | `S3`, `S4`, `S5` | `A2` vollständig | 3 × 8 = 24 |
  | `S3`, `S4`, `S5` | `A1`, `A3` als Ergänzung | 3 × 2 × 4 = 24 |

  Ergibt **64 Texte je Thema**, also 10 × 64 = **640 Texte** als Zielbestand.
  Davon sind 400 der Pflichtteil (`alle` + `A2`), die übrigen 240 dürfen
  lückenhaft bleiben — der Rückfall aus 9.8 fängt jede Lücke stumm ab.
- Die Texte dürfen maschinell erzeugt werden, müssen aber denselben
  `validate_text()`-Check bestehen wie KI-Texte (inklusive DIN-5008-Prüfung).
  Der Validator wird dafür als CLI-Skript (`scripts/validate-seed.ts`)
  bereitgestellt und läuft in der CI.
- Texte in S1/S2 sind notgedrungen kunstvoll („fad ledert ...") — das ist normal
  für Tipptrainer. Trotzdem gilt: aussprechbare Silben vor Zufallsbuchstaben.

Struktur:

```json
{
  "schema": 1,
  "topics": [
    {
      "id": "tiere",
      "label": "Tiere & Natur",
      "icon": "paw",
      "texts": [
        { "charset": "S1", "age": "alle", "body": "..." },
        { "charset": "S3", "age": "A1", "body": "..." },
        { "charset": "S3", "age": "A2", "body": "..." }
      ]
    }
  ]
}
```

### 9.7 Drilltexte für Lektionen mit engem Zeichenvorrat

**Das Problem.** Die Zeichensatzstufen aus 9.6 fassen ganze Lektionsblöcke
zusammen, die harte Regel „kein ungelerntes Zeichen" (6.2) gilt aber je
**Lektion**. Nur in neun der 25 Lektionen deckt sich beides:

| Deckungsgleich (Seed-Texte direkt verwendbar) | Enger als die Stufe (Seed-Texte **unzulässig**) |
|---|---|
| `L04` `L05` `L12` `L13` `L19` `L21` `L23` `L24` `L25` | `L01`–`L03`, `L06`–`L11`, `L14`–`L18`, `L20`, `L22` |

In `L01` sind `f`, `j` und die Leertaste gelernt. Jeder `S1`-Seed-Text enthält
darüber hinaus `a s d k l ö`. Ohne Netz stünde dort also **kein einziger
zulässiger Text** zur Verfügung — ein Verstoß gegen „Offline ist der
Normalfall". Die KI-Seite hat das Problem nicht, weil `allowedChars` im
Textrequest (9.2) je Lektion exakt gesetzt wird; sie ist aber ausdrücklich
optional und darf nie Voraussetzung sein.

**Die Lösung: `lib/drill.ts`.** Ein reines, React- und DB-freies TypeScript-Modul,
das den Übungstext für diese 16 Lektionen lokal erzeugt.

- Eingabe: erlaubter Zeichenvorrat der Lektion, die neuen Zeichen, die
  Problemzeichen aus `char_stats` (6.4) und die Ziellänge.
- **Deterministisch**: Der Zufallsgenerator wird aus Lektions-ID und
  Versuchsnummer gesät. Derselbe Versuch ergibt denselben Text (nötig für
  Golden Tests und für den Geisterschreiber, 8.7); der nächste Versuch ergibt
  einen anderen.
- Die **neuen** Zeichen der Lektion machen rund 40 % der Anschläge aus, die
  Problemzeichen werden zusätzlich angehoben — das ist die Umsetzung von 6.4
  für diese Lektionen.
- Ausgabe in Gruppen von zwei bis fünf Zeichen, Zeilen von 40 bis 60 Zeichen,
  nie zwei Leerzeichen hintereinander, nie Leerzeichen am Anfang oder Ende.
- **Aussprechbare Silben vor Zufallsbuchstaben** (9.6). Sobald der Vorrat einen
  Vokal enthält, werden Konsonant-Vokal-Muster gebildet. `L01`–`L03` haben
  **keinen** Vokal (`f j`, dann `d k`, dann `s l`) — dort sind rhythmische
  Gruppen wie `fff jjj fjf jfj` das einzig Mögliche und in Tipptrainern die
  übliche Form.
- Der Golden Test aus 6.2 prüft für **jede** Lektion und viele Seeds, dass kein
  erzeugtes Zeichen außerhalb des Vorrats liegt.

**Folge für 9.6:** Die 400 Seed-Texte bedienen die neun deckungsgleichen
Lektionen, das freie Üben und die Wiederholungen — nicht den gesamten Lernpfad.
Das senkt ihre Dringlichkeit nicht, verschiebt aber ihren Zweck: Sie liefern die
*inhaltlich interessanten* Texte, `drill.ts` liefert die *technisch zulässigen*.

**Meilenstein:** `lib/drill.ts` gehört nach **M1**, nicht nach M2. Ohne das
Modul sind `L01`, `L02` und `L03` nicht spielbar, und M1 ist definiert als
„die Grundreihe von Anfang bis Ende üben".

### 9.8 Altersstufen

Ein Kind von neun Jahren braucht andere Texte als eines von zwölf — gleiche
Tasten, andere Sprache. Die Altersstufe betrifft **ausschließlich den Inhalt**:
Wortschatz, Satzlänge, Themenbehandlung und die Ansprache des Maskottchens.
Lektionsreihenfolge, Fingersatz, Zeichensatzstufen und alle Normen aus
`NORMEN.md` bleiben davon unberührt — ein Anschlag ist in jedem Alter ein
Anschlag.

| ID | Alter | Merkmale der Texte |
|---|---|---|
| `A1` | 8–10 | Kurze Hauptsätze (6–12 Wörter), Alltagswortschatz, konkrete Bilder, kein Fachwort ohne Erklärung |
| `A2` | 11–13 | Sätze von 10–18 Wörtern, Nebensätze erlaubt, Fachwörter mit Zusammenhang, auch Zahlen und Vergleiche |
| `A3` | ab 14 | Sätze von 12–25 Wörtern, sachlicher Ton ohne Kindersprache, abstrakte Zusammenhänge, keine Verniedlichung |

**Erhoben wird eine Stufe, kein Geburtsdatum.** Das Onboarding fragt einmal nach
dem Alter und speichert nur `A1`, `A2` oder `A3` in `profile.age_band`.
Änderbar in den Einstellungen. Begründung: Datensparsamkeit (12.3) — für die
Textauswahl genügt die Stufe.

**Die KI erfährt das Alter nicht als eigenes Feld.** `NORMEN.md`-nah und in
`ARCHITEKTUR.md` festgeschrieben gilt: Ein KI-Request enthält nur Thema,
Zeichensatz, Länge und Level. Diese Liste bleibt unverändert. Stattdessen wird
`level` neu definiert:

```
level = f(lessonId, ageBand)   // Lesestufe, nicht Lektionsnummer
```

Bisher war `level` die Lektionsnummer 1–25. Künftig ist es eine **Lesestufe**,
die aus Lektionsfortschritt *und* Altersstufe gebildet wird. Damit steuert das
Alter den Wortschatz, ohne dass ein zusätzliches Merkmal der Nutzerin das Gerät
verlässt. Die Abbildung liegt in `lib/curriculum.ts` und ist unit-getestet.

**Nicht jede Stufe braucht eigene Texte.** In `S1` und `S2` sind die Texte
Silbendrills („fad ledert das Gras") — dort gibt es nichts alterstypisch zu
unterscheiden. Diese Texte tragen `"age": "alle"`. Erst ab `S3`, wo echte Sätze
stehen, wird nach Stufe unterschieden.

**Auswahl und Rückfall (verbindlich).** Gesucht wird ein Text zu
(Thema, Zeichensatzstufe, Altersstufe). Ist die Zelle leer, wird die
**benachbarte** Altersstufe genommen (`A1` → `A2`, `A3` → `A2`, `A2` → `A1`),
danach `"alle"`. Ein Text wird **nie** wegen der Altersstufe verweigert — das
verstieße gegen „Offline ist der Normalfall". Der Rückfall ist stumm; die
Nutzerin merkt nichts davon.

**Vollbestand ist `A2`.** `A2` deckt die Kernzielgruppe (`SPEC.md` 1: „ab ca.
10 Jahren") und wird vollständig befüllt. `A1` und `A3` sind Ergänzungen, die
über den Rückfall jederzeit lückenhaft sein dürfen. Das hält den Textbestand
beherrschbar — siehe die Mengenrechnung in 9.6.

### 9.9 Wissenshäppchen

Zusätzlich zu den Übungstexten liefert jedes Thema kurze Faktenkarten
(„Wusstest du?"), die auf dem Auswertungsbildschirm erscheinen. Diese dürfen
**alle** Zeichen enthalten (sie werden gelesen, nicht getippt) und stammen
ausschließlich aus dem Seed — keine KI, weil Faktentreue ohne Prüfung nicht
zu garantieren ist.

---

## 10. Weitere Lernmodule (Phase 2)

Gleiche Spielmechanik (XP, Abzeichen), aber kein Tipp-Drill. Jedes Modul besteht
aus 5–8 Einheiten à 3–5 Minuten: kurze Erklärung → interaktive Aufgabe →
Auswertung. Inhalte komplett lokal (JSON in `content/modules/`), keine KI.

### 10.1 Medienkompetenz (`modul-medien`)

Jede Einheit trägt im Inhalts-JSON die Felder `kmk` und `digcomp` mit dem
zugeordneten Kompetenzbereich der KMK-Strategie „Bildung in der digitalen Welt"
bzw. aus DigComp 2.2 (Zuordnungstabelle in `NORMEN.md` 6). Die Felder sind
Metadaten für Elternansicht und Dokumentation und erscheinen nicht in der
Kinder-Oberfläche. Für Thüringen gilt zusätzlich der Kursplan Medienkunde der
Klassen 5–10; Zehni deckt bewusst die Doppelklassenstufe 5/6 ab und ist
**Ergänzung zum Unterricht, kein Ersatz**.

1. Passwörter: was ein gutes Passwort ausmacht, Passwortmanager, Merksätze.
   Aufgabe: Passwörter nach Stärke einsortieren.
2. Persönliche Daten: was gehört nicht ins Internet. Aufgabe: Profilbeispiele
   bewerten.
3. Quellen prüfen: echt oder erfunden? Aufgabe: drei Schlagzeilen einschätzen.
4. Werbung erkennen: Anzeige vs. Inhalt, Influencer-Werbung.
5. Kettenbriefe, Cybermobbing, „Wo hole ich mir Hilfe?".
6. Dateien und Ordner: sinnvolle Namen, Struktur, Backup. Aufgabe: ein
   Chaos-Verzeichnis aufräumen (Drag & Drop).
7. Tastenkürzel: Kopieren, Einfügen, Rückgängig, Suchen, Speichern.
   Aufgabe: Kürzel-Trainer.

#### Die drei Fallen

Nachgestellte Situationen statt Merksätze. Alle Schutzregeln aus 6.6.1 gelten
ohne Ausnahme — insbesondere: kein Formular nimmt echte Daten entgegen, nichts
wird gespeichert, nichts verlässt das Gerät.

**F1 — „Du hast gewonnen!"** (nach `L03`, KMK 4)

Zwischen zwei Lektionen erscheint unangekündigt eine bunte Meldung: Zehni habe
ein Tablet verlost, und zwar an genau dieses Kind. Ein Zähler läuft ab. Zum
Abholen sollen Name, Telefonnummer und die Schule eingetragen werden — die
Felder sind bereits mit erfundenen Werten gefüllt.

Zwei Wege: **„Abschicken"** oder **„Das glaube ich nicht"**.

- Wer abbricht, bekommt das Abzeichen `nicht-reingefallen` und die Auflösung:
  woran es zu erkennen war — ein Gewinn, an dem man nie teilgenommen hat;
  Zeitdruck; die Frage nach Daten, die für einen Gewinn nicht nötig sind.
- Wer abschickt, bekommt dieselbe Auflösung und zusätzlich, was in Wirklichkeit
  gefolgt wäre: Werbeanrufe, weitergereichte Nummer, im schlimmsten Fall ein
  untergeschobener Vertrag. **Ohne Häme.** Der Schlusssatz lautet sinngemäß:
  „Das ist genau der Trick, auf den auch Erwachsene hereinfallen. Jetzt kennst
  du ihn."

**F2 — „Das Internet vergisst nie"** (nach `L15`, KMK 2 und 4)

Das Kind füllt einen Steckbrief für ein erfundenes Spieleprofil aus:
Spitzname, Lieblingstier, Lieblingsfarbe, dazu ein Bild aus einer Auswahl.
Alles frei wählbar, weil alles harmlos.

Ein paar Bildschirme später — in derselben Einheit — taucht der Steckbrief
wieder auf: als angebliche Bildschirmkopie in einem fremden Forum, weitergeteilt,
mit fremden Kommentaren. Dann die Auflösung: Was einmal draußen ist, holt man
nicht zurück, weil andere es kopiert haben, bevor man es löschen konnte.

Zum Schluss löscht Zehni den Steckbrief sichtbar und sagt dazu: **Wir haben es
gelöscht. Das echte Internet hätte das nicht getan.** Technisch stand er
ohnehin nur im Arbeitsspeicher.

**F3 — „Das Kleingedruckte"** (nach `L21`, KMK 4 und 6)

Ein Spiel verspricht, kostenlos zu sein. Der Knopf „Jetzt gratis starten" ist
groß und bunt; darunter steht klein, dass nach sieben Tagen 9,99 € monatlich
abgebucht werden und sich das Abo automatisch verlängert. Ein Häkchen bei den
Geschäftsbedingungen ist bereits gesetzt.

Aufgabe: Finde heraus, was das Spiel wirklich kostet. Wer die Stelle anklickt,
bevor er startet, bekommt das Abzeichen. Danach die Auflösung: warum das Wort
„gratis" nichts bedeutet, was ein vorausgefülltes Häkchen soll, und dass man
unter 18 Jahren solche Verträge ohne die Eltern gar nicht schließen kann.

### 10.2 Textverarbeitung (`modul-text`)

Grundlage ist **DIN 5008:2020-03** (`NORMEN.md` 5.2), in kindgerechter Auswahl:
Satzzeichenabstände, Datums- und Uhrzeitformat, Zahlengliederung, Aufzählungen,
Überschriftenhierarchie und der Aufbau eines Briefs (Anschriftfeld, Betreff,
Anrede, Gruß). Dazu Formatvorlagen statt Handformatierung, Seitenzahlen,
Rechtschreibprüfung, Speichern/Exportieren als PDF, ein sauberes
Referatsdeckblatt. Ziel ist nicht Vollständigkeit — die Norm hat rund
70 Seiten —, sondern dass das Kind weiß, dass es eine Norm gibt und welche
Regeln im Alltag ständig vorkommen. Aufgaben als Simulation im eigenen Editor-Widget —
**kein** Office-Automatismus, keine externe Software nötig.

### 10.3 Lernen lernen (`modul-lernen`)

**Vollständige Spezifikation in `docs/MODUL-LERNEN.md`** — das Modul trägt die
Kernbotschaft des Projekts und ist deshalb eigens ausgearbeitet.

Kurzfassung: acht Einheiten à 3–5 Minuten entlang der Leitidee *„Niemand kommt
auf die Welt und kann ein Flugzeug fliegen"* und *„Jünger wirst du nicht"*.
Haltung vor Technik: Talent-Mythos, die eigene Lernkurve, „zu spät dran",
„noch nicht", der Umgang mit Durststrecken — danach die belegt wirksamen
Techniken (Selbstabfrage, verteiltes Üben), Anfangen ohne Lust mit
Pomodoro-Timer, und Notieren in eigenen Worten.

Das Besondere und zugleich Verbindliche: **Jede Behauptung über Lernen wird mit
den echten Fortschrittsdaten der Nutzerin belegt** (`sessions`,
`lesson_progress`, `char_stats`), sobald mindestens 5 Sitzungen vorliegen —
sonst greift eine neutrale Fassung. Erfundene Zahlen sind ausgeschlossen.

Kein Lerntypentest: Die Zuordnung von Unterricht zu „Lerntypen" ist
wissenschaftlich nicht belegt (`MODUL-LERNEN.md` 3).

---

## 11. Update-Mechanismus und Installer

### 11.1 Auto-Update

- `tauri-plugin-updater`, Prüfung **beim Start**, asynchron, blockiert nichts.
- Endpunkt: statische `latest.json` in den GitHub Releases (oder auf eigenem
  Webspace — die URL steht in `tauri.conf.json` und ist dieselbe Quelle wie die
  Remote-Konfiguration).
- Signaturschlüsselpaar wird einmalig erzeugt (`tauri signer generate`);
  der **private** Schlüssel liegt ausschließlich in den GitHub-Secrets
  (`TAURI_SIGNING_PRIVATE_KEY`), nie im Repository.
- Ablauf: Update gefunden → dezenter Hinweis unten rechts („Ein Update ist
  bereit") → Download im Hintergrund → Installation beim nächsten Start oder auf
  Klick. **Niemals** ein modaler Zwangsdialog beim Öffnen.
- Fehlgeschlagene Updates sind stillschweigend zu ignorieren (Log, kein Dialog);
  die App muss ohne Internet identisch funktionieren.
- **Von Hand nachsehen** geht jederzeit in den Einstellungen (8.12). Ein
  fertiges Update wird zusätzlich durch einen kleinen Punkt am
  Einstellungen-Eintrag in der Kopfzeile angezeigt — damit es auch auffällt,
  wenn der Hinweis unten rechts weggeklickt wurde.
- Schema-Migrationen der Datenbank laufen nach dem Update automatisch und sind
  immer vorwärtskompatibel; ein Downgrade wird nicht unterstützt.

### 11.2 Installer

- Bundler-Target `nsis`, Ergebnis `Zehni-Setup-<version>.exe`.
- `"perMachine": false` — Installation nach `%LOCALAPPDATA%\Zehni`, **keine
  Adminrechte nötig** (wichtig auf Schul- und Familiengeräten).
- Sprache des Installers: Deutsch. Optionen: Desktop-Verknüpfung (an),
  Autostart (aus).
- Deinstallation entfernt das Programm, **fragt** aber, ob Lernfortschritt
  (`%APPDATA%\de.zehni.app`) erhalten bleiben soll. Voreingestellt ist
  *behalten*: Ein Klick darf keine Monate Übung kosten. Umgesetzt über einen
  NSIS-Haken (`src-tauri/installer-hooks.nsh`) — Tauris Schalter
  `deleteAppDataOnUninstall` löscht oder behält, beides ohne Nachfrage.

  > Der Ordner heißt nach der Kennung aus `tauri.conf.json`, nicht nach dem
  > Produktnamen. Hier stand bis zum 2026-09-15 `%APPDATA%\Zehni`; das war
  > schlicht falsch.
- WebView2: Tauri-Option `downloadBootstrapper` — auf Windows 11 und aktuellem
  Windows 10 ist WebView2 bereits vorhanden, sonst wird es nachinstalliert.
- Ohne Code-Signing-Zertifikat zeigt Windows SmartScreen eine Warnung. Das ist
  zu dokumentieren (`docs/INSTALL.md` mit Screenshot: „Weitere Informationen →
  Trotzdem ausführen"). Ein Zertifikat ist optional und nicht Teil von v1.

### 11.3 Release-Prozess (CI)

`.github/workflows/release.yml`, ausgelöst durch Tag `v*`:
Tests → Build (`windows-latest`) → Signieren → Release anlegen →
`Zehni-Setup.exe` + `latest.json` anhängen. Das Release entsteht als
**Entwurf** — ein Release, das sich sofort selbst verteilt, kann man nicht mehr
zurückholen.

Dazu `.github/workflows/ci.yml` auf jedem Push und Pull Request mit genau den
Befehlen, die `ARCHITEKTUR.md` vor jedem Commit verlangt.

**Drei Konfigurationsdateien, mit Absicht:**

- `tauri.conf.json` — die normale. Hier steht auch `plugins.updater` mit
  Endpunkt und öffentlichem Schlüssel. **Das muss hier stehen:** Der Updater
  verlangt seinen Block beim Start, sonst stürzt die App ab, bevor das Fenster
  erscheint. Beide Angaben sind öffentlich.
- `tauri.release.conf.json` — kommt beim Release über `--config` dazu und
  enthält nur `createUpdaterArtifacts`. Das ist das Einzige, was den geheimen
  Schlüssel braucht; so bleibt `npm run build` lokal ohne Schlüssel benutzbar.
- `tauri.dev.conf.json` — für `npm run dev`. Setzt eine eigene Kennung
  (`de.zehni.app.entwicklung`), damit Entwicklung und installierte App **nicht
  denselben Lernfortschritt** beschreiben, und einen eigenen Fenstertitel,
  damit man sie nicht verwechselt.

Der Workflow bricht ab, wenn der Updater-Block fehlt oder unvollständig ist —
lieber laut scheitern als eine App ausliefern, die sich nicht öffnen lässt.

---

## 12. Nichtfunktionale Anforderungen

### 12.1 Performance-Budget (harte Grenzen, in der CI zu prüfen wo möglich)

| Messgröße | Grenze |
|---|---|
| Kaltstart bis interaktiv (HDD, 4 GB RAM) | ≤ 4 s |
| Warmstart | ≤ 2 s |
| RAM im Betrieb | ≤ 250 MB |
| Eingabelatenz Tastendruck → Bildschirm | ≤ 30 ms (p95) |
| Installergröße | ≤ 20 MB |
| Speicherbedarf nach 1 Jahr Nutzung | ≤ 150 MB |

Konsequenzen für die Umsetzung: keine schweren Animationsbibliotheken,
keine Web-Fonts über das Netz (Schriften mitliefern), Bilder als SVG,
Tastatur-Rendering ohne Re-Render des ganzen Baums (Zeichenzustände über
direkte DOM-Klassen oder feingranulare Memoisierung).

### 12.2 Barrierefreiheit und Ergonomie

- Kontrast mindestens WCAG AA; ein zusätzliches kontrastreiches Theme.
- Fingerfarben zusätzlich durch Muster/Nummer unterscheidbar (Farbfehlsichtigkeit).
- Schriftgröße in drei Stufen einstellbar; Standard-Schrift für Übungstexte mit
  eindeutig unterscheidbaren Glyphen (`I`/`l`/`1`), z. B. Atkinson Hyperlegible
  oder JetBrains Mono — lokal eingebunden.
- Option „Dyslexie-freundliche Schrift".
- Haltungs-/Pausenerinnerung nach 20 Minuten am Stück (abschaltbar).
- Vollständige Tastaturbedienbarkeit der Oberfläche (naheliegend, aber oft
  vergessen).

### 12.3 Datenschutz

- Keine Telemetrie. Keine personenbezogenen Daten verlassen das Gerät.
- Ein KI-Aufruf enthält ausschließlich: Thema, Zeichensatz, Länge, Level.
  **Niemals** Name, getippte Eingaben, Statistiken oder Gerätekennungen.
- Beim Onboarding ein Satz in kindgerechter Sprache, was nach außen geht, plus
  ein Schalter „Neue Texte aus dem Internet holen" (Standard: an, jederzeit aus).
- **Die Medienkompetenz-Fallen (6.6.1) erheben nichts.** Telefonnummer und
  E-Mail sind dort vorgegeben und nicht änderbar; frei eingeben lässt sich nur
  Harmloses. Eingaben bleiben im Arbeitsspeicher und werden beim Verlassen der
  Einheit verworfen. In der Datenbank landen je Einheit nur zwei Wahrheitswerte
  (`module_progress`, Abschnitt 5). Die Module sprechen mit keinem Netzwerk.
- **Die Elternansicht sagt ausdrücklich**, dass Zehni solche Situationen
  nachstellt, und mit welchen Schutzregeln. `docs/DATENSCHUTZ.md` führt das aus.
- `docs/DATENSCHUTZ.md` für die Eltern, eine Seite, verständlich.

---

## 13. Qualitätssicherung

- **Unit-Tests (Vitest)** verpflichtend für: `typing-engine`, `metrics`,
  `charset`, `scheduler`, `validate_text` (Rust: `cargo test`), XP-/Level-Rechnung.
  Zielabdeckung `lib/` ≥ 85 %.
- **Golden Tests** für die Lektionsdefinitionen: jedes Zeichen jeder Lektion muss
  im Fingersatz vorkommen; kein Zeichen darf vor seiner Lektion auftauchen.
  Dieser Test hätte die häufigste Fehlerklasse des Projekts verhindert und ist
  daher Pflicht.
- **Normkonformitätstests** nach `NORMEN.md` 7, verpflichtend:
  `countStrokes()` gegen T1-Referenzfälle (Großbuchstabe = 2 Anschläge),
  Fehlerzählung gegen Vorlage/Abschrift-Paare inklusive Zeilenschaltungsfehler,
  Fehlerquotient und beide Notenschlüssel gegen die Tabellen in `NORMEN.md` 4.6,
  Grenzfall des Abschlusstests (exakt 600 Anschläge / exakt 0,5 %).
- **Seed-Validierung** in der CI (`scripts/validate-seed.ts`) und
  **DIN-5008-Prüfung** (`scripts/check-din5008.ts`) über alle Seed- und
  Oberflächentexte.
- **E2E (Playwright)**: Onboarding durchlaufen, Lektion 1 tippen, Auswertung
  sehen, Neustart → Fortschritt ist noch da.
- **Manueller Testlauf vor jedem Release**: Installation auf einem frischen
  Windows-10-Rechner ohne Entwicklerwerkzeuge.
- ESLint + Prettier + `cargo clippy -- -D warnings`, in der CI erzwungen.

---

## 14. Meilensteine

### M1 — Lauffähiger Kern (das Wichtigste zuerst)

Tauri-Projekt, SQLite + Migrationen, Tipp-Engine, Tastaturvisualisierung,
Lektionen `L01`–`L05` mit hartkodierten Texten, Auswertungsbildschirm,
Fortschritt wird gespeichert.
**Fertig, wenn:** Man kann die Grundreihe von Anfang bis Ende üben, die App neu
starten und den Fortschritt wiederfinden.

### M2 — Inhalte und Lernpfad

Alle 25 Lektionen, Freischaltlogik, adaptive Wiederholung, Seed-Datenbank mit
400 Texten, Themenauswahl im Onboarding, Layout-Erkennung.
**Fertig, wenn:** Der komplette Lernpfad offline durchspielbar ist.

### M3 — Motivation

XP, Level, Sterne, 15 Abzeichen, Serie mit Jokern, Lernstube, Maskottchen,
Tagesziel, Auswertungsbildschirm in seiner Endfassung.
Dazu Tagesaufgabe (8.6), Geisterschreiber (8.7), Wochenziel (8.8) und
Tastenjagd (8.9).

**Außerdem die acht Zwischenstücke im Lernpfad (6.6)**, darunter die drei
Fallen zur Medienkompetenz. Sie standen ursprünglich in M6 und sind am
2026-09-14 vorgezogen worden: Medienkompetenz, die erst nach der Auslieferung
kommt, kommt vermutlich nie — und als Block am Stück wirkt sie schlechter als
über Monate verteilt. Die Abzeichen für „erkannt" hängen ohnehin am
Abzeichensystem dieses Meilensteins.

**Fertig, wenn:** Eine Testperson (die Zielnutzerin!) die App an drei
aufeinanderfolgenden Tagen freiwillig öffnet.

> **Stand 2026-09-15: gebaut, nicht abgenommen.** Sämtliche Punkte dieses
> Meilensteins stehen im Code, einschließlich der acht Zwischenstücke, des
> Einstellungsbildschirms (8.12) und der Abzeichengalerie (8.2). Das
> Abnahmekriterium ist aber bewusst kein technisches — es lässt sich weder
> testen noch behaupten, sondern nur beobachten. M3 bleibt offen, bis die
> Zielnutzerin die drei Tage geliefert hat.

> Geisterschreiber und Tastenjagd hängen nur an Daten, die ab M1 vorliegen
> (`lesson_progress.best_strokes_min`, `char_stats`), und sind billig. Wenn die
> Zielnutzerin früher Abwechslung braucht, dürfen diese beiden vorgezogen
> werden — Tagesaufgabe und Wochenziel brauchen dagegen neue Tabellen und
> bleiben in M3.

### M4 — Auslieferung

NSIS-Installer, Auto-Updater, Signierung, GitHub-Actions-Release,
`INSTALL.md` und `DATENSCHUTZ.md`.
**Fertig, wenn:** Die App auf einem fremden Windows-Rechner installiert,
gestartet und auf eine neue Version aktualisiert wurde.

### M5 — KI-Inhalte

`AiProvider`-Trait, OpenRouter + Groq, Remote-Konfiguration, Validierung,
Cache und Vorab-Generierung, Schalter in den Einstellungen.
**Fertig, wenn:** Bei aktivem Internet frische Texte erscheinen und bei
gezogenem Netzwerkkabel nichts davon auffällt.

### M6 — Lernmodule und Minispiele

Die **restlichen** Einheiten der Module (Abschnitt 10): Textverarbeitung
vollständig, dazu die zehn Einheiten aus Medienkompetenz und „Lernen lernen",
die nicht als Zwischenstück im Lernpfad liegen. Sie sind im freien Modulbereich
jederzeit spielbar.

Dazu die beiden Minispiele (8.10) — bewusst zuletzt: Sie sind der teuerste
Punkt der Gamification und der einzige, der nichts zum Lernpfad beiträgt.

> **Stand 2026-09-15: gebaut.** Der freie Modulbereich enthält die zehn
> Einheiten aus Medienkompetenz und „Lernen lernen" sowie das Modul
> „Textverarbeitung" mit sieben Einheiten; beide Minispiele laufen. M6 ist damit
> vor M4 und M5 fertig geworden, weil es als einziger Meilenstein weder einen
> Signierschlüssel noch einen KI-Zugang braucht.

> **Reihenfolge-Hinweis:** M5 (KI) kommt bewusst *nach* der Auslieferung.
> Die App muss vollständig nützlich sein, bevor eine externe Abhängigkeit
> dazukommt. Wer M5 vorzieht, riskiert, dass ein Anbieterlimit das ganze
> Projekt blockiert.

---

## 15. Offene Punkte

1. **Hosting der Remote-Konfiguration**: GitHub Raw, eigener Webspace oder
   Homelab-Server mit Reverse Proxy? (Homelab bedeutet: Verfügbarkeit hängt am
   eigenen Anschluss — für eine App auf fremden Rechnern eher ungünstig.)
2. **Name und Marke**: „Zehni" ist frei gewählt; vor Weitergabe kurz prüfen,
   ob es Namenskollisionen gibt.
3. **Schriftlizenz**: Atkinson Hyperlegible (SIL OFL) und JetBrains Mono
   (SIL OFL) sind unbedenklich — Lizenztexte mitliefern.
4. **Abschlusstest-Urkunde**: als PDF exportierbar? (Nett, aber M6+.)
5. **Zweitprofil** für weitere Kinder — Datenmodell ist vorbereitet
   (`profile.id`), UI nicht.
6. **Normenpflege**: vor jedem Major-Release prüfen, ob eine neue Ausgabe von
   DIN 2137, DIN 5008 oder der Wettschreibordnung erschienen ist; Ergebnis mit
   Datum in `NORMEN.md` 9 vermerken.
7. **Abdeckung Thüringer Kursplan Medienkunde 5/6**: Die sieben Einheiten des
   Medienmoduls (10.1) sind noch nicht gegen den Kursplan gegengeprüft. Lücken
   sind zu benennen, nicht stillschweigend zu lassen.
8. **„IT-Anwendungen" im Vergleichsangebot**: Der Begriff ist im Kursangebot
   nicht aufgeschlüsselt. Falls damit Tabellenkalkulation oder Präsentation
   gemeint ist, wäre das eine bewusste Lücke in Zehni — zu entscheiden, nicht
   zu übersehen.
9. **Ergonomie und Sitzhaltung**: bisher nur als Pausenerinnerung vorgesehen
   (12.2). Eine kurze eigene Einheit wäre wenig Aufwand und würde einen echten
   Nachteil gegenüber einem betreuten Präsenzkurs verkleinern.
10. ~~**Zahlengliederung nach DIN 5008**~~ — **erledigt am 2026-09-14.** Der
    Punkt war nie offen: `NORMEN.md` 5.1 legt ihn eindeutig fest (ab fünf
    Stellen in Dreiergruppen mit Leerzeichen, vierstellige bleiben
    ungegliedert). Er stand hier nur, weil die Stelle beim Schreiben der
    Seed-Texte nicht genau genug gelesen wurde. `checkDin5008()` setzt sie um.
11. **Sicherheitsschwellen eichen**: Die Werte für `L01`–`L13` (6.3) sind
    Erfahrungswerte ohne Datengrundlage. Nach den ersten echten Sitzungen
    prüfen — hängt jemand in `L01`–`L03` fest, sind sie zu hoch; gibt es
    reihenweise ★★★ im ersten Versuch, zu niedrig.
12. **Anteil neuer Zeichen im Drill**: Die rund 40 % aus 9.7 sind geschätzt.
    Zu hoch wirkt monoton, zu niedrig übt zu wenig.
13. **Altersstufe im Onboarding erfragen**: Wie fragt man ein Kind nach seinem
    Alter, ohne dass es sich geprüft fühlt, und was passiert, wenn ein
    Erwachsener das Gerät einrichtet? (9.8)
14. **Level 30 ist mit der Formel aus 8.1 unerreichbar.** `XP(n) = 100 · n ·
    1,25^(n-1)` ergibt für Level 30 rund 1,5 Millionen XP. Der gesamte
    Lernpfad bringt mit allen Sternen und Abzeichen etwa 5 000 XP, ein Jahr
    täglichen Übens vielleicht 20 000. Erreichbar sind damit Level 11 bis 13.
    Entweder die Kurve wird flacher, oder die Obergrenze sinkt auf 15 — zu
    entscheiden, wenn echte XP-Verläufe vorliegen. Bis dahin ist die Formel
    unverändert umgesetzt; sie schadet nicht, sie ist nur großzügig bemessen.
15. **Die Textprüfung gibt es zweimal**: `validateText()` liegt seit dem
    2026-09-14 in TypeScript (`src/lib/validate-text.ts`) und prüft Seed- und
    Oberflächentexte. Für KI-Antworten braucht M5 dieselbe Prüfung in Rust,
    weil dort das Netzwerk liegt. Zwei Umsetzungen laufen auseinander. Wer die
    Rust-Fassung baut, überträgt die Testfälle aus `validate-text.test.ts` und
    `din5008.test.ts` mit — oder legt vorher eine gemeinsame Prüffalldatei an,
    die beide Seiten einlesen.

---

## 16. Glossar

- **A/min** — Anschläge pro Minute. Ein Anschlag ist jeder Tastendruck;
  Großbuchstaben und die meisten Sonderzeichen zählen doppelt, weil Umschalt
  bzw. AltGr mitgeschlagen werden (`NORMEN.md` 4.1).
- **WPM** — Wörter pro Minute, definiert als A/min ÷ 5.
- **Fehlerquote** — (Fehler × 100) / Anschläge, gemessen am Ergebnistext;
  während des Schreibens korrigierte Fehler zählen nicht (`NORMEN.md` 4.2/4.3).
- **Sicherheit** — Anteil der Zeichen, die ohne Korrektur richtig getroffen
  wurden. Reine Trainingskennzahl, fließt nie in eine Bewertung ein.
- **Zeichensatzstufe (S1–S5)** — Gruppe von Lektionen mit gleichem erlaubtem
  Zeichenvorrat; Grundlage für die Seed-Texte.
- **Seed** — die mitgelieferte, lokale Textsammlung.
- **Blindmodus** — Übung mit ausgeblendeter Tastaturgrafik.
