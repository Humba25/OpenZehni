/**
 * Der Update-Hinweis unten rechts (SPEC.md 11.1).
 *
 * **Niemals ein modaler Zwangsdialog.** Eine kleine Karte in der Ecke, die
 * keine Tastendrücke abfängt, den Fokus nicht stiehlt und sich wegklicken
 * lässt.
 *
 * Gezeigt wird sie nur, wenn wirklich ein Update bereitliegt. Gesucht und
 * gerechnet wird in `useUpdater`; diese Komponente zeichnet nur.
 */

import type { Updater } from './useUpdater';
import { de } from '../../i18n/de';

export function UpdateHinweis({ updater }: { updater: Updater }) {
  const { stand, weggeklickt, wegklicken, installieren } = updater;

  if (weggeklickt) return null;
  if (stand.name !== 'bereit' && stand.name !== 'installiert') return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-10 max-w-xs"
      // Kein `role="alertdialog"`: Das waere ein Zwangsdialog. Eine
      // Statusmeldung wird vorgelesen, ohne den Fokus zu stehlen (SPEC.md 12.2).
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto rounded-2xl border border-rand bg-flaeche p-4 shadow-lg">
        {stand.name === 'installiert' ? (
          <p className="text-sm text-gedaempft">{de.update.laedt}</p>
        ) : (
          <>
            <p className="font-semibold">{de.update.bereit}</p>
            <p className="mt-1 text-sm text-gedaempft">{de.update.version(stand.update.version)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={installieren}
                className="rounded-lg bg-akzent px-3 py-1.5 text-sm font-semibold text-white"
              >
                {de.update.jetzt}
              </button>
              <button
                type="button"
                onClick={wegklicken}
                title={de.update.spaeterErklaerung}
                className="rounded-lg border border-rand px-3 py-1.5 text-sm text-gedaempft hover:text-text"
              >
                {de.update.spaeter}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
