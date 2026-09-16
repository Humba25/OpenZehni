// Ohne dieses Attribut oeffnet Windows im Release-Build zusaetzlich ein
// Konsolenfenster hinter der App. Im Debug-Build ist die Konsole erwuenscht.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    zehni_lib::run()
}
