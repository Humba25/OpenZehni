/**
 * Die SQL-Anweisungen der Datenbankschicht, als Zeichenketten herausgelöst.
 *
 * **Warum getrennt von `index.ts`:** Dort hängt jede Abfrage am Tauri-Plugin und
 * lässt sich nur in der laufenden App ausführen. Die Anweisungen selbst sind
 * aber reines SQL und damit gegen eine einfache SQLite-Datenbank prüfbar — und
 * genau das passiert in `statements.test.ts` mit **derselben Migrationsdatei**,
 * die auch die App benutzt.
 *
 * Das ist kein Selbstzweck: In `PROGRESS_UPSERT` steckt die Logik, die den
 * jeweils besseren Bestwert behält. Bei der Geschwindigkeit ist „besser" das
 * Maximum, bei der Fehlerquote das Minimum, und beim ersten Mal gibt es noch
 * keinen Vergleichswert. Das von Hand richtig zu haben und nie zu prüfen, wäre
 * leichtsinnig.
 *
 * Platzhalter sind `$1`, `$2` … in der Reihenfolge ihres **ersten** Auftretens.
 * SQLite nummeriert benannte Parameter so durch; mehrfach verwendete Namen
 * bekommen dieselbe Nummer.
 */

export const PROFILE_SELECT = 'SELECT * FROM profile WHERE id = 1';

export const PROFILE_INSERT =
  'INSERT INTO profile (id, name, avatar, created_at, daily_goal_min, ai_enabled, theme, age_band) ' +
  'VALUES (1, $1, $2, $3, $4, $5, $6, $7)';

export const PROGRESS_SELECT = 'SELECT * FROM lesson_progress';

export const SESSION_INSERT =
  'INSERT INTO sessions (lesson_id, started_at, duration_ms, strokes_total, errors, ' +
  'error_rate, strokes_min, first_try_pct, topic_id, source, blind, passed) ' +
  'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)';

/**
 * Fortschritt zusammenführen, ohne den alten Stand vorher lesen zu müssen.
 *
 * - `status` fällt nie von `passed` zurück: Einmal bestanden bleibt bestanden.
 * - `stars` und `best_safety` behalten das Maximum, `best_error_rate` das
 *   Minimum — bei der Fehlerquote ist weniger besser.
 * - `COALESCE` fängt den ersten Versuch ab, bei dem noch kein Wert dasteht.
 *   Für die Fehlerquote ist der Ersatzwert bewusst absurd hoch (1e9), damit
 *   der erste echte Wert immer gewinnt.
 */
export const PROGRESS_UPSERT = `INSERT INTO lesson_progress
       (lesson_id, status, stars, best_strokes_min, best_error_rate, best_safety, attempts, last_played)
     VALUES ($1, $2, $3, $4, $5, $6, 1, $7)
     ON CONFLICT (lesson_id) DO UPDATE SET
       status           = CASE WHEN $2 = 'passed' THEN 'passed' ELSE lesson_progress.status END,
       stars            = MAX(lesson_progress.stars, $3),
       best_strokes_min = MAX(COALESCE(lesson_progress.best_strokes_min, 0), $4),
       best_error_rate  = MIN(COALESCE(lesson_progress.best_error_rate, 1e9), $5),
       best_safety      = MAX(COALESCE(lesson_progress.best_safety, 0), $6),
       attempts         = lesson_progress.attempts + 1,
       last_played      = $7`;

export const CHAR_STATS_UPSERT = `INSERT INTO char_stats (char, hits, misses, avg_latency_ms, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (char) DO UPDATE SET
         hits           = char_stats.hits + $2,
         misses         = char_stats.misses + $3,
         avg_latency_ms = COALESCE($4, char_stats.avg_latency_ms),
         updated_at     = $5`;

export const CONFUSION_UPSERT = `INSERT INTO confusions (expected, typed, count)
       VALUES ($1, $2, $3)
       ON CONFLICT (expected, typed) DO UPDATE SET count = confusions.count + $3`;

