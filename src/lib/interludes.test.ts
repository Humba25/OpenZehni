import { describe, it, expect } from 'vitest';
import {
  allInterludes,
  getInterlude,
  interludeAfter,
  faelligesInterlude,
  istFalle,
  darfUeberLernenSprechen,
  MIN_SITZUNGEN_FUER_AUSSAGE,
} from './interludes';
import { allLessons } from './curriculum';

describe('Zwischenstücke — SPEC.md 6.6', () => {
  it('kennt genau acht Einheiten', () => {
    expect(allInterludes()).toHaveLength(8);
  });

  it('vergibt jede ID nur einmal', () => {
    const ids = allInterludes().map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /** Der Ablageplan aus SPEC.md 6.6 — nach jeder dritten Lektion. */
  it('liegt nach jeder dritten Lektion', () => {
    const stellen = allInterludes().map((u) => u.afterLesson);
    expect(stellen).toEqual(['L03', 'L06', 'L09', 'L12', 'L15', 'L18', 'L21', 'L24']);
  });

  it('verweist nur auf Lektionen, die es gibt', () => {
    const bekannt = new Set(allLessons().map((l) => l.id));
    for (const u of allInterludes()) {
      expect(bekannt.has(u.afterLesson), u.id).toBe(true);
    }
  });

  it('hängt höchstens ein Zwischenstück an eine Lektion', () => {
    const stellen = allInterludes().map((u) => u.afterLesson);
    expect(new Set(stellen).size).toBe(stellen.length);
  });

  it('findet das Zwischenstück zu einer Lektion', () => {
    expect(interludeAfter('L03')?.id).toBe('medien-f1');
    expect(interludeAfter('L01')).toBeUndefined();
  });

  it('findet eine Einheit über ihre ID', () => {
    expect(getInterlude('lernen-e1')?.title).toBeTruthy();
    expect(getInterlude('gibtesnicht')).toBeUndefined();
  });
});

describe('Fälligkeit', () => {
  it('meldet ein noch nicht erledigtes Zwischenstück', () => {
    expect(faelligesInterlude('L03', new Set())?.id).toBe('medien-f1');
  });

  it('meldet ein erledigtes nicht erneut', () => {
    expect(faelligesInterlude('L03', new Set(['medien-f1']))).toBeUndefined();
  });

  it('meldet für Lektionen ohne Zwischenstück nichts', () => {
    for (const id of ['L01', 'L02', 'L04', 'L25']) {
      expect(faelligesInterlude(id, new Set()), id).toBeUndefined();
    }
  });
});

describe('Die drei Fallen — SPEC.md 6.6.1', () => {
  it('enthält genau drei Fallen', () => {
    expect(allInterludes().filter(istFalle)).toHaveLength(3);
  });

  it('legt sie auf L03, L15 und L21', () => {
    expect(
      allInterludes()
        .filter(istFalle)
        .map((u) => u.afterLesson),
    ).toEqual(['L03', 'L15', 'L21']);
  });

  it('gibt jeder Falle eine Auflösung mit', () => {
    for (const u of allInterludes().filter(istFalle)) {
      expect(u.aufloesung, u.id).toBeTruthy();
    }
  });

  /**
   * Jede Medienkompetenz-Einheit trägt die Zuordnung zum KMK-Rahmen
   * (NORMEN.md 6). Die Felder sind Metadaten für die Elternansicht und
   * erscheinen nie in der Kinderoberfläche.
   */
  it('ordnet jede Medieneinheit dem KMK-Rahmen zu', () => {
    for (const u of allInterludes().filter((x) => x.id.startsWith('medien-'))) {
      expect(u.kmk, u.id).toBeGreaterThanOrEqual(1);
      expect(u.kmk, u.id).toBeLessThanOrEqual(6);
      expect(u.digcomp, u.id).toBeTruthy();
    }
  });
});

describe('Aussagen über das Lernen — MODUL-LERNEN.md 1.1', () => {
  /**
   * Die unverhandelbare Regel: Unter fünf Sitzungen sagt Zehni nichts über das
   * Lernen der Nutzerin. Es wird nie ein Beispielwert als ihr Wert ausgegeben.
   */
  it('schweigt unter fünf Sitzungen', () => {
    for (let n = 0; n < MIN_SITZUNGEN_FUER_AUSSAGE; n++) {
      expect(darfUeberLernenSprechen(n), `${n} Sitzungen`).toBe(false);
    }
  });

  it('spricht ab fünf Sitzungen', () => {
    expect(darfUeberLernenSprechen(MIN_SITZUNGEN_FUER_AUSSAGE)).toBe(true);
    expect(darfUeberLernenSprechen(42)).toBe(true);
  });

  it('hält für die datengestützte Einheit eine neutrale Fassung bereit', () => {
    const kurve = allInterludes().find((u) => u.type === 'lernen-kurve');
    expect(kurve?.neutraleFassung).toBeTruthy();
  });
});

describe('Inhaltliche Vollständigkeit', () => {
  it('gibt jeder Wissens- und Lerneinheit Text und Frage', () => {
    for (const u of allInterludes().filter((x) => x.type === 'wissen' || x.type === 'lernen')) {
      expect(u.bloecke?.length, u.id).toBeGreaterThan(0);
      expect(u.frage, u.id).toBeTruthy();
      expect(u.frage!.optionen.length, u.id).toBeGreaterThanOrEqual(2);
      expect(u.frage!.richtig, u.id).toBeGreaterThanOrEqual(0);
      expect(u.frage!.richtig, u.id).toBeLessThan(u.frage!.optionen.length);
      expect(u.frage!.erklaerung, u.id).toBeTruthy();
    }
  });

  it('gibt jeder Einheit einen Titel', () => {
    for (const u of allInterludes()) expect(u.title.length, u.id).toBeGreaterThan(0);
  });
});
