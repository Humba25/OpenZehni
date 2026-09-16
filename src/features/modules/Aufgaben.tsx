/**
 * Die Aufgabenformen des Modulbereichs (SPEC.md 10).
 *
 * Jede Form meldet über `onErgebnis`, ob sie gelöst wurde. **Bewertet wird
 * nichts**: Es gibt keine Punkte, keine Sterne und keinen Eintrag in
 * `lesson_progress`. Wer danebenliegt, sieht die Auflösung und geht weiter
 * (MODUL-LERNEN.md 5).
 *
 * Gerechnet wird in `lib/module.ts`; diese Datei zeichnet nur
 * (ARCHITEKTUR.md, Architekturregel 1).
 */

import { useEffect, useState } from 'react';
import {
  zuordnungKorrekt,
  zuordnungTreffer,
  umschreibungPasst,
  kuerzelPasst,
  type AufgabeQuiz,
  type AufgabeZuordnen,
  type AufgabeUmschreiben,
  type AufgabeTastenkuerzel,
  type AufgabeWaage,
  type AufgabeTextprobe,
} from '../../lib/module';
import { checkDin5008 } from '../../lib/din5008';
import { de } from '../../i18n/de';

/** Was jede Aufgabenform nach außen meldet. */
export interface AufgabeProps<T> {
  readonly aufgabe: T;
  /** Gelöst — die Oberfläche zeigt danach die Auflösung. */
  readonly onFertig: (richtig: boolean) => void;
}

// ------------------------------------------------------------------ Quiz

/**
 * Der Knopf, mit dem es nach der Auswertung weitergeht.
 *
 * Bewusst ein eigener Schritt: Wer antwortet, soll erst sehen, was richtig war,
 * bevor der Bildschirm wechselt. Ein Quiz, das sofort weiterspringt, verrät die
 * Lösung nie.
 */
function Weiter({ onKlick }: { onKlick: () => void }) {
  return (
    <button
      type="button"
      onClick={onKlick}
      autoFocus
      className="mt-5 rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
    >
      {de.einheit.weiter}
    </button>
  );
}

export function QuizAufgabe({ aufgabe, onFertig }: AufgabeProps<AufgabeQuiz>) {
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);

  return (
    <div>
      <p className="font-semibold">{aufgabe.text}</p>
      <ul className="mt-4 grid gap-2">
        {aufgabe.optionen.map((o, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setGewaehlt(i)}
              disabled={gewaehlt !== null}
              className={[
                'w-full rounded-xl border p-3 text-left transition-colors',
                gewaehlt === null
                  ? 'border-rand bg-flaeche hover:border-akzent'
                  : i === aufgabe.richtig
                    ? 'border-richtig bg-richtig/10'
                    : i === gewaehlt
                      ? 'border-falsch bg-falsch/10'
                      : 'border-rand bg-flaeche/50 opacity-60',
              ].join(' ')}
            >
              {o}
            </button>
          </li>
        ))}
      </ul>

      {gewaehlt !== null && <Weiter onKlick={() => onFertig(gewaehlt === aufgabe.richtig)} />}
    </div>
  );
}

// -------------------------------------------------------------- Zuordnen