export const LESSON_UNLOCK = `INSERT INTO lesson_progress (lesson_id, status, stars, attempts)
     VALUES ($1, 'unlocked', 0, 0)
     ON CONFLICT (lesson_id) DO NOTHING`;

export const CHAR_STATS_SELECT = 'SELECT * FROM char_stats';

/**
 * Hält fest, dass die Tastaturbelegung als T1 bestätigt wurde (SPEC.md 7.4).
 *
 * Gespeichert wird nur der Zeitstempel. Was getippt wurde, ist uninteressant —
 * die vier Zeichen stehen ohnehin fest.
 */
export const LAYOUT_VERIFIED_SET = 'UPDATE profile SET layout_verified_at = $1 WHERE id = 1';

/** Setzt die Bestätigung zurück, etwa wenn die Nutzerin sie neu prüfen will. */
export const LAYOUT_VERIFIED_CLEAR = 'UPDATE profile SET layout_verified_at = NULL WHERE id = 1';

// ------------------------------------------------------------- Onboarding

export const PROFILE_UPDATE =
  'UPDATE profile SET name = $1, age_band = $2, daily_goal_min = $3, onboarded_at = $4 WHERE id = 1';

export const INTERESTS_CLEAR = 'DELETE FROM interests';
export const INTEREST_INSERT =
  'INSERT INTO interests (topic_id, weight) VALUES ($1, $2) ' +
  'ON CONFLICT (topic_id) DO UPDATE SET weight = $2';
export const INTERESTS_SELECT = 'SELECT topic_id, weight FROM interests';

// ------------------------------------------------------------ XP und Serie

/**
 * XP aufaddieren. Die Zeile wird beim ersten Zugriff angelegt, damit niemand
 * daran denken muss.
 */
export const XP_ADD =
  'INSERT INTO xp (id, total) VALUES (1, $1) ' +
  'ON CONFLICT (id) DO UPDATE SET total = xp.total + $1';
export const XP_SELECT = 'SELECT total FROM xp WHERE id = 1';

export const STREAK_SELECT = 'SELECT * FROM streak WHERE id = 1';
export const STREAK_SET =
  'INSERT INTO streak (id, current_days, longest_days, last_day, freezes_left) ' +
  'VALUES (1, $1, $2, $3, $4) ' +
  'ON CONFLICT (id) DO UPDATE SET current_days = $1, longest_days = $2, last_day = $3, freezes_left = $4';

/** Ein Abzeichen vergeben. Ein bereits vergebenes bleibt unangetastet. */
export const REWARD_INSERT =
  'INSERT INTO rewards (id, earned_at) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING';
export const REWARDS_SELECT = 'SELECT id, earned_at FROM rewards';

/** Übungszeit des Tages fortschreiben (Grundlage für Tagesziel und Serie). */
export const ACTIVITY_ADD =
  'INSERT INTO daily_activity (day, active_ms, goal_met) VALUES ($1, $2, $3) ' +
  'ON CONFLICT (day) DO UPDATE SET ' +
  '  active_ms = daily_activity.active_ms + $2, ' +
  '  goal_met = MAX(daily_activity.goal_met, $3)';
export const ACTIVITY_SELECT_DAY = 'SELECT * FROM daily_activity WHERE day = $1';

// --------------------------------------------------------------- Module

export const MODULE_SET =
  'INSERT INTO module_progress (unit_id, completed, recognized, completed_at) ' +
  'VALUES ($1, 1, $2, $3) ' +
  'ON CONFLICT (unit_id) DO UPDATE SET ' +
  '  completed = 1, ' +
  '  recognized = COALESCE(module_progress.recognized, $2), ' +
  '  completed_at = COALESCE(module_progress.completed_at, $3)';
export const MODULE_SELECT = 'SELECT * FROM module_progress';

