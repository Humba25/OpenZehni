import { describe, it, expect } from 'vitest';
import {
  alleModule,
  getModul,
  alleEinheiten,
  getEinheit,
  uebersicht,
  einheitenGesamt,
  zuordnungKorrekt,
  zuordnungTreffer,
  umschreibungPasst,
  kuerzelPasst,
  type AufgabeZuordnen,
} from './module';
import { allInterludes } from './interludes';
import { checkDin5008 } from './din5008';

describe('Modulbereich — SPEC.md 10', () => {
  it('kennt die drei Module', () => {
    expect(alleModule().map((m) => m.id)).toEqual(['modul-medien', 'modul-lernen', 'modul-text']);
  });

  it('vergibt jede Einheiten-ID nur einmal, auch über Module hinweg', () => {
    const ids = alleEinheiten().map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * Beide Inhaltsdateien schreiben in dieselbe Tabelle `module_progress`. Eine
   * doppelte ID hieße: zwei Einheiten teilen sich einen Fortschritt.
   */
  it('kollidiert mit keiner ID aus dem Lernpfad', () => {
    const ausDemPfad = new Set(allInterludes().map((u) => u.id));
    for (const u of alleEinheiten()) {
      expect(ausDemPfad.has(u.id), u.id).toBe(false);
    }
  });

  it('findet Modul und Einheit über ihre ID', () => {
    expect(getModul('modul-medien')?.title).toBeTruthy();
    expect(getModul('gibtesnicht')).toBeUndefined();
    expect(getEinheit('medien-kuerzel')?.title).toBeTruthy();
    expect(getEinheit('gibtesnicht')).toBeUndefined();
  });

  /** SPEC.md 10: „Jedes Modul besteht aus 5 bis 8 Einheiten." */
  it('hält jedes Modul in der Größenordnung aus der Spec', () => {
    for (const m of alleModule()) {
      const n = einheitenGesamt(m.id);
      expect(n, m.id).toBeGreaterThanOrEqual(5);
      expect(n, m.id).toBeLessThanOrEqual(11);
    }
  });

  it('gibt jeder Einheit Erklärung, Aufgabe und Abschluss', () => {
    for (const u of alleEinheiten()) {
      expect(u.bloecke.length, u.id).toBeGreaterThan(0);
      expect(u.aufgabe, u.id).toBeTruthy();
      expect(u.abschluss.length, u.id).toBeGreaterThan(10);
    }
  });

  /** Jede Medieneinheit trägt die Zuordnung zum KMK-Rahmen (NORMEN.md 6). */
  it('ordnet jede Medieneinheit dem KMK-Rahmen zu', () => {
    for (const u of getModul('modul-medien')!.units) {
      expect(u.kmk, u.id).toBeGreaterThanOrEqual(1);
      expect(u.kmk, u.id).toBeLessThanOrEqual(6);
      expect(u.digcomp, u.id).toBeTruthy();
    }
  });
});

describe('Übersicht', () => {
  /**
   * Die Zuordnung eines Zwischenstücks zu seinem Modul steckt in der ID. Fällt
   * die Regel, verschwinden die Zwischenstücke stillschweigend aus der
   * Übersicht — das würde ohne diesen Test niemand merken.
   */
  it('nimmt die Zwischenstücke des Moduls mit auf', () => {
    const medien = uebersicht('modul-medien');
    const ausDemPfad = medien.filter((e) => e.imLernpfad).map((e) => e.id);
    expect(ausDemPfad).toContain('medien-passwoerter');
    expect(ausDemPfad).toContain('medien-f1');
    expect(ausDemPfad).toContain('medien-f2');
    expect(ausDemPfad).toContain('medien-f3');

    const lernen = uebersicht('modul-lernen')
      .filter((e) => e.imLernpfad)
      .map((e) => e.id);
    expect(lernen).toEqual(['lernen-e1', 'lernen-e2', 'lernen-e5', 'lernen-e8']);
  });

  it('bringt jedes Zwischenstück in genau einem Modul unter', () => {
    const gezeigt = alleModule().flatMap((m) =>
      uebersicht(m.id)
        .filter((e) => e.imLernpfad)
        .map((e) => e.id),
    );
    expect(new Set(gezeigt).size).toBe(gezeigt.length);
    expect(gezeigt).toHaveLength(allInterludes().length);
  });

  it('nennt bei Zwischenstücken die Lektion', () => {
    for (const e of uebersicht('modul-medien').filter((x) => x.imLernpfad)) {
      expect(e.afterLesson, e.id).toMatch(/^L\d\d$/);
    }
  });

  it('meldet für ein unbekanntes Modul nichts', () => {
    expect(uebersicht('gibtesnicht')).toEqual([]);
  });
});

describe('Aufgaben', () => {
  const zuordnen: AufgabeZuordnen = {
    art: 'zuordnen',
    text: 'Test',
    faecher: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ],
    karten: [
      { text: 'eins', fach: 'a' },
      { text: 'zwei', fach: 'b' },
    ],
    erklaerung: 'Test',
  };

  it('erkennt eine vollständig richtige Zuordnung', () => {
    const gewaehlt = new Map([
      [0, 'a'],
      [1, 'b'],
    ]);
    expect(zuordnungKorrekt(zuordnen, gewaehlt)).toBe(true);
    expect(zuordnungTreffer(zuordnen, gewaehlt)).toBe(2);
  });

  it('zählt eine nicht einsortierte Karte als falsch', () => {
    const gewaehlt = new Map([[0, 'a']]);
    expect(zuordnungKorrekt(zuordnen, gewaehlt)).toBe(false);
    expect(zuordnungTreffer(zuordnen, gewaehlt)).toBe(1);
  });

  it('verweist in jeder Zuordnung nur auf vorhandene Fächer', () => {
    for (const u of alleEinheiten()) {
      if (u.aufgabe.art !== 'zuordnen') continue;
      const faecher = new Set(u.aufgabe.faecher.map((f) => f.id));
      for (const k of u.aufgabe.karten) {
        expect(faecher.has(k.fach), `${u.id}: '${k.fach}'`).toBe(true);
      }
    }
  });

  it('füllt in jeder Zuordnung jedes Fach mit mindestens einer Karte', () => {
    for (const u of alleEinheiten()) {
      if (u.aufgabe.art !== 'zuordnen') continue;
      for (const f of u.aufgabe.faecher) {
        const drin = u.aufgabe.karten.some((k) => k.fach === f.id);
        expect(drin, `${u.id}: Fach '${f.id}' ist leer`).toBe(true);
      }
    }
  });

  /** Geprüft wird der Gedanke, nicht die Rechtschreibung (MODUL-LERNEN.md 5). */
  it('prüft beim Umschreiben nur die entscheidende Wendung', () => {
    expect(umschreibungPasst('Ich treffe das Ö noch nicht sicher.', ['noch nicht'])).toBe(true);
    expect(umschreibungPasst('NOCH NICHT so gut', ['noch nicht'])).toBe(true);
    expect(umschreibungPasst('Ich kann das nicht.', ['noch nicht'])).toBe(false);
    expect(umschreibungPasst('   ', ['noch nicht'])).toBe(false);
  });

  it('erkennt ein Tastenkürzel nur mit den richtigen Zusatztasten', () => {
    const gesucht = { label: 'Kopieren', code: 'KeyC', ctrl: true, shift: false };
    expect(kuerzelPasst(gesucht, { code: 'KeyC', ctrl: true, shift: false })).toBe(true);
    expect(kuerzelPasst(gesucht, { code: 'KeyC', ctrl: false, shift: false })).toBe(false);
    expect(kuerzelPasst(gesucht, { code: 'KeyC', ctrl: true, shift: true })).toBe(false);
    expect(kuerzelPasst(gesucht, { code: 'KeyV', ctrl: true, shift: false })).toBe(false);
  });

  /**
   * Die Textproben im Modul „Textverarbeitung" (SPEC.md 10.2) müssen zwei
   * Bedingungen erfüllen: Die Vorgabe verstößt wirklich gegen die Norm, und die
   * Lösung hält sie ein. Sonst lehrte das Modul etwas Falsches.
   */
  it('gibt jeder Textprobe eine fehlerhafte Vorgabe und eine saubere Lösung', () => {
    const proben = alleEinheiten().filter((u) => u.aufgabe.art === 'textprobe');
    expect(proben.length).toBeGreaterThan(0);

    for (const u of proben) {
      if (u.aufgabe.art !== 'textprobe') continue;
      expect(
        checkDin5008(u.aufgabe.vorgabe).length,
        `${u.id}: Vorgabe ist schon richtig`,
      ).toBeGreaterThan(0);
      expect(checkDin5008(u.aufgabe.loesung), `${u.id}: Loesung`).toEqual([]);
    }
  });

  /** Die Lösung darf sich von der Vorgabe nur in Leerzeichen und Ziffern unterscheiden. */
  it('verlangt in jeder Textprobe dieselben Wörter wie in der Vorgabe', () => {
    for (const u of alleEinheiten()) {
      if (u.aufgabe.art !== 'textprobe') continue;
      const buchstaben = (s: string): string => s.replace(/[^\p{L}]/gu, '').toLowerCase();
      expect(buchstaben(u.aufgabe.loesung), u.id).toBe(buchstaben(u.aufgabe.vorgabe));
    }
  });

  it('gibt jeder Quizfrage eine gültige richtige Antwort', () => {
    for (const u of alleEinheiten()) {
      if (u.aufgabe.art !== 'quiz') continue;
      expect(u.aufgabe.optionen.length, u.id).toBeGreaterThanOrEqual(2);
      expect(u.aufgabe.richtig, u.id).toBeGreaterThanOrEqual(0);
      expect(u.aufgabe.richtig, u.id).toBeLessThan(u.aufgabe.optionen.length);
      expect(u.aufgabe.erklaerung.length, u.id).toBeGreaterThan(10);
    }
  });
});
