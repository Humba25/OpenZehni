/**
 * Einrichtung beim ersten Start (SPEC.md 4, 9.1, 9.8).
 *
 * Vier Schritte: Begrüßung, Name, Altersstufe, Themen, Tagesziel. Danach folgt
 * die Tastaturprüfung (SPEC.md 7.4), die als einzige verpflichtend ist.
 *
 * **Kein Zwangsdialog** (ARCHITEKTUR.md): Jeder Schritt lässt sich mit einer
 * sinnvollen Vorgabe überspringen, der Name darf leer bleiben, und zurück geht
 * es überall. Wer nichts auswählt, bekommt `A2` und das erste Thema — die App
 * funktioniert dann vollständig.
 *
 * **Zur Altersfrage** (`SPEC.md` 15.13): Sie darf sich nicht wie eine Prüfung
 * anfühlen. Deshalb steht der Grund davor („damit die Texte zu dir passen"),
 * es gibt drei gleichwertige Knöpfe statt eines Eingabefeldes, und der Hinweis,
 * dass sich nichts falsch machen lässt.
 */

import { useState } from 'react';
import { allTopics } from '../../lib/text-provider';
import type { AgeBand } from '../../lib/curriculum';
import { de } from '../../i18n/de';

export interface OnboardingErgebnis {
  readonly name: string;
  readonly ageBand: AgeBand;
  readonly topicIds: readonly string[];
  readonly dailyGoalMin: number;
}

export interface OnboardingProps {
  readonly onDone: (ergebnis: OnboardingErgebnis) => void;
}

const SCHRITTE = 5;
const ZIEL_AUSWAHL = [5, 10, 15, 20] as const;
const MAX_THEMEN = 3;

export function Onboarding({ onDone }: OnboardingProps) {
  const [schritt, setSchritt] = useState(0);
  const [name, setName] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand>('A2');
  const [themen, setThemen] = useState<string[]>([]);
  const [ziel, setZiel] = useState(10);

  const weiter = (): void => {
    if (schritt < SCHRITTE - 1) {
      setSchritt(schritt + 1);
      return;
    }
    onDone({
      name: name.trim(),
      ageBand,
      // Wer nichts waehlt, bekommt das erste Thema. Die App muss auch dann
      // vollstaendig funktionieren.
      topicIds: themen.length > 0 ? themen : [allTopics()[0]!.id],
      dailyGoalMin: ziel,
    });
  };

  const umschalten = (id: string): void => {
    setThemen((alt) =>
      alt.includes(id)
        ? alt.filter((t) => t !== id)
        : alt.length >= MAX_THEMEN
          ? alt
          : [...alt, id],
    );
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-rand bg-flaeche p-8">
        {schritt > 0 && (
          <p className="text-sm text-gedaempft">{de.onboarding.schritt(schritt, SCHRITTE - 1)}</p>
        )}

        {schritt === 0 && (
          <>
            <h1 className="text-3xl font-semibold">{de.onboarding.willkommenTitel}</h1>
            <p className="mt-4 leading-relaxed">{de.onboarding.willkommenText}</p>
            <p className="mt-2 leading-relaxed text-gedaempft">{de.onboarding.willkommenDauer}</p>
          </>
        )}

        {schritt === 1 && (
          <>
            <h1 className="mt-1 text-2xl font-semibold">{de.onboarding.nameTitel}</h1>
            <p className="mt-2 leading-relaxed text-gedaempft">{de.onboarding.nameErklaerung}</p>
            <input
              type="text"
              value={name}
              autoFocus
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') weiter();
              }}
              placeholder={de.onboarding.namePlatzhalter}
              className="mt-6 w-full rounded-xl border border-rand bg-grund px-4 py-3 text-lg"
            />
          </>
        )}

        {schritt === 2 && (
          <>
            <h1 className="mt-1 text-2xl font-semibold">{de.onboarding.alterTitel}</h1>
            <p className="mt-2 leading-relaxed text-gedaempft">{de.onboarding.alterErklaerung}</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {(
                [
                  ['A1', de.onboarding.alterA1],
                  ['A2', de.onboarding.alterA2],
                  ['A3', de.onboarding.alterA3],
                ] as [AgeBand, string][]
              ).map(([band, beschriftung]) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => setAgeBand(band)}
                  aria-pressed={ageBand === band}
                  className={[
                    'rounded-xl border p-5 text-center transition-colors',
                    ageBand === band
                      ? 'border-akzent bg-akzent/10 font-semibold'
                      : 'border-rand hover:border-akzent',
                  ].join(' ')}
                >
                  <span className="block text-2xl">{beschriftung}</span>
                  <span className="block text-sm text-gedaempft">{de.onboarding.alterJahre}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {schritt === 3 && (
          <>
            <h1 className="mt-1 text-2xl font-semibold">{de.onboarding.themenTitel}</h1>
            <p className="mt-2 leading-relaxed text-gedaempft">{de.onboarding.themenErklaerung}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {allTopics().map((topic) => {
                const gewaehlt = themen.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => umschalten(topic.id)}
                    aria-pressed={gewaehlt}
                    className={[
                      'rounded-xl border px-4 py-3 text-left transition-colors',
                      gewaehlt
                        ? 'border-akzent bg-akzent/10 font-semibold'
                        : 'border-rand hover:border-akzent',
                    ].join(' ')}
                  >
                    {topic.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-gedaempft">
              {de.onboarding.themenAuswahl(themen.length)}
              {themen.length >= MAX_THEMEN && ` — ${de.onboarding.themenZuViele}`}
            </p>
          </>
        )}

        {schritt === 4 && (
          <>
            <h1 className="mt-1 text-2xl font-semibold">{de.onboarding.zielTitel}</h1>
            <p className="mt-2 leading-relaxed text-gedaempft">{de.onboarding.zielErklaerung}</p>
            <div className="mt-6 grid grid-cols-4 gap-3">
              {ZIEL_AUSWAHL.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setZiel(m)}
                  aria-pressed={ziel === m}
                  className={[
                    'rounded-xl border p-4 text-center transition-colors',
                    ziel === m
                      ? 'border-akzent bg-akzent/10 font-semibold'
                      : 'border-rand hover:border-akzent',
                  ].join(' ')}
                >
                  <span className="block text-2xl">{m}</span>
                  <span className="block text-xs text-gedaempft">Minuten</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-10 flex items-center justify-between">
          {schritt > 0 ? (
            <button
              type="button"
              onClick={() => setSchritt(schritt - 1)}
              className="rounded-lg border border-rand px-4 py-2 text-gedaempft hover:text-text"
            >
              {de.onboarding.zurueck}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={weiter}
            className="rounded-lg bg-akzent px-6 py-3 text-lg font-semibold text-white hover:opacity-90"
          >
            {schritt === 0
              ? de.onboarding.losGehts
              : schritt === SCHRITTE - 1
                ? de.onboarding.fertig
                : de.onboarding.weiter}
          </button>
        </div>
      </div>
    </div>
  );
}
