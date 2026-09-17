//! Repariert die Migrations-Prüfsummen aus Version 0.1.2.
//!
//! # Was passiert ist
//!
//! Am 2026-09-16 hat ein Skript, das projektweit einen Dateinamen in
//! Kommentaren austauschte, auch die Kommentare der Migrationen 1 bis 5
//! angefasst. Am SQL änderte sich **kein Zeichen** — an der Prüfsumme schon.
//!
//! `sqlx` merkt sich zu jeder angewandten Migration eine Prüfsumme in
//! `_sqlx_migrations`. Weicht der Text später ab, verweigert der Migrator
//! **den gesamten Satz**: keine neue Migration läuft, `Database.load`
//! scheitert, die App kann nichts mehr speichern.
//!
//! Diese Fassung ging als 0.1.2 heraus. Wer damit eine Datenbank anlegte, hat
//! die *geänderten* Prüfsummen gespeichert. Ab 0.1.3 liegen die Dateien wieder
//! im ursprünglichen Wortlaut — für genau diese Datenbanken passt seither
//! nichts mehr zusammen.
//!
//! # Warum das Umschreiben hier vertretbar ist
//!
//! Die beiden Fassungen unterscheiden sich in **je einer Kommentarzeile**. Das
//! ausgeführte SQL ist byteweise identisch, das Schema in der Datenbank also
//! ebenfalls. Die gespeicherte Prüfsumme beschreibt somit denselben Zustand;
//! sie ist nur gegen den falschen Text gebildet.
//!
//! Der Eingriff ist deshalb so eng wie möglich gefasst:
//!
//! - Er betrifft **nur** die Versionen 1 bis 5.
//! - Er ersetzt **nur** einen von fünf namentlich bekannten Werten.
//! - Er schreibt **nur** einen von fünf namentlich bekannten Werten hinein.
//! - Steht dort etwas anderes, bleibt die Zeile unberührt.
//!
//! Beide Werte stehen hier fest im Code und werden nicht zur Laufzeit
//! berechnet. Eine Reparatur, die sich ihr Ziel selbst ausrechnet, würde jeden
//! künftigen Prüfsummenfehler stillschweigend übertünchen — und damit genau die
//! Warnung abschalten, deretwegen es diesen Mechanismus gibt.
//!
//! # Wann das hier verschwinden darf
//!
//! Sobald niemand mehr eine Datenbank aus 0.1.2 benutzt. Bis dahin kostet es
//! einen Datenbankzugriff beim Start und rettet den Lernfortschritt.

use sqlx::sqlite::SqlitePoolOptions;
use sqlx::Row;
use std::path::Path;

/// Version, falsche Prüfsumme (0.1.2), richtige Prüfsumme (ab 0.1.3).
///
/// Erzeugt aus den Dateien selbst: SHA-384, wie `sqlx` sie bildet.
const REPARATUREN: &[(i64, &str, &str)] = &[
    (
        1,
        "90f8f2ad31f951b7833205acf65e0d8808e25f4a376dedba047e385c6e16069f0da7a9fd8ea90e71230f613ef913ad5c",
        "4b33078de35cf1b9bd0eea04e37237b500f51180112ab844e66a7d0b2be0ea454206830d45a0c40af94c79492f107cbd",
    ),
    (
        2,
        "814aa2384ebdb36f09f51989324c4a7f6ee2a7ab660ce77f693a0930087fe7d26995104a2c1b30d4c21107ccb32d2b96",
        "a0b984253ae00edc2caf131b47c5b5c98b6e53b30d8df60bb30b539237f7e6a5c76e19371b681a83a9beef2bba2f8334",
    ),
    (
        3,
        "568d9ca77d4e1ce650308a10b442c539332ff716ac0a3ad2c6aec4b7d7ea28db2451c6cb714c6c8086ac81c72490a700",
        "fc23bba5b779e27baeecf727bc39ff91b7a20b949d238fc33b8c0011a118645cb0108cdf8b58582f9ccac15943a1beeb",
    ),
    (
        4,
        "85fe9502b8ca58a7784f6fcd94893be765f8d4a2395c568239d8429e6d9c4b7598bcb03a2df213ee3d72a606096f8904",
        "7d343c25cbd767ee1c9dc9e0c823003f539b0165d8940b66ac229a11a61e699426ff02a415ad663bf773f23b85f79beb",
    ),
    (
        5,
        "dbe678e0e729f6ff5098bbe9839f132294d57fafeceb7367af56be7455dfae423d9afb3ad5cce8b72e80ee0212e9793a",
        "2122bfa8b79b7b8c90f4f5c3997669b886297e74b259fb3c4ad46db6b4359ef06406c2ed38e8fc83b80e25a1f21c760e",
    ),
];

