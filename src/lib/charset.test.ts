import { describe, it, expect } from 'vitest';
import {
  T1_KEYS,
  strokeFor,
  isTypable,
  fingerFor,
  oppositeShiftFor,
  allTypableChars,
  type Finger,
} from './charset';
import { allLessons } from './curriculum';

describe('Belegung T1 — DIN 2137-1:2023-08', () => {
  it('erzeugt jedes Zeichen nur über eine einzige Taste', () => {
    // Wird schon beim Laden geprueft und wuerde sonst werfen; hier steht es
    // ausdruecklich, weil sonst die Anschlagzahl nicht eindeutig waere.
    const alle = allTypableChars();
    expect(new Set(alle).size).toBe(alle.length);
  });

  it('belegt die Grundstellung mit a s d f j k l ö', () => {
    const grundreihe = T1_KEYS.filter((k) => k.row === 'home' && k.base.length === 1);
    const zeichen = grundreihe.map((k) => k.base);
    for (const c of 'asdfjklö') {
      expect(zeichen, `${c} fehlt in der Grundreihe`).toContain(c);
    }
  });

  /**
   * Der Unterschied zwischen `event.code` und `event.key` (SPEC.md 7.4): Auf
   * der deutschen Tastatur sind y und z gegenüber dem US-Layout vertauscht.
   * Wer das verwechselt, baut ein US-Layout mit deutschen Beschriftungen —
   * genau das ist in ARCHITEKTUR.md ausgeschlossen.
   */
  it('legt z auf die physische Y-Taste und y auf die physische Z-Taste', () => {
    expect(strokeFor('z')?.key.code).toBe('KeyY');
    expect(strokeFor('y')?.key.code).toBe('KeyZ');
  });

  it('erzeugt das at-Zeichen über AltGr auf q', () => {
    const s = strokeFor('@');
    expect(s?.key.code).toBe('KeyQ');
    expect(s?.modifier).toBe('altgr');
  });

  it('kennt die Umlaute und das scharfe s ohne Zusatztaste', () => {
    for (const c of 'äöüß') {
      expect(strokeFor(c)?.modifier, c).toBe('none');
    }
  });

  it('erzeugt kein Zeichen, das T1 nicht hat', () => {
    expect(isTypable('漢')).toBe(false);
    expect(isTypable('€')).toBe(true);
  });
});

describe('Fingersatz — SPEC.md 6.1', () => {
  /**
   * **Die Grundlage der Handgrafik.** Sie kann nur zeigen, welcher Finger dran
   * ist, wenn jedes Zeichen einem zugeordnet ist. Ein Zeichen ohne Finger
   * würde stumm durchrutschen und die Hand bliebe grau.
   */
  it('ordnet jedem Zeichen jeder Lektion einen Finger zu', () => {
    for (const lesson of allLessons()) {
      for (const char of lesson.chars) {
        expect(fingerFor(char), `${lesson.id}: '${char}' hat keinen Finger`).toBeDefined();
      }
    }
  });

  it('hält sich an die Zuordnung aus SPEC.md 6.1', () => {
    const erwartet: Record<string, Finger> = {
      a: 'leftPinky',
      q: 'leftPinky',
      y: 'leftPinky',
      s: 'leftRing',
      w: 'leftRing',
      x: 'leftRing',
      d: 'leftMiddle',
      e: 'leftMiddle',
      c: 'leftMiddle',
      f: 'leftIndex',
      r: 'leftIndex',
      v: 'leftIndex',
      g: 'leftIndex',
      t: 'leftIndex',
      b: 'leftIndex',
      ' ': 'thumb',
      j: 'rightIndex',
      u: 'rightIndex',
      m: 'rightIndex',
      h: 'rightIndex',
      z: 'rightIndex',
      n: 'rightIndex',
      k: 'rightMiddle',
      i: 'rightMiddle',
      ',': 'rightMiddle',
      l: 'rightRing',
      o: 'rightRing',
      '.': 'rightRing',
      ö: 'rightPinky',
      ä: 'rightPinky',
      ü: 'rightPinky',
      p: 'rightPinky',
      ß: 'rightPinky',
      '-': 'rightPinky',
    };

    for (const [char, finger] of Object.entries(erwartet)) {
      expect(fingerFor(char), `'${char}'`).toBe(finger);
    }
  });

  it('verteilt die Grundstellung auf acht Finger und den Daumen', () => {
    const finger = new Set([...'asdfjklö'].map((c) => fingerFor(c)));
    expect(finger.size).toBe(8);
    expect(fingerFor(' ')).toBe('thumb');
  });
});

describe('Gegengleiche Umschalttaste — DIDAKTIK.md 2.3', () => {
  it('nimmt für einen links getippten Großbuchstaben die rechte Umschalttaste', () => {
    expect(oppositeShiftFor('A')).toBe('ShiftRight');
    expect(oppositeShiftFor('F')).toBe('ShiftRight');
    expect(oppositeShiftFor('X')).toBe('ShiftRight');
  });

  it('nimmt für einen rechts getippten Großbuchstaben die linke Umschalttaste', () => {
    expect(oppositeShiftFor('J')).toBe('ShiftLeft');
    expect(oppositeShiftFor('Ö')).toBe('ShiftLeft');
    expect(oppositeShiftFor('P')).toBe('ShiftLeft');
  });

  it('gilt auch für Satzzeichen mit Umschalt', () => {
    expect(oppositeShiftFor('!')).toBe('ShiftRight'); // Shift + 1, links
    expect(oppositeShiftFor(':')).toBe('ShiftLeft'); // Shift + Punkt, rechts
  });

  it('meldet nichts für Zeichen ohne Umschalt', () => {
    expect(oppositeShiftFor('a')).toBeUndefined();
    expect(oppositeShiftFor('1')).toBeUndefined();
    expect(oppositeShiftFor('@')).toBeUndefined(); // AltGr, nicht Umschalt
  });

  /**
   * Der Gegenbeweis zur häufigsten Fehlgewohnheit: Für kein Zeichen darf die
   * Umschalttaste auf derselben Seite liegen wie der Buchstabe.
   */
  it('legt die Umschalttaste nie auf dieselbe Hand wie das Zeichen', () => {
    const linkeFinger: readonly Finger[] = ['leftPinky', 'leftRing', 'leftMiddle', 'leftIndex'];
    for (const char of allTypableChars()) {
      const shift = oppositeShiftFor(char);
      if (!shift) continue;
      const finger = fingerFor(char)!;
      const zeichenLinks = linkeFinger.includes(finger);
      expect(shift, `'${char}'`).toBe(zeichenLinks ? 'ShiftRight' : 'ShiftLeft');
    }
  });
});
