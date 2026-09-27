/**
 * Minispiel „Elfmeterschießen" (SPEC.md 8.10, 8.10.1).
 *
 * Idee des Nutzers vom 2026-09-18. Der Ablauf einer Runde:
 *
 *   1. **Ecke wählen** — neun Felder, in jedem steht ein kurzes Wort. Wer es
 *      tippt, schießt dorthin.
 *   2. **Schuss aufladen** — für ein paar Sekunden laufen Zeichen durch; jedes
 *      getroffene lädt den Schuss weiter auf.
 *   3. **Der Torwart springt.** Rät er richtig, hält er — es sei denn, der
 *      Schuss ist hart genug.
 *
 * **Warum die Ecke getippt und nicht geklickt wird.** Ein Mausklick ist der
 * einzige Schritt ohne Übung. Steht in jedem Feld ein Wort, ist auch die
 * Zielwahl Tipparbeit — und die Entscheidung bleibt trotzdem beim Kind.
 *
 * Die Schranken aus 8.10 gelten unverändert:
 *
 * - **Nur bereits gelernte Zeichen** (harte Regel aus 6.2). Sowohl die Wörter
 *   in den Feldern als auch die Zeichen beim Aufladen kommen aus dem Vorrat
 *   der Lektion.
 * - **Unbewertet.** Dieses Modul rechnet Treffer aus, sonst nichts. Es gibt
 *   hier keine Funktion, die ein Ergebnis nach `sessions`, `lesson_progress`
 *   oder `char_stats` tragen könnte.
 * - **Kein Verlieren-Zustand, der den Zugang begrenzt.** Ein gehaltener Schuss
 *   ist ein gehaltener Schuss; die nächste Runde beginnt sofort.
 *
 * Reine Logik: kein React, kein Tauri, kein Datenbankzugriff
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import { getLesson } from './curriculum';
import { createRandom } from './minispiele';
import { drillWoerter } from './drill';

/** Die neun Ecken des Tores, von oben links nach unten rechts. */
export const ECKEN = [
  'oben-links',
  'oben-mitte',
  'oben-rechts',
  'mitte-links',
  'mitte-mitte',
  'mitte-rechts',
  'unten-links',
  'unten-mitte',
  'unten-rechts',
] as const;

export type Ecke = (typeof ECKEN)[number];

/** Wie viele Schüsse eine Runde hat. Wie beim echten Elfmeterschießen. */
export const SCHUESSE_PRO_RUNDE = 5;

/**
 * Wie viele Ecken das Tor **in dieser Lektion** hat.
 *
 * **Warum nicht immer neun.** Bis zum 2026-09-20 gab es neun Felder, egal wie
 * wenige Zeichen die Lektion kennt. In `L01` standen darin `ff`, `jf`, `jj`,
 * `jjj`, `ffj`, `fjf`, `jfj`, `fj`, `jff` — neun Felder, die sich nur in der
 * Anordnung zweier Buchstaben unterscheiden. Das ist keine Zielwahl mehr,
 * sondern ein Suchbild, und zwar ein böses.
 *
 * Die Zahl der Ecken richtet sich deshalb danach, wie viele **klar
 * unterscheidbare** Wörter der Vorrat hergibt: drei Ecken, solange die Wörter
 * aus zwei oder drei Zeichen bestehen, sechs bei etwas mehr Auswahl, neun erst
 * dann, wenn echte Wörter zur Verfügung stehen.
 */
export function eckenAnzahl(lessonId: string): EckenZahl {
  const lesson = getLesson(lessonId);
  if (!lesson) return 2;

  const vorrat = [...new Set([...lesson.chars])].filter((c) => c !== ' ' && c !== '\n');
  const echte = drillWoerter(lesson.chars).filter((w) => w.length >= 3 && w.length <= 6);
  // Verschiedene Anfangsbuchstaben sind das, was ein Feld auf einen Blick
  // vom Nachbarfeld trennt.
  const anfaenge = new Set(echte.map((w) => w[0]));

  if (echte.length >= 20 && anfaenge.size >= 6) return 9;
  if (echte.length >= 8 && anfaenge.size >= 4) return 6;
  // **Nie mehr Felder als Anfangsbuchstaben.** `L01` kennt `f` und `j` — mehr
  // als zwei unterscheidbare Ziele gibt es dort nicht, und zwei Ecken sind
  // beim Elfmeter ohnehin die klassische Wahl.
  return vorrat.length >= 3 ? 3 : 2;
}

