import { describe, it, expect } from 'vitest';
import {
  createSession,
  weakestChars,
  DEAD_TIME_THRESHOLD_MS,
  MIN_SAMPLES_FOR_WEAKNESS,
  type CharStat,
  type KeyInput,
} from './typing-engine';
import { countErrors, errorRate, firstTryRate } from './metrics';

/** Tippt eine Folge von Zeichen im Abstand von je 100 ms. */
function type(
  session: ReturnType<typeof createSession>,
  keys: string,
  startAt = 1000,
  step = 100,
): void {
  let t = startAt;
  for (const key of keys) {
    session.handleKey({ key, at: t });
    t += step;
  }
}

describe('Blockierender Modus — SPEC.md 7.1', () => {
  it('rückt bei einem Fehler nicht weiter', () => {
    const s = createSession({ text: 'fj', mode: 'blockierend' });
    s.handleKey({ key: 'd', at: 1000 });
    const snap = s.snapshot();
    expect(snap.cursor).toBe(0);
    expect(snap.states[0]).toBe('wrong');
    expect(snap.resultText).toBe('');
  });

  it('meldet das erwartete und das getippte Zeichen zurück', () => {
    const s = createSession({ text: 'fj', mode: 'blockierend' });
    const out = s.handleKey({ key: 'd', at: 1000 });
    expect(out).toEqual({ kind: 'wrong', expected: 'f', typed: 'd' });
  });

  it('lässt nach dem Fehlgriff das richtige Zeichen zu', () => {
    const s = createSession({ text: 'fj', mode: 'blockierend' });
    s.handleKey({ key: 'd', at: 1000 });
    s.handleKey({ key: 'f', at: 1100 });
    const snap = s.snapshot();
    expect(snap.cursor).toBe(1);
    expect(snap.resultText).toBe('f');
    // Nicht 'correct': Hier wurde danebengegriffen.
    expect(snap.states[0]).toBe('corrected');
  });

  /**
   * Der Kern der Entscheidung vom 2026-09-12 (NORMEN.md 4.4.1): Im
   * blockierenden Modus ist der Ergebnistext bauartbedingt fehlerfrei. Genau
   * deshalb kann die amtliche Fehlerquote dort nichts bewerten.
   */
  it('erzeugt immer einen fehlerfreien Ergebnistext, egal wie oft danebengegriffen wird', () => {
    const s = createSession({ text: 'fjf jfj', mode: 'blockierend' });
    let t = 1000;
    for (const expected of 'fjf jfj') {
      // Erst dreimal daneben, dann richtig.
      for (const falsch of ['x', 'y', 'z']) {
        if (falsch !== expected) s.handleKey({ key: falsch, at: (t += 50) });
      }
      s.handleKey({ key: expected, at: (t += 50) });
    }
    const snap = s.snapshot();
    expect(snap.finished).toBe(true);
    expect(snap.resultText).toBe('fjf jfj');
    expect(countErrors('fjf jfj', snap.resultText)).toBe(0);
    expect(errorRate(0, 7)).toBe(0);
    // Die Sicherheit sieht das sehr wohl.
    expect(snap.firstTryHits).toBe(0);
  });
});

describe('Fließender Modus — SPEC.md 7.1', () => {
  it('läuft bei einem Fehler weiter und schreibt das falsche Zeichen', () => {
    const s = createSession({ text: 'hallo', mode: 'fliessend' });
    s.handleKey({ key: 'h', at: 1000 });
    s.handleKey({ key: 'x', at: 1100 });
    const snap = s.snapshot();
    expect(snap.cursor).toBe(2);
    expect(snap.resultText).toBe('hx');
    expect(snap.states[1]).toBe('wrong');
  });

  it('lässt den Fehler per Rücktaste korrigieren', () => {
    const s = createSession({ text: 'hallo', mode: 'fliessend' });
    type(s, 'hx');
    s.handleKey({ key: 'Backspace', at: 1200 });
    s.handleKey({ key: 'a', at: 1300 });
    const snap = s.snapshot();
    expect(snap.resultText).toBe('ha');
    expect(snap.states[1]).toBe('corrected');
  });

  /**
   * NORMEN.md 4.2: Wer den Fehler bemerkt und verbessert, hat am Ende einen
   * richtigen Text. Korrigierte Fehler zählen nicht.
   */
  it('zählt einen korrigierten Fehler nicht in die amtliche Fehlerquote', () => {
    const s = createSession({ text: 'hallo', mode: 'fliessend' });
    type(s, 'hx');
    s.handleKey({ key: 'Backspace', at: 1200 });
    type(s, 'allo', 1300);
    const snap = s.snapshot();
    expect(snap.resultText).toBe('hallo');
    expect(countErrors('hallo', snap.resultText)).toBe(0);
    // Aber die Sicherheit merkt es sich.
    expect(snap.firstTryHits).toBe(4);
    expect(firstTryRate(4, 5)).toBe(80);
  });

  it('lässt einen unkorrigierten Fehler im Ergebnistext stehen', () => {
    const s = createSession({ text: 'hallo', mode: 'fliessend' });
    type(s, 'hxllo');
    const snap = s.snapshot();
    expect(snap.resultText).toBe('hxllo');
    expect(countErrors('hallo', snap.resultText)).toBe(1);
  });
});

