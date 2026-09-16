import { describe, it, expect } from 'vitest';
import {
  countStrokes,
  countErrors,
  errorRate,
  strokesPerMinute,
  wordsPerMinute,
  firstTryRate,
  UntypableCharacterError,
} from './metrics';

describe('countStrokes — NORMEN.md 4.1', () => {
  it('zählt einen Kleinbuchstaben als einen Anschlag', () => {
    expect(countStrokes('a')).toBe(1);
  });

  it('zählt einen Großbuchstaben als zwei Anschläge, weil Umschalt mitzählt', () => {
    expect(countStrokes('A')).toBe(2);
  });

  it('zählt das at-Zeichen als zwei Anschläge, weil AltGr mitzählt', () => {
    expect(countStrokes('@')).toBe(2);
  });

  it('zählt die Leertaste als einen Anschlag', () => {
    expect(countStrokes(' ')).toBe(1);
  });

  it('zählt die Zeilenschaltung als einen Anschlag', () => {
    expect(countStrokes('\n')).toBe(1);
  });

  it('behandelt \\r\\n als eine einzige Zeilenschaltung', () => {
    expect(countStrokes('\r\n')).toBe(1);
  });

  /**
   * Das ist das wörtliche Beispiel aus NORMEN.md 4.1. Wenn dieser Test fällt,
   * ist die Zählweise falsch — nicht der Test.
   */
  it('rechnet das Beispiel aus der Norm: 100 Zeichen mit 8 Großbuchstaben = 108 Anschläge', () => {
    const text = 'Abcdefghij'.repeat(10); // 100 Zeichen, jedes zehnte gross => 10 gross
    expect(text).toHaveLength(100);
    expect(countStrokes(text)).toBe(110);

    // Und die Variante mit genau acht Grossbuchstaben:
    const achtGross = 'ABCDEFGH' + 'i'.repeat(92);
    expect(achtGross).toHaveLength(100);
    expect(countStrokes(achtGross)).toBe(108);
  });

  it('zählt Umlaute als einen Anschlag, ihre Großform als zwei', () => {
    expect(countStrokes('äöü')).toBe(3);
    expect(countStrokes('ÄÖÜ')).toBe(6);
  });

  it('zählt das scharfe s als einen Anschlag', () => {
    expect(countStrokes('ß')).toBe(1);
  });

  it('zählt Ziffern als einen Anschlag, Satzzeichen mit Umschalt als zwei', () => {
    expect(countStrokes('123')).toBe(3);
    expect(countStrokes(',.-')).toBe(3); // ohne Umschalt
    expect(countStrokes('!?;:')).toBe(8); // alle mit Umschalt
  });

  it('zählt tote Tasten mit dem nötigen Leerzeichen', () => {
    // ^ ist eine tote Taste: Taste plus Leertaste.
    expect(countStrokes('^')).toBe(2);
    // ` ist Umschalt plus tote Taste plus Leertaste.
    expect(countStrokes('`')).toBe(3);
  });

  it('wirft bei einem Zeichen, das T1 nicht erzeugt', () => {
    expect(() => countStrokes('漢')).toThrow(UntypableCharacterError);
    expect(() => countStrokes('€uro')).not.toThrow(); // € gibt es auf AltGr+E
  });

  it('zählt einen leeren Text als null Anschläge', () => {
    expect(countStrokes('')).toBe(0);
  });

  it('zählt einen ganzen Satz korrekt durch', () => {
    // "Hallo Welt!" = H(2) a l l o(4) Leer(1) W(2) e l t(3) !(2) = 14
    expect(countStrokes('Hallo Welt!')).toBe(14);
  });
});

describe('countErrors — NORMEN.md 4.2, gezählt am Ergebnistext', () => {
  it('zählt keinen Fehler bei gleichem Text', () => {
    expect(countErrors('hallo', 'hallo')).toBe(0);
  });

  it('zählt ein falsches Zeichen als einen Fehler', () => {
    expect(countErrors('hallo', 'hallu')).toBe(1);
  });

  it('zählt ein fehlendes Zeichen als einen Fehler', () => {
    expect(countErrors('hallo', 'hall')).toBe(1);
  });

  it('zählt ein zusätzliches Zeichen als einen Fehler', () => {
    expect(countErrors('hallo', 'halloo')).toBe(1);
  });

  it('zählt eine fehlende Zeilenschaltung als einen Fehler', () => {
    expect(countErrors('eins\nzwei', 'einszwei')).toBe(1);
  });

  it('zählt eine überzählige Leerzeile als einen Fehler', () => {
    expect(countErrors('eins\nzwei', 'eins\n\nzwei')).toBe(1);
  });

  it('behandelt \\r\\n und \\n als dieselbe Zeilenschaltung', () => {
    expect(countErrors('eins\nzwei', 'eins\r\nzwei')).toBe(0);
  });

  it('zählt einen vollständig leeren Versuch als so viele Fehler wie Zeichen', () => {
    expect(countErrors('hallo', '')).toBe(5);
  });

  it('zählt mehrere Fehler einzeln', () => {
    // "katze" -> "kaze" (fehlt t) und dann "kaZe" (falsch) = 2
    expect(countErrors('katze', 'kaZe')).toBe(2);
  });
});

describe('errorRate — NORMEN.md 4.3', () => {
  it('rechnet Fehler mal hundert durch Gesamtanschläge', () => {
    expect(errorRate(2, 400)).toBe(0.5);
  });

  it('gibt null zurück, wenn nichts getippt wurde', () => {
    expect(errorRate(0, 0)).toBe(0);
  });

  it('trifft die Wettbewerbsgrenze von 0,5 Prozent genau', () => {
    // Bundesjugendschreiben: 600 Anschlaege, hoechstens 0,5 % => 3 Fehler
    expect(errorRate(3, 600)).toBe(0.5);
    expect(errorRate(4, 600)).toBeGreaterThan(0.5);
  });
});

describe('strokesPerMinute und WPM — NORMEN.md 4.5', () => {
  it('rechnet Anschläge pro Minute', () => {
    expect(strokesPerMinute(120, 60000)).toBe(120);
    expect(strokesPerMinute(60, 30000)).toBe(120);
  });

  it('gibt null zurück, wenn keine Zeit vergangen ist', () => {
    expect(strokesPerMinute(100, 0)).toBe(0);
  });

  it('rechnet WPM als A/min geteilt durch fünf', () => {
    expect(wordsPerMinute(200)).toBe(40);
  });

  it('trifft die Mindestleistung des Bundesjugendschreibens', () => {
    // 600 Anschlaege in 10 Minuten = 60 A/min
    expect(strokesPerMinute(600, 600000)).toBe(60);
  });
});

describe('firstTryRate — die Kennzahl „Sicherheit", NORMEN.md 4.4', () => {
  it('rechnet den Anteil der Treffer ohne Korrektur', () => {
    expect(firstTryRate(90, 100)).toBe(90);
  });

  it('gibt null zurück, wenn nichts getippt wurde', () => {
    expect(firstTryRate(0, 0)).toBe(0);
  });

  it('ist strenger als die Fehlerquote: korrigierte Vertipper senken sie', () => {
    // Zehn Vertipper, alle verbessert: Fehlerquote 0 %, Sicherheit 90 %.
    const korrigiert = 10;
    const zeichen = 100;
    expect(errorRate(0, zeichen)).toBe(0);
    expect(firstTryRate(zeichen - korrigiert, zeichen)).toBe(90);
  });
});
