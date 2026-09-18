/**
 * Alle Texte, die die Nutzerin zu sehen bekommt.
 *
 * **Nutzertexte werden nie hartkodiert** (ARCHITEKTUR.md, Sprache). Auch wenn v1 nur
 * Deutsch kann, liegt alles hier — sonst findet man die Stellen später nicht
 * wieder, und ein Rechtschreibfehler bleibt monatelang stehen.
 *
 * Zwei Regeln für alles in dieser Datei:
 *
 *   1. **Kein Fachjargon.** Die Leserin ist zehn.
 *   2. **Kein Wort „Fehlerquote" in `L01`–`L13`.** Dort bewertet die Sicherheit,
 *      und die beiden Zahlen dürfen nie vermischt werden (NORMEN.md 4.4.1).
 */

export const de = {
  app: {
    name: 'Zehni',
    untertitel: 'Tippen lernen mit zehn Fingern',
  },

  lernpfad: {
    titel: 'Dein Lernweg',
    lektion: 'Lektion',
    neueZeichen: 'Neue Tasten',
    wiederholung: 'Wiederholung',
    gesperrt: 'Noch gesperrt',
    gesperrtErklaerung: 'Schaffe die Lektion davor, dann geht es hier weiter.',
    geschafft: 'Geschafft',
    starten: 'Losgehen',
    nochmal: 'Nochmal üben',
    versuche: (n: number): string => (n === 1 ? '1 Versuch' : `${n} Versuche`),
    // Muss sichtbar sein: Ohne diese Zeile besteht man eine Lektion, die
    // naechste geht nicht auf, und nichts sagt warum.
    runden: (geschafft: number, noetig: number): string =>
      `${geschafft} von ${noetig} Runden geschafft`,
    bestwert: 'Bestwert',

    // Die Stationen zwischen den Lektionen (SPEC.md 6.7). Sie halten nie auf,
    // deshalb steht das auch dran.
    stationZwischenstueck: 'Zum Nachdenken',
    stationModul: 'Zum Ausprobieren',
    stationSpiel: 'Spiel',
    stationFreiwillig: 'Freiwillig, du kannst es auch überspringen.',
    stationOeffnen: 'Ansehen',
    stationSpielen: 'Spielen',
    stationNochmal: 'Nochmal',
    stationGemacht: 'Gemacht',
  },

  zwischenstueck: {
    ueberschrift: 'Kurze Pause vom Tippen',
    weiter: 'Weiter',
    fertig: 'Fertig',
    ueberspringen: 'Überspringen',
    ueberspringenHinweis: 'Du bekommst es später noch einmal angeboten.',
    frageTitel: 'Eine Frage dazu',
    richtig: 'Richtig!',
    nichtGanz: 'Nicht ganz.',
    // Kein Punktabzug, keine Wiederholungssperre. Die Erklaerung ist der Zweck,
    // nicht die Bewertung (SPEC.md 6.6.1, Regel 5).
    keineSorge: 'Macht nichts, dafür ist die Frage ja da.',
  },

  lernkurve: {
    /**
     * Der einzige Satz der App, der eine Zahl über die Nutzerin behauptet.
     * Er wird **nur** aus ihren echten Sitzungen gebildet und erscheint erst
     * ab fünf Runden (MODUL-LERNEN.md 1.1).
     */
    satz: (sitzungen: number, erste: number, letzte: number): string =>
      letzte > erste
        ? `In deiner ersten Runde hast du ${erste} Anschläge pro Minute geschafft. In deiner letzten waren es ${letzte}. Dazwischen liegen ${sitzungen} Runden.`
        : `Du hast bisher ${sitzungen} Runden getippt. Dein Tempo schwankt noch, und das ist völlig normal: Am Anfang geht es auf und ab, bevor es nach oben geht.`,
  },

  fallen: {
    weiter: 'Weiter',
    verstanden: 'Verstanden',
    abzeichenHinweis: 'Abzeichen verdient',
    feldName: 'Name',
    feldTelefon: 'Telefonnummer',
    feldSchule: 'Schule',
    // Der wichtigste Satz der ganzen Einheit: Hier stehen erfundene Daten, und
    // das Kind soll wissen, dass es nie seine echten eintippen soll.
    erfundenHinweis:
      'Diese Angaben sind erfunden und lassen sich nicht ändern. Deine echten gehören nirgends in so ein Formular.',

    gewinn: {
      ueberschrift: 'Du hast gewonnen!',
      text: 'Herzlichen Glückwunsch! Du hast ein neues Tablet gewonnen. Trag schnell deine Daten ein, damit wir es dir schicken können.',
      zaehler: 'Dein Gewinn verfällt in',
      absenden: 'Jetzt abschicken und Gewinn sichern',
      ablehnen: 'Das glaube ich nicht',
    },

    steckbrief: {
      ueberschrift: 'Dein Spieleprofil',
      text: 'Für dieses Spiel brauchst du ein Profil. Denk dir etwas aus — echte Angaben brauchst du hier nicht.',
      spitzname: 'Spitzname',
      tier: 'Lieblingstier',
      nurHarmlos:
        'Nur harmlose Sachen. Zehni fragt dich nie nach Namen, Adresse, Telefonnummer oder E-Mail.',
      veroeffentlichen: 'Profil veröffentlichen',
      geteiltTitel: 'Drei Tage später',
      geteiltText:
        'Dein Profil ist inzwischen woanders aufgetaucht. Jemand hat einen Bildschirmausschnitt gemacht und ihn weitergeschickt.',
      fremdeSeite: 'Irgendein Forum, irgendwo im Netz',
      ohneAngabe: '(nichts eingetragen)',
      kommentare: [
        'kenn ich, geht auf meine Schule',
        'hahaha guck mal',
        'hab ich schon weitergeleitet',
      ],
    },

    abo: {
      ueberschrift: 'Jetzt gratis spielen!',
      text: 'Das beliebteste Spiel des Jahres. Sofort loslegen, keine Kosten.',
      starten: 'Jetzt gratis starten',
      haekchen: 'Ich stimme den Geschäftsbedingungen und der automatischen Verlängerung zu.',
      kleingedrucktes:
        'Der Zugang ist in den ersten 7 Tagen kostenfrei. Danach wird ein Betrag von 9,99 EUR monatlich abgebucht. Das Abonnement verlängert sich automatisch um jeweils einen weiteren Monat, sofern nicht spätestens 14 Tage vor Ablauf schriftlich gekündigt wird. Eine Kündigung innerhalb der ersten 7 Tage ist jederzeit möglich.',
      nachsehen: 'Moment, was steht da unten klein?',
    },
  },

  kopfzeile: {
    begruessung: (name: string): string => `Hallo, ${name}`,
    level: 'Level',
    xp: (n: number): string => `${n} XP`,
    xpTitel: 'Erfahrungspunkte',
    serie: (tage: number): string => (tage === 1 ? '1 Tag in Folge' : `${tage} Tage in Folge`),
    tagesziel: (min: number): string => `heute ${min} min geübt`,
    tageszielGeschafft: 'Tagesziel geschafft',
  },

  belohnung: {
    xpErhalten: (n: number): string => `+${n} XP`,
    neuesAbzeichen: 'Neues Abzeichen',
    neueAbzeichen: 'Neue Abzeichen',
    tagesziel: 'Tagesziel geschafft!',
  },

  /**
   * Jedes Abzeichen hat Titel, Beschreibung und eine kurze Gratulation
   * (SPEC.md 8.2). Die Beschreibung sagt, **wofür** es das Abzeichen gibt —
   * auch solange es noch nicht verdient ist, denn eine Galerie voller Rätsel
   * motiviert niemanden. Das Icon steckt in `features/stats/Abzeichen.tsx`.
   */
  abzeichen: {
    grundstellung: {
      titel: 'Grundstellung',
      beschreibung: 'Die Grundreihe sitzt, samt den Tastmarken auf f und j.',
      gratulation: 'Deine Finger haben ihren Platz gefunden!',
    },
    'erste-woerter': {
      titel: 'Erste Wörter',
      beschreibung: 'Aus einzelnen Tasten sind richtige Wörter geworden.',
      gratulation: 'Das waren deine ersten echten Wörter!',
    },
    'obere-reihe': {
      titel: 'Obere Reihe',
      beschreibung: 'Die Reihe über der Grundreihe ist vollständig gelernt.',
      gratulation: 'Die obere Reihe gehört dir!',
    },
    'untere-reihe': {
      titel: 'Untere Reihe',
      beschreibung: 'Auch die Reihe unter der Grundreihe sitzt.',
      gratulation: 'Alle Buchstaben sind beisammen!',
    },
    grossschreiber: {
      titel: 'Großschreiber',
      beschreibung: 'Umschalt mit der jeweils anderen Hand, ohne hinzusehen.',
      gratulation: 'Große Buchstaben halten dich nicht mehr auf!',
    },
    zahlenjongleur: {
      titel: 'Zahlenjongleur',
      beschreibung: 'Die Zahlenreihe ist gelernt.',
      gratulation: 'Zahlen gehen dir jetzt leicht von der Hand!',
    },
    'sonderzeichen-profi': {
      titel: 'Sonderzeichen-Profi',
      beschreibung: 'Zeichen wie das At-Zeichen und die Klammern sitzen.',
      gratulation: 'Jetzt fehlt dir kein Zeichen mehr!',
    },
    blindflug: {
      titel: 'Blindflug',
      beschreibung: 'Zehn Minuten im Blindmodus geübt, ganz ohne Tastaturbild.',
      gratulation: 'Du brauchst die Tastatur auf dem Bildschirm gar nicht mehr!',
    },
    fehlerfrei: {
      titel: 'Fehlerfrei',
      beschreibung: 'Eine ganze Lektion ohne einen einzigen Fehler im Ergebnis.',
      gratulation: 'Kein einziger Fehler, das schafft nicht jeder!',
    },
    sprinter: {
      titel: 'Sprinter',
      beschreibung: 'Einmal 120 Anschläge in einer Minute geschafft.',
      gratulation: 'Das war richtig schnell!',
    },
    ausdauer: {
      titel: 'Ausdauer',
      beschreibung: 'An einem Tag dreißig Minuten geübt.',
      gratulation: 'Eine halbe Stunde am Stück, alle Achtung!',
    },
    woche: {
      titel: 'Eine Woche dabei',
      beschreibung: 'Sieben Tage in Folge das Tagesziel erreicht.',
      gratulation: 'Eine ganze Woche jeden Tag, das ist die halbe Miete!',
    },
    monat: {
      titel: 'Einen Monat dabei',
      beschreibung: 'Dreißig Tage in Folge das Tagesziel erreicht.',
      gratulation: 'Dreißig Tage am Stück, daraus ist eine Gewohnheit geworden!',
    },
    neugierig: {
      titel: 'Neugierig',
      beschreibung: 'Zu allen zehn Themen einmal geübt.',
      gratulation: 'Du hast dir wirklich alles angesehen!',
    },
    'zehni-diplom': {
      titel: 'Zehni-Diplom',
      beschreibung: 'Der Abschlusstest ist bestanden.',
      gratulation: 'Du kannst das Zehnfingersystem, ganz ohne Kurs!',
    },
    'nicht-reingefallen': {
      titel: 'Nicht reingefallen',
      beschreibung: 'Eine Masche erkannt und nicht mitgemacht.',
      gratulation: 'Du hast gemerkt, dass da etwas nicht stimmt!',
    },
    wachsam: {
      titel: 'Wachsam',
      beschreibung: 'Alle drei Maschen erkannt.',
      gratulation: 'Dich legt so schnell niemand herein!',
    },
    durchblicker: {
      titel: 'Durchblicker',
      beschreibung: 'Alle acht Zwischenstücke angesehen.',
      gratulation: 'Du weißt jetzt mehr als nur Tippen!',
    },
  },

  abzeichenGalerie: {
    titel: 'Deine Abzeichen',
    oeffnen: 'Abzeichen',
    zurueck: 'Zurück',
    stand: (a: number, b: number): string => `${a} von ${b} gesammelt`,
    nochNicht: 'Noch nicht verdient',
    erhaltenAm: (datum: string): string => `Bekommen am ${datum}`,
  },

  onboarding: {
    willkommenTitel: 'Hallo! Ich bin Zehni.',
    willkommenText:
      'Mit mir lernst du, mit zehn Fingern zu tippen, ohne auf die Tasten zu schauen. Am Anfang fühlt sich das komisch an. Nach ein paar Tagen nicht mehr.',
    willkommenDauer: 'Wir richten das jetzt kurz ein. Das dauert keine zwei Minuten.',
    losGehts: 'Los geht’s',

    nameTitel: 'Wie sollen wir dich nennen?',
    nameErklaerung:
      'Nur damit es netter aussieht. Du kannst das Feld auch leer lassen, dann sage ich einfach „du".',
    namePlatzhalter: 'Dein Name',

    // Die Altersfrage darf sich nicht wie eine Pruefung anfuehlen
    // (SPEC.md 15.13). Deshalb steht der Grund davor, und es gibt keine
    // "richtige" Antwort -- nur drei gleichwertige Knoepfe.
    alterTitel: 'Wie alt bist du?',
    alterErklaerung:
      'Ich suche dir dann Übungstexte, die zu dir passen. Für Jüngere kürzere Sätze, für Ältere längere. Falsch machen kannst du hier nichts, und ändern geht später jederzeit.',
    alterA1: '8 bis 10',
    alterA2: '11 bis 13',
    alterA3: '14 oder älter',
    alterJahre: 'Jahre',

    themenTitel: 'Worüber möchtest du schreiben?',
    themenErklaerung:
      'Such dir ein bis drei Sachen aus, die dich interessieren. Deine Übungstexte handeln dann davon. Auch das kannst du später ändern.',
    themenAuswahl: (n: number): string =>
      n === 0 ? 'Noch nichts ausgewählt' : n === 1 ? '1 Thema gewählt' : `${n} Themen gewählt`,
    themenZuViele: 'Mehr als drei geht nicht. Klick eins wieder ab.',

    zielTitel: 'Wie viel möchtest du üben?',
    zielErklaerung:
      'Kurz und oft bringt mehr als lang und selten. Zehn Minuten am Tag reichen völlig. Du kannst natürlich länger üben, wenn du magst.',
    zielMinuten: (n: number): string => `${n} Minuten am Tag`,

    weiter: 'Weiter',
    zurueck: 'Zurück',
    fertig: 'Fertig, los geht’s!',
    schritt: (a: number, b: number): string => `Schritt ${a} von ${b}`,
  },

  tastaturtest: {
    titel: 'Kurzer Tastatur-Test',
    // Warum ueberhaupt: Ein Kind, dem die App ohne Erklaerung den Weg
    // versperrt, gibt auf. Der Grund muss in einem Satz dastehen.
    warum:
      'Zehni zeigt dir, wo jede Taste liegt. Dafür muss dein Rechner auf die deutsche Tastatur eingestellt sein. Das prüfen wir einmal kurz, dann kann es losgehen.',
    aufforderung: 'Drücke bitte diese Taste:',
    fortschritt: (fertig: number, gesamt: number): string => `${fertig} von ${gesamt}`,
    altgrHinweis: 'Halte dafür rechts neben der Leertaste die Taste AltGr gedrückt.',

    geschafft: 'Alles richtig. Deine Tastatur ist deutsch eingestellt.',
    weiter: 'Weiter zum Lernweg',
    nochmal: 'Nochmal versuchen',

    // Bei Misserfolg: Das Kind hat nichts falsch gemacht. Das muss der erste
    // Satz sagen, nicht der letzte.
    gescheitertTitel: 'Deine Tastatur ist anders eingestellt',
    gescheitertTrost:
      'Du hast nichts falsch gemacht. Dein Rechner ist auf eine andere Sprache eingestellt, und dann liegen die Buchstaben an anderen Stellen.',
    gescheitertFolge:
      'Ohne die deutsche Einstellung würde Zehni dir falsche Tasten zeigen. Deshalb warten wir kurz, bis das umgestellt ist.',

    verdachtUs:
      'Es sieht nach einer amerikanischen Einstellung aus: Dort sind z und y vertauscht, und ä, ö, ü und ß fehlen ganz.',
    verdachtSchweiz:
      'Es sieht nach einer Schweizer Einstellung aus: Die ist fast gleich, hat aber kein ß.',

    anleitungTitel: 'So stellst du es um',
    anleitung: [
      'Drücke gleichzeitig die Windows-Taste und die Leertaste. Oft ist es damit schon erledigt.',
      'Wenn das nicht hilft: Einstellungen öffnen, dann „Zeit und Sprache", dann „Sprache und Region".',
      'Dort muss bei Deutsch die Tastatur „Deutsch (QWERTZ)" stehen.',
      'Danach hier auf „Nochmal versuchen" tippen.',
    ],
    elternHinweis: 'Wenn du nicht weiterkommst, frag jemanden aus deiner Familie.',

    // Der Weg fuer den Fall, dass die Pruefung irrt oder eine ungewoehnliche
    // Tastatur im Spiel ist. Bewusst unauffaellig, aber vorhanden -- niemand
    // soll in einer Sackgasse sitzen (ARCHITEKTUR.md).
    trotzdemWeiter: 'Trotzdem weitermachen',
    trotzdemWeiterErklaerung:
      'Nur wählen, wenn du sicher bist, dass deine Tastatur stimmt. Die Tastenbilder in Zehni könnten dann nicht passen.',
  },

  einfuehrung: {
    ueberschrift: 'Das übst du gleich',
    neueTasten: 'Neu dabei',
    neueTastenKeine: 'Diesmal kommt keine neue Taste dazu. Du übst alles, was du schon kannst.',
    welcherFinger: 'Diesen Finger nimmst du dafür',
    // Der wichtigste Satz der ganzen App fuer Anfaenger: Ohne Grundstellung
    // wird jede weitere Taste doppelt gelernt (DIDAKTIK.md 3.1).
    grundstellungTitel: 'Zuerst: die Grundstellung',
    grundstellungText:
      'Lege die linke Hand auf a, s, d, f und die rechte auf j, k, l, ö. Die Daumen liegen locker auf der Leertaste.',
    noppenText:
      'Auf den Tasten f und j ist ein kleiner Strich zum Ertasten. Findest du den mit den Zeigefingern, sitzen alle anderen Finger von allein richtig — ganz ohne hinzusehen.',
    umschaltTitel: 'Umschalt immer mit der anderen Hand',
    umschaltText:
      'Ein großer Buchstabe braucht zwei Tasten gleichzeitig. Die Umschalttaste nimmst du immer mit der Hand, die den Buchstaben NICHT tippt. Sonst rutschst du aus der Grundstellung.',
    losGehts: 'Los geht’s',
    zurueck: 'Zurück',
    hinweisWeiter: 'Mit der Eingabetaste geht es auch los.',
  },

  uebung: {
    tippeLos: 'Tippe einfach los.',
    pausiert: 'Pause',
    pausiertErklaerung: 'Die Zeit läuft nicht weiter. Drücke eine Taste, wenn es weitergehen soll.',
    pausieren: 'Mit Esc kannst du jederzeit anhalten.',
    abbrechen: 'Zurück zum Lernweg',
    // Im blockierenden Modus rueckt der Cursor bei einem Fehler nicht weiter.
    // Das muss erklaert werden, sonst wirkt die App kaputt.
    blockiertHinweis: 'Die richtige Taste ist unten hervorgehoben.',
    fortschritt: 'Geschafft',
    naechsterFinger: 'Jetzt dran',
  },

  auswertung: {
    titel: 'Das war deine Runde',
    tempo: 'Tempo',
    tempoEinheit: 'Anschläge pro Minute',
    tempoKurz: 'A/min',
    wpmKurz: 'WPM',
    // Die beiden Kennzahlen. Welche gezeigt wird, haengt an der Lektion.
    sicherheit: 'Sicherheit',
    sicherheitErklaerung: 'So oft hast du die richtige Taste gleich beim ersten Mal getroffen.',
    fehlerquote: 'Fehlerquote',
    fehlerquoteErklaerung: 'So viele Fehler stehen am Ende in deinem Text.',
    sterne: 'Sterne',
    keinStern: 'Diesmal noch nicht geschafft. Probier es gleich nochmal!',
    einStern: 'Geschafft! Die nächste Lektion ist offen.',
    zweiSterne: 'Richtig gut!',
    dreiSterne: 'Perfekt! Drei Sterne!',
    besserAlsVorher: 'Besser als beim letzten Mal.',
    bestleistung: 'Das war deine beste Runde bisher.',
    // Der Geisterschreiber meldet sich sachlich und gewinnt nie lautstark
    // (SPEC.md 8.7).
    geistTitel: 'Gegen deinen Rekord',
    geistSchneller: 'Du warst schneller als dein alter Rekord.',
    geistGleichauf: 'Fast genau dein altes Tempo, das war knapp.',
    geistLangsamer: 'Diesmal war dein alter Rekord etwas schneller.',
    // Vergleich zum letzten Mal (SPEC.md 6.5, Schritt 3).
    vergleichTitel: 'Im Vergleich zum letzten Mal',
    vergleichSchneller: (n: number): string => `${n} Anschläge je Minute schneller`,
    vergleichLangsamer: (n: number): string => `${n} Anschläge je Minute langsamer`,
    vergleichGleich: 'Fast genau gleich schnell',
    erstesMal: 'Das war deine erste Runde in dieser Lektion.',
    // Belohnung, Schritt 4: Fortschrittsbalken und Levelaufstieg.
    levelBalken: (level: number): string => `Level ${level}`,
    bisZumNaechsten: (fehlend: number, level: number): string =>
      `noch ${fehlend} XP bis Level ${level}`,
    hoechstesLevel: 'Höchstes Level erreicht',
    // Muss dastehen: Sonst besteht jemand eine Lektion, es passiert sichtbar
    // nichts, und er haelt es fuer einen Fehler (SPEC.md 6.2).
    nochRunden: (n: number): string =>
      n === 1
        ? 'Noch eine geschaffte Runde, dann geht die nächste Lektion auf.'
        : `Noch ${n} geschaffte Runden, dann geht die nächste Lektion auf.`,

    levelAufstieg: (level: number): string => `Level ${level} erreicht!`,
    weiter: 'Weiter',
    nochmal: 'Nochmal',
    zumLernweg: 'Zum Lernweg',
    wusstestDu: 'Wusstest du?',
  },

  maskottchen: {
    name: 'Zehni',
    /**
     * Höchstens ein Satz je Auswertungsbildschirm (SPEC.md 8.5). Jeder Eintrag
     * hier ist deshalb genau ein Satz — wer einen zweiten anhängt, hebt die
     * Zusage auf.
     */
    sprueche: {
      willkommen: 'Schön, dass du da bist — ich bin Zehni!',
      zurueck: 'Ich habe ein Nickerchen gemacht, schön, dass du wieder da bist!',
      serie: 'Mehrere Tage am Stück, das ist stark!',
      tagesziel: 'Tagesziel geschafft, das reicht für heute völlig.',
      erklaerung: 'Schau kurz nach, welcher Finger dran ist.',
      bestanden: 'Geschafft, es geht weiter!',
      volleSterne: 'Drei Sterne, das war richtig sauber!',
      bestleistung: 'So schnell warst du noch nie!',
      nochmal: 'Beim zweiten Anlauf sitzt es meistens besser.',
      jagd: 'Eine Taste macht dir Ärger, jagen wir sie kurz?',
      zwischenstueck: 'Kurze Pause vom Tippen, jetzt kommt etwas anderes.',
    },
    zustand: {
      idle: 'Zehni sitzt da',
      'freut-sich': 'Zehni freut sich',
      denkt: 'Zehni denkt nach',
      winkt: 'Zehni winkt',
      schlaeft: 'Zehni schläft',
    },
  },

  tagesaufgabe: {
    titel: 'Aufgabe des Tages',
    // Der wichtigste Satz der ganzen Karte: Nicht geschafft heisst gar nichts
    // (SPEC.md 8.6).
    freiwillig: 'Ganz freiwillig. Wenn heute nichts daraus wird, passiert gar nichts.',
    ausblenden: 'Ausblenden',
    geschafft: 'Aufgabe geschafft!',
    stand: (a: number, b: number): string => `${a} von ${b}`,
    belohnung: (n: number): string => `+${n} XP`,
  },

  tastenjagd: {
    titel: 'Tastenjagd',
    angebot: (zeichen: string): string => `Dein „${zeichen}“ macht dir Ärger. Fünf Runden Jagd?`,
    losgehen: 'Auf die Jagd',
    spaeter: 'Lieber nicht',
    // Unbewertet, und das wird auch gesagt (SPEC.md 8.9).
    unbewertet: 'Das hier wird nicht bewertet. Es geht nur ums Üben.',
    runde: (a: number, b: number): string => `Runde ${a} von ${b}`,
    fertig: 'Jagd beendet.',
    zurueck: 'Zurück zum Lernweg',

    // Rueckmeldung am Ende. Beschreibend, nie bewertend: Die Jagd ist
    // unbewertet (SPEC.md 8.9), und fuenf Runden tragen keine Aussage
    // ueber Fortschritt (MODUL-LERNEN.md 1.1).
    bilanzTitel: 'Das war deine Jagd',
    bilanzTreffer: (zeichen: string, n: number): string =>
      `Das „${zeichen}“ hast du ${n} Mal gleich beim ersten Mal getroffen.`,
    bilanzDaneben: (n: number): string =>
      n === 0 ? 'Kein einziges Mal danebengegriffen.' : `${n} Mal ging es daneben.`,
    bilanzAnschlaege: (n: number): string => `${n} Anschläge insgesamt.`,
    bilanzNichts: (zeichen: string): string =>
      `Diesmal kam das „${zeichen}“ nicht mehr vor. Auch gut — geübt hast du trotzdem.`,
    bilanzXp: (n: number): string => `+${n} XP fürs Üben.`,
    bilanzUnbewertet: 'Hier gibt es keine Sterne und keine Note. Das war nur Übung.',
  },

  aufwaermen: {
    titel: 'Aufwärmen',
    erklaerung: 'Zwanzig Sekunden locker eintippen. Das hier zählt nicht.',
    ueberspringen: 'Überspringen',
    weiter: 'Los geht die Übung',
    fertig: 'Aufgewärmt!',
    verbleibend: (s: number): string => `noch ${s} s`,
  },

  lernstube: {
    titel: 'Deine Lernstube',
    oeffnen: 'Lernstube',
    zurueck: 'Zurück',
    // Das Wochenziel ist am 2026-09-18 gestrichen worden (SPEC.md 8.8). Der
    // Satz stand danach noch da und versprach etwas, das es nicht mehr gibt.
    erklaerung: 'Für jedes Level kommt etwas dazu.',
    stand: (a: number, b: number): string => `${a} von ${b} Sachen`,
    voll: 'Deine Lernstube ist vollständig eingerichtet.',
  },

  update: {
    // Dezenter Hinweis unten rechts, nie ein Zwangsdialog (SPEC.md 11.1).
    bereit: 'Ein Update ist bereit',
    version: (v: string): string => `Version ${v}`,
    jetzt: 'Jetzt neu starten',
    spaeter: 'Später',
    spaeterErklaerung: 'Beim nächsten Start frage ich noch einmal.',
    laedt: 'Wird geladen …',
    schliessen: 'Hinweis schließen',

    // In den Einstellungen, damit man nicht darauf warten muss, dass sich von
    // allein etwas meldet.
    titel: 'Version und Updates',
    deineVersion: (v: string): string => `Du hast Version ${v}.`,
    versionUnbekannt: 'Version unbekannt.',
    pruefen: 'Jetzt nach Updates suchen',
    pruefeGerade: 'Ich schaue nach …',
    aktuell: 'Alles aktuell. Es gibt nichts Neueres.',
    gefunden: (v: string): string => `Version ${v} ist da.`,
    nichtErreichbar:
      'Ich konnte nicht nachsehen. Vielleicht ist gerade kein Internet da — Zehni funktioniert auch ohne.',
    nochNichtGeprueft: 'Noch nicht nachgesehen.',
    automatisch: 'Zehni sieht beim Start von allein nach.',
  },

  navigation: {
    // Von jedem Nebenbildschirm aus sichtbar. Ein Kind soll nie suchen muessen,
    // wie es zurueckkommt.
    hauptmenue: 'Lernweg',
    hauptmenueTitel: 'Zurück zum Lernweg',
    hier: 'Du bist hier',
    neuesUpdate: 'Update bereit',
  },

  vollbild: {
    an: 'Vollbild',
    anTitel: 'Zehni über den ganzen Bildschirm zeigen — oder Taste F11',
    aus: 'Vollbild beenden',
    ausTitel: 'Zurück ins Fenster — oder Taste F11',
    // Steht im Vollbild dort, wo sonst die Kopfzeile waere: waehrend einer
    // Uebung gibt es keine Kopfzeile, und ohne diesen Knopf gaebe es dann
    // keinen sichtbaren Weg hinaus.
    verlassen: 'Vollbild verlassen',
  },

  minispiele: {
    titel: 'Spiele',
    oeffnen: 'Spiele',
    untertitel: 'Nur zum Spaß. Hier wird nichts bewertet.',
    zurueck: 'Zurück',
    spielen: 'Spielen',
    nochmal: 'Nochmal',
    beenden: 'Zurück zu den Spielen',
    // Die Deckelung aus SPEC.md 8.1 wird genannt, nicht versteckt.
    xpHinweis: 'Für die ersten drei Runden am Tag gibt es XP. Danach spielst du einfach weiter.',
    verbleibend: (s: number): string => `noch ${s} s`,

    buchstabenregen: {
      titel: 'Buchstabenregen',
      beschreibung: 'Buchstaben fallen von oben. Drück die richtige Taste, dann sind sie weg.',
      gefangen: (n: number): string => (n === 1 ? '1 gefangen' : `${n} gefangen`),
      ergebnis: (n: number): string =>
        n === 1 ? 'Du hast 1 Buchstaben gefangen.' : `Du hast ${n} Buchstaben gefangen.`,

      // Keine Uhr mehr: Die Runde endet an den Fehlversuchen (SPEC.md 8.10).
      leben: (n: number): string => (n === 1 ? 'Noch 1 Versuch' : `Noch ${n} Versuche`),
      verloren: 'Drei sind durchgerutscht. Runde vorbei.',
      nochmal: 'Nochmal',

      // Auswahl des Zeichenvorrats. Die Knöpfe zeigen die Tasten selbst — „f j"
      // braucht keine Erklärung, „L02" schon. Mehrfachauswahl ist möglich.
      gruppeFrage: 'Welche Tasten sollen fallen?',
      gruppeAlles: 'Alles, was du kannst',
      losgehen: 'Los geht es',
      andereTasten: 'Andere Tasten',
      danebem: 'Daneben!',

      // Die Regeln stehen auf dem Startbild, bevor sie wirken. Eine Regel, die
      // man erst durch ihre Folgen kennenlernt, ist eine Falle.
      regelLeben: 'Drei Buchstaben dürfen unten ankommen. Beim vierten ist die Runde vorbei.',
      regelSperre: 'Triffst du daneben, ist die Tastatur eine Sekunde lang gesperrt.',
      regelTempo: 'Je mehr du fängst, desto schneller fallen sie.',
    },

    elfmeter: {
      titel: 'Elfmeterschießen',
      beschreibung: 'Tipp das Wort in der Ecke, die du treffen willst. Dann lad den Schuss auf.',
      schuss: (a: number, b: number): string => `Schuss ${a} von ${b}`,
      tore: (n: number): string => (n === 1 ? '1 Tor' : `${n} Tore`),

      stufeFrage: 'Wie schwer?',
      stufen: {
        leicht: 'Leicht',
        mittel: 'Mittel',
        schwer: 'Schwer',
      } as Record<string, string>,

      tastenFrage: 'Welche Tasten beim Aufladen?',
      zielen: 'Such dir eine Ecke aus und tipp das Wort.',
      laden: 'Jetzt schnell! Jedes Zeichen macht den Schuss härter.',
      kraft: (n: number): string => `Schusskraft ${n} Prozent`,
      zeit: (s: number): string => `noch ${s} s`,

      tor: 'Tor!',
      gehalten: 'Gehalten. Der Torwart hat die Ecke erraten.',
      naechster: 'Nächster Schuss',
      weiter: 'Oder die Eingabetaste drücken.',

      ergebnis: (tore: number, schuesse: number): string =>
        `${tore} von ${schuesse} Schüssen waren drin.`,
      nochmal: 'Nochmal',
    },

    pferderennen: {
      titel: 'Pferderennen',
      beschreibung: 'Tippen treibt dein Pferd an. Vor jeder Hürde: Leertaste!',
      strecke: (n: number): string => `${n} Prozent der Strecke`,

      stufeFrage: 'Wie schnell?',
      stufen: {
        gemuetlich: 'Gemütlich',
        flott: 'Flott',
        rasant: 'Rasant',
      } as Record<string, string>,

      tastenFrage: 'Welche Tasten auf der Strecke?',
      losgehen: 'Tipp das erste Zeichen, dann geht es los.',
      laufen: 'Immer weiter!',
      springen: 'Hürde! Leertaste!',
      gestolpert: 'Gestolpert. Gleich geht es weiter.',

      gewonnen: 'Gewonnen!',
      verloren: 'Das andere Pferd war schneller.',
      huerdenBilanz: (geschafft: number, gesamt: number): string =>
        gesamt === 0
          ? 'Keine Hürden auf dieser Strecke.'
          : `${geschafft} von ${gesamt} Hürden übersprungen.`,
      nochmal: 'Nochmal',
    },

    wortsalat: {
      titel: 'Wortsalat',
      beschreibung: 'Die Buchstaben sind durcheinander. Tipp das Wort richtig.',
      gefunden: (n: number): string => (n === 1 ? '1 Wort' : `${n} Wörter`),
      ergebnis: (n: number): string =>
        n === 1 ? 'Du hast 1 Wort entwirrt.' : `Du hast ${n} Wörter entwirrt.`,
      ueberspringen: 'Nächstes Wort',
      // Ehrliche Antwort statt ausgegrauter Schaltflaeche (ARCHITEKTUR.md).
      nochNicht: (lektion: string): string =>
        `Dafür kennst du noch nicht genug Buchstaben. Ab Lektion ${lektion} geht es los.`,
      nochNichtOhneLektion: 'Dafür kennst du noch nicht genug Buchstaben.',
    },
  },

  modulbereich: {
    titel: 'Module',
    oeffnen: 'Module',
    untertitel: 'Alles sofort spielbar, in jeder Reihenfolge, so viel du willst.',
    zurueck: 'Zurück',
    stand: (a: number, b: number): string => `${a} von ${b} gemacht`,
    imLernpfad: 'Kommt im Lernweg',
    imLernpfadNach: (lektion: string): string => `Kommt im Lernweg nach ${lektion}`,
    erledigt: 'Gemacht',
    starten: 'Ansehen',
    nochmal: 'Nochmal ansehen',
    // Hinweis, keine Schranke: Wer will, macht alles sofort.
    imLernpfadHinweis: 'Kommt im Lernweg noch einmal vor.',
  },

  einheit: {
    weiter: 'Weiter',
    zurAufgabe: 'Zur Aufgabe',
    pruefen: 'Prüfen',
    nochmal: 'Nochmal versuchen',
    fertig: 'Fertig',
    abbrechen: 'Zurück zu den Modulen',
    richtig: 'Richtig.',
    fastRichtig: (treffer: number, gesamt: number): string =>
      `${treffer} von ${gesamt} liegen richtig.`,
    aufloesung: 'Auflösung',
    // Es gibt hier keine Noten. Wer danebenliegt, sieht die Auflösung und
    // geht weiter (SPEC.md 10, MODUL-LERNEN.md 5).
    keineNote: 'Hier gibt es keine Punkte. Es geht ums Verstehen, nicht ums Treffen.',
    einsortieren: 'Klick eine Karte an und dann das Fach.',
    keinFach: 'Noch nicht einsortiert',
    zurueckInsFach: 'Zurücklegen',
    deineAntwort: 'Deine Antwort',
    beispiel: 'So könnte es aussehen',
    jetztDruecken: 'Drücke jetzt:',
    geschafft: 'Sitzt!',
    nochOffen: (n: number): string => (n === 1 ? 'Noch 1 Kürzel' : `Noch ${n} Kürzel`),
    waageJahr: 'In einem Jahr',
    waageSchieben: 'Schieb den Zeiger',
    textVorher: 'So steht es da',
    textNachher: 'So soll es aussehen',
    textNochFehler: (n: number): string =>
      n === 1 ? 'Eine Stelle stimmt noch nicht.' : `${n} Stellen stimmen noch nicht.`,
    textAndererInhalt: 'Es sollen dieselben Wörter dastehen, nur richtig gesetzt.',
    loesungZeigen: 'Lösung zeigen',
  },

  einstellungen: {
    titel: 'Einstellungen',
    oeffnen: 'Einstellungen',
    zurueck: 'Zurück',
    gespeichert: 'Gespeichert.',

    name: 'Dein Name',
    nameErklaerung: 'Darf auch leer bleiben.',

    alter: 'Deine Altersstufe',
    alterErklaerung: 'Sie steuert nur, wie lang und wie schwer die Übungstexte sind.',

    tagesziel: 'Tagesziel',
    tageszielErklaerung: 'Kurz und oft bringt mehr als lang und selten.',

    themen: 'Deine Themen',
    themenErklaerung: 'Ein bis drei Stück. Darüber handeln deine Übungstexte.',

    darstellung: 'Darstellung',
    themaHell: 'Hell',
    themaDunkel: 'Dunkel',
    themaKontrast: 'Hoher Kontrast',

    schriftgroesse: 'Schriftgröße',
    schriftErklaerung:
      'Größer macht alles größer, nicht nur die Buchstaben — auch die Tastatur und die Abstände.',
    schriftNormal: 'Normal',
    schriftGross: 'Größer',
    schriftSehrGross: 'Am größten',

    geist: 'Geisterschreiber',
    geistErklaerung:
      'Ein blasser zweiter Cursor läuft im Tempo deiner besten Runde mit. Im Abschlusstest ist er immer aus.',

    tastaturPruefen: 'Tastatur neu prüfen',
    tastaturPruefenErklaerung: 'Nur nötig, wenn du die Tastatur gewechselt hast.',
  },

  serie: {
    titel: 'Deine Serie',
    laufend: (tage: number): string => (tage === 1 ? '1 Tag in Folge' : `${tage} Tage in Folge`),
    // Nach Verlust der Serie: freundliche Einordnung, keine Dramatisierung
    // (SPEC.md 8.3).
    verloren: (laengste: number): string =>
      `Deine längste Serie: ${laengste} Tage. Auf zur nächsten!`,
    jokerUebrig: (n: number): string =>
      n === 1 ? 'Noch 1 Joker diesen Monat' : `Noch ${n} Joker diesen Monat`,
    jokerErklaerung: 'Ein Joker gleicht einen Tag aus, an dem du keine Zeit hattest.',
  },

  blindmodus: {
    titel: 'Blindmodus',
    an: 'Blindmodus an',
    aus: 'Blindmodus aus',
    erklaerung: 'Tastatur und Hände werden ausgeblendet. Dafür gibt es 20 % mehr XP.',
    hinweis: 'Blindmodus: Verlass dich auf deine Finger.',
    einblenden: 'Doch wieder einblenden',
  },

  tastatur: {
    titel: 'Tastatur',
    // Der haeufigste Anfaengerfehler: beide Tasten mit einer Hand greifen
    // (DIDAKTIK.md 2.3).
    umschaltHinweis: 'Umschalt mit der anderen Hand!',
    finger: {
      leftPinky: 'Linker kleiner Finger',
      leftRing: 'Linker Ringfinger',
      leftMiddle: 'Linker Mittelfinger',
      leftIndex: 'Linker Zeigefinger',
      thumb: 'Daumen',
      rightIndex: 'Rechter Zeigefinger',
      rightMiddle: 'Rechter Mittelfinger',
      rightRing: 'Rechter Ringfinger',
      rightPinky: 'Rechter kleiner Finger',
    },
    leertaste: 'Leertaste',
    umschalt: 'Umschalt',
    eingabe: 'Eingabe',
    rueck: 'Rücktaste',
  },

  fehler: {
    datenbank: 'Deine Fortschritte konnten nicht gespeichert werden.',
    datenbankErklaerung:
      'Du kannst weiterüben, aber diese Runde wird vielleicht nicht gemerkt. Starte Zehni später noch einmal neu.',
    unbekannt: 'Da ist etwas schiefgegangen.',
    erneutVersuchen: 'Nochmal versuchen',
  },

  laden: 'Einen Moment …',
} as const;

export type Texte = typeof de;
