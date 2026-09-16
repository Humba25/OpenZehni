/**
 * Die Einstellungen (SPEC.md 8.12).
 *
 * Hier liegt, was `SPEC.md` ausdrücklich abschaltbar verlangt: der
 * Geisterschreiber (8.7) und die KI-Texte (9.3). Dazu, was sich nach dem
 * Onboarding ändern darf — Name, Altersstufe, Tagesziel und Themen (9.8).
 *
 * **Nichts hier ist eine Sackgasse.** Jede Änderung ist sofort wieder
 * zurücknehmbar, und keine kostet Fortschritt. Die Tastaturprüfung lässt sich
 * neu anstoßen, falls jemand die Tastatur gewechselt hat (7.4).
 */

import { useState } from 'react';
import { allTopics } from '../../lib/text-provider';
import type { AgeBand } from '../../lib/curriculum';
import type { Einstellungen as Daten } from '../../db/gamification';
import type { Updater } from '../update/useUpdater';
import { de } from '../../i18n/de';

/** Wie viele Themen höchstens gewählt werden dürfen (SPEC.md 9.1). */
const MAX_THEMEN = 3;

const ZIELE = [5, 10, 15, 20, 30] as const;

export interface EinstellungenProps {
  readonly start: Daten;
  readonly onSpeichern: (e: Daten) => void;
  readonly onZurueck: () => void;
  readonly onTastaturPruefen: () => void;
  readonly updater: Updater;
}

export function Einstellungen({
  start,
  onSpeichern,
  onZurueck,
  onTastaturPruefen,
  updater,
}: EinstellungenProps) {
  const [daten, setDaten] = useState<Daten>(start);
  const [gemerkt, setGemerkt] = useState(false);

  /**
   * Jede Änderung geht sofort in die Datenbank. Ein Speichern-Knopf, den man
   * vergessen kann, ist für ein Kind eine Falle — und es gibt hier nichts, was
   * sich nicht sofort zurücknehmen ließe.
   */
  const aendern = (teil: Partial<Daten>): void => {
    const neu = { ...daten, ...teil };
    setDaten(neu);
    onSpeichern(neu);
    setGemerkt(true);
  };

  const themaUmschalten = (id: string): void => {
    const drin = daten.topicIds.includes(id);
    if (drin) {
      aendern({ topicIds: daten.topicIds.filter((t) => t !== id) });
      return;
    }
    if (daten.topicIds.length >= MAX_THEMEN) return;
    aendern({ topicIds: [...daten.topicIds, id] });
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-baseline justify-between">
          <h1 className="text-3xl font-semibold">{de.einstellungen.titel}</h1>
          <div className="flex items-center gap-3">
            {gemerkt && (
              <span className="text-sm text-gedaempft">{de.einstellungen.gespeichert}</span>
            )}
            <button
              type="button"
              onClick={onZurueck}
              className="rounded-lg border border-rand px-4 py-2 text-gedaempft hover:text-text"
            >
              {de.einstellungen.zurueck}
            </button>
          </div>
        </header>

        <div className="grid gap-4">
          <Feld titel={de.einstellungen.name} erklaerung={de.einstellungen.nameErklaerung}>
            <input
              type="text"
              value={daten.name}
              onChange={(e) => aendern({ name: e.target.value })}
              maxLength={40}
              className="w-full rounded-lg border border-rand bg-grund px-3 py-2"
            />
          </Feld>

          <Feld titel={de.einstellungen.alter} erklaerung={de.einstellungen.alterErklaerung}>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['A1', de.onboarding.alterA1],
                  ['A2', de.onboarding.alterA2],
                  ['A3', de.onboarding.alterA3],
                ] as readonly [AgeBand, string][]
              ).map(([id, label]) => (
                <Wahl
                  key={id}
                  aktiv={daten.ageBand === id}
                  onClick={() => aendern({ ageBand: id })}
                >
                  {label} {de.onboarding.alterJahre}
                </Wahl>
              ))}
            </div>
          </Feld>

          <Feld
            titel={de.einstellungen.tagesziel}
            erklaerung={de.einstellungen.tageszielErklaerung}
          >
            <div className="flex flex-wrap gap-2">
              {ZIELE.map((min) => (
                <Wahl
                  key={min}
                  aktiv={daten.dailyGoalMin === min}
                  onClick={() => aendern({ dailyGoalMin: min })}
                >
                  {de.onboarding.zielMinuten(min)}
                </Wahl>
              ))}
            </div>
          </Feld>

          <Feld titel={de.einstellungen.themen} erklaerung={de.einstellungen.themenErklaerung}>
            <div className="flex flex-wrap gap-2">
              {allTopics().map((t) => (
                <Wahl
                  key={t.id}
                  aktiv={daten.topicIds.includes(t.id)}
                  onClick={() => themaUmschalten(t.id)}
                >
                  {t.label}
                </Wahl>
              ))}
            </div>
            <p className="mt-2 text-xs text-gedaempft">
              {de.onboarding.themenAuswahl(daten.topicIds.length)}
            </p>
          </Feld>

          <Feld titel={de.einstellungen.darstellung}>
            <div className="flex flex-wrap gap-2">
              <Wahl aktiv={daten.theme === 'hell'} onClick={() => aendern({ theme: 'hell' })}>
                {de.einstellungen.themaHell}
              </Wahl>
              <Wahl aktiv={daten.theme === 'dunkel'} onClick={() => aendern({ theme: 'dunkel' })}>
                {de.einstellungen.themaDunkel}
              </Wahl>
              {/* Hoher Kontrast gehoert zur Barrierefreiheit (SPEC.md 12.2). */}
              <Wahl
                aktiv={daten.theme === 'kontrast'}
                onClick={() => aendern({ theme: 'kontrast' })}
              >
                {de.einstellungen.themaKontrast}
              </Wahl>
            </div>
          </Feld>

          <Schalter
            titel={de.einstellungen.geist}
            erklaerung={de.einstellungen.geistErklaerung}
            an={daten.ghostEnabled}
            onAendern={(an) => aendern({ ghostEnabled: an })}
          />

          <Schalter
            titel={de.blindmodus.titel}
            erklaerung={de.blindmodus.erklaerung}
            an={daten.blindMode}
            onAendern={(an) => aendern({ blindMode: an })}
          />

          <Schalter
            titel={de.einstellungen.ki}
            erklaerung={de.einstellungen.kiErklaerung}
            an={daten.aiEnabled}
            onAendern={(an) => aendern({ aiEnabled: an })}
          />

          <Feld
            titel={de.einstellungen.tastaturPruefen}
            erklaerung={de.einstellungen.tastaturPruefenErklaerung}
          >
            <button
              type="button"
              onClick={onTastaturPruefen}
              className="rounded-lg border border-rand px-4 py-2 hover:border-akzent"
            >
              {de.einstellungen.tastaturPruefen}
            </button>
          </Feld>

          <UpdateFeld updater={updater} />
        </div>
      </div>
    </div>
  );
}

