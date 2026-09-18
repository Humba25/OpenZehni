/**
 * Minispiel „Buchstabenregen" (SPEC.md 8.10).
 *
 * Buchstaben fallen von oben, die richtige Taste fängt sie ab. Umsetzung als
 * DOM ohne Spiel-Engine und ohne neue Abhängigkeit, wie die Spec es verlangt
 * (Performance-Budget 12.1).
 *
 * **Drei Fehlversuche, dann ist die Runde vorbei** (seit 2026-09-18,
 * Entscheidung des Nutzers). Keine Uhr mehr: Ein Countdown, der etwas beendet,
 * ist ausdrücklich unerwünscht (SPEC.md 8.11). Jetzt hängt das Ende daran, wie
 * gut man ist, und die nächste Runde beginnt sofort.
 *
 * Das sind **keine Leben, die den Zugang begrenzen** — das verbietet 8.11 und
 * es bleibt verboten. Nach der dritten verpassten Taste ist die Runde zu Ende,
 * nicht das Spiel.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMemo } from 'react';
import {
  regenGruppenBis,
  regenVorrat,
  naechstesZeichen,
  tempo,
  SPERRE_MS,
  createRandom,
  REGEN_LEBEN,
} from '../../lib/minispiele';
import { de } from '../../i18n/de';

/** Ein Buchstabe auf dem Weg nach unten. */
interface Tropfen {
  readonly id: number;
  readonly zeichen: string;
  /** Waagerechte Lage in Prozent. */
  readonly links: number;
  /** Zeitstempel des Abwurfs. */
  readonly start: number;
  /**
   * Wie lange **dieser** Buchstabe fällt.
   *
   * Je Tropfen und nicht global: Zieht das Spiel an, während er unterwegs ist,
   * würde er sonst mitten im Flug schneller — und wäre plötzlich woanders, als
   * er eben noch war.
   */
  readonly dauerMs: number;
}

/** Die Optik eines Auswahlknopfes. Steht hier, damit sie nicht zweimal dasteht. */
const knopf = (aktiv: boolean): string =>
  [
    'rounded-lg border px-3 py-1 text-sm transition-colors',
    aktiv ? 'border-akzent bg-akzent/10 font-semibold' : 'border-rand hover:border-akzent',
  ].join(' ');

/** Wie oft die Anzeige neu gerechnet wird. 20 Bilder je Sekunde reichen. */
const TAKT_MS = 50;

export interface BuchstabenregenProps {
  /** Aus deren Zeichenvorrat fällt es — nur Gelerntes (SPEC.md 8.10). */
  readonly lessonId: string;
  readonly saat: string;
  readonly onBeenden: (gefangen: number) => void;
}

