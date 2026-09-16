import { describe, it, expect } from 'vitest';
import { generateDrill, drillForLesson } from './drill';
import { allLessons, getLesson, newCharsOf } from './curriculum';
import { countStrokes } from './metrics';

describe('generateDrill — Grundverhalten', () => {
  it('liefert bei gleicher Saat denselben Text', () => {
    const opts = { chars: 'fj ', newChars: ['f', 'j'], seed: 'L01#1' };
    expect(generateDrill(opts)).toBe(generateDrill(opts));
  });

  it('liefert bei anderer Saat einen anderen Text', () => {
    const a = generateDrill({ chars: 'adfjklsö ', newChars: ['a', 'ö'], seed: 'L04#1' });
    const b = generateDrill({ chars: 'adfjklsö ', newChars: ['a', 'ö'], seed: 'L04#2' });
    expect(a).not.toBe(b);
  });

  it('hält die geforderte Länge ein', () => {
    const text = generateDrill({
      chars: 'adfjklsö ',
      newChars: ['a'],
      seed: 'x',
      minLength: 140,
      maxLength: 180,
    });
    expect(text.length).toBeGreaterThanOrEqual(140);
    expect(text.length).toBeLessThanOrEqual(180);
  });

  it('setzt nie zwei Leerzeichen hintereinander', () => {
    for (let i = 0; i < 50; i++) {
      expect(drillForLesson('L07', i)).not.toMatch(/ {2}/);
    }
  });

  it('beginnt und endet nie mit einem Leerzeichen', () => {
    for (let i = 0; i < 50; i++) {
      const t = drillForLesson('L09', i);
      expect(t).not.toMatch(/^\s/);
      expect(t).not.toMatch(/\s$/);
    }
  });

  it('wirft bei einem Vorrat ohne Buchstaben und Ziffern', () => {
    expect(() => generateDrill({ chars: ' ', newChars: [], seed: 'leer' })).toThrow();
  });

  it('wirft bei einer unbekannten Lektion', () => {
    expect(() => drillForLesson('L99', 1)).toThrow(/gibt es nicht/);
  });
});

/**
 * **Der Golden Test.** Er sichert die unverhandelbare Regel aus ARCHITEKTUR.md ab:
 * In keinem Übungstext einer Lektion darf ein Zeichen vorkommen, das erst
 * später eingeführt wird. Wer ihn löscht oder aufweicht, hebt die Regel auf.
 */
describe('Golden Test — kein ungelerntes Zeichen', () => {
  it('erzeugt für jede Lektion und 200 Saaten nur erlaubte Zeichen', () => {
    for (const lesson of allLessons()) {
      const erlaubt = new Set([...lesson.chars]);
      for (let attempt = 0; attempt < 200; attempt++) {
        const text = drillForLesson(lesson.id, attempt);
        for (const char of text) {
          expect(
            erlaubt.has(char),
            `${lesson.id}, Versuch ${attempt}: '${char}' ist dort noch nicht gelernt`,
          ).toBe(true);
        }
      }
    }
  });

  it('erzeugt Texte, deren Anschläge sich zählen lassen', () => {
    for (const lesson of allLessons()) {
      const text = drillForLesson(lesson.id, 7);
      expect(() => countStrokes(text)).not.toThrow();
      expect(countStrokes(text)).toBeGreaterThan(0);
    }
  });

  it('hält die Regel auch mit Problemzeichen ein, die es gar nicht gibt', () => {
    // Der Scheduler koennte ein Zeichen vorschlagen, das in dieser Lektion
    // noch nicht gelernt ist. Der Drill darf es trotzdem nicht einbauen.
    const text = drillForLesson('L01', 3, ['z', 'ü', 'Q']);
    for (const char of text) {
      expect([...getLesson('L01')!.chars]).toContain(char);
    }
  });
});

/**
 * Ein Drill ist sinnfrei, aber er prägt Bewegungsfolgen ein. Folgen, die es im
 * Deutschen nicht gibt, haben darin nichts zu suchen — sie kosten Übungszeit
 * und vermitteln nebenbei eine falsche Vorstellung von der Rechtschreibung.
 */
