/**
 * Ablaufsteuerung: Einrichtung → Tastaturprüfung → Lernweg → Erklärseite →
 * Aufwärmen → Übung → Auswertung.
 *
 * Bewusst ohne Router. Eine Handvoll Bildschirme braucht keine Bibliothek, und
 * jede Abhängigkeit kostet Startzeit und Bundlegröße (SPEC.md 12.1).
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { LessonList } from '../features/curriculum/LessonList';
import { LessonScreen, type LessonRunResult } from '../features/typing/LessonScreen';
import { LessonIntro } from '../features/typing/LessonIntro';
import { Aufwaermen } from '../features/typing/Aufwaermen';
import { Tastenjagd, Jagdfrage } from '../features/typing/Tastenjagd';
import { ResultScreen, type Belohnung } from '../features/stats/ResultScreen';
import { LayoutCheck } from '../features/onboarding/LayoutCheck';
import { Onboarding } from '../features/onboarding/Onboarding';
import { InterludeScreen, type Lernzahlen } from '../features/modules/InterludeScreen';
import { Modulbereich } from '../features/modules/Modulbereich';
import { Spielauswahl } from '../features/minispiele/Spielauswahl';
import { Buchstabenregen } from '../features/minispiele/Buchstabenregen';
import { Wortsalat } from '../features/minispiele/Wortsalat';
import { EinheitScreen } from '../features/modules/EinheitScreen';
import { AbzeichenGalerie } from '../features/stats/Abzeichen';
import { Einstellungen } from '../features/settings/Einstellungen';
import { TagesaufgabeKarte } from '../features/motivation/Tagesaufgabe';
import { WochenzielBalken } from '../features/motivation/Wochenziel';
import { Lernstube } from '../features/motivation/Lernstube';
import { Maskottchen, MaskottchenMitSpruch } from '../features/mascot/Maskottchen';
import { UpdateHinweis } from '../features/update/UpdateHinweis';
import { useUpdater } from '../features/update/useUpdater';
import { maskottchenFuer } from '../lib/maskottchen';
import {
  getOrCreateProfile,
  loadProgress,
  saveSession,
  unlockLesson,
  loadCharStats,
  loadLastSpeed,
  markLayoutVerified,
  clearLayoutVerified,
  type LessonProgress,
  type Profile,
} from '../db';
import {
  saveOnboarding,
  loadInterests,
  addXp,
  loadXp,
  loadStreak,
  saveStreak,
  loadRewards,
  grantRewards,
  addActivity,
  loadActivity,
  loadModules,
  loadLeistungsdaten,
  loadLernkurve,
  completeModule,
  loadRewardDates,
  saveEinstellungen,
  ladeTageSeitLetztem,
  type Einstellungen as EinstellungsDaten,
} from '../db/gamification';
import {
  ladeTagesaufgabe,
  tagesaufgabeFortschreiben,
  tagesaufgabeAusblenden,
  ladeWochenziel,
  wochenzielBelohnt,
  ladeWochenzielSiege,
  ladeBlindMinuten,
  speichereEinstellungen,
  minispielGespielt,
  type Tagesaufgabe,
} from '../db/motivation';
import { getLesson, nextLesson, allLessons, type Lesson } from '../lib/curriculum';
import { provideText, pickFact, topicsWithContent } from '../lib/text-provider';
import { weakestChars } from '../lib/typing-engine';
import { faelligesInterlude, getInterlude, type Interlude } from '../lib/interludes';
import { getEinheit, type ModulEinheit } from '../lib/module';
import { type MinispielId } from '../lib/minispiele';
import { jagdAngebot, type Jagdangebot } from '../lib/tastenjagd';
import { geistLaeuft } from '../lib/geist';
import { laengsteFehlerfreieStrecke, type Ereignis } from '../lib/challenges';
import { belohnungFaellig, zielErreicht, type Wochenstand } from '../lib/wochenziel';
import { neuesTeil } from '../lib/lernstube';
import {
  XP,
  xpFuerRunde,
  neueAbzeichen,
  serieFortschreiben,
  levelFortschritt,
  type FortschrittsBild,
} from '../lib/gamification';
import { de } from '../i18n/de';

/**
 * Woher eine Station geoeffnet wurde.
 *
 * Wer vom Lernweg kommt, will dorthin zurueck und nicht in ein Menue, das er
 * nie geoeffnet hat.
 */
type Rueckweg = 'lernweg' | 'modulbereich' | 'spiele';

/**
 * Der Rueckweg als Ansicht.
 *
 * Ausgeschrieben statt einer zusammengesetzten Ansicht: So bleibt Ansicht eine
 * echte unterscheidbare Union, und ein neuer Rueckweg ohne passende Ansicht
 * faellt beim Uebersetzen auf.
 */
function zurueckZu(weg: Rueckweg): Ansicht {
  switch (weg) {
    case 'modulbereich':
      return { name: 'modulbereich' };
    case 'spiele':
      return { name: 'spiele' };
    case 'lernweg':
      return { name: 'lernweg' };
  }
}

/** Was in der Übung feststeht, sobald ein Text gewählt ist. */
interface Runde {
  readonly lesson: Lesson;
  readonly text: string;
  readonly topicId?: string | undefined;
  readonly source: string;
  /** Problemzeichen für das Aufwärmen (SPEC.md 6.4). */
  readonly problemzeichen: readonly string[];
  readonly versuche: number;
  /** Tempo des Geisterschreibers oder `null` (SPEC.md 8.7). */
  readonly geistStrokesMin: number | null;
}

