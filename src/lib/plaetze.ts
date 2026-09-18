/**
 * Wie die Kinder an einem Rechner auseinandergehalten werden (SPEC.md 5.1).
 *
 * **Jedes Kind hat seine eigene Datenbankdatei.** Die naheliegende Alternative
 * wäre eine Spalte `profile_id` in jeder Tabelle gewesen. Dagegen sprach
 * dreierlei:
 *
 * 1. Dreizehn Tabellen hätten einen neuen Primärschlüssel gebraucht. In SQLite
 *    heißt das: Tabelle neu anlegen, Daten umkopieren, alte löschen — auf einer
 *    Datenbank, in der der Lernfortschritt eines Kindes liegt. Am 2026-09-17
 *    ist genau dort schon einmal etwas schiefgegangen.
 * 2. Jede der rund hundert Abfragen hätte das Profil mitführen müssen. Eine
 *    einzige vergessene Bedingung vermischt still die Daten zweier Kinder —
 *    und das sähe nicht nach einem Fehler aus, sondern nach einem Kind, das
 *    erstaunlich weit ist.
 * 3. Getrennte Dateien können das gar nicht. Die Trennung liegt nicht in einer
 *    Bedingung, die man vergessen kann, sondern in der Bauweise.
 *
 * Was dadurch **nicht** geht, ist eine Auswertung über beide Kinder hinweg.
 * Das ist kein Verlust: Zehni vergleicht grundsätzlich nur mit dem eigenen
 * früheren Ergebnis (SPEC.md 2, 8.7). Zwei Geschwister nach Anschlägen je
 * Minute nebeneinanderzustellen wäre das Gegenteil davon.
 *
 * Reine Logik: kein Tauri, kein Datenbankzugriff (ARCHITEKTUR.md,
 * Architekturregel 1).
 */

/**
 * Wie viele Kinder eine Installation trennen kann.
 *
 * Muss mit `PLAETZE` in `src-tauri/src/lib.rs` übereinstimmen — dort ist
 * hinterlegt, welche Datenbankdateien überhaupt Migrationen bekommen. Ein
 * Platz ohne Migrationen wäre eine Datei ohne Tabellen. `plaetze.test.ts`
 * vergleicht beide Zahlen.
 */
export const PLAETZE = 4;

/**
 * Die Datenbankadresse eines Platzes.
 *
 * **Platz 1 behält den alten Namen.** Dort liegt der Lernfortschritt aller
 * Installationen, die es vor dem Zweitprofil schon gab; ein neuer Name hieße,
 * dass beim Update alles weg zu sein scheint.
 */
export function dbUrl(platz: number): string {
  return platz <= 1 ? 'sqlite:zehni.db' : `sqlite:zehni-${platz}.db`;
}

/**
 * Bis zu welchem Platz beim Start nachgesehen wird.
 *
 * Das Öffnen einer Datenbankdatei legt sie an und lässt die Migrationen
 * laufen. Alle vier Plätze bei jedem Start zu prüfen hieße, auf einer alten
 * Festplatte viermal dafür zu bezahlen (Startbudget, SPEC.md 12.1). Da Plätze
 * immer der Reihe nach belegt werden, sagt der erste freie alles Weitere —
 * nachgesehen wird deshalb bis einschließlich zu ihm.
 */
export function weiterSuchen(belegt: boolean, platz: number): boolean {
  return belegt && platz < PLAETZE;
}

/**
 * Welcher Platz sich löschen lässt, oder `null`.
 *
 * **Nur der zuletzt angelegte.** Plätze werden der Reihe nach belegt, und die
 * Suche hört beim ersten freien auf — eine Lücke in der Mitte wäre für alles
 * Dahinterliegende dasselbe wie gelöscht. Der erste Platz ist nie dabei: Dort
 * liegen die Daten, die es schon vor dem Zweitprofil gab.
 *
 * Die Einschränkung steht als offener Punkt in `SPEC.md` 15.17.
 */
export function loeschbarerPlatz(belegte: readonly number[]): number | null {
  if (belegte.length <= 1) return null;
  const letzter = Math.max(...belegte);
  return letzter > 1 ? letzter : null;
}
