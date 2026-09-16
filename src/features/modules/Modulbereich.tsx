/**
 * Der freie Modulbereich (SPEC.md 10).
 *
 * Zeigt alle drei Module mit ihren Einheiten — die frei spielbaren und die,
 * die im Lernpfad liegen. Letztere sind hier **nicht** startbar: Eine Falle,
 * die man sich vorher ansieht, ist keine mehr (SPEC.md 6.6.1). Sie stehen
 * trotzdem in der Liste, damit das Modul vollständig aussieht und niemand eine
 * Lücke vermutet.
 */

import { alleModule, uebersicht, einheitenGesamt, type Modul } from '../../lib/module';
import { de } from '../../i18n/de';

export interface ModulbereichProps {
  /** IDs der abgeschlossenen Einheiten, aus `module_progress`. */
  readonly erledigt: ReadonlySet<string>;
  readonly onStart: (einheitId: string) => void;
  readonly onZurueck: () => void;
}

export function Modulbereich({ erledigt, onStart, onZurueck }: ModulbereichProps) {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{de.modulbereich.titel}</h1>
            <p className="mt-1 text-gedaempft">{de.modulbereich.untertitel}</p>
          </div>
          <button
            type="button"
            onClick={onZurueck}
            className="rounded-lg border border-rand px-4 py-2 text-gedaempft hover:text-text"
          >
            {de.modulbereich.zurueck}
          </button>
        </header>

        <div className="grid gap-6">
          {alleModule().map((m) => (
            <ModulKarte key={m.id} modul={m} erledigt={erledigt} onStart={onStart} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ModulKarte({
  modul,
  erledigt,
  onStart,
}: {
  modul: Modul;
  erledigt: ReadonlySet<string>;
  onStart: (einheitId: string) => void;
}) {
  const eintraege = uebersicht(modul.id);
  const fertig = eintraege.filter((e) => erledigt.has(e.id)).length;

  return (
    <section className="rounded-2xl border border-rand bg-flaeche p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{modul.title}</h2>
          <p className="mt-1 text-sm text-gedaempft">{modul.beschreibung}</p>
        </div>
        <span className="tabular-nums text-sm text-gedaempft">
          {de.modulbereich.stand(fertig, einheitenGesamt(modul.id))}
        </span>
      </header>

      <ul className="mt-4 grid gap-2">
        {eintraege.map((e) => {
          const gemacht = erledigt.has(e.id);
          return (
            <li
              key={e.id}
              className={[
                'flex flex-wrap items-center gap-3 rounded-xl border p-3',
                gemacht ? 'border-richtig/40 bg-richtig/5' : 'border-rand',
              ].join(' ')}
            >
              <span className="min-w-0 flex-1 font-medium">{e.title}</span>

              {e.imLernpfad ? (
                <span className="text-sm text-gedaempft" title={de.modulbereich.nurImLernpfad}>
                  {e.afterLesson
                    ? de.modulbereich.imLernpfadNach(e.afterLesson)
                    : de.modulbereich.imLernpfad}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onStart(e.id)}
                  className="rounded-lg border border-rand px-3 py-1.5 text-sm hover:border-akzent"
                >
                  {gemacht ? de.modulbereich.nochmal : de.modulbereich.starten}
                </button>
              )}

              {gemacht && (
                <span className="text-sm font-semibold text-richtig">
                  {de.modulbereich.erledigt}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