fn hex(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        use std::fmt::Write;
        let _ = write!(s, "{b:02x}");
    }
    s
}

fn aus_hex(s: &str) -> Vec<u8> {
    (0..s.len())
        .step_by(2)
        .filter_map(|i| u8::from_str_radix(&s[i..i + 2], 16).ok())
        .collect()
}

/// Setzt die Prüfsummen gerade. Gibt zurück, wie viele Zeilen geändert wurden.
///
/// Scheitert der Zugriff, ist das **kein** Grund, den Start abzubrechen: Eine
/// frische Installation hat die Datei noch gar nicht, und eine Datenbank ohne
/// den Fehler braucht nichts. Der Aufrufer protokolliert und macht weiter.
pub async fn geradeziehen(datei: &Path) -> Result<u64, sqlx::Error> {
    if !datei.exists() {
        return Ok(0);
    }

    // Kein `create_if_missing`: Diese Funktion legt nie eine Datenbank an. Was
    // es nicht gibt, ist auch nicht kaputt.
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&format!("sqlite:{}", datei.display()))
        .await?;

    // Ohne die Tabelle ist noch nie eine Migration gelaufen.
    let tabelle: Option<String> = sqlx::query_scalar(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='_sqlx_migrations'",
    )
    .fetch_optional(&pool)
    .await?;
    if tabelle.is_none() {
        pool.close().await;
        return Ok(0);
    }

    let mut geaendert = 0u64;
    for (version, falsch, richtig) in REPARATUREN {
        let zeile = sqlx::query("SELECT checksum FROM _sqlx_migrations WHERE version = ?")
            .bind(version)
            .fetch_optional(&pool)
            .await?;

        let Some(zeile) = zeile else { continue };
        let vorhanden: Vec<u8> = zeile.try_get("checksum")?;

        // Genau dieser eine falsche Wert wird ersetzt und nichts sonst.
        if hex(&vorhanden) != *falsch {
            continue;
        }

        let ergebnis = sqlx::query("UPDATE _sqlx_migrations SET checksum = ? WHERE version = ?")
            .bind(aus_hex(richtig))
            .bind(version)
            .execute(&pool)
            .await?;
        geaendert += ergebnis.rows_affected();
    }

    pool.close().await;
    Ok(geaendert)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hex_und_zurueck_sind_umkehrbar() {
        for (_, falsch, richtig) in REPARATUREN {
            assert_eq!(hex(&aus_hex(falsch)), *falsch);
            assert_eq!(hex(&aus_hex(richtig)), *richtig);
        }
    }

    /// Eine Prüfsumme ist 48 Byte lang (SHA-384), also 96 Hex-Zeichen. Ein
    /// Tippfehler in der Tabelle oben fällt hier auf, nicht beim Anwender.
    #[test]
    fn alle_pruefsummen_haben_die_richtige_laenge() {
        for (version, falsch, richtig) in REPARATUREN {
            assert_eq!(falsch.len(), 96, "Version {version}, falscher Wert");
            assert_eq!(richtig.len(), 96, "Version {version}, richtiger Wert");
            assert_eq!(
                aus_hex(falsch).len(),
                48,
                "Version {version} nicht hexadezimal"
            );
            assert_eq!(
                aus_hex(richtig).len(),
                48,
                "Version {version} nicht hexadezimal"
            );
        }
    }

    /// Falsch und richtig dürfen nie gleich sein -- sonst wäre die Zeile ein
    /// stiller Platzhalter, der nichts repariert.
    #[test]
    fn falsch_und_richtig_sind_verschieden() {
        for (version, falsch, richtig) in REPARATUREN {
            assert_ne!(falsch, richtig, "Version {version}");
        }
    }

    /// Genau die fünf Migrationen aus 0.1.2, keine weitere.
    #[test]
    fn betrifft_nur_die_versionen_eins_bis_fuenf() {
        let versionen: Vec<i64> = REPARATUREN.iter().map(|(v, _, _)| *v).collect();
        assert_eq!(versionen, vec![1, 2, 3, 4, 5]);
    }

    /// Legt eine Datenbank an, wie 0.1.2 sie hinterlassen hat.
    async fn datenbank_wie_012(datei: &Path, zusatz: Option<(i64, &str)>) {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect(&format!("sqlite:{}?mode=rwc", datei.display()))
            .await
            .expect("Testdatenbank");
        sqlx::query(
            "CREATE TABLE _sqlx_migrations (version BIGINT PRIMARY KEY, checksum BLOB NOT NULL)",
        )
        .execute(&pool)
        .await
        .expect("Tabelle");

        for (version, falsch, _) in REPARATUREN {
            sqlx::query("INSERT INTO _sqlx_migrations (version, checksum) VALUES (?, ?)")
                .bind(version)
                .bind(aus_hex(falsch))
                .execute(&pool)
                .await
                .expect("Zeile");
        }
        if let Some((version, wert)) = zusatz {
            sqlx::query("INSERT INTO _sqlx_migrations (version, checksum) VALUES (?, ?)")
                .bind(version)
                .bind(aus_hex(wert))
                .execute(&pool)
                .await
                .expect("Zusatzzeile");
        }
        pool.close().await;
    }

    async fn pruefsumme(datei: &Path, version: i64) -> String {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect(&format!("sqlite:{}", datei.display()))
            .await
            .expect("lesen");
        let zeile = sqlx::query("SELECT checksum FROM _sqlx_migrations WHERE version = ?")
            .bind(version)
            .fetch_one(&pool)
            .await
            .expect("Zeile");
        let bytes: Vec<u8> = zeile.try_get("checksum").expect("checksum");
        pool.close().await;
        hex(&bytes)
    }

    /// Der eigentliche Beweis: eine Datenbank aus 0.1.2 wird wieder brauchbar.
    #[test]
    fn zieht_eine_datenbank_aus_012_gerade() {
        let ordner = std::env::temp_dir().join("zehni-pruefsummen-test-1");
        let _ = std::fs::remove_dir_all(&ordner);
        std::fs::create_dir_all(&ordner).expect("Ordner");
        let datei = ordner.join("zehni.db");

        tauri::async_runtime::block_on(async {
            datenbank_wie_012(&datei, None).await;
            let geaendert = geradeziehen(&datei).await.expect("Reparatur");
            assert_eq!(geaendert, 5, "alle fuenf Zeilen muessen geaendert werden");

            for (version, _, richtig) in REPARATUREN {
                assert_eq!(
                    &pruefsumme(&datei, *version).await,
                    richtig,
                    "Version {version}"
                );
            }

            // Zweiter Lauf darf nichts mehr tun -- sonst waere die Reparatur
            // keine einmalige, sondern ein dauerhaftes Uebertuenchen.
            let nochmal = geradeziehen(&datei).await.expect("zweiter Lauf");
            assert_eq!(nochmal, 0, "die Reparatur wirkt genau einmal");
        });

        let _ = std::fs::remove_dir_all(&ordner);
    }

    /// Eine unbekannte Abweichung bleibt stehen. Genau dafür gibt es die
    /// Prüfsummen: Sie sollen anschlagen, nicht bereinigt werden.
    #[test]
    fn laesst_eine_fremde_pruefsumme_in_ruhe() {
        let ordner = std::env::temp_dir().join("zehni-pruefsummen-test-2");
        let _ = std::fs::remove_dir_all(&ordner);
        std::fs::create_dir_all(&ordner).expect("Ordner");
        let datei = ordner.join("zehni.db");
        let fremd = "ff".repeat(48);

        tauri::async_runtime::block_on(async {
            datenbank_wie_012(&datei, Some((6, &fremd))).await;
            geradeziehen(&datei).await.expect("Reparatur");
            assert_eq!(
                pruefsumme(&datei, 6).await,
                fremd,
                "Version 6 wurde angefasst"
            );
        });

        let _ = std::fs::remove_dir_all(&ordner);
    }

    /// Ohne Datei passiert nichts. Eine frische Installation ist der Normalfall.
    #[test]
    fn tut_ohne_datenbank_nichts() {
        let datei = std::env::temp_dir()
            .join("zehni-gibt-es-nicht")
            .join("zehni.db");
        let ergebnis = tauri::async_runtime::block_on(geradeziehen(&datei));
        assert_eq!(ergebnis.expect("kein Fehler"), 0);
    }
}