/** Wie viele Felder das Tor haben kann. */
export type EckenZahl = 2 | 3 | 6 | 9;

/**
 * Welche Felder des 3×3-Gitters bei weniger als neun Ecken benutzt werden.
 *
 * Zwei und drei Ecken liegen auf der mittleren Höhe, sechs auf den beiden
 * oberen Reihen — so bleibt das Tor ein Tor und wird nicht zu einer Reihe
 * Kästchen.
 */
export function benutzteEcken(anzahl: EckenZahl): readonly Ecke[] {
  if (anzahl === 9) return ECKEN;
  if (anzahl === 6) return ECKEN.slice(0, 6);
  if (anzahl === 3) return ['mitte-links', 'mitte-mitte', 'mitte-rechts'];
  return ['mitte-links', 'mitte-rechts'];
}

/**
 * Eine Schwierigkeitsstufe.
 *
 * Drei Stellschrauben, alle mit derselben Richtung: Je schwerer, desto weniger
 * Zeit zum Aufladen, desto öfter rät der Torwart richtig, und desto härter muss
 * der Schuss sein, um trotzdem hineinzugehen.
 */
export interface Stufe {
  readonly id: 'leicht' | 'mittel' | 'schwer';
  /** Wie lange das Aufladen dauert. */
  readonly ladezeitMs: number;
  /**
   * Welches Tempo der Ladetext verlangt, in Anschlägen je Minute.
   *
   * **Das ist die eigentliche Schwierigkeit.** Der Text ist so lang, wie sich
   * in der Ladezeit mit diesem Tempo schaffen lässt — ohne diese Zahl wäre die
   * kürzere Ladezeit der schweren Stufe wirkungslos, weil der Text einfach
   * mitschrumpfen würde. Genau so war es beim ersten Anlauf am 2026-09-20.
   */
  readonly zielTempo: number;
  /** Wie oft der Torwart die richtige Ecke errät, zwischen 0 und 1. */
  readonly trefferquote: number;
  /**
   * Wie hart ein Schuss sein muss, damit er trotz richtig geratener Ecke
   * **sicher** hineingeht.
   *
   * Darunter entscheidet die Kraft anteilig mit (siehe `torchance()`) — bis
   * zum 2026-09-18 war es eine harte Schwelle: knapp darunter hielt der Torwart
   * immer, knapp darüber nie. Der Nutzer hat gebeten, dass schnelleres Tippen
   * die Wahrscheinlichkeit erhöht, und das ist auch das bessere Spielgefühl.
   */
  readonly durchschuss: number;
}

/**
 * Die drei Stufen.
 *
 * **Die Tempi sind nicht erfunden, sondern aus dem Lernpfad genommen**
 * (`curriculum.ts`, `targetStrokesMin`): 60 Anschläge je Minute verlangt dort
 * der dritte Stern in `L01`–`L09`, 100 in `L14`–`L19`, 140 in `L24`. „Schwer"
 * ist damit genau so schnell wie das Schnellste, was der Lernpfad überhaupt je
 * fordert — und nicht schneller.
 *
 * Beim ersten Anlauf am 2026-09-20 standen hier 100/160/220. „Leicht" hätte
 * damit mehr verlangt als der letzte Lektionsstern des ganzen Kurses. Zahlen,
 * die niemand nachgerechnet hat, werden gern zu hoch.
 */
export const STUFEN: readonly Stufe[] = [
  { id: 'leicht', ladezeitMs: 10_000, zielTempo: 60, trefferquote: 0.2, durchschuss: 0.6 },
  { id: 'mittel', ladezeitMs: 8000, zielTempo: 100, trefferquote: 0.35, durchschuss: 0.75 },
  { id: 'schwer', ladezeitMs: 6000, zielTempo: 140, trefferquote: 0.5, durchschuss: 0.9 },
];

