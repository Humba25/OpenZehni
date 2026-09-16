import { describe, it, expect } from 'vitest';
import {
  XP,
  MAX_LEVEL,
  JOKER_PRO_MONAT,
  BADGE_SCHWELLEN,
  xpSchwelle,
  levelFuerXp,
  levelFortschritt,
  verdienteAbzeichen,
  neueAbzeichen,
  serieFortschreiben,
  tageDazwischen,
  xpFuerRunde,
  type FortschrittsBild,
  type SerienStand,
} from './gamification';

const leer: FortschrittsBild = {
  bestandeneLektionen: new Set(),
  besteStrokesMin: 0,
  jeFehlerfrei: false,
  minutenHeute: 0,
  blindMinuten: 0,
  serieTage: 0,
  themenProbiert: 0,
  diplomBestanden: false,
  fallenErkannt: 0,
  zwischenstueckeFertig: 0,
};

describe('XP und Level — SPEC.md 8.1', () => {
  it('hält die Werte aus der Tabelle ein', () => {
    expect(XP.lektion).toBe(50);
    expect(XP.stern).toBe(25);
    expect(XP.tagesziel).toBe(40);
    expect(XP.abzeichen).toBe(100);
  });

  it('beginnt bei Level 1 mit null XP', () => {
    expect(levelFuerXp(0)).toBe(1);
    expect(xpSchwelle(1)).toBe(0);
  });

  it('steigt streng monoton', () => {
    for (let n = 2; n <= MAX_LEVEL; n++) {
      expect(xpSchwelle(n), `Level ${n}`).toBeGreaterThan(xpSchwelle(n - 1));
    }
  });

  it('rundet die Schwellen auf zehn', () => {
    for (let n = 1; n <= MAX_LEVEL; n++) {
      expect(xpSchwelle(n) % 10, `Level ${n}`).toBe(0);
    }
  });

  it('ordnet XP dem richtigen Level zu', () => {
    const s3 = xpSchwelle(3);
    expect(levelFuerXp(s3 - 1)).toBe(2);
    expect(levelFuerXp(s3)).toBe(3);
  });

  it('geht nie über das Höchstlevel hinaus', () => {
    expect(levelFuerXp(99_999_999)).toBe(MAX_LEVEL);
  });

  it('rechnet den Fortschritt im Level', () => {
    const f = levelFortschritt(xpSchwelle(2));
    expect(f.level).toBe(2);
    expect(f.imLevel).toBe(0);
    expect(f.anteil).toBe(0);
  });

  it('meldet beim Höchstlevel kein weiteres Ziel', () => {
    const f = levelFortschritt(xpSchwelle(MAX_LEVEL) + 500);
    expect(f.level).toBe(MAX_LEVEL);
    expect(f.bisZumNaechsten).toBeNull();
    expect(f.anteil).toBe(1);
  });
});

describe('XP für eine Runde', () => {
  it('gibt nichts für eine nicht bestandene Runde ohne Sterne', () => {
    expect(
      xpFuerRunde({ sterne: 0, bestanden: false, neueBestleistung: false, blindmodus: false }),
    ).toBe(0);
  });

  it('rechnet Lektion und Sterne zusammen', () => {
    expect(
      xpFuerRunde({ sterne: 3, bestanden: true, neueBestleistung: false, blindmodus: false }),
    ).toBe(50 + 75);
  });

  it('gibt die Bestleistung nur dazu, wenn sie übertroffen wurde', () => {
    const ohne = xpFuerRunde({
      sterne: 1,
      bestanden: true,
      neueBestleistung: false,
      blindmodus: false,
    });
    const mit = xpFuerRunde({
      sterne: 1,
      bestanden: true,
      neueBestleistung: true,
      blindmodus: false,
    });
    expect(mit - ohne).toBe(XP.bestleistung);
  });

  it('schlägt im Blindmodus zwanzig Prozent auf', () => {
    const normal = xpFuerRunde({
      sterne: 2,
      bestanden: true,
      neueBestleistung: false,
      blindmodus: false,
    });
    const blind = xpFuerRunde({
      sterne: 2,
      bestanden: true,
      neueBestleistung: false,
      blindmodus: true,
    });
    expect(blind).toBe(Math.round(normal * 1.2));
  });
});

