/**
 * Tastaturprüfung beim ersten Start (SPEC.md 7.4, NORMEN.md 3.1).
 *
 * **Warum der Lernpfad so lange gesperrt bleibt:** Liegt ein anderes Layout an
 * als T1, stimmt jede einzelne Taste nicht. Das Kind greift nach der Anleitung
 * richtig und bekommt trotzdem den falschen Buchstaben — und hält sich für
 * ungeschickt, obwohl der Rechner falsch eingestellt ist. Diese Ursache kann
 * ein Zehnjähriger unmöglich finden.
 *
 * Der Ton ist deshalb wichtig: **Der erste Satz nach einem Fehlschlag sagt,
 * dass das Kind nichts falsch gemacht hat.** Erst danach kommt, was zu tun ist.
 *
 * Es gibt trotzdem einen Ausweg („Trotzdem weitermachen"). Eine Sperre ohne
 * Ausweg wäre eine Sackgasse, und die sind ausgeschlossen (ARCHITEKTUR.md).
 */

import { useCallback, useEffect, useState } from 'react';
import {
  LAYOUT_PROBES,
  evaluateLayout,
  istHilfstaste,
  type Keystroke,
  type LayoutResult,
} from '../../lib/layout-check';
import { Keyboard } from '../typing/Keyboard';
import { Hands } from '../typing/Hands';
import { de } from '../../i18n/de';

export interface LayoutCheckProps {
  /** Die Prüfung ist bestanden — oder die Nutzerin geht bewusst weiter. */
  readonly onDone: (bestanden: boolean) => void;
}

export function LayoutCheck({ onDone }: LayoutCheckProps) {
  const [eingaben, setEingaben] = useState<Keystroke[]>([]);
  const [ergebnis, setErgebnis] = useState<LayoutResult | null>(null);

  const aktuelleProbe = LAYOUT_PROBES[eingaben.length];

  const neuStarten = useCallback(() => {
    setEingaben([]);
    setErgebnis(null);
  }, []);

  useEffect(() => {
    if (ergebnis) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      // Umschalt, Strg und Alt erzeugen kein Zeichen und werden beim Greifen
      // nach dem at-Zeichen zwangslaeufig mitgedrueckt. Wuerden sie eine Probe
      // verbrauchen, scheiterte die Pruefung an sich selbst.
      if (istHilfstaste(event.key)) return;
      // Tab und Eingabe wuerden den Fokus verschieben.
      if (event.key === 'Tab' || event.key === 'Enter') return;
      event.preventDefault();

      const naechste = [...eingaben, { key: event.key, code: event.code }];
      setEingaben(naechste);
      if (naechste.length >= LAYOUT_PROBES.length) setErgebnis(evaluateLayout(naechste));
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [eingaben, ergebnis]);

  if (ergebnis?.bestanden) {
    return (
      <Rahmen>
        <h1 className="text-2xl font-semibold text-richtig">{de.tastaturtest.geschafft}</h1>
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            autoFocus
            onClick={() => onDone(true)}
            className="rounded-lg bg-akzent px-6 py-3 text-lg font-semibold text-white hover:opacity-90"
          >
            {de.tastaturtest.weiter}
          </button>
        </div>
      </Rahmen>
    );
  }

  if (ergebnis) {
    return (
      <Gescheitert ergebnis={ergebnis} onNochmal={neuStarten} onTrotzdem={() => onDone(false)} />
    );
  }

  return (
    <Rahmen>
      <h1 className="text-2xl font-semibold">{de.tastaturtest.titel}</h1>
      <p className="mt-2 leading-relaxed text-gedaempft">{de.tastaturtest.warum}</p>

      <p className="mt-8 text-sm text-gedaempft">
        {de.tastaturtest.fortschritt(eingaben.length, LAYOUT_PROBES.length)}
      </p>

      <p className="mt-2 text-lg">{de.tastaturtest.aufforderung}</p>
      <p className="mt-4 text-center">
        <span className="inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-akzent font-tippen text-6xl font-bold text-white">
          {aktuelleProbe?.char}
        </span>
      </p>
      {aktuelleProbe?.altgr && (
        <p className="mt-3 text-center text-sm font-semibold text-akzent">
          {de.tastaturtest.altgrHinweis}
        </p>
      )}

      <div className="mt-8 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <Keyboard nextChar={aktuelleProbe?.char} showHint />
        </div>
        <div className="w-56 shrink-0">
          <Hands nextChar={aktuelleProbe?.char} />
        </div>
      </div>
    </Rahmen>
  );
}

function Gescheitert({
  ergebnis,
  onNochmal,
  onTrotzdem,
}: {
  ergebnis: LayoutResult;
  onNochmal: () => void;
  onTrotzdem: () => void;
}) {
  const verdachtstext =
    ergebnis.verdacht === 'us'
      ? de.tastaturtest.verdachtUs
      : ergebnis.verdacht === 'schweiz'
        ? de.tastaturtest.verdachtSchweiz
        : null;

  return (
    <Rahmen>
      <h1 className="text-2xl font-semibold">{de.tastaturtest.gescheitertTitel}</h1>

      {/* Der Trost kommt zuerst. Ein Kind, dem die App den Weg versperrt,
          sucht die Schuld sonst bei sich. */}
      <p className="mt-3 leading-relaxed">{de.tastaturtest.gescheitertTrost}</p>
      <p className="mt-2 leading-relaxed text-gedaempft">{de.tastaturtest.gescheitertFolge}</p>
      {verdachtstext && <p className="mt-2 leading-relaxed text-gedaempft">{verdachtstext}</p>}

      <section className="mt-6 rounded-2xl border border-akzent/30 bg-akzent/10 p-6">
        <h2 className="font-semibold text-akzent">{de.tastaturtest.anleitungTitel}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed">
          {de.tastaturtest.anleitung.map((schritt) => (
            <li key={schritt}>{schritt}</li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-gedaempft">{de.tastaturtest.elternHinweis}</p>
      </section>

      <table className="mt-6 w-full text-sm">
        <tbody>
          {LAYOUT_PROBES.map((probe) => {
            const e = ergebnis.ergebnisse.get(probe.char);
            const ok = e?.kind === 'ok';
            return (
              <tr key={probe.char} className="border-t border-rand">
                <td className="py-2 font-tippen text-lg">{probe.char}</td>
                <td className="py-2">
                  {ok ? (
                    <span className="text-richtig">richtig</span>
                  ) : (
                    <span className="text-falsch">
                      {e && 'bekommen' in e && e.bekommen
                        ? `stattdessen: ${e.bekommen}`
                        : 'nicht erkannt'}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onTrotzdem}
            className="text-sm text-gedaempft underline hover:text-text"
          >
            {de.tastaturtest.trotzdemWeiter}
          </button>
          <p className="mt-1 max-w-xs text-xs text-gedaempft">
            {de.tastaturtest.trotzdemWeiterErklaerung}
          </p>
        </div>
        <button
          type="button"
          autoFocus
          onClick={onNochmal}
          className="rounded-lg bg-akzent px-6 py-3 text-lg font-semibold text-white hover:opacity-90"
        >
          {de.tastaturtest.nochmal}
        </button>
      </div>
    </Rahmen>
  );
}

function Rahmen({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-rand bg-flaeche p-8">
        {children}
      </div>
    </div>
  );
}
