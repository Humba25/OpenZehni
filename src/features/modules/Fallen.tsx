/**
 * Die drei Fallen zur Medienkompetenz (SPEC.md 6.6.1 und 10.1).
 *
 * **Die Schutzregeln, die hier nicht verhandelbar sind:**
 *
 * 1. Kein Feld nimmt echte persönliche Daten entgegen. Telefonnummer und
 *    E-Mail stehen fest und sind gesperrt; das Kind spielt eine erfundene
 *    Person. Der Lernmoment ist **der Klick auf Absenden**, nicht das Tippen.
 *    Wer in der Übung seine echte Nummer eintippt, hätte genau den Reflex
 *    geübt, den die Einheit abgewöhnen soll.
 * 2. Frei eingeben lässt sich nur Harmloses — Spitzname, Lieblingstier.
 * 3. **Nichts davon wird gespeichert.** Die Eingaben leben in `useState` und
 *    sind weg, sobald die Einheit verlassen wird. In die Datenbank gehen zwei
 *    Wahrheitswerte: abgeschlossen, Falle erkannt.
 * 4. Die Module sprechen mit keinem Netzwerk.
 * 5. Die Auflösung kommt sofort und ohne Häme. Wer hineintappt, bekommt
 *    dieselbe Aufmerksamkeit wie wer die Falle erkennt.
 * 6. Der ablaufende Zähler droht, bricht aber **nichts** ab. Das ist kein
 *    Verstoß gegen SPEC.md 8.11, sondern dessen Gegenstand: Das Kind soll
 *    lernen, dass solche Zähler Druck vortäuschen.
 */

import { useEffect, useRef, useState } from 'react';
import type { Interlude } from '../../lib/interludes';
import { de } from '../../i18n/de';

export interface FalleProps {
  readonly unit: Interlude;
  /** `erkannt` sagt, ob das Kind die Falle durchschaut hat. */
  readonly onFertig: (erkannt: boolean) => void;
}

/** Erfundene Angaben. Sie stehen fest und sind nicht änderbar (Regel 1). */
const ERFUNDEN = {
  name: 'Mia Beispiel',
  telefon: '0000 1234567',
  schule: 'Grundschule Musterhausen',
} as const;

// ------------------------------------------------------- F1: Der Gewinn

