import { describe, it, expect } from 'vitest';
import { provideText, pickSeedText, pickFact, allTopics, topicsWithContent } from './text-provider';
import { allLessons, getLesson } from './curriculum';
import seed from '../../content/topics.seed.json';

describe('provideText — SPEC.md 4.1 und 9.7', () => {
  /**
   * Die harte Regel: In keinem Übungstext einer Lektion darf ein Zeichen
   * vorkommen, das erst später eingeführt wird. Das gilt für **jeden** Weg,
   * über den ein Text hereinkommt.
   */
  it('liefert für jede Lektion, jedes Thema und jede Altersstufe nur erlaubte Zeichen', () => {
    for (const lesson of allLessons()) {
      const erlaubt = new Set([...lesson.chars]);
      for (const topic of allTopics()) {
        for (const ageBand of ['A1', 'A2', 'A3'] as const) {
          for (let attempt = 0; attempt < 6; attempt++) {
            const { body } = provideText({
              lessonId: lesson.id,
              topicId: topic.id,
              ageBand,
              attempt,
            });
            for (const char of body) {
              expect(
                erlaubt.has(char),
                `${lesson.id}/${topic.id}/${ageBand}: '${char}' ist dort noch nicht gelernt`,
              ).toBe(true);
            }
          }
        }
      }
    }
  });

  it('nimmt in den engen Lektionen immer einen Drilltext', () => {
    for (const id of ['L01', 'L02', 'L06', 'L14', 'L20', 'L22']) {
      const t = provideText({ lessonId: id, topicId: 'tiere', ageBand: 'A2', attempt: 0 });
      expect(t.source, id).toBe('drill');
    }
  });

  it('nimmt in den deckungsgleichen Lektionen einen Thementext', () => {
    for (const id of ['L04', 'L05', 'L12', 'L13', 'L19', 'L21', 'L23', 'L24', 'L25']) {
      const t = provideText({ lessonId: id, topicId: 'tiere', ageBand: 'A2', attempt: 0 });
      expect(t.source, id).toBe('seed');
      expect(t.topicId).toBe('tiere');
    }
  });

  /**
   * Der Rückfall muss greifen, **ohne dass die Nutzerin etwas merkt**
   * (SPEC.md 4.1). Geprüft mit einem Thema, das es nicht gibt — früher stand
   * hier `kochen`, weil es noch leer war. Ein Test, der an einer Inhaltslücke
   * hängt, fällt in dem Moment, in dem jemand die Lücke schließt, und prüft
   * damit einen Zustand statt einer Regel.
   */
  it('weicht stumm auf einen Drilltext aus, wenn es zum Thema nichts gibt', () => {
    const t = provideText({ lessonId: 'L05', topicId: 'gibtesnicht', ageBand: 'A2', attempt: 0 });
    expect(t.source).toBe('drill');
    expect(t.body.length).toBeGreaterThan(0);
  });

  it('liefert auch ganz ohne Thema einen Text', () => {
    const t = provideText({ lessonId: 'L05', ageBand: 'A2', attempt: 0 });
    expect(t.body.length).toBeGreaterThan(0);
  });

  it('wirft bei einer unbekannten Lektion', () => {
    expect(() => provideText({ lessonId: 'L99', ageBand: 'A2', attempt: 0 })).toThrow();
  });

  /**
   * Zwei Versuche derselben Lektion dürfen nicht denselben Text bekommen —
   * sonst übt ein Kind beim zweiten Anlauf auswendig statt zu schreiben.
   *
   * Die Prüfung stand früher darauf, dass `tiere` in S3 **genau einen**
   * A2-Text hat, und erwartete dort denselben Rückgabewert. Diese Annahme ist
   * am 2026-09-16 mit dem Aufstocken des Seeds auf den Pflichtteil von 40
   * Texten je Thema verfallen (SPEC.md 9.6). Ein Test, der die Knappheit des
   * Bestands festschreibt, geht kaputt, sobald der Bestand wächst — deshalb
   * steht hier jetzt die Eigenschaft, um die es wirklich geht.
   */
  it('liefert bei verschiedenen Versuchen verschiedene Texte', () => {
    for (const lessonId of ['L04', 'L19']) {
      const gesehen = new Set(
        [0, 1, 2].map(
          (attempt) => provideText({ lessonId, topicId: 'tiere', ageBand: 'A2', attempt }).body,
        ),
      );
      expect(gesehen.size, `${lessonId} wiederholt sich zwischen den Versuchen`).toBe(3);
    }
  });

  it('liefert bei gleichem Versuch immer denselben Text', () => {
    const req = { lessonId: 'L04', topicId: 'tiere', ageBand: 'A2' as const, attempt: 3 };
    expect(provideText(req).body).toBe(provideText(req).body);
  });
});

