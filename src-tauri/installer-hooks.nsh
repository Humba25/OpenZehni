; Zehni, Haken fuer den NSIS-Installer (SPEC.md 11.2).
;
; Zweck: Beim Deinstallieren wird gefragt, ob der Lernfortschritt erhalten
; bleiben soll. Tauri kennt dafuer nur den Schalter `deleteAppDataOnUninstall`,
; der ohne Nachfrage loescht oder ohne Nachfrage stehen laesst -- die Spec
; verlangt aber eine Frage.
;
; Der Fortschritt liegt in $APPDATA\de.zehni.app (Tauri legt den Ordner nach
; der Kennung aus tauri.conf.json an, nicht nach dem Produktnamen).
;
; WICHTIG: Die Vorgabe ist Behalten. Wer versehentlich deinstalliert und neu
; installiert, findet seine Lektionen wieder. Ein Klick darf keine Monate
; Uebung kosten.

!macro NSIS_HOOK_POSTUNINSTALL
  ; Bei einer stillen Deinstallation wird nichts gefragt und nichts geloescht.
  ; Still laeuft sie unter anderem waehrend eines Updates -- dabei die Daten zu
  ; entfernen waere ein Datenverlust ohne jede Nachfrage.
  IfSilent zehni_daten_behalten

  IfFileExists "$APPDATA\de.zehni.app\*.*" 0 zehni_daten_behalten

  MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 \
    "Soll dein Lernfortschritt auf dem Rechner bleiben?$\r$\n$\r$\nJa: Lektionen, Abzeichen und Einstellungen bleiben erhalten. Wenn du Zehni spaeter wieder installierst, ist alles wieder da.$\r$\n$\r$\nNein: Alles wird geloescht. Das laesst sich nicht rueckgaengig machen." \
    IDYES zehni_daten_behalten IDNO zehni_daten_loeschen

  zehni_daten_loeschen:
    RMDir /r "$APPDATA\de.zehni.app"
    Goto zehni_fertig

  zehni_daten_behalten:
  zehni_fertig:
!macroend
