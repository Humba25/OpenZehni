/**
 * Eine Einheit aus dem freien Modulbereich (SPEC.md 10).
 *
 * Ablauf wie dort vorgegeben: kurze Erklärung → interaktive Aufgabe →
 * Auswertung. Drei bis fünf Minuten, kein Tipp-Drill.
 *
 * **Bewertet wird nichts.** Gespeichert wird genau ein Wahrheitswert je
 * Einheit: abgeschlossen. Ob die Aufgabe beim ersten Versuch saß, ist kein
 * Ergebnis, das irgendwohin gehört (MODUL-LERNEN.md 5, SPEC.md 6.6.1).
 */

import { useState } from 'react';
import { bloeckeFuer, type ModulEinheit } from '../../lib/module';
import {
  QuizAufgabe,
  ZuordnenAufgabe,
  UmschreibenAufgabe,
  TastenkuerzelAufgabe,
  WaageAufgabe,
  TextprobeAufgabe,
} from './Aufgaben';
import { de } from '../../i18n/de';

export interface EinheitScreenProps {
  readonly einheit: ModulEinheit;
  /**
   * Bestimmt, ob die einfache Fassung gezeigt wird (`SPEC.md` 9.8).
   *
   * Unter vierzehn ist einfache Sprache Pflicht, nicht Kür — die Kernzielgruppe
   * ist die fünfte Klasse. Welche Fassung gilt, entscheidet `bloeckeFuer()`
   * und nicht diese Komponente.
   */
  readonly ageBand: string;
  readonly onFertig: () => void;
  readonly onAbbrechen: () => void;
}

type Schritt = { name: 'erklaerung' } | { name: 'aufgabe' } | { name: 'aufloesung' };

export function EinheitScreen({ einheit, ageBand, onFertig, onAbbrechen }: EinheitScreenProps) {
  const [schritt, setSchritt] = useState<Schritt>({ name: 'erklaerung' });
  const [richtig, setRichtig] = useState(false);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold">{einheit.title}</h1>
          <button
            type="button"
            onClick={onAbbrechen}
            className="shrink-0 rounded-lg border border-rand px-3 py-1.5 text-sm text-gedaempft hover:text-text"
          >
            {de.einheit.abbrechen}
          </button>
        </header>

        {schritt.name === 'erklaerung' && (
          <section>
            <div className="grid gap-4">
              {bloeckeFuer(einheit, ageBand).map((b, i) => (
                <p key={i} className="leading-relaxed">
                  {b}
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSchritt({ name: 'aufgabe' })}
              autoFocus
              className="mt-8 rounded-xl bg-akzent px-5 py-2.5 font-semibold text-white"
            >
              {de.einheit.zurAufgabe}
            </button>
          </section>
        )}

        {schritt.name === 'aufgabe' && (
          <section className="rounded-2xl border border-rand bg-flaeche/40 p-5">
            <Aufgabenform
              einheit={einheit}
              onFertig={(r) => {
                setRichtig(r);
                setSchritt({ name: 'aufloesung' });
              }}
            />
          </section>
        )}

        {schritt.name === 'aufloesung' && (
          <section>
            {/* Ohne Haeme und ohne Note: Wer danebenlag, liest dasselbe wie
                jemand, der getroffen hat -- nur den ersten Satz nicht. */}
            {richtig && <p className="font-semibold text-richtig">{de.einheit.richtig}</p>}

            <div className="mt-3 rounded-2xl border border-akzent/30 bg-akzent/10 p-5">
              <p className="text-sm font-semibold text-akzent">{de.einheit.aufloesung}</p>
              <p className="mt-2 leading-relaxed">{erklaerungVon(einheit)}</p>
            </div>

            <p className="mt-5 leading-relaxed">{einheit.abschluss}</p>

            <button
              type="button"
              onClick={onFertig}
              autoFocus
              className="mt-8 rounded-xl bg-akzent px-5 py-2.5 font-semibold text-white"
            >
              {de.einheit.fertig}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

/** Die Erklärung steckt in jeder Aufgabenform unter demselben Namen. */
function erklaerungVon(einheit: ModulEinheit): string {
  return einheit.aufgabe.erklaerung;
}

/** Wählt die passende Aufgabenform. */
function Aufgabenform({
  einheit,
  onFertig,
}: {
  einheit: ModulEinheit;
  onFertig: (richtig: boolean) => void;
}) {
  const a = einheit.aufgabe;
  switch (a.art) {
    case 'quiz':
      return <QuizAufgabe aufgabe={a} onFertig={onFertig} />;
    case 'zuordnen':
      return <ZuordnenAufgabe aufgabe={a} onFertig={onFertig} />;
    case 'umschreiben':
      return <UmschreibenAufgabe aufgabe={a} onFertig={onFertig} />;
    case 'tastenkuerzel':
      return <TastenkuerzelAufgabe aufgabe={a} onFertig={onFertig} />;
    case 'waage':
      return <WaageAufgabe aufgabe={a} onFertig={onFertig} />;
    case 'textprobe':
      return <TextprobeAufgabe aufgabe={a} onFertig={onFertig} />;
  }
}
