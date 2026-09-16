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

use tauri_plugin_sql::{Migration, MigrationKind};

/// Name der Datenbankdatei. Landet in `%APPDATA%\Zehni\` (SPEC.md 5).
const DB_URL: &str = "sqlite:zehni.db";

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
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DB_URL, migrations())
                .build(),
        )
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
