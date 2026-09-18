/**
 * Wacht über die Trennung der Kinder (SPEC.md 5.1).
 *
 * Der wichtigste Test hier ist der letzte: Die Zahl der Plätze steht **zweimal**
 * im Quelltext — einmal in TypeScript und einmal in Rust. Stimmen sie nicht
 * überein, legt die Oberfläche eine Datenbankdatei an, für die niemand
 * Migrationen hinterlegt hat. Das Ergebnis wäre eine Datei ohne Tabellen und
 * ein Kind, dessen Einrichtung jedes Mal von vorn beginnt.
 *
 * Das fiele in keinem anderen Test auf: Beide Seiten für sich sind in Ordnung.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PLAETZE, dbUrl, weiterSuchen, loeschbarerPlatz } from './plaetze';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('dbUrl', () => {
  /**
   * Der Name der ersten Datei ist nicht frei wählbar: Dort liegt der
   * Lernfortschritt jeder Installation, die es vor dem Zweitprofil schon gab.
   * Ein neuer Name hieße für das Kind, dass beim Update alles weg ist.
   */
  it('lässt Platz 1 bei der alten Datei', () => {
    expect(dbUrl(1)).toBe('sqlite:zehni.db');
  });

  it('gibt jedem weiteren Platz eine eigene Datei', () => {
    const namen = new Set<string>();
    for (let p = 1; p <= PLAETZE; p++) namen.add(dbUrl(p));
    expect(namen.size).toBe(PLAETZE);
  });

  /** Ein unsinniger Platz darf nie in der Datei eines Kindes landen. */
  it('behandelt 0 und negative Werte wie Platz 1', () => {
    expect(dbUrl(0)).toBe(dbUrl(1));
    expect(dbUrl(-3)).toBe(dbUrl(1));
  });
});

describe('weiterSuchen', () => {
  it('hört beim ersten freien Platz auf', () => {
    expect(weiterSuchen(false, 1)).toBe(false);
    expect(weiterSuchen(false, 2)).toBe(false);
  });

  it('sucht weiter, solange belegt ist', () => {
    expect(weiterSuchen(true, 1)).toBe(true);
  });

  it('hört beim letzten Platz auf, auch wenn er belegt ist', () => {
    expect(weiterSuchen(true, PLAETZE)).toBe(false);
  });
});

describe('loeschbarerPlatz', () => {
  it('gibt nichts her, solange nur ein Kind da ist', () => {
    expect(loeschbarerPlatz([1])).toBeNull();
    expect(loeschbarerPlatz([])).toBeNull();
  });

  it('nennt den zuletzt angelegten Platz', () => {
    expect(loeschbarerPlatz([1, 2])).toBe(2);
    expect(loeschbarerPlatz([1, 2, 3])).toBe(3);
  });

  /**
   * Platz 1 ist nie löschbar. Dort liegt, was es vor dem Zweitprofil gab —
   * und ein Löschen von dort wäre der teuerste Fehlklick der ganzen App.
   */
  it('gibt niemals Platz 1 heraus', () => {
    expect(loeschbarerPlatz([1, 2, 3])).not.toBe(1);
    expect(loeschbarerPlatz([1])).toBeNull();
  });
});

describe('TypeScript und Rust sind sich einig', () => {
  it('kennt dieselbe Zahl von Plätzen wie lib.rs', () => {
    const rust = readFileSync(join(WURZEL, 'src-tauri', 'src', 'lib.rs'), 'utf8');
    const treffer = /const PLAETZE: u8 = (\d+);/.exec(rust);

    expect(treffer, 'PLAETZE in lib.rs nicht gefunden').not.toBeNull();
    expect(Number(treffer![1])).toBe(PLAETZE);
  });

  /**
   * Die Rust-Seite bildet die Dateinamen selbst. Weichen die Regeln ab, öffnet
   * die Oberfläche eine Datei, für die keine Migration hinterlegt ist.
   */
  it('bildet die Dateinamen nach derselben Regel', () => {
    const rust = readFileSync(join(WURZEL, 'src-tauri', 'src', 'lib.rs'), 'utf8');
    expect(rust).toContain('"sqlite:zehni.db"');
    expect(rust).toContain('format!("sqlite:zehni-{platz}.db")');
  });
});
