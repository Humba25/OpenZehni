/**
 * Vollbild ein- und ausschalten (SPEC.md 12.2).
 *
 * Wunsch des Nutzers vom 2026-09-18. Für eine Übung, bei der es um Konzentration
 * geht, ist ein Vollbild ohne Fensterrahmen und Taskleiste genau richtig — auf
 * einem kleinen Laptopbildschirm gewinnt es außerdem spürbar Platz.
 *
 * **Zwei Wege hinaus, und beide stehen dran.** Ein Vollbild, aus dem man nicht
 * herausfindet, ist eine Sackgasse (ARCHITEKTUR.md) — und ein Kind, das nicht
 * weiterkommt, macht den Rechner aus. Deshalb: ein Knopf in der Kopfzeile, der
 * im Vollbild sichtbar bleibt, und die Taste `F11`. Die Taste `Escape` ist
 * bewusst **nicht** belegt: Sie beendet in den Übungen etwas anderes, und zwei
 * Bedeutungen für dieselbe Taste sind eine zu viel.
 *
 * Scheitert der Zugriff aufs Fenster, passiert nichts weiter als ein
 * Protokolleintrag. Zehni läuft auch im Fenster vollständig.
 */

import { useCallback, useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export interface Vollbild {
  readonly an: boolean;
  readonly umschalten: () => void;
}

export function useVollbild(): Vollbild {
  const [an, setAn] = useState(false);

  // Beim Start nachsehen, in welchem Zustand das Fenster ist.
  useEffect(() => {
    void (async () => {
      try {
        setAn(await getCurrentWindow().isFullscreen());
      } catch (error) {
        console.warn('Zehni: Vollbildzustand nicht lesbar', error);
      }
    })();
  }, []);

  const umschalten = useCallback((): void => {
    void (async () => {
      try {
        const fenster = getCurrentWindow();
        const neu = !(await fenster.isFullscreen());
        await fenster.setFullscreen(neu);
        setAn(neu);
      } catch (error) {
        console.warn('Zehni: Vollbild liess sich nicht umschalten', error);
      }
    })();
  }, []);

  /**
   * `F11` ist die Taste, die jeder von Browsern und Spielen kennt.
   *
   * **Warum in der Capture-Phase und mit `stopPropagation`.** Acht Bildschirme
   * hören ebenfalls auf `keydown` am `window`, und mehrere davon machen bei
   * *jeder* Taste etwas — die pausierte Lektion läuft weiter, das Minispiel
   * startet. `F11` würde also nebenbei die Übung fortsetzen. Ein Zuhörer in
   * der Capture-Phase am `window` kommt vor allen Zuhörern in der Bubble-Phase
   * an die Reihe; danach sieht niemand sonst die Taste mehr.
   *
   * Der Vorteil gegenüber einer Ausnahme in jedem der acht Bildschirme: Der
   * neunte muss nichts davon wissen.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'F11') return;
      event.preventDefault();
      event.stopPropagation();
      umschalten();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [umschalten]);

  return { an, umschalten };
}