describe('Zeitmessung und tote Zeit — SPEC.md 7.1, NORMEN.md 4.5', () => {
  it('summiert die Abstände zwischen den Anschlägen', () => {
    const s = createSession({ text: 'abc', mode: 'fliessend' });
    s.handleKey({ key: 'a', at: 1000 });
    s.handleKey({ key: 'b', at: 1200 });
    s.handleKey({ key: 'c', at: 1500 });
    expect(s.snapshot().activeMs).toBe(500);
  });

  it('rechnet eine Pause über drei Sekunden vollständig heraus', () => {
    const s = createSession({ text: 'abc', mode: 'fliessend' });
    s.handleKey({ key: 'a', at: 0 });
    s.handleKey({ key: 'b', at: 200 });
    // 30 Sekunden abgelenkt.
    s.handleKey({ key: 'c', at: 30200 });
    expect(s.snapshot().activeMs).toBe(200);
  });

  it('lässt eine Pause knapp unter der Schwelle mitzählen', () => {
    const s = createSession({ text: 'ab', mode: 'fliessend' });
    s.handleKey({ key: 'a', at: 0 });
    s.handleKey({ key: 'b', at: DEAD_TIME_THRESHOLD_MS - 1 });
    expect(s.snapshot().activeMs).toBe(DEAD_TIME_THRESHOLD_MS - 1);
  });

  it('lässt die Uhr im Abschlusstest durchlaufen', () => {
    const s = createSession({ text: 'abc', mode: 'fliessend', clockRunsThrough: true });
    s.handleKey({ key: 'a', at: 0 });
    s.handleKey({ key: 'b', at: 200 });
    s.handleKey({ key: 'c', at: 30200 });
    expect(s.snapshot().activeMs).toBe(30200);
  });

  it('hält die Zeit während einer Pause an', () => {
    const s = createSession({ text: 'abcd', mode: 'fliessend' });
    s.handleKey({ key: 'a', at: 0 });
    s.handleKey({ key: 'b', at: 100 });
    s.pause(200);
    // Waehrend der Pause kommt nichts an.
    expect(s.handleKey({ key: 'c', at: 5000 })).toEqual({ kind: 'ignored', reason: 'paused' });
    s.resume(60000);
    s.handleKey({ key: 'c', at: 60100 });
    expect(s.snapshot().activeMs).toBe(200);
  });

  it('pausiert auf Escape', () => {
    const s = createSession({ text: 'ab', mode: 'fliessend' });
    s.handleKey({ key: 'Escape', at: 100 });
    expect(s.snapshot().paused).toBe(true);
  });
});

describe('Sondertasten — SPEC.md 7.1 und 7.4', () => {
  it('ignoriert Enter, wenn die Vorlage keine Zeilenumbrüche hat', () => {
    const s = createSession({ text: 'ab', mode: 'fliessend' });
    expect(s.handleKey({ key: 'Enter', at: 100 })).toEqual({
      kind: 'ignored',
      reason: 'noNewline',
    });
    expect(s.snapshot().cursor).toBe(0);
  });

  it('nimmt Enter als Zeilenschaltung, wenn die Vorlage eine hat', () => {
    const s = createSession({ text: 'a\nb', mode: 'fliessend' });
    s.handleKey({ key: 'a', at: 100 });
    s.handleKey({ key: 'Enter', at: 200 });
    expect(s.snapshot().resultText).toBe('a\n');
  });

  it('ignoriert Steuertasten ohne Zeichen', () => {
    const s = createSession({ text: 'ab', mode: 'fliessend' });
    for (const key of ['Shift', 'Control', 'Alt', 'ArrowLeft', 'F1']) {
      expect(s.handleKey({ key, at: 100 }).kind).toBe('ignored');
    }
    expect(s.snapshot().cursor).toBe(0);
  });

  it('nimmt nach dem Ende nichts mehr an', () => {
    const s = createSession({ text: 'a', mode: 'fliessend' });
    expect(s.handleKey({ key: 'a', at: 100 }).kind).toBe('finished');
    expect(s.handleKey({ key: 'b', at: 200 })).toEqual({ kind: 'ignored', reason: 'finished' });
  });
});