/** Wie viele verschiedene Themen sind schon vorgekommen? Für „neugierig". */
export const TOPICS_TRIED =
  'SELECT COUNT(DISTINCT topic_id) AS n FROM sessions WHERE topic_id IS NOT NULL';

/** Bestes Tempo aller Zeiten. */
export const SESSION_HIGHLIGHTS = 'SELECT MAX(strokes_min) AS best_strokes_min FROM sessions';

/**
 * Bestwerte **je Lektion** — Grundlage für das Abzeichen „Fehlerfrei".
 *
 * Beide Kennzahlen werden gebraucht, weil je nach Lektion eine andere etwas
 * aussagt: In `L01`–`L13` ist die Fehlerquote bauartbedingt immer 0,00 %
 * (`NORMEN.md` 4.4.1), dort zählt die Sicherheit. Welche gilt, entscheidet
 * `istFehlerfrei()` in `src/lib/gamification.ts` — hier wird nur geliefert.
 */
export const SESSION_BESTWERTE =
  'SELECT lesson_id, MIN(error_rate) AS best_error_rate, ' +
  '  MAX(first_try_pct) AS best_safety ' +
  'FROM sessions GROUP BY lesson_id';

/** Erste und letzte Rundengeschwindigkeit, für „Deine eigene Kurve". */
export const LERNKURVE =
  'SELECT COUNT(*) AS n, ' +
  '  (SELECT strokes_min FROM sessions ORDER BY id ASC LIMIT 1) AS erste, ' +
  '  (SELECT strokes_min FROM sessions ORDER BY id DESC LIMIT 1) AS letzte ' +
  'FROM sessions';

// -------------------------------------------------------- Tagesaufgabe

/**
 * Die Tagesaufgabe liegt je Tag genau einmal vor (SPEC.md 8.6).
 *
 * `ON CONFLICT DO NOTHING` ist hier die eigentliche Zusage: Ist für den Tag
 * schon eine Aufgabe gezogen, bleibt sie stehen. Sonst könnte eine mitten am
 * Tag freigeschaltete Lektion die Auswahlmenge vergrößern und die Karte unter
 * der Hand austauschen.
 */
export const CHALLENGE_INSERT =
  'INSERT INTO daily_challenge (day, challenge_id, progress, done_at, dismissed) ' +
  'VALUES ($1, $2, 0, NULL, 0) ON CONFLICT (day) DO NOTHING';

export const CHALLENGE_SELECT_DAY = 'SELECT * FROM daily_challenge WHERE day = $1';

/**
 * Fortschritt setzen, nicht aufaddieren: Gerechnet wird in
 * `lib/challenges.ts`, weil dort der Unterschied zwischen Summe und Bestwert
 * steht. `MAX` verhindert trotzdem, dass ein Fortschritt je zurückfällt.
 */
export const CHALLENGE_PROGRESS_SET =
  'UPDATE daily_challenge SET progress = MAX(progress, $2) WHERE day = $1';

/** Erfüllt. `COALESCE` sorgt dafür, dass der erste Zeitpunkt stehen bleibt. */
export const CHALLENGE_DONE =
  'UPDATE daily_challenge SET done_at = COALESCE(done_at, $2) WHERE day = $1';

/** Weggeklickt. Die Karte kommt heute nicht wieder (SPEC.md 8.6). */
export const CHALLENGE_DISMISS = 'UPDATE daily_challenge SET dismissed = 1 WHERE day = $1';

/**
 * Wie viele **verschiedene** Lektionen in einem Zeitraum bestanden wurden.
 *
 * Verschiedene, nicht Runden: Wer `L01` fünfmal wiederholt, hat nicht fünf
 * Lektionen geschafft. Der Zeitraum wird halboffen angegeben — `$1` inklusive,
 * `$2` exklusiv —, damit sich Wochen lückenlos aneinanderreihen.
 */
// -------------------------------------------- Blindmodus und Geisterschreiber

