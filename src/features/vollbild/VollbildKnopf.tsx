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

/**
 * Vier Eckwinkel — nach außen zeigend heißt „größer", nach innen „kleiner".
 *
 * **Warum gezeichnet und nicht als Zeichen.** Vorher standen hier `⤢` und `⤡`.
 * Die beiden gehören zu den Zeichen, für die viele Schriften keine eigene Form
 * haben; Windows setzt dann irgendeinen Pfeil aus einer Ersatzschrift ein, der
 * weder zur Textgröße noch zur Strichstärke daneben passt. Genau so sah es am
 * 2026-09-18 aus. Ein `<svg>` sieht überall gleich aus und erbt mit
 * `currentColor` die Farbe des Knopfes.
 */
function EckSymbol({ an }: { an: boolean }) {
  // Beim Verkleinern zeigen dieselben Winkel nach innen: gespiegelt, nicht neu
  // gezeichnet, damit beide Zustaende garantiert gleich aussehen.
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={an ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path d="M6 1.5H1.5V6" />
      <path d="M10 1.5H14.5V6" />
      <path d="M6 14.5H1.5V10" />
      <path d="M10 14.5H14.5V10" />
    </svg>
  );
}

export function VollbildKnopf({ an, onUmschalten }: VollbildKnopfProps) {
  return (
    <button
      type="button"
      onClick={onUmschalten}
      title={an ? de.vollbild.ausTitel : de.vollbild.anTitel}
      aria-pressed={an}
      className="flex items-center gap-2 rounded-lg border border-rand px-3 py-1.5 text-gedaempft hover:text-text"
    >
      <EckSymbol an={an} />
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
      className="fixed right-3 top-3 z-40 flex items-center gap-2 rounded-lg border border-rand bg-flaeche/90 px-3 py-1.5 text-xs text-gedaempft opacity-60 shadow-sm transition hover:opacity-100 focus-visible:opacity-100"
    >
      <EckSymbol an />
      {de.vollbild.verlassen}
    </button>
  );
}
