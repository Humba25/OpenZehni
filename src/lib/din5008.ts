/**
 * Prüfung gegen DIN 5008:2020-03.
 *
 * **Vor jeder Änderung `NORMEN.md` 5.1 lesen.** Die Regeln hier sind nicht
 * ausgedacht, sondern die dort aufgezählte Auswahl. Zehni hält sich an die
 * Norm, die es selbst lehrt (SPEC.md 10.2) — täte es das nicht, wäre das Modul
 * „Textverarbeitung" unglaubwürdig.
 *
 * Geprüft wird **jeder** ausgegebene Text: Seed, KI-Antworten, Oberfläche,
 * Urkunde (ARCHITEKTUR.md).
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

/** Was die Prüfung beanstandet. */
export interface Din5008Finding {
  /** Kurzschlüssel, stabil — Tests und CI hängen daran. */
  readonly code: Din5008Code;
  /** Klartext, an Menschen gerichtet. */
  readonly message: string;
  /** Zeichenposition im Text. */
  readonly index: number;
  /** Der beanstandete Ausschnitt. */
  readonly excerpt: string;
}

export type Din5008Code =
  | 'leerzeichen-vor-satzzeichen'
  | 'leerzeichen-nach-satzzeichen-fehlt'
  | 'doppeltes-leerzeichen'
  | 'leerzeichen-am-zeilenende'
  | 'bindestrich-als-gedankenstrich'
  | 'gedankenstrich-ohne-leerzeichen'
  | 'zahl-nicht-gegliedert'
  | 'datum-format'
  | 'uhrzeit-format'
  | 'einheit-ohne-leerzeichen';

/** Satzzeichen, die die Abstandsregel betrifft. */
const SATZZEICHEN = new Set([',', '.', ';', ':', '!', '?']);

/**
 * Zeichen, die direkt auf ein Satzzeichen folgen dürfen, ohne dass ein
 * Leerzeichen dazwischen muss: schließende Klammern, Anführungszeichen und
 * weitere Satzzeichen (etwa bei Auslassungspunkten oder `?!`).
 */
const DARF_FOLGEN = new Set([
  ',',
  '.',
  ';',
  ':',
  '!',
  '?',
  ')',
  ']',
  '}',
  '"',
  "'",
  '«',
  '»',
  '“',
  '”',
  '„',
]);

/**
 * Maßeinheiten und Zeichen, die vom Wert durch ein Leerzeichen getrennt werden.
 *
 * Bewusst eine feste Liste statt „Ziffer gefolgt von Buchstaben": Sonst würde
 * `1970er Jahre` fälschlich beanstandet, und `440-mal` ebenso.
 */
const EINHEITEN = [
  '%',
  '‰',
  '€',
  '$',
  'EUR',
  'kg',
  'g',
  'mg',
  't',
  'km',
  'cm',
  'mm',
  'm',
  'l',
  'ml',
  'min',
  'h',
  'kB',
  'MB',
  'GB',
  'TB',
];

const istZiffer = (c: string | undefined): boolean => c !== undefined && c >= '0' && c <= '9';

/**
 * Prüft einen Text gegen DIN 5008. Leeres Ergebnis heißt: keine Beanstandung.
 *
 * Die Prüfung ist bewusst **eng**: Sie beanstandet nur, was `NORMEN.md` 5.1
 * ausdrücklich aufzählt. Eine Prüfung, die zu viel anmahnt, wird abgeschaltet —
 * und dann prüft gar nichts mehr.
 */
export function checkDin5008(text: string): Din5008Finding[] {
  const findings: Din5008Finding[] = [];
  const add = (code: Din5008Code, message: string, index: number, length = 1): void => {
    findings.push({
      code,
      message,
      index,
      excerpt: text.slice(Math.max(0, index - 12), index + length + 12),
    });
  };

  pruefeSatzzeichen(text, add);
  pruefeLeerzeichen(text, add);
  pruefeStriche(text, add);
  pruefeZahlen(text, add);
  pruefeDatumUndUhrzeit(text, add);
  pruefeEinheiten(text, add);

  return findings.sort((a, b) => a.index - b.index);
}

type Add = (code: Din5008Code, message: string, index: number, length?: number) => void;

/**
 * Die Zeichenpositionen aller Auslassungspunkte.
 *
 * Sie sind von der Abstandsregel ausgenommen. `NORMEN.md` 5.1: „Auslassungs-
 * punkte `...` mit Leerzeichen davor, wenn sie ein Wort ersetzen." Ersetzen sie
 * dagegen nur Buchstaben am Wortende (`Zeh...`), stehen sie ohne Leerzeichen.
 * Beides ist richtig, und die Prüfung kann die Fälle nicht unterscheiden —
 * also beanstandet sie keinen davon.
 */
