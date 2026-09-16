/**
 * Prüft `content/topics.seed.json` — mit **derselben** Funktion, die auch
 * KI-Antworten prüft (`SPEC.md` 9.6: „müssen aber denselben `validate_text()`-
 * Check bestehen wie KI-Texte").
 *
 * Läuft über `npm run validate:seed` und in der CI.
 *
 * Ersetzt `scripts/pruefe-seed.ps1`, der nur den Zeichenvorrat und die Länge
 * prüfen konnte.
 *
 * Aufruf:
 *   npm run validate:seed          alle Themen
 *   npm run validate:seed -- tiere nur ein Thema
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateText, parseBlocklist } from '../src/lib/validate-text';
import { allLessons } from '../src/lib/curriculum';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');

interface SeedText {
  charset: string;
  age: string;
  body: string;
}
interface SeedTopic {
  id: string;
  label: string;
  texts: SeedText[];
  facts: string[];
}
interface Seed {
  charsets: Record<string, { chars: string; lessons: string[] }>;
  topics: SeedTopic[];
}

const seed: Seed = JSON.parse(readFileSync(join(WURZEL, 'content', 'topics.seed.json'), 'utf8'));
const blocklist = parseBlocklist(readFileSync(join(WURZEL, 'content', 'blocklist.de.txt'), 'utf8'));

const nurThema = process.argv[2];

/**
 * `S1` und `S2` sind Silbendrills („fff jjj fjf"). Sie an DIN 5008 zu messen
 * wäre sinnlos — es sind keine Sätze. Ab `S3` stehen echte Sätze, und dort
 * gilt die Norm.
 */
const istSilbendrill = (stufe: string): boolean => stufe === 'S1' || stufe === 'S2';

let geprueft = 0;
let fehlerhaft = 0;
const meldungen: string[] = [];

for (const topic of seed.topics) {
  if (nurThema && topic.id !== nurThema) continue;

  for (const text of topic.texts) {
    geprueft++;
    const stufe = seed.charsets[text.charset];
    if (!stufe) {
      meldungen.push(`FEHLER  ${topic.id}: unbekannte Zeichensatzstufe '${text.charset}'`);
      fehlerhaft++;
      continue;
    }

    const ergebnis = validateText(text.body, {
      allowedChars: stufe.chars,
      minChars: 120,
      maxChars: 320,
      blocklist,
      skipDin5008: istSilbendrill(text.charset),
    });

    if (!ergebnis.ok) {
      fehlerhaft++;
      meldungen.push(`FEHLER  ${topic.id}/${text.charset}/${text.age}`);
      for (const i of ergebnis.issues) {
        meldungen.push(`        ${i.code}: ${i.message}`);
        if (i.din) meldungen.push(`        ... '${i.din.excerpt}'`);
      }
    }
  }

  // Wissenshaeppchen duerfen alle Zeichen enthalten -- sie werden gelesen,
  // nicht getippt (SPEC.md 9.9). Geprueft werden sie trotzdem: Blocklist,
  // Adressen und DIN 5008 gelten auch fuer sie.
  for (const fakt of topic.facts) {
    geprueft++;
    const ergebnis = validateText(fakt, { blocklist, maxChars: 320 });
    if (!ergebnis.ok) {
      fehlerhaft++;
      meldungen.push(`FEHLER  ${topic.id}/Wissenshaeppchen`);
      for (const i of ergebnis.issues) meldungen.push(`        ${i.code}: ${i.message}`);
    }
  }
}

// Gegenprobe: Deckt sich jede Stufe mit den Lektionen, die sie bedienen soll?
for (const lesson of allLessons().filter((l) => l.textSource === 'topic')) {
  const stufe = seed.charsets[lesson.stage];
  if (!stufe) continue;
  const eigen = new Set([...lesson.chars]);
  const derStufe = new Set([...stufe.chars]);
  const zuviel = [...derStufe].filter((c) => !eigen.has(c));
  if (zuviel.length > 0) {
    meldungen.push(
      `FEHLER  ${lesson.id} zieht Texte der Stufe ${lesson.stage}, die Zeichen ` +
        `${zuviel.map((c) => `'${c}'`).join(' ')} enthalten darf, welche dort noch nicht gelernt sind.`,
    );
    fehlerhaft++;
  }
}

for (const z of meldungen) console.log(z);
console.log('');
console.log(`Geprueft: ${geprueft} Texte. Fehlerhaft: ${fehlerhaft}.`);
process.exit(fehlerhaft > 0 ? 1 : 0);
