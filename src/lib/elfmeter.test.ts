import { describe, it, expect } from 'vitest';
import {
  ECKEN,
  STUFEN,
  SCHUESSE_PRO_RUNDE,
  zielwoerter,
  ladetext,
  erreichbareAnschlaege,
  eckenAnzahl,
  benutzteEcken,
  kraft,
  torwartEcke,
  istTor,
  torchance,
  MINDESTKRAFT,
  type Ecke,
} from './elfmeter';
import { createRandom } from './minispiele';
import { allLessons, getLesson, thresholdsFor } from './curriculum';

describe('Elfmeterschießen — SPEC.md 8.10.1', () => {
  it('kennt neun Ecken und fünf Schüsse', () => {
    expect(ECKEN).toHaveLength(9);
    expect(new Set(ECKEN).size).toBe(9);
    expect(SCHUESSE_PRO_RUNDE).toBe(5);
  });

  it('wird von leicht nach schwer in jeder Hinsicht schwerer', () => {
    for (let i = 1; i < STUFEN.length; i++) {
      const vorher = STUFEN[i - 1]!;
      const jetzt = STUFEN[i]!;
      expect(jetzt.ladezeitMs, 'weniger Zeit').toBeLessThan(vorher.ladezeitMs);
      expect(jetzt.zielTempo, 'schneller tippen').toBeGreaterThan(vorher.zielTempo);
      expect(jetzt.trefferquote, 'Torwart rät öfter richtig').toBeGreaterThan(vorher.trefferquote);
      expect(jetzt.durchschuss, 'härter durchzuschießen').toBeGreaterThan(vorher.durchschuss);
    }
  });
});

describe('Zielwörter', () => {
  /**
   * Die harte Regel aus 6.2: **kein ungelerntes Zeichen.** Geprüft für jede
   * Lektion, nicht für eine Auswahl — auch `L01`, wo nur `f` und `j` gelernt
   * sind.
   */
  it('nimmt nur gelernte Zeichen, in jeder Lektion', () => {
    for (const lesson of allLessons()) {
      const erlaubt = new Set([...lesson.chars]);
      for (const wort of zielwoerter(lesson.id, 'saat')) {
        for (const c of wort) {
          expect(erlaubt.has(c), `${lesson.id}: '${c}' in '${wort}' ist nicht gelernt`).toBe(true);
        }
      }
    }
  });

  it('füllt so viele Felder, wie das Tor hat', () => {
    for (const id of ['L01', 'L05', 'L13', 'L25']) {
      expect(zielwoerter(id, 'saat'), id).toHaveLength(eckenAnzahl(id));
    }
  });

  /**
   * **Der Test, der das Spiel gerettet hat.** Bis zum 2026-09-20 standen in
   * `L01` neun Felder mit `ff`, `jf`, `jj`, `jjj`, `ffj`, `fjf`, `jfj`, `fj`,
   * `jff` — neun Kästchen, die sich nur in der Anordnung zweier Buchstaben
   * unterschieden. Das war keine Zielwahl, sondern ein Suchbild.
   *
   * Verschiedene Anfangsbuchstaben sind das, was ein Feld auf einen Blick vom
   * Nachbarfeld trennt. Und sie sorgen dafür, dass mit dem **ersten** Anschlag
   * feststeht, wohin der Schuss geht.
   */
  it('gibt jedem Feld einen eigenen Anfangsbuchstaben', () => {
    for (const lesson of allLessons()) {
      const w = zielwoerter(lesson.id, 'saat');
      const anfaenge = new Set(w.map((x) => x[0]));
      expect(anfaenge.size, `${lesson.id}: ${JSON.stringify(w)}`).toBe(w.length);
    }
  });

  /** Zwei gleiche Felder wären nicht auflösbar. */
  it('gibt lauter verschiedene Wörter', () => {
    for (const id of ['L01', 'L09', 'L20']) {
      const w = zielwoerter(id, 'saat');
      expect(new Set(w).size, id).toBe(w.length);
    }
  });

  it('bleibt reproduzierbar', () => {
    expect(zielwoerter('L09', 'a')).toEqual(zielwoerter('L09', 'a'));
    expect(zielwoerter('L09', 'a')).not.toEqual(zielwoerter('L09', 'b'));
  });

  it('gibt für eine unbekannte Lektion nichts', () => {
    expect(zielwoerter('L99', 'saat')).toEqual([]);
  });
});