describe('Fehlerprofil und Verwechslungen — SPEC.md 5 und 6.4', () => {
  it('merkt sich Treffer und Fehlgriffe je Zeichen', () => {
    const s = createSession({ text: 'aaa', mode: 'blockierend' });
    s.handleKey({ key: 'x', at: 100 });
    s.handleKey({ key: 'a', at: 200 });
    s.handleKey({ key: 'a', at: 300 });
    s.handleKey({ key: 'a', at: 400 });
    const stat = s.snapshot().charStats.get('a')!;
    expect(stat.misses).toBe(1);
    expect(stat.hits).toBe(2);
  });

  it('hält fest, womit verwechselt wurde', () => {
    const s = createSession({ text: 'z', mode: 'blockierend' });
    s.handleKey({ key: 'y', at: 100 });
    expect(s.snapshot().confusions).toEqual([{ expected: 'z', typed: 'y', count: 1 }]);
  });

  it('zählt dieselbe Verwechslung zusammen', () => {
    const s = createSession({ text: 'zzz', mode: 'blockierend' });
    s.handleKey({ key: 'y', at: 100 });
    s.handleKey({ key: 'z', at: 200 });
    s.handleKey({ key: 'y', at: 300 });
    s.handleKey({ key: 'z', at: 400 });
    expect(s.snapshot().confusions).toEqual([{ expected: 'z', typed: 'y', count: 2 }]);
  });

  /**
   * Der Grund, warum Verwechslungen als Struktur gespeichert werden und nicht
   * als zusammengesetzter Zeichenschlüssel: Jedes Trennzeichen kann selbst als
   * erwartetes oder getipptes Zeichen vorkommen.
   */
  it('kommt mit Satz- und Leerzeichen als verwechselten Zeichen zurecht', () => {
    const s = createSession({ text: ', ', mode: 'fliessend' });
    s.handleKey({ key: ' ', at: 100 });
    s.handleKey({ key: ',', at: 200 });
    expect(s.snapshot().confusions).toEqual([
      { expected: ',', typed: ' ', count: 1 },
      { expected: ' ', typed: ',', count: 1 },
    ]);
  });
});

describe('weakestChars — die drei schwächsten Zeichen, SPEC.md 6.4', () => {
  const stat = (hits: number, misses: number, avgMs: number): CharStat => ({
    hits,
    misses,
    totalLatencyMs: avgMs * Math.max(1, hits),
    samples: Math.max(1, hits),
  });

  it('nennt höchstens drei Zeichen', () => {
    const stats = new Map<string, CharStat>([
      ['a', stat(10, 10, 500)],
      ['b', stat(10, 9, 500)],
      ['c', stat(10, 8, 500)],
      ['d', stat(10, 7, 500)],
    ]);
    expect(weakestChars(stats)).toHaveLength(3);
  });

  it('setzt das Zeichen mit der höchsten Fehlerquote nach vorn', () => {
    const stats = new Map<string, CharStat>([
      ['a', stat(20, 2, 300)],
      ['z', stat(12, 12, 300)],
    ]);
    expect(weakestChars(stats)[0]).toBe('z');
  });

  it('zieht auch reine Zögerer in Betracht', () => {
    const stats = new Map<string, CharStat>([
      ['a', stat(20, 0, 100)],
      ['ü', stat(20, 0, 2000)],
    ]);
    expect(weakestChars(stats)[0]).toBe('ü');
  });

  /**
   * Die Regel aus SPEC.md 8.9: Eine Schwäche, die auf zwei Versuchen beruht,
   * ist erfunden. Unter zwölf Anschlägen sagt die App über ein Zeichen nichts.
   */
  it('benennt kein Zeichen unterhalb von zwölf Anschlägen', () => {
    const knappDarunter = new Map<string, CharStat>([
      ['q', stat(0, MIN_SAMPLES_FOR_WEAKNESS - 1, 900)],
    ]);
    expect(weakestChars(knappDarunter)).toEqual([]);

    const genauGenug = new Map<string, CharStat>([['q', stat(0, MIN_SAMPLES_FOR_WEAKNESS, 900)]]);
    expect(weakestChars(genauGenug)).toEqual(['q']);
  });
});

describe('Zusammenspiel mit den Metriken', () => {
  it('liefert die Zahlen, aus denen die Auswertung entsteht', () => {
    const vorlage = 'das all';
    const s = createSession({ text: vorlage, mode: 'fliessend' });
    const keys: KeyInput[] = [...vorlage].map((key, i) => ({ key, at: 1000 + i * 200 }));
    for (const k of keys) s.handleKey(k);

    const snap = s.snapshot();
    expect(snap.finished).toBe(true);
    expect(snap.resultText).toBe(vorlage);
    expect(countErrors(vorlage, snap.resultText)).toBe(0);
    expect(snap.firstTryHits).toBe(7);
    expect(firstTryRate(snap.firstTryHits, vorlage.length)).toBe(100);
    expect(snap.activeMs).toBe(1200);
  });
});
