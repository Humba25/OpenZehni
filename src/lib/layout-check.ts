/**
 * Erkennung der Tastaturbelegung (SPEC.md 7.4, NORMEN.md 3.1).
 *
 * **Warum das Pflicht ist:** Zehni setzt T1 nach DIN 2137-1:2023-08 voraus.
 * Liegt ein anderes Layout an, stimmt jede einzelne Taste nicht — das Kind
 * greift nach der Anleitung richtig und bekommt trotzdem den falschen
 * Buchstaben. Es hält sich dann für ungeschickt, obwohl der Rechner falsch
 * eingestellt ist. Die Ursache kann ein Zehnjähriger unmöglich finden.
 *
 * Deshalb ist der Lernpfad gesperrt, bis die Prüfung besteht (NORMEN.md 3.1).
 *
 * **Warum `key` und `code` zusammen geprüft werden:** Beides allein reicht
 * nicht.
 *
 *   - Nur `key` (das erzeugte Zeichen): Wer eine amerikanische Tastatur mit
 *     amerikanischem Layout hat, tippt auf der Taste mit der Aufschrift `z`
 *     und bekommt ein `z`. Die Prüfung ginge durch, obwohl gar kein T1
 *     vorliegt — und `ö`, `ß`, `@` säßen an ganz anderen Stellen.
 *   - Nur `code` (die physische Taste): Der sagt nichts darüber aus, welches
 *     Zeichen dabei herauskommt.
 *
 * Erst zusammen belegen sie: Diese physische Taste erzeugt dieses Zeichen —
 * also liegt T1 an.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

/** Eine der vier Proben. */
export interface LayoutProbe {
  /** Das Zeichen, das die Nutzerin tippen soll. */
  readonly char: string;
  /** Die physische Taste, die es auf T1 erzeugt (`KeyboardEvent.code`). */
  readonly code: string;
  /** Braucht das Zeichen AltGr? Wird der Nutzerin als Hinweis gezeigt. */
  readonly altgr?: boolean;
}

/**
 * Die vier Proben aus `NORMEN.md` 3.1: `z`, `ö`, `ß` und `@`.
 *
 * Sie sind nicht beliebig gewählt — jede deckt eine andere Art von Abweichung
 * auf:
 *
 *   - `z` sitzt auf T1 dort, wo amerikanische Layouts `y` haben. Das ist der
 *     mit Abstand häufigste Fall.
 *   - `ö` gibt es auf amerikanischen und britischen Layouts überhaupt nicht.
 *   - `ß` ebenso, und es liegt auf einer anderen Taste als auf Schweizer
 *     Layouts.
 *   - `@` erreicht T1 nur über AltGr; auf amerikanischen Layouts liegt es auf
 *     Umschalt und der Ziffer 2, auf Schweizer Layouts anderswo.
 */
export const LAYOUT_PROBES: readonly LayoutProbe[] = [
  { char: 'z', code: 'KeyY' },
  { char: 'ö', code: 'Semicolon' },
  { char: 'ß', code: 'Minus' },
  { char: '@', code: 'KeyQ', altgr: true },
];

/** Was bei einer Probe herausgekommen ist. */
export type ProbeOutcome =
  /** Zeichen und Taste stimmen. */
  | { kind: 'ok' }
  /** Richtige Taste, falsches Zeichen — das Layout passt nicht. */
  | { kind: 'falsches-zeichen'; erwartet: string; bekommen: string }
  /** Richtiges Zeichen, aber von der falschen Taste — auch kein T1. */
  | { kind: 'falsche-taste'; erwartet: string; bekommen: string }
  /** Weder noch. */
  | { kind: 'daneben'; erwartet: string; bekommen: string };

export interface Keystroke {
  readonly key: string;
  readonly code: string;
}

/** Bewertet einen einzelnen Tastendruck gegen eine Probe. */
export function evaluateProbe(probe: LayoutProbe, stroke: Keystroke): ProbeOutcome {
  const zeichenStimmt = stroke.key === probe.char;
  const tasteStimmt = stroke.code === probe.code;

  if (zeichenStimmt && tasteStimmt) return { kind: 'ok' };
  if (tasteStimmt) {
    return { kind: 'falsches-zeichen', erwartet: probe.char, bekommen: stroke.key };
  }
  if (zeichenStimmt) {
    return { kind: 'falsche-taste', erwartet: probe.code, bekommen: stroke.code };
  }
  return { kind: 'daneben', erwartet: probe.char, bekommen: stroke.key };
}

/**
 * Vermutung, welches Layout stattdessen anliegt.
 *
 * Nur ein **Hinweis** für die Anleitung, keine Feststellung. Zehni behauptet
 * nirgends, das fremde Layout sicher erkannt zu haben — es kennt nur T1
 * (NORMEN.md 3.1) und weiß, dass etwas anderes anliegt.
 */
export type LayoutVerdacht = 'us' | 'schweiz' | 'unbekannt';

export function vermuteLayout(ergebnisse: ReadonlyMap<string, ProbeOutcome>): LayoutVerdacht {
  const z = ergebnisse.get('z');
  const ss = ergebnisse.get('ß');

  // Das klassische Kennzeichen: Auf der Taste, die auf T1 ein z erzeugt,
  // kommt ein y heraus.
  if (z?.kind === 'falsches-zeichen' && z.bekommen.toLowerCase() === 'y') return 'us';

  // Schweizer Layouts haben z an der richtigen Stelle, aber kein scharfes s.
  if (z?.kind === 'ok' && ss && ss.kind !== 'ok') return 'schweiz';

  return 'unbekannt';
}

export interface LayoutResult {
  readonly bestanden: boolean;
  /** Zeichen → Ergebnis, in der Reihenfolge der Proben. */
  readonly ergebnisse: ReadonlyMap<string, ProbeOutcome>;
  readonly verdacht: LayoutVerdacht;
}

/**
 * Bewertet einen vollständigen Durchgang.
 *
 * Erwartet je Probe genau einen Tastendruck, in der Reihenfolge von
 * {@link LAYOUT_PROBES}. Fehlende Eingaben gelten als nicht bestanden — eine
 * übersprungene Probe darf nicht als Erfolg durchgehen.
 */
export function evaluateLayout(strokes: readonly Keystroke[]): LayoutResult {
  const ergebnisse = new Map<string, ProbeOutcome>();

  for (const [i, probe] of LAYOUT_PROBES.entries()) {
    const stroke = strokes[i];
    if (!stroke) {
      ergebnisse.set(probe.char, { kind: 'daneben', erwartet: probe.char, bekommen: '' });
      continue;
    }
    ergebnisse.set(probe.char, evaluateProbe(probe, stroke));
  }

  const bestanden =
    strokes.length >= LAYOUT_PROBES.length &&
    [...ergebnisse.values()].every((e) => e.kind === 'ok');

  return { bestanden, ergebnisse, verdacht: bestanden ? 'unbekannt' : vermuteLayout(ergebnisse) };
}

/**
 * Tasten, die bei der Prüfung ignoriert werden.
 *
 * Umschalt, Strg und Alt erzeugen kein Zeichen und werden beim Greifen nach
 * `@` zwangsläufig mitgedrückt. Sie dürfen keine Probe verbrauchen — sonst
 * scheitert die Prüfung an sich selbst.
 */
export function istHilfstaste(key: string): boolean {
  return (
    key === 'Shift' ||
    key === 'Control' ||
    key === 'Alt' ||
    key === 'AltGraph' ||
    key === 'Meta' ||
    key === 'CapsLock' ||
    key === 'Dead'
  );
}