describe('Wie viele Ecken das Tor hat', () => {
  it('fängt klein an und wächst mit dem Zeichenvorrat', () => {
    // L01 kennt nur f und j -- mehr als zwei unterscheidbare Ziele gibt es dort
    // nicht, und zwei Ecken sind beim Elfmeter ohnehin die klassische Wahl.
    expect(eckenAnzahl('L01')).toBe(2);
    expect(eckenAnzahl('L25')).toBe(9);
  });

  it('gibt für jede Ecke ein Feld im Gitter', () => {
    for (const n of [2, 3, 6, 9] as const) {
      expect(benutzteEcken(n)).toHaveLength(n);
      expect(new Set(benutzteEcken(n)).size).toBe(n);
    }
  });

  it('wird nie kleiner, je weiter man kommt', () => {
    let vorher = 0;
    for (const lesson of allLessons()) {
      const jetzt = eckenAnzahl(lesson.id);
      expect(jetzt, lesson.id).toBeGreaterThanOrEqual(vorher);
      vorher = jetzt;
    }
  });
});

describe('Ladetext', () => {
  it('nimmt nur gelernte Zeichen, in jeder Lektion', () => {
    for (const lesson of allLessons()) {
      const erlaubt = new Set([...lesson.chars, ' ']);
      for (const c of ladetext(lesson.id, 'saat', STUFEN[1]!)) {
        expect(erlaubt.has(c), `${lesson.id}: '${c}' ist nicht gelernt`).toBe(true);
      }
    }
  });

  /**
   * **Der Text muss zu schaffen sein.** Vorher liefen sechzig zufällige
   * Zeichen durch, die nie endeten — man tippte, bis die Uhr ablief, ohne je
   * ein Ende zu sehen. Jetzt ist er so lang, wie sich in der Ladezeit schaffen
   * lässt: Wer ihn zu Ende tippt, schießt sofort und mit voller Kraft.
   */
  it('ist so lang, wie sich in der Ladezeit schaffen lässt', () => {
    for (const s of STUFEN) {
      const text = ladetext('L20', 'saat', s);
      const ziel = erreichbareAnschlaege(s);
      expect(text.length, s.id).toBeGreaterThanOrEqual(ziel);
      /**
       * **Und nicht wesentlich darüber.** Ganze Wörter treffen die Ziellänge
       * selten genau; der Rest ist unvermeidlich. Er muss aber klein bleiben:
       * Am 2026-09-20 wurden aus dreizehn Zeichen neunzehn, und damit aus 100
       * verlangten Anschlägen je Minute 143 — die Stufe hätte dann etwas
       * anderes bedeutet als das, was auf ihr steht.
       */
      expect(text.length, s.id).toBeLessThanOrEqual(ziel + 5);
    }
  });

  it('gibt die volle Kraft, wenn man ihn schafft', () => {
    for (const s of STUFEN) {
      const text = ladetext('L20', 'saat', s);
      expect(kraft(text.length, text.length), s.id).toBe(1);
    }
  });

  /**
   * **Ohne das wären die Stufen wirkungslos.** Der Text ist so lang, wie sich
   * in der Ladezeit schaffen lässt — hinge die Länge nur an der Zeit, würde er
   * auf der schweren Stufe einfach mitschrumpfen, und alle drei Stufen
   * verlangten dasselbe Tempo. Genau so war es beim ersten Anlauf am
   * 2026-09-20. `zielTempo` ist die Zahl, die das verhindert.
   */
  it('verlangt auf der schweren Stufe ein höheres Tempo', () => {
    const tempo = (s: (typeof STUFEN)[number]): number =>
      erreichbareAnschlaege(s) / (s.ladezeitMs / 60_000);
    expect(tempo(STUFEN[2]!)).toBeGreaterThan(tempo(STUFEN[1]!));
    expect(tempo(STUFEN[1]!)).toBeGreaterThan(tempo(STUFEN[0]!));
  });

  /**
   * **Ein Spiel darf nicht mehr verlangen als der Kurs.** Die Tempi stammen
   * aus `curriculum.ts` (`targetStrokesMin`) — dem, was dort der dritte Stern
   * fordert. „Schwer" ist so schnell wie das Schnellste im ganzen Lernpfad;
   * schneller wäre keine Übung mehr, sondern eine Mauer.
   *
   * Beim ersten Anlauf am 2026-09-20 stand „leicht" auf 100 A/min und damit
   * über dem letzten Lektionsstern des ganzen Kurses.
   */
  it('bleibt beim Tempo innerhalb dessen, was der Lernpfad fordert', () => {
    const schnellste = Math.max(...allLessons().map((l) => thresholdsFor(l.id)!.targetStrokesMin));
    for (const s of STUFEN) {
      expect(s.zielTempo, s.id).toBeLessThanOrEqual(schnellste);
    }
    // Und die leichteste Stufe nicht ueber dem, was am Anfang verlangt wird.
    expect(STUFEN[0]!.zielTempo).toBeLessThanOrEqual(thresholdsFor('L01')!.targetStrokesMin);
  });

  /** Wörter statt Buchstabensuppe: daran erkennt man es an den Leerzeichen. */
  it('besteht aus Wörtern, sobald die Lektion welche hergibt', () => {
    const text = ladetext('L20', 'saat', STUFEN[1]!);
    expect(text).toContain(' ');
    expect(text.trim()).toBe(text);
  });

  /** Aus zwei Buchstaben gibt es keine Wörter — dann eben Gruppen mit Pausen. */
  it('kommt auch in der ersten Lektion zu einem Text', () => {
    const text = ladetext('L01', 'saat', STUFEN[1]!);
    expect(text.length).toBeGreaterThan(0);
    expect(new Set([...text.replace(/ /g, '')])).toEqual(new Set(['f', 'j']));
  });

  it('hält sich an die gewählten Tasten', () => {
    const text = ladetext('L20', 'saat', STUFEN[1]!, ['d', 'k']);
    expect(new Set([...text.replace(/ /g, '')])).toEqual(new Set(['d', 'k']));
  });
});

