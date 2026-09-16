import { describe, it, expect } from 'vitest';
import {
  allLessons,
  getLesson,
  nextLesson,
  thresholdsFor,
  starsFor,
  isPassed,
  passesFinalTest,
  readingLevel,
} from './curriculum';
import { isTypable } from './charset';

describe('Lektionsdaten — SPEC.md 6.2', () => {
  it('kennt genau 25 Lektionen', () => {
    expect(allLessons()).toHaveLength(25);
  });

  it('nummeriert sie lückenlos von 1 bis 25', () => {
    const orders = allLessons().map((l) => l.order);
    expect(orders).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  it('vergibt jede Lektions-ID nur einmal', () => {
    const ids = allLessons().map((l) => l.id);
    expect(new Set(ids).size).toBe(25);
  });

  it('verkettet die Lektionen richtig', () => {
    expect(nextLesson('L01')?.id).toBe('L02');
    expect(nextLesson('L24')?.id).toBe('L25');
    expect(nextLesson('L25')).toBeUndefined();
  });

  /**
   * Die harte Regel aus SPEC.md 6.2: Der Zeichenvorrat wächst, er schrumpft
   * nie. Ein Zeichen, das einmal gelernt ist, bleibt erlaubt.
   */
  it('lässt den Zeichenvorrat von Lektion zu Lektion nur wachsen', () => {
    const lessons = [...allLessons()].sort((a, b) => a.order - b.order);
    for (let i = 1; i < lessons.length; i++) {
      const vorher = new Set([...lessons[i - 1]!.chars]);
      const jetzt = new Set([...lessons[i]!.chars]);
      const verloren = [...vorher].filter((c) => !jetzt.has(c));
      expect(verloren, `${lessons[i]!.id} verliert ${JSON.stringify(verloren)}`).toEqual([]);
    }
  });

  it('führt die angekündigten neuen Zeichen tatsächlich ein', () => {
    const lessons = [...allLessons()].sort((a, b) => a.order - b.order);
    for (let i = 1; i < lessons.length; i++) {
      const lesson = lessons[i]!;
      const vorher = new Set([...lessons[i - 1]!.chars]);
      for (const neu of lesson.newChars) {
        // Umschalt steht als Wort in newChars, nicht als Zeichen.
        if (neu.length !== 1) continue;
        expect(vorher.has(neu), `${lesson.id}: '${neu}' war schon vorher da`).toBe(false);
        expect([...lesson.chars]).toContain(neu);
      }
    }
  });

  /**
   * Golden Test zur Anschlagzählung: Jedes Zeichen jeder Lektion muss auf T1
   * erzeugbar sein, sonst kann `countStrokes()` es nicht zählen
   * (NORMEN.md 4.1).
   */
  it('enthält nur Zeichen, die T1 überhaupt erzeugt', () => {
    for (const lesson of allLessons()) {
      for (const char of lesson.chars) {
        expect(isTypable(char), `${lesson.id}: '${char}' ist auf T1 nicht erzeugbar`).toBe(true);
      }
    }
  });

  it('beginnt mit f, j und Leertaste', () => {
    expect(new Set([...getLesson('L01')!.chars])).toEqual(new Set(['f', 'j', ' ']));
  });

  it('schaltet erst ab L20 auf Großbuchstaben um', () => {
    expect(getLesson('L19')!.chars).not.toMatch(/[A-ZÄÖÜ]/);
    expect(getLesson('L20')!.chars).toMatch(/[A-ZÄÖÜ]/);
  });

  it('führt Ziffern erst in L22 ein', () => {
    expect(getLesson('L21')!.chars).not.toMatch(/[0-9]/);
    expect(getLesson('L22')!.chars).toMatch(/[0-9]/);
  });
});

describe('Bewertungsschwellen — NORMEN.md 4.4.1 und 4.8', () => {
  it('bewertet L01 bis L13 nach Sicherheit, weil die Fehlerquote dort immer 0 wäre', () => {
    for (const id of ['L01', 'L05', 'L06', 'L13']) {
      expect(thresholdsFor(id)!.kind, id).toBe('safety');
    }
  });

  it('bewertet ab L14 nach amtlicher Fehlerquote', () => {
    for (const id of ['L14', 'L19', 'L20', 'L24']) {
      expect(thresholdsFor(id)!.kind, id).toBe('errorRate');
    }
  });

  it('deckt sich mit dem Modus der Lektion', () => {
    for (const lesson of allLessons()) {
      const erwartet = lesson.mode === 'blockierend' ? 'safety' : 'errorRate';
      expect(thresholdsFor(lesson.id)!.kind, lesson.id).toBe(erwartet);
    }
  });

  it('hält die Werte aus NORMEN.md 4.8 ein', () => {
    expect(thresholdsFor('L01')).toMatchObject({
      oneStar: 90,
      twoStars: 95,
      threeStars: 98,
      targetStrokesMin: 60,
    });
    expect(thresholdsFor('L06')).toMatchObject({
      oneStar: 93,
      twoStars: 96,
      threeStars: 98.5,
      targetStrokesMin: 80,
    });
    expect(thresholdsFor('L14')).toMatchObject({
      oneStar: 1.5,
      twoStars: 0.75,
      threeStars: 0.375,
      targetStrokesMin: 100,
    });
    expect(thresholdsFor('L20')).toMatchObject({
      oneStar: 1.0,
      twoStars: 0.5,
      threeStars: 0.25,
      targetStrokesMin: 120,
    });
    expect(thresholdsFor('L24')).toMatchObject({
      oneStar: 0.5,
      twoStars: 0.25,
      threeStars: 0.125,
      targetStrokesMin: 140,
    });
  });

  it('staffelt zwei und drei Sterne als Hälfte und Viertel der Zielquote', () => {
    for (const id of ['L14', 'L20', 'L24']) {
      const t = thresholdsFor(id)!;
      expect(t.twoStars).toBeCloseTo(t.oneStar / 2, 10);
      expect(t.threeStars).toBeCloseTo(t.oneStar / 4, 10);
    }
  });
});

describe('Sternvergabe', () => {
  it('gibt in L01 keinen Stern unter 90 Prozent Sicherheit', () => {
    expect(starsFor('L01', { errorRate: 0, safety: 89.9, strokesMin: 200 })).toBe(0);
    expect(isPassed('L01', { errorRate: 0, safety: 89.9, strokesMin: 200 })).toBe(false);
  });

  it('gibt in L01 einen Stern ab 90 Prozent Sicherheit', () => {
    expect(starsFor('L01', { errorRate: 0, safety: 90, strokesMin: 10 })).toBe(1);
    expect(isPassed('L01', { errorRate: 0, safety: 90, strokesMin: 10 })).toBe(true);
  });

  it('gibt zwei Sterne ab 95 Prozent, drei erst mit dem Tempo', () => {
    expect(starsFor('L01', { errorRate: 0, safety: 96, strokesMin: 10 })).toBe(2);
    expect(starsFor('L01', { errorRate: 0, safety: 98, strokesMin: 59 })).toBe(2);
    expect(starsFor('L01', { errorRate: 0, safety: 98, strokesMin: 60 })).toBe(3);
  });

  /**
   * Der Kern der Entscheidung vom 2026-09-12: Im blockierenden Modus ist die
   * Fehlerquote immer 0. Würde sie bewerten, bekäme jeder sofort drei Sterne.
   */
  it('lässt sich in L01 nicht von einer Fehlerquote von 0 täuschen', () => {
    const perfekterErgebnistext = { errorRate: 0, safety: 70, strokesMin: 200 };
    expect(starsFor('L01', perfekterErgebnistext)).toBe(0);
  });

  it('bewertet ab L14 die Fehlerquote und ignoriert die Sicherheit', () => {
    expect(starsFor('L14', { errorRate: 1.6, safety: 100, strokesMin: 200 })).toBe(0);
    expect(starsFor('L14', { errorRate: 1.5, safety: 0, strokesMin: 10 })).toBe(1);
    expect(starsFor('L14', { errorRate: 0.3, safety: 0, strokesMin: 100 })).toBe(3);
  });
});

describe('Abschlusstest — NORMEN.md 4.7', () => {
  it('verlangt mindestens 600 Anschläge bei höchstens 0,5 Prozent', () => {
    expect(passesFinalTest(600, 0.5)).toBe(true);
    expect(passesFinalTest(599, 0.5)).toBe(false);
    expect(passesFinalTest(600, 0.51)).toBe(false);
    expect(passesFinalTest(1200, 0.2)).toBe(true);
  });
});

describe('Lesestufe — SPEC.md 9.8', () => {
  it('entspricht bei A2 der Lektionsnummer', () => {
    expect(readingLevel('L10', 'A2')).toBe(10);
  });

  it('liegt für jüngere Kinder niedriger, für ältere höher', () => {
    expect(readingLevel('L10', 'A1')).toBe(7);
    expect(readingLevel('L10', 'A3')).toBe(13);
  });

  it('bleibt im Bereich 1 bis 25', () => {
    expect(readingLevel('L01', 'A1')).toBe(1);
    expect(readingLevel('L25', 'A3')).toBe(25);
  });
});
