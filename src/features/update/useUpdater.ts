/**
 * Der Update-Zustand für die ganze App (SPEC.md 11.1).
 *
 * Wird **einmal** in `App` benutzt und von dort weitergereicht: Der Hinweis
 * unten rechts und die Einstellungen zeigen denselben Stand, statt jeder für
 * sich zu suchen.
 *
 * **Fehler sind stillschweigend zu ignorieren.** Kein Internet, kein
 * Endpunkt, kaputte Antwort — das landet im Log und führt höchstens zu einem
 * ruhigen Satz in den Einstellungen. Nie zu einem Dialog, nie zu einer
 * Fehlermeldung während des Übens.
 */

import { useCallback, useEffect, useState } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';

export type UpdateStand =
  /** Beim Start, bevor etwas geschehen ist. */
  | { name: 'unbekannt' }
  | { name: 'pruefe' }
  /** Nachgesehen, es gibt nichts Neueres. */
  | { name: 'aktuell' }
  | { name: 'laedt'; update: Update }
  | { name: 'bereit'; update: Update }
  /** Nachsehen war nicht möglich. Kein Fehlerfall für die Nutzerin. */
  | { name: 'nichtErreichbar' }
  | { name: 'installiert' };

export interface Updater {
  readonly stand: UpdateStand;
  /** Laufende Version der App, `null` solange sie nicht bekannt ist. */
  readonly version: string | null;
  /** Von Hand nachsehen (Knopf in den Einstellungen). */
  readonly pruefen: () => void;
  /** Update einspielen und neu starten. */
  readonly installieren: () => void;
  /** Hinweis wegklicken — bis zum nächsten Start. */
  readonly wegklicken: () => void;
  readonly weggeklickt: boolean;
}

export function useUpdater(): Updater {
  const [stand, setStand] = useState<UpdateStand>({ name: 'unbekannt' });
  const [version, setVersion] = useState<string | null>(null);
  const [weggeklickt, setWeggeklickt] = useState(false);

  useEffect(() => {
    void getVersion()
      .then(setVersion)
      .catch((error: unknown) => {
        // Nur eine Anzeige. Ohne sie fehlt eine Zeile, sonst nichts.
        console.warn('Zehni: Version nicht lesbar', error);
      });
  }, []);

  const pruefen = useCallback(() => {
    setStand({ name: 'pruefe' });
    setWeggeklickt(false);

    void (async () => {
      try {
        const update = await check();
        if (!update) {
          setStand({ name: 'aktuell' });
          return;
        }

        // Erst laden, dann Bescheid sagen: „Ein Update ist bereit" soll wahr
        // sein, wenn es dasteht.
        setStand({ name: 'laedt', update });
        await update.download();
        setStand({ name: 'bereit', update });
      } catch (error) {
        // Genau hier verlangt die Spec stilles Scheitern mit Log-Eintrag
        // (SPEC.md 11.1). Ohne veroeffentlichtes Release ist das der Normalfall.
        console.warn('Zehni: Update-Pruefung nicht moeglich', error);
        setStand({ name: 'nichtErreichbar' });
      }
    })();
  }, []);

  // Prüfung beim Start, asynchron, blockiert nichts (SPEC.md 11.1).
  useEffect(() => {
    pruefen();
  }, [pruefen]);

  const installieren = useCallback(() => {
    setStand((vorher) => {
      if (vorher.name !== 'bereit') return vorher;
      const update = vorher.update;
      void (async () => {
        try {
          await update.install();
          await relaunch();
        } catch (error) {
          console.warn('Zehni: Update konnte nicht installiert werden', error);
          setStand({ name: 'nichtErreichbar' });
        }
      })();
      return { name: 'installiert' };
    });
  }, []);

  const wegklicken = useCallback(() => setWeggeklickt(true), []);

  return { stand, version, pruefen, installieren, wegklicken, weggeklickt };
}