describe('Schusskraft', () => {
  it('ist null ohne einen einzigen Anschlag', () => {
    expect(kraft(0, 12)).toBe(0);
  });

  it('steigt mit den Anschlägen und bleibt bei eins stehen', () => {
    expect(kraft(5, 12)).toBeLessThan(kraft(10, 12));
    expect(kraft(9999, 12)).toBe(1);
  });

  /**
   * Bezugsgröße ist die Zeile. Dieselbe Zahl Anschläge ist bei einer längeren
   * Zeile weniger wert — und die Zeile ist länger, je höher das `zielTempo`
   * der Stufe ist. So steckt die Schwierigkeit an einer Stelle statt an zweien.
   */
  it('rechnet gegen die Länge der Zeile', () => {
    expect(kraft(8, 16)).toBeLessThan(kraft(8, 10));
    expect(kraft(8, 16)).toBe(0.5);
  });

  /**
   * **Die Zusage muss genau stimmen.** „Schaff die Zeile, dann schießt du mit
   * voller Kraft" ist nur dann wahr, wenn die volle Kraft beim **letzten**
   * Zeichen erreicht wird und nicht schon vorher. Bis zum 2026-09-20 wurde
   * gegen eine berechnete Wunschzahl gerechnet: Auf „leicht" war die Zeile
   * zwölf Zeichen lang und die Wunschzahl acht — die letzten vier Zeichen
   * waren wirkungslos.
   */
  it('erreicht die volle Kraft genau am Ende der Zeile, nicht vorher', () => {
    for (const s of STUFEN) {
      const text = ladetext('L20', 'saat', s);
      expect(kraft(text.length, text.length), s.id).toBe(1);
      expect(kraft(text.length - 1, text.length), s.id).toBeLessThan(1);
    }
  });
});