/**
 * Die neun Wörter für die Felder.
 *
 * Stehen genug echte Wörter zur Verfügung, werden die kürzesten genommen — ein
 * langes Wort zum Zielen wäre eine Geduldsprobe, keine Zielwahl. Sonst entstehen
 * kurze Zeichenfolgen aus dem Vorrat der Lektion; in `L01` gibt es nur `f` und
 * `j`, und auch damit muss es gehen.
 *
 * **Alle neun sind verschieden.** Zwei gleiche Felder wären nicht auflösbar.
 */
export function zielwoerter(lessonId: string, saat: string): readonly string[] {
  const lesson = getLesson(lessonId);
  if (!lesson) return [];

  const anzahl = eckenAnzahl(lessonId);
  const rnd = createRandom(`elfmeter#${lessonId}#${saat}`);
  const echte = drillWoerter(lesson.chars)
    .filter((w) => w.length <= 6)
    .sort((a, b) => a.length - b.length);

  const gewaehlt: string[] = [];
  const gesehen = new Set<string>();
  /**
   * Ein Anfangsbuchstabe je Feld.
   *
   * **Das ist der eigentliche Unterschied zu vorher.** Zwei Felder, die beide
   * mit `f` beginnen, zwingen dazu, beim Tippen des ersten Buchstabens noch
   * nicht zu wissen, wohin der Schuss geht — und beim zweiten umzudenken. Mit
   * lauter verschiedenen Anfängen steht die Ecke mit dem ersten Anschlag fest.
   */
  const anfaenge = new Set<string>();

  for (const wort of mischen(echte.slice(0, 60), rnd)) {
    if (gewaehlt.length >= anzahl) break;
    if (gesehen.has(wort) || anfaenge.has(wort[0]!)) continue;
    gesehen.add(wort);
    anfaenge.add(wort[0]!);
    gewaehlt.push(wort);
  }

  // Auffuellen mit kurzen Zeichenfolgen, solange nicht genug beisammen sind.
  // Auch hier: jeder Anfangsbuchstabe nur einmal.
  const vorrat = [...new Set([...lesson.chars])].filter((c) => c !== ' ' && c !== '\n');
  const frei = vorrat.filter((c) => !anfaenge.has(c));
  let notbremse = 0;
  while (gewaehlt.length < anzahl && frei.length > 0 && notbremse++ < 500) {
    const anfang = frei.shift()!;
    const laenge = 2 + Math.floor(rnd() * 2);
    let wort = anfang;
    for (let i = 1; i < laenge; i++) wort += vorrat[Math.floor(rnd() * vorrat.length)];
    if (gesehen.has(wort)) continue;
    gesehen.add(wort);
    anfaenge.add(anfang);
    gewaehlt.push(wort);
  }

  return gewaehlt;
}

/**
 * Wie viele Anschläge in der Ladezeit erreichbar sind.
 *
 * Bezugsgröße für die Schusskraft **und** für die Länge des Ladetexts: Wer den
 * Text schafft, hat einen vollen Schuss. Damit ist das Ziel sichtbar, statt
 * gefühlt zu sein.
 */
export function erreichbareAnschlaege(stufe: Stufe): number {
  return Math.max(1, Math.round((stufe.ladezeitMs / 60_000) * stufe.zielTempo));
}

/**
 * Der Text, der beim Aufladen zu tippen ist.
 *
 * **Wörter, keine Buchstabensuppe.** Bis zum 2026-09-20 lief hier eine Folge
 * von sechzig zufälligen Einzelzeichen durch, die nie endete — man tippte, bis
 * die Uhr abgelaufen war. Das ist kein Üben, sondern Hacken: keine Wortgrenze,
 * kein Rhythmus, kein Ziel, und vor allem kein Ende, das man erreichen könnte.
 *
 * Jetzt steht dort eine Zeile aus echten Wörtern der Lektion, genau so lang,
 * wie sich in der Ladezeit schaffen lässt. **Wer sie zu Ende tippt, schießt
 * sofort und mit voller Kraft** — der Schuss gehört damit dem Kind und nicht
 * der Uhr.
 *
 * `erlaubt` schränkt auf die gewählten Tastengruppen ein (Wunsch des Nutzers
 * vom 2026-09-18). Lassen sich daraus keine Wörter bilden — bei zwei
 * Buchstaben gibt es keine —, entstehen kurze Gruppen mit Leerzeichen dazwischen.
 * Auch das ist besser als ein Strom ohne Pause.
 */