describe('Altersstufen und Rückfall — SPEC.md 9.8', () => {
  it('nimmt in S1 und S2 die altersneutralen Texte für jede Stufe', () => {
    const a1 = pickSeedText('tiere', 'S1', 'A1', 0);
    const a2 = pickSeedText('tiere', 'S1', 'A2', 0);
    const a3 = pickSeedText('tiere', 'S1', 'A3', 0);
    expect(a1).toBeDefined();
    expect(a1).toBe(a2);
    expect(a2).toBe(a3);
  });

  it('unterscheidet ab S3 nach Altersstufe', () => {
    const a1 = pickSeedText('tiere', 'S3', 'A1', 0);
    const a2 = pickSeedText('tiere', 'S3', 'A2', 0);
    const a3 = pickSeedText('tiere', 'S3', 'A3', 0);
    expect(new Set([a1, a2, a3]).size).toBe(3);
  });

  it('gibt für jüngere Kinder kürzere Sätze aus als für ältere', () => {
    const a1 = pickSeedText('weltall', 'S4', 'A1', 0)!;
    const a3 = pickSeedText('weltall', 'S4', 'A3', 0)!;
    const woerterProSatz = (t: string): number => {
      const saetze = t.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      return t.split(/\s+/).length / saetze.length;
    };
    expect(woerterProSatz(a1)).toBeLessThan(woerterProSatz(a3));
  });

  it('gibt für ein unbekanntes Thema nichts zurück', () => {
    expect(pickSeedText('gibtesnicht', 'S3', 'A2', 0)).toBeUndefined();
  });

  it('fällt bei fehlender Altersstufe auf die Nachbarstufe zurück', () => {
    // S1 und S2 sind altersneutral. Wer dort nach A1 fragt, bekommt trotzdem
    // einen Text -- ueber den Rueckfall auf "alle".
    for (const band of ['A1', 'A2', 'A3'] as const) {
      expect(pickSeedText('tiere', 'S2', band, 0), band).toBeDefined();
    }
  });
});

describe('Wissenshäppchen — SPEC.md 9.9', () => {
  it('liefert eine Faktenkarte zum Thema', () => {
    expect(pickFact('tiere', 0)).toBeTruthy();
  });

  it('wechselt zwischen den Karten durch', () => {
    const a = pickFact('tiere', 0);
    const b = pickFact('tiere', 1);
    expect(a).not.toBe(b);
  });

  it('gibt für ein unbekanntes Thema nichts zurück', () => {
    expect(pickFact('gibtesnicht', 0)).toBeUndefined();
  });

  it('hat für jedes Thema Karten', () => {
    for (const topic of allTopics()) {
      expect(pickFact(topic.id, 0), topic.id).toBeTruthy();
    }
  });
});

