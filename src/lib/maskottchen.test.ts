import { describe, it, expect } from 'vitest';
import {
  maskottchenFuer,
  SCHLAEFT_AB_TAGEN,
  type Anlass,
  type MaskottchenZustand,
} from './maskottchen';
import { de } from '../i18n/de';

const auswertung = (a: Partial<Extract<Anlass, { art: 'auswertung' }>> = {}): Anlass => ({
  art: 'auswertung',
  bestanden: true,
  sterne: 1,
  neueBestleistung: false,
  tageszielGeradeErreicht: false,
  ...a,
});

const ZUSTAENDE: readonly MaskottchenZustand[] = [
  'idle',
  'freut-sich',
  'denkt',
  'winkt',
  'schlaeft',
];

describe('Maskottchen — SPEC.md 8.5', () => {
  const anlaesse: readonly Anlass[] = [
    { art: 'begruessung', serieTage: 0, tageSeitLetztem: 0 },
    { art: 'begruessung', serieTage: 5, tageSeitLetztem: 1 },
    { art: 'begruessung', serieTage: 0, tageSeitLetztem: 9 },
    { art: 'erklaerung' },
    auswertung(),
    auswertung({ sterne: 3 }),
    auswertung({ neueBestleistung: true }),
    auswertung({ bestanden: false, sterne: 0 }),
    auswertung({ tageszielGeradeErreicht: true }),
    { art: 'tastenjagd' },
    { art: 'zwischenstueck' },
  ];

  it('kennt nur die fünf Zustände aus der Spec', () => {
    for (const a of anlaesse) {
      expect(ZUSTAENDE).toContain(maskottchenFuer(a).zustand);
    }
  });

  /** Höchstens ein Satz — das Modul gibt deshalb nie eine Liste zurück. */
  it('sagt zu jedem Anlass genau einen Satz', () => {
    for (const a of anlaesse) {
      const m = maskottchenFuer(a);
      expect(typeof m.spruch).toBe('string');
      expect(de.maskottchen.sprueche[m.spruch], m.spruch).toBeTruthy();
    }
  });

  it('schläft erst nach längerer Pause', () => {
    expect(
      maskottchenFuer({ art: 'begruessung', serieTage: 0, tageSeitLetztem: 1 }).zustand,
    ).not.toBe('schlaeft');
    expect(
      maskottchenFuer({ art: 'begruessung', serieTage: 0, tageSeitLetztem: SCHLAEFT_AB_TAGEN })
        .zustand,
    ).toBe('schlaeft');
  });

  it('stellt die Bestleistung vor alles andere', () => {
    expect(maskottchenFuer(auswertung({ neueBestleistung: true, sterne: 3 })).spruch).toBe(
      'bestleistung',
    );
  });

  /** Nicht bestanden ist kein Anlass für Trauer (ARCHITEKTUR.md). */
  it('bleibt bei einem misslungenen Versuch freundlich', () => {
    const m = maskottchenFuer(auswertung({ bestanden: false, sterne: 0 }));
    expect(m.spruch).toBe('nochmal');
    expect(m.zustand).toBe('denkt');
  });
});