function auslassungspunkte(text: string): ReadonlySet<number> {
  const positionen = new Set<number>();
  for (const m of text.matchAll(/\.{3}/g)) {
    for (let k = 0; k < 3; k++) positionen.add(m.index + k);
  }
  return positionen;
}

/**
 * Dateiendungen, vor deren Punkt die Abstandsregel nicht gilt.
 *
 * `Referat Island.odt` ist kein Satz, sondern ein Name. Die Regel aus
 * `NORMEN.md` 5.1 betrifft Satzzeichen; ein Punkt im Dateinamen ist keines.
 * Aufgefallen ist das beim Modul „Textverarbeitung", das Dateinamen zeigt
 * (`SPEC.md` 10.1, Einheit „Ordnung in Dateien").
 *
 * Bewusst eine feste Liste, aus demselben Grund wie bei den Einheiten: Eine
 * Regel „Punkt gefolgt von zwei bis vier Kleinbuchstaben" würde `z.B.` und
 * `usw.` verschlucken und damit echte Fehler durchlassen.
 */
const DATEIENDUNGEN = [
  'odt',
  'ods',
  'odp',
  'docx',
  'xlsx',
  'pptx',
  'pdf',
  'txt',
  'md',
  'csv',
  'json',
  'html',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'svg',
  'webp',
  'mp3',
  'mp4',
  'wav',
  'zip',
  'exe',
];

/** Die Positionen aller Punkte, die zu einem Dateinamen gehören. */
function dateinamenPunkte(text: string): ReadonlySet<number> {
  const positionen = new Set<number>();
  const muster = new RegExp(`\\.(?:${DATEIENDUNGEN.join('|')})\\b`, 'gi');
  for (const m of text.matchAll(muster)) {
    // Nur wenn direkt davor ein Namensbestandteil steht -- ein Satz, der mit
    // "... ist es. Md" weiterginge, bleibt beanstandet.
    const davor = text[m.index - 1];
    if (davor !== undefined && /[\p{L}\p{N})\]]/u.test(davor)) positionen.add(m.index);
  }
  return positionen;
}

/** Nach Satzzeichen ein Leerzeichen, davor keines (NORMEN.md 5.1). */
function pruefeSatzzeichen(text: string, add: Add): void {
  const ellipsen = auslassungspunkte(text);
  const dateinamen = dateinamenPunkte(text);

  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (!SATZZEICHEN.has(c)) continue;
    if (ellipsen.has(i)) continue;
    if (dateinamen.has(i)) continue;

    const davor = text[i - 1];
    const danach = text[i + 1];

    // Dezimaltrennzeichen, Tausenderpunkt und Uhrzeit: zwischen Ziffern gilt
    // die Abstandsregel nicht. "7,32" und "14:30" sind richtig.
    const zwischenZiffern = istZiffer(davor) && istZiffer(danach);
    if (zwischenZiffern) continue;

    if (davor === ' ' || davor === '\t') {
      add('leerzeichen-vor-satzzeichen', `Vor '${c}' steht ein Leerzeichen.`, i - 1, 2);
    }

    if (danach !== undefined && danach !== ' ' && danach !== '\n' && !DARF_FOLGEN.has(danach)) {
      add('leerzeichen-nach-satzzeichen-fehlt', `Nach '${c}' fehlt das Leerzeichen.`, i, 2);
    }
  }
}

/** Keine doppelten Leerzeichen, kein Leerzeichen am Zeilenende. */
function pruefeLeerzeichen(text: string, add: Add): void {
  const doppelt = /[ \t]{2,}/g;
  for (const m of text.matchAll(doppelt)) {
    add('doppeltes-leerzeichen', 'Mehrere Leerzeichen hintereinander.', m.index, m[0].length);
  }

  const zeilenende = /[ \t]+(?=\n|$)/g;
  for (const m of text.matchAll(zeilenende)) {
    add('leerzeichen-am-zeilenende', 'Leerzeichen am Zeilenende.', m.index, m[0].length);
  }
}

/**
 * Der Gedankenstrich ist der Halbgeviertstrich mit Leerzeichen davor und
 * danach; der Bindestrich steht ohne Leerzeichen (NORMEN.md 5.1).
 *
 * In `L01`–`L19` gibt es nur den Bindestrich — dort ist ein Gedankenstrich im
 * Text ohnehin unmöglich, weil das Zeichen im Vorrat fehlt.
 */
