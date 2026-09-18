/**
 * Die beiden sichtbaren Teile des Vollbilds (SPEC.md 12.2).
 *
 * - `VollbildKnopf` sitzt in der Kopfzeile und schaltet um.
 * - `VollbildAusstieg` ist der Notausgang: Er erscheint **nur**, wenn das
 *   Vollbild an ist und gerade keine Kopfzeile da ist — also mitten in einer
 *   Übung oder einem Spiel. Ohne ihn gäbe es dort keinen sichtbaren Weg zurück,
 *   und „drück mal F11" ist keine Antwort, die ein Kind von selbst findet.
 *
 * Der Ausstieg liegt oben rechts, bewusst außerhalb des Blickfelds beim
 * Schreiben — die Augen sind auf dem Text in der Mitte. Er ist gedämpft, bis
 * man mit der Maus daraufgeht.
 */

import { de } from '../../i18n/de';

export interface VollbildKnopfProps {
  readonly an: boolean;
  readonly onUmschalten: () => void;
}

export function VollbildKnopf({ an, onUmschalten }: VollbildKnopfProps) {
  return (
    <button
      type="button"
      onClick={onUmschalten}
      title={an ? de.vollbild.ausTitel : de.vollbild.anTitel}
      aria-pressed={an}
      className="rounded-lg border border-rand px-3 py-1.5 text-gedaempft hover:text-text"
    >
      <span aria-hidden="true" className="mr-1.5">
        {an ? '⤡' : '⤢'}
      </span>
      {an ? de.vollbild.aus : de.vollbild.an}
    </button>
  );
}

export function VollbildAusstieg({ onUmschalten }: { readonly onUmschalten: () => void }) {
  return (
    <button
      type="button"
      onClick={onUmschalten}
      title={de.vollbild.ausTitel}
      className="fixed right-3 top-3 z-40 rounded-lg border border-rand bg-flaeche/90 px-3 py-1.5 text-xs text-gedaempft opacity-60 shadow-sm transition hover:opacity-100 focus-visible:opacity-100"
    >
      <span aria-hidden="true" className="mr-1.5">
        ⤡
      </span>
      {de.vollbild.verlassen}
    </button>
  );
}
