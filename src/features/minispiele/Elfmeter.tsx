/**
 * Minispiel „Elfmeterschießen" (SPEC.md 8.10.1).
 *
 * Drei Zustände je Schuss: Ecke wählen, aufladen, Ergebnis. Umsetzung als
 * DOM/SVG ohne Spiel-Engine und ohne neue Abhängigkeit, wie 8.10 es verlangt
 * (Performance-Budget 12.1).
 *
 * **Die Ecke wird getippt, nicht geklickt.** In jedem der neun Felder steht ein
 * kurzes Wort; wer es tippt, schießt dorthin. Ein Mausklick wäre der einzige
 * Schritt ohne Übung.
 *
 * **Kein Verlieren-Zustand, der den Zugang begrenzt** (8.11). Ein gehaltener
 * Schuss ist ein gehaltener Schuss, die nächste Runde beginnt sofort.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ECKEN,
  STUFEN,
  SCHUESSE_PRO_RUNDE,
  zielwoerter,
  ladezeichen,
  kraft,
  torwartEcke,
  istTor,
  type Ecke,
  type Stufe,
} from '../../lib/elfmeter';
import { createRandom } from '../../lib/minispiele';
import { de } from '../../i18n/de';

type Phase = 'zielen' | 'laden' | 'ergebnis';

export interface ElfmeterProps {
  /** Aus deren Zeichenvorrat kommen Wörter und Ladezeichen (SPEC.md 8.10). */
  readonly lessonId: string;
  readonly saat: string;
  readonly onBeenden: (tore: number) => void;
}

