/**
 * Prüft **alle** von Zehni ausgegebenen Texte gegen DIN 5008:2020-03.
 *
 * `NORMEN.md` 5.1: „Jeder Text, den Zehni ausgibt — Seed, KI-generiert,
 * Oberflächentexte, Urkunde — folgt DIN 5008. Das wird maschinell geprüft
 * (`scripts/check-din5008.ts`, läuft in der CI und im Textvalidator)."
 *
 * Zehni lehrt diese Norm im Modul „Textverarbeitung" (`SPEC.md` 10.2). Hielte
 * die App sich selbst nicht daran, wäre das Modul unglaubwürdig.
 *
 * Läuft über `npm run check:din5008`.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkDin5008 } from '../src/lib/din5008';
import { checkSchreibweise } from '../src/lib/schreibweise';
import { de } from '../src/i18n/de';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');

let geprueft = 0;
let fehlerhaft = 0;
/** Absichtlich fehlerhafte Lehrbeispiele — siehe `ABSICHTLICH_FALSCH`. */
let uebersprungen = 0;
const meldungen: string[] = [];

function pruefe(herkunft: string, text: string): void {
  geprueft++;
  const din = checkDin5008(text);
  // Umschriebene Umlaute sind keine DIN-Frage, sondern falsche Rechtschreibung.
  // Sie werden hier mitgeprueft, weil derselbe Text betroffen ist und weil der
  // Fehler in diesem Projekt schon zweimal vorkam.
  const schreibweise = checkSchreibweise(text);

  if (din.length === 0 && schreibweise.length === 0) return;
  fehlerhaft++;
  meldungen.push(`FEHLER  ${herkunft}`);
  for (const f of din) {
    meldungen.push(`        ${f.code}: ${f.message}`);
    meldungen.push(`        ... '${f.excerpt}'`);
  }
  for (const f of schreibweise) {
    meldungen.push(`        umlaut-umschreibung: ${f.message}`);
  }
}

/** Läuft rekursiv durch die Texttabelle und prüft jeden Eintrag. */
function pruefeTexte(wert: unknown, pfad: string): void {
  if (typeof wert === 'string') {
    pruefe(pfad, wert);
    return;
  }
  // Funktionen in de.ts erzeugen Text aus Zahlen -- mit einem Beispielwert
  // pruefen, damit auch sie nicht durchrutschen.
  if (typeof wert === 'function') {
    try {
      const erzeugt: unknown = (wert as (n: number) => unknown)(3);
      if (typeof erzeugt === 'string') pruefe(`${pfad}(3)`, erzeugt);
    } catch {
      meldungen.push(`HINWEIS ${pfad}: nicht mit einer Zahl aufrufbar, uebersprungen.`);
    }
    return;
  }
  if (wert && typeof wert === 'object') {
    for (const [k, v] of Object.entries(wert)) pruefeTexte(v, `${pfad}.${k}`);
  }
}

console.log('Oberflaechentexte (src/i18n/de.ts)');
pruefeTexte(de, 'de');

console.log('Inhalte (content/)');
interface Seed {
  topics: {
    id: string;
    label: string;
    texts: { charset: string; body: string }[];
    facts: string[];
  }[];
}
const seed: Seed = JSON.parse(readFileSync(join(WURZEL, 'content', 'topics.seed.json'), 'utf8'));

for (const topic of seed.topics) {
  pruefe(`topics.${topic.id}.label`, topic.label);
  for (const t of topic.texts) {
    // S1 und S2 sind Silbendrills, keine Saetze -- die Norm greift dort nicht.
    if (t.charset === 'S1' || t.charset === 'S2') continue;
    pruefe(`topics.${topic.id}.${t.charset}`, t.body);
  }
  for (const [i, f] of topic.facts.entries()) pruefe(`topics.${topic.id}.fakt[${i}]`, f);
}

interface Lessons {
  lessons: { id: string; title: string; focus: string }[];
}
const lessons: Lessons = JSON.parse(readFileSync(join(WURZEL, 'content', 'lessons.json'), 'utf8'));
for (const l of lessons.lessons) {
  pruefe(`lessons.${l.id}.title`, l.title);
  pruefe(`lessons.${l.id}.focus`, l.focus);
}