export function FalleGewinn({ unit, onFertig }: FalleProps) {
  const [entschieden, setEntschieden] = useState<boolean | null>(null);
  const [restsekunden, setRestsekunden] = useState(120);

  // Der Zaehler laeuft ab und bleibt dann bei null stehen. Er bricht nichts ab
  // und nimmt nichts weg -- genau darum geht es (Regel 6).
  useEffect(() => {
    if (entschieden !== null) return;
    const t = setInterval(() => setRestsekunden((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [entschieden]);

  if (entschieden !== null) {
    const a = unit.aufloesung as {
      erkanntTitel: string;
      erkanntText: string;
      getapptTitel: string;
      getapptText: string;
      merkmale: string[];
      folgen: string;
    };
    return (
      <Aufloesung
        erkannt={entschieden}
        titel={entschieden ? a.erkanntTitel : a.getapptTitel}
        text={entschieden ? a.erkanntText : a.getapptText}
        merkmale={a.merkmale}
        nachsatz={entschieden ? undefined : a.folgen}
        onFertig={() => onFertig(entschieden)}
      />
    );
  }

  const min = Math.floor(restsekunden / 60);
  const sek = String(restsekunden % 60).padStart(2, '0');

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Bewusst grell und anders als der Rest der App. Genau so sehen solche
          Seiten aus, und genau daran soll man sie erkennen. */}
      <div className="mx-auto max-w-2xl rounded-2xl border-4 border-yellow-400 bg-yellow-50 p-8 text-black">
        <p className="text-center text-5xl">🎉</p>
        <h1 className="mt-2 text-center text-3xl font-extrabold text-red-600">
          {de.fallen.gewinn.ueberschrift}
        </h1>
        <p className="mt-3 text-center text-lg">{de.fallen.gewinn.text}</p>

        <p className="mt-4 text-center font-bold text-red-600">
          {de.fallen.gewinn.zaehler} {min}:{sek}
        </p>

        <div className="mt-6 space-y-3 rounded-xl bg-white p-5">
          <GesperrtesFeld label={de.fallen.feldName} wert={ERFUNDEN.name} />
          <GesperrtesFeld label={de.fallen.feldTelefon} wert={ERFUNDEN.telefon} />
          <GesperrtesFeld label={de.fallen.feldSchule} wert={ERFUNDEN.schule} />
          <p className="text-xs text-gray-500">{de.fallen.erfundenHinweis}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setEntschieden(false)}
            className="rounded-xl bg-red-600 px-6 py-4 text-xl font-extrabold text-white"
          >
            {de.fallen.gewinn.absenden}
          </button>
          <button
            type="button"
            onClick={() => setEntschieden(true)}
            className="rounded-xl border border-gray-400 px-6 py-3 text-gray-700"
          >
            {de.fallen.gewinn.ablehnen}
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------- F2: Das Internet vergisst nie

export function FalleSteckbrief({ unit, onFertig }: FalleProps) {
  const [schritt, setSchritt] = useState<'formular' | 'geteilt' | 'aufloesung'>('formular');
  const [spitzname, setSpitzname] = useState('');
  const [tier, setTier] = useState('');

  /**
   * Die Eingaben leben nur hier. Beim Verlassen der Einheit sind sie weg —
   * nichts davon geht in die Datenbank (Regel 3).
   */
  const geloescht = useRef(false);
  useEffect(() => {
    return () => {
      geloescht.current = true;
    };
  }, []);

  const a = unit.aufloesung as {
    titel: string;
    text: string;
    merkmale: string[];
    geloescht: string;
    nichtsGespeichert: string;
  };

  if (schritt === 'formular') {
    return (
      <Rahmen>
        <h1 className="text-2xl font-semibold">{de.fallen.steckbrief.ueberschrift}</h1>
        <p className="mt-2 leading-relaxed text-gedaempft">{de.fallen.steckbrief.text}</p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm text-gedaempft">{de.fallen.steckbrief.spitzname}</span>
            <input
              type="text"
              value={spitzname}
              maxLength={20}
              onChange={(e) => setSpitzname(e.target.value)}
              className="mt-1 w-full rounded-xl border border-rand bg-grund px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gedaempft">{de.fallen.steckbrief.tier}</span>
            <input
              type="text"
              value={tier}
              maxLength={20}
              onChange={(e) => setTier(e.target.value)}
              className="mt-1 w-full rounded-xl border border-rand bg-grund px-4 py-3"
            />
          </label>
          <p className="text-xs text-gedaempft">{de.fallen.steckbrief.nurHarmlos}</p>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => setSchritt('geteilt')}
            className="rounded-lg bg-akzent px-6 py-3 font-semibold text-white"
          >
            {de.fallen.steckbrief.veroeffentlichen}
          </button>
        </div>
      </Rahmen>
    );
  }

  if (schritt === 'geteilt') {
    return (
      <Rahmen>
        <h1 className="text-2xl font-semibold">{de.fallen.steckbrief.geteiltTitel}</h1>
        <p className="mt-2 leading-relaxed text-gedaempft">{de.fallen.steckbrief.geteiltText}</p>

        {/* Nachgestellte fremde Seite. Es ist nichts echt und nichts online. */}
        <div className="mt-6 rounded-xl border border-rand bg-grund p-5">
          <p className="text-xs text-gedaempft">{de.fallen.steckbrief.fremdeSeite}</p>
          <p className="mt-2 font-semibold">
            {spitzname || de.fallen.steckbrief.ohneAngabe} —{' '}
            {tier || de.fallen.steckbrief.ohneAngabe}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gedaempft">
            {de.fallen.steckbrief.kommentare.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => setSchritt('aufloesung')}
            className="rounded-lg bg-akzent px-6 py-3 font-semibold text-white"
          >
            {de.fallen.weiter}
          </button>
        </div>
      </Rahmen>
    );
  }

  return (
    <Aufloesung
      // Hier gibt es kein Erkennen und kein Hineintappen -- die Einheit zeigt
      // etwas, statt zu pruefen. Deshalb zaehlt sie als abgeschlossen, aber
      // nicht als erkannte Falle.
      erkannt={null}
      titel={a.titel}
      text={a.text}
      merkmale={a.merkmale}
      nachsatz={`${a.geloescht} ${a.nichtsGespeichert}`}
      onFertig={() => onFertig(false)}
    />
  );
}

// ------------------------------------------- F3: Das Kleingedruckte

export function FalleKleingedrucktes({ unit, onFertig }: FalleProps) {
  const [entschieden, setEntschieden] = useState<boolean | null>(null);

  if (entschieden !== null) {
    const a = unit.aufloesung as {
      erkanntTitel: string;
      erkanntText: string;
      getapptTitel: string;
      getapptText: string;
      merkmale: string[];
      rechtlich: string;
    };
    return (
      <Aufloesung
        erkannt={entschieden}
        titel={entschieden ? a.erkanntTitel : a.getapptTitel}
        text={entschieden ? a.erkanntText : a.getapptText}
        merkmale={a.merkmale}
        nachsatz={a.rechtlich}
        onFertig={() => onFertig(entschieden)}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl rounded-2xl border-4 border-green-500 bg-green-50 p-8 text-black">
        <h1 className="text-center text-3xl font-extrabold text-green-700">
          {de.fallen.abo.ueberschrift}
        </h1>
        <p className="mt-3 text-center text-lg">{de.fallen.abo.text}</p>

        <button
          type="button"
          onClick={() => setEntschieden(false)}
          className="mt-6 w-full rounded-xl bg-green-600 px-6 py-5 text-2xl font-extrabold text-white"
        >
          {de.fallen.abo.starten}
        </button>

        <label className="mt-4 flex items-start gap-2 text-xs text-gray-600">
          {/* Vorausgefuelltes Haekchen -- genau das ist der Trick. */}
          <input type="checkbox" defaultChecked className="mt-0.5" readOnly />
          <span>{de.fallen.abo.haekchen}</span>
        </label>

        {/* Das Kleingedruckte. Bewusst klein und blass, wie im Original. */}
        <p className="mt-4 text-[10px] leading-tight text-gray-400">
          {de.fallen.abo.kleingedrucktes}
        </p>

        <button
          type="button"
          onClick={() => setEntschieden(true)}
          className="mt-6 w-full rounded-lg border border-gray-400 px-4 py-2 text-sm text-gray-700"
        >
          {de.fallen.abo.nachsehen}
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------- Gemeinsame Teile

function GesperrtesFeld({ label, wert }: { label: string; wert: string }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">{label}</span>
      <input
        type="text"
        value={wert}
        readOnly
        disabled
        className="mt-1 w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700"
      />
    </label>
  );
}

function Rahmen({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-rand bg-flaeche p-8">
        {children}
      </div>
    </div>
  );
}

/**
 * Die Auflösung. Erscheint immer, egal wie entschieden wurde.
 *
 * **Ohne Häme** (SPEC.md 6.6.1, Regel 5): Wer hineintappt, bekommt dieselbe
 * Aufmerksamkeit wie wer die Falle erkennt — und den Hinweis, dass das auch
 * Erwachsenen ständig passiert.
 */
function Aufloesung({
  erkannt,
  titel,
  text,
  merkmale,
  nachsatz,
  onFertig,
}: {
  erkannt: boolean | null;
  titel: string;
  text: string;
  merkmale: readonly string[];
  nachsatz?: string | undefined;
  onFertig: () => void;
}) {
  return (
    <Rahmen>
      {erkannt === true && (
        <p className="mb-2 inline-block rounded-full bg-richtig px-4 py-1 text-sm font-semibold text-white">
          {de.fallen.abzeichenHinweis}
        </p>
      )}
      <h1 className="text-2xl font-semibold">{titel}</h1>
      <p className="mt-3 leading-relaxed">{text}</p>

      <ul className="mt-4 space-y-2">
        {merkmale.map((m) => (
          <li key={m} className="flex gap-2 leading-relaxed">
            <span aria-hidden="true" className="text-akzent">
              ›
            </span>
            <span>{m}</span>
          </li>
        ))}
      </ul>

      {nachsatz && (
        <p className="mt-4 rounded-xl bg-akzent/10 p-4 leading-relaxed text-gedaempft">
          {nachsatz}
        </p>
      )}

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          autoFocus
          onClick={onFertig}
          className="rounded-lg bg-akzent px-6 py-3 text-lg font-semibold text-white hover:opacity-90"
        >
          {de.fallen.verstanden}
        </button>
      </div>
    </Rahmen>
  );
}
