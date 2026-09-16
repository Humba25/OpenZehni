/**
 * Textvalidierung nach `SPEC.md` 9.4.
 *
 * **Jede** KI-Antwort läuft hier durch, und jeder Seed-Text ebenso — sie müssen
 * denselben Check bestehen (SPEC.md 9.6). Ungültig heißt **verwerfen**, nicht
 * reparieren: Ein Text, dem man einzelne Zeichen ersetzt, ergibt sinnlose
 * Wörter, und ein Kind soll keine sinnlosen Wörter abtippen.
 *
 * **Achtung, zwei Umsetzungen.** Diese Datei prüft Seed- und Oberflächentexte.
 * Für KI-Antworten wird dieselbe Prüfung in M5 auf der Rust-Seite gebraucht
 * (`src-tauri/src/ai.rs`), weil dort das Netzwerk liegt (ARCHITEKTUR.md,
 * Architekturregel 2). Zwei Umsetzungen laufen erfahrungsgemäß auseinander.
 *
 * Wer die Rust-Fassung baut, übersetzt dafür **die Testfälle aus
 * `validate-text.test.ts` und `din5008.test.ts` mit** — sie sind bewusst so
 * geschrieben, dass sie sich Satz für Satz übertragen lassen. Eine gemeinsame
 * Prüffalldatei wäre schöner; sie anzulegen lohnt erst, wenn die zweite
 * Umsetzung tatsächlich entsteht (`SPEC.md` 15, offener Punkt 14).
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import { checkDin5008, type Din5008Finding } from './din5008';
import { checkSchreibweise } from './schreibweise';

export type ValidationCode =
  | 'zeichen-nicht-erlaubt'
  | 'zu-kurz'
  | 'zu-lang'
  | 'blockwort'
  | 'url'
  | 'email'
  | 'telefonnummer'
  | 'wiederholung'
  | 'din5008'
  | 'umlaut-umschreibung';

export interface ValidationIssue {
  readonly code: ValidationCode;
  readonly message: string;
  /** Bei DIN-Verstößen die einzelne Fundstelle. */
  readonly din?: Din5008Finding;
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly issues: readonly ValidationIssue[];
}

export interface ValidationOptions {
  /** Erlaubter Zeichenvorrat. Fehlt er, wird der Zeichensatz nicht geprüft. */
  readonly allowedChars?: string | undefined;
  readonly minChars?: number;
  readonly maxChars?: number;
  /** Wörter der Blocklist, kleingeschrieben. */
  readonly blocklist?: readonly string[];
  /** DIN-5008-Prüfung abschalten — nur für Silbendrills sinnvoll. */
  readonly skipDin5008?: boolean;
}

/** Ein Satz darf höchstens so oft vorkommen (Degenerationsschutz, SPEC.md 9.4). */
const MAX_SATZWIEDERHOLUNG = 2;

const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:de|com|net|org|eu|info)\b/gi;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
/**
 * Telefonnummern.
 *
 * Verlangt einen plausiblen Anfang — `+`, `00` oder eine führende `0` — und
 * danach mindestens sechs Ziffern. Ohne diese Bedingung schlug die Regel bei
 * den Ziffergruppen der Drilltexte aus `L22` an (`927 7952 589`), die nur so
 * aussehen wie eine Nummer und keine sind. Sehr lange Ziffernketten ohne
 * führende Null fängt ohnehin die Zahlengliederung aus DIN 5008 ab.
 */
const TEL_RE = /(?:\+\d{1,3}|00\d{1,3}|\b0)[\s/-]?(?:\d[\s/-]?){5,}\d/g;

