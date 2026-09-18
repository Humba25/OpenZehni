/**
 * „Was ist neu?" in den Einstellungen (SPEC.md 11.4).
 *
 * Der Eintrag zur laufenden Version steht offen da, die älteren klappen auf.
 * **Zugeklappt ist die Vorgabe, weil die meisten nur wissen wollen, was das
 * letzte Update gebracht hat** — und eine Liste aller Versionen daneben wäre
 * eine Wand aus Text.
 *
 * Umgesetzt mit `<details>`: Das kann der Browser von sich aus, es ist mit der
 * Tastatur bedienbar und mit Vorlesesoftware angekündigt. Eine eigene
 * Klapplogik wäre mehr Code und weniger barrierefrei.
 */

import { aenderungenBis, eintragFuer, datumLesbar } from '../../lib/aenderungen';
import { de } from '../../i18n/de';

export interface AenderungenProps {
  /** Die laufende Version, oder `null`, wenn sie sich nicht lesen ließ. */
  readonly version: string | null;
}

export function Aenderungen({ version }: AenderungenProps) {
  const jetzige = eintragFuer(version);
  const aeltere = aenderungenBis(version).filter((a) => a.version !== jetzige?.version);

  if (!jetzige) return null;

  return (
    <div className="mt-4 border-t border-rand pt-3">
      <h3 className="text-sm font-semibold">
        {de.aenderungen.titel} {jetzige.version}
      </h3>
      <p className="text-xs text-gedaempft">{datumLesbar(jetzige.datum)}</p>

      <Punkte punkte={jetzige.punkte} />

      {aeltere.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-gedaempft hover:text-text">
            {de.aenderungen.aeltere}
          </summary>

          <div className="mt-2 flex flex-col gap-3 border-l-2 border-rand pl-3">
            {aeltere.map((a) => (
              <div key={a.version}>
                <h4 className="text-sm font-semibold">
                  {de.aenderungen.version} {a.version}
                  <span className="ml-2 font-normal text-gedaempft">{datumLesbar(a.datum)}</span>
                </h4>
                <Punkte punkte={a.punkte} />
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Punkte({ punkte }: { punkte: readonly string[] }) {
  return (
    <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-sm">
      {punkte.map((p) => (
        <li key={p}>{p}</li>
      ))}
    </ul>
  );
}