/**
 * Version und Updates (SPEC.md 11.1).
 *
 * Der Hinweis unten rechts erscheint nur, **wenn** es etwas gibt. Wer wissen
 * will, ob er aktuell ist, hat sonst keine Stelle zum Nachsehen — genau die
 * ist hier.
 */
function UpdateFeld({ updater }: { updater: Updater }) {
  const { stand, version, pruefen, installieren } = updater;

  const meldung = (): string => {
    switch (stand.name) {
      case 'unbekannt':
        return de.update.nochNichtGeprueft;
      case 'pruefe':
        return de.update.pruefeGerade;
      case 'aktuell':
        return de.update.aktuell;
      case 'laedt':
        return de.update.laedt;
      case 'bereit':
        return de.update.gefunden(stand.update.version);
      case 'installiert':
        return de.update.laedt;
      case 'nichtErreichbar':
        return de.update.nichtErreichbar;
    }
  };

  return (
    <Feld titel={de.update.titel} erklaerung={de.update.automatisch}>
      <p className="text-sm">
        {version ? de.update.deineVersion(version) : de.update.versionUnbekannt}
      </p>
      <p className="mt-1 text-sm text-gedaempft" role="status" aria-live="polite">
        {meldung()}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={pruefen}
          disabled={stand.name === 'pruefe' || stand.name === 'laedt'}
          className="rounded-lg border border-rand px-4 py-2 hover:border-akzent disabled:opacity-40"
        >
          {de.update.pruefen}
        </button>

        {stand.name === 'bereit' && (
          <button
            type="button"
            onClick={installieren}
            className="rounded-lg bg-akzent px-4 py-2 font-semibold text-white"
          >
            {de.update.jetzt}
          </button>
        )}
      </div>
    </Feld>
  );
}

function Feld({
  titel,
  erklaerung,
  children,
}: {
  titel: string;
  erklaerung?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-rand bg-flaeche p-4">
      <p className="font-semibold">{titel}</p>
      {erklaerung && <p className="mb-3 mt-1 text-sm text-gedaempft">{erklaerung}</p>}
      <div className={erklaerung ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}

function Schalter({
  titel,
  erklaerung,
  an,
  onAendern,
}: {
  titel: string;
  erklaerung: string;
  an: boolean;
  onAendern: (an: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-rand bg-flaeche p-4">
      <input
        type="checkbox"
        checked={an}
        onChange={(e) => onAendern(e.target.checked)}
        className="mt-1 h-4 w-4 accent-[rgb(var(--farbe-akzent))]"
      />
      <span>
        <span className="font-semibold">{titel}</span>
        <span className="mt-1 block text-sm text-gedaempft">{erklaerung}</span>
      </span>
    </label>
  );
}

function Wahl({
  aktiv,
  onClick,
  children,
}: {
  aktiv: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktiv}
      className={[
        'rounded-lg border px-3 py-1.5 text-sm transition-colors',
        aktiv ? 'border-akzent bg-akzent/10 font-semibold' : 'border-rand hover:border-akzent',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