export function validateText(text: string, options: ValidationOptions = {}): ValidationResult {
  const issues: ValidationIssue[] = [];
  const add = (code: ValidationCode, message: string, din?: Din5008Finding): void => {
    issues.push(din ? { code, message, din } : { code, message });
  };

  // 1. Zeichensatz. Der wichtigste Punkt: Ein einziges ungelerntes Zeichen
  //    macht den Text unbrauchbar (ARCHITEKTUR.md, harte Regel).
  if (options.allowedChars !== undefined) {
    const erlaubt = new Set([...options.allowedChars]);
    const verstoesse = new Set<string>();
    for (const c of text) if (!erlaubt.has(c)) verstoesse.add(c);
    if (verstoesse.size > 0) {
      add(
        'zeichen-nicht-erlaubt',
        `Nicht erlaubte Zeichen: ${[...verstoesse].map((c) => `'${c}'`).join(' ')}`,
      );
    }
  }

  // 2. Laenge.
  const laenge = [...text].length;
  if (options.minChars !== undefined && laenge < options.minChars) {
    add('zu-kurz', `Text hat ${laenge} Zeichen, gefordert sind mindestens ${options.minChars}.`);
  }
  if (options.maxChars !== undefined && laenge > options.maxChars) {
    add('zu-lang', `Text hat ${laenge} Zeichen, erlaubt sind höchstens ${options.maxChars}.`);
  }

  // 3. Blocklist, wortgrenzenbasiert.
  for (const wort of options.blocklist ?? []) {
    if (enthaeltWort(text, wort)) {
      add('blockwort', `Enthält das gesperrte Wort '${wort}'.`);
    }
  }

  // 4. URLs, E-Mail-Adressen, Telefonnummern.
  if (URL_RE.test(text)) add('url', 'Enthält eine Adresse im Netz.');
  URL_RE.lastIndex = 0;
  if (EMAIL_RE.test(text)) add('email', 'Enthält eine E-Mail-Adresse.');
  EMAIL_RE.lastIndex = 0;
  if (TEL_RE.test(text))
    add('telefonnummer', 'Enthält etwas, das wie eine Telefonnummer aussieht.');
  TEL_RE.lastIndex = 0;

  // 5. Degenerationsschutz: derselbe Satz mehr als zweimal.
  for (const [satz, anzahl] of satzhaeufigkeiten(text)) {
    if (anzahl > MAX_SATZWIEDERHOLUNG) {
      add('wiederholung', `Der Satz '${satz}' kommt ${anzahl}-mal vor.`);
    }
  }

  // 6. DIN 5008.
  if (options.skipDin5008 !== true) {
    for (const f of checkDin5008(text)) {
      add('din5008', f.message, f);
    }
  }

  // 7. Umschriebene Umlaute. Gilt auch fuer Silbendrills: 'gross' waere dort
  //    zwar tippbar, aber es ist trotzdem falsch geschrieben.
  for (const f of checkSchreibweise(text)) {
    add('umlaut-umschreibung', f.message);
  }

  return { ok: issues.length === 0, issues };
}

/**
 * Deutsche Beugungsendungen, die ein gesperrtes Wort noch gesperrt lassen.
 *
 * Eine feste Liste, **keine Längenbegrenzung**. Der erste Entwurf ließ bis zu
 * zwei beliebige Buchstaben als Endung zu — damit galt „Waffel" als „Waffe"
 * und ein harmloser Text wurde verworfen. Eine Blocklist, die Alltagswörter
 * sperrt, kostet jedes Mal einen brauchbaren Text und wird irgendwann
 * abgeschaltet.
 */
const ENDUNGEN = ['', 'n', 'en', 'e', 'er', 'es', 'em', 's', 'ern', 'et', 'te', 'ten'];

/**
 * Wortgrenzenbasierte Suche.
 *
 * `\b` hilft bei Umlauten nicht zuverlässig, deshalb von Hand: Vor dem Fund
 * darf kein Buchstabe stehen, danach nur eine Endung aus {@link ENDUNGEN}.
 */
function enthaeltWort(text: string, wort: string): boolean {
  if (wort.length === 0) return false;
  const klein = text.toLowerCase();
  const ziel = wort.toLowerCase();
  const istBuchstabe = (c: string | undefined): boolean => c !== undefined && /[a-zäöüß]/.test(c);

  let von = 0;
  for (;;) {
    const i = klein.indexOf(ziel, von);
    if (i === -1) return false;
    von = i + 1;

    if (istBuchstabe(klein[i - 1])) continue; // steckt in einem laengeren Wort

    const rest = klein.slice(i + ziel.length);
    for (const endung of ENDUNGEN) {
      if (!rest.startsWith(endung)) continue;
      if (istBuchstabe(rest[endung.length])) continue; // laengeres Wort
      return true;
    }
  }
}

/** Sätze und wie oft sie vorkommen. Für den Degenerationsschutz. */
function satzhaeufigkeiten(text: string): Map<string, number> {
  const haeufigkeit = new Map<string, number>();
  for (const roh of text.split(/(?<=[.!?])\s+/)) {
    const satz = roh.trim().toLowerCase();
    if (satz.length < 8) continue; // zu kurz, um aussagekraeftig zu sein
    haeufigkeit.set(satz, (haeufigkeit.get(satz) ?? 0) + 1);
  }
  return haeufigkeit;
}

/** Liest eine Blocklist im Format von `content/blocklist.de.txt`. */
export function parseBlocklist(inhalt: string): string[] {
  return inhalt
    .split(/\r?\n/)
    .map((z) => z.trim())
    .filter((z) => z.length > 0 && !z.startsWith('#'))
    .map((z) => z.toLowerCase());
}