type Ansicht =
  | { name: 'laden' }
  | { name: 'einrichtung' }
  // Die Tastaturpruefung steht vor dem Lernpfad. Liegt ein anderes Layout an
  // als T1, zeigt Zehni falsche Tasten (SPEC.md 7.4, NORMEN.md 3.1).
  | { name: 'tastaturtest' }
  | { name: 'lernweg' }
  | { name: 'lernstube' }
  | { name: 'abzeichen' }
  | { name: 'einstellungen' }
  | { name: 'modulbereich' }
  | { name: 'moduleinheit'; einheit: ModulEinheit; zurueck: Rueckweg }
  | { name: 'spiele' }
  | { name: 'spiel'; spiel: MinispielId; zurueck: Rueckweg }
  | { name: 'zwischenstueck'; unit: Interlude; lernzahlen?: Lernzahlen | undefined }
  | { name: 'einfuehrung'; runde: Runde }
  | { name: 'aufwaermen'; runde: Runde }
  | { name: 'uebung'; runde: Runde }
  | { name: 'tastenjagd'; angebot: Jagdangebot }
  | {
      name: 'auswertung';
      lesson: Lesson;
      result: LessonRunResult;
      fact?: string | undefined;
      bestBefore: number | null;
      letzteStrokesMin: number | null;
      belohnung: Belohnung;
      /** Angebot der Tastenjagd, falls die Datenlage eines hergibt (8.9). */
      jagd?: Jagdangebot | undefined;
    };

/** Was die Kopfzeile über den Gesamtfortschritt zeigt. */
export interface Gesamtstand {
  readonly xp: number;
  readonly level: number;
  readonly serieTage: number;
  readonly minutenHeute: number;
  readonly tageszielErreicht: boolean;
  readonly wochenzielSiege: number;
  /** Längste Serie — der Trost nach einem gerissenen Lauf (SPEC.md 8.3). */
  readonly serieLaengste: number;
  readonly jokerUebrig: number;
  /** Tage seit der letzten Runde — das Maskottchen begrüßt danach (SPEC.md 8.5). */
  readonly tageSeitLetztem: number;
}

const LEER: Gesamtstand = {
  xp: 0,
  level: 1,
  serieTage: 0,
  minutenHeute: 0,
  tageszielErreicht: false,
  wochenzielSiege: 0,
  serieLaengste: 0,
  jokerUebrig: 0,
  tageSeitLetztem: 0,
};