export function ZuordnenAufgabe({ aufgabe, onFertig }: AufgabeProps<AufgabeZuordnen>) {
  const [gewaehlt, setGewaehlt] = useState<ReadonlyMap<number, string>>(new Map());
  const [aktiv, setAktiv] = useState<number | null>(null);
  const [geprueft, setGeprueft] = useState(false);

  const legen = (karte: number, fach: string): void => {
    const neu = new Map(gewaehlt);
    neu.set(karte, fach);
    setGewaehlt(neu);
    setAktiv(null);
  };

  const zurueck = (karte: number): void => {
    const neu = new Map(gewaehlt);
    neu.delete(karte);
    setGewaehlt(neu);
  };

  const offen = aufgabe.karten.map((_, i) => i).filter((i) => !gewaehlt.has(i));
  const alleGelegt = offen.length === 0;

  return (
    <div>
      <p className="font-semibold">{aufgabe.text}</p>
      <p className="mt-1 text-sm text-gedaempft">{de.einheit.einsortieren}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {offen.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAktiv(aktiv === i ? null : i)}
            className={[
              'rounded-xl border px-3 py-2 text-left text-sm transition-colors',
              aktiv === i
                ? 'border-akzent bg-akzent/10 font-semibold'
                : 'border-rand bg-flaeche hover:border-akzent',
            ].join(' ')}
          >
            {aufgabe.karten[i]!.text}
          </button>
        ))}
      </div>

      {/* Tailwind erzeugt nur Klassen, die woertlich im Quelltext stehen --
          eine zusammengesetzte Klasse waere still wirkungslos. */}
      <div
        className={[
          'mt-5 grid gap-3',
          aufgabe.faecher.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
        ].join(' ')}
      >
        {aufgabe.faecher.map((f) => (
          <div key={f.id} className="rounded-2xl border border-rand bg-flaeche/60 p-3">
            <button
              type="button"
              onClick={() => aktiv !== null && legen(aktiv, f.id)}
              disabled={aktiv === null}
              className={[
                'w-full rounded-lg border px-2 py-1 text-sm font-semibold transition-colors',
                aktiv === null
                  ? 'cursor-default border-transparent text-gedaempft'
                  : 'border-akzent text-akzent',
              ].join(' ')}
            >
              {f.label}
            </button>

            <ul className="mt-2 grid gap-2">
              {aufgabe.karten.map((k, i) =>
                gewaehlt.get(i) === f.id ? (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => !geprueft && zurueck(i)}
                      title={geprueft ? undefined : de.einheit.zurueckInsFach}
                      className={[
                        'w-full rounded-lg border px-3 py-2 text-left text-sm',
                        geprueft
                          ? k.fach === f.id
                            ? 'border-richtig bg-richtig/10'
                            : 'border-falsch bg-falsch/10'
                          : 'border-rand bg-flaeche',
                      ].join(' ')}
                    >
                      {k.text}
                    </button>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        ))}
      </div>

      {!geprueft ? (
        <button
          type="button"
          onClick={() => setGeprueft(true)}
          disabled={!alleGelegt}
          className="mt-5 rounded-xl bg-akzent px-5 py-2 font-semibold text-white disabled:opacity-40"
        >
          {de.einheit.pruefen}
        </button>
      ) : (
        <>
          {!zuordnungKorrekt(aufgabe, gewaehlt) && (
            <p className="mt-4 text-sm text-gedaempft">
              {de.einheit.fastRichtig(zuordnungTreffer(aufgabe, gewaehlt), aufgabe.karten.length)}{' '}
              {de.einheit.keineNote}
            </p>
          )}
          <Weiter onKlick={() => onFertig(zuordnungKorrekt(aufgabe, gewaehlt))} />
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------ Umschreiben

export function UmschreibenAufgabe({ aufgabe, onFertig }: AufgabeProps<AufgabeUmschreiben>) {
  const [eingaben, setEingaben] = useState<readonly string[]>(aufgabe.saetze.map(() => ''));
  const [geprueft, setGeprueft] = useState(false);

  const passt = aufgabe.saetze.map((s, i) => umschreibungPasst(eingaben[i] ?? '', s.mussEnthalten));
  const alle = passt.every(Boolean);

  return (
    <div>
      <p className="font-semibold">{aufgabe.text}</p>

      <ul className="mt-4 grid gap-4">
        {aufgabe.saetze.map((s, i) => (
          <li key={i} className="rounded-2xl border border-rand bg-flaeche p-4">
            <p className="text-sm text-gedaempft">{s.vorgabe}</p>
            <input
              type="text"
              value={eingaben[i] ?? ''}
              onChange={(e) => {
                const neu = [...eingaben];
                neu[i] = e.target.value;
                setEingaben(neu);
                setGeprueft(false);
              }}
              aria-label={de.einheit.deineAntwort}
              className={[
                'mt-2 w-full rounded-lg border bg-grund px-3 py-2',
                geprueft ? (passt[i] ? 'border-richtig' : 'border-falsch') : 'border-rand',
              ].join(' ')}
            />
            {geprueft && !passt[i] && (
              <p className="mt-2 text-xs text-gedaempft">
                {de.einheit.beispiel}: {s.beispiel}
              </p>
            )}
          </li>
        ))}
      </ul>

      {!geprueft ? (
        <button
          type="button"
          onClick={() => setGeprueft(true)}
          className="mt-5 rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
        >
          {de.einheit.pruefen}
        </button>
      ) : (
        <Weiter onKlick={() => onFertig(alle)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------- Tastenkürzel

export function TastenkuerzelAufgabe({ aufgabe, onFertig }: AufgabeProps<AufgabeTastenkuerzel>) {
  const [index, setIndex] = useState(0);
  const [getroffen, setGetroffen] = useState(false);

  const gesucht = aufgabe.kuerzel[index];

  useEffect(() => {
    if (!gesucht) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      // Ohne preventDefault wuerde Strg+S das Speichern-Fenster oeffnen und
      // Strg+F die Suche -- mitten in der Uebung.
      if (event.ctrlKey || event.altKey || event.metaKey) event.preventDefault();

      const passt = kuerzelPasst(gesucht, {
        code: event.code,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
      });
      if (!passt) return;

      setGetroffen(true);
      window.setTimeout(() => {
        setGetroffen(false);
        if (index + 1 >= aufgabe.kuerzel.length) onFertig(true);
        else setIndex(index + 1);
      }, 450);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gesucht, index, aufgabe.kuerzel.length, onFertig]);

  if (!gesucht) return null;

  return (
    <div>
      <p className="font-semibold">{aufgabe.text}</p>

      <div className="mt-6 rounded-2xl border border-rand bg-flaeche p-8 text-center">
        <p className="text-sm uppercase tracking-wide text-gedaempft">{de.einheit.jetztDruecken}</p>
        <p className="mt-2 text-3xl font-semibold">{gesucht.label}</p>
        <p className="mt-4 text-lg text-gedaempft">
          {getroffen ? (
            <span className="font-semibold text-richtig">{de.einheit.geschafft}</span>
          ) : (
            <span aria-hidden="true">· · ·</span>
          )}
        </p>
      </div>

      <p className="mt-3 text-center text-sm text-gedaempft">
        {de.einheit.nochOffen(aufgabe.kuerzel.length - index)}
      </p>
    </div>
  );
}

// ----------------------------------------------------------------- Waage

/**
 * Die Waage aus MODUL-LERNEN.md E3.
 *
 * Es gibt hier **keine richtige Antwort** — der Zeiger zeigt nur, wie die
 * beiden Sätze in einem Jahr dastehen. Deshalb meldet sie immer `true`: Wer den
 * Regler bewegt hat, hat die Aufgabe gemacht.
 */
export function WaageAufgabe({ aufgabe, onFertig }: AufgabeProps<AufgabeWaage>) {
  const [wert, setWert] = useState(50);
  const [bewegt, setBewegt] = useState(false);

  return (
    <div>
      <p className="font-semibold">{aufgabe.text}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Schale text={aufgabe.links} anteil={100 - wert} ergebnis="Ein Jahr älter." />
        <Schale
          text={aufgabe.rechts}
          anteil={wert}
          ergebnis="Ein Jahr älter und ein Jahr weiter."
        />
      </div>

      <label className="mt-6 block">
        <span className="text-sm text-gedaempft">{de.einheit.waageSchieben}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={wert}
          onChange={(e) => {
            setWert(Number(e.target.value));
            setBewegt(true);
          }}
          className="mt-2 w-full accent-[rgb(var(--farbe-akzent))]"
        />
      </label>

      <button
        type="button"
        onClick={() => onFertig(true)}
        disabled={!bewegt}
        className="mt-5 rounded-xl bg-akzent px-5 py-2 font-semibold text-white disabled:opacity-40"
      >
        {de.einheit.weiter}
      </button>
    </div>
  );
}

function Schale({ text, anteil, ergebnis }: { text: string; anteil: number; ergebnis: string }) {
  return (
    <div
      className="rounded-2xl border border-rand bg-flaeche p-4 transition-opacity"
      style={{ opacity: 0.45 + (anteil / 100) * 0.55 }}
    >
      <p className="font-semibold">{text}</p>
      <p className="mt-3 text-xs uppercase tracking-wide text-gedaempft">{de.einheit.waageJahr}</p>
      <p className="mt-1 text-sm">{ergebnis}</p>
    </div>
  );
}

// ------------------------------------------------------------- Textprobe

/**
 * Ein fehlerhafter Text ist zu berichtigen (SPEC.md 10.2).
 *
 * Geprüft wird mit `checkDin5008()` — derselben Funktion, an die Zehni sich
 * selbst hält. Zusätzlich wird verglichen, ob noch dieselben Buchstaben
 * dastehen: Sonst wäre „alles löschen" eine gültige Lösung.
 */
export function TextprobeAufgabe({ aufgabe, onFertig }: AufgabeProps<AufgabeTextprobe>) {
  const [eingabe, setEingabe] = useState(aufgabe.vorgabe);
  const [geprueft, setGeprueft] = useState(false);

  const buchstaben = (s: string): string => s.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
  const inhaltGleich = buchstaben(eingabe) === buchstaben(aufgabe.loesung);
  const findings = checkDin5008(eingabe);
  const richtig = inhaltGleich && findings.length === 0;

  return (
    <div>
      <p className="font-semibold">{aufgabe.text}</p>

      <label className="mt-4 block">
        <span className="text-sm text-gedaempft">{de.einheit.textVorher}</span>
        <textarea
          value={eingabe}
          onChange={(e) => {
            setEingabe(e.target.value);
            setGeprueft(false);
          }}
          rows={3}
          spellCheck={false}
          className="mt-2 w-full rounded-lg border border-rand bg-grund px-3 py-2 font-tippen"
        />
      </label>

      {geprueft && !richtig && (
        <p className="mt-2 text-sm text-gedaempft">
          {inhaltGleich ? de.einheit.textNochFehler(findings.length) : de.einheit.textAndererInhalt}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {richtig && geprueft ? (
          <Weiter onKlick={() => onFertig(true)} />
        ) : (
          <>
            <button
              type="button"
              onClick={() => setGeprueft(true)}
              className="rounded-xl bg-akzent px-5 py-2 font-semibold text-white"
            >
              {de.einheit.pruefen}
            </button>

            {/* Niemand soll hier festsitzen (ARCHITEKTUR.md, keine Sackgasse). */}
            <button
              type="button"
              onClick={() => {
                setEingabe(aufgabe.loesung);
                onFertig(false);
              }}
              className="rounded-xl border border-rand px-4 py-2 text-gedaempft hover:text-text"
            >
              {de.einheit.loesungZeigen}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