function pruefeStriche(text: string, add: Add): void {
  for (const m of text.matchAll(/ - /g)) {
    add(
      'bindestrich-als-gedankenstrich',
      'Bindestrich mit Leerzeichen benutzt. Als Gedankenstrich verlangt DIN 5008 den Halbgeviertstrich.',
      m.index,
      3,
    );
  }

  for (const m of text.matchAll(/\S–|–\S/g)) {
    add(
      'gedankenstrich-ohne-leerzeichen',
      'Gedankenstrich ohne Leerzeichen. DIN 5008 verlangt davor und danach eines.',
      m.index,
      2,
    );
  }
}

/**
 * Zahlen ab **fünf** Stellen werden von rechts in Dreiergruppen mit Leerzeichen
 * gegliedert; vierstellige bleiben ungegliedert (NORMEN.md 5.1).
 *
 * Nicht beanstandet wird eine gegliederte vierstellige Zahl — das wäre
 * Erbsenzählerei. Beanstandet wird nur, was die Norm eindeutig verlangt.
 */
function pruefeZahlen(text: string, add: Add): void {
  // Ziffernketten, die nicht Teil eines Wortes und nicht Nachkommastellen sind.
  for (const m of text.matchAll(/\d+/g)) {
    const start = m.index;
    const davor = text[start - 1];
    const danach = text[start + m[0].length];

    // Nachkommastellen und Tausenderpunkte gehoeren zur Zahl davor.
    if (davor === ',' || davor === '.') continue;
    // Uhrzeiten und Datumsangaben pruefen eigene Regeln.
    if (danach === ':' || danach === '.') continue;

    if (m[0].length >= 5) {
      add(
        'zahl-nicht-gegliedert',
        `Die Zahl ${m[0]} hat mehr als vier Stellen und muss in Dreiergruppen mit Leerzeichen gegliedert werden.`,
        start,
        m[0].length,
      );
    }
  }
}

/** Datum als TT.MM.JJJJ, Uhrzeit mit Doppelpunkt (NORMEN.md 5.1). */
function pruefeDatumUndUhrzeit(text: string, add: Add): void {
  // Zweistellige Jahreszahl: 12.9.26
  for (const m of text.matchAll(/\b(\d{1,2})\.(\d{1,2})\.(\d{2})\b(?!\d)/g)) {
    add(
      'datum-format',
      `Datum '${m[0]}' ist unvollständig. DIN 5008 verlangt TT.MM.JJJJ, also vierstellige Jahreszahl.`,
      m.index,
      m[0].length,
    );
  }

  // Fehlende fuehrende Null: 1.9.2026
  for (const m of text.matchAll(/\b(\d)\.(\d{1,2})\.(\d{4})\b|\b(\d{1,2})\.(\d)\.(\d{4})\b/g)) {
    const [tag, monat] = m[0].split('.');
    if (tag!.length === 1 || monat!.length === 1) {
      add(
        'datum-format',
        `Datum '${m[0]}' ohne führende Null. DIN 5008 verlangt TT.MM.JJJJ.`,
        m.index,
        m[0].length,
      );
    }
  }

  // Uhrzeit mit Punkt statt Doppelpunkt: 14.30 Uhr
  for (const m of text.matchAll(/\b(\d{1,2})\.(\d{2})\s+Uhr\b/g)) {
    add(
      'uhrzeit-format',
      `Uhrzeit '${m[0]}' mit Punkt. DIN 5008 verlangt den Doppelpunkt, also ${m[1]}:${m[2]} Uhr.`,
      m.index,
      m[0].length,
    );
  }
}

/** Maßeinheiten und Währungen mit Leerzeichen vom Wert getrennt. */
function pruefeEinheiten(text: string, add: Add): void {
  for (const einheit of EINHEITEN) {
    const escaped = einheit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Ziffer direkt gefolgt von der Einheit, und danach Wortgrenze.
    const re = new RegExp(`\\d${escaped}(?![A-Za-zÄÖÜäöüß0-9])`, 'g');
    for (const m of text.matchAll(re)) {
      add(
        'einheit-ohne-leerzeichen',
        `'${m[0]}' ohne Leerzeichen. DIN 5008 trennt Einheit und Wert, also '${m[0][0]} ${einheit}'.`,
        m.index,
        m[0].length,
      );
    }
  }
}

/** Kurzform: hält der Text die Norm ein? */
export function isDin5008Compliant(text: string): boolean {
  return checkDin5008(text).length === 0;
}
