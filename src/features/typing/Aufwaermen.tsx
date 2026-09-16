/**
 * Das Aufwärmen vor dem Hauptteil (SPEC.md 6.5, Schritt 1).
 *
 * Zwanzig Sekunden Drill der Problemzeichen aus der adaptiven Wiederholung
 * (6.4), **ohne Bewertung**. Überspringen geht jederzeit — Zehni kennt keinen
 * Zwangsdialog (ARCHITEKTUR.md).
 */

import { useMemo } from 'react';
import { aufwaermtext, AUFWAERM_SEKUNDEN } from '../../lib/aufwaermen';
import { DrillScreen } from './DrillScreen';
import { de } from '../../i18n/de';

export interface AufwaermenProps {
  readonly lessonId: string;
  readonly problemzeichen: readonly string[];
  /** Geht in die Saat ein, damit nicht jedes Mal dieselbe Zeile kommt. */
  readonly versuch: number;
  readonly blind: boolean;
  readonly onWeiter: () => void;
}

export function Aufwaermen({
  lessonId,
  problemzeichen,
  versuch,
  blind,
  onWeiter,
}: AufwaermenProps) {
  const text = useMemo(
    () => aufwaermtext(lessonId, problemzeichen, String(versuch)),
    [lessonId, problemzeichen, versuch],
  );

  return (
    <DrillScreen
      titel={de.aufwaermen.titel}
      erklaerung={de.aufwaermen.erklaerung}
      texte={[text]}
      sekunden={AUFWAERM_SEKUNDEN}
      weiterLabel={de.aufwaermen.weiter}
      fertigText={de.aufwaermen.fertig}
      onFertig={onWeiter}
      onAbbrechen={onWeiter}
      blind={blind}
    />
  );
}