export function Buchstabenregen({ lessonId, saat, onBeenden }: BuchstabenregenProps) {
  /**
   * Welche Tastenreihe fällt. Die Auswahl steht **im Spiel**, nicht davor: So
   * funktioniert sie auch, wenn die Runde aus dem Lernweg heraus beginnt, und
   * man kann zwischen zwei Runden wechseln, ohne das Spiel zu verlassen.
   */
  const gruppen = useMemo(() => regenGruppenBis(lessonId), [lessonId]);

  /**
   * Die gewählten Gruppen. **Leer heißt alles** — das ist die Vorgabe und das
   * Verhalten von vorher. Mehrfachauswahl ist hier der Kern: „vielleicht nur
   * d k, oder vielleicht d f j k."
   */
  const [gewaehlt, setGewaehlt] = useState<ReadonlySet<string>>(new Set());
  const [tropfen, setTropfen] = useState<readonly Tropfen[]>([]);
  /**
   * Die Auswahl steht **vor** dem Spiel, nicht daneben.
   *
   * Bis zum 2026-09-18 lag sie über der Spielfläche und blieb während des
   * Fallens stehen. Wer sie las, verpasste Buchstaben; wer spielte, sah sie
   * nicht. Ein Startbild löst beides: Dort ist Zeit zum Lesen, und die Regeln
   * stehen dabei — auch die Eingabesperre, damit sie niemand erst durch ihre
   * Folgen kennenlernt.
   */
  const [laeuft, setLaeuft] = useState(false);

  const [gefangen, setGefangen] = useState(0);
  const [verpasst, setVerpasst] = useState(0);
  /** Bis wann die Eingabe nach einem Fehlgriff gesperrt ist. */
  const [gesperrtBis, setGesperrtBis] = useState(0);
  const [jetzt, setJetzt] = useState(() => performance.now());

  const vorrat = useRef<readonly string[]>([]);
  vorrat.current = regenVorrat(lessonId, gruppen, gewaehlt);
  const rnd = useRef(createRandom(`regen#${lessonId}#${saat}`));
  const naechsteId = useRef(0);
  const letzterAbwurf = useRef(0);

  /**
   * Spiegel des Zustands für den Tastendruck.
   *
   * Ein Tastendruck muss wissen, was **jetzt** fällt, und darf nicht in einer
   * Zustandsfunktion nebenbei zählen: Die kann React zweimal aufrufen, und dann
   * zählte ein Treffer doppelt.
   */
  const gesperrtRef = useRef(0);
  const tropfenRef = useRef<readonly Tropfen[]>([]);
  const setzeTropfen = useCallback((neu: readonly Tropfen[]): void => {
    tropfenRef.current = neu;
    setTropfen(neu);
  }, []);

  const vorbei = verpasst >= REGEN_LEBEN;

  /**
   * Sofort wieder spielbar — das ist der Unterschied zwischen „Runde vorbei"
   * und „Zugang begrenzt" (SPEC.md 8.11). Ohne diesen Knopf wäre das Ende eine
   * Sackgasse, und genau die soll es nirgends geben (ARCHITEKTUR.md).
   */
  const neuStarten = useCallback((): void => {
    setzeTropfen([]);
    setGefangen(0);
    setVerpasst(0);
    setGesperrtBis(0);
    gesperrtRef.current = 0;
    naechsteId.current = 0;
    letzterAbwurf.current = 0;
    setJetzt(performance.now());
    setLaeuft(true);
  }, [setzeTropfen]);

  /** Zurueck zum Startbild, um die Tasten neu zu waehlen. */
  const zurueckZurAuswahl = useCallback((): void => {
    setzeTropfen([]);
    setGefangen(0);
    setVerpasst(0);
    setGesperrtBis(0);
    gesperrtRef.current = 0;
    setLaeuft(false);
  }, [setzeTropfen]);

  // Der Spieltakt: neue Buchstaben abwerfen, unten angekommene entfernen.
  // Jeder Tropfen merkt sich seine eigene Falldauer: Zieht das Spiel an,
  // waehrend er faellt, wuerde er sonst mitten im Flug schneller.
  useEffect(() => {
    if (!laeuft || vorbei) return;

    const id = window.setInterval(() => {
      const t = performance.now();
      setJetzt(t);
      const { abwurfMs } = tempo(gefangen);

      // Unten angekommen: kostet einen Versuch.
      const durch = tropfenRef.current.filter((x) => t - x.start >= x.dauerMs);
      let neu = tropfenRef.current.filter((x) => t - x.start < x.dauerMs);
      if (durch.length > 0) setVerpasst((n) => n + durch.length);

      if (t - letzterAbwurf.current >= abwurfMs) {
        const zeichen = naechstesZeichen(vorrat.current, rnd.current);
        if (zeichen !== undefined) {
          letzterAbwurf.current = t;
          neu = [
            ...neu,
            {
              id: naechsteId.current++,
              zeichen,
              links: 6 + rnd.current() * 84,
              start: t,
              dauerMs: tempo(gefangen).falldauerMs,
            },
          ];
        }
      }

      setzeTropfen(neu);
    }, TAKT_MS);

    return () => window.clearInterval(id);
  }, [laeuft, vorbei, gefangen, setzeTropfen]);

  const fangen = useCallback(
    (zeichen: string) => {
      const alte = tropfenRef.current;

      // Der unterste passende Buchstabe zuerst: Er ist am naechsten dran, unten
      // anzukommen. Frueher abgeworfen heisst weiter unten.
      let index = -1;
      for (let i = 0; i < alte.length; i++) {
        if (alte[i]!.zeichen !== zeichen) continue;
        if (index === -1 || alte[i]!.start < alte[index]!.start) index = i;
      }
      // Daneben gegriffen: kurze Sperre. Sie steht als Regel auf dem
      // Startbild -- eine Folge, die man erst im Spiel kennenlernt, waere eine
      // Falle statt einer Regel (SPEC.md 8.11).
      if (index === -1) {
        gesperrtRef.current = performance.now() + SPERRE_MS;
        setGesperrtBis(gesperrtRef.current);
        return;
      }

      setzeTropfen(alte.filter((_, i) => i !== index));
      setGefangen((n) => n + 1);
    },
    [setzeTropfen],
  );

  useEffect(() => {
    if (vorbei) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === 'Escape') {
        onBeenden(gefangen);
        return;
      }
      if (event.key.length !== 1) return;
      event.preventDefault();
      // Waehrend der Sperre passiert nichts. Kein Ton, keine Meldung -- man
      // sieht es an der Spielflaeche.
      if (performance.now() < gesperrtRef.current) return;
      fangen(event.key);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [vorbei, fangen, gefangen, onBeenden]);

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 p-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">{de.minispiele.buchstabenregen.titel}</h1>
          <p className="text-sm text-gedaempft">{de.minispiele.buchstabenregen.beschreibung}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gedaempft">
          <span className="tabular-nums">{de.minispiele.buchstabenregen.gefangen(gefangen)}</span>
          <span className="tabular-nums">
            {de.minispiele.buchstabenregen.leben(Math.max(0, REGEN_LEBEN - verpasst))}
          </span>
        </div>
      </header>

      {!laeuft ? (
        <Startbild
          gruppen={gruppen}
          gewaehlt={gewaehlt}
          onUmschalten={(id) => {
            const neu = new Set(gewaehlt);
            if (neu.has(id)) neu.delete(id);
            else neu.add(id);
            setGewaehlt(neu);
          }}
          onAlles={() => setGewaehlt(new Set())}
          onLosgehen={neuStarten}
        />
      ) : (
        <>
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-rand bg-flaeche">
            {!vorbei &&
              tropfen.map((x) => {
                const anteil = Math.min(1, (jetzt - x.start) / x.dauerMs);
                return (
                  <span
                    key={x.id}
                    className="absolute font-tippen text-3xl font-semibold text-akzent"
                    style={{ left: `${x.links}%`, top: `${anteil * 88}%` }}
                  >
                    {x.zeichen}
                  </span>
                );
              })}

            {/* Die Sperre wird gezeigt, nicht nur gefuehlt: Ohne Anzeige haelt man
            eine tote Tastatur fuer einen Fehler. */}
            {!vorbei && gesperrtBis > jetzt && (
              <div className="absolute inset-0 grid place-items-center bg-korrigiert/10">
                <span className="rounded-lg bg-korrigiert px-4 py-2 font-semibold text-white">
                  {de.minispiele.buchstabenregen.danebem}
                </span>
              </div>
            )}

            {vorbei && (
              <div className="grid h-full place-items-center p-6 text-center">
                <div>
                  <p className="text-sm text-gedaempft">{de.minispiele.buchstabenregen.verloren}</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {de.minispiele.buchstabenregen.ergebnis(gefangen)}
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={neuStarten}
                      className="rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
                    >
                      {de.minispiele.buchstabenregen.nochmal}
                    </button>
                    <button
                      type="button"
                      onClick={zurueckZurAuswahl}
                      className="rounded-xl border border-rand px-5 py-2 hover:border-akzent"
                    >
                      {de.minispiele.buchstabenregen.andereTasten}
                    </button>
                  </div>
                  <p className="mt-4 text-sm text-gedaempft">{de.minispiele.xpHinweis}</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onBeenden(gefangen)}
          className="rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
        >
          {vorbei || !laeuft ? de.minispiele.beenden : de.minispiele.zurueck}
        </button>
      </div>
    </div>
  );
}

/**
 * Das Startbild: Tasten wählen, Regeln lesen, losgehen.
 *
 * **Vor dem Spiel, nicht daneben.** Bis zum 2026-09-18 stand die Auswahl über
 * der Spielfläche und blieb während des Fallens stehen — wer sie las,
 * verpasste Buchstaben. Hier ist Zeit dafür.
 *
 * Und hier stehen die Regeln, **bevor** sie wirken: dass drei durchgerutschte
 * Buchstaben die Runde beenden, dass ein Fehlgriff kurz sperrt und dass es
 * schneller wird. Eine Regel, die man erst durch ihre Folgen kennenlernt, ist
 * keine Regel, sondern eine Falle.
 */
function Startbild({
  gruppen,
  gewaehlt,
  onUmschalten,
  onAlles,
  onLosgehen,
}: {
  gruppen: readonly { id: string; zeichen: readonly string[] }[];
  gewaehlt: ReadonlySet<string>;
  onUmschalten: (id: string) => void;
  onAlles: () => void;
  onLosgehen: () => void;
}) {
  return (
    <section className="flex-1 overflow-y-auto rounded-2xl border border-rand bg-flaeche p-6">
      <h2 className="text-lg font-semibold">{de.minispiele.buchstabenregen.gruppeFrage}</h2>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={gewaehlt.size === 0}
          onClick={onAlles}
          className={knopf(gewaehlt.size === 0)}
        >
          {de.minispiele.buchstabenregen.gruppeAlles}
        </button>

        {gruppen.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={gewaehlt.has(g.id)}
            onClick={() => onUmschalten(g.id)}
            className={`${knopf(gewaehlt.has(g.id))} font-tippen`}
          >
            {g.zeichen.join(' ')}
          </button>
        ))}
      </div>

      <ul className="mt-6 space-y-1 text-sm text-gedaempft">
        <li>{de.minispiele.buchstabenregen.regelLeben}</li>
        <li>{de.minispiele.buchstabenregen.regelSperre}</li>
        <li>{de.minispiele.buchstabenregen.regelTempo}</li>
      </ul>

      <button
        type="button"
        onClick={onLosgehen}
        className="mt-6 rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
      >
        {de.minispiele.buchstabenregen.losgehen}
      </button>
    </section>
  );
}
