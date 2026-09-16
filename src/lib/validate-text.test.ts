import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateText, parseBlocklist, type ValidationCode } from './validate-text';
import { allLessons } from './curriculum';
import { drillForLesson } from './drill';

const HIER = dirname(fileURLToPath(import.meta.url));
const BLOCKLIST = parseBlocklist(
  readFileSync(join(HIER, '..', '..', 'content', 'blocklist.de.txt'), 'utf8'),
);

const codes = (text: string, o = {}): ValidationCode[] =>
  validateText(text, o).issues.map((i) => i.code);

describe('Zeichensatzprüfung — SPEC.md 9.4, Punkt 1', () => {
  it('lässt einen Text aus erlaubten Zeichen durch', () => {
    expect(validateText('fff jjj', { allowedChars: 'fj ', skipDin5008: true }).ok).toBe(true);
  });

  it('verwirft einen Text mit einem einzigen unerlaubten Zeichen', () => {
    const r = validateText('fff jjx', { allowedChars: 'fj ', skipDin5008: true });
    expect(r.ok).toBe(false);
    expect(r.issues[0]!.code).toBe('zeichen-nicht-erlaubt');
    expect(r.issues[0]!.message).toContain("'x'");
  });

  it('prüft den Zeichensatz nicht, wenn keiner angegeben ist', () => {
    expect(validateText('was auch immer', { skipDin5008: true }).ok).toBe(true);
  });
});

describe('Längenprüfung — SPEC.md 9.4, Punkt 2', () => {
  it('verwirft zu kurze Texte', () => {
    expect(codes('kurz', { minChars: 10, skipDin5008: true })).toContain('zu-kurz');
  });

  it('verwirft zu lange Texte', () => {
    expect(codes('a'.repeat(50), { maxChars: 20, skipDin5008: true })).toContain('zu-lang');
  });

  it('zählt nach Zeichen, nicht nach Bytes', () => {
    // Fuenf Umlaute sind fuenf Zeichen, nicht zehn Bytes.
    expect(validateText('äöüäö', { minChars: 5, maxChars: 5, skipDin5008: true }).ok).toBe(true);
  });
});

describe('Blocklist — SPEC.md 9.4, Punkt 3', () => {
  it('ist aus der Datei lesbar und nicht leer', () => {
    expect(BLOCKLIST.length).toBeGreaterThan(20);
    expect(BLOCKLIST).toContain('waffe');
  });

  it('überspringt Kommentare und Leerzeilen', () => {
    expect(parseBlocklist('# Kommentar\n\nwaffe\n  \nmord')).toEqual(['waffe', 'mord']);
  });

  it('verwirft einen Text mit einem gesperrten Wort', () => {
    expect(codes('Er hatte eine Waffe dabei.', { blocklist: BLOCKLIST })).toContain('blockwort');
  });

  it('erkennt auch die gebeugte Form', () => {
    expect(codes('Dort lagen Waffen.', { blocklist: BLOCKLIST })).toContain('blockwort');
  });

  /**
   * Wortgrenzen sind der Kern: Ohne sie sperrt die Liste Alltagswörter und
   * frisst reihenweise brauchbare Texte.
   */
  it('trifft nicht mitten in einem längeren Wort', () => {
    for (const harmlos of [
      'Die Waffel schmeckt gut.',
      'Der Mordent ist eine Verzierung in der Musik.',
      'Sie hat den Sextanten benutzt.',
      'Das Blutbuchenblatt ist rot.',
    ]) {
      const gefunden = codes(harmlos, { blocklist: BLOCKLIST });
      expect(gefunden, harmlos).not.toContain('blockwort');
    }
  });

  it('achtet nicht auf Groß- und Kleinschreibung', () => {
    expect(codes('MORD', { blocklist: BLOCKLIST, skipDin5008: true })).toContain('blockwort');
  });
});

