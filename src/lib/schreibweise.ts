/**
 * Findet umschriebene Umlaute in Texten, die die Nutzerin zu sehen bekommt.
 *
 * **Warum es das gibt:** Beim Schreiben von Inhalten in JSON- und
 * TypeScript-Dateien ist zweimal dasselbe passiert — `schlaeft` statt
 * `schläft`, `Woerter` statt `Wörter`, `Grossbuchstaben` statt
 * `Großbuchstaben`. Einmal in `topics.seed.json`, einmal in `lessons.json`.
 *
 * Einem Kind in einem **Schreibtrainer** falsche Schreibweisen vorzusetzen, ist
 * schlimmer als ein Schönheitsfehler: Es tippt sie ab und prägt sie sich ein.
 *
 * `ARCHITEKTUR.md` verlangt für wiederkehrende Fehlerquellen ausdrücklich Tests
 * statt Sorgfalt. Genau das ist diese Datei.
 *
 * **Warum eine feste Wortliste und keine Regel:** Die Buchstabenfolgen `ae`,
 * `oe`, `ue` und `ss` kommen in einwandfreiem Deutsch ständig vor — `neue`,
 * `Feuer`, `Abenteuer`, `Poesie`, `Masse`, `Duett`. Eine allgemeine Regel
 * würde Dutzende richtige Wörter beanstanden und wäre binnen einer Woche
 * abgeschaltet. Die Liste enthält nur Formen, die es im Deutschen **nicht
 * gibt**.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff.
 */

/**
 * Falsche Formen und ihre richtige Schreibweise.
 *
 * Aufnahmekriterium: Die Form darf in korrektem Deutsch **nicht vorkommen**.
 * Deshalb fehlen hier `masse` (Masse und Maße gibt es beide) und `busse`
 * (Busse und Buße ebenso).
 */
const UMSCHREIBUNGEN: ReadonlyMap<string, string> = new Map([
  ['fuer', 'für'],
  ['ueber', 'über'],
  ['koennen', 'können'],
  ['koennte', 'könnte'],
  ['moechte', 'möchte'],
  ['waere', 'wäre'],
  ['haette', 'hätte'],
  ['haeufig', 'häufig'],
  ['haeufigste', 'häufigste'],
  ['schoen', 'schön'],
  ['woerter', 'Wörter'],
  ['woertlich', 'wörtlich'],
  ['zurueck', 'zurück'],
  ['natuerlich', 'natürlich'],
  ['spaeter', 'später'],
  ['naechste', 'nächste'],
  ['muessen', 'müssen'],
  ['duerfen', 'dürfen'],
  ['fuenf', 'fünf'],
  ['hoeren', 'hören'],
  ['hoert', 'hört'],
  ['tastgefuehl', 'Tastgefühl'],
  ['umbrueche', 'Umbrüche'],
  ['zeilenumbrueche', 'Zeilenumbrüche'],
  ['fliesstext', 'Fließtext'],
  ['anfaenger', 'Anfänger'],
  ['anfaengerfehler', 'Anfängerfehler'],
  ['zaehlen', 'zählen'],
  ['zaehlt', 'zählt'],
  ['maessig', 'mäßig'],
  ['gemaess', 'gemäß'],
  ['strasse', 'Straße'],
  ['groesse', 'Größe'],
  ['grosse', 'große'],
  ['grossen', 'großen'],
  ['gross', 'groß'],
  ['grossbuchstaben', 'Großbuchstaben'],
  ['weiss', 'weiß'],
  ['heisst', 'heißt'],
  ['schliesst', 'schließt'],
  ['schlaeft', 'schläft'],
  ['schlaegt', 'schlägt'],
  ['haelt', 'hält'],
  ['laesst', 'lässt'],
  ['aeste', 'Äste'],
  ['voegel', 'Vögel'],
  ['rueckwaerts', 'rückwärts'],
  ['laenge', 'Länge'],
  ['erklaerung', 'Erklärung'],
  ['auswaehlen', 'auswählen'],
  ['naemlich', 'nämlich'],
  ['waehrend', 'während'],
]);

export interface SchreibweiseFinding {
  readonly falsch: string;
  readonly richtig: string;
  readonly index: number;
  readonly message: string;
}

const istBuchstabe = (c: string | undefined): boolean =>
  c !== undefined && /[a-zäöüßA-ZÄÖÜ]/.test(c);

/**
 * Prüft einen Text auf umschriebene Umlaute.
 *
 * Wortgrenzenbasiert: `gross` trifft `Gross` und `grosse`, aber nicht
 * `Grossist` — das ist ein richtiges deutsches Wort.
 */
export function checkSchreibweise(text: string): SchreibweiseFinding[] {
  const findings: SchreibweiseFinding[] = [];
  const klein = text.toLowerCase();

  for (const [falsch, richtig] of UMSCHREIBUNGEN) {
    let von = 0;
    for (;;) {
      const i = klein.indexOf(falsch, von);
      if (i === -1) break;
      von = i + 1;

      if (istBuchstabe(klein[i - 1])) continue;
      // Nach dem Fund darf hoechstens eine kurze Beugungsendung folgen.
      const rest = klein.slice(i + falsch.length);
      const endung = /^(n|e|en|s|er|es|em|t|te|ten)?(?![a-zäöüß])/.exec(rest);
      if (!endung) continue;

      findings.push({
        falsch: text.slice(i, i + falsch.length + (endung[0]?.length ?? 0)),
        richtig,
        index: i,
        message: `'${text.slice(i, i + falsch.length)}' ist eine umschriebene Umlautform. Richtig ist '${richtig}'.`,
      });
      break; // je Wort eine Meldung genuegt
    }
  }

  return findings.sort((a, b) => a.index - b.index);
}

export function isSchreibweiseKorrekt(text: string): boolean {
  return checkSchreibweise(text).length === 0;
}