/**
 * Felder, die **absichtlich** gegen die Norm verstoßen.
 *
 * Das Modul „Textverarbeitung" (`SPEC.md` 10.2) lehrt DIN 5008 unter anderem an
 * fehlerhaften Texten, die das Kind berichtigen soll. Genau diese Texte stehen
 * im Feld `vorgabe` — und nur dort. Alles andere wird geprüft, auch in
 * denselben Einheiten: Die Erklärungen, die Lösung und der Abschluss müssen
 * normgerecht sein, sonst wäre das Modul unglaubwürdig.
 *
 * Bewusst **ein** Feldname und keine Liste von Ausnahmen: Was hier
 * durchrutschen soll, muss man absichtlich in dieses Feld schreiben.
 */
const ABSICHTLICH_FALSCH = new Set(['vorgabe']);

/**
 * Felder, die keine Sätze enthalten, sondern Kennungen.
 *
 * `id`, `fach`, `form` und `code` werden nie angezeigt; sie sind
 * Programmschlüssel und bewusst ASCII (`gross`, `KeyC`). Sie durch eine
 * Rechtschreibprüfung zu schicken, erzeugt nur Rauschen — und Rauschen ist der
 * schnellste Weg, eine Prüfung abzuschalten.
 */
const KENNUNGEN = new Set(['id', 'fach', 'form', 'code', 'digcomp', 'art']);

/** Läuft rekursiv durch eine beliebige Inhaltsstruktur und prüft jeden String. */
function lauf(wert: unknown, pfad: string): void {
  if (typeof wert === 'string') pruefe(pfad, wert);
  else if (Array.isArray(wert)) wert.forEach((v, i) => lauf(v, `${pfad}[${i}]`));
  else if (wert && typeof wert === 'object')
    for (const [k, v] of Object.entries(wert)) {
      if (ABSICHTLICH_FALSCH.has(k)) {
        uebersprungen++;
        continue;
      }
      if (KENNUNGEN.has(k)) continue;
      lauf(v, `${pfad}.${k}`);
    }
}

// Die Zwischenstuecke (SPEC.md 6.6). Sie werden gelesen, nicht getippt, und
// duerfen alle Zeichen enthalten -- die Norm gilt trotzdem.
interface Interludes {
  units: Record<string, unknown>[];
}
const interludes: Interludes = JSON.parse(
  readFileSync(join(WURZEL, 'content', 'interludes.json'), 'utf8'),
);
for (const u of interludes.units) lauf(u, `interludes.${String(u['id'])}`);

// Tagesaufgaben (SPEC.md 8.6). Sie stehen dem Kind vor Augen und fallen damit
// unter NORMEN.md 5.1.
interface Challenges {
  aufgaben: Record<string, unknown>[];
}
const challenges: Challenges = JSON.parse(
  readFileSync(join(WURZEL, 'content', 'challenges.json'), 'utf8'),
);
for (const a of challenges.aufgaben) pruefe(`challenges.${String(a['id'])}`, String(a['text']));

// Das Aenderungsprotokoll (SPEC.md 11.4). Steht in den Einstellungen und wird
// gelesen -- also gilt NORMEN.md 5.1 auch hier. Versionsnummern sind keine
// Zahlen im Sinne der Gliederungsregel und werden nicht mitgeprueft.
interface Aenderungen {
  versionen: { version: string; punkte: string[] }[];
}
const aenderungen: Aenderungen = JSON.parse(
  readFileSync(join(WURZEL, 'content', 'aenderungen.json'), 'utf8'),
);
for (const v of aenderungen.versionen) {
  v.punkte.forEach((p, i) => pruefe(`aenderungen.${v.version}.${i + 1}`, p));
}

// Der freie Modulbereich (SPEC.md 10). Hier stehen die laengsten Texte der
// ganzen App -- und im Modul "Textverarbeitung" die einzigen, die absichtlich
// gegen die Norm verstossen (Feld `vorgabe`, siehe oben).
for (const datei of ['medien', 'lernen', 'text']) {
  const modul: { title: string; beschreibung: string; units: unknown[] } = JSON.parse(
    readFileSync(join(WURZEL, 'content', 'modules', `${datei}.json`), 'utf8'),
  );
  // Nur was angezeigt wird. `comment` ist eine Notiz an die Entwicklung und
  // steht wie ueberall in diesem Projekt in ASCII.
  pruefe(`modules.${datei}.title`, modul.title);
  pruefe(`modules.${datei}.beschreibung`, modul.beschreibung);
  modul.units.forEach((u, i) => lauf(u, `modules.${datei}.units[${i}]`));
}

for (const z of meldungen) console.log(z);
console.log('');
console.log(
  `Geprueft: ${geprueft} Texte. Fehlerhaft: ${fehlerhaft}. ` +
    `Absichtliche Gegenbeispiele uebersprungen: ${uebersprungen}.`,
);
process.exit(fehlerhaft > 0 ? 1 : 0);
