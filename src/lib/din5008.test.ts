import { describe, it, expect } from 'vitest';
import { checkDin5008, isDin5008Compliant, type Din5008Code } from './din5008';

/** Kürzel der Beanstandungen zu einem Text. */
const codes = (text: string): Din5008Code[] => checkDin5008(text).map((f) => f.code);

describe('Satzzeichenabstände — NORMEN.md 5.1', () => {
  it('beanstandet ein Leerzeichen vor dem Satzzeichen', () => {
    expect(codes('Hallo Welt .')).toContain('leerzeichen-vor-satzzeichen');
    expect(codes('Wirklich ?')).toContain('leerzeichen-vor-satzzeichen');
  });

  it('beanstandet ein fehlendes Leerzeichen danach', () => {
    expect(codes('Hallo.Welt')).toContain('leerzeichen-nach-satzzeichen-fehlt');
    expect(codes('eins,zwei')).toContain('leerzeichen-nach-satzzeichen-fehlt');
  });

  it('lässt einen richtig gesetzten Satz durch', () => {
    expect(checkDin5008('Der Igel ist nachtaktiv. Im Winter schläft er.')).toEqual([]);
  });

  /**
   * Zwischen Ziffern gilt die Abstandsregel nicht — sonst wäre jede
   * Dezimalzahl und jede Uhrzeit ein Verstoß.
   */
  it('beanstandet keine Dezimalzahl', () => {
    expect(checkDin5008('Das Tor ist 7,32 Meter breit.')).toEqual([]);
    expect(checkDin5008('Der Marathon ist 42,195 Kilometer lang.')).toEqual([]);
  });

  it('beanstandet keine Uhrzeit mit Doppelpunkt', () => {
    expect(checkDin5008('Wir fangen um 14:30 Uhr an.')).toEqual([]);
  });

  it('beanstandet keinen Geldbetrag', () => {
    expect(checkDin5008('Das kostet 1.234,56 EUR.')).toEqual([]);
  });

  it('lässt Auslassungspunkte und Satzzeichenfolgen durch', () => {
    expect(checkDin5008('Und dann ... passierte nichts.')).toEqual([]);
    expect(checkDin5008('Wirklich?! Das glaube ich nicht.')).toEqual([]);
  });

  it('lässt ein Satzzeichen vor schließender Klammer durch', () => {
    expect(checkDin5008('Er kam spät (sehr spät).')).toEqual([]);
  });

  it('lässt ein Satzzeichen am Textende durch', () => {
    expect(checkDin5008('Fertig.')).toEqual([]);
  });
});

describe('Leerzeichen', () => {
  it('beanstandet doppelte Leerzeichen', () => {
    expect(codes('Hallo  Welt.')).toContain('doppeltes-leerzeichen');
  });

  it('beanstandet ein Leerzeichen am Zeilenende', () => {
    expect(codes('Erste Zeile \nZweite Zeile.')).toContain('leerzeichen-am-zeilenende');
    expect(codes('Ende. ')).toContain('leerzeichen-am-zeilenende');
  });
});

describe('Binde- und Gedankenstrich', () => {
  it('beanstandet den Bindestrich als Gedankenstrich', () => {
    expect(codes('Er kam - und ging wieder.')).toContain('bindestrich-als-gedankenstrich');
  });

  it('lässt den Bindestrich in einer Zusammensetzung durch', () => {
    expect(checkDin5008('Das Zehn-Finger-System ist alt.')).toEqual([]);
  });

  it('beanstandet den Gedankenstrich ohne Leerzeichen', () => {
    expect(codes('Er kam–und ging.')).toContain('gedankenstrich-ohne-leerzeichen');
  });

  it('lässt den richtig gesetzten Gedankenstrich durch', () => {
    expect(checkDin5008('Er kam – und ging wieder.')).toEqual([]);
  });
});

/**
 * Diese Regel stand bis zum 2026-09-14 fälschlich als offener Punkt in
 * `SPEC.md` 15.10. Sie war nie offen: `NORMEN.md` 5.1 legt sie eindeutig fest.
 */
describe('Zahlengliederung — NORMEN.md 5.1', () => {
  it('lässt vierstellige Zahlen ungegliedert', () => {
    expect(checkDin5008('Ein Igel hat rund 8000 Stacheln.')).toEqual([]);
    expect(checkDin5008('Im Jahr 1970 war das anders.')).toEqual([]);
  });

  it('beanstandet fünfstellige Zahlen ohne Gliederung', () => {
    expect(codes('Das sind 45000 Kilometer.')).toContain('zahl-nicht-gegliedert');
  });

  it('lässt die gegliederte Fassung durch', () => {
    expect(checkDin5008('Das sind 45 000 Kilometer.')).toEqual([]);
  });

  it('beanstandet keine Nachkommastellen', () => {
    expect(checkDin5008('Der Wert liegt bei 3,14159 genau.')).toEqual([]);
  });
});