describe('Themenbestand', () => {
  it('kennt die zehn Themen aus SPEC.md 9.1', () => {
    expect(allTopics()).toHaveLength(10);
  });

  /**
   * Seit dem 2026-09-14 haben alle zehn Themen Texte. Der Test hält das fest:
   * Fällt er, ist ein Thema leer geworden — und dann greift für dieses Thema
   * überall der Drill statt des Inhalts, ohne dass es jemandem auffiele.
   */
  it('hat für alle zehn Themen Texte', () => {
    expect(topicsWithContent()).toHaveLength(10);
    for (const topic of allTopics()) {
      expect(topicsWithContent(), topic.id).toContain(topic.id);
    }
  });

  it('deckt für die gefüllten Themen alle Zeichensatzstufen ab', () => {
    for (const topicId of topicsWithContent()) {
      for (const lesson of allLessons().filter((l) => l.textSource === 'topic')) {
        const text = pickSeedText(topicId, lesson.stage, 'A2', 0);
        expect(text, `${topicId} hat nichts fuer ${lesson.stage}`).toBeDefined();
      }
    }
  });

  it('hält die Längenvorgabe aus SPEC.md 9.2 ein', () => {
    for (const topicId of topicsWithContent()) {
      for (const stage of ['S1', 'S2', 'S3', 'S4', 'S5'] as const) {
        for (const age of ['A1', 'A2', 'A3'] as const) {
          const t = pickSeedText(topicId, stage, age, 0);
          if (!t) continue;
          expect(t.length, `${topicId}/${stage}/${age}`).toBeGreaterThanOrEqual(120);
          expect(t.length, `${topicId}/${stage}/${age}`).toBeLessThanOrEqual(320);
        }
      }
    }
  });

  it('benutzt für L25 den vollen Zeichenvorrat', () => {
    const lesson = getLesson('L25')!;
    expect(lesson.stage).toBe('S5');
  });

  /**
   * Der Pflichtteil aus SPEC.md 9.6: **acht Texte je Zeichensatzstufe und
   * Thema** für alles, worauf jede Altersstufe zurückfällt — `alle` in `S1`
   * und `S2`, `A2` ab `S3`. Zusammen 40 Texte je Thema, 400 insgesamt.
   *
   * **Warum acht und nicht weniger.** `provideText` wählt nach Versuchsnummer
   * aus. Bei zwei Texten bekommt ein Kind im dritten Anlauf denselben Text
   * wieder vorgesetzt und schreibt ihn auswendig statt zu tippen. Genau in dem
   * Zustand war der Seed bis zum 2026-09-16: 13 Texte je Thema, in `S3` bis
   * `S5` je **einer** für `A2`.
   *
   * Für `A1` und `A3` gilt seit dem 2026-09-16 dasselbe mit **vier** Texten je
   * Stufe (SPEC.md 9.6). Sie dürften lückenhaft bleiben — der Rückfall aus 9.8
   * fängt jede Lücke ab —, sind es aber nicht mehr, und dabei soll es bleiben.
   */
  it('hat je Thema den Pflichtteil von acht Texten pro Stufe', () => {
    const PFLICHT: readonly (readonly ['S1' | 'S2' | 'S3' | 'S4' | 'S5', 'A2'])[] = [
      ['S1', 'A2'],
      ['S2', 'A2'],
      ['S3', 'A2'],
      ['S4', 'A2'],
      ['S5', 'A2'],
    ];

    for (const topic of allTopics()) {
      for (const [stage, age] of PFLICHT) {
        const verschieden = new Set<string>();
        for (let attempt = 0; attempt < 8; attempt++) {
          const t = pickSeedText(topic.id, stage, age, attempt);
          if (t) verschieden.add(t);
        }
        expect(
          verschieden.size,
          `${topic.id}/${stage} hat nur ${verschieden.size} verschiedene Texte, ` +
            `gefordert sind acht (SPEC.md 9.6).`,
        ).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('hat je Thema vier Texte pro Stufe für A1 und A3', () => {
    for (const topic of allTopics()) {
      for (const stage of ['S3', 'S4', 'S5'] as const) {
        for (const age of ['A1', 'A3'] as const) {
          const verschieden = new Set<string>();
          for (let attempt = 0; attempt < 4; attempt++) {
            const t = pickSeedText(topic.id, stage, age, attempt);
            if (t) verschieden.add(t);
          }
          expect(
            verschieden.size,
            `${topic.id}/${stage}/${age} hat nur ${verschieden.size} verschiedene Texte, ` +
              `gefordert sind vier (SPEC.md 9.6).`,
          ).toBeGreaterThanOrEqual(4);
        }
      }
    }
  });

  /**
   * Der Zielbestand aus SPEC.md 9.6, als eine Zahl. Sie steht hier, damit ein
   * Schwund auffällt, den die Prüfungen oben nicht sehen — sie fragen nur nach
   * den ersten acht beziehungsweise vier Texten je Zelle.
   */
  it('erreicht den Zielbestand von 640 Texten', () => {
    const gesamt = seed.topics.reduce((summe, topic) => summe + topic.texts.length, 0);
    expect(gesamt, 'Zielbestand nach SPEC.md 9.6 sind 640 Texte.').toBeGreaterThanOrEqual(640);
  });

  /**
   * Wie oft kann ein Kind dieselbe Lektion wiederholen, bevor ein Text
   * wiederkommt? Das ist die Zahl, die seit dem Streichen der KI-Texte zählt —
   * der Seed ist die einzige Quelle (SPEC.md 9).
   *
   * Geprüft wird **jede** Altersstufe. Vorher war `A1` und `A3` auf vier Texte
   * beschränkt, weil die Suche bei der ersten nicht leeren Stufe aufhörte,
   * während acht weitere derselben Zeichensatzstufe danebenlagen.
   */
  it('hält für jede Altersstufe mindestens zwölf Texte je Lektion bereit', () => {
    for (const topic of allTopics()) {
      for (const stage of ['S3', 'S4', 'S5'] as const) {
        for (const age of ['A1', 'A2', 'A3'] as const) {
          const verschieden = new Set<string>();
          for (let attempt = 0; attempt < 12; attempt++) {
            const t = pickSeedText(topic.id, stage, age, attempt);
            if (t) verschieden.add(t);
          }
          expect(
            verschieden.size,
            `${topic.id}/${stage}/${age} wiederholt sich schon nach ${verschieden.size} Versuchen.`,
          ).toBeGreaterThanOrEqual(12);
        }
      }
    }
  });

  /**
   * Die eigene Altersstufe kommt zuerst. Sonst bekäme ein Neunjähriger gleich
   * im ersten Versuch einen Text, der für Fünfzehnjährige geschrieben ist
   * (SPEC.md 9.8).
   */
  it('nimmt die eigene Altersstufe zuerst', () => {
    for (const [age, stage] of [
      ['A1', 'S4'],
      ['A3', 'S4'],
    ] as const) {
      const eigene = new Set(
        seed.topics
          .find((t) => t.id === 'tiere')!
          .texts.filter((t) => t.charset === stage && t.age === age)
          .map((t) => t.body),
      );
      for (let attempt = 0; attempt < eigene.size; attempt++) {
        const t = pickSeedText('tiere', stage, age, attempt);
        expect(
          eigene.has(t!),
          `${age}, Versuch ${attempt} greift zu früh auf eine fremde Stufe`,
        ).toBe(true);
      }
    }
  });
});
