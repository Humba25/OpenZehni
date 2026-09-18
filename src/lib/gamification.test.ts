import { describe, it, expect } from 'vitest';
import {
  XP,
  MAX_LEVEL,
  JOKER_PRO_MONAT,
  BADGE_SCHWELLEN,
  xpSchwelle,
  levelFuerXp,
  levelFortschritt,
  istFehlerfrei,
  MINISPIEL_XP_PRO_TAG,
  verdienteAbzeichen,
  neueAbzeichen,
  serieFortschreiben,
  tageDazwischen,
  xpFuerRunde,
  type FortschrittsBild,
  type SerienStand,
} from './gamification';
import { allLessons, thresholdsFor } from './curriculum';

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

/**
 * Wacht darüber, dass das Höchstlevel **erreichbar bleibt** (SPEC.md 8.1).
 *
 * Bis zum 2026-09-16 war es das nicht: Die alte Formel verlangte für Level 30
 * rund 1,5 Millionen XP, erreichbar waren nach einem Jahr knapp 55 000. Gemerkt
 * hat das niemand, weil eine unerreichbare Schwelle keinen Test bricht — sie
 * sieht nur für ein Kind so aus, als käme sie irgendwann.
 *
 * Deshalb wird das XP-Angebot hier aus den **echten Inhalten** gerechnet und
 * gegen die Kurve gehalten. Wer Lektionen streicht, XP-Werte senkt oder die
 * Kurve anzieht, bekommt es hier gesagt.
 */