describe('Adressen und Nummern — SPEC.md 9.4, Punkt 4', () => {
  it('verwirft eine Adresse im Netz', () => {
    expect(codes('Schau auf https://beispiel.de nach.')).toContain('url');
    expect(codes('Schau auf www.beispiel.de nach.')).toContain('url');
  });

  it('verwirft eine E-Mail-Adresse', () => {
    expect(codes('Schreib an name@beispiel.de zurück.')).toContain('email');
  });

  it('verwirft etwas, das wie eine Telefonnummer aussieht', () => {
    expect(codes('Ruf 0361 1234567 an.')).toContain('telefonnummer');
    expect(codes('Ruf +49 170 1234567 an.')).toContain('telefonnummer');
  });

  it('hält normale Zahlen im Text für harmlos', () => {
    expect(codes('Ein Igel hat rund 8000 Stacheln.')).not.toContain('telefonnummer');
    expect(codes('Der Marathon ist 42,195 Kilometer lang.')).not.toContain('telefonnummer');
  });

  /**
   * Der Drill in `L22` erzeugt Ziffergruppen wie `927 7952 589`. Die sehen aus
   * wie eine Nummer, sind aber keine — die Erkennung verlangt deshalb einen
   * plausiblen Anfang (`+`, `00` oder führende Null).
   */
  it('hält Ziffergruppen ohne führende Null für harmlos', () => {
    expect(codes('927 7952 589', { skipDin5008: true })).not.toContain('telefonnummer');
    expect(codes('34 1159 1940 7049', { skipDin5008: true })).not.toContain('telefonnummer');
  });
});

describe('Degenerationsschutz — SPEC.md 9.4, Punkt 5', () => {
  it('lässt eine zweimalige Wiederholung durch', () => {
    const t = 'Der Luchs jagt nachts. Der Luchs jagt nachts. Am Tag schläft er.';
    expect(codes(t)).not.toContain('wiederholung');
  });

  it('verwirft eine dreimalige Wiederholung', () => {
    const t = 'Der Luchs jagt nachts. Der Luchs jagt nachts. Der Luchs jagt nachts.';
    expect(codes(t)).toContain('wiederholung');
  });

  it('zählt sehr kurze Bruchstücke nicht mit', () => {
    expect(codes('Ja. Ja. Ja. Ja. Ja.')).not.toContain('wiederholung');
  });
});

describe('DIN 5008 ist Teil der Prüfung — SPEC.md 9.4, Punkt 6', () => {
  it('verwirft einen Text mit Normverstoß', () => {
    expect(codes('Der Luchs jagt nachts .')).toContain('din5008');
  });

  it('reicht die Fundstelle durch', () => {
    const issue = validateText('Der Luchs jagt nachts .').issues.find((i) => i.code === 'din5008');
    expect(issue?.din?.code).toBe('leerzeichen-vor-satzzeichen');
  });

  it('lässt sich für Silbendrills abschalten', () => {
    // "fff jjj fjf" ist kein Satz und soll nicht an der Norm gemessen werden.
    expect(validateText('fff jjj fjf', { skipDin5008: true }).ok).toBe(true);
  });
});

describe('Zusammenspiel mit den erzeugten Drilltexten', () => {
  /**
   * Der Bestand, den `drill.ts` erzeugt, muss dieselbe Prüfung bestehen wie
   * alles andere — jedenfalls beim Zeichensatz. Die DIN-Prüfung greift dort
   * nicht, weil Silbenfolgen keine Sätze sind.
   */
  it('lässt jeden Drilltext jeder Lektion durch', () => {
    for (const lesson of allLessons()) {
      for (let versuch = 0; versuch < 5; versuch++) {
        const text = drillForLesson(lesson.id, versuch);
        const r = validateText(text, {
          allowedChars: lesson.chars,
          minChars: 100,
          maxChars: 320,
          blocklist: BLOCKLIST,
          skipDin5008: true,
        });
        expect(r.ok, `${lesson.id}/${versuch}: ${JSON.stringify(r.issues)}`).toBe(true);
      }
    }
  });
});