describe('Torwart und Tor', () => {
  it('springt immer in eine der neun Ecken', () => {
    const rnd = createRandom('torwart');
    for (let i = 0; i < 200; i++) {
      expect(ECKEN).toContain(torwartEcke('oben-links', STUFEN[1]!, rnd));
    }
  });

  /**
   * Die Stufe muss wirken. Würfelte der Torwart einfach aus allen neun, läge
   * die Trefferquote bei elf Prozent und „schwer" wäre nur ein Wort.
   */
  it('trifft auf der schweren Stufe deutlich öfter als auf der leichten', () => {
    const quote = (stufe: (typeof STUFEN)[number]): number => {
      const rnd = createRandom(`quote#${stufe.id}`);
      let richtig = 0;
      for (let i = 0; i < 2000; i++) {
        if (torwartEcke('mitte-mitte', stufe, rnd) === 'mitte-mitte') richtig++;
      }
      return richtig / 2000;
    };
    expect(quote(STUFEN[2]!)).toBeGreaterThan(quote(STUFEN[0]!) + 0.15);
  });

  it('zählt ein Tor, wenn der Torwart woanders hinspringt', () => {
    expect(torchance('oben-links', 'unten-rechts', 1, STUFEN[2]!)).toBe(1);
  });

  /**
   * **Der Test, der aus dem Spiel ein Tippspiel macht.**
   *
   * Bis zum 2026-09-20 ging ein Schuss in die leere Ecke *immer* hinein, auch
   * mit Kraft null. Nachgerechnet hieß das: Wer überhaupt nichts tippt, trifft
   * auf „leicht" in vier von fünf Fällen und selbst auf „schwer" in jedem
   * zweiten. Der Nutzer hat gesagt, das Spiel erfülle seinen Zweck nicht — und
   * das war der Grund: Das Tippen war Beiwerk, gewonnen hat der Würfel.
   */
  it('lässt einen Schuss ohne Kraft auch in der leeren Ecke nicht hinein', () => {
    for (const stufe of STUFEN) {
      expect(torchance('oben-links', 'unten-rechts', 0, stufe), stufe.id).toBe(0);
      expect(torchance('oben-links', 'unten-rechts', MINDESTKRAFT, stufe), stufe.id).toBe(0);
    }
  });

  /**
   * Die Gegenprobe zur Zahl oben: Wer nichts tippt, trifft nie — egal wohin
   * der Torwart springt und egal auf welcher Stufe.
   */
  it('macht aus Nichtstun nie ein Tor', () => {
    const glueck = (): number => 0;
    for (const stufe of STUFEN) {
      for (const ecke of ECKEN) {
        expect(istTor('oben-links', ecke, 0, stufe, glueck), `${stufe.id}/${ecke}`).toBe(false);
      }
    }
  });

  /**
   * Der Wunsch des Nutzers vom 2026-09-18: Je schneller getippt, desto
   * wahrscheinlicher geht der Ball rein.
   *
   * Vorher war es eine harte Schwelle — knapp darunter hielt der Torwart
   * immer, knapp darüber nie. Zwei fast gleiche Runden führten zu völlig
   * verschiedenen Ergebnissen, ohne dass man den Unterschied merkte.
   */
  it('lässt die Chance mit der Schusskraft steigen', () => {
    const stufe = STUFEN[1]!;
    const chance = (k: number): number => torchance('oben-links', 'oben-links', k, stufe);
    expect(chance(0)).toBe(0);
    expect(chance(0.4)).toBeGreaterThan(0);
    expect(chance(0.6)).toBeGreaterThan(chance(0.4));
    expect(chance(1)).toBe(1);
  });

  it('ist auf der schweren Stufe bei gleicher Kraft unwahrscheinlicher', () => {
    const k = 0.6;
    expect(torchance('oben-links', 'oben-links', k, STUFEN[2]!)).toBeLessThan(
      torchance('oben-links', 'oben-links', k, STUFEN[0]!),
    );
  });

  it('hält ohne Aufladen jede richtig geratene Ecke', () => {
    const nie = (): number => 0.999;
    for (const stufe of STUFEN) {
      expect(istTor('mitte-mitte', 'mitte-mitte', 0, stufe, nie), stufe.id).toBe(false);
    }
  });

  it('lässt einen sicheren Schuss unabhängig vom Würfel durch', () => {
    const stufe = STUFEN[1]!;
    const pech = (): number => 0.999;
    expect(istTor('oben-links', 'oben-links', 1, stufe, pech)).toBe(true);
    expect(istTor('oben-links', 'unten-rechts', 1, stufe, pech)).toBe(true);
  });

  it('kennt nur Ecken aus der Liste', () => {
    const alle: readonly Ecke[] = ECKEN;
    expect(alle.every((e) => typeof e === 'string')).toBe(true);
    expect(getLesson('L01')).toBeDefined();
  });
});

/**
 * Die Ziellänge muss über **alle** Lektionen und Stufen halten, nicht nur in
 * `L20`. Der Zeichenvorrat entscheidet mit, welche Wörter zur Verfügung stehen
 * — und damit, wie genau sich die Länge treffen lässt.
 */
describe('Ladetext über den ganzen Lernpfad', () => {
  it('trifft die Ziellänge überall annähernd', () => {
    for (const lesson of allLessons()) {
      for (const s of STUFEN) {
        for (const saat of ['a', 'b', 'c']) {
          const text = ladetext(lesson.id, saat, s);
          const ziel = erreichbareAnschlaege(s);
          const wo = `${lesson.id}/${s.id}/${saat}: "${text}"`;
          expect(text.length, wo).toBeGreaterThanOrEqual(ziel);
          expect(text.length, wo).toBeLessThanOrEqual(ziel + 5);
        }
      }
    }
  });
});