describe('Das Höchstlevel ist erreichbar — SPEC.md 8.1, 15.14', () => {
  /** Ein Stand, an dem alles geschafft ist — daraus ergibt sich, was es an Abzeichen gibt. */
  const allesGeschafft: FortschrittsBild = {
    bestandeneLektionen: new Set(allLessons().map((l) => l.id)),
    besteStrokesMin: 999,
    jeFehlerfrei: true,
    minutenHeute: 999,
    blindMinuten: 999,
    serieTage: 999,
    themenProbiert: 99,
    diplomBestanden: true,
    fallenErkannt: 99,
    zwischenstueckeFertig: 99,
  };

  /** Alles, was es genau einmal gibt: jede Lektion mit drei Sternen, alle Abzeichen. */
  const einmalig =
    allLessons().length * (XP.lektion + 3 * XP.stern) +
    verdienteAbzeichen(allesGeschafft).length * XP.abzeichen;

  /** Was ein Übungstag höchstens bringt, ohne neue Lektion (SPEC.md 8.1). */
  const proTag =
    XP.tagesziel + XP.tagesaufgabe + XP.tastenjagd + MINISPIEL_XP_PRO_TAG * XP.minispiel;

  /**
   * XP nach `tage` Tagen fast täglichen Übens, Lernpfad und Abzeichen
   * inbegriffen.
   *
   * Bis zum 2026-09-18 kamen je Woche 120 XP fürs Wochenziel dazu. Das ist
   * gestrichen (SPEC.md 8.8) — die Kurve muss also ohne diesen Zuschlag
   * erreichbar bleiben.
   */
  const nachTagen = (tage: number): number => einmalig + tage * proTag;

  it('bringt den ganzen Lernpfad über die ersten Level hinaus', () => {
    // Wer alles einmal durchgespielt hat, soll nicht bei Level 3 stehen.
    expect(levelFuerXp(einmalig)).toBeGreaterThanOrEqual(8);
  });

  it('erreicht das Höchstlevel in etwa einem Jahr', () => {
    expect(
      levelFuerXp(nachTagen(365)),
      `Nach einem Jahr stehen ${nachTagen(365)} XP zur Verfügung, ` +
        `Level ${MAX_LEVEL} verlangt ${xpSchwelle(MAX_LEVEL)}.`,
    ).toBe(MAX_LEVEL);
  });

  it('verschenkt das Höchstlevel nicht schon nach einem Monat', () => {
    // Eine Leiste, die im ersten Monat endet, ist genauso wertlos wie eine,
    // die nie endet.
    expect(levelFuerXp(nachTagen(30))).toBeLessThan(MAX_LEVEL);
  });

  it('lässt kein Level länger als einen Monat täglichen Übens dauern', () => {
    for (let n = 2; n <= MAX_LEVEL; n++) {
      const spanne = xpSchwelle(n) - xpSchwelle(n - 1);
      expect(
        spanne,
        `Level ${n} kostet ${spanne} XP — das sind ${Math.round(spanne / proTag)} Übungstage.`,
      ).toBeLessThanOrEqual(30 * proTag);
    }
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

describe('Fehlerfrei — NORMEN.md 4.4.1', () => {
  /**
   * Der Fehler, den der Nutzer am 2026-09-18 gemeldet hat: Er machte drei
   * Vertipper, die Auswertung zeigte „Sicherheit 97,5 %" — und daneben das
   * Abzeichen „Fehlerfrei, kein einziger Fehler".
   *
   * Ursache: In `L01`–`L13` lässt der blockierende Modus keine falsche Taste
   * durch. Die amtliche Fehlerquote ist dort **immer** 0,00 %; das Abzeichen
   * hing genau an dieser Zahl und kam damit in der ersten Runde.
   */
  it('vergibt es nicht für eine blockierende Lektion mit Vertippern', () => {
    expect(
      istFehlerfrei([{ lessonId: 'L01', besteErrorRate: 0, besteSicherheit: 97.5 }]),
      'Fehlerquote 0 ist in L01 bauartbedingt und sagt nichts aus',
    ).toBe(false);
  });

  it('vergibt es für eine blockierende Lektion ohne einen einzigen Fehlgriff', () => {
    expect(istFehlerfrei([{ lessonId: 'L01', besteErrorRate: 0, besteSicherheit: 100 }])).toBe(
      true,
    );
  });

  /** Knapp daneben ist auch daneben. */
  it('vergibt es nicht bei 99,9 Prozent Sicherheit', () => {
    expect(istFehlerfrei([{ lessonId: 'L05', besteErrorRate: 0, besteSicherheit: 99.9 }])).toBe(
      false,
    );
  });

  it('zählt ab L14 die amtliche Fehlerquote', () => {
    expect(istFehlerfrei([{ lessonId: 'L19', besteErrorRate: 0, besteSicherheit: 80 }])).toBe(true);
    expect(istFehlerfrei([{ lessonId: 'L19', besteErrorRate: 0.4, besteSicherheit: 100 }])).toBe(
      false,
    );
  });

  it('reicht eine einzige passende Lektion', () => {
    expect(
      istFehlerfrei([
        { lessonId: 'L01', besteErrorRate: 0, besteSicherheit: 90 },
        { lessonId: 'L19', besteErrorRate: 0, besteSicherheit: 70 },
      ]),
    ).toBe(true);
  });

  it('kommt mit leeren Werten und unbekannten Lektionen zurecht', () => {
    expect(istFehlerfrei([])).toBe(false);
    expect(istFehlerfrei([{ lessonId: 'L01', besteErrorRate: null, besteSicherheit: null }])).toBe(
      false,
    );
    expect(istFehlerfrei([{ lessonId: 'L99', besteErrorRate: 0, besteSicherheit: 100 }])).toBe(
      false,
    );
  });

  /**
   * Der Schutz vor dem Rückfall: Für **jede** blockierende Lektion darf eine
   * Runde mit Vertippern das Abzeichen nicht auslösen. Wer die Grenze zwischen
   * blockierend und fließend verschiebt, ohne hier nachzuziehen, merkt es.
   */
  it('gilt für alle blockierenden Lektionen', () => {
    for (const lesson of allLessons()) {
      if (thresholdsFor(lesson.id)?.kind !== 'safety') continue;
      expect(
        istFehlerfrei([{ lessonId: lesson.id, besteErrorRate: 0, besteSicherheit: 97.5 }]),
        lesson.id,
      ).toBe(false);
    }
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