export function ladetext(
  lessonId: string,
  saat: string,
  stufe: Stufe,
  erlaubt?: readonly string[],
): string {
  const lesson = getLesson(lessonId);
  if (!lesson) return '';

  const ziel = erreichbareAnschlaege(stufe);
  const rnd = createRandom(`laden#${lessonId}#${saat}`);

  const vorrat =
    erlaubt && erlaubt.length > 0
      ? erlaubt
      : [...new Set([...lesson.chars])].filter((c) => c !== ' ' && c !== '\n');
  if (vorrat.length === 0) return '';

  // Echte Woerter nur, wenn sie ausschliesslich aus den erlaubten Zeichen
  // bestehen -- sonst stuende dort ein Buchstabe, den das Kind abgewaehlt hat.
  const erlaubteZeichen = new Set(vorrat);
  const woerter = drillWoerter(lesson.chars).filter(
    (w) => w.length >= 2 && w.length <= 7 && [...w].every((c) => erlaubteZeichen.has(c)),
  );

  const teile: string[] = [];
  let laenge = 0;

  // `laenge` zaehlt die Laenge der fertigen Zeile: das erste Teil ohne
  // Leerzeichen, jedes weitere mit einem davor.
  if (woerter.length >= 4) {
    const gemischt = mischen(woerter, rnd);
    let i = 0;
    while (laenge < ziel) {
      const rest = ziel - laenge - (teile.length === 0 ? 0 : 1);
      /**
       * Das Wort nehmen, das dem Rest am nächsten kommt — nicht einfach das
       * nächste aus der Liste.
       *
       * Sonst hängt am Ende ein langes Wort an, und die Zeile schießt über
       * ihr Ziel hinaus: Am 2026-09-20 wurden aus dreizehn Zeichen neunzehn,
       * und damit aus 100 verlangten Anschlägen je Minute 143. Die Stufe hätte
       * dann etwas anderes bedeutet als das, was auf ihr steht.
       */
      const vorheriges = teile[teile.length - 1];
      const auswahl = gemischt.slice(i, i + 12).filter((w) => w !== vorheriges);
      const wort = (auswahl.length > 0 ? auswahl : gemischt.slice(i, i + 12)).reduce((a, b) =>
        Math.abs(b.length - rest) < Math.abs(a.length - rest) ? b : a,
      );
      laenge += teile.length === 0 ? wort.length : wort.length + 1;
      teile.push(wort);
      i = (i + 1) % gemischt.length;
    }
  } else {
    // Notfall: kurze Gruppen aus dem Vorrat, mit Leerzeichen dazwischen.
    while (laenge < ziel) {
      const gruppe = Array.from(
        { length: 3 + Math.floor(rnd() * 2) },
        () => vorrat[Math.floor(rnd() * vorrat.length)]!,
      ).join('');
      laenge += teile.length === 0 ? gruppe.length : gruppe.length + 1;
      teile.push(gruppe);
    }
  }

  return teile.join(' ');
}

/**
 * Wie hart der Schuss geworden ist, zwischen 0 und 1.
 *
 * **Bezugsgröße ist die Zeile selbst:** Wer sie ganz tippt, hat den vollen
 * Schuss, wer die Hälfte schafft, den halben. Damit stimmt die Zusage „schaff
 * die Zeile, dann schießt du mit voller Kraft" genau — und zwar durch die
 * Bauweise, nicht durch eine gut gewählte Zahl.
 *
 * Bis zum 2026-09-20 wurde gegen eine berechnete Wunschzahl gerechnet. Die
 * passte fast nie zur Zeile: Auf „leicht" war die Zeile zwölf Zeichen lang,
 * die Wunschzahl acht — nach acht Zeichen war der Schuss voll, und die
 * restlichen vier waren sinnlos.
 *
 * Die Schwierigkeit steckt jetzt allein dort, wo sie hingehört: in der Länge
 * der Zeile und der Zeit, die dafür bleibt (`ladetext`, `zielTempo`).
 */