export function App() {
  const [ansicht, setAnsicht] = useState<Ansicht>({ name: 'laden' });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ReadonlyMap<string, LessonProgress>>(new Map());
  const [themen, setThemen] = useState<readonly string[]>([]);
  const [stand, setStand] = useState<Gesamtstand>(LEER);
  const [tagesaufgabe, setTagesaufgabe] = useState<Tagesaufgabe | undefined>(undefined);
  const [wochenziel, setWochenziel] = useState<Wochenstand | undefined>(undefined);
  const [blind, setBlind] = useState(false);
  const [abzeichen, setAbzeichen] = useState<ReadonlyMap<string, string>>(new Map());
  const [erledigteEinheiten, setErledigteEinheiten] = useState<ReadonlySet<string>>(new Set());
  const [fehler, setFehler] = useState<string | null>(null);

  // Einmal fuer die ganze App: Hinweis unten rechts und Einstellungen zeigen
  // denselben Stand (SPEC.md 11.1).
  const updater = useUpdater();

  /** Liest alles neu, was die Kopfzeile und der Lernweg brauchen. */
  const standNeuLaden = useCallback(async (dailyGoalMin: number): Promise<void> => {
    const [xp, serie, heute, interessen, siege, tageSeitLetztem, module] = await Promise.all([
      loadXp(),
      loadStreak(),
      loadActivity(),
      loadInterests(),
      ladeWochenzielSiege(),
      ladeTageSeitLetztem(),
      loadModules(),
    ]);
    setStand({
      xp,
      level: levelFortschritt(xp).level,
      serieTage: serie.currentDays,
      minutenHeute: Math.round(heute.activeMs / 60000),
      tageszielErreicht: heute.activeMs >= dailyGoalMin * 60000,
      wochenzielSiege: siege,
      serieLaengste: serie.longestDays,
      jokerUebrig: serie.freezesLeft,
      tageSeitLetztem,
    });
    setThemen(interessen.map((i) => i.topicId));
    setErledigteEinheiten(
      new Set([...module.values()].filter((m) => m.completed).map((m) => m.unitId)),
    );
  }, []);

  /**
   * Tagesaufgabe und Wochenziel nachladen.
   *
   * Getrennt vom übrigen Stand, weil beides zusätzliche Abfragen kostet und
   * nur der Lernweg es braucht. Fällt es aus, fehlen die Karten — der Lernpfad
   * läuft trotzdem (SPEC.md 8.6: Die Aufgabe hält nie auf).
   */
  const motivationNeuLaden = useCallback(
    async (profilId: number, stand: ReadonlyMap<string, LessonProgress>): Promise<void> => {
      try {
        const freigeschaltet = new Set(
          [...stand.values()].filter((p) => p.status !== 'locked').map((p) => p.lessonId),
        );
        setTagesaufgabe(await ladeTagesaufgabe(profilId, freigeschaltet));
        setWochenziel(await ladeWochenziel());
      } catch (error) {
        console.warn('Zehni: Tagesaufgabe oder Wochenziel nicht lesbar', error);
      }
    },
    [],
  );

  useEffect(() => {
    void (async () => {
      try {
        const p = await getOrCreateProfile();
        await unlockLesson('L01');
        setProfile(p);
        setBlind(p.blindMode);
        const fortschritt = await loadProgress();
        setProgress(fortschritt);
        await standNeuLaden(p.dailyGoalMin);
        await motivationNeuLaden(p.id, fortschritt);

        // Reihenfolge: erst einrichten, dann Tastatur pruefen, dann lernen.
        if (!p.onboardedAt) setAnsicht({ name: 'einrichtung' });
        else if (!p.layoutVerifiedAt) setAnsicht({ name: 'tastaturtest' });
        else setAnsicht({ name: 'lernweg' });
      } catch (error) {
        // Kein stilles Scheitern (ARCHITEKTUR.md, Stil).
        console.error('Zehni: Datenbank konnte nicht geoeffnet werden', error);
        setFehler(de.fehler.datenbank);
        // Ohne Datenbank laesst sich nichts merken. Die Tastaturpruefung
        // trotzdem zeigen: Sie braucht keine Datenbank und ist der wichtigere
        // Schutz.
        setAnsicht({ name: 'tastaturtest' });
      }
    })();
  }, [standNeuLaden, motivationNeuLaden]);

  useEffect(() => {
    document.documentElement.dataset['theme'] = profile?.theme ?? 'hell';
  }, [profile?.theme]);

  // Schriftgroesse in drei Stufen (SPEC.md 12.2). Sie haengt an der
  // Wurzel-Schriftgroesse, damit die ganze Oberflaeche mitwaechst.
  useEffect(() => {
    document.documentElement.dataset['schrift'] = profile?.fontScale ?? 'normal';
  }, [profile?.fontScale]);

  const blindUmschalten = useCallback(
    (an: boolean) => {
      setBlind(an);
      void speichereEinstellungen({
        geistAn: profile?.ghostEnabled ?? true,
        blindmodus: an,
      }).catch((error: unknown) => {
        // Die Einstellung nicht merken zu koennen ist aergerlich, aber kein
        // Grund, die laufende Uebung zu stoeren.
        console.warn('Zehni: Einstellung konnte nicht gemerkt werden', error);
      });
    },
    [profile?.ghostEnabled],
  );

  /** Die Galerie zeigt auch das Datum, deshalb wird sie erst beim Öffnen geladen. */
  const abzeichenOeffnen = useCallback(async (): Promise<void> => {
    try {
      setAbzeichen(await loadRewardDates());
    } catch (error) {
      // Ohne Daten bleibt die Galerie leer statt kaputt: Sie zeigt dann alle
      // Abzeichen als noch nicht verdient.
      console.warn('Zehni: Abzeichen nicht lesbar', error);
    }
    setAnsicht({ name: 'abzeichen' });
  }, []);

  /**
   * Jede Änderung in den Einstellungen geht sofort in die Datenbank und sofort
   * in den laufenden Zustand — sonst zeigte die App bis zum Neustart etwas
   * anderes an, als eingestellt ist.
   */
  const einstellungenSpeichern = useCallback((e: EinstellungsDaten): void => {
    setProfile((p) =>
      p
        ? {
            ...p,
            name: e.name,
            ageBand: e.ageBand,
            dailyGoalMin: e.dailyGoalMin,
            theme: e.theme,
            aiEnabled: e.aiEnabled,
            ghostEnabled: e.ghostEnabled,
            blindMode: e.blindMode,
            fontScale: e.fontScale,
          }
        : p,
    );
    setThemen(e.topicIds);
    setBlind(e.blindMode);
    void saveEinstellungen(e).catch((error: unknown) => {
      console.error('Zehni: Einstellungen konnten nicht gespeichert werden', error);
      setFehler(de.fehler.datenbank);
    });
  }, []);

  const starten = useCallback(
    async (lesson: Lesson) => {
      const vorher = progress.get(lesson.id);
      const versuche = vorher?.attempts ?? 0;

      // Problemzeichen aus dem gesammelten Fehlerprofil (SPEC.md 6.4). Faellt
      // das aus, wird ohne Schwerpunkt geuebt -- die Uebung darf daran nicht
      // scheitern.
      let emphasize: readonly string[] = [];
      try {
        emphasize = weakestChars(await loadCharStats());
      } catch (error) {
        console.warn('Zehni: Fehlerprofil nicht lesbar, uebe ohne Schwerpunkt', error);
      }

      // Aus den gewaehlten Interessen reihum, damit nicht immer dasselbe Thema
      // drankommt. Ohne Auswahl das erste Thema mit Inhalten.
      const auswahl = themen.length > 0 ? themen : topicsWithContent();
      const topicId = auswahl[versuche % Math.max(1, auswahl.length)];

      const text = provideText({
        lessonId: lesson.id,
        ...(topicId !== undefined ? { topicId } : {}),
        ageBand: profile?.ageBand ?? 'A2',
        attempt: versuche,
        emphasize,
      });

      // Ob ein Geist mitlaeuft, entscheidet lib/geist.ts -- inklusive der
      // Sperre im Abschlusstest (NORMEN.md 4.7).
      const bestBefore = vorher?.bestStrokesMin ?? null;
      const geist = geistLaeuft({
        versuche,
        bestStrokesMin: bestBefore,
        lessonId: lesson.id,
        eingeschaltet: profile?.ghostEnabled ?? true,
      });

      setAnsicht({
        name: 'einfuehrung',
        runde: {
          lesson,
          text: text.body,
          topicId: text.topicId,
          source: text.source,
          problemzeichen: emphasize,
          versuche,
          geistStrokesMin: geist ? bestBefore : null,
        },
      });
    },
    [progress, profile?.ageBand, profile?.ghostEnabled, themen],
  );

  /** Schreibt ein Ereignis auf die Tagesaufgabe fort und meldet die XP. */
  const aufgabeFortschreiben = useCallback(
    async (ereignis: Ereignis): Promise<number> => {
      if (!tagesaufgabe || tagesaufgabe.erfuellt) return 0;
      try {
        const { neuerStand, geradeErfuellt } = await tagesaufgabeFortschreiben(
          tagesaufgabe,
          ereignis,
        );
        setTagesaufgabe({
          ...tagesaufgabe,
          fortschritt: neuerStand,
          erfuellt: tagesaufgabe.erfuellt || geradeErfuellt,
        });
        if (!geradeErfuellt) return 0;
        await addXp(XP.tagesaufgabe);
        return XP.tagesaufgabe;
      } catch (error) {
        console.warn('Zehni: Tagesaufgabe konnte nicht fortgeschrieben werden', error);
        return 0;
      }
    },
    [tagesaufgabe],
  );

  const beendet = useCallback(
    async (runde: Runde, result: LessonRunResult) => {
      const vorher = progress.get(runde.lesson.id);
      const bestBefore = vorher?.bestStrokesMin ?? null;
      const neueBestleistung = bestBefore !== null && result.strokesMin > bestBefore;

      let belohnung: Belohnung = {
        xp: 0,
        neueAbzeichen: [],
        tageszielGeradeErreicht: false,
        xpGesamt: stand.xp,
      };
      let jagd: Jagdangebot | undefined;
      let letzteStrokesMin: number | null = null;

      try {
        // **Vor** dem Speichern lesen, sonst kaeme die gerade beendete Runde
        // zurueck (SPEC.md 6.5, Schritt 3).
        letzteStrokesMin = await loadLastSpeed(runde.lesson.id);

        await saveSession({
          lessonId: runde.lesson.id,
          startedAt: new Date().toISOString(),
          durationMs: result.durationMs,
          strokesTotal: result.strokesTotal,
          errors: result.errors,
          errorRate: result.errorRate,
          strokesMin: result.strokesMin,
          firstTryPct: result.firstTryPct,
          topicId: runde.topicId,
          source: runde.source,
          stars: result.stars,
          passed: result.passed,
          blind: result.blind,
          charStats: result.snapshot.charStats,
          confusions: result.snapshot.confusions,
        });

        if (result.passed) {
          const naechste = nextLesson(runde.lesson.id);
          if (naechste) await unlockLesson(naechste.id);
        }

        belohnung = await belohnungenVerbuchen({
          result,
          neueBestleistung,
          dailyGoalMin: profile?.dailyGoalMin ?? 10,
          levelVorher: stand.level,
          wochenzielSiegeVorher: stand.wochenzielSiege,
        });

        // Tagesaufgabe (SPEC.md 8.6). Die fehlerfreie Strecke kommt aus dem
        // Zustand der Zeichen, nicht aus der amtlichen Fehlerzaehlung -- die
        // Aufgabe ist Trainingsrueckmeldung, keine Bewertung (NORMEN.md 4.4.1).
        const zusatz = await aufgabeFortschreiben({
          art: 'runde',
          bestanden: result.passed,
          sterne: result.stars,
          dauerMs: result.durationMs,
          blind: result.blind,
          strecke: laengsteFehlerfreieStrecke(runde.text, result.snapshot.states),
        });
        if (zusatz > 0) belohnung = { ...belohnung, xp: belohnung.xp + zusatz };

        const neuerFortschritt = await loadProgress();
        setProgress(neuerFortschritt);
        await standNeuLaden(profile?.dailyGoalMin ?? 10);
        if (profile) await motivationNeuLaden(profile.id, neuerFortschritt);

        // Lohnt sich eine Jagd? Nur, wenn die Datenlage sie hergibt -- sonst
        // waere die benannte Schwaeche erfunden (SPEC.md 8.9).
        jagd = jagdAngebot(await loadCharStats(), runde.lesson.id);
      } catch (error) {
        console.error('Zehni: Runde konnte nicht gespeichert werden', error);
        setFehler(de.fehler.datenbank);
      }

      setAnsicht({
        name: 'auswertung',
        lesson: runde.lesson,
        result,
        ...(runde.topicId !== undefined ? { fact: pickFact(runde.topicId, runde.versuche) } : {}),
        bestBefore,
        letzteStrokesMin,
        belohnung,
        jagd,
      });
    },
    [
      progress,
      profile,
      stand.level,
      stand.wochenzielSiege,
      stand.xp,
      standNeuLaden,
      motivationNeuLaden,
      aufgabeFortschreiben,
    ],
  );

  /**
   * Was nach der Auswertung kommt.
   *
   * **Zuerst das Zwischenstück** (SPEC.md 6.6): Nach jeder dritten Lektion
   * steht eine Einheit aus Medienkompetenz oder „Lernen lernen" an. Sie hält
   * nicht auf — überspringen geht immer, und dann kommt sie später erneut.
   */
  const weiterNachAuswertung = useCallback(
    async (lesson: Lesson, bestanden: boolean): Promise<void> => {
      if (bestanden) {
        try {
          const module = await loadModules();
          const erledigt = new Set(
            [...module.values()].filter((m) => m.completed).map((m) => m.unitId),
          );
          const unit = faelligesInterlude(lesson.id, erledigt);
          if (unit) {
            // Nur die datengestuetzte Einheit braucht Zahlen. Sie zu laden
            // kostet eine Abfrage, also nur dann.
            const lernzahlen = unit.type === 'lernen-kurve' ? await loadLernkurve() : undefined;
            setAnsicht({ name: 'zwischenstueck', unit, lernzahlen });
            return;
          }
        } catch (error) {
          // Ein Zwischenstueck ist eine Zugabe. Faellt es aus, geht es
          // trotzdem weiter -- kein Grund, den Lernpfad zu blockieren.
          console.warn('Zehni: Zwischenstueck konnte nicht geladen werden', error);
        }
      }

      const naechste = bestanden ? nextLesson(lesson.id) : undefined;
      const ziel = naechste ? getLesson(naechste.id) : undefined;
      if (ziel) await starten(ziel);
      else setAnsicht({ name: 'lernweg' });
    },
    [starten],
  );

  /**
   * Ein Zwischenstueck vom Lernweg aus oeffnen (SPEC.md 6.7).
   *
   * Nur die datengestuetzte Einheit braucht Zahlen; sie zu laden kostet eine
   * Abfrage, also nur dann.
   */
  const zwischenstueckOeffnen = useCallback(async (unitId: string): Promise<void> => {
    const unit = getInterlude(unitId);
    if (!unit) return;
    let lernzahlen: Lernzahlen | undefined;
    if (unit.type === 'lernen-kurve') {
      try {
        lernzahlen = await loadLernkurve();
      } catch (error) {
        // Ohne Zahlen zeigt die Einheit ihre neutrale Fassung -- genau das,
        // was MODUL-LERNEN.md 1.1 ohnehin verlangt.
        console.warn('Zehni: Lernkurve nicht lesbar', error);
      }
    }
    setAnsicht({ name: 'zwischenstueck', unit, lernzahlen });
  }, []);

  /**
   * Eine beendete Minispielrunde.
   *
   * Verbucht wird **nur die Runde**, nie ein Ergebnis: keine Punktzahl, kein
   * Bestwert, kein Eintrag in `sessions` oder `char_stats` (SPEC.md 8.10). Die
   * XP sind auf drei Runden je Tag gedeckelt; darüber hinaus darf beliebig
   * weitergespielt werden, es gibt nur nichts mehr dafür.
   */
  const spielBeendet = useCallback(
    async (zurueck: Rueckweg): Promise<void> => {
      try {
        const xp = await minispielGespielt();
        if (xp > 0) await addXp(xp);
        await standNeuLaden(profile?.dailyGoalMin ?? 10);
      } catch (error) {
        console.warn('Zehni: Minispiel konnte nicht verbucht werden', error);
      }
      setAnsicht(zurueckZu(zurueck));
    },
    [standNeuLaden, profile?.dailyGoalMin],
  );

  /** Eine beendete Tastenjagd: XP, Tagesaufgabe, zurück zum Lernweg. */
  const jagdBeendet = useCallback(async (): Promise<void> => {
    try {
      await addXp(XP.tastenjagd);
      await aufgabeFortschreiben({ art: 'tastenjagd' });
      await standNeuLaden(profile?.dailyGoalMin ?? 10);
    } catch (error) {
      console.warn('Zehni: Tastenjagd konnte nicht verbucht werden', error);
    }
    setAnsicht({ name: 'lernweg' });
  }, [aufgabeFortschreiben, standNeuLaden, profile?.dailyGoalMin]);

  if (ansicht.name === 'laden') {
    return <div className="grid h-full place-items-center text-gedaempft">{de.laden}</div>;
  }

  /**
   * Die zuletzt freigeschaltete Lektion. Sie gibt den Zeichenvorrat der
   * Minispiele vor — **nur bereits gelernte Zeichen** (SPEC.md 8.10).
   */
  const hoechsteLektion =
    allLessons()
      .filter((l) => progress.get(l.id)?.status !== undefined)
      .reduce<Lesson | undefined>((a, b) => (a && a.order > b.order ? a : b), undefined)?.id ??
    'L01';

  const zeigtKopfzeile =
    ansicht.name === 'lernweg' ||
    ansicht.name === 'lernstube' ||
    ansicht.name === 'abzeichen' ||
    ansicht.name === 'einstellungen' ||
    ansicht.name === 'modulbereich' ||
    ansicht.name === 'spiele' ||
    ansicht.name === 'einfuehrung' ||
    ansicht.name === 'auswertung';

  return (
    <div className="flex h-full flex-col">
      {/* Prueft beim Start, blockiert nichts und zeigt nur dann etwas, wenn
          wirklich ein Update bereitliegt (SPEC.md 11.1). */}
      <UpdateHinweis updater={updater} />

      {fehler && (
        <div role="alert" className="border-b border-korrigiert bg-korrigiert/10 px-6 py-3 text-sm">
          <strong className="font-semibold">{fehler}</strong>{' '}
          <span className="text-gedaempft">{de.fehler.datenbankErklaerung}</span>
        </div>
      )}

      {zeigtKopfzeile && (
        <Kopfzeile
          stand={stand}
          name={profile?.name ?? ''}
          aktiv={ansicht.name}
          updateBereit={updater.stand.name === 'bereit'}
          onLernweg={() => setAnsicht({ name: 'lernweg' })}
          onLernstube={() => setAnsicht({ name: 'lernstube' })}
          onAbzeichen={() => void abzeichenOeffnen()}
          onModule={() => setAnsicht({ name: 'modulbereich' })}
          onSpiele={() => setAnsicht({ name: 'spiele' })}
          onEinstellungen={() => setAnsicht({ name: 'einstellungen' })}
        />
      )}

      <div className="min-h-0 flex-1">
        {ansicht.name === 'einrichtung' && (
          <Onboarding
            onDone={(e) => {
              void (async () => {
                try {
                  await saveOnboarding(e);
                  const p = await getOrCreateProfile();
                  setProfile(p);
                  await standNeuLaden(p.dailyGoalMin);
                } catch (error) {
                  console.error('Zehni: Einrichtung konnte nicht gespeichert werden', error);
                  setFehler(de.fehler.datenbank);
                }
                setAnsicht({ name: 'tastaturtest' });
              })();
            }}
          />
        )}

        {ansicht.name === 'tastaturtest' && (
          <LayoutCheck
            onDone={(bestanden) => {
              setAnsicht({ name: 'lernweg' });
              // Nur eine wirklich bestandene Pruefung wird gemerkt. Wer
              // "Trotzdem weitermachen" waehlt, bekommt sie beim naechsten
              // Start erneut -- meist ist das Layout dann doch falsch.
              if (bestanden) {
                void markLayoutVerified().catch((error: unknown) => {
                  console.warn('Zehni: Tastaturpruefung konnte nicht gemerkt werden', error);
                });
              }
            }}
          />
        )}

        {ansicht.name === 'lernweg' && (
          <LessonList
            progress={progress}
            erledigt={erledigteEinheiten}
            onStart={(l) => void starten(l)}
            onZwischenstueck={(id) => void zwischenstueckOeffnen(id)}
            onModul={(id) => {
              const einheit = getEinheit(id);
              if (einheit) setAnsicht({ name: 'moduleinheit', einheit, zurueck: 'lernweg' });
            }}
            onSpiel={(spiel) => setAnsicht({ name: 'spiel', spiel, zurueck: 'lernweg' })}
            kopfbereich={
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Ein Satz zur Begrüßung, mehr nicht (SPEC.md 8.5). */}
                <div className="sm:col-span-2">
                  <Begruessung stand={stand} />
                </div>
                {tagesaufgabe && !tagesaufgabe.ausgeblendet && (
                  <TagesaufgabeKarte
                    stand={tagesaufgabe}
                    onAusblenden={() => {
                      setTagesaufgabe({ ...tagesaufgabe, ausgeblendet: true });
                      void tagesaufgabeAusblenden(tagesaufgabe.tag).catch((error: unknown) => {
                        console.warn('Zehni: Tagesaufgabe nicht ausgeblendet', error);
                      });
                    }}
                  />
                )}
                {wochenziel && <WochenzielBalken stand={wochenziel} />}
              </div>
            }
          />
        )}

        {ansicht.name === 'lernstube' && (
          <Lernstube
            level={stand.level}
            wochenziele={stand.wochenzielSiege}
            onZurueck={() => setAnsicht({ name: 'lernweg' })}
          />
        )}

        {ansicht.name === 'abzeichen' && (
          <AbzeichenGalerie
            vergeben={abzeichen}
            onZurueck={() => setAnsicht({ name: 'lernweg' })}
          />
        )}

        {ansicht.name === 'modulbereich' && (
          <Modulbereich
            erledigt={erledigteEinheiten}
            onStart={(id) => {
              const einheit = getEinheit(id);
              if (einheit) setAnsicht({ name: 'moduleinheit', einheit, zurueck: 'modulbereich' });
            }}
            onZurueck={() => setAnsicht({ name: 'lernweg' })}
          />
        )}

        {ansicht.name === 'spiele' && (
          <Spielauswahl
            lessonId={hoechsteLektion}
            onSpielen={(spiel) => setAnsicht({ name: 'spiel', spiel, zurueck: 'spiele' })}
            onZurueck={() => setAnsicht({ name: 'lernweg' })}
          />
        )}

        {/* Kein Ergebnis eines Minispiels fliesst in eine Bewertung ein
            (SPEC.md 8.10). Die Punktzahl kommt hier an und endet hier; nach
            aussen geht nur die Zahl der Runden -- fuer die XP-Deckelung. */}
        {ansicht.name === 'spiel' && (
          <>
            {ansicht.spiel === 'buchstabenregen' && (
              <Buchstabenregen
                lessonId={hoechsteLektion}
                saat={String(stand.xp)}
                onBeenden={() => void spielBeendet(ansicht.zurueck)}
              />
            )}
            {ansicht.spiel === 'wortsalat' && (
              <Wortsalat
                lessonId={hoechsteLektion}
                saat={String(stand.xp)}
                onBeenden={() => void spielBeendet(ansicht.zurueck)}
              />
            )}
          </>
        )}

        {ansicht.name === 'moduleinheit' && (
          <EinheitScreen
            einheit={ansicht.einheit}
            onAbbrechen={() => setAnsicht(zurueckZu(ansicht.zurueck))}
            onFertig={() => {
              void (async () => {
                try {
                  // Genau ein Wahrheitswert: abgeschlossen. Ob die Aufgabe beim
                  // ersten Versuch sass, ist kein Ergebnis, das irgendwohin
                  // gehoert (SPEC.md 6.6.1, MODUL-LERNEN.md 5).
                  await completeModule(ansicht.einheit.id);
                  await aufgabeFortschreiben({ art: 'zwischenstueck' });
                  await standNeuLaden(profile?.dailyGoalMin ?? 10);
                } catch (error) {
                  console.warn('Zehni: Moduleinheit konnte nicht gemerkt werden', error);
                }
                setAnsicht(zurueckZu(ansicht.zurueck));
              })();
            }}
          />
        )}

        {ansicht.name === 'einstellungen' && profile && (
          <Einstellungen
            start={{
              name: profile.name,
              ageBand: profile.ageBand,
              dailyGoalMin: profile.dailyGoalMin,
              theme: profile.theme,
              aiEnabled: profile.aiEnabled,
              ghostEnabled: profile.ghostEnabled,
              blindMode: profile.blindMode,
              fontScale: profile.fontScale,
              topicIds: themen,
            }}
            onSpeichern={einstellungenSpeichern}
            onZurueck={() => setAnsicht({ name: 'lernweg' })}
            updater={updater}
            onTastaturPruefen={() => {
              // Die Bestaetigung zuruecksetzen, damit die Pruefung auch beim
              // naechsten Start wieder erscheint, falls sie hier abgebrochen wird.
              void clearLayoutVerified().catch((error: unknown) => {
                console.warn('Zehni: Tastaturpruefung nicht zurueckgesetzt', error);
              });
              setAnsicht({ name: 'tastaturtest' });
            }}
          />
        )}

        {ansicht.name === 'einfuehrung' && (
          <LessonIntro
            lesson={ansicht.runde.lesson}
            blind={blind}
            onBlindUmschalten={blindUmschalten}
            onStart={() => setAnsicht({ name: 'aufwaermen', runde: ansicht.runde })}
            onBack={() => setAnsicht({ name: 'lernweg' })}
          />
        )}

        {ansicht.name === 'aufwaermen' && (
          <Aufwaermen
            lessonId={ansicht.runde.lesson.id}
            problemzeichen={ansicht.runde.problemzeichen}
            versuch={ansicht.runde.versuche}
            blind={blind}
            onWeiter={() => setAnsicht({ name: 'uebung', runde: ansicht.runde })}
          />
        )}

        {ansicht.name === 'uebung' && (
          <LessonScreen
            lesson={ansicht.runde.lesson}
            text={ansicht.runde.text}
            blind={blind}
            onBlindUmschalten={blindUmschalten}
            geistStrokesMin={ansicht.runde.geistStrokesMin}
            onFinished={(r) => void beendet(ansicht.runde, r)}
            onAbort={() => setAnsicht({ name: 'lernweg' })}
          />
        )}

        {ansicht.name === 'tastenjagd' && (
          <Tastenjagd
            angebot={ansicht.angebot}
            saat={String(stand.xp)}
            blind={blind}
            onFertig={() => void jagdBeendet()}
          />
        )}

        {ansicht.name === 'auswertung' && (
          <ResultScreen
            lesson={ansicht.lesson}
            result={ansicht.result}
            fact={ansicht.fact}
            bestBefore={ansicht.bestBefore}
            letzteStrokesMin={ansicht.letzteStrokesMin}
            belohnung={ansicht.belohnung}
            hasNext={nextLesson(ansicht.lesson.id) !== undefined}
            onRepeat={() => void starten(ansicht.lesson)}
            onContinue={() => void weiterNachAuswertung(ansicht.lesson, ansicht.result.passed)}
            jagdangebot={
              ansicht.jagd ? (
                <Jagdfrage
                  angebot={ansicht.jagd}
                  onLosgehen={() => setAnsicht({ name: 'tastenjagd', angebot: ansicht.jagd! })}
                  onSpaeter={() => void weiterNachAuswertung(ansicht.lesson, ansicht.result.passed)}
                />
              ) : undefined
            }
          />
        )}

        {ansicht.name === 'zwischenstueck' && (
          <InterludeScreen
            unit={ansicht.unit}
            lernzahlen={ansicht.lernzahlen}
            onUeberspringen={() => setAnsicht({ name: 'lernweg' })}
            onFertig={(erkannt) => {
              void (async () => {
                try {
                  await completeModule(ansicht.unit.id, erkannt);
                  await aufgabeFortschreiben({ art: 'zwischenstueck' });
                  await standNeuLaden(profile?.dailyGoalMin ?? 10);
                } catch (error) {
                  console.warn('Zehni: Zwischenstueck konnte nicht gemerkt werden', error);
                }
                setAnsicht({ name: 'lernweg' });
              })();
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Verbucht XP, Tagesziel, Serie, Wochenziel und Abzeichen für eine beendete
 * Runde.
 *
 * Die Reihenfolge ist nicht beliebig: Erst die Übungszeit, weil davon das
 * Tagesziel abhängt; dann die Serie, die am Tagesziel hängt; erst danach die
 * Abzeichen, die die Serie kennen müssen.
 */
async function belohnungenVerbuchen(e: {
  result: LessonRunResult;
  neueBestleistung: boolean;
  dailyGoalMin: number;
  levelVorher: number;
  wochenzielSiegeVorher: number;
}): Promise<Belohnung> {
  let xp = xpFuerRunde({
    sterne: e.result.stars,
    bestanden: e.result.passed,
    neueBestleistung: e.neueBestleistung,
    blindmodus: e.result.blind,
  });

  const vorher = await loadActivity();
  const heute = await addActivity(e.result.durationMs, e.dailyGoalMin);
  const tageszielGeradeErreicht = !vorher.goalMet && heute.goalMet;
  if (tageszielGeradeErreicht) xp += XP.tagesziel;

  if (tageszielGeradeErreicht) {
    const serie = await loadStreak();
    await saveStreak(serieFortschreiben(serie, heute.day));
  }

  await addXp(xp);

  // Wochenziel (SPEC.md 8.8). Der Fortschritt zaehlt sich aus den Runden selbst
  // zusammen; hier ist nur zu pruefen, ob die Belohnung faellig ist.
  let dekoTeil: string | undefined;
  const woche = await ladeWochenziel();
  if (belohnungFaellig(woche)) {
    await wochenzielBelohnt(woche.week);
    await addXp(XP.wochenziel);
    xp += XP.wochenziel;
    const teil = neuesTeil(
      { level: e.levelVorher, wochenziele: e.wochenzielSiegeVorher },
      { level: e.levelVorher, wochenziele: e.wochenzielSiegeVorher + 1 },
    );
    dekoTeil = teil?.label;
  }

  // Abzeichen erst danach: Sie muessen die neue Serie und die neue Uebungszeit
  // kennen (SPEC.md 8.2).
  const [progressJetzt, vergeben, serieJetzt, leistung, module, aktivitaet, blindMinuten] =
    await Promise.all([
      loadProgress(),
      loadRewards(),
      loadStreak(),
      loadLeistungsdaten(),
      loadModules(),
      loadActivity(),
      ladeBlindMinuten(),
    ]);

  const bild: FortschrittsBild = {
    bestandeneLektionen: new Set(
      [...progressJetzt.values()].filter((p) => p.status === 'passed').map((p) => p.lessonId),
    ),
    besteStrokesMin: leistung.besteStrokesMin,
    // "fehlerfrei" verlangt eine Lektion mit 0,00 % Fehlerquote (SPEC.md 8.2).
    jeFehlerfrei: leistung.besteErrorRate !== null && leistung.besteErrorRate === 0,
    minutenHeute: aktivitaet.activeMs / 60000,
    blindMinuten,
    serieTage: serieJetzt.currentDays,
    themenProbiert: leistung.themenProbiert,
    diplomBestanden: progressJetzt.get('L25')?.status === 'passed',
    fallenErkannt: [...module.values()].filter((m) => m.recognized === true).length,
    zwischenstueckeFertig: [...module.values()].filter((m) => m.completed).length,
  };

  const neue = neueAbzeichen(vergeben, bild);
  if (neue.length > 0) {
    await grantRewards(neue);
    await addXp(neue.length * XP.abzeichen);
    xp += neue.length * XP.abzeichen;
  }

  const xpGesamt = await loadXp();
  const levelNachher = levelFortschritt(xpGesamt).level;

  return {
    xp,
    neueAbzeichen: neue,
    tageszielGeradeErreicht,
    xpGesamt,
    ...(levelNachher > e.levelVorher ? { levelAufstieg: levelNachher } : {}),
    ...(zielErreicht(woche) && dekoTeil !== undefined ? { wochenzielTeil: dekoTeil } : {}),
  };
}

/**
 * Das Maskottchen begrüßt auf dem Lernweg (SPEC.md 8.5).
 *
 * Genau ein Satz, und **nicht** während des Tippens — der Übungsbildschirm
 * zeigt die Maus nirgends.
 */
function Begruessung({ stand }: { stand: Gesamtstand }) {
  const maus = maskottchenFuer({
    art: 'begruessung',
    serieTage: stand.serieTage,
    tageSeitLetztem: stand.tageSeitLetztem,
  });
  return (
    <MaskottchenMitSpruch zustand={maus.zustand} spruch={de.maskottchen.sprueche[maus.spruch]} />
  );
}

/** Kopfzeile mit Level, XP, Serie, Tagesziel und den Wegen nach nebenan. */
function Kopfzeile({
  stand,
  name,
  aktiv,
  updateBereit,
  onLernweg,
  onLernstube,
  onAbzeichen,
  onModule,
  onSpiele,
  onEinstellungen,
}: {
  stand: Gesamtstand;
  name: string;
  /** Welcher Nebenbildschirm gerade offen ist — für „Du bist hier". */
  aktiv: Ansicht['name'];
  updateBereit: boolean;
  onLernweg: () => void;
  onLernstube: () => void;
  onAbzeichen: () => void;
  onModule: () => void;
  onSpiele: () => void;
  onEinstellungen: () => void;
}) {
  const f = levelFortschritt(stand.xp);

  /**
   * Nach Verlust der Serie eine freundliche Einordnung, keine Dramatisierung
   * (SPEC.md 8.3). Gezeigt wird sie nur, wenn es überhaupt schon einmal eine
   * Serie gab — sonst wäre „Deine längste Serie: 0 Tage" der trostloseste
   * Satz der ganzen App.
   */
  const serienText =
    stand.serieTage > 0
      ? de.serie.laufend(stand.serieTage)
      : stand.serieLaengste > 0
        ? de.serie.verloren(stand.serieLaengste)
        : null;

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-rand bg-flaeche px-6 py-3 text-sm">
      {/* Der Weg nach Hause steht immer an derselben Stelle, ganz links, und
          ist als einziger Knopf gefüllt. Ein Kind soll nie suchen müssen, wie
          es zurückkommt. */}
      <button
        type="button"
        onClick={onLernweg}
        title={de.navigation.hauptmenueTitel}
        aria-current={aktiv === 'lernweg' ? 'page' : undefined}
        className={[
          'flex items-center gap-2 rounded-lg px-3 py-1.5 font-semibold',
          aktiv === 'lernweg'
            ? 'bg-akzent/15 text-akzent'
            : 'bg-akzent text-white hover:opacity-90',
        ].join(' ')}
      >
        <Maskottchen zustand="idle" groesse={20} />
        {de.navigation.hauptmenue}
      </button>

      <span className="font-semibold">{name ? de.kopfzeile.begruessung(name) : de.app.name}</span>

      <span className="flex items-center gap-2" title={de.kopfzeile.xpTitel}>
        <span className="rounded-full bg-akzent px-2 py-0.5 font-semibold text-white">
          {de.kopfzeile.level} {f.level}
        </span>
        <span className="h-2 w-24 overflow-hidden rounded-full bg-rand/60">
          <span
            className="block h-full rounded-full bg-akzent"
            style={{ width: `${Math.round(f.anteil * 100)}%` }}
          />
        </span>
        <span className="tabular-nums text-gedaempft">{de.kopfzeile.xp(stand.xp)}</span>
      </span>

      {serienText && (
        <span className="text-gedaempft" title={de.serie.jokerErklaerung}>
          {serienText}
        </span>
      )}

      <span className="ml-auto text-gedaempft">
        {stand.tageszielErreicht
          ? de.kopfzeile.tageszielGeschafft
          : de.kopfzeile.tagesziel(stand.minutenHeute)}
      </span>

      <Reiter offen={aktiv === 'modulbereich'} onClick={onModule}>
        {de.modulbereich.oeffnen}
      </Reiter>

      <Reiter offen={aktiv === 'spiele'} onClick={onSpiele}>
        {de.minispiele.oeffnen}
      </Reiter>

      <Reiter offen={aktiv === 'abzeichen'} onClick={onAbzeichen}>
        {de.abzeichenGalerie.oeffnen}
      </Reiter>

      <Reiter offen={aktiv === 'lernstube'} onClick={onLernstube}>
        {de.lernstube.oeffnen}
      </Reiter>

      <Reiter offen={aktiv === 'einstellungen'} onClick={onEinstellungen}>
        {de.einstellungen.oeffnen}
        {/* Damit ein fertiges Update auch dann auffaellt, wenn der Hinweis
            unten rechts weggeklickt wurde (SPEC.md 11.1). */}
        {updateBereit && (
          <span
            title={de.navigation.neuesUpdate}
            aria-label={de.navigation.neuesUpdate}
            className="ml-2 inline-block h-2 w-2 rounded-full bg-akzent align-middle"
          />
        )}
      </Reiter>
    </header>
  );
}

/**
 * Ein Eintrag in der Kopfzeile.
 *
 * Der gerade offene Bereich ist hervorgehoben und trägt `aria-current`. Ohne
 * diese Markierung weiß man im Nebenbildschirm nicht, wo man ist — und sucht
 * dann den Weg zurück.
 */
function Reiter({
  offen,
  onClick,
  children,
}: {
  offen: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={offen ? 'page' : undefined}
      title={offen ? de.navigation.hier : undefined}
      className={[
        'rounded-lg border px-3 py-1.5',
        offen
          ? 'border-akzent bg-akzent/10 font-semibold text-akzent'
          : 'border-rand text-gedaempft hover:text-text',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