describe('Keine im Deutschen unmöglichen Buchstabenfolgen', () => {
  const alleGruppen = (lessonId: string, versuche = 60): string[] => {
    const out: string[] = [];
    for (let i = 0; i < versuche; i++) {
      out.push(
        ...drillForLesson(lessonId, i)
          .split(' ')
          .filter((g) => g.length > 0),
      );
    }
    return out;
  };

  it('setzt nie ein ß an den Wortanfang', () => {
    for (const id of ['L19', 'L20', 'L22', 'L23', 'L25']) {
      for (const gruppe of alleGruppen(id)) {
        for (const teil of gruppe.split('-')) {
          expect(teil.startsWith('ß'), `${id}: '${gruppe}' beginnt mit ß`).toBe(false);
        }
      }
    }
  });

  it('lässt kein q ohne folgendes u stehen', () => {
    for (const id of ['L11', 'L13', 'L16', 'L20', 'L23']) {
      for (const gruppe of alleGruppen(id)) {
        expect(gruppe, `${id}: q ohne u in '${gruppe}'`).not.toMatch(/q(?!u)/i);
      }
    }
  });

  it('setzt qu nie ans Wortende und nie vor ein weiteres u', () => {
    for (const id of ['L11', 'L13', 'L16', 'L20', 'L23', 'L25']) {
      for (const gruppe of alleGruppen(id)) {
        for (const teil of gruppe.split('-')) {
          const wort = teil.replace(/[,.!?;:@/()"]+$/, '');
          expect(wort, `${id}: qu am Ende von '${gruppe}'`).not.toMatch(/qu$/i);
        }
        expect(gruppe, `${id}: quu in '${gruppe}'`).not.toMatch(/quu/i);
      }
    }
  });

  it('hängt den Bindestrich nie ans Wortende, sondern verbindet damit', () => {
    for (const id of ['L19', 'L20', 'L22', 'L23']) {
      for (const gruppe of alleGruppen(id)) {
        expect(gruppe.endsWith('-'), `${id}: '${gruppe}' endet auf Bindestrich`).toBe(false);
        expect(gruppe.startsWith('-'), `${id}: '${gruppe}' beginnt mit Bindestrich`).toBe(false);
      }
    }
  });

  it('setzt nie ein Satzzeichen unmittelbar vor einen Bindestrich', () => {
    for (const id of ['L19', 'L20', 'L22', 'L23', 'L25']) {
      for (const gruppe of alleGruppen(id)) {
        expect(gruppe, `${id}: '${gruppe}'`).not.toMatch(/[,.!?;:@/()"]-/);
      }
    }
  });

  it('baut keine Zahl mit führender Null', () => {
    for (const id of ['L22', 'L23', 'L24']) {
      for (const gruppe of alleGruppen(id)) {
        if (/^[0-9]/.test(gruppe)) {
          expect(gruppe.startsWith('0'), `${id}: '${gruppe}' hat eine fuehrende Null`).toBe(false);
        }
      }
    }
  });
});

describe('Didaktische Zusagen aus SPEC.md 9.7', () => {
  it('baut in L01 bis L03 rhythmische Gruppen, weil es dort keinen Vokal gibt', () => {
    for (const id of ['L01', 'L02', 'L03']) {
      const text = drillForLesson(id, 1);
      // Nur die erlaubten Konsonanten und Leerzeichen.
      expect(text).toMatch(/^[a-zäöüß ]+$/);
      // Und tatsaechlich Gruppen, keine Bandwurmzeile.
      expect(text.split(' ').length).toBeGreaterThan(5);
    }
  });

  it('bildet ab L04 aussprechbare Silben, sobald ein Vokal da ist', () => {
    const text = drillForLesson('L04', 1);
    // Jede Gruppe enthaelt mindestens einen Vokal.
    const gruppen = text.split(' ').filter((g) => g.length > 0);
    const mitVokal = gruppen.filter((g) => /[aeiouäöü]/.test(g));
    expect(mitVokal.length / gruppen.length).toBeGreaterThan(0.9);
  });

  it('hebt die neuen Zeichen einer Lektion deutlich hervor', () => {
    // SPEC.md 9.7 nennt rund 40 %. Geprueft wird die Groessenordnung, nicht
    // der exakte Wert - der ist ausdruecklich geschaetzt (SPEC.md 15.12).
    const lesson = getLesson('L09')!; // neu: t und z
    const neu = new Set(newCharsOf('L09'));
    let neuAnteil = 0;
    let gesamt = 0;
    for (let i = 0; i < 30; i++) {
      for (const c of drillForLesson(lesson.id, i)) {
        if (c === ' ') continue;
        gesamt++;
        if (neu.has(c)) neuAnteil++;
      }
    }
    const anteil = neuAnteil / gesamt;
    expect(anteil).toBeGreaterThan(0.2);
    expect(anteil).toBeLessThan(0.6);
  });

  it('übt in L20 tatsächlich Großbuchstaben, obwohl newChars dort nur „Umschalt" nennt', () => {
    // Genau der Fall, fuer den newCharsOf() die Differenz rechnet statt das
    // Feld zu lesen.
    let grossGesehen = 0;
    for (let i = 0; i < 20; i++) {
      grossGesehen += [...drillForLesson('L20', i)].filter((c) => /[A-ZÄÖÜ]/.test(c)).length;
    }
    expect(grossGesehen).toBeGreaterThan(0);
  });

  it('übt in L22 tatsächlich Ziffern', () => {
    let ziffern = 0;
    for (let i = 0; i < 20; i++) {
      ziffern += [...drillForLesson('L22', i)].filter((c) => /[0-9]/.test(c)).length;
    }
    expect(ziffern).toBeGreaterThan(0);
  });

  it('berücksichtigt Problemzeichen aus der adaptiven Wiederholung', () => {
    const ohne = [...drillForLesson('L13', 5)].filter((c) => c === 'ü').length;
    const mit = [...drillForLesson('L13', 5, ['ü'])].filter((c) => c === 'ü').length;
    expect(mit).toBeGreaterThan(ohne);
  });
});
