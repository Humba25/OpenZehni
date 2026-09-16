import { describe, it, expect } from 'vitest';
import {
  LAYOUT_PROBES,
  evaluateProbe,
  evaluateLayout,
  vermuteLayout,
  istHilfstaste,
  type Keystroke,
} from './layout-check';
import { strokeFor } from './charset';

/** Ein fehlerfreier Durchgang auf T1. */
const T1: Keystroke[] = [
  { key: 'z', code: 'KeyY' },
  { key: 'ö', code: 'Semicolon' },
  { key: 'ß', code: 'Minus' },
  { key: '@', code: 'KeyQ' },
];

/** Was auf einem amerikanischen Layout herauskäme, wenn man dieselben
 *  physischen Tasten drückt. */
const US: Keystroke[] = [
  { key: 'y', code: 'KeyY' },
  { key: ';', code: 'Semicolon' },
  { key: '-', code: 'Minus' },
  { key: 'q', code: 'KeyQ' },
];

describe('Die vier Proben — NORMEN.md 3.1', () => {
  it('prüft genau z, ö, ß und at', () => {
    expect(LAYOUT_PROBES.map((p) => p.char)).toEqual(['z', 'ö', 'ß', '@']);
  });

  /**
   * Die Proben müssen zu der Belegung passen, die `charset.ts` beschreibt —
   * sonst prüft der Onboarding-Test etwas anderes als die App später erwartet.
   */
  it('deckt sich mit der Belegung aus charset.ts', () => {
    for (const probe of LAYOUT_PROBES) {
      const stroke = strokeFor(probe.char);
      expect(stroke, probe.char).toBeDefined();
      expect(stroke!.key.code, probe.char).toBe(probe.code);
      if (probe.altgr) expect(stroke!.modifier, probe.char).toBe('altgr');
    }
  });
});

describe('Einzelne Probe bewerten', () => {
  it('nimmt Zeichen und Taste zusammen an', () => {
    expect(evaluateProbe(LAYOUT_PROBES[0]!, { key: 'z', code: 'KeyY' })).toEqual({ kind: 'ok' });
  });

  it('meldet ein falsches Zeichen auf der richtigen Taste', () => {
    const r = evaluateProbe(LAYOUT_PROBES[0]!, { key: 'y', code: 'KeyY' });
    expect(r).toEqual({ kind: 'falsches-zeichen', erwartet: 'z', bekommen: 'y' });
  });

  /**
   * Der Fall, den eine reine Zeichenprüfung übersehen würde: Auf einer
   * amerikanischen Tastatur mit amerikanischem Layout liefert die Taste mit
   * der Aufschrift `z` tatsächlich ein `z` — nur sitzt sie woanders, und `ö`,
   * `ß`, `@` liegen dann ganz anders.
   */
  it('meldet ein richtiges Zeichen von der falschen Taste', () => {
    const r = evaluateProbe(LAYOUT_PROBES[0]!, { key: 'z', code: 'KeyZ' });
    expect(r).toEqual({ kind: 'falsche-taste', erwartet: 'KeyY', bekommen: 'KeyZ' });
  });

  it('meldet einen Treffer daneben', () => {
    const r = evaluateProbe(LAYOUT_PROBES[0]!, { key: 'a', code: 'KeyA' });
    expect(r.kind).toBe('daneben');
  });
});

describe('Vollständiger Durchgang', () => {
  it('besteht auf T1', () => {
    const r = evaluateLayout(T1);
    expect(r.bestanden).toBe(true);
    expect([...r.ergebnisse.values()].every((e) => e.kind === 'ok')).toBe(true);
  });

  it('scheitert auf einem amerikanischen Layout', () => {
    expect(evaluateLayout(US).bestanden).toBe(false);
  });

  it('scheitert schon an einer einzigen falschen Probe', () => {
    for (let i = 0; i < T1.length; i++) {
      const fast = [...T1];
      fast[i] = { key: 'x', code: 'KeyX' };
      expect(evaluateLayout(fast).bestanden, `Probe ${i}`).toBe(false);
    }
  });

  /**
   * Eine übersprungene Probe darf nicht als Erfolg durchgehen — sonst wäre die
   * Sperre des Lernpfads mit einem Klick zu umgehen.
   */
  it('besteht nicht bei zu wenigen Eingaben', () => {
    expect(evaluateLayout([]).bestanden).toBe(false);
    expect(evaluateLayout(T1.slice(0, 3)).bestanden).toBe(false);
  });

  it('meldet für jede Probe ein Ergebnis, auch für fehlende', () => {
    const r = evaluateLayout([]);
    expect(r.ergebnisse.size).toBe(LAYOUT_PROBES.length);
  });
});

describe('Vermutung über das anliegende Layout', () => {
  it('erkennt das amerikanische Muster am y statt z', () => {
    expect(evaluateLayout(US).verdacht).toBe('us');
  });

  it('vermutet ein Schweizer Layout, wenn nur das scharfe s fehlt', () => {
    const schweiz: Keystroke[] = [
      { key: 'z', code: 'KeyY' },
      { key: 'ö', code: 'Semicolon' },
      { key: "'", code: 'Minus' },
      { key: '@', code: 'KeyQ' },
    ];
    expect(evaluateLayout(schweiz).verdacht).toBe('schweiz');
  });

  it('gibt sich mit „unbekannt" zufrieden, wenn nichts passt', () => {
    const wirr: Keystroke[] = [
      { key: 'q', code: 'KeyA' },
      { key: 'w', code: 'KeyB' },
      { key: 'e', code: 'KeyC' },
      { key: 'r', code: 'KeyD' },
    ];
    expect(evaluateLayout(wirr).verdacht).toBe('unbekannt');
  });

  it('vermutet bei bestandener Prüfung nichts', () => {
    expect(evaluateLayout(T1).verdacht).toBe('unbekannt');
  });

  it('arbeitet auch auf einer leeren Ergebnismenge', () => {
    expect(vermuteLayout(new Map())).toBe('unbekannt');
  });
});

describe('Hilfstasten', () => {
  /**
   * AltGr wird für das at-Zeichen gebraucht. Würden Umschalt, Strg und Alt als
   * Probe zählen, scheiterte die Prüfung an sich selbst.
   */
  it('ignoriert Tasten, die kein Zeichen erzeugen', () => {
    for (const k of ['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock', 'Dead']) {
      expect(istHilfstaste(k), k).toBe(true);
    }
  });

  it('hält Zeichen nicht für Hilfstasten', () => {
    for (const k of ['z', 'ö', 'ß', '@', 'a', ' ']) {
      expect(istHilfstaste(k), k).toBe(false);
    }
  });
});