describe('Datum und Uhrzeit', () => {
  it('beanstandet eine zweistellige Jahreszahl', () => {
    expect(codes('Am 12.09.26 ging es los.')).toContain('datum-format');
  });

  it('beanstandet ein Datum ohne führende Null', () => {
    expect(codes('Am 1.9.2026 ging es los.')).toContain('datum-format');
  });

  it('lässt TT.MM.JJJJ durch', () => {
    expect(checkDin5008('Am 12.09.2026 ging es los.')).toEqual([]);
  });

  it('lässt die ISO-Schreibweise durch', () => {
    expect(checkDin5008('Am 2026-09-12 ging es los.')).toEqual([]);
  });

  it('beanstandet eine Uhrzeit mit Punkt', () => {
    expect(codes('Wir fangen um 14.30 Uhr an.')).toContain('uhrzeit-format');
  });
});

describe('Maßeinheiten', () => {
  it('beanstandet eine Einheit ohne Leerzeichen', () => {
    expect(codes('Er wiegt 5kg.')).toContain('einheit-ohne-leerzeichen');
    expect(codes('Das sind 20%.')).toContain('einheit-ohne-leerzeichen');
  });

  it('lässt die getrennte Schreibweise durch', () => {
    expect(checkDin5008('Er wiegt 5 kg.')).toEqual([]);
    expect(checkDin5008('Das sind 20 %.')).toEqual([]);
  });

  /**
   * Die Einheitenliste ist bewusst fest. „Ziffer gefolgt von Buchstaben" würde
   * gängige deutsche Formen beanstanden, die völlig richtig sind.
   */
  it('beanstandet Jahrzehnte und Vervielfältigungen nicht', () => {
    expect(checkDin5008('In den 1970er Jahren war das anders.')).toEqual([]);
    expect(checkDin5008('Der Ton schwingt 440-mal je Sekunde.')).toEqual([]);
  });
});

describe('Gesamturteil', () => {
  it('nennt einen sauberen Text normgerecht', () => {
    expect(isDin5008Compliant('Der Luchs jagt nachts. Am Tag schläft er.')).toBe(true);
  });

  it('nennt einen fehlerhaften Text nicht normgerecht', () => {
    expect(isDin5008Compliant('Der Luchs jagt nachts .')).toBe(false);
  });

  it('gibt die Fundstelle mit Position und Ausschnitt zurück', () => {
    const f = checkDin5008('Hallo Welt .')[0]!;
    expect(f.index).toBeGreaterThan(0);
    expect(f.excerpt).toContain('Welt');
    expect(f.message).toBeTruthy();
  });

  it('meldet die Fundstellen in der Reihenfolge ihres Auftretens', () => {
    const f = checkDin5008('Hallo  Welt .');
    expect(f.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < f.length; i++) {
      expect(f[i]!.index).toBeGreaterThanOrEqual(f[i - 1]!.index);
    }
  });
});

describe('Dateinamen sind keine Sätze', () => {
  /**
   * Aufgefallen beim Modul „Textverarbeitung" (SPEC.md 10.1, Einheit „Ordnung
   * in Dateien"): Der Punkt in `Referat Island.odt` ist kein Satzzeichen, und
   * die Abstandsregel aus NORMEN.md 5.1 gilt dort nicht.
   */
  it('beanstandet den Punkt in einem Dateinamen nicht', () => {
    for (const name of [
      'Referat Island.odt',
      'Mathe Hausaufgabe 2026-09-12.pdf',
      'Katze schläft.jpg',
      'neu (3) Kopie.txt',
      'Unbenannt1.odt',
    ]) {
      expect(checkDin5008(name), name).toEqual([]);
    }
  });

  it('erkennt einen Dateinamen auch mitten im Satz', () => {
    expect(checkDin5008('Speichere das als Referat.odt ab.')).toEqual([]);
  });

  /** Die Ausnahme darf keine echten Fehler durchlassen. */
  it('beanstandet weiterhin einen fehlenden Abstand nach dem Satzende', () => {
    const f = checkDin5008('Das ist fertig.Morgen geht es weiter.');
    expect(f.map((x) => x.code)).toContain('leerzeichen-nach-satzzeichen-fehlt');
  });

  it('hält eine Abkürzung wie z. B. nicht für einen Dateinamen', () => {
    const f = checkDin5008('Nimm etwas Kleines, z.B. einen Absatz.');
    expect(f.map((x) => x.code)).toContain('leerzeichen-nach-satzzeichen-fehlt');
  });
});
