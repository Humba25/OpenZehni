//! Zehni, Rust-Seite.
//!
//! Hier läuft alles, was nicht in die WebView gehört: Datenbank, später der
//! KI-Client und der Updater. **Netzwerk und Schlüssel ausschließlich hier**
//! (ARCHITEKTUR.md, Architekturregel 2) — im JS-Bundle darf nie ein API-Schlüssel
//! landen.
//!
//! In M1 ist das noch schmal: Die App öffnet ein Fenster, richtet die
//! SQLite-Datenbank ein und führt die Migrationen aus. Die gesamte Lernlogik
//! liegt in `src/lib/` auf der TypeScript-Seite und ist dort unit-getestet.

mod pruefsummen;

use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

/// Wie viele Kinder eine Installation trennen kann (SPEC.md 5.1).
pub const PLAETZE: u8 = 4;

/// Name der Datenbankdatei eines Platzes. Landet in `%APPDATA%\Zehni\` (SPEC.md 5).
///
/// **Platz 1 behält den alten Namen.** Dort liegt der Lernfortschritt aller
/// Installationen vor 0.2.0; ein neuer Name hieße, dass beim Update alles weg
/// zu sein scheint.
fn db_url(platz: u8) -> String {
    if platz <= 1 {
        "sqlite:zehni.db".to_string()
    } else {
        format!("sqlite:zehni-{platz}.db")
    }
}

/// Alle Migrationen in ihrer Reihenfolge.
///
/// **Eine einmal ausgelieferte Migration wird nie verändert** (ARCHITEKTUR.md,
/// Architekturregel 3). Änderungen am Schema bekommen eine neue Nummer und
/// werden hier angehängt.
fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "Grundschema nach SPEC.md 5",
            sql: include_str!("../migrations/0001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "Ergebnis der Tastaturpruefung nach SPEC.md 7.4",
            sql: include_str!("../migrations/0002_layout_check.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "Onboarding, Module und Tagesaktivitaet nach SPEC.md 6.6 und 8",
            sql: include_str!("../migrations/0003_onboarding_und_xp.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "Blindmodus, Geisterschreiber und Wochenziel nach SPEC.md 8.6 bis 8.9",
            sql: include_str!("../migrations/0004_motivation.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "Gespielte Minispiele je Tag nach SPEC.md 8.10",
            sql: include_str!("../migrations/0005_minispiele.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "Schriftgroesse nach SPEC.md 12.2",
            sql: include_str!("../migrations/0006_schriftgroesse.sql"),
            kind: MigrationKind::Up,
        },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Muss **vor** dem Migrator laufen. Der Migrator prueft beim Laden
            // der Datenbank alle Pruefsummen auf einmal und verweigert bei der
            // ersten Abweichung den ganzen Satz -- danach waere es zu spaet.
            //
            // Scheitert die Reparatur, wird das protokolliert und weitergemacht:
            // Eine frische Installation hat noch keine Datei, und eine gesunde
            // Datenbank braucht nichts. Ein Abbruch hier wuerde aus einem
            // Sonderfall einen Startfehler machen.
            let pfad = app.path().app_config_dir()?.join("zehni.db");
            match tauri::async_runtime::block_on(pruefsummen::geradeziehen(&pfad)) {
                Ok(0) => {}
                Ok(n) => eprintln!("Zehni: {n} Migrations-Pruefsummen aus 0.1.2 geradegezogen."),
                Err(e) => eprintln!("Zehni: Pruefsummen nicht pruefbar ({e}). Start geht weiter."),
            }
            Ok(())
        })
        .plugin({
            // Jeder Platz bekommt denselben Migrationssatz. Angelegt wird eine
            // Datei erst, wenn die Oberflaeche sie zum ersten Mal oeffnet --
            // hier wird nur hinterlegt, was dann zu tun ist. Deshalb kostet ein
            // leerer Platz nichts (Startbudget, SPEC.md 12.1).
            let mut b = tauri_plugin_sql::Builder::default();
            for platz in 1..=PLAETZE {
                b = b.add_migrations(&db_url(platz), migrations());
            }
            b.build()
        })
        // Auto-Update nach SPEC.md 11.1. Der Updater ist immer registriert;
        // ob er etwas findet, haengt an der Konfiguration in
        // `tauri.release.conf.json`. Ohne Konfiguration meldet er einen Fehler,
        // den die Oberflaeche still wegloggt -- die App muss ohne Internet
        // identisch funktionieren.
        .plugin(tauri_plugin_updater::Builder::new().build())
        // Wird gebraucht, um nach einem Update neu zu starten. Mehr nicht:
        // Die Berechtigung dafuer ist in `capabilities/default.json` auf
        // `process:allow-restart` beschraenkt.
        .plugin(tauri_plugin_process::init())
        .run(tauri::generate_context!())
        .expect("Zehni konnte nicht gestartet werden");
}