describe('Abzeichen — SPEC.md 8.2', () => {
  it('vergibt ohne Fortschritt keines', () => {
    expect(verdienteAbzeichen(leer)).toEqual([]);
  });

  it('hängt die Reihen-Abzeichen an die richtigen Lektionen', () => {
    const b = verdienteAbzeichen({
      ...leer,
      bestandeneLektionen: new Set(['L04', 'L05', 'L13', 'L19', 'L20', 'L22', 'L23']),
    });
    expect(b).toEqual(
      expect.arrayContaining([
        'grundstellung',
        'erste-woerter',
        'obere-reihe',
        'untere-reihe',
        'grossschreiber',
        'zahlenjongleur',
        'sonderzeichen-profi',
      ]),
    );
  });

  it('vergibt den Sprinter erst ab der Schwelle', () => {
    expect(
      verdienteAbzeichen({ ...leer, besteStrokesMin: BADGE_SCHWELLEN.sprinter - 1 }),
    ).not.toContain('sprinter');
    expect(verdienteAbzeichen({ ...leer, besteStrokesMin: BADGE_SCHWELLEN.sprinter })).toContain(
      'sprinter',
    );
  });

  it('vergibt Wochen- und Monatsabzeichen gestaffelt', () => {
    expect(verdienteAbzeichen({ ...leer, serieTage: 7 })).toContain('woche');
    expect(verdienteAbzeichen({ ...leer, serieTage: 7 })).not.toContain('monat');
    expect(verdienteAbzeichen({ ...leer, serieTage: 30 })).toContain('monat');
  });

  it('kennt die drei Abzeichen aus den Zwischenstücken', () => {
    expect(verdienteAbzeichen({ ...leer, fallenErkannt: 1 })).toContain('nicht-reingefallen');
    expect(verdienteAbzeichen({ ...leer, fallenErkannt: 3 })).toContain('wachsam');
    expect(verdienteAbzeichen({ ...leer, zwischenstueckeFertig: 8 })).toContain('durchblicker');
  });

  it('meldet nur wirklich neue Abzeichen', () => {
    const stand = { ...leer, bestandeneLektionen: new Set(['L04']) };
    expect(neueAbzeichen(new Set(), stand)).toEqual(['grundstellung']);
    expect(neueAbzeichen(new Set(['grundstellung']), stand)).toEqual([]);
  });
});

describe('Serie — SPEC.md 8.3', () => {
  const start: SerienStand = {
    currentDays: 0,
    longestDays: 0,
    lastDay: null,
    freezesLeft: JOKER_PRO_MONAT,
  };

  it('zählt Tage zwischen zwei Daten', () => {
    expect(tageDazwischen('2026-09-14', '2026-09-15')).toBe(1);
    expect(tageDazwischen('2026-09-14', '2026-09-14')).toBe(0);
    expect(tageDazwischen('2026-09-30', '2026-10-01')).toBe(1);
  });

  it('beginnt beim ersten erreichten Tagesziel', () => {
    const s = serieFortschreiben(start, '2026-09-14');
    expect(s.currentDays).toBe(1);
    expect(s.lastDay).toBe('2026-09-14');
  });

  it('zählt denselben Tag nicht doppelt', () => {
    const s1 = serieFortschreiben(start, '2026-09-14');
    const s2 = serieFortschreiben(s1, '2026-09-14');
    expect(s2.currentDays).toBe(1);
  });

  it('läuft am Folgetag weiter', () => {
    let s = serieFortschreiben(start, '2026-09-14');
    s = serieFortschreiben(s, '2026-09-15');
    s = serieFortschreiben(s, '2026-09-16');
    expect(s.currentDays).toBe(3);
    expect(s.longestDays).toBe(3);
  });

  /**
   * Der Kern von SPEC.md 8.3: Ein verpasster Tag darf nicht zwölf Tage Arbeit
   * vernichten. Der Joker greift **automatisch und ohne Nachfrage**.
   */
  it('gleicht einen verpassten Tag mit einem Joker aus', () => {
    let s = serieFortschreiben(start, '2026-09-14');
    s = serieFortschreiben(s, '2026-09-15');
    // Der 16. faellt aus.
    s = serieFortschreiben(s, '2026-09-17');
    expect(s.currentDays).toBe(3);
    expect(s.freezesLeft).toBe(JOKER_PRO_MONAT - 1);
  });

  it('hat nur zwei Joker je Monat', () => {
    let s = serieFortschreiben(start, '2026-09-01');
    s = serieFortschreiben(s, '2026-09-03'); // Joker 1
    s = serieFortschreiben(s, '2026-09-05'); // Joker 2
    expect(s.freezesLeft).toBe(0);
    s = serieFortschreiben(s, '2026-09-07'); // kein Joker mehr
    expect(s.currentDays).toBe(1);
  });

  it('füllt die Joker zum Monatswechsel wieder auf', () => {
    let s = serieFortschreiben(start, '2026-09-01');
    s = serieFortschreiben(s, '2026-09-03');
    expect(s.freezesLeft).toBe(JOKER_PRO_MONAT - 1);
    s = serieFortschreiben(s, '2026-10-04');
    expect(s.freezesLeft).toBe(JOKER_PRO_MONAT);
  });

  it('reißt bei einer größeren Lücke, behält aber die längste Serie', () => {
    let s = serieFortschreiben(start, '2026-09-01');
    for (const tag of ['2026-09-02', '2026-09-03', '2026-09-04']) s = serieFortschreiben(s, tag);
    expect(s.currentDays).toBe(4);

    s = serieFortschreiben(s, '2026-09-20');
    expect(s.currentDays).toBe(1);
    // Der Trost aus SPEC.md 8.3: "Deine laengste Serie: 4 Tage."
    expect(s.longestDays).toBe(4);
  });
});