export function Elfmeter({ lessonId, saat, onBeenden }: ElfmeterProps) {
  const [stufe, setStufe] = useState<Stufe>(STUFEN[1]!);
  const [schuss, setSchuss] = useState(0);
  const [tore, setTore] = useState(0);
  const [phase, setPhase] = useState<Phase>('zielen');

  const [ziel, setZiel] = useState<Ecke | undefined>(undefined);
  const [torwart, setTorwart] = useState<Ecke | undefined>(undefined);
  const [getroffen, setGetroffen] = useState(false);
  const [tippfortschritt, setTippfortschritt] = useState(0);
  const [ladeAnteil, setLadeAnteil] = useState(0);

  /** Eigene Saat je Schuss, damit nicht fünfmal dieselben Wörter kommen. */
  const runde = `${saat}#${schuss}`;
  const woerter = useMemo(() => zielwoerter(lessonId, runde), [lessonId, runde]);
  const zeichen = useMemo(() => ladezeichen(lessonId, runde), [lessonId, runde]);

  const eingabe = useRef('');
  const anschlaege = useRef(0);
  const zeichenIndex = useRef(0);
  const zufall = useRef(createRandom(`torwart#${saat}`));

  const vorbei = schuss >= SCHUESSE_PRO_RUNDE;

  const neueRunde = useCallback((): void => {
    setSchuss(0);
    setTore(0);
    setPhase('zielen');
    setZiel(undefined);
    setTorwart(undefined);
    eingabe.current = '';
  }, []);

  /** Der Schuss ist abgegeben: Torwart springt, Ergebnis steht. */
  const abschliessen = useCallback(
    (gewaehlt: Ecke): void => {
      const schusskraft = kraft(anschlaege.current, stufe.ladezeitMs);
      const springt = torwartEcke(gewaehlt, stufe, zufall.current);
      const tor = istTor(gewaehlt, springt, schusskraft, stufe);
      setTorwart(springt);
      setGetroffen(tor);
      if (tor) setTore((n) => n + 1);
      setPhase('ergebnis');
    },
    [stufe],
  );

  // Die Ladeuhr. Sie laeuft einmal durch und gibt den Schuss frei.
  useEffect(() => {
    if (phase !== 'laden' || ziel === undefined) return;
    const beginn = performance.now();
    const id = window.setInterval(() => {
      const anteil = Math.min(1, (performance.now() - beginn) / stufe.ladezeitMs);
      setLadeAnteil(anteil);
      if (anteil >= 1) {
        window.clearInterval(id);
        abschliessen(ziel);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [phase, ziel, stufe, abschliessen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      if (event.key === 'Escape') {
        onBeenden(tore);
        return;
      }

      if (phase === 'ergebnis') {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (vorbei) return;
          setSchuss((n) => n + 1);
          setPhase('zielen');
          setZiel(undefined);
          setTorwart(undefined);
          eingabe.current = '';
        }
        return;
      }

      if (event.key.length !== 1) return;
      event.preventDefault();

      if (phase === 'zielen') {
        // Buchstabe fuer Buchstabe: Sobald die Eingabe zu keinem Feld mehr
        // passt, faengt sie von vorn an. Kein Fehlerton, kein Abzug -- es ist
        // nur eine Zielwahl (SPEC.md 8.11).
        const versuch = eingabe.current + event.key;
        const treffer = woerter.findIndex((w) => w === versuch);
        if (treffer >= 0) {
          eingabe.current = '';
          anschlaege.current = 0;
          zeichenIndex.current = 0;
          setTippfortschritt(0);
          setLadeAnteil(0);
          setZiel(ECKEN[treffer]!);
          setPhase('laden');
          return;
        }
        eingabe.current = woerter.some((w) => w.startsWith(versuch)) ? versuch : '';
        setTippfortschritt(eingabe.current.length);
        return;
      }

      // Aufladen: Jedes richtige Zeichen zaehlt, falsche werden ignoriert.
      if (event.key === zeichen[zeichenIndex.current]) {
        zeichenIndex.current += 1;
        anschlaege.current += 1;
        setTippfortschritt(zeichenIndex.current);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, woerter, zeichen, tore, vorbei, onBeenden]);

  const schusskraft = kraft(anschlaege.current, stufe.ladezeitMs);

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 p-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">{de.minispiele.elfmeter.titel}</h1>
          <p className="text-sm text-gedaempft">{de.minispiele.elfmeter.beschreibung}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gedaempft">
          <span className="tabular-nums">
            {de.minispiele.elfmeter.schuss(
              Math.min(schuss + 1, SCHUESSE_PRO_RUNDE),
              SCHUESSE_PRO_RUNDE,
            )}
          </span>
          <span className="tabular-nums">{de.minispiele.elfmeter.tore(tore)}</span>
        </div>
      </header>

      {/* Schwierigkeit. Ein Wechsel beginnt die Runde neu -- mitten im
          Schiessen die Regeln zu tauschen, waere nicht nachvollziehbar. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gedaempft">{de.minispiele.elfmeter.stufeFrage}</span>
        {STUFEN.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={s.id === stufe.id}
            onClick={() => {
              setStufe(s);
              neueRunde();
            }}
            className={[
              'rounded-lg border px-3 py-1 text-sm transition-colors',
              s.id === stufe.id
                ? 'border-akzent bg-akzent/10 font-semibold'
                : 'border-rand hover:border-akzent',
            ].join(' ')}
          >
            {de.minispiele.elfmeter.stufen[s.id]}
          </button>
        ))}
      </div>

      <section className="flex-1 rounded-2xl border border-rand bg-flaeche p-6">
        {vorbei ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <p className="text-2xl font-semibold">
                {de.minispiele.elfmeter.ergebnis(tore, SCHUESSE_PRO_RUNDE)}
              </p>
              <button
                type="button"
                onClick={neueRunde}
                className="mt-4 rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
              >
                {de.minispiele.elfmeter.nochmal}
              </button>
              <p className="mt-4 text-sm text-gedaempft">{de.minispiele.xpHinweis}</p>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-3 text-center text-sm text-gedaempft">
              {phase === 'zielen'
                ? de.minispiele.elfmeter.zielen
                : phase === 'laden'
                  ? de.minispiele.elfmeter.laden
                  : getroffen
                    ? de.minispiele.elfmeter.tor
                    : de.minispiele.elfmeter.gehalten}
            </p>

            {/* Das Tor: neun Felder, in jedem ein Wort. */}
            <div className="mx-auto grid max-w-xl grid-cols-3 gap-2 rounded-xl border-4 border-text/70 bg-grund p-2">
              {ECKEN.map((ecke, i) => {
                const istZiel = ziel === ecke;
                const istTorwart = torwart === ecke;
                return (
                  <div
                    key={ecke}
                    className={[
                      'grid h-16 place-items-center rounded-lg border text-lg',
                      istZiel && phase !== 'zielen'
                        ? 'border-akzent bg-akzent/20 font-semibold'
                        : 'border-rand',
                      istTorwart ? 'ring-2 ring-korrigiert' : '',
                    ].join(' ')}
                  >
                    {phase === 'zielen' ? (
                      <span className="font-tippen">
                        <span className="font-semibold text-akzent">
                          {woerter[i]?.slice(0, tippfortschritt) ?? ''}
                        </span>
                        {woerter[i]?.slice(tippfortschritt) ?? ''}
                      </span>
                    ) : istTorwart ? (
                      <span aria-hidden>🧤</span>
                    ) : istZiel ? (
                      <span aria-hidden>⚽</span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {phase === 'laden' && (
              <div className="mx-auto mt-6 max-w-xl">
                <p className="text-center font-tippen text-2xl tracking-widest">
                  <span className="text-gedaempft/40">
                    {zeichen.slice(Math.max(0, zeichenIndex.current - 4), zeichenIndex.current)}
                  </span>
                  <span className="font-semibold text-akzent">{zeichen[zeichenIndex.current]}</span>
                  <span>{zeichen.slice(zeichenIndex.current + 1, zeichenIndex.current + 8)}</span>
                </p>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-rand/50">
                  <div
                    className="h-full rounded-full bg-akzent transition-[width] duration-100"
                    style={{ width: `${schusskraft * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-center text-xs text-gedaempft">
                  {de.minispiele.elfmeter.kraft(Math.round(schusskraft * 100))}
                  {' · '}
                  {de.minispiele.elfmeter.zeit(
                    Math.ceil((1 - ladeAnteil) * (stufe.ladezeitMs / 1000)),
                  )}
                </p>
              </div>
            )}

            {phase === 'ergebnis' && (
              <p className="mt-6 text-center text-sm text-gedaempft">
                {de.minispiele.elfmeter.weiter}
              </p>
            )}
          </>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onBeenden(tore)}
          className="rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
        >
          {vorbei ? de.minispiele.beenden : de.minispiele.zurueck}
        </button>
      </div>
    </div>
  );
}