/** Geübte Zeit im Blindmodus, für das Abzeichen „blindflug" (SPEC.md 8.2). */
export const BLIND_MS = 'SELECT COALESCE(SUM(duration_ms), 0) AS ms FROM sessions WHERE blind = 1';

export const SETTINGS_SET = 'UPDATE profile SET ghost_enabled = $1, blind_mode = $2 WHERE id = 1';

// ----------------------------------------------------------- Einstellungen

/**
 * Alles, was sich im Einstellungsbildschirm ändern lässt (SPEC.md 8.7, 9.8).
 *
 * `onboarded_at` bleibt unangetastet: Wer die Einstellungen öffnet, hat das
 * Onboarding hinter sich, und es soll nicht noch einmal erscheinen.
 */
export const PROFILE_EINSTELLUNGEN_SET =
  'UPDATE profile SET name = $1, age_band = $2, daily_goal_min = $3, theme = $4, ' +
  'ai_enabled = $5, ghost_enabled = $6, blind_mode = $7, font_scale = $8 WHERE id = 1';

/** Abzeichen mit dem Datum, an dem sie vergeben wurden — für die Galerie (8.2). */
export const REWARDS_SELECT_DATES = 'SELECT id, earned_at FROM rewards';

/**
 * Das Tempo der zuletzt gespielten Runde einer Lektion.
 *
 * Für den Vergleich „zum letzten Mal" (SPEC.md 6.5, Schritt 3) — bewusst **nicht**
 * der Bestwert aus `lesson_progress`: Wer beim letzten Mal schlecht war, soll
 * eine Verbesserung auch sehen.
 */
export const LAST_SESSION_SPEED =
  'SELECT strokes_min FROM sessions WHERE lesson_id = $1 ORDER BY id DESC LIMIT 1';

/**
 * Wann zuletzt überhaupt geübt wurde.
 *
 * Bewusst **nicht** `streak.last_day`: Dort steht nur, wann das Tagesziel
 * erreicht wurde. Wer gestern fünf Minuten geübt hat, war trotzdem da — und das
 * Maskottchen soll ihn dann nicht mit „lange nicht gesehen" begrüßen
 * (SPEC.md 8.5).
 */
export const LAST_SESSION_DAY = 'SELECT started_at FROM sessions ORDER BY id DESC LIMIT 1';

// ----------------------------------------------------------- Minispiele

/**
 * Eine gespielte Runde zählen (SPEC.md 8.10).
 *
 * Gezählt wird ausschließlich für die XP-Deckelung aus SPEC.md 8.1. Eine
 * Punktzahl kommt hier nie an — kein Ergebnis eines Minispiels fließt in eine
 * Bewertung ein.
 */
export const MINIGAME_ADD =
  'INSERT INTO minigame_plays (day, plays) VALUES ($1, 1) ' +
  'ON CONFLICT (day) DO UPDATE SET plays = minigame_plays.plays + 1';

export const MINIGAME_SELECT_DAY = 'SELECT plays FROM minigame_plays WHERE day = $1';

/**
 * Wie oft eine Lektion **bestanden** wurde — Grundlage für die Freischaltung
 * (`curriculum.ts`, `PFLICHTRUNDEN`).
 *
 * Gezählt werden Runden mit `passed = 1`, nicht `lesson_progress.attempts`:
 * Dort stehen alle Versuche, auch die misslungenen. Ein Fehlversuch darf nie
 * gegen jemanden zählen (SPEC.md 8.11).
 */
/**
 * Bestandene Runden **aller** Lektionen auf einmal — für den Lernweg.
 *
 * Einzeln je Lektion abzufragen wäre bei 25 Lektionen 25 Abfragen bei jedem
 * Öffnen der Liste.
 */
export const LESSON_PASSES_ALL =
  'SELECT lesson_id, COUNT(*) AS n FROM sessions WHERE passed = 1 GROUP BY lesson_id';

export const LESSON_PASSES =
  'SELECT COUNT(*) AS n FROM sessions WHERE lesson_id = $1 AND passed = 1';