export function kraft(getippt: number, textLaenge: number): number {
  if (textLaenge <= 0) return 0;
  return Math.max(0, Math.min(1, getippt / textLaenge));
}

/**
 * Wohin der Torwart springt.
 *
 * Mit der Trefferquote der Stufe rät er richtig, sonst greift er irgendwohin
 * anders. **Nicht einfach zufällig aus allen neun**: Dann läge die Trefferquote
 * bei gut elf Prozent und die Stufe hätte keine Wirkung.
 */
export function torwartEcke(gewaehlt: Ecke, stufe: Stufe, rnd: () => number): Ecke {
  if (rnd() < stufe.trefferquote) return gewaehlt;
  const andere = ECKEN.filter((e) => e !== gewaehlt);
  return andere[Math.floor(rnd() * andere.length)]!;
}

/**
 * Ab welcher Schusskraft ein Schuss überhaupt gefährlich wird.
 *
 * **Das ist die Zahl, die das Spiel zu einem Tippspiel macht.** Bis zum
 * 2026-09-20 ging ein Schuss in die leere Ecke *immer* hinein, auch mit Kraft
 * null. Nachgerechnet hieß das: Wer gar nichts tippt, trifft auf „leicht" in
 * vier von fünf Fällen und selbst auf „schwer" in jedem zweiten. Das Tippen
 * war Beiwerk; der Nutzer hat am 2026-09-20 gesagt, das Spiel erfülle seinen
 * Zweck nicht, und das war der Grund.
 *
 * Unterhalb dieser Schwelle rollt der Ball dem Torwart in die Arme, egal wohin
 * er gesprungen ist.
 */
export const MINDESTKRAFT = 0.25;

/**
 * Wie wahrscheinlich der Schuss hineingeht, zwischen 0 und 1.
 *
 * Zwei Dinge müssen stimmen: Der Schuss muss **Schwung** haben, und er muss
 * am Torwart vorbei. Springt der Torwart woanders hin, entscheidet allein der
 * Schwung; springt er richtig, zusätzlich die Härte (`durchschuss`).
 *
 * **Warum anteilig und nicht als Schwelle.** Vorher galt: knapp darunter hielt
 * der Torwart immer, knapp darüber nie. Zwei fast gleiche Runden führten zu
 * völlig verschiedenen Ergebnissen, ohne dass man den Unterschied merkte. Jetzt
 * zahlt sich jeder zusätzliche Anschlag ein Stück aus.
 */
export function torchance(
  gewaehlt: Ecke,
  torwart: Ecke,
  schusskraft: number,
  stufe: Stufe,
): number {
  // Ein Schuss ohne Schwung ist auch in der leeren Ecke keiner: Der Torwart
  // kommt noch heran. Siehe MINDESTKRAFT.
  const schwung = Math.max(0, Math.min(1, (schusskraft - MINDESTKRAFT) / (1 - MINDESTKRAFT)));
  if (schwung <= 0) return 0;

  if (gewaehlt !== torwart) return schwung;
  if (stufe.durchschuss <= 0) return schwung;

  // **Multipliziert, nicht das Kleinere von beiden.** Mit `Math.min` hätte im
  // mittleren Bereich immer der Schwung gewonnen, und die Schwierigkeitsstufe
  // wäre dort wirkungslos gewesen -- „leicht" und „schwer" gäben dieselbe
  // Zahl. So zählen beide Bedingungen.
  const haerte = Math.max(0, Math.min(1, schusskraft / stufe.durchschuss));
  return schwung * haerte;
}

/**
 * Ist der Schuss drin?
 *
 * Der Würfel kommt von außen, damit das Ergebnis reproduzierbar bleibt und
 * sich prüfen lässt.
 */
export function istTor(
  gewaehlt: Ecke,
  torwart: Ecke,
  schusskraft: number,
  stufe: Stufe,
  rnd: () => number,
): boolean {
  const chance = torchance(gewaehlt, torwart, schusskraft, stufe);
  return chance >= 1 || rnd() < chance;
}

function mischen<T>(liste: readonly T[], rnd: () => number): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j]!, kopie[i]!];
  }
  return kopie;
}
